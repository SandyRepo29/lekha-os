/**
 * Organizational Trust Score™ — pure scoring engine.
 * No DB imports. Safe to import from server and client.
 */

export type OrgTrustLevel =
  | "exceptional"    // 95–100
  | "trusted"        // 90–94
  | "strong"         // 80–89
  | "moderate"       // 70–79
  | "needs_attention"// 60–69
  | "critical";      // 0–59

export type OrgTrustInputs = {
  // Vendor Trust (25%) — average vendor trust score
  avgVendorTrustScore: number;      // 0–100, 0 if no scored vendors
  scoredVendorCount: number;

  // Risk Posture (25%)
  criticalRisks: number;
  highRisks: number;                // inherentScore 12–19
  mediumRisks: number;              // inherentScore < 12
  activeRiskCount: number;          // non-closed/archived
  totalRiskCount: number;

  // Control Health (20%) — average of controls.health_score
  avgControlHealth: number;         // 0–100, 0 if no controls
  controlCount: number;
  weakControlCount: number;         // health < 60

  // Audit Readiness (15%)
  completedAudits: number;
  totalAudits: number;
  openCriticalFindings: number;
  openHighFindings: number;

  // Compliance Coverage (15%) — average readiness across frameworks
  avgFrameworkReadiness: number;    // 0–100, 0 if no frameworks
  frameworkCount: number;
};

export type OrgTrustBreakdown = {
  overall: number;
  vendorTrust: number;
  riskPosture: number;
  controlHealth: number;
  auditReadiness: number;
  complianceCoverage: number;
  level: OrgTrustLevel;
  drivers: string[];     // positive contributors
  detractors: string[];  // negative contributors
};

export function getOrgTrustLevel(score: number): OrgTrustLevel {
  if (score >= 95) return "exceptional";
  if (score >= 90) return "trusted";
  if (score >= 80) return "strong";
  if (score >= 70) return "moderate";
  if (score >= 60) return "needs_attention";
  return "critical";
}

export const ORG_TRUST_LEVEL_LABELS: Record<OrgTrustLevel, string> = {
  exceptional: "Exceptional",
  trusted: "Trusted",
  strong: "Strong",
  moderate: "Moderate",
  needs_attention: "Needs Attention",
  critical: "Critical",
};

export const ORG_TRUST_LEVEL_COLORS: Record<OrgTrustLevel, string> = {
  exceptional: "text-emerald-400",
  trusted: "text-emerald-400",
  strong: "text-green-400",
  moderate: "text-yellow-400",
  needs_attention: "text-amber-400",
  critical: "text-red-400",
};

export const ORG_TRUST_LEVEL_BG: Record<OrgTrustLevel, string> = {
  exceptional: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  trusted: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  strong: "bg-green-500/10 border-green-500/30 text-green-400",
  moderate: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  needs_attention: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  critical: "bg-red-500/10 border-red-500/30 text-red-400",
};

export const ORG_TRUST_COMPONENT_WEIGHTS = {
  vendorTrust: 25,
  riskPosture: 25,
  controlHealth: 20,
  auditReadiness: 15,
  complianceCoverage: 15,
};

export const ORG_TRUST_COMPONENT_LABELS = {
  vendorTrust: "Vendor Trust",
  riskPosture: "Risk Posture",
  controlHealth: "Control Health",
  auditReadiness: "Audit Readiness",
  complianceCoverage: "Compliance Coverage",
};

// ── Component computations ────────────────────────────────────────────────────

function computeVendorTrust(i: OrgTrustInputs): number {
  if (i.scoredVendorCount === 0) return 50; // no data yet
  return Math.max(0, Math.min(100, Math.round(i.avgVendorTrustScore)));
}

function computeRiskPosture(i: OrgTrustInputs): number {
  if (i.totalRiskCount === 0) return 80; // no risks identified = moderate unknown
  if (i.activeRiskCount === 0) return 95; // all closed/archived
  let score = 100;
  score -= Math.min(i.criticalRisks * 18, 65);
  score -= Math.min(i.highRisks * 8, 25);
  score -= Math.min(i.mediumRisks * 3, 15);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function computeControlHealth(i: OrgTrustInputs): number {
  if (i.controlCount === 0) return 40; // no controls = high concern
  return Math.max(0, Math.min(100, Math.round(i.avgControlHealth)));
}

function computeAuditReadiness(i: OrgTrustInputs): number {
  if (i.totalAudits === 0) return 50; // never audited
  let score = 100;
  score -= Math.min(i.openCriticalFindings * 20, 60);
  score -= Math.min(i.openHighFindings * 8, 25);
  // Reward completion ratio
  if (i.totalAudits > 0) {
    const completionRatio = i.completedAudits / i.totalAudits;
    if (completionRatio < 0.5) score -= 15;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function computeComplianceCoverage(i: OrgTrustInputs): number {
  if (i.frameworkCount === 0) return 30; // no frameworks = low coverage
  return Math.max(0, Math.min(100, Math.round(i.avgFrameworkReadiness)));
}

function buildDrivers(i: OrgTrustInputs, c: Omit<OrgTrustBreakdown, "level" | "drivers" | "detractors">): string[] {
  const d: string[] = [];
  if (c.vendorTrust >= 80) d.push("Strong vendor trust portfolio");
  if (i.activeRiskCount === 0 && i.totalRiskCount > 0) d.push("All risks resolved or accepted");
  if (c.controlHealth >= 80) d.push("Healthy control framework");
  if (c.auditReadiness >= 80) d.push("Strong audit posture");
  if (c.complianceCoverage >= 75) d.push("High compliance framework coverage");
  if (i.openCriticalFindings === 0 && i.totalAudits > 0) d.push("No open critical findings");
  if (i.weakControlCount === 0 && i.controlCount > 0) d.push("No weak controls detected");
  return d;
}

function buildDetractors(i: OrgTrustInputs, c: Omit<OrgTrustBreakdown, "level" | "drivers" | "detractors">): string[] {
  const d: string[] = [];
  if (i.scoredVendorCount === 0) d.push("No vendor trust scores computed");
  if (i.criticalRisks > 0) d.push(`${i.criticalRisks} critical open risk${i.criticalRisks > 1 ? "s" : ""}`);
  if (i.weakControlCount > 0) d.push(`${i.weakControlCount} weak control${i.weakControlCount > 1 ? "s" : ""} (health < 60)`);
  if (i.openCriticalFindings > 0) d.push(`${i.openCriticalFindings} open critical audit finding${i.openCriticalFindings > 1 ? "s" : ""}`);
  if (i.frameworkCount === 0) d.push("No compliance frameworks configured");
  if (i.controlCount === 0) d.push("No controls in Control Center™");
  if (c.vendorTrust < 60 && i.scoredVendorCount > 0) d.push("Low average vendor trust score");
  if (c.complianceCoverage < 50) d.push("Low compliance framework readiness");
  return d;
}

// ── Main entry point ──────────────────────────────────────────────────────────

export function computeOrgTrustScore(inputs: OrgTrustInputs): OrgTrustBreakdown {
  const vendorTrust = computeVendorTrust(inputs);
  const riskPosture = computeRiskPosture(inputs);
  const controlHealth = computeControlHealth(inputs);
  const auditReadiness = computeAuditReadiness(inputs);
  const complianceCoverage = computeComplianceCoverage(inputs);

  const overall = Math.round(
    vendorTrust       * 0.25 +
    riskPosture       * 0.25 +
    controlHealth     * 0.20 +
    auditReadiness    * 0.15 +
    complianceCoverage * 0.15
  );

  const components = { overall, vendorTrust, riskPosture, controlHealth, auditReadiness, complianceCoverage };

  return {
    ...components,
    level: getOrgTrustLevel(overall),
    drivers: buildDrivers(inputs, components),
    detractors: buildDetractors(inputs, components),
  };
}
