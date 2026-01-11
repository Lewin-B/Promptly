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
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId: submissionIdParam } = await params;
  const submissionId = Number(submissionIdParam);
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
      ? Math.round(
          scores.reduce((sum, value) => sum + value, 0) / scores.length,
        )
      : null;
  const statusTone =
    submission.status === "success" ? "text-emerald-600" : "text-rose-600";
  const statusBg =
    submission.status === "success" ? "bg-emerald-50" : "bg-rose-50";

  return (
    <div className="flex min-h-screen w-full justify-center bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.08),rgba(15,23,42,0)_60%)] px-6 py-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <section className="bg-card ring-border/60 rounded-2xl border p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.2)] ring-1 backdrop-blur">
          <p className="text-xs font-semibold tracking-[0.4em] text-slate-500 uppercase">
            Submission {submission.id}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Submission results
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            Full analyzer report with scores, rationale, and the overall verdict
            for your latest solution.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500 uppercase">Problem ID</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {submission.problemId ?? "Unknown"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500 uppercase">Status</p>
              <p
                className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${statusTone} ${statusBg}`}
              >
                {submission.status}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500 uppercase">Average score</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {averageScore ?? "N/A"}
              </p>
            </div>
          </div>
        </section>

        {!analysis ? (
          <section className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-6">
            <h2 className="text-lg font-semibold text-amber-900">
              Analysis unavailable
            </h2>
            <p className="mt-2 text-sm text-amber-800">
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
                  className="bg-card ring-border/60 rounded-2xl border p-5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.16)] ring-1"
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
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {item.rationale}
                  </p>
                </div>
              ))}
            </section>

            <section className="bg-card ring-border/60 rounded-2xl border p-6 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.16)] ring-1">
              <h2 className="text-lg font-semibold text-slate-900">
                Overall verdict
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {analysis.overallVerdict}
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
