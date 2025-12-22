"use client";

import { use, useMemo } from "react";
import { categoryEnum } from "~/server/db/schema";
import { api } from "~/trpc/react";
import CodeRunner from "./_components/code-runner";

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

  return (
    <CodeRunner
      starterFiles={data?.starterCode ?? {}}
      problemDescription={{
        category,
        categoryValue,
        isProblemIdValid,
        isLoading,
        error: error ?? null,
        data,
      }}
    />
  );
}
