"use client";

import {
  SandboxCodeEditor,
  SandboxLayout,
  SandboxPreview,
  SandboxTabs,
  SandboxTabsContent,
  SandboxTabsList,
  SandboxTabsTrigger,
  SandboxTests,
} from "~/components/ui/sandbox";

import { CheckCircle2, Files, TestTube, Wallpaper } from "lucide-react";

import type { SandpackFiles } from "@codesandbox/sandpack-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AssistantSidebar } from "./assistant-sidebar";
import type { ProblemDescriptionProps } from "./problem-description";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";

export default function CodeRunner({
  problemId,
  problemDescription,
}: {
  problemId: number;
  starterFiles: SandpackFiles;
  problemDescription: ProblemDescriptionProps;
}) {
  const [testsPassing, setTestsPassing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const sessionEndRef = useRef<number | null>(null);

  useEffect(() => {
    const now = Date.now();
    const endTime = now + 15 * 60 * 1000;
    sessionEndRef.current = endTime;
    setTimeLeft(Math.max(0, Math.ceil((endTime - now) / 1000)));

    const timeoutId = window.setTimeout(
      () => {
        // const storagePrefix = `code-${problemId}-`;
        // for (let i = localStorage.length - 1; i >= 0; i -= 1) {
        //   const key = localStorage.key(i);
        //   if (key && key.startsWith(storagePrefix)) {
        //     localStorage.removeItem(key);
        //   }
        // }
        // window.alert(
        //   "Your 15-minute session has ended. Saved code for this problem was cleared.",
        // );
        window.alert("Your 15-minute session has ended.");
      },
      15 * 60 * 1000,
    );

    const intervalId = window.setInterval(() => {
      const currentEnd = sessionEndRef.current;
      if (!currentEnd) return;
      const secondsLeft = Math.max(
        0,
        Math.ceil((currentEnd - Date.now()) / 1000),
      );
      setTimeLeft(secondsLeft);
      if (secondsLeft === 0) {
        window.clearInterval(intervalId);
      }
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [problemId]);

  // useEffect(() => {
  //   if (!didMountRef.current) {
  //     didMountRef.current = true;
  //     return;
  //   }
  //   const localStorageCodeKey = `code-${problemId}-${activeFile}`;
  //   localStorage.setItem(
  //     localStorageCodeKey,
  //     JSON.stringify(files[activeFile]?.code),
  //   );
  //   console.log("set: ", localStorageCodeKey);
  // }, [files, activeFile, problemId]);

  const handleTestsComplete = useCallback((specs: Record<string, unknown>) => {
    if (!specs) {
      setTestsPassing(false);
      return;
    }
    console.log("crash");
    const collectStatuses = (node: unknown): string[] => {
      if (!node || typeof node !== "object") return [];
      const typedNode = node as {
        tests?: Record<string, { status?: string }>;
        describes?: Record<string, unknown>;
      };
      const testStatuses = Object.values(typedNode.tests ?? {}).flatMap(
        (test) => (test.status ? [test.status] : []),
      );
      const describeStatuses = Object.values(typedNode.describes ?? {}).flatMap(
        collectStatuses,
      );
      return [...testStatuses, ...describeStatuses];
    };

    const statuses = Object.values(specs).flatMap(collectStatuses);
    setTestsPassing(
      statuses.length > 0 && statuses.every((status) => status === "pass"),
    );
  }, []);

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
            <AssistantSidebar
              problemId={problemId}
              problemDescription={problemDescription}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={74} minSize={60}>
          <main className="relative flex h-full w-full flex-col overflow-hidden bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.08),rgba(15,23,42,0)_60%)] p-3 md:p-4">
            <div className="bg-card ring-border/60 flex h-full flex-col rounded-2xl border p-3 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] ring-1 backdrop-blur md:p-4">
              <header className="space-y-2 pb-4 md:pb-6">
                <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
                  Playground
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold tracking-tight">
                    React runner
                  </h1>
                  <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase">
                    Live
                  </span>
                </div>
                <p className="text-muted-foreground max-w-2xl">
                  Edit the code, experiment with React components, and watch the
                  preview refresh as you type.
                </p>
              </header>

              <div className="flex-1 overflow-hidden rounded-xl border border-slate-200/70 bg-white/90 shadow-inner">
                <SandboxLayout>
                  <SandboxTabs
                    className="h-full border-slate-200/70 bg-slate-50/60"
                    defaultValue={"code"}
                  >
                    {testsPassing && (
                      <div className="pointer-events-none absolute top-3 right-3 z-10 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700 shadow-sm">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
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
                      <div className="text-muted-foreground text-[11px] font-semibold tracking-[0.22em] uppercase">
                        Session{" "}
                        {`${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`}
                      </div>
                      <div className="flex flex-1" />
                    </SandboxTabsList>
                    <SandboxTabsContent value="code" className="bg-white">
                      <SandboxCodeEditor
                        className="min-h-160"
                        showTabs
                        showLineNumbers
                        wrapContent
                      />
                    </SandboxTabsContent>
                    <SandboxTabsContent value="preview" className="bg-white">
                      <SandboxPreview
                        showNavigator
                        showRefreshButton
                        style={{ height: "78vh" }}
                      />
                    </SandboxTabsContent>
                    <SandboxTabsContent value="tests" className="bg-white">
                      <SandboxTests
                        className="min-h-160"
                        onComplete={handleTestsComplete}
                      />
                    </SandboxTabsContent>
                  </SandboxTabs>
                </SandboxLayout>
              </div>
            </div>
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
