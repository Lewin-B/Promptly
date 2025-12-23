"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { categoryEnum } from "~/server/db/schema";
import { api } from "~/trpc/react";
import CodeRunner from "./_components/code-runner";
import { SandboxProvider } from "~/components/ui/sandbox";
import ProblemDescription from "./_components/problem-description";
import type { SandpackFiles } from "@codesandbox/sandpack-react";

export default function ProblemDetailPage({
  params,
}: {
  params: Promise<{ category: string; problemId: string }>;
}) {
  const { category, problemId: problemIdParam } = use(params);
  const categoryValue = useMemo(() => {
    return (
      categoryEnum.enumValues.find(
        (value) => value.toLowerCase() === category.toLowerCase(),
      ) ?? null
    );
  }, [category]);

  const problemId = useMemo(() => Number(problemIdParam), [problemIdParam]);
  const isProblemIdValid = Number.isFinite(problemId);

  const { data, isLoading, error } = api.problem.getProblem.useQuery(
    { problemId },
    { enabled: Boolean(categoryValue) && isProblemIdValid },
  );

  const [initialFiles, setInitialFiles] = useState<SandpackFiles | null>(null);
  const lastProblemIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (lastProblemIdRef.current !== problemId) {
      setInitialFiles(null);
      lastProblemIdRef.current = problemId;
    }
  }, [problemId]);

  useEffect(() => {
    if (!data?.starterCode || !isProblemIdValid) return;
    if (initialFiles) return;
    const hydratedFiles = Object.fromEntries(
      Object.entries(data.starterCode).map(([filePath, file]) => {
        const localStorageKey = `code-${problemId}-${filePath}`;
        const savedCode = localStorage.getItem(localStorageKey);
        if (!savedCode) return [filePath, file];
        const parsedCode = JSON.parse(savedCode);
        console.log("file: ", filePath, localStorageKey);
        try {
          if (typeof savedCode !== "string") return [filePath, file];
          return [filePath, parsedCode];
        } catch (error) {
          console.warn("Failed to parse saved code", error);
          return [filePath, file];
        }
      }),
    );

    console.log("hydratedFiles: ", hydratedFiles);
    setInitialFiles(hydratedFiles);
  }, [data?.starterCode, initialFiles, isProblemIdValid, problemId]);

  if (!initialFiles) {
    return (
      <ProblemDescription
        category={category}
        categoryValue={categoryValue}
        isProblemIdValid={isProblemIdValid}
        isLoading={isLoading}
        error={error ?? null}
        data={data}
      />
    );
  }

  return (
    <SandboxProvider
      template="react"
      files={initialFiles}
      options={{
        visibleFiles: data?.visibleFiles ?? ["/App.js"],
        activeFile: "/Shipment.js",
        autoReload: true,
        autorun: true,
        externalResources: ["https://cdn.tailwindcss.com"],
      }}
    >
      <CodeRunner
        problemId={problemId}
        starterFiles={initialFiles}
        problemDescription={{
          category,
          categoryValue,
          isProblemIdValid,
          isLoading,
          error: error ?? null,
          data,
        }}
      />
    </SandboxProvider>
  );
}
