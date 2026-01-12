"use client";

import { use, useMemo } from "react";
import type { SandpackFiles } from "@codesandbox/sandpack-react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import {
  SandboxCodeEditor,
  SandboxLayout,
  SandboxPreview,
  SandboxTabs,
  SandboxTabsContent,
  SandboxTabsList,
  SandboxTabsTrigger,
  SandboxTests,
  SandboxProvider,
} from "~/components/ui/sandbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/react";
import ProblemDescription from "~/app/problems/react/[problemId]/_components/problem-description";
import type { ProblemDescriptionProps } from "~/app/problems/react/[problemId]/_components/problem-description";
import { Files, TestTube, Wallpaper } from "lucide-react";

type SubmissionChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type SubmissionPageProps = {
  params: Promise<{ submissionId: string }>;
};

function mapSubmissionFiles(
  submittedCode: Record<string, string> | null | undefined,
): SandpackFiles {
  if (!submittedCode) return {};
  return Object.entries(submittedCode).reduce<SandpackFiles>(
    (files, [path, code]) => {
      let normalizedPath = path;
      if (normalizedPath.startsWith("src/")) {
        normalizedPath = `/${normalizedPath.slice(4)}`;
      } else if (normalizedPath.startsWith("public/")) {
        normalizedPath = `/${normalizedPath}`;
      } else if (!normalizedPath.startsWith("/")) {
        normalizedPath = `/${normalizedPath}`;
      }
      files[normalizedPath] = code;
      return files;
    },
    {},
  );
}

function getChatHistory(chatHistory: unknown): SubmissionChatMessage[] {
  if (!Array.isArray(chatHistory)) return [];
  return chatHistory.filter(
    (entry): entry is SubmissionChatMessage =>
      Boolean(entry) &&
      typeof entry === "object" &&
      "role" in entry &&
      "content" in entry,
  );
}

function SubmissionInfo({
  status,
  executionTime,
  timestamp,
  chatHistory,
  isLoading,
}: {
  status?: string | null;
  executionTime?: string | null;
  timestamp?: string | null;
  chatHistory: SubmissionChatMessage[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="bg-card flex-1 space-y-4 overflow-y-auto rounded-lg border p-4">
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="h-6 w-32 rounded bg-slate-100" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 rounded bg-slate-200" />
          <div className="h-6 w-28 rounded bg-slate-100" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="h-6 w-40 rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  const statusTone =
    status === "success" ? "text-emerald-600" : "text-rose-600";
  const statusBg = status === "success" ? "bg-emerald-50" : "bg-rose-50";

  return (
    <div className="bg-card flex-1 space-y-4 overflow-y-auto rounded-lg border p-4 text-sm">
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs uppercase">Status</p>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone} ${statusBg}`}
        >
          {status ?? "Unknown"}
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs uppercase">
          Execution time
        </p>
        <p className="text-sm font-semibold text-slate-900">
          {executionTime ?? "Not recorded"}
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs uppercase">Timestamp</p>
        <p className="text-sm font-semibold text-slate-900">
          {timestamp ?? "Not recorded"}
        </p>
      </div>
      <div className="space-y-2 pt-2">
        <p className="text-muted-foreground text-xs uppercase">Chat history</p>
        {chatHistory.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No chat history recorded for this submission.
          </p>
        ) : (
          <div className="bg-background space-y-3 rounded-lg border p-3 shadow-inner">
            {chatHistory.map((message, index) => (
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
        )}
      </div>
    </div>
  );
}

export default function SubmissionPage({ params }: SubmissionPageProps) {
  const { submissionId: submissionIdParam } = use(params);
  const submissionId = useMemo(
    () => Number(submissionIdParam),
    [submissionIdParam],
  );
  const isSubmissionIdValid = Number.isFinite(submissionId);

  const { data, isLoading, error } = api.judge.submission.useQuery(
    { submissionId },
    { enabled: isSubmissionIdValid },
  );

  const problem = data?.problem ?? null;
  const problemDescriptionProps: ProblemDescriptionProps = {
    category: problem?.category?.toLowerCase() ?? "react",
    categoryValue: problem?.category ?? null,
    isProblemIdValid: Boolean(problem?.id),
    isLoading,
    error: error ? { message: error.message } : null,
    data: (problem as ProblemDescriptionProps["data"]) ?? null,
  };

  const sandpackFiles = useMemo(
    () => mapSubmissionFiles(data?.submittedCode ?? null),
    [data?.submittedCode],
  );
  const allFiles = Object.keys(sandpackFiles);
  const baseVisibleFiles = useMemo(() => {
    if (problem?.visibleFiles?.length) {
      return problem.visibleFiles.map((file) =>
        file.startsWith("/") ? file : `/${file}`,
      );
    }
    return allFiles;
  }, [allFiles, problem?.visibleFiles]);
  const visibleFiles = useMemo(() => {
    const testFiles = allFiles.filter((file) => file.includes(".test"));
    const merged = new Set([...baseVisibleFiles, ...testFiles]);
    return [...merged].filter((file) => allFiles.includes(file));
  }, [allFiles, baseVisibleFiles]);
  const activeFile =
    visibleFiles.find((file) => file.endsWith(".js")) ??
    visibleFiles[0] ??
    allFiles[0];
  const chatHistory = getChatHistory(data?.chatHistory);

  if (!isSubmissionIdValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-sm text-rose-700">
          Invalid submission id.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen justify-center overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-screen w-full">
        <ResizablePanel
          defaultSize={26}
          minSize={18}
          maxSize={80}
          className="min-w-[16rem]"
        >
          <div className="bg-muted/40 h-full w-full overflow-hidden border-r p-3 md:p-4">
            <div className="flex h-full w-full flex-col gap-3 overflow-scroll">
              <Tabs
                defaultValue="problem"
                className="flex h-full flex-col gap-3"
              >
                <div className="text-sm font-semibold">Submission Overview</div>
                <TabsList className="w-full">
                  <TabsTrigger className="flex-1" value="problem">
                    Problem Description
                  </TabsTrigger>
                  <TabsTrigger className="flex-1" value="info">
                    Submission Info
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="problem"
                  className="bg-card flex-1 overflow-y-auto rounded-lg border p-3 text-sm"
                >
                  <ProblemDescription {...problemDescriptionProps} />
                </TabsContent>
                <TabsContent
                  value="info"
                  className="flex h-full flex-1 flex-col"
                >
                  <SubmissionInfo
                    status={data?.status ?? null}
                    executionTime={null}
                    timestamp={null}
                    chatHistory={chatHistory}
                    isLoading={isLoading}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={74} minSize={60}>
          <main className="relative flex h-full w-full flex-col overflow-hidden bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.08),rgba(15,23,42,0)_60%)] p-3 md:p-4">
            <div className="bg-card ring-border/60 relative flex h-full flex-col rounded-2xl border p-3 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] ring-1 backdrop-blur md:p-4">
              <header className="space-y-2 pb-4 md:pb-6">
                <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
                  Submission
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Review code
                  </h1>
                  {data?.status && (
                    <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase">
                      {data.status}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground max-w-2xl">
                  This editor is read-only and mirrors the exact files submitted
                  for evaluation.
                </p>
              </header>

              <div className="flex-1 overflow-hidden rounded-xl border border-slate-200/70 bg-white/90 shadow-inner">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Loading submission...
                  </div>
                ) : error ? (
                  <div className="flex h-full items-center justify-center text-sm text-rose-600">
                    Unable to load submission.
                  </div>
                ) : visibleFiles.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    No code files available for this submission.
                  </div>
                ) : (
                  <SandboxProvider
                    template="react"
                    files={sandpackFiles}
                    options={{
                      visibleFiles,
                      activeFile,
                      autoReload: false,
                      autorun: true,
                      externalResources: ["https://cdn.tailwindcss.com"],
                    }}
                  >
                    <SandboxLayout>
                      <SandboxTabs
                        className="h-full border-slate-200/70 bg-slate-50/60"
                        defaultValue="code"
                      >
                        <SandboxTabsList className="border-b border-slate-200/60 bg-white/70 px-3 py-2">
                          <div className="flex flex-1 items-center gap-2">
                            <SandboxTabsTrigger
                              value="code"
                              className="gap-2 text-xs font-semibold tracking-[0.18em] uppercase"
                            >
                              <Files className="h-4 w-4" /> Files
                            </SandboxTabsTrigger>
                            <SandboxTabsTrigger
                              value="preview"
                              className="gap-2 text-xs font-semibold tracking-[0.18em] uppercase"
                            >
                              <Wallpaper className="h-4 w-4" /> Preview
                            </SandboxTabsTrigger>
                            <SandboxTabsTrigger
                              value="tests"
                              className="gap-2 text-xs font-semibold tracking-[0.18em] uppercase"
                            >
                              <TestTube className="h-4 w-4" /> Tests
                            </SandboxTabsTrigger>
                          </div>
                        </SandboxTabsList>
                        <SandboxTabsContent value="code" className="bg-white">
                          <SandboxCodeEditor
                            className="min-h-160"
                            showTabs
                            showLineNumbers
                            wrapContent
                            readOnly
                          />
                        </SandboxTabsContent>
                        <SandboxTabsContent
                          value="preview"
                          className="bg-white"
                        >
                          <SandboxPreview
                            showNavigator
                            showRefreshButton
                            style={{ height: "78vh" }}
                          />
                        </SandboxTabsContent>
                        <SandboxTabsContent value="tests" className="bg-white">
                          <SandboxTests className="min-h-160" />
                        </SandboxTabsContent>
                      </SandboxTabs>
                    </SandboxLayout>
                  </SandboxProvider>
                )}
              </div>
            </div>
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
