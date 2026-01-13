import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "~/trpc/server";

function getScoreTone(score: number) {
  if (score >= 90) return "text-emerald-600";
  if (score >= 75) return "text-amber-600";
  return "text-rose-600";
}

export default async function ProblemSubmissionsPage({
  params,
}: {
  params: Promise<{ problemId: string }>;
}) {
  const { problemId: problemIdParam } = await params;
  const problemId = Number(problemIdParam);
  if (!Number.isFinite(problemId)) {
    notFound();
  }

  const data = await api.judge.submissionsForProblem({ problemId });
  if (!data.problem) {
    notFound();
  }

  return (
    <div className="flex min-h-screen w-full justify-center bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.08),rgba(15,23,42,0)_60%)] px-6 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="bg-card ring-border/60 rounded-2xl border p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.2)] ring-1 backdrop-blur">
          <p className="text-xs font-semibold tracking-[0.4em] text-slate-500 uppercase">
            Problem {data.problem.id}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            {data.problem.name} submissions
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            Review past results, compare the analyzer scores, and open a
            submission for the full breakdown.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold tracking-[0.28em] text-slate-500 uppercase">
            <span className="rounded-full border border-slate-200/70 bg-white px-3 py-1">
              Total {data.submissions.length}
            </span>
            <span className="rounded-full border border-slate-200/70 bg-white px-3 py-1">
              Latest first
            </span>
          </div>
        </section>

        {data.submissions.length === 0 ? (
          <section className="bg-card ring-border/60 rounded-2xl border p-8 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.16)] ring-1 backdrop-blur">
            <p className="text-sm text-slate-600">
              No submissions yet. Submit a solution to see results here.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {data.submissions.map((submission) => {
              const analysis = submission.analysis;
              const buildScore = analysis?.buildScore?.score ?? null;
              const tokenEfficiency =
                analysis?.tokenEfficiency?.score ?? null;
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
                  className="group bg-card ring-border/60 relative overflow-hidden rounded-2xl border p-5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.16)] ring-1 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_26px_60px_-35px_rgba(15,23,42,0.2)]"
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
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Build score</span>
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
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Token efficiency
                    </span>
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
                    {analysis?.buildScore?.rationale ??
                      "Analyzer output unavailable for this submission."}
                  </p>
                  <div className="mt-4 text-xs font-semibold tracking-[0.3em] text-slate-500 uppercase">
                    View details
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
