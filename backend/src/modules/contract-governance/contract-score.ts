/**
 * Contract Score™ — pure scoring engine.
 * No DB calls. Import freely in server and client components.
 */

export const CONTRACT_COMPONENT_WEIGHTS = {
  clauseCoverage: 0.25,
  obligationCompletion: 0.20,
  renewalReadiness: 0.15,
  riskExposure: 0.20,
  policyAlignment: 0.10,
  privacyCompliance: 0.10,
} as const;

export const CONTRACT_COMPONENT_LABELS: Record<keyof typeof CONTRACT_COMPONENT_WEIGHTS, string> = {
  clauseCoverage: "Clause Coverage",
  obligationCompletion: "Obligation Completion",
  renewalReadiness: "Renewal Readiness",
  riskExposure: "Risk Exposure",
  policyAlignment: "Policy Alignment",
  privacyCompliance: "Privacy Compliance",
};

export type ContractScoreInputs = {
  totalClauses: number;
  criticalClauses: number;
  totalObligations: number;
  completedObligations: number;
  waivedObligations: number;
  daysUntilExpiry: number | null;
  autoRenewal: boolean;
  linkedPolicies: number;
  contractType: string;
  hasDpaClause: boolean;
};

export type ContractTrustLevel =
  | "exceptional"
  | "healthy"
  | "strong"
  | "moderate"
  | "needs_attention"
  | "critical";

export const CONTRACT_TRUST_LEVEL_LABELS: Record<ContractTrustLevel, string> = {
  exceptional: "Exceptional",
  healthy: "Healthy",
  strong: "Strong",
  moderate: "Moderate",
  needs_attention: "Needs Attention",
  critical: "Critical",
};

export const CONTRACT_TRUST_LEVEL_COLORS: Record<ContractTrustLevel, string> = {
  exceptional: "text-emerald-400",
  healthy: "text-green-400",
  strong: "text-teal-400",
  moderate: "text-yellow-400",
  needs_attention: "text-orange-400",
  critical: "text-red-400",
};

export const CONTRACT_TRUST_LEVEL_BG: Record<ContractTrustLevel, string> = {
  exceptional: "bg-emerald-500/20 border-emerald-500/30",
  healthy: "bg-green-500/20 border-green-500/30",
  strong: "bg-teal-500/20 border-teal-500/30",
  moderate: "bg-yellow-500/20 border-yellow-500/30",
  needs_attention: "bg-orange-500/20 border-orange-500/30",
  critical: "bg-red-500/20 border-red-500/30",
};

export type ContractScoreBreakdown = {
  score: number;
  components: {
    clauseCoverage: number;
    obligationCompletion: number;
    renewalReadiness: number;
    riskExposure: number;
    policyAlignment: number;
    privacyCompliance: number;
  };
  level: ContractTrustLevel;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
};

const EXPECTED_CLAUSES = 12;

export function getContractTrustLevel(score: number): ContractTrustLevel {
  if (score >= 95) return "exceptional";
  if (score >= 90) return "healthy";
  if (score >= 80) return "strong";
  if (score >= 70) return "moderate";
  if (score >= 60) return "needs_attention";
  return "critical";
}

export function computeContractScore(inputs: ContractScoreInputs): ContractScoreBreakdown {
  const {
    totalClauses,
    criticalClauses,
    totalObligations,
    completedObligations,
    waivedObligations,
    daysUntilExpiry,
    autoRenewal,
    linkedPolicies,
    contractType,
    hasDpaClause,
  } = inputs;

  // clauseCoverage: ratio of clauses to expected (12), capped at 100
  const clauseCoverage = Math.min(100, Math.round((totalClauses / EXPECTED_CLAUSES) * 100));

  // obligationCompletion: completed / (total - waived), 100 if no active obligations
  const activeObligations = totalObligations - waivedObligations;
  const obligationCompletion =
    activeObligations <= 0
      ? 100
      : Math.min(100, Math.round((completedObligations / activeObligations) * 100));

  // renewalReadiness: 100 if expiry > 90 days away, linear decay to 0 at 0 days; 50 if auto-renewal
  let renewalReadiness: number;
  if (daysUntilExpiry === null) {
    renewalReadiness = 80;
  } else if (daysUntilExpiry <= 0) {
    renewalReadiness = autoRenewal ? 50 : 0;
  } else if (daysUntilExpiry >= 90) {
    renewalReadiness = 100;
  } else {
    const base = Math.round((daysUntilExpiry / 90) * 100);
    renewalReadiness = autoRenewal ? Math.min(100, base + 20) : base;
  }

  // riskExposure: invert critical clause ratio; 100 if no clauses
  const riskExposure =
    totalClauses === 0
      ? 100
      : Math.max(0, Math.round((1 - criticalClauses / totalClauses) * 100));

  // policyAlignment: linked policies count / 3, capped at 1.0
  const policyAlignment = Math.min(100, Math.round((linkedPolicies / 3) * 100));

  // privacyCompliance: DPA clause present or contract is DPA type → 100
  const privacyCompliance = hasDpaClause || contractType === "dpa" ? 100 : 0;

  const score = Math.round(
    clauseCoverage * CONTRACT_COMPONENT_WEIGHTS.clauseCoverage +
      obligationCompletion * CONTRACT_COMPONENT_WEIGHTS.obligationCompletion +
      renewalReadiness * CONTRACT_COMPONENT_WEIGHTS.renewalReadiness +
      riskExposure * CONTRACT_COMPONENT_WEIGHTS.riskExposure +
      policyAlignment * CONTRACT_COMPONENT_WEIGHTS.policyAlignment +
      privacyCompliance * CONTRACT_COMPONENT_WEIGHTS.privacyCompliance
  );

  const level = getContractTrustLevel(score);

  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: string[] = [];

  if (clauseCoverage >= 80) {
    strengths.push("Good clause coverage across key areas");
  } else {
    concerns.push(`Only ${totalClauses} of ${EXPECTED_CLAUSES} expected clauses present`);
    recommendations.push("Add missing standard clauses (privacy, security, termination, renewal)");
  }

  if (obligationCompletion >= 80) {
    strengths.push("Obligations well-tracked and completed");
  } else {
    const pending = activeObligations - completedObligations;
    concerns.push(`${pending} open obligation${pending !== 1 ? "s" : ""} not yet completed`);
    recommendations.push("Review and complete pending contractual obligations");
  }

  if (renewalReadiness >= 80) {
    strengths.push("Renewal timeline is healthy");
  } else if (daysUntilExpiry !== null && daysUntilExpiry <= 30) {
    concerns.push(`Contract expires in ${daysUntilExpiry} days`);
    recommendations.push("Initiate renewal negotiations immediately");
  } else {
    concerns.push("Contract renewal visibility is low");
    recommendations.push("Set renewal date and configure notice period");
  }

  if (riskExposure >= 80) {
    strengths.push("Low critical clause risk exposure");
  } else {
    concerns.push(`${criticalClauses} critical-risk clause${criticalClauses !== 1 ? "s" : ""} identified`);
    recommendations.push("Review and negotiate critical clauses with legal counsel");
  }

  if (policyAlignment >= 60) {
    strengths.push("Contract aligned with internal policies");
  } else {
    concerns.push("Contract not mapped to organisational policies");
    recommendations.push("Link relevant policies to ensure compliance alignment");
  }

  if (privacyCompliance >= 80) {
    strengths.push("Privacy and data protection provisions in place");
  } else {
    concerns.push("No DPA clause or Data Processing Agreement found");
    recommendations.push("Add data processing agreement (DPA) clause for DPDP/GDPR compliance");
  }

  return {
    score,
    components: {
      clauseCoverage,
      obligationCompletion,
      renewalReadiness,
      riskExposure,
      policyAlignment,
      privacyCompliance,
    },
    level,
    strengths,
    concerns,
    recommendations,
  };
}
