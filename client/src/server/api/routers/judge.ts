import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
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

export interface JudgeResponse {
  jsonrpc: "2.0";
  id: string;
  result: TaskResult;
}

// ---- Task Result ----
export interface TaskResult {
  kind: "task";
  id: string;
  artifacts: Artifact[];
  contextId: string;
  history: HistoryEntry[];
  metadata: TaskMetadata;
  status: TaskStatus;
}

// ---- Artifacts (expand as needed) ----
export type Artifact = Record<string, unknown>;

// ---- History entries (expand as needed) ----
export type HistoryEntry = Record<string, unknown>;

// ---- Metadata ----
export interface TaskMetadata {
  adk_app_name: string;
  adk_session_id: string;
  adk_user_id: string;
}

// ---- Status ----
export interface TaskStatus {
  state: "completed" | "running" | "failed" | "queued";
  timestamp: string; // ISO-8601
}

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
      const tarArchive = await buildTarFromFiles(normalizedFiles);
      const tarArchiveBase64 = tarArchive.toString("base64");

      const response = await fetch("http://127.0.0.1:63644/invoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "1",
          method: "message/send",
          params: {
            message: {
              kind: "message",
              messageId: "msg-1",
              role: "user",
              parts: [
                {
                  kind: "text",
                  text:
                    "Here is a base64-encoded tar archive. Decode it, list all file paths, " +
                    "and return each file contents as text.\n\n" +
                    tarArchiveBase64,
                },
              ],
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Judge invoke failed: ${response.status}`);
      }

      const judgeResponse = (await response.json()) as JudgeResponse;
      console.log("Judge Response: ", judgeResponse.result);
      console.log("Artifact: ", judgeResponse.result.artifacts[0]?.parts);

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
