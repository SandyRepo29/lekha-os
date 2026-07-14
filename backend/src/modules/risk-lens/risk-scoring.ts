/** Pure risk scoring utilities — no DB imports, safe for client components. */

export type RiskScoreLevel = "low" | "moderate" | "high" | "critical" | "severe";

export interface RiskScoreResult {
  score: number;
  level: RiskScoreLevel;
  color: string;
  priority: number; // 1 (highest) – 5 (lowest)
}

/** Compute inherent risk score from impact × likelihood (both 1–5). */
export function computeRiskScore(impact: number, likelihood: number): RiskScoreResult {
  const imp = Math.max(1, Math.min(5, impact));
  const lik = Math.max(1, Math.min(5, likelihood));
  const score = imp * lik;

  if (score <= 5) {
    return { score, level: "low", color: "#22c55e", priority: 5 };
  } else if (score <= 10) {
    return { score, level: "moderate", color: "#84cc16", priority: 4 };
  } else if (score <= 15) {
    return { score, level: "high", color: "#f59e0b", priority: 3 };
  } else if (score <= 20) {
    return { score, level: "critical", color: "#ef4444", priority: 2 };
  } else {
    return { score, level: "severe", color: "#7c3aed", priority: 1 };
  }
}

export function riskLevelLabel(level: RiskScoreLevel): string {
  const labels: Record<RiskScoreLevel, string> = {
    low: "Low",
    moderate: "Moderate",
    high: "High",
    critical: "Critical",
    severe: "Severe",
  };
  return labels[level];
}

export function scoreToLevel(score: number): RiskScoreLevel {
  if (score <= 5) return "low";
  if (score <= 10) return "moderate";
  if (score <= 15) return "high";
  if (score <= 20) return "critical";
  return "severe";
}

export const RISK_CATEGORY_LABELS: Record<string, string> = {
  operational: "Operational",
  cyber_security: "Cyber Security",
  compliance: "Compliance",
  vendor: "Vendor",
  privacy: "Privacy",
  financial: "Financial",
  legal: "Legal",
  strategic: "Strategic",
  technology: "Technology",
  business_continuity: "Business Continuity",
  third_party: "Third Party",
  regulatory: "Regulatory",
  custom: "Custom",
};

export const RISK_STATUS_LABELS: Record<string, string> = {
  identified: "Identified",
  under_assessment: "Under Assessment",
  open: "Open",
  mitigating: "Mitigating",
  accepted: "Accepted",
  transferred: "Transferred",
  closed: "Closed",
  archived: "Archived",
};

export const RISK_SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  vendor: "Vendor",
  audit_finding: "Audit Finding",
  compliance_gap: "Compliance Gap",
  control_failure: "Control Failure",
  policy_exception: "Policy Exception",
  ai_generated: "AI Generated",
  api: "API",
};

export const TREATMENT_STRATEGY_LABELS: Record<string, string> = {
  mitigate: "Mitigate",
  accept: "Accept",
  transfer: "Transfer",
  avoid: "Avoid",
  monitor: "Monitor",
};
