import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { PassThrough } from "stream";
import tar from "tar-stream";
import type { SandpackFiles } from "@codesandbox/sandpack-react";

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

export const judgeRouter = createTRPCRouter({
  submit: publicProcedure
    .input(
      z.object({
        problemId: z.number(),
        files: sandpackFileSchema,
      }),
    )
    .mutation(async ({ input }) => {
      console.log("Files: ", input.files);
      const normalizedFiles = normalizeSandpackFiles(input.files);
      const tarArchive = await buildTarFromFiles(normalizedFiles);

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
    if (key.startsWith("/")) {
      const newKey = key.substring(1);
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
