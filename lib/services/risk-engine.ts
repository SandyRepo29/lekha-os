import type { Vendor, VendorDocument } from "@/lib/db/schema";
import type { DocCounts } from "./scoring";

export type RiskScore = {
  level: "low" | "medium" | "high" | "critical";
  score: number; // 0-100 (higher = more risk)
  factors: { label: string; impact: "positive" | "warn" | "danger"; detail: string }[];
};

const BASE_RISK: Record<string, number> = { low: 15, medium: 35, high: 65, critical: 90 };

/**
 * Computes a numeric risk score (0-100) from vendor metadata + documents.
 * Higher = more risky. Used for heat-map and sorting.
 */
export function computeRiskScore(
  vendor: Vendor,
  docCounts: DocCounts,
  assessmentScore?: number | null
): RiskScore {
  let score = BASE_RISK[vendor.riskLevel] ?? 35;
  const factors: RiskScore["factors"] = [];

  // Compliance score impact
  if (vendor.complianceScore < 50) {
    score += 20;
    factors.push({ label: "Low compliance score", impact: "danger", detail: `Compliance at ${vendor.complianceScore}/100` });
  } else if (vendor.complianceScore >= 80) {
    score -= 10;
    factors.push({ label: "Strong compliance score", impact: "positive", detail: `Compliance at ${vendor.complianceScore}/100` });
  }

  // Expired docs
  if (docCounts.expired > 0) {
    score += docCounts.expired * 15;
    factors.push({ label: `${docCounts.expired} expired document${docCounts.expired > 1 ? "s" : ""}`, impact: "danger", detail: "Expired certifications create direct compliance risk." });
  }

  // Expiring docs
  if (docCounts.expiring > 0) {
    score += docCounts.expiring * 7;
    factors.push({ label: `${docCounts.expiring} document${docCounts.expiring > 1 ? "s" : ""} expiring soon`, impact: "warn", detail: "Take action before these expire." });
  }

  // No documents at all
  if (docCounts.total === 0) {
    score += 25;
    factors.push({ label: "No documents on file", impact: "danger", detail: "Cannot verify vendor compliance without documents." });
  } else if (docCounts.valid >= 5) {
    score -= 8;
    factors.push({ label: "Good document coverage", impact: "positive", detail: `${docCounts.valid} valid documents on file.` });
  }

  // Assessment score
  if (assessmentScore !== null && assessmentScore !== undefined) {
    if (assessmentScore < 50) {
      score += 15;
      factors.push({ label: "Poor assessment score", impact: "danger", detail: `Assessment scored ${assessmentScore}/100` });
    } else if (assessmentScore >= 75) {
      score -= 10;
      factors.push({ label: "Strong assessment score", impact: "positive", detail: `Assessment scored ${assessmentScore}/100` });
    }
  } else {
    score += 5;
    factors.push({ label: "No security assessment", impact: "warn", detail: "Security assessment not completed." });
  }

  // No owner assigned
  if (!vendor.ownerName) {
    score += 5;
    factors.push({ label: "No owner assigned", impact: "warn", detail: "Vendor has no internal owner for accountability." });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const level: RiskScore["level"] =
    score >= 75 ? "critical" : score >= 55 ? "high" : score >= 30 ? "medium" : "low";

  return { level, score, factors };
}
