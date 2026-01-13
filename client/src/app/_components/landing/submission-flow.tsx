import Link from "next/link";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

const steps = [
  {
    title: "Custom isolated build",
    description:
      "Your submission is containerized in a clean, isolated runtime.",
  },
  {
    title: "Build logs captured",
    description:
      "Every compile, install, and runtime log is streamed and recorded.",
  },
  {
    title: "Build log analysis",
    description:
      "AI reviews the logs to surface failures, risks, and fixes fast.",
  },
  {
    title: "Chat history analysis",
    description:
      "Your AI chat context is analyzed for decision quality and clarity.",
  },
];

const highlights = [
  {
    label: "Isolated by design",
    detail: "Each submission runs in its own sandboxed build pod.",
  },
  {
    label: "Evidence-based feedback",
    detail: "Logs + chat history drive precise, actionable insights.",
  },
  {
    label: "Seconds, not minutes",
    detail: "Automated builds keep the feedback loop tight.",
  },
];

export default function SubmissionFlow() {
  return (
    <section
      id="submission-flow"
      className="text-foreground relative w-full scroll-mt-24 px-6 py-16 sm:py-20"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-slate-50 via-white to-slate-100" />
      <div className="pointer-events-none absolute -left-10 top-10 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl motion-safe:animate-pulse" />
      <div className="pointer-events-none absolute bottom-8 right-0 h-40 w-40 rounded-full bg-indigo-200/40 blur-3xl motion-safe:animate-pulse" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 text-left">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700/80">
              Submission flow
            </p>
            <h2 className="text-4xl font-black tracking-tight text-balance text-slate-900 sm:text-5xl">
              Ship once. We handle the rest.
            </h2>
            <p className="max-w-2xl text-base text-pretty text-slate-600 sm:text-lg">
              When you submit a solution, Promptly spins up a custom isolated
              build, captures the logs, and analyzes both the build output and
              your chat history for instant, responsible feedback.
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/problems">Start Solving</Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map((step, index) => (
              <Card
                key={step.title}
                className="group border-slate-200/80 bg-white/90 text-slate-900 shadow-lg shadow-slate-200/60 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-cyan-300/60"
              >
                <CardContent className="flex h-full flex-col gap-4 p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-slate-50 text-xs font-black text-slate-700">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/90 p-6 text-slate-900 shadow-xl shadow-slate-200/60">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              What happens on submit
            </p>
            <div className="space-y-4">
              {highlights.map((highlight) => (
                <div key={highlight.label} className="space-y-1">
                  <p className="text-base font-semibold text-slate-900">
                    {highlight.label}
                  </p>
                  <p className="text-sm text-slate-600">
                    {highlight.detail}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-auto rounded-2xl border border-cyan-200/70 bg-cyan-50 px-4 py-3 text-xs font-semibold text-cyan-900">
              You ship a solution. We verify it in isolation and explain it.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
