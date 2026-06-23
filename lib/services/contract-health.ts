/**
 * Contract Health Score — pure scoring engine.
 * No DB imports. Usable from server and client components.
 */

export type ContractHealthInputs = {
  isActive: boolean;
  daysUntilExpiry: number | null;    // null = no expiry date set
  openObligations: number;
  overdueObligations: number;
  totalObligations: number;
  legalExceptions: number;           // obligations with waived status (bypassed requirements)
  complianceScore: number;           // 0-100 vendor compliance score
  vendorRisk: string;                // "low"|"medium"|"high"|"critical"
};

export type ContractHealthLevel = "excellent" | "good" | "monitor" | "at_risk" | "critical";

export type ContractHealthBreakdown = {
  overall: number;
  contractStatus: number;       // 20% — active status + expiry proximity
  renewalStatus: number;        // 20% — days until expiry
  obligationHealth: number;     // 25% — open/overdue obligations
  legalRisk: number;            // 15% — exceptions
  complianceAlignment: number;  // 10% — vendor compliance score
  vendorRiskFactor: number;     // 10% — vendor risk adjustment
  level: ContractHealthLevel;
  strengths: string[];
  concerns: string[];
};

export function getContractHealthLevel(score: number): ContractHealthLevel {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "monitor";
  if (score >= 40) return "at_risk";
  return "critical";
}

export const CONTRACT_HEALTH_LABELS: Record<ContractHealthLevel, string> = {
  excellent: "Excellent",
  good:      "Good",
  monitor:   "Monitor",
  at_risk:   "At Risk",
  critical:  "Critical",
};

export const CONTRACT_HEALTH_COLORS: Record<ContractHealthLevel, string> = {
  excellent: "text-emerald-400",
  good:      "text-green-400",
  monitor:   "text-amber-400",
  at_risk:   "text-orange-400",
  critical:  "text-red-400",
};

export const CONTRACT_HEALTH_BG: Record<ContractHealthLevel, string> = {
  excellent: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  good:      "bg-green-500/10 border-green-500/30 text-green-400",
  monitor:   "bg-amber-500/10 border-amber-500/30 text-amber-400",
  at_risk:   "bg-orange-500/10 border-orange-500/30 text-orange-400",
  critical:  "bg-red-500/10 border-red-500/30 text-red-400",
};

export const CONTRACT_HEALTH_COMPONENT_WEIGHTS: Record<string, number> = {
  contractStatus:    20,
  renewalStatus:     20,
  obligationHealth:  25,
  legalRisk:         15,
  complianceAlignment: 10,
  vendorRiskFactor:  10,
};

export const CONTRACT_HEALTH_COMPONENT_LABELS: Record<string, string> = {
  contractStatus:    "Contract Status",
  renewalStatus:     "Renewal Status",
  obligationHealth:  "Obligations",
  legalRisk:         "Legal Risk",
  complianceAlignment: "Compliance",
  vendorRiskFactor:  "Vendor Risk",
};

// ── Component computations ────────────────────────────────────────────────────

function contractStatusScore(i: ContractHealthInputs): number {
  if (!i.isActive) return 20;
  if (i.daysUntilExpiry === null) return 80;
  if (i.daysUntilExpiry < 0) return 10;
  if (i.daysUntilExpiry <= 30) return 40;
  if (i.daysUntilExpiry <= 90) return 65;
  return 100;
}

function renewalStatusScore(i: ContractHealthInputs): number {
  if (i.daysUntilExpiry === null) return 100;
  if (i.daysUntilExpiry < 0) return 5;
  if (i.daysUntilExpiry <= 14) return 20;
  if (i.daysUntilExpiry <= 30) return 45;
  if (i.daysUntilExpiry <= 60) return 65;
  if (i.daysUntilExpiry <= 90) return 80;
  return 100;
}

function obligationHealthScore(i: ContractHealthInputs): number {
  if (i.totalObligations === 0) return 90;
  let score = 100;
  score -= Math.min(i.overdueObligations * 20, 60);
  if (i.totalObligations > 0) {
    const openRatio = i.openObligations / i.totalObligations;
    score -= Math.round(openRatio * 25);
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function legalRiskScore(i: ContractHealthInputs): number {
  if (i.legalExceptions === 0) return 100;
  return Math.max(0, 100 - i.legalExceptions * 25);
}

function complianceAlignmentScore(i: ContractHealthInputs): number {
  return Math.max(0, Math.min(100, i.complianceScore));
}

function vendorRiskFactorScore(i: ContractHealthInputs): number {
  switch (i.vendorRisk) {
    case "low":      return 100;
    case "medium":   return 80;
    case "high":     return 55;
    case "critical": return 25;
    default:         return 70;
  }
}

// ── Main entry point ──────────────────────────────────────────────────────────

export function computeContractHealth(inputs: ContractHealthInputs): ContractHealthBreakdown {
  const contractStatus      = contractStatusScore(inputs);
  const renewalStatus       = renewalStatusScore(inputs);
  const obligationHealth    = obligationHealthScore(inputs);
  const legalRisk           = legalRiskScore(inputs);
  const complianceAlignment = complianceAlignmentScore(inputs);
  const vendorRiskFactor    = vendorRiskFactorScore(inputs);

  const overall = Math.round(
    contractStatus      * 0.20 +
    renewalStatus       * 0.20 +
    obligationHealth    * 0.25 +
    legalRisk           * 0.15 +
    complianceAlignment * 0.10 +
    vendorRiskFactor    * 0.10
  );

  const level = getContractHealthLevel(overall);

  const strengths: string[] = [];
  if (inputs.isActive && (inputs.daysUntilExpiry === null || inputs.daysUntilExpiry > 90))
    strengths.push("Contract is active and not due for renewal");
  if (inputs.overdueObligations === 0 && inputs.totalObligations > 0)
    strengths.push("All obligations are current");
  if (inputs.legalExceptions === 0)
    strengths.push("No legal exceptions outstanding");
  if (inputs.vendorRisk === "low")
    strengths.push("Low-risk vendor relationship");
  if (complianceAlignment >= 80)
    strengths.push("Strong compliance alignment");

  const concerns: string[] = [];
  if (!inputs.isActive)
    concerns.push("Contract is inactive");
  if (inputs.daysUntilExpiry !== null && inputs.daysUntilExpiry < 0)
    concerns.push("Contract has expired");
  else if (inputs.daysUntilExpiry !== null && inputs.daysUntilExpiry <= 30)
    concerns.push(`Contract expires in ${inputs.daysUntilExpiry} day${inputs.daysUntilExpiry !== 1 ? "s" : ""}`);
  if (inputs.overdueObligations > 0)
    concerns.push(`${inputs.overdueObligations} overdue obligation${inputs.overdueObligations > 1 ? "s" : ""}`);
  if (inputs.legalExceptions > 0)
    concerns.push(`${inputs.legalExceptions} legal exception${inputs.legalExceptions > 1 ? "s" : ""} outstanding`);
  if (inputs.vendorRisk === "critical")
    concerns.push("Critical vendor risk level elevates contract exposure");

  return {
    overall,
    contractStatus,
    renewalStatus,
    obligationHealth,
    legalRisk,
    complianceAlignment,
    vendorRiskFactor,
    level,
    strengths,
    concerns,
  };
}
