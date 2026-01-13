export interface AnalyzerResult {
  codeQuality: { score: number; rationale: string };
  functionality: { score: number; rationale: string };
  productionAbility: { score: number; rationale: string };
  chatHistory: { score: number; rationale: string };
  buildScore: { score: number; rationale: string };
  buildTime: string;
  tokenEfficiency: { score: number; rationale: string };
  overallVerdict: string;
}
