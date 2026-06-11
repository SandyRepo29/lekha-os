/**
 * Pure, client-safe benchmark scoring engine.
 * No DB imports — usable in both server and client contexts.
 */

export type BenchmarkCategory =
  | "organizational_trust"
  | "vendor_trust"
  | "risk_posture"
  | "control_health"
  | "audit_readiness"
  | "compliance_coverage"
  | "privacy_trust"
  | "contract_trust"
  | "issue_resolution"
  | "workflow_automation";

export type BenchmarkMaturityLevel =
  | "reactive"
  | "managed"
  | "defined"
  | "measured"
  | "optimized"
  | "trust_leader";

export type BenchmarkRankingLabel =
  | "top_1_percent"
  | "top_5_percent"
  | "top_10_percent"
  | "top_quartile"
  | "above_average"
  | "average"
  | "below_average"
  | "at_risk";

export interface BaselineData {
  avgScore: number;
  medianScore: number;
  topQuartile: number;
  topDecile: number;
  bottomQuartile: number;
  stdDev: number;
  sampleSize: number;
}

export interface CategoryBenchmark {
  category: BenchmarkCategory;
  orgScore: number | null;
  industryAvg: number;
  peerAvg: number;
  topQuartile: number;
  percentile: number | null;
  rankingLabel: BenchmarkRankingLabel;
  deltaVsIndustry: number | null;
}

export interface BenchmarkResult {
  overallScore: number | null;
  overallPercentile: number | null;
  maturityLevel: BenchmarkMaturityLevel;
  overallRanking: BenchmarkRankingLabel;
  categories: CategoryBenchmark[];
  strengths: BenchmarkCategory[];
  weaknesses: BenchmarkCategory[];
}

export const BENCHMARK_CATEGORY_LABELS: Record<BenchmarkCategory, string> = {
  organizational_trust: "Organizational Trust™",
  vendor_trust: "Vendor Trust™",
  risk_posture: "Risk Posture™",
  control_health: "Control Health™",
  audit_readiness: "Audit Readiness™",
  compliance_coverage: "Compliance Coverage™",
  privacy_trust: "Privacy Trust™",
  contract_trust: "Contract Trust™",
  issue_resolution: "Issue Resolution™",
  workflow_automation: "Workflow Automation™",
};

export const BENCHMARK_MATURITY_LABELS: Record<BenchmarkMaturityLevel, string> = {
  reactive: "Reactive",
  managed: "Managed",
  defined: "Defined",
  measured: "Measured",
  optimized: "Optimized",
  trust_leader: "Trust Leader",
};

export const BENCHMARK_RANKING_LABELS: Record<BenchmarkRankingLabel, string> = {
  top_1_percent: "Top 1%",
  top_5_percent: "Top 5%",
  top_10_percent: "Top 10%",
  top_quartile: "Top Quartile",
  above_average: "Above Average",
  average: "Average",
  below_average: "Below Average",
  at_risk: "At Risk",
};

export const BENCHMARK_MATURITY_COLORS: Record<BenchmarkMaturityLevel, string> = {
  reactive: "text-red-400",
  managed: "text-orange-400",
  defined: "text-yellow-400",
  measured: "text-blue-400",
  optimized: "text-green-400",
  trust_leader: "text-purple-400",
};

export const BENCHMARK_RANKING_COLORS: Record<BenchmarkRankingLabel, string> = {
  top_1_percent: "text-purple-400",
  top_5_percent: "text-blue-400",
  top_10_percent: "text-blue-400",
  top_quartile: "text-green-400",
  above_average: "text-green-400",
  average: "text-yellow-400",
  below_average: "text-orange-400",
  at_risk: "text-red-400",
};

export const ALL_BENCHMARK_CATEGORIES: BenchmarkCategory[] = [
  "organizational_trust",
  "vendor_trust",
  "risk_posture",
  "control_health",
  "audit_readiness",
  "compliance_coverage",
  "privacy_trust",
  "contract_trust",
  "issue_resolution",
  "workflow_automation",
];

/** Approximation of the standard normal CDF using Horner's method. */
function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422820 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t *
        (-0.3565638 +
          t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))));
  return z > 0 ? 1 - p : p;
}

/** Compute percentile (0–100) for a score given a normal distribution. */
export function computePercentile(
  score: number,
  avg: number,
  stdDev: number
): number {
  if (stdDev <= 0) return score >= avg ? 75 : 40;
  const z = (score - avg) / stdDev;
  return Math.round(normalCDF(z) * 100);
}

/** Map percentile to ranking label. */
export function getRankingLabel(percentile: number): BenchmarkRankingLabel {
  if (percentile >= 99) return "top_1_percent";
  if (percentile >= 95) return "top_5_percent";
  if (percentile >= 90) return "top_10_percent";
  if (percentile >= 75) return "top_quartile";
  if (percentile >= 60) return "above_average";
  if (percentile >= 40) return "average";
  if (percentile >= 25) return "below_average";
  return "at_risk";
}

/** Map overall percentile to governance maturity level. */
export function getMaturityLevel(percentile: number): BenchmarkMaturityLevel {
  if (percentile >= 99) return "trust_leader";
  if (percentile >= 90) return "optimized";
  if (percentile >= 75) return "measured";
  if (percentile >= 60) return "defined";
  if (percentile >= 40) return "managed";
  return "reactive";
}

/** Compute full benchmark result for an org given scores and baselines. */
export function computeBenchmark(
  orgScores: Partial<Record<BenchmarkCategory, number | null>>,
  baselines: Record<BenchmarkCategory, BaselineData>
): BenchmarkResult {
  const categories: CategoryBenchmark[] = ALL_BENCHMARK_CATEGORIES.map((cat) => {
    const orgScore = orgScores[cat] ?? null;
    const bl = baselines[cat] ?? {
      avgScore: 65, medianScore: 65, topQuartile: 80,
      topDecile: 90, bottomQuartile: 50, stdDev: 15, sampleSize: 100,
    };
    const percentile =
      orgScore !== null
        ? computePercentile(orgScore, bl.avgScore, bl.stdDev)
        : null;
    const rankingLabel = percentile !== null ? getRankingLabel(percentile) : "average";
    return {
      category: cat,
      orgScore,
      industryAvg: bl.avgScore,
      peerAvg: bl.medianScore,
      topQuartile: bl.topQuartile,
      percentile,
      rankingLabel,
      deltaVsIndustry: orgScore !== null ? orgScore - bl.avgScore : null,
    };
  });

  const scored = categories.filter((c) => c.orgScore !== null && c.percentile !== null);
  const overallScore = scored.length
    ? Math.round(scored.reduce((s, c) => s + c.orgScore!, 0) / scored.length)
    : null;
  const overallPercentile = scored.length
    ? Math.round(scored.reduce((s, c) => s + c.percentile!, 0) / scored.length)
    : null;
  const maturityLevel = overallPercentile !== null ? getMaturityLevel(overallPercentile) : "reactive";
  const overallRanking = overallPercentile !== null ? getRankingLabel(overallPercentile) : "average";

  const sortedByDelta = scored
    .filter((c) => c.deltaVsIndustry !== null)
    .sort((a, b) => b.deltaVsIndustry! - a.deltaVsIndustry!);
  const strengths = sortedByDelta.slice(0, 3).map((c) => c.category);
  const weaknesses = sortedByDelta.slice(-3).reverse().map((c) => c.category);

  return { overallScore, overallPercentile, maturityLevel, overallRanking, categories, strengths, weaknesses };
}
