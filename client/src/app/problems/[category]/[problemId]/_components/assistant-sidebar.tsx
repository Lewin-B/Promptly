"use client";

import { useState } from "react";

import { useSandpack } from "@codesandbox/sandpack-react";
import { Loader2, Send, Sparkles } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api, type RouterInputs, type RouterOutputs } from "~/trpc/react";
import ProblemDescription, {
  type ProblemDescriptionProps,
} from "./problem-description";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type FileUpdate = RouterOutputs["assistant"]["assist"]["files"][number];
type AiModel = RouterInputs["assistant"]["assist"]["model"];

const MODEL_OPTIONS: Array<{ value: AiModel; label: string }> = [
  { value: "qwen3-coder", label: "Qwen3 Coder" },
  { value: "kimi-k2", label: "Kimi K2" },
  { value: "deepseek", label: "Deepseek" },
  { value: "gpt-oss", label: "GPT-OSS" },
];

type AssistantSidebarProps = {
  problemDescription: ProblemDescriptionProps;
};

export function AssistantSidebar({
  problemDescription,
}: AssistantSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! Tell me what to build or refactor. I can edit files in the sandbox for you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [lastApplied, setLastApplied] = useState<string[]>([]);
  const [model, setModel] = useState<AiModel>("qwen3-coder");

  const { sandpack } = useSandpack();
  const { mutateAsync, isPending } = api.assistant.assist.useMutation();

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;

    const nextMessages = [...messages, { role: "user", content: prompt }];
    setMessages(nextMessages);
    setInput("");
    setLastApplied([]);

    try {
      const result = await mutateAsync({
        messages: nextMessages,
        files: sandpack.files,
        model,
      });

      applyFileUpdates(result.files);

      setMessages([
        ...nextMessages,
        { role: "assistant", content: result.reply },
      ]);
    } catch (error) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "I hit an error talking to the Together AI backend. Please try again or adjust your prompt.",
        },
      ]);
      console.error(error);
    }
  };

  const applyFileUpdates = (files: FileUpdate[]) => {
    if (!files?.length) return;

    files.forEach((file, index) => {
      sandpack.updateFile(file.path, file.code, true);
      if (index === 0) {
        sandpack.openFile(file.path);
      }
    });

    setLastApplied(files.map((file) => file.path));
  };

  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-hidden">
      <Tabs defaultValue="problem" className="flex h-full flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="text-primary h-4 w-4" />
          Runner Sidekick
        </div>

        <TabsList className="w-full">
          <TabsTrigger className="flex-1" value="problem">
            Problem
          </TabsTrigger>
          <TabsTrigger className="flex-1" value="assistant">
            Assistant
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="problem"
          className="bg-card flex-1 overflow-y-auto rounded-lg border p-3 text-sm"
        >
          <ProblemDescription {...problemDescription} />
        </TabsContent>

        <TabsContent
          value="assistant"
          className="flex h-full flex-1 flex-col gap-3"
        >
          <div className="bg-background flex-1 space-y-3 overflow-y-auto rounded-lg border p-3 text-sm shadow-inner">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className="bg-muted/60 space-y-1 rounded-md border border-dashed p-2"
              >
                <div className="text-muted-foreground flex items-center gap-2 text-xs tracking-wide uppercase">
                  <span className="bg-primary h-1.5 w-1.5 rounded-full" />
                  {message.role === "assistant" ? "Assistant" : "You"}
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            ))}
          </div>

          {lastApplied.length > 0 && (
            <div className="bg-muted/50 text-muted-foreground rounded-md border p-2 text-xs">
              Updated files: {lastApplied.join(", ")}
            </div>
          )}

          <form onSubmit={handleSend} className="flex flex-col gap-2">
            <label className="text-muted-foreground text-xs font-medium">
              Ask for a change
            </label>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">Model</span>
              <select
                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={model}
                onChange={(event) => setModel(event.target.value as AiModel)}
                disabled={isPending}
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Add a button, fix the state bug, improve styles..."
              disabled={isPending}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send to {model}
                </>
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
