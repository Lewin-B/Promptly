export interface AnalyzerResult {
  codeQuality: { score: number; rationale: string };
  functionality: { score: number; rationale: string };
  productionAbility: { score: number; rationale: string };
  chatHistory: { score: number; rationale: string };
  overallVerdict: string;
}
