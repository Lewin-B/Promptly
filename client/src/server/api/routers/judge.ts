import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import tar from "tar-stream";
import type { SandpackFiles } from "@codesandbox/sandpack-react";
import { fetch } from "undici";
import { env } from "~/env";
import { randomUUID } from "crypto";
import { db } from "~/server/db";
import { Problem, Submission } from "~/server/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  clearSubmissionProgress,
  getSubmissionProgress,
  type SubmissionStage,
  updateSubmissionProgress,
} from "~/server/submission-progress-store";
import type { AnalyzerResult } from "~/server/types/analysis";

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
const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export interface DeployResponse {
  container_name: string;
  container_id: string;
  image_name: string;
  image_id: string;
  build_logs: string;
  build_failed: boolean;
}
export type AnalyzerResponse = AnalyzerResult;

const REACT_DOCKER_FILE = `FROM node:18-bullseye

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Run tests in CI mode so they don't hang
ENV CI=true
RUN npm run test

# Build the React app
RUN npm run build

# Install a lightweight static file server
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
`;

export const judgeRouter = createTRPCRouter({
  submit: protectedProcedure
    .input(
      z.object({
        problemId: z.number(),
        files: sandpackFileSchema,
        submissionId: z.string().min(1),
        chatHistory: z.array(chatMessageSchema),
      }),
    )
    .mutation(async ({ input }) => {
      let currentStage: SubmissionStage = "tests";
      updateSubmissionProgress(input.submissionId, currentStage, null);

      try {
        const normalizedFiles = normalizeSandpackFiles(input.files);
        ensurePackageJsonMetadata(normalizedFiles);
        const problem = await db
          .select()
          .from(Problem)
          .where(eq(Problem.id, input.problemId))
          .limit(1)
          .then((rows) => rows[0] ?? null);

        console.log(`${env.AGENT_SERVER_URL}/test`);

        const testAgentResponse = await fetch(`${env.AGENT_SERVER_URL}/test`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "message/send",
            id: randomUUID(),
            params: {
              configuration: {
                blocking: true,
              },
              message: {
                messageId: randomUUID(),
                role: "user",
                parts: [
                  {
                    kind: "text",
                    text: `Generate unit tests for problem ${problem?.name}. Use the provided files and problem description.`,
                  },
                  {
                    kind: "data",
                    data: {
                      problemId: input.problemId,
                      problemDescription: problem?.description ?? null,
                      files: normalizedFiles,
                    },
                  },
                ],
              },
            },
          }),
        });

        if (!testAgentResponse.ok) {
          throw new Error(
            `Test agent invoke failed: ${testAgentResponse.status}`,
          );
        }

        const bodyText = await testAgentResponse.text();
        const testFiles = parseTestAgentArtifacts(bodyText);
        if (testFiles) {
          Object.assign(normalizedFiles, testFiles);
        }

        console.log("normalized Files: ", normalizedFiles);

        currentStage = "deploy";
        updateSubmissionProgress(input.submissionId, currentStage, null);

        const tarArchive = await buildTarFromFiles(normalizedFiles);
        const tarArchiveBase64 = tarArchive.toString("base64url");

        // Build docker image
        let deployResponse: DeployResponse | null = null;
        let deployFetchOk = false;
        try {
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
          deployFetchOk = response.ok;
          try {
            deployResponse = (await response.json()) as DeployResponse;
          } catch (error) {
            console.warn("Failed to parse deploy response:", error);
          }
        } catch (error) {
          console.warn("Deploy request failed:", error);
        }
        console.log("Deploy Response: ", deployResponse);

        currentStage = "analysis";
        updateSubmissionProgress(input.submissionId, currentStage, null);

        const analyzerResponse = await fetch(
          `${env.AGENT_SERVER_URL}/analyze`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "message/send",
              id: randomUUID(),
              params: {
                configuration: {
                  blocking: true,
                },
                message: {
                  messageId: randomUUID(),
                  role: "user",
                  parts: [
                    {
                      kind: "text",
                      text: "Analyze the submission using the provided logs, files, and problem description.",
                    },
                    {
                      kind: "data",
                      data: {
                        problemId: input.problemId,
                        problemDescription: problem?.description ?? null,
                        files: normalizedFiles,
                        buildLogs: deployResponse?.build_logs ?? "",
                        chatHistory: input.chatHistory,
                      },
                    },
                  ],
                },
              },
            }),
          },
        );

        if (!analyzerResponse.ok) {
          throw new Error(
            `Analyzer agent invoke failed: ${analyzerResponse.status}`,
          );
        }

        const analyzerBodyText = await analyzerResponse.text();
        const analyzerResult = parseAnalyzerResult(analyzerBodyText);

        console.log("Analyzer result: ", analyzerResult);

        const buildFailed = deployResponse?.build_failed ?? !deployFetchOk;
        const [submission] = await db
          .insert(Submission)
          .values({
            problemId: input.problemId,
            accountId: null,
            submittedCode: normalizedFiles,
            status: buildFailed || !analyzerResult ? "failure" : "success",
            chatHistory: input.chatHistory,
            analysis: analyzerResult,
          })
          .returning({ id: Submission.id });

        updateSubmissionProgress(input.submissionId, "done", null);
        setTimeout(
          () => {
            clearSubmissionProgress(input.submissionId);
          },
          5 * 60 * 1000,
        );

        return {
          receivedFiles: Object.keys(input.files).length,
          problemId: input.problemId,
          buildFailed,
          buildLogs: deployResponse?.build_logs ?? "",
          analysis: analyzerResult,
          submissionRecordId: submission?.id ?? null,
        };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Submission failed to process.";
        updateSubmissionProgress(input.submissionId, currentStage, message);
        setTimeout(
          () => {
            clearSubmissionProgress(input.submissionId);
          },
          5 * 60 * 1000,
        );
        throw error;
      }
    }),
  progress: publicProcedure
    .input(
      z.object({
        submissionId: z.string().min(1),
      }),
    )
    .query(({ input }) => {
      return getSubmissionProgress(input.submissionId);
    }),
  submission: publicProcedure
    .input(
      z.object({
        submissionId: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const rows = await db
        .select({
          submission: Submission,
          problem: Problem,
        })
        .from(Submission)
        .leftJoin(Problem, eq(Submission.problemId, Problem.id))
        .where(eq(Submission.id, input.submissionId))
        .limit(1);

      const row = rows[0];
      if (!row) return null;

      return {
        ...row.submission,
        problem: row.problem,
      };
    }),
  submissionsForProblem: publicProcedure
    .input(
      z.object({
        problemId: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const [problem] = await db
        .select()
        .from(Problem)
        .where(eq(Problem.id, input.problemId))
        .limit(1);

      const submissions = await db
        .select()
        .from(Submission)
        .where(eq(Submission.problemId, input.problemId))
        .orderBy(desc(Submission.id));

      return { problem: problem ?? null, submissions };
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

function parseTestAgentArtifacts(
  bodyText: string,
): Record<string, string> | null {
  try {
    const response = JSON.parse(bodyText) as {
      result?: {
        artifacts?: Array<{
          parts?: Array<{
            kind?: string;
            text?: string;
          }>;
        }>;
      };
    };

    const parts = response.result?.artifacts?.flatMap(
      (artifact) => artifact.parts ?? [],
    );
    const textPart = parts?.find((part) => part.kind === "text")?.text;
    if (!textPart) return null;

    const trimmed = textPart.trim();
    const jsonPayload = trimmed
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    const parsed = JSON.parse(jsonPayload) as Record<string, string>;
    return parsed;
  } catch (error) {
    console.warn("Failed to parse test agent artifacts:", error);
    return null;
  }
}

function parseAnalyzerResult(bodyText: string): AnalyzerResponse | null {
  try {
    const response = JSON.parse(bodyText) as {
      result?: {
        artifacts?: Array<{
          parts?: Array<{
            kind?: string;
            text?: string;
          }>;
        }>;
      };
    };

    const parts = response.result?.artifacts?.flatMap(
      (artifact) => artifact.parts ?? [],
    );
    const textPart = parts?.find((part) => part.kind === "text")?.text;
    if (!textPart) return null;

    const trimmed = textPart.trim();
    const jsonPayload = trimmed
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    return JSON.parse(jsonPayload) as AnalyzerResponse;
  } catch (error) {
    console.warn("Failed to parse analyzer response:", error);
    return null;
  }
}
