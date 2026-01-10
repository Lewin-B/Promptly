export type SubmissionStage = "tests" | "deploy" | "analysis" | "done";

export interface SubmissionProgressState {
  stage: SubmissionStage;
  errorMessage: string | null;
  updatedAt: number;
}

const submissionProgressStore = new Map<string, SubmissionProgressState>();

export function updateSubmissionProgress(
  submissionId: string,
  stage: SubmissionStage,
  errorMessage: string | null = null,
) {
  submissionProgressStore.set(submissionId, {
    stage,
    errorMessage,
    updatedAt: Date.now(),
  });
}

export function getSubmissionProgress(submissionId: string) {
  return submissionProgressStore.get(submissionId) ?? null;
}

export function clearSubmissionProgress(submissionId: string) {
  submissionProgressStore.delete(submissionId);
}
