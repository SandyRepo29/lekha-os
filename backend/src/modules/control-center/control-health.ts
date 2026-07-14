/**
 * Control Health™ — pure scoring engine.
 * No DB calls. Import freely in server and client components.
 */

export const HEALTH_COMPONENT_WEIGHTS = {
  evidence: 0.30,
  testing: 0.25,
  audit: 0.15,
  policy: 0.10,
  freshness: 0.10,
  riskReduction: 0.10,
} as const;

export const HEALTH_COMPONENT_LABELS: Record<keyof typeof HEALTH_COMPONENT_WEIGHTS, string> = {
  evidence: "Evidence Coverage",
  testing: "Testing Results",
  audit: "Audit Performance",
  policy: "Policy Support",
  freshness: "Review Freshness",
  riskReduction: "Risk Reduction Impact",
};

export interface ControlHealthInputs {
  /** Number of approved/valid evidence items linked to this control. */
  approvedEvidenceCount: number;
  /** Total evidence items linked (including expired/draft). */
  totalEvidenceCount: number;
  /** Number of passed tests in the last 12 months. */
  passedTests: number;
  /** Total tests run in the last 12 months. */
  totalTests: number;
  /** Number of open audit findings linked to this control. */
  openFindings: number;
  /** Number of closed/resolved findings. */
  closedFindings: number;
  /** Number of approved policies supporting this control. */
  approvedPolicies: number;
  /** Total policies linked. */
  totalPolicies: number;
  /** Days since last review (null if never reviewed). */
  daysSinceReview: number | null;
  /** Number of linked risks in mitigating/accepted/closed state. */
  mitigatedRisks: number;
  /** Total linked risks. */
  totalRisks: number;
}

export interface ControlHealthBreakdown {
  overall: number;
  components: {
    evidence: number;
    testing: number;
    audit: number;
    policy: number;
    freshness: number;
    riskReduction: number;
  };
  level: ControlHealthLevel;
  strengths: string[];
  concerns: string[];
}

export type ControlHealthLevel =
  | "exceptional"
  | "healthy"
  | "strong"
  | "moderate"
  | "needs_attention"
  | "critical";

export const HEALTH_LEVEL_LABELS: Record<ControlHealthLevel, string> = {
  exceptional: "Exceptional",
  healthy: "Healthy",
  strong: "Strong",
  moderate: "Moderate",
  needs_attention: "Needs Attention",
  critical: "Critical",
};

export const HEALTH_LEVEL_COLORS: Record<ControlHealthLevel, string> = {
  exceptional: "text-emerald-700",
  healthy: "text-green-700",
  strong: "text-blue-700",
  moderate: "text-yellow-700",
  needs_attention: "text-orange-700",
  critical: "text-red-700",
};

export const HEALTH_LEVEL_BG: Record<ControlHealthLevel, string> = {
  exceptional: "bg-emerald-100 border-emerald-200",
  healthy: "bg-green-100 border-green-200",
  strong: "bg-blue-100 border-blue-200",
  moderate: "bg-yellow-100 border-yellow-200",
  needs_attention: "bg-orange-100 border-orange-200",
  critical: "bg-red-100 border-red-200",
};

export function getHealthLevel(score: number): ControlHealthLevel {
  if (score >= 95) return "exceptional";
  if (score >= 90) return "healthy";
  if (score >= 80) return "strong";
  if (score >= 70) return "moderate";
  if (score >= 60) return "needs_attention";
  return "critical";
}

export function computeControlHealth(inputs: ControlHealthInputs): ControlHealthBreakdown {
  // Evidence Coverage — 30%
  const evidenceScore = inputs.totalEvidenceCount === 0
    ? 0
    : Math.round((inputs.approvedEvidenceCount / inputs.totalEvidenceCount) * 100);

  // Testing Results — 25%
  const testingScore = inputs.totalTests === 0
    ? 50 // no test data → neutral, not penalised
    : Math.round((inputs.passedTests / inputs.totalTests) * 100);

  // Audit Performance — 15% (more open findings = lower score)
  const totalFindings = inputs.openFindings + inputs.closedFindings;
  const auditScore = totalFindings === 0
    ? 80 // no findings → mostly healthy baseline
    : Math.round((inputs.closedFindings / totalFindings) * 100);

  // Policy Support — 10%
  const policyScore = inputs.totalPolicies === 0
    ? 50
    : Math.round((inputs.approvedPolicies / inputs.totalPolicies) * 100);

  // Review Freshness — 10%
  let freshnessScore: number;
  if (inputs.daysSinceReview === null) {
    freshnessScore = 0;
  } else if (inputs.daysSinceReview <= 30) {
    freshnessScore = 100;
  } else if (inputs.daysSinceReview <= 90) {
    freshnessScore = 80;
  } else if (inputs.daysSinceReview <= 180) {
    freshnessScore = 60;
  } else if (inputs.daysSinceReview <= 365) {
    freshnessScore = 40;
  } else {
    freshnessScore = 10;
  }

  // Risk Reduction Impact — 10%
  const riskReductionScore = inputs.totalRisks === 0
    ? 70 // not linked to risks → neutral
    : Math.round((inputs.mitigatedRisks / inputs.totalRisks) * 100);

  const overall = Math.round(
    evidenceScore * HEALTH_COMPONENT_WEIGHTS.evidence +
    testingScore * HEALTH_COMPONENT_WEIGHTS.testing +
    auditScore * HEALTH_COMPONENT_WEIGHTS.audit +
    policyScore * HEALTH_COMPONENT_WEIGHTS.policy +
    freshnessScore * HEALTH_COMPONENT_WEIGHTS.freshness +
    riskReductionScore * HEALTH_COMPONENT_WEIGHTS.riskReduction
  );

  const components = { evidence: evidenceScore, testing: testingScore, audit: auditScore, policy: policyScore, freshness: freshnessScore, riskReduction: riskReductionScore };

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (evidenceScore >= 80) strengths.push("Strong evidence coverage");
  else if (evidenceScore < 50) concerns.push("Insufficient evidence linked");

  if (testingScore >= 80) strengths.push("Testing results are positive");
  else if (inputs.totalTests === 0) concerns.push("No testing records found");
  else if (testingScore < 50) concerns.push("Recent test failures detected");

  if (auditScore >= 80) strengths.push("Audit findings well resolved");
  else if (inputs.openFindings > 0) concerns.push(`${inputs.openFindings} open audit finding${inputs.openFindings > 1 ? "s" : ""}`);

  if (policyScore >= 80) strengths.push("Well-supported by approved policies");
  else if (inputs.totalPolicies === 0) concerns.push("No policies linked");

  if (freshnessScore >= 80) strengths.push("Recently reviewed");
  else if (freshnessScore <= 20) concerns.push("Review is overdue");

  if (riskReductionScore >= 70) strengths.push("Effectively reducing linked risks");
  else if (inputs.totalRisks > 0 && riskReductionScore < 50) concerns.push("Linked risks not yet mitigated");

  return { overall, components, level: getHealthLevel(overall), strengths, concerns };
}
