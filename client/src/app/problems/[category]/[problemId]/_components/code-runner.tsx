"use client";

import {
  SandboxCodeEditor,
  SandboxLayout,
  SandboxPreview,
  SandboxProvider,
  SandboxTabs,
  SandboxTabsContent,
  SandboxTabsList,
  SandboxTabsTrigger,
  SandboxTests,
} from "~/components/ui/sandbox";

import { Files, TestTube, Wallpaper } from "lucide-react";

import type { SandpackFiles } from "@codesandbox/sandpack-react";

import { AssistantSidebar } from "./assistant-sidebar";
import type { ProblemDescriptionProps } from "./problem-description";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";

export default function CodeRunner({
  starterFiles,
  problemDescription,
}: {
  starterFiles: SandpackFiles;
  problemDescription: ProblemDescriptionProps;
}) {
  return (
    <SandboxProvider
      template="react"
      files={starterFiles}
      options={{
        visibleFiles: ["/App.js", "/Shipment.js"],
        activeFile: "/Shipment.js",
        autoReload: true,
        autorun: true,
      }}
      customSetup={{
        dependencies: {
          "react-window": "2.2.3",
          "@testing-library/dom": "9.3.4",
          zod: "4.2.1",
          "@testing-library/react": "16.3.1",
          "@testing-library/user-event": "14.6.1",
        },
      }}
    >
      <div className="flex h-screen w-screen justify-center overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-screen w-full">
          <ResizablePanel
            defaultSize={26}
            minSize={18}
            maxSize={80}
            className="min-w-[16rem]"
          >
            <div className="bg-muted/40 h-full w-full overflow-hidden border-r p-3 md:p-4">
              <AssistantSidebar problemDescription={problemDescription} />
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
                    Edit the code, experiment with React components, and watch
                    the preview refresh as you type.
                  </p>
                </header>

                <div className="flex-1 overflow-hidden rounded-xl border border-slate-200/70 bg-white/90 shadow-inner">
                  <SandboxLayout>
                    <SandboxTabs
                      className="h-full border-slate-200/70 bg-slate-50/60"
                      defaultValue={"code"}
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
                        <SandboxTests className="min-h-160" />
                      </SandboxTabsContent>
                    </SandboxTabs>
                  </SandboxLayout>
                </div>
              </div>
            </main>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SandboxProvider>
  );
}
