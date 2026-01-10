import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";

export type SubmissionStage = "idle" | "tests" | "deploy" | "analysis" | "done";

const stageSteps = [
  {
    id: "tests",
    title: "Test generation",
    detail: "Generating personalized unit tests",
  },
  {
    id: "deploy",
    title: "Build & deploy",
    detail: "Building the container and running tests.",
  },
  {
    id: "analysis",
    title: "Analysis",
    detail: "Reviewing results and scoring your solution.",
  },
] as const;

const stageOrder = stageSteps.map((step) => step.id);

interface SubmissionProgressProps {
  stage: SubmissionStage;
  errorMessage: string | null;
  onDismiss: () => void;
}

export function SubmissionProgress({
  stage,
  errorMessage,
  onDismiss,
}: SubmissionProgressProps) {
  if (stage === "idle") return null;

  const currentStageIndex =
    stage === "done" ? stageOrder.length : stageOrder.indexOf(stage);

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-slate-200/70 p-6 shadow-xl">
        <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
          Submitting
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Running your submission
        </h2>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          The Judge is now building and testing your solution this may take a
          few minutes. Get some popcorn.
        </p>
        <div className="mt-6 space-y-3">
          {stageSteps.map((step, index) => {
            const isCompleted = stage === "done" || index < currentStageIndex;
            const isActive = index === currentStageIndex;
            const isError = Boolean(errorMessage) && isActive;
            return (
              <div
                key={step.id}
                className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/80 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {step.title}
                  </p>
                  <p className="text-muted-foreground text-xs">{step.detail}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase">
                  {isError ? (
                    <span className="text-rose-600">
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                  ) : isCompleted ? (
                    <span className="text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  ) : isActive ? (
                    <span className="text-slate-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </span>
                  ) : (
                    <span className="text-slate-300">
                      <Loader2 className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {errorMessage ? (
          <div className="mt-6 flex flex-col gap-3">
            <p className="text-sm text-rose-600">{errorMessage}</p>
            <Button type="button" variant="outline" onClick={onDismiss}>
              Dismiss
            </Button>
          </div>
        ) : stage === "done" ? (
          <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Submission complete.
          </div>
        ) : null}
      </div>
    </div>
  );
}
