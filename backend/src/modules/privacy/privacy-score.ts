/**
 * Privacy Trust Score™ — pure scoring engine.
 * No DB calls. Import freely in server and client components.
 */

export const PRIVACY_SCORE_WEIGHTS = {
  inventory: 0.25,
  consent: 0.20,
  dsr: 0.15,
  retention: 0.15,
  risks: 0.15,
  controls: 0.10,
} as const;

export const PRIVACY_SCORE_LABELS: Record<keyof typeof PRIVACY_SCORE_WEIGHTS, string> = {
  inventory: "Data Inventory Coverage",
  consent: "Consent Coverage",
  dsr: "DSR Performance",
  retention: "Retention Compliance",
  risks: "Privacy Risks",
  controls: "Privacy Controls",
};

export type PrivacyScoreInputs = {
  totalAssets: number;
  classifiedAssets: number;
  activeConsents: number;
  totalConsents: number;
  expiredConsents: number;
  completedDsrs: number;
  totalDsrs: number;
  overdueDsrs: number;
  assetsWithRetentionPolicy: number;
  retentionViolations: number;
  openPrivacyRisks: number;
  criticalPrivacyRisks: number;
  totalPrivacyControls: number;
  effectivePrivacyControls: number;
};

export type PrivacyScoreBreakdown = {
  score: number;
  components: {
    inventory: number;
    consent: number;
    dsr: number;
    retention: number;
    risks: number;
    controls: number;
  };
  level: PrivacyLevel;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
};

export type PrivacyLevel =
  | "exceptional"
  | "healthy"
  | "strong"
  | "moderate"
  | "needs_attention"
  | "critical";

export const PRIVACY_LEVEL_LABELS: Record<PrivacyLevel, string> = {
  exceptional: "Exceptional",
  healthy: "Healthy",
  strong: "Strong",
  moderate: "Moderate",
  needs_attention: "Needs Attention",
  critical: "Critical",
};

export const PRIVACY_LEVEL_COLORS: Record<PrivacyLevel, string> = {
  exceptional: "text-emerald-400",
  healthy: "text-green-400",
  strong: "text-teal-400",
  moderate: "text-yellow-400",
  needs_attention: "text-orange-400",
  critical: "text-red-400",
};

export const PRIVACY_LEVEL_BG: Record<PrivacyLevel, string> = {
  exceptional: "bg-emerald-500/20 border-emerald-500/30",
  healthy: "bg-green-500/20 border-green-500/30",
  strong: "bg-teal-500/20 border-teal-500/30",
  moderate: "bg-yellow-500/20 border-yellow-500/30",
  needs_attention: "bg-orange-500/20 border-orange-500/30",
  critical: "bg-red-500/20 border-red-500/30",
};

export function getPrivacyLevel(score: number): PrivacyLevel {
  if (score >= 95) return "exceptional";
  if (score >= 90) return "healthy";
  if (score >= 80) return "strong";
  if (score >= 70) return "moderate";
  if (score >= 60) return "needs_attention";
  return "critical";
}

export function computePrivacyScore(inputs: PrivacyScoreInputs): PrivacyScoreBreakdown {
  const {
    totalAssets,
    classifiedAssets,
    activeConsents,
    totalConsents,
    expiredConsents,
    completedDsrs,
    totalDsrs,
    overdueDsrs,
    assetsWithRetentionPolicy,
    retentionViolations,
    openPrivacyRisks,
    criticalPrivacyRisks,
    totalPrivacyControls,
    effectivePrivacyControls,
  } = inputs;

  // Inventory: % of assets classified (not custom/uncategorized)
  const inventory =
    totalAssets === 0
      ? 100
      : Math.min(100, Math.round((classifiedAssets / totalAssets) * 100));

  // Consent: active ratio, penalize expired
  const consent =
    totalConsents === 0
      ? 100
      : Math.max(
          0,
          Math.round(
            (activeConsents / totalConsents) * 100 -
              (expiredConsents / Math.max(totalConsents, 1)) * 20
          )
        );

  // DSR: completion rate, penalize overdue (DPDP SLA = 30 days)
  const dsr =
    totalDsrs === 0
      ? 100
      : Math.max(
          0,
          Math.round((completedDsrs / totalDsrs) * 100 - overdueDsrs * 10)
        );

  // Retention: coverage of assets with a policy, penalize violations
  const retention =
    totalAssets === 0
      ? 100
      : Math.max(
          0,
          Math.round(
            (assetsWithRetentionPolicy / totalAssets) * 100 - retentionViolations * 5
          )
        );

  // Risks: penalize open and critical privacy risks
  const riskPenalty = Math.min(100, openPrivacyRisks * 5 + criticalPrivacyRisks * 15);
  const risks = Math.max(0, 100 - riskPenalty);

  // Controls: effective ratio
  const controls =
    totalPrivacyControls === 0
      ? 100
      : Math.min(100, Math.round((effectivePrivacyControls / totalPrivacyControls) * 100));

  const score = Math.round(
    inventory * PRIVACY_SCORE_WEIGHTS.inventory +
      consent * PRIVACY_SCORE_WEIGHTS.consent +
      dsr * PRIVACY_SCORE_WEIGHTS.dsr +
      retention * PRIVACY_SCORE_WEIGHTS.retention +
      risks * PRIVACY_SCORE_WEIGHTS.risks +
      controls * PRIVACY_SCORE_WEIGHTS.controls
  );

  const level = getPrivacyLevel(score);

  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: string[] = [];

  if (inventory >= 80) {
    strengths.push("Good data asset classification coverage");
  } else {
    concerns.push(`${totalAssets - classifiedAssets} assets unclassified`);
    recommendations.push("Classify all data assets by sensitivity level");
  }

  if (consent >= 80) {
    strengths.push("Strong consent management");
  } else {
    concerns.push("Low consent coverage or high expiry rate");
    recommendations.push("Review and renew expired consents");
  }

  if (dsr >= 80) {
    strengths.push("DSR requests handled promptly");
  } else if (overdueDsrs > 0) {
    concerns.push(`${overdueDsrs} DSRs overdue`);
    recommendations.push("Prioritize overdue data subject requests (DPDP SLA: 30 days)");
  }

  if (retention >= 80) {
    strengths.push("Retention policies well-defined");
  } else {
    concerns.push("Retention gaps or violations detected");
    recommendations.push("Define retention policies for all data categories");
  }

  if (risks >= 80) {
    strengths.push("Privacy risk posture is healthy");
  } else {
    concerns.push(
      `${openPrivacyRisks} open privacy risks (${criticalPrivacyRisks} critical)`
    );
    recommendations.push("Address critical privacy risks immediately");
  }

  if (controls >= 80) {
    strengths.push("Privacy controls are effective");
  } else {
    concerns.push("Privacy controls need improvement");
    recommendations.push("Strengthen privacy controls effectiveness");
  }

  return {
    score,
    components: { inventory, consent, dsr, retention, risks, controls },
    level,
    strengths,
    concerns,
    recommendations,
  };
}
