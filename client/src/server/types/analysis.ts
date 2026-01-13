export interface AnalyzerResult {
  buildTime: string;
  buildScore: { score: number; rationale: string };
  tokenEfficiency: { score: number; rationale: string };
}
