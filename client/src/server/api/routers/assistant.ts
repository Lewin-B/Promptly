import { TRPCError } from "@trpc/server";
import Together from "together-ai";
import type { ChatCompletion } from "together-ai/resources/chat/completions";
import { z } from "zod";

import { env } from "~/env";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const together = new Together();

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

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

const modelOptions = ["qwen3-coder", "kimi-k2", "deepseek", "gpt-oss"] as const;
const modelSchema = z.enum(modelOptions);
type AiModel = z.infer<typeof modelSchema>;

const MODEL_ID_MAP: Record<AiModel, string> = {
  "qwen3-coder": "Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8",
  "kimi-k2": "moonshotai/Kimi-K2-Instruct-0905",
  deepseek: "deepseek-ai/DeepSeek-V3.1",
  "gpt-oss": "openai/gpt-oss-120b",
};

const systemPrompt = `
You are an expert AI coding partner helping inside a Sandpack React playground.
- ALWAYS RESPOND WITH VALID JSON IN THE SHAPE: {"reply": "brief update", "files": [{"path": "/App.js", "code": "full file content"}]}
- Current files are included below. Modify them by returning JSON only.
- Always respond with valid JSON in the shape: {"reply": "brief update", "files": [{"path": "/App.js", "code": "full file content"}]}
- Include complete file contents for every file you return. If no change is needed, send an empty "files" array.
- Do not wrap responses in Markdown or add commentary outside JSON.
- DO NOT RESPOND WITH ANYTHONG OTHER THAN VALID JSON IN THE SHAPE: {"reply": "brief update", "files": [{"path": "/App.js", "code": "full file content"}]}
`.trim();

type Candidate = {
  reply: string;
  files: FileUpdate[];
};

type FileUpdate = {
  path: string;
  code: string;
};

export const assistantRouter = createTRPCRouter({
  assist: publicProcedure
    .input(
      z.object({
        messages: z.array(chatMessageSchema),
        files: sandpackFileSchema.optional(),
        model: modelSchema,
      }),
    )
    .mutation(async ({ input }) => {
      if (!env.TOGETHER_API_KEY) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Together AI API key is not configured",
        });
      }

      const filesContext = buildFilesContext(input.files);
      const togetherModel =
        MODEL_ID_MAP[input.model] ?? MODEL_ID_MAP["qwen3-coder"];

      const response = await together.chat.completions.create({
        model: togetherModel,
        stream: false,
        messages: [
          {
            role: "system",
            content: `${systemPrompt}\n\nCurrent sandbox files:\n${filesContext}`,
          },
          ...input.messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        ],
        temperature: 0.4,
      });

      console.log("response: ", response);

      const tokens = response.usage?.total_tokens;
      const text = extractText(response);
      console.log("Text: ", text);
      const parsed = tryParseJson(text);

      if (!parsed) {
        return { reply: "Error generating a response", files: [] };
      }

      const files =
        parsed && Array.isArray(parsed.files)
          ? parsed.files
              .map((file: FileUpdate) => ({
                path: normalizePath(file.path),
                code: typeof file.code === "string" ? file.code : "",
              }))
              .filter((file) => file.path && file.code)
          : [];

      const reply =
        typeof parsed?.reply === "string" && parsed.reply.trim().length > 0
          ? parsed.reply.trim()
          : text?.trim() || "I could not generate a response.";

      return { reply, files, tokens_used: tokens };
    }),
});

function buildFilesContext(
  files: Record<string, string | { code: string }> | undefined,
) {
  if (!files) return "No files found.";

  return Object.entries(files)
    .map(([path, value]) => {
      const code = typeof value === "string" ? value : (value?.code ?? "");
      return [`File: ${path}`, code].join("\n");
    })
    .join("\n\n");
}

function normalizePath(path?: string) {
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
}

function tryParseJson(text: unknown) {
  if (typeof text !== "string") return null;

  // Prefer the first JSON object in the string if the model wrapped it.
  const match = /\{[\s\S]*\}/.exec(text);
  const candidate = match ? match[0] : text;

  try {
    return JSON.parse(candidate) as Candidate;
  } catch (err) {
    console.log("Failed to parse: ", err);
    return null;
  }
}

function extractText(
  response:
    | string
    | ChatCompletion
    | {
        choices?: Array<{
          message?: { content?: string | Array<{ text?: string }> | null };
        }>;
      },
) {
  if (typeof response === "string") return response;

  const messageContent = response.choices?.[0]?.message?.content;
  if (Array.isArray(messageContent)) {
    return messageContent.map((part) => part?.text ?? "").join("\n");
  }

  return typeof messageContent === "string" ? messageContent : "";
}
