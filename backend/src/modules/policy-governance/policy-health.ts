/**
 * Policy Health™ — pure scoring engine.
 * No DB calls. Import freely in server and client components.
 */

export const POLICY_HEALTH_COMPONENT_WEIGHTS = {
  reviewFreshness: 0.30,
  approvalStatus: 0.20,
  controlCoverage: 0.20,
  attestationCompletion: 0.15,
  frameworkMapping: 0.10,
  auditFindings: 0.05,
} as const;

export const POLICY_HEALTH_COMPONENT_LABELS: Record<keyof typeof POLICY_HEALTH_COMPONENT_WEIGHTS, string> = {
  reviewFreshness: "Review Freshness",
  approvalStatus: "Approval Status",
  controlCoverage: "Control Coverage",
  attestationCompletion: "Attestation Completion",
  frameworkMapping: "Framework Mapping",
  auditFindings: "Audit Findings",
};

export interface PolicyHealthInputs {
  /** Days since last review; null if never reviewed. */
  lastReviewDays: number | null;
  /** Current policy status. */
  status: string;
  /** Number of linked controls. */
  controlCount: number;
  /** 0–1: ratio of acknowledged / total assigned attestations. */
  attestationRate: number;
  /** Number of linked frameworks. */
  frameworkCount: number;
  /** Open audit findings referencing this policy. */
  openFindingCount: number;
}

export interface PolicyHealthBreakdown {
  score: number;
  components: {
    reviewFreshness: number;
    approvalStatus: number;
    controlCoverage: number;
    attestationCompletion: number;
    frameworkMapping: number;
    auditFindings: number;
  };
  level: PolicyHealthLevel;
  strengths: string[];
  concerns: string[];
}

export type PolicyHealthLevel =
  | "exceptional"
  | "healthy"
  | "strong"
  | "moderate"
  | "needs_attention"
  | "critical";

export const HEALTH_LEVEL_LABELS: Record<PolicyHealthLevel, string> = {
  exceptional: "Exceptional",
  healthy: "Healthy",
  strong: "Strong",
  moderate: "Moderate",
  needs_attention: "Needs Attention",
  critical: "Critical",
};

export const HEALTH_LEVEL_COLORS: Record<PolicyHealthLevel, string> = {
  exceptional: "text-emerald-700",
  healthy: "text-green-700",
  strong: "text-blue-700",
  moderate: "text-yellow-700",
  needs_attention: "text-orange-700",
  critical: "text-red-700",
};

export const HEALTH_LEVEL_BG: Record<PolicyHealthLevel, string> = {
  exceptional: "bg-emerald-100 border-emerald-200",
  healthy: "bg-green-100 border-green-200",
  strong: "bg-blue-100 border-blue-200",
  moderate: "bg-yellow-100 border-yellow-200",
  needs_attention: "bg-orange-100 border-orange-200",
  critical: "bg-red-100 border-red-200",
};

export function getHealthLevel(score: number): PolicyHealthLevel {
  if (score >= 95) return "exceptional";
  if (score >= 90) return "healthy";
  if (score >= 80) return "strong";
  if (score >= 70) return "moderate";
  if (score >= 60) return "needs_attention";
  return "critical";
}

export function computePolicyHealth(inputs: PolicyHealthInputs): PolicyHealthBreakdown {
  // Review Freshness — 30%
  let reviewFreshnessScore: number;
  if (inputs.lastReviewDays === null) {
    reviewFreshnessScore = 0;
  } else if (inputs.lastReviewDays <= 30) {
    reviewFreshnessScore = 100;
  } else if (inputs.lastReviewDays <= 90) {
    reviewFreshnessScore = 75;
  } else if (inputs.lastReviewDays <= 180) {
    reviewFreshnessScore = 50;
  } else if (inputs.lastReviewDays <= 365) {
    reviewFreshnessScore = 25;
  } else {
    reviewFreshnessScore = 0;
  }

  // Approval Status — 20%
  let approvalStatusScore: number;
  if (inputs.status === "published" || inputs.status === "approved") {
    approvalStatusScore = 100;
  } else if (inputs.status === "review") {
    approvalStatusScore = 50;
  } else if (inputs.status === "draft") {
    approvalStatusScore = 25;
  } else {
    // expired | archived | retired
    approvalStatusScore = 0;
  }

  // Control Coverage — 20%
  const controlCoverageScore = Math.min(inputs.controlCount * 20, 100);

  // Attestation Completion — 15%
  const attestationCompletionScore = Math.round(inputs.attestationRate * 100);

  // Framework Mapping — 10%
  const frameworkMappingScore = Math.min(inputs.frameworkCount * 33, 100);

  // Audit Findings — 5%
  let auditFindingsScore: number;
  if (inputs.openFindingCount === 0) {
    auditFindingsScore = 100;
  } else if (inputs.openFindingCount <= 2) {
    auditFindingsScore = 50;
  } else {
    auditFindingsScore = 0;
  }

  const score = Math.round(
    reviewFreshnessScore * POLICY_HEALTH_COMPONENT_WEIGHTS.reviewFreshness +
    approvalStatusScore * POLICY_HEALTH_COMPONENT_WEIGHTS.approvalStatus +
    controlCoverageScore * POLICY_HEALTH_COMPONENT_WEIGHTS.controlCoverage +
    attestationCompletionScore * POLICY_HEALTH_COMPONENT_WEIGHTS.attestationCompletion +
    frameworkMappingScore * POLICY_HEALTH_COMPONENT_WEIGHTS.frameworkMapping +
    auditFindingsScore * POLICY_HEALTH_COMPONENT_WEIGHTS.auditFindings
  );

  const components = {
    reviewFreshness: reviewFreshnessScore,
    approvalStatus: approvalStatusScore,
    controlCoverage: controlCoverageScore,
    attestationCompletion: attestationCompletionScore,
    frameworkMapping: frameworkMappingScore,
    auditFindings: auditFindingsScore,
  };

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (reviewFreshnessScore >= 75) strengths.push("Policy recently reviewed");
  else if (reviewFreshnessScore === 0 && inputs.lastReviewDays === null) concerns.push("Never reviewed");
  else if (reviewFreshnessScore <= 25) concerns.push("Review is significantly overdue");

  if (approvalStatusScore === 100) strengths.push("Policy is published and active");
  else if (approvalStatusScore === 0) concerns.push(`Policy status is ${inputs.status} — not active`);

  if (controlCoverageScore >= 80) strengths.push("Strong control linkage");
  else if (inputs.controlCount === 0) concerns.push("No controls linked to this policy");

  if (attestationCompletionScore >= 80) strengths.push("High attestation completion rate");
  else if (attestationCompletionScore < 50 && inputs.attestationRate > 0) concerns.push("Low attestation acknowledgement rate");

  if (frameworkMappingScore >= 66) strengths.push("Well-mapped to compliance frameworks");
  else if (inputs.frameworkCount === 0) concerns.push("Not linked to any framework");

  if (auditFindingsScore === 100) strengths.push("No open audit findings");
  else if (inputs.openFindingCount > 2) concerns.push(`${inputs.openFindingCount} open audit findings`);

  return { score, components, level: getHealthLevel(score), strengths, concerns };
}
