import { notFound } from "next/navigation";
import { api } from "~/trpc/server";

function getScoreTone(score: number) {
  if (score >= 90) return "text-emerald-600";
  if (score >= 75) return "text-amber-600";
  return "text-rose-600";
}

export default async function SubmissionPage({
  params,
}: {
  params: { submissionId: string };
}) {
  const submissionId = Number(params.submissionId);
  if (!Number.isFinite(submissionId)) {
    notFound();
  }

  const submission = await api.judge.submission({ submissionId });
  if (!submission) {
    notFound();
  }

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
      ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
      : null;
  const statusTone =
    submission.status === "success" ? "text-emerald-600" : "text-rose-600";
  const statusBg =
    submission.status === "success" ? "bg-emerald-50" : "bg-rose-50";

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
            Submission {submission.id}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Submission results
          </h1>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-4">
              <p className="text-muted-foreground text-xs uppercase">
                Problem ID
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {submission.problemId ?? "Unknown"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-4">
              <p className="text-muted-foreground text-xs uppercase">Status</p>
              <p
                className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${statusTone} ${statusBg}`}
              >
                {submission.status}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-4">
              <p className="text-muted-foreground text-xs uppercase">
                Average score
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {averageScore ?? "N/A"}
              </p>
            </div>
          </div>
        </section>

        {!analysis ? (
          <section className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-6">
            <h2 className="text-lg font-semibold text-amber-800">
              Analysis unavailable
            </h2>
            <p className="mt-2 text-sm text-amber-700">
              We could not parse the analyzer output for this submission. Check
              back later or resubmit.
            </p>
          </section>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2">
              {[
                {
                  title: "Code quality",
                  score: analysis.codeQuality.score,
                  rationale: analysis.codeQuality.rationale,
                },
                {
                  title: "Functionality",
                  score: analysis.functionality.score,
                  rationale: analysis.functionality.rationale,
                },
                {
                  title: "Production ability",
                  score: analysis.productionAbility.score,
                  rationale: analysis.productionAbility.rationale,
                },
                {
                  title: "Chat history",
                  score: analysis.chatHistory.score,
                  rationale: analysis.chatHistory.rationale,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {item.title}
                    </h2>
                    <span
                      className={`text-lg font-semibold ${getScoreTone(item.score)}`}
                    >
                      {item.score}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                    {item.rationale}
                  </p>
                </div>
              ))}
            </section>

            <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Overall verdict
              </h2>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {analysis.overallVerdict}
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
