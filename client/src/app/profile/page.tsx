"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Badge } from "~/components/ui/badge";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";

function getScoreTone(score: number) {
  if (score >= 90) return "text-emerald-600";
  if (score >= 75) return "text-amber-600";
  return "text-rose-600";
}

export default function ProfilePage() {
  const { data: session } = authClient.useSession();
  const user = session?.user ?? null;

  const {
    data: submissionsData,
    isLoading,
    error,
  } = api.judge.submissionsByUser.useQuery(undefined, {
    enabled: Boolean(user),
  });

  const problems = submissionsData?.problems;
  const problemGroups = useMemo(() => problems ?? [], [problems]);

  const stats = useMemo(() => {
    const totalSubmissions = problemGroups.reduce(
      (sum, group) => sum + group.submissions.length,
      0,
    );
    const successCount = problemGroups.reduce(
      (sum, group) =>
        sum +
        group.submissions.filter((submission) => submission.status === "success")
          .length,
      0,
    );
    const successRate =
      totalSubmissions > 0
        ? Math.round((successCount / totalSubmissions) * 100)
        : null;
    return {
      totalSubmissions,
      successCount,
      successRate,
      totalProblems: problemGroups.length,
    };
  }, [problemGroups]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.08),rgba(15,23,42,0)_60%)] px-6 py-10">
        <div className="mx-auto w-full max-w-4xl">
          <div className="bg-card ring-border/60 rounded-2xl border p-8 text-sm shadow-[0_20px_60px_-30px_rgba(15,23,42,0.2)] ring-1 backdrop-blur">
            <p className="text-slate-700">
              Sign in to see your submissions and progress by problem.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.08),rgba(15,23,42,0)_60%)] px-6 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="bg-card ring-border/60 rounded-2xl border p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.2)] ring-1 backdrop-blur">
          <p className="text-xs font-semibold tracking-[0.4em] text-slate-500 uppercase">
            Profile
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            {user.name ?? "Your"} submissions
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Review your submission history grouped by problem and dive into each
            result.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold tracking-[0.28em] text-slate-500 uppercase">
            <span className="rounded-full border border-slate-200/70 bg-white px-3 py-1">
              Problems {stats.totalProblems}
            </span>
            <span className="rounded-full border border-slate-200/70 bg-white px-3 py-1">
              Submissions {stats.totalSubmissions}
            </span>
            <span className="rounded-full border border-slate-200/70 bg-white px-3 py-1">
              Success rate{" "}
              {stats.successRate === null
                ? "N/A"
                : `${stats.successRate}%`}
            </span>
          </div>
        </section>

        {isLoading ? (
          <section className="bg-card ring-border/60 rounded-2xl border p-6 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.16)] ring-1 backdrop-blur">
            <div className="space-y-3">
              <div className="h-5 w-48 rounded bg-slate-200" />
              <div className="h-4 w-72 rounded bg-slate-100" />
              <div className="h-4 w-64 rounded bg-slate-100" />
            </div>
          </section>
        ) : error ? (
          <section className="bg-card ring-border/60 rounded-2xl border p-6 text-sm text-rose-600 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.16)] ring-1 backdrop-blur">
            Unable to load your submissions.
          </section>
        ) : problemGroups.length === 0 ? (
          <section className="bg-card ring-border/60 rounded-2xl border p-6 text-sm text-slate-600 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.16)] ring-1 backdrop-blur">
            No submissions yet. Solve a problem to see your results here.
          </section>
        ) : (
          problemGroups.map((group) => {
            return (
              <section
                key={group.problem.id}
                className="bg-card ring-border/60 rounded-2xl border p-6 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.16)] ring-1 backdrop-blur"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.3em] text-slate-500 uppercase">
                      {group.problem.category} · {group.problem.difficulty}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                      {group.problem.name}
                    </h2>
                  </div>
                  <Badge variant="secondary" className="gap-1 text-xs">
                    {group.submissions.length} submissions
                  </Badge>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {group.submissions.map((submission) => {
                    const buildScore =
                      submission.analysis?.buildScore?.score ?? null;
                    const tokenEfficiency =
                      submission.analysis?.tokenEfficiency?.score ?? null;
                    const statusTone =
                      submission.status === "success"
                        ? "text-emerald-600"
                        : "text-rose-600";
                    const statusBg =
                      submission.status === "success"
                        ? "bg-emerald-50"
                        : "bg-rose-50";

                    return (
                      <Link
                        key={submission.id}
                        href={`/submissions/${submission.id}`}
                        className="group bg-white/90 ring-border/60 relative overflow-hidden rounded-2xl border p-4 shadow-[0_14px_32px_-24px_rgba(15,23,42,0.16)] ring-1 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_22px_50px_-32px_rgba(15,23,42,0.2)]"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900">
                            Submission {submission.id}
                          </p>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone} ${statusBg}`}
                          >
                            {submission.status}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                          <span>Build score</span>
                          <span
                            className={`font-semibold ${
                              buildScore === null
                                ? "text-slate-500"
                                : getScoreTone(buildScore)
                            }`}
                          >
                            {buildScore ?? "N/A"}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                          <span>Token efficiency</span>
                          <span
                            className={`font-semibold ${
                              tokenEfficiency === null
                                ? "text-slate-500"
                                : getScoreTone(tokenEfficiency)
                            }`}
                          >
                            {tokenEfficiency ?? "N/A"}
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-slate-600">
                          {submission.analysis?.buildScore?.rationale ??
                            "Analyzer output unavailable for this submission."}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
