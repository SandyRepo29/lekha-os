/**
 * Trust Score™ — pure scoring engine.
 * No DB imports. Usable from server and client components.
 */

export type TrustLevel =
  | "exceptional"   // 95–100
  | "trusted"       // 90–94
  | "strong"        // 80–89
  | "moderate"      // 70–79
  | "needs_attention" // 60–69
  | "high_concern"; // 0–59

export type TrustScoreInputs = {
  // Component 1 — Evidence (20%)
  docsTotal: number;
  docsValid: number;
  docsExpiring: number;
  docsExpired: number;
  requiredDocsMissing: number;

  // Component 2 — Compliance (15%)
  complianceScore: number; // 0–100

  // Component 3 — Risk (20%)
  linkedRisks: Array<{ status: string; inherentScore: number }>;

  // Component 4 — Assessment (15%)
  latestAssessmentScore: number | null;
  latestAssessmentDate: Date | null;

  // Component 5 — Operational Health (10%)
  totalReviews: number;
  reviewsLast12Months: number;
  totalRequests: number;
  openRequests: number;

  // Component 6 — Governance Freshness (10%)
  lastReviewDate: Date | null;

  // Component 7 — Contract Health (10%)
  contractHealthScore?: number | null; // 0–100; null = no contracts (defaults to 70)

  // Component 8 — Asset Resilience (8%)
  assetResilienceScore?: number | null; // 0–100; null = no linked assets (defaults to 70)
};

export type TrustScoreBreakdown = {
  overall: number;
  evidence: number;
  compliance: number;
  risk: number;
  assessment: number;
  operational: number;
  freshness: number;
  contract: number;
  assetResilience: number;
  level: TrustLevel;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
};

export function getTrustLevel(score: number): TrustLevel {
  if (score >= 95) return "exceptional";
  if (score >= 90) return "trusted";
  if (score >= 80) return "strong";
  if (score >= 70) return "moderate";
  if (score >= 60) return "needs_attention";
  return "high_concern";
}

export const TRUST_LEVEL_LABELS: Record<TrustLevel, string> = {
  exceptional: "Exceptional",
  trusted: "Trusted",
  strong: "Strong",
  moderate: "Moderate",
  needs_attention: "Needs Attention",
  high_concern: "High Concern",
};

export const TRUST_LEVEL_COLORS: Record<TrustLevel, string> = {
  exceptional: "text-emerald-400",
  trusted: "text-emerald-400",
  strong: "text-green-400",
  moderate: "text-yellow-400",
  needs_attention: "text-amber-400",
  high_concern: "text-red-400",
};

export const TRUST_LEVEL_BG: Record<TrustLevel, string> = {
  exceptional: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  trusted: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  strong: "bg-green-500/10 border-green-500/30 text-green-400",
  moderate: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  needs_attention: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  high_concern: "bg-red-500/10 border-red-500/30 text-red-400",
};

// ── Component computations ───────────────────────────────────────────────────

function evidenceScore(i: TrustScoreInputs): number {
  if (i.docsTotal === 0) return 25; // no docs at all — hard penalty
  let score = 100;
  score -= i.requiredDocsMissing * 15; // missing required doc type
  score -= i.docsExpired * 10;         // expired doc
  score -= i.docsExpiring * 5;         // expiring soon
  // small reward for having many valid docs (max +10)
  score += Math.min(i.docsValid * 2, 10);
  return Math.max(0, Math.min(100, Math.round(score)));
}

const INACTIVE_RISK_STATUSES = new Set(["closed", "archived", "accepted", "transferred"]);

function riskScore(i: TrustScoreInputs): number {
  if (i.linkedRisks.length === 0) return 100;
  const active = i.linkedRisks.filter((r) => !INACTIVE_RISK_STATUSES.has(r.status));
  if (active.length === 0) return 95; // all risks closed/accepted
  const critical = active.filter((r) => r.inherentScore >= 20); // 4×5 or 5×4
  const high = active.filter((r) => r.inherentScore >= 12 && r.inherentScore < 20);
  const medium = active.filter((r) => r.inherentScore < 12);
  let score = 100;
  score -= Math.min(critical.length * 25, 60);
  score -= Math.min(high.length * 12, 30);
  score -= Math.min(medium.length * 5, 20);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function assessmentScore(i: TrustScoreInputs): number {
  if (i.latestAssessmentScore === null) return 30; // never assessed
  return i.latestAssessmentScore; // direct passthrough
}

function operationalScore(i: TrustScoreInputs): number {
  let score = 100;
  // No reviews ever
  if (i.totalReviews === 0) {
    score -= 35;
  } else if (i.reviewsLast12Months === 0) {
    score -= 20;
  }
  // Open document requests
  if (i.totalRequests > 0 && i.openRequests > 0) {
    const ratio = i.openRequests / i.totalRequests;
    score -= Math.round(ratio * 25);
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function freshnessScore(i: TrustScoreInputs): number {
  const now = Date.now();
  let score = 100;

  if (!i.lastReviewDate) {
    score -= 45;
  } else {
    const days = (now - i.lastReviewDate.getTime()) / 86_400_000;
    if (days > 365) score -= 45;
    else if (days > 180) score -= 25;
    else if (days > 90) score -= 10;
  }

  if (!i.latestAssessmentDate) {
    score -= 25;
  } else {
    const days = (now - i.latestAssessmentDate.getTime()) / 86_400_000;
    if (days > 365) score -= 25;
    else if (days > 180) score -= 12;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ── Explainability helpers ───────────────────────────────────────────────────

function buildStrengths(i: TrustScoreInputs, components: Omit<TrustScoreBreakdown, "level" | "strengths" | "concerns" | "recommendations">): string[] {
  const s: string[] = [];
  if (components.evidence >= 85) s.push("Strong document coverage");
  if (i.docsValid >= 3 && i.docsExpired === 0) s.push("All documents current");
  if (components.compliance >= 80) s.push("High compliance score");
  if (components.risk >= 90) s.push(i.linkedRisks.length === 0 ? "No linked risks" : "All risks resolved");
  if (components.assessment >= 75 && i.latestAssessmentScore !== null) s.push(`Security assessment: ${i.latestAssessmentScore}/100`);
  if (i.reviewsLast12Months >= 1) s.push("Reviewed within the last 12 months");
  if (i.openRequests === 0 && i.totalRequests > 0) s.push("All document requests fulfilled");
  if (components.contract >= 80 && i.contractHealthScore != null) s.push("Contract governance in good standing");
  if (components.assetResilience >= 80 && i.assetResilienceScore != null) s.push("Dependent assets are well-governed");
  return s;
}

function buildConcerns(i: TrustScoreInputs, components: Omit<TrustScoreBreakdown, "level" | "strengths" | "concerns" | "recommendations">): string[] {
  const c: string[] = [];
  if (i.docsTotal === 0) c.push("No documents on file");
  if (i.requiredDocsMissing > 0) c.push(`${i.requiredDocsMissing} required document type${i.requiredDocsMissing > 1 ? "s" : ""} missing`);
  if (i.docsExpired > 0) c.push(`${i.docsExpired} expired document${i.docsExpired > 1 ? "s" : ""}`);
  if (i.docsExpiring > 0) c.push(`${i.docsExpiring} document${i.docsExpiring > 1 ? "s" : ""} expiring soon`);
  const criticalRisks = i.linkedRisks.filter((r) => !INACTIVE_RISK_STATUSES.has(r.status) && r.inherentScore >= 20);
  if (criticalRisks.length > 0) c.push(`${criticalRisks.length} critical open risk${criticalRisks.length > 1 ? "s" : ""}`);
  if (i.latestAssessmentScore === null) c.push("Security assessment not completed");
  if (i.totalReviews === 0) c.push("Vendor never reviewed");
  else if (i.reviewsLast12Months === 0) c.push("No review in the last 12 months");
  if (i.openRequests > 0) c.push(`${i.openRequests} open document request${i.openRequests > 1 ? "s" : ""}`);
  if (i.contractHealthScore != null && components.contract < 55) c.push("Contract health requires attention");
  if (i.assetResilienceScore != null && components.assetResilience < 55) c.push("Critical assets depending on this vendor have governance gaps");
  return c;
}

function buildRecommendations(i: TrustScoreInputs, components: Omit<TrustScoreBreakdown, "level" | "strengths" | "concerns" | "recommendations">): string[] {
  const r: string[] = [];
  if (i.docsExpired > 0) r.push("Renew expired documents");
  if (i.requiredDocsMissing > 0) r.push("Upload missing required document types");
  if (i.docsExpiring > 0) r.push("Renew documents expiring soon");
  const openCritical = i.linkedRisks.filter((r) => !INACTIVE_RISK_STATUSES.has(r.status) && r.inherentScore >= 20);
  if (openCritical.length > 0) r.push("Mitigate or accept critical open risks");
  if (i.latestAssessmentScore === null) r.push("Complete the security assessment");
  else if (i.latestAssessmentScore < 60) r.push("Improve security assessment score");
  if (i.reviewsLast12Months === 0) r.push("Schedule a vendor governance review");
  if (components.compliance < 60) r.push("Improve compliance documentation coverage");
  return r.slice(0, 5); // top 5 only
}

// ── Main entry point ─────────────────────────────────────────────────────────

export function computeTrustScore(inputs: TrustScoreInputs): TrustScoreBreakdown {
  const evidence = evidenceScore(inputs);
  const compliance = Math.max(0, Math.min(100, inputs.complianceScore));
  const risk = riskScore(inputs);
  const assessment = assessmentScore(inputs);
  const operational = operationalScore(inputs);
  const freshness = freshnessScore(inputs);
  // Contract component — default 70 (neutral) when no contracts on file
  const contract = inputs.contractHealthScore != null
    ? Math.max(0, Math.min(100, Math.round(inputs.contractHealthScore)))
    : 70;
  // Asset Resilience component — default 70 (neutral) when no linked assets
  const assetResilience = inputs.assetResilienceScore != null
    ? Math.max(0, Math.min(100, Math.round(inputs.assetResilienceScore)))
    : 70;

  // Weights: 8 components totalling 100%
  // Evidence(18) + Compliance(13) + Risk(18) + Assessment(13) + Ops(10) + Freshness(10) + Contract(10) + AssetResilience(8)
  const overall = Math.round(
    evidence        * 0.18 +
    compliance      * 0.13 +
    risk            * 0.18 +
    assessment      * 0.13 +
    operational     * 0.10 +
    freshness       * 0.10 +
    contract        * 0.10 +
    assetResilience * 0.08
  );

  const components = { overall, evidence, compliance, risk, assessment, operational, freshness, contract, assetResilience };

  return {
    ...components,
    level: getTrustLevel(overall),
    strengths: buildStrengths(inputs, components),
    concerns: buildConcerns(inputs, components),
    recommendations: buildRecommendations(inputs, components),
  };
}

export const TRUST_COMPONENT_WEIGHTS: Record<string, number> = {
  evidence:        18,
  compliance:      13,
  risk:            18,
  assessment:      13,
  operational:     10,
  freshness:       10,
  contract:        10,
  assetResilience:  8,
};

export const TRUST_COMPONENT_LABELS: Record<string, string> = {
  evidence:        "Evidence",
  compliance:      "Compliance",
  risk:            "Risk",
  assessment:      "Assessment",
  operational:     "Operations",
  freshness:       "Freshness",
  contract:        "Contracts",
  assetResilience: "Asset Resilience",
};
