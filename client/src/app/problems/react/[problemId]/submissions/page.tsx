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
  params: { problemId: string };
}) {
  const problemId = Number(params.problemId);
  if (!Number.isFinite(problemId)) {
    notFound();
  }

  const data = await api.judge.submissionsForProblem({ problemId });
  if (!data.problem) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
            Problem {data.problem.id}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {data.problem.name} submissions
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">
            Review past results and open a submission for the full analyzer
            report.
          </p>
        </section>

        {data.submissions.length === 0 ? (
          <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">
              No submissions yet. Submit a solution to see results here.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {data.submissions.map((submission) => {
              const analysis = submission.analysis;
              const scores = analysis
                ? [
                    analysis.codeQuality.score,
                    analysis.functionality.score,
                    analysis.productionAbility.score,
                    analysis.chatHistory.score,
                  ]
                : [];
              const averageScore =
                scores.length > 0
                  ? Math.round(
                      scores.reduce((sum, value) => sum + value, 0) /
                        scores.length,
                    )
                  : null;
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
                  className="group rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
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
                    <span className="text-muted-foreground">Average score</span>
                    <span
                      className={`font-semibold ${
                        averageScore === null
                          ? "text-slate-500"
                          : getScoreTone(averageScore)
                      }`}
                    >
                      {averageScore ?? "N/A"}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-3 text-xs">
                    {analysis?.overallVerdict
                      ? analysis.overallVerdict
                      : "Analyzer output unavailable for this submission."}
                  </p>
                  <div className="mt-4 text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
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
