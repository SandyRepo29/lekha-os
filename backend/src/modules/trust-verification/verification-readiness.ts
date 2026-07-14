// Pure, client-safe verification readiness score engine — no DB imports

export interface VerificationReadinessInputs {
  trustScore: number;          // 0–100
  controlHealth: number;       // 0–100
  complianceCoverage: number;  // 0–100
  riskPosture: number;         // 0–100 (inverse of risk exposure)
  privacyTrust: number;        // 0–100
  aiGovernance: number;        // 0–100
  monitoringHealth: number;    // 0–100
}

export interface VerificationReadinessBreakdown {
  score: number;
  level: "ready" | "near_ready" | "needs_improvement" | "not_ready";
  label: string;
  color: string;
  bgColor: string;
  components: Array<{ key: string; label: string; weight: number; score: number; weighted: number }>;
  strengths: string[];
  gaps: string[];
}

export const READINESS_WEIGHTS = {
  trustScore:         0.25,
  controlHealth:      0.20,
  complianceCoverage: 0.15,
  riskPosture:        0.15,
  privacyTrust:       0.10,
  aiGovernance:       0.10,
  monitoringHealth:   0.05,
} as const;

export const READINESS_LABELS: Record<string, string> = {
  trustScore:         "Trust Score",
  controlHealth:      "Control Health",
  complianceCoverage: "Compliance Coverage",
  riskPosture:        "Risk Posture",
  privacyTrust:       "Privacy Trust",
  aiGovernance:       "AI Governance",
  monitoringHealth:   "Monitoring Health",
};

export function computeVerificationReadiness(inputs: VerificationReadinessInputs): VerificationReadinessBreakdown {
  const keys = Object.keys(READINESS_WEIGHTS) as Array<keyof typeof READINESS_WEIGHTS>;
  const components = keys.map(key => {
    const weight = READINESS_WEIGHTS[key];
    const score = Math.max(0, Math.min(100, inputs[key] ?? 0));
    return { key, label: READINESS_LABELS[key], weight: Math.round(weight * 100), score, weighted: score * weight };
  });

  const totalScore = Math.round(components.reduce((sum, c) => sum + c.weighted, 0));

  const strengths: string[] = [];
  const gaps: string[] = [];
  for (const c of components) {
    if (c.score >= 85) strengths.push(`${c.label} is strong (${c.score})`);
    else if (c.score < 70) gaps.push(`${c.label} needs improvement (${c.score})`);
  }

  let level: VerificationReadinessBreakdown["level"];
  let label: string;
  let color: string;
  let bgColor: string;

  if (totalScore >= 90) {
    level = "ready"; label = "Ready"; color = "text-emerald-400"; bgColor = "bg-emerald-500/10";
  } else if (totalScore >= 80) {
    level = "near_ready"; label = "Near Ready"; color = "text-[var(--color-blue)]"; bgColor = "bg-[var(--color-blue)]/10";
  } else if (totalScore >= 70) {
    level = "needs_improvement"; label = "Needs Improvement"; color = "text-amber-400"; bgColor = "bg-amber-500/10";
  } else {
    level = "not_ready"; label = "Not Ready"; color = "text-red-400"; bgColor = "bg-red-500/10";
  }

  return { score: totalScore, level, label, color, bgColor, components, strengths, gaps };
}

export function getReadinessLevel(score: number) {
  if (score >= 90) return { level: "ready", label: "Ready", color: "text-emerald-400", bgColor: "bg-emerald-500/10" };
  if (score >= 80) return { level: "near_ready", label: "Near Ready", color: "text-[var(--color-blue)]", bgColor: "bg-[var(--color-blue)]/10" };
  if (score >= 70) return { level: "needs_improvement", label: "Needs Improvement", color: "text-amber-400", bgColor: "bg-amber-500/10" };
  return { level: "not_ready", label: "Not Ready", color: "text-red-400", bgColor: "bg-red-500/10" };
}
