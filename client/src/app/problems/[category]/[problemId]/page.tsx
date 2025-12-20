"use client";

import { useMemo } from "react";
import { categoryEnum } from "~/server/db/schema";
import { api } from "~/trpc/react";
import CodeRunner from "./_components/code-runner";

export default function ProblemDetailPage({
  params,
}: {
  params: { category: string; problemId: string };
}) {
  const categoryValue = useMemo(() => {
    return (
      categoryEnum.enumValues.find(
        (value) => value.toLowerCase() === params.category.toLowerCase(),
      ) ?? null
    );
  }, [params.category]);

  const problemId = useMemo(() => Number(params.problemId), [params.problemId]);
  const isProblemIdValid = Number.isFinite(problemId);

  const { data, isLoading, error } = api.problem.getProblem.useQuery(
    { problemId },
    { enabled: Boolean(categoryValue) && isProblemIdValid },
  );

  return (
    <CodeRunner
      starterFiles={data?.starterCode ?? {}}
      problemDescription={{
        category: params.category,
        categoryValue,
        isProblemIdValid,
        isLoading,
        error: error ?? null,
        data,
      }}
    />
  );
}
