/**
 * Critical Asset Score™ — pure governance coverage engine.
 * No DB imports. Measures how well-governed an asset is given its criticality.
 * Higher = better governed / adequate coverage. Lower = needs governance attention.
 */

export type CriticalAssetInputs = {
  criticality: string;            // mission_critical | critical | high | medium | low
  containsPii: boolean;
  containsSensitive: boolean;
  dataClass: string | null;       // restricted | confidential | internal | public
  linkedVendorCount: number;      // vendor dependencies
  avgVendorTrustScore: number | null; // avg trust score of linked vendors (null = no vendors)
  linkedControlsCount: number;    // controls protecting this asset
  linkedRisksCount: number;       // active risks impacting this asset
  complianceScopeCount: number;   // compliance frameworks this asset is in scope for
  linkedRegulationsCount: number; // regulations linked to this asset
  lastReviewDaysAgo: number | null; // days since last review (null = never reviewed)
};

export type CriticalAssetLevel =
  | "excellent"   // 85–100
  | "good"        // 70–84
  | "monitor"     // 55–69
  | "at_risk"     // 40–54
  | "critical";   // 0–39

export type CriticalAssetBreakdown = {
  overall: number;
  controlCoverage: number;      // 30% — controls protecting the asset
  complianceCoverage: number;   // 20% — compliance & regulatory coverage
  trustExposure: number;        // 20% — vendor trust exposure
  vendorConcentration: number;  // 15% — vendor dependency risk
  riskBurden: number;           // 10% — active risks impact
  governanceFreshness: number;  // 5% — last review recency
  level: CriticalAssetLevel;
  strengths: string[];
  concerns: string[];
};

export function getCriticalAssetLevel(score: number): CriticalAssetLevel {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "monitor";
  if (score >= 40) return "at_risk";
  return "critical";
}

export const CRITICAL_ASSET_LABELS: Record<CriticalAssetLevel, string> = {
  excellent: "Excellent",
  good:      "Good",
  monitor:   "Monitor",
  at_risk:   "At Risk",
  critical:  "Critical",
};

export const CRITICAL_ASSET_COLORS: Record<CriticalAssetLevel, string> = {
  excellent: "text-emerald-400",
  good:      "text-green-400",
  monitor:   "text-amber-400",
  at_risk:   "text-orange-400",
  critical:  "text-red-400",
};

export const CRITICAL_ASSET_BG: Record<CriticalAssetLevel, string> = {
  excellent: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  good:      "bg-green-500/10 border-green-500/30 text-green-400",
  monitor:   "bg-amber-500/10 border-amber-500/30 text-amber-400",
  at_risk:   "bg-orange-500/10 border-orange-500/30 text-orange-400",
  critical:  "bg-red-500/10 border-red-500/30 text-red-400",
};

export const CRITICAL_ASSET_COMPONENT_WEIGHTS: Record<string, number> = {
  controlCoverage:      30,
  complianceCoverage:   20,
  trustExposure:        20,
  vendorConcentration:  15,
  riskBurden:           10,
  governanceFreshness:   5,
};

export const CRITICAL_ASSET_COMPONENT_LABELS: Record<string, string> = {
  controlCoverage:     "Control Coverage",
  complianceCoverage:  "Compliance Coverage",
  trustExposure:       "Trust Exposure",
  vendorConcentration: "Vendor Concentration",
  riskBurden:          "Risk Burden",
  governanceFreshness: "Governance Freshness",
};

// ── Criticality sensitivity multiplier ───────────────────────────────────────

function criticalityMultiplier(criticality: string): number {
  switch (criticality) {
    case "mission_critical": return 0.85;
    case "critical":         return 0.90;
    case "high":             return 0.95;
    default:                 return 1.00;
  }
}

// ── Component computations ────────────────────────────────────────────────────

function controlCoverageScore(i: CriticalAssetInputs): number {
  if (i.linkedControlsCount === 0) return 5;
  return Math.min(100, 20 + i.linkedControlsCount * 20);
}

function complianceCoverageScore(i: CriticalAssetInputs): number {
  const base = Math.min(60, i.complianceScopeCount * 20);
  const regs = Math.min(40, i.linkedRegulationsCount * 15);
  return Math.min(100, base + regs);
}

function trustExposureScore(i: CriticalAssetInputs): number {
  if (i.linkedVendorCount === 0) return 80; // no vendor dependency = less exposure risk
  const avgTrust = i.avgVendorTrustScore ?? 60;
  // Data sensitivity penalty: PII/restricted assets need higher vendor trust
  const dataPenalty = i.containsPii ? 10 : 0;
  return Math.max(0, Math.min(100, Math.round(avgTrust - dataPenalty)));
}

function vendorConcentrationScore(i: CriticalAssetInputs): number {
  if (i.linkedVendorCount === 0) return 90;
  if (i.linkedVendorCount === 1) return 60; // single vendor = concentration risk
  if (i.linkedVendorCount <= 3) return 80;
  return Math.max(40, 100 - i.linkedVendorCount * 8);
}

function riskBurdenScore(i: CriticalAssetInputs): number {
  if (i.linkedRisksCount === 0) return 100;
  return Math.max(0, 100 - i.linkedRisksCount * 25);
}

function governanceFreshnessScore(i: CriticalAssetInputs): number {
  if (i.lastReviewDaysAgo === null) return 10;
  if (i.lastReviewDaysAgo <= 30) return 100;
  if (i.lastReviewDaysAgo <= 90) return 80;
  if (i.lastReviewDaysAgo <= 180) return 60;
  if (i.lastReviewDaysAgo <= 365) return 40;
  return 10;
}

// ── Main entry point ──────────────────────────────────────────────────────────

export function computeCriticalAssetScore(inputs: CriticalAssetInputs): CriticalAssetBreakdown {
  const controlCoverage     = controlCoverageScore(inputs);
  const complianceCoverage  = complianceCoverageScore(inputs);
  const trustExposure       = trustExposureScore(inputs);
  const vendorConcentration = vendorConcentrationScore(inputs);
  const riskBurden          = riskBurdenScore(inputs);
  const governanceFreshness = governanceFreshnessScore(inputs);

  const raw = Math.round(
    controlCoverage     * 0.30 +
    complianceCoverage  * 0.20 +
    trustExposure       * 0.20 +
    vendorConcentration * 0.15 +
    riskBurden          * 0.10 +
    governanceFreshness * 0.05
  );

  // Critical/mission_critical assets face a higher bar
  const overall = Math.max(0, Math.min(100, Math.round(raw * criticalityMultiplier(inputs.criticality))));
  const level = getCriticalAssetLevel(overall);

  const strengths: string[] = [];
  if (controlCoverage >= 80) strengths.push(`${inputs.linkedControlsCount} control${inputs.linkedControlsCount !== 1 ? "s" : ""} protecting this asset`);
  if (complianceCoverage >= 70) strengths.push("Good compliance & regulatory coverage");
  if (trustExposure >= 80) strengths.push("Vendors have strong trust scores");
  if (riskBurden === 100) strengths.push("No active risks linked");
  if (governanceFreshness >= 80) strengths.push("Recently reviewed");

  const concerns: string[] = [];
  if (controlCoverage < 40) concerns.push("Insufficient controls for this asset");
  if (inputs.linkedControlsCount === 0) concerns.push("No controls linked — governance gap");
  if (riskBurden < 50) concerns.push(`${inputs.linkedRisksCount} active risk${inputs.linkedRisksCount !== 1 ? "s" : ""} impacting this asset`);
  if (inputs.containsPii && trustExposure < 70) concerns.push("PII asset with low vendor trust exposure");
  if (vendorConcentration < 60) concerns.push("High vendor concentration risk");
  if (governanceFreshness < 40) concerns.push("Asset not reviewed recently");
  if (complianceCoverage < 30) concerns.push("Asset not mapped to compliance frameworks");

  return {
    overall,
    controlCoverage,
    complianceCoverage,
    trustExposure,
    vendorConcentration,
    riskBurden,
    governanceFreshness,
    level,
    strengths,
    concerns,
  };
}
