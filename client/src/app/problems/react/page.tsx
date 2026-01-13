"use client";

import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { api } from "~/trpc/react";

const difficultyStyles: Record<string, string> = {
  Easy: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  Hard: "border-rose-200 bg-rose-50 text-rose-700",
};
const difficultyOrder: Record<string, number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
};

const dateFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "UTC" });

function getSummary(text?: string) {
  if (!text) return "No description provided yet.";
  if (text.length <= 140) return text;
  return `${text.slice(0, 137)}...`;
}

export default function ProblemsByCategoryPage() {
  const { data, isLoading, error } = api.problem.getProblems.useQuery({
    category: "React",
  });

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100 px-6 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-slate-500 uppercase">
              Problems
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {"React"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Vibe coding React tailored challenges.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/problems">All categories</Link>
          </Button>
        </header>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="animate-pulse border-slate-200/70">
                <CardHeader>
                  <div className="h-4 w-2/3 rounded bg-slate-200" />
                  <div className="h-3 w-1/3 rounded bg-slate-100" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full rounded bg-slate-100" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-rose-200 bg-rose-50/60">
            <CardHeader>
              <CardTitle>Unable to load problems</CardTitle>
              <CardDescription>{error.message}</CardDescription>
            </CardHeader>
          </Card>
        ) : data?.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[...data]
              .sort((a, b) => {
                const aOrder = difficultyOrder[a.difficulty] ?? 99;
                const bOrder = difficultyOrder[b.difficulty] ?? 99;
                if (aOrder !== bOrder) return aOrder - bOrder;
                return a.name.localeCompare(b.name);
              })
              .map((problem) => (
              <Link
                key={problem.id}
                href={`/problems/${problem.category.toLowerCase()}/${problem.id}`}
                className="block"
              >
                <Card className="border-slate-200/70 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                  <CardHeader className="gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg">{problem.name}</CardTitle>
                      <Badge
                        variant="outline"
                        className={
                          difficultyStyles[problem.difficulty] ??
                          "border-slate-200 text-slate-600"
                        }
                      >
                        {problem.difficulty}
                      </Badge>
                    </div>
                    <CardDescription>
                      {getSummary(problem.description?.longDescription)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>Category: {problem.category}</span>
                      <span>•</span>
                      <span>
                        Updated {dateFormatter.format(problem.updatedAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-slate-200/70">
            <CardHeader>
              <CardTitle>No problems yet</CardTitle>
              <CardDescription>
                Add problems to this category to start practicing.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
