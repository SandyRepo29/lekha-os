/**
 * Platform Trust Score™ — 8-component universal organizational trust engine.
 * Pure function — no DB access, safe to import in server or client components.
 */

export interface PlatformTrustInputs {
  vendorHealth:     number; // avg vendor trust score 0-100
  complianceHealth: number; // avg framework readiness 0-100
  riskPosture:      number; // risk posture score 0-100
  controlHealth:    number; // avg control health 0-100
  auditReadiness:   number; // audit readiness score 0-100
  policyHealth:     number; // policy health proxy 0-100
  evidenceHealth:   number; // evidence health 0-100
  openFindings:     number; // 0-100 (penalized from finding counts)
}

export interface PlatformTrustBreakdown {
  score:      number;
  level:      PlatformTrustLevel;
  components: Record<keyof PlatformTrustInputs, number>;
  strengths:  string[];
  concerns:   string[];
}

export type PlatformTrustLevel =
  | "trusted"
  | "healthy"
  | "needs_attention"
  | "at_risk"
  | "critical";

export const PLATFORM_TRUST_WEIGHTS: Record<keyof PlatformTrustInputs, number> = {
  vendorHealth:     0.20,
  complianceHealth: 0.20,
  riskPosture:      0.15,
  controlHealth:    0.15,
  auditReadiness:   0.10,
  policyHealth:     0.10,
  evidenceHealth:   0.05,
  openFindings:     0.05,
};

export const PLATFORM_TRUST_LABELS: Record<keyof PlatformTrustInputs, string> = {
  vendorHealth:     "Vendor Health",
  complianceHealth: "Compliance Health",
  riskPosture:      "Risk Posture",
  controlHealth:    "Control Health",
  auditReadiness:   "Audit Readiness",
  policyHealth:     "Policy Health",
  evidenceHealth:   "Evidence Health",
  openFindings:     "Findings",
};

export const PLATFORM_TRUST_LEVEL_LABELS: Record<PlatformTrustLevel, string> = {
  trusted:         "Trusted",
  healthy:         "Healthy",
  needs_attention: "Needs Attention",
  at_risk:         "At Risk",
  critical:        "Critical",
};

export const PLATFORM_TRUST_LEVEL_COLORS: Record<PlatformTrustLevel, string> = {
  trusted:         "text-emerald-400",
  healthy:         "text-blue-400",
  needs_attention: "text-amber-400",
  at_risk:         "text-orange-400",
  critical:        "text-red-400",
};

export const PLATFORM_TRUST_LEVEL_BG: Record<PlatformTrustLevel, string> = {
  trusted:         "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  healthy:         "bg-blue-500/10 border-blue-500/20 text-blue-400",
  needs_attention: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  at_risk:         "bg-orange-500/10 border-orange-500/20 text-orange-400",
  critical:        "bg-red-500/10 border-red-500/20 text-red-400",
};

export const PLATFORM_TRUST_SCORE_BAR: Record<PlatformTrustLevel, string> = {
  trusted:         "bg-emerald-500",
  healthy:         "bg-blue-500",
  needs_attention: "bg-amber-500",
  at_risk:         "bg-orange-500",
  critical:        "bg-red-500",
};

export function getPlatformTrustLevel(score: number): PlatformTrustLevel {
  if (score >= 90) return "trusted";
  if (score >= 75) return "healthy";
  if (score >= 60) return "needs_attention";
  if (score >= 40) return "at_risk";
  return "critical";
}

/** Convert raw finding counts to a 0-100 findings health score. */
export function findingsToScore(counts: {
  critical: number;
  high: number;
  medium: number;
  low: number;
}): number {
  const penalty = counts.critical * 10 + counts.high * 4 + counts.medium * 1.5 + counts.low * 0.5;
  return Math.max(0, Math.round(100 - penalty));
}

/** Derive risk posture score from risk dashboard metrics. */
export function riskMetricsToScore(metrics: {
  total: number;
  critical: number;
  open: number;
  mitigating: number;
}): number {
  if (metrics.total === 0) return 85;
  const criticalPenalty = metrics.critical * 8;
  const openRatio = metrics.open / metrics.total;
  return Math.max(0, Math.round(100 - criticalPenalty - openRatio * 30));
}

export function computePlatformTrustScore(inputs: PlatformTrustInputs): PlatformTrustBreakdown {
  const w = PLATFORM_TRUST_WEIGHTS;
  const score = Math.round(
    inputs.vendorHealth     * w.vendorHealth     +
    inputs.complianceHealth * w.complianceHealth +
    inputs.riskPosture      * w.riskPosture      +
    inputs.controlHealth    * w.controlHealth    +
    inputs.auditReadiness   * w.auditReadiness   +
    inputs.policyHealth     * w.policyHealth     +
    inputs.evidenceHealth   * w.evidenceHealth   +
    inputs.openFindings     * w.openFindings
  );

  const level = getPlatformTrustLevel(score);
  const components = { ...inputs } as Record<keyof PlatformTrustInputs, number>;

  const strengths = (Object.entries(components) as [keyof PlatformTrustInputs, number][])
    .filter(([, v]) => v >= 80)
    .map(([k]) => PLATFORM_TRUST_LABELS[k]);

  const concerns = (Object.entries(components) as [keyof PlatformTrustInputs, number][])
    .filter(([, v]) => v < 65)
    .sort(([, a], [, b]) => a - b)
    .map(([k]) => PLATFORM_TRUST_LABELS[k]);

  return { score, level, components, strengths, concerns };
}
