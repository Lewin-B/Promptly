"use client";

import {
  SandpackCodeEditor,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  type SandpackFiles,
} from "@codesandbox/sandpack-react";

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
    <SandpackProvider
      template="react"
      files={starterFiles}
      options={{
        visibleFiles: ["/App.js", "/Shipment.js", "Test.js"],
        activeFile: "/Shipment.js",
        autoReload: true,
      }}
      customSetup={{
        dependencies: {
          "react-window": "2.2.3",
          zod: "4.2.1",
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
            <main className="bg-background relative flex h-full w-full flex-col overflow-hidden p-3 md:p-4">
              <div className="bg-card ring-border/60 p-2shadow-sm flex h-full flex-col rounded-2xl border ring-1 md:p-4">
                <header className="space-y-2 pb-4 md:pb-6">
                  <p className="text-primary text-sm font-semibold tracking-[0.14em] uppercase">
                    Playground
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    React runner
                  </h1>
                  <p className="text-muted-foreground">
                    Edit the code, experiment with React components, and watch
                    the preview refresh as you type.
                  </p>
                </header>

                <SandpackLayout>
                  <SandpackCodeEditor
                    className="min-h-160"
                    showTabs
                    showLineNumbers
                    wrapContent
                  />
                  <SandpackPreview
                    showNavigator
                    showRefreshButton
                    style={{ height: "78vh" }}
                  />
                </SandpackLayout>
              </div>
            </main>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SandpackProvider>
  );
}
