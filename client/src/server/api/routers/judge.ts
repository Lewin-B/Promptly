import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import tar from "tar-stream";
import type { SandpackFiles } from "@codesandbox/sandpack-react";
import { fetch } from "undici";
import { env } from "~/env";

const sandpackFileSchema = z.record(
  z.union([
    z.string(),
    z.object({
      code: z.string(),
      hidden: z.boolean().optional(),
      active: z.boolean().optional(),
    }),
  ]),
);

export interface DeployResponse {
  container_name: string;
  container_id: string;
  image_name: string;
  image_id: string;
}

const REACT_DOCKER_FILE = `FROM node:18-bullseye

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build the React app
RUN npm run build

# Install a lightweight static file server
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
`;

export const judgeRouter = createTRPCRouter({
  submit: publicProcedure
    .input(
      z.object({
        problemId: z.number(),
        files: sandpackFileSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const normalizedFiles = normalizeSandpackFiles(input.files);
      ensurePackageJsonMetadata(normalizedFiles);
      for (const [path, content] of Object.entries(normalizedFiles)) {
        console.log(`Sandpack file: ${path}\n${content}`);
      }
      const tarArchive = await buildTarFromFiles(normalizedFiles);
      const tarArchiveBase64 = tarArchive.toString("base64url");

      const response = await fetch(`${env.AGENT_SERVER_URL}/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          docker_file: REACT_DOCKER_FILE,
          base64TarFile: tarArchiveBase64,
        }),
      });

      if (!response.ok) {
        throw new Error(`Judge invoke failed: ${response.status}`);
      }

      const deployResponse = (await response.json()) as DeployResponse;
      console.log("Deploy Response: ", deployResponse);

      return {
        receivedFiles: Object.keys(input.files).length,
        problemId: input.problemId,
      };
    }),
});

function normalizeSandpackFiles(
  sandpackFiles: SandpackFiles,
): Record<string, string> {
  const newMap: Record<string, string> = {};
  for (const [key, value] of Object.entries(sandpackFiles)) {
    if (key == "/package.json" || key.startsWith("/public")) {
      const newKey = key.substring(1);
      if (typeof value != "string") newMap[newKey] = value.code;
      else newMap[newKey] = value;
    } else {
      const newKey = "src" + key;
      if (typeof value != "string") newMap[newKey] = value.code;
      else newMap[newKey] = value;
    }
  }
  return newMap;
}

async function buildTarFromFiles(
  files: Record<string, string>,
): Promise<Buffer> {
  const pack = tar.pack();
  const chunks: Buffer[] = [];

  pack.on("data", (chunk: Buffer) => chunks.push(chunk));
  pack.on("error", (err) => {
    throw err;
  });

  for (const [path, content] of Object.entries(files)) {
    pack.entry(
      {
        name: path,
        size: Buffer.byteLength(content),
        mode: 0o644,
        type: "file",
      },
      content,
    );
  }

  pack.finalize();

  await new Promise<void>((resolve) => pack.on("end", resolve));

  return Buffer.concat(chunks);
}

function ensurePackageJsonMetadata(files: Record<string, string>) {
  const packageJson = files["package.json"];
  if (!packageJson) return;

  try {
    const parsed = JSON.parse(packageJson) as {
      name?: string;
      version?: string;
      private?: boolean;
      scripts: Record<string, string>;
    };

    parsed.name = "sandbox-app";
    parsed.version = "0.1.0";
    parsed.private = true;
    parsed.scripts = {
      start: "react-scripts start",
      build: "react-scripts build",
      test: "react-scripts test",
      eject: "react-scripts eject",
    };

    files["package.json"] = JSON.stringify(parsed, null, 2);
  } catch {
    // Keep invalid JSON unchanged.
  }
}
