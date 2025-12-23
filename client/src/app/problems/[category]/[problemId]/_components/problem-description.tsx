"use client";

import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { RouterOutputs } from "~/trpc/react";

export type ProblemDescriptionProps = {
  category: string;
  categoryValue: string | null;
  isProblemIdValid: boolean;
  isLoading: boolean;
  error?: { message: string } | null;
  data: RouterOutputs["problem"]["getProblem"] | null | undefined;
};

const difficultyStyles: Record<string, string> = {
  Easy: "bg-emerald-100 text-emerald-800",
  Medium: "bg-amber-100 text-amber-800",
  Hard: "bg-red-100 text-red-800",
};

function formatLines(value?: string) {
  if (!value) return null;
  return value;
}

export default function ProblemDescription({
  category,
  categoryValue,
  isProblemIdValid,
  isLoading,
  error,
  data,
}: ProblemDescriptionProps) {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-slate-500 uppercase">
              Problem Detail
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {categoryValue
                ? `Category: ${categoryValue}`
                : "Unknown category"}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/problems/${category}`}>Back to list</Link>
          </Button>
        </div>

        {!categoryValue || !isProblemIdValid ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Invalid problem link
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Check the category and problem id in the URL.
            </p>
          </div>
        ) : isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-2/3 rounded bg-slate-200" />
              <div className="h-4 w-1/3 rounded bg-slate-100" />
              <div className="h-24 w-full rounded bg-slate-100" />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Unable to load problem
            </h2>
            <p className="mt-2 text-sm text-slate-600">{error.message}</p>
          </div>
        ) : !data ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Problem not found
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              This problem may have been removed or renamed.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 border-b border-slate-200 pb-4">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-slate-900">
                  {data.id}. {data.name}
                </h1>
                <Badge className={difficultyStyles[data.difficulty]}>
                  {data.difficulty}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <span>
                  Time Limit: {data.description?.timeLimit ?? "Not specified"}{" "}
                  Minutes
                </span>
                <span>
                  AI Interaction:{" "}
                  {data.description?.aiConstraints ?? "Not specified"} Tokens
                </span>
              </div>
            </div>

            <section className="mb-8 space-y-3">
              <p className="leading-relaxed text-slate-700">
                {data.description?.longDescription ??
                  "No description provided yet."}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Data Interface
              </h2>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <pre className="overflow-x-auto font-mono text-sm whitespace-pre-wrap text-slate-800">
                  {formatLines(data.description?.dataInterface) ??
                    "Not specified."}
                </pre>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Functional Requirements
              </h2>
              <div className="space-y-6">
                {data.description?.requirements?.length ? (
                  data.description.requirements.map((group, index) => (
                    <div key={`${group.title}-${index}`}>
                      <h3 className="mb-2 font-medium text-slate-900">
                        {group.title}
                      </h3>
                      <ul className="ml-1 list-inside list-disc space-y-1.5 text-slate-700">
                        {group.items.map((item, itemIndex) => (
                          <li
                            key={`${item}-${itemIndex}`}
                            className={
                              group.isCritical
                                ? "font-medium text-red-600"
                                : undefined
                            }
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No requirements listed yet.
                  </p>
                )}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Example Interaction
              </h2>
              {data.description?.exampleInteraction ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-blue-900">
                        Input (User Action):
                      </span>
                      <p className="mt-1 text-slate-700">
                        {data.description.exampleInteraction.input}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-900">
                        State Transition 1 (Immediate):
                      </span>
                      <p className="mt-1 text-slate-700">
                        {data.description.exampleInteraction.immediate}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-900">
                        State Transition 2 (Async):
                      </span>
                      <div className="mt-1 space-y-2 text-slate-700">
                        <p>
                          Delay:{" "}
                          {data.description.exampleInteraction.async.delay}
                        </p>
                        <ul className="ml-4 list-inside list-disc space-y-1">
                          {data.description.exampleInteraction.async.cases.map(
                            (caseItem, caseIndex) => (
                              <li key={`${caseItem}-${caseIndex}`}>
                                {caseItem}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No example interaction provided yet.
                </p>
              )}
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Constraints
              </h2>
              {data.description?.requirements?.length ? (
                <ul className="ml-1 list-inside list-disc space-y-1.5 text-slate-700">
                  {data.description.requirements
                    .flatMap((group) => group.items)
                    .map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">
                  No constraints listed yet.
                </p>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Submission Evaluation
              </h2>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex flex-wrap gap-2">
                  <span className="min-w-35 font-medium text-slate-900">
                    Correctness:
                  </span>
                  <span>Check correctness against the requirements.</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="min-w-35 font-medium text-slate-900">
                    Performance:
                  </span>
                  <span>Meet the time and interaction limits.</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="min-w-35 font-medium text-slate-900">
                    AI Efficiency:
                  </span>
                  <span>Stay within the AI interaction budget.</span>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
