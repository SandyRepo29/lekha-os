/**
 * Trust Score™ service — orchestrates data gathering, computation, persistence, and AI narrative.
 * Follows the provider rule: only lib/providers/* may import SDKs.
 */

import { computeTrustScore } from "./trust-score";
import { computeContractHealth } from "./contract-health";
import type { TrustScoreBreakdown } from "./trust-score";
import * as vendorRepo from "@/lib/repositories/vendor-repo";
import * as documentRepo from "@/lib/repositories/document-repo";
import * as assessmentRepo from "@/lib/repositories/assessment-repo";
import * as reviewRepo from "@/lib/repositories/review-repo";
import * as requestRepo from "@/lib/repositories/request-repo";
import * as trustRepo from "@/lib/repositories/trust-score-repo";
import * as templateRepo from "@/lib/repositories/template-repo";
import { risks, riskVendors, contracts, contractObligations } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";
import { generateText, isAIConfigured } from "@/lib/providers/ai";
import { DomainError } from "./errors";

export { getOrgTrustMetrics } from "@/lib/repositories/trust-score-repo";
export { getTrustLevel, TRUST_LEVEL_LABELS, TRUST_LEVEL_COLORS, TRUST_LEVEL_BG, TRUST_COMPONENT_WEIGHTS, TRUST_COMPONENT_LABELS } from "./trust-score";
export type { TrustScoreBreakdown, TrustLevel } from "./trust-score";

/** Compute, save, and return the Trust Score™ for a vendor. */
export async function computeAndSaveTrustScore(
  orgId: string,
  vendorId: string,
  triggerEvent?: string
): Promise<TrustScoreBreakdown> {
  const vendor = await vendorRepo.findById(orgId, vendorId);
  if (!vendor) throw new DomainError("Vendor not found.");

  // Gather all inputs in parallel
  const [docs, allAssessments, reviews, requests, templateData, vendorContractsRaw] = await Promise.all([
    documentRepo.listByVendor(orgId, vendorId),
    assessmentRepo.listByVendor(orgId, vendorId),
    reviewRepo.listByVendor(orgId, vendorId),
    requestRepo.listByVendor(orgId, vendorId),
    vendor.vendorTypeId ? templateRepo.getTemplateWithDocs(vendor.vendorTypeId) : Promise.resolve(null),
    db.select({ id: contracts.id, status: contracts.status, expiryDate: contracts.expiryDate })
      .from(contracts)
      .where(and(eq(contracts.organizationId, orgId), eq(contracts.vendorId, vendorId))),
  ]);

  // Linked risks via risk_vendors junction
  const linkedRiskIds = await db
    .select({ riskId: riskVendors.riskId })
    .from(riskVendors)
    .where(eq(riskVendors.vendorId, vendorId));

  const linkedRisks =
    linkedRiskIds.length > 0
      ? await db
          .select({ status: risks.status, inherentScore: risks.inherentScore })
          .from(risks)
          .where(inArray(risks.id, linkedRiskIds.map((r) => r.riskId)))
      : [];

  // Required docs missing
  const uploadedDocTypes = new Set(docs.map((d) => d.documentType?.toLowerCase()).filter(Boolean));
  const requiredDocsMissing = templateData
    ? templateData.docs.filter((d) => d.isRequired && !uploadedDocTypes.has(d.documentType.toLowerCase())).length
    : 0;

  // Assessment data
  const completed = allAssessments.filter((a) => a.status === "completed" && a.score != null);
  const latest = completed[0] ?? null;

  // Reviews in last 12 months
  const cutoff = new Date(Date.now() - 365 * 86_400_000);
  const reviewsLast12Months = reviews.filter((r) => new Date(r.createdAt) >= cutoff).length;

  // Last review date
  const lastReview = reviews[0] ?? null;
  const lastReviewDate = lastReview ? new Date(lastReview.createdAt) : null;

  // Contract Health Score (7th component)
  let contractHealthScore: number | null = null;
  if (vendorContractsRaw.length > 0) {
    // Pick the active contract, or the first one
    const activeContract = vendorContractsRaw.find((c) => c.status === "active") ?? vendorContractsRaw[0];
    // Fetch obligations for this contract
    const obligations = await db
      .select({ status: contractObligations.status, dueDate: contractObligations.dueDate })
      .from(contractObligations)
      .where(eq(contractObligations.contractId, activeContract.id));
    const today = new Date().toISOString().split("T")[0];
    const daysUntilExpiry = activeContract.expiryDate
      ? Math.floor((new Date(activeContract.expiryDate).getTime() - Date.now()) / 86_400_000)
      : null;
    const openObligs = obligations.filter((o) => o.status === "open" || o.status === "in_progress").length;
    const overdueObligs = obligations.filter(
      (o) => o.status === "overdue" ||
             ((o.status === "open" || o.status === "in_progress") && o.dueDate != null && o.dueDate < today)
    ).length;
    const legalExceptions = obligations.filter((o) => o.status === "waived").length;
    const health = computeContractHealth({
      isActive: activeContract.status === "active",
      daysUntilExpiry,
      openObligations: openObligs,
      overdueObligations: overdueObligs,
      totalObligations: obligations.length,
      legalExceptions,
      complianceScore: vendor.complianceScore,
      vendorRisk: vendor.riskLevel ?? "medium",
    });
    contractHealthScore = health.overall;
  }

  const inputs = {
    docsTotal: docs.length,
    docsValid: docs.filter((d) => d.status === "valid").length,
    docsExpiring: docs.filter((d) => d.status === "expiring").length,
    docsExpired: docs.filter((d) => d.status === "expired").length,
    requiredDocsMissing,
    complianceScore: vendor.complianceScore,
    linkedRisks: linkedRisks.map((r) => ({ status: r.status, inherentScore: r.inherentScore })),
    latestAssessmentScore: latest?.score ?? null,
    latestAssessmentDate: latest ? new Date(latest.createdAt) : null,
    totalReviews: reviews.length,
    reviewsLast12Months,
    totalRequests: requests.length,
    openRequests: requests.filter((r) => r.status === "requested").length,
    lastReviewDate,
    contractHealthScore,
  };

  const breakdown = computeTrustScore(inputs);

  // Persist
  await trustRepo.saveTrustScore({
    organizationId: orgId,
    vendorId,
    overallScore: breakdown.overall,
    evidenceScore: breakdown.evidence,
    complianceScore: breakdown.compliance,
    riskScore: breakdown.risk,
    assessmentScore: breakdown.assessment,
    operationalScore: breakdown.operational,
    freshnessScore: breakdown.freshness,
    triggerEvent,
  });

  return breakdown;
}

/** Return the latest trust history for a vendor (for trend charts). */
export async function getTrustHistory(orgId: string, vendorId: string, days = 30) {
  return trustRepo.getTrustHistory(orgId, vendorId, days);
}

/** Generate and cache an AI trust narrative. Uses cached value if under 24h. */
export async function generateTrustNarrative(orgId: string, vendorId: string): Promise<string> {
  if (!isAIConfigured()) throw new DomainError("AI not configured.");

  const vendor = await vendorRepo.findById(orgId, vendorId);
  if (!vendor) throw new DomainError("Vendor not found.");

  // Return cached if fresh (< 24h)
  if (
    vendor.aiTrustNarrative &&
    vendor.aiTrustNarrativeAt &&
    Date.now() - new Date(vendor.aiTrustNarrativeAt).getTime() < 24 * 3600 * 1000
  ) {
    return vendor.aiTrustNarrative;
  }

  // Recompute so we have fresh breakdown for the prompt
  const breakdown = await computeAndSaveTrustScore(orgId, vendorId, "ai_narrative");

  const strengthsList = breakdown.strengths.slice(0, 3).map((s) => `- ${s}`).join("\n");
  const concernsList = breakdown.concerns.slice(0, 3).map((c) => `- ${c}`).join("\n");

  const prompt = `You are a governance analyst writing a concise trust summary for a board report.

Vendor: ${vendor.name}
Trust Score™: ${breakdown.overall}/100 (${breakdown.level.replace("_", " ")})
Evidence: ${breakdown.evidence}/100 | Compliance: ${breakdown.compliance}/100 | Risk: ${breakdown.risk}/100 | Assessment: ${breakdown.assessment}/100 | Operations: ${breakdown.operational}/100 | Freshness: ${breakdown.freshness}/100

Strengths:
${strengthsList || "None identified"}

Concerns:
${concernsList || "None identified"}

Write 2–3 concise sentences for a board-level executive. Mention the score, key strengths, and the most important concern or action. Plain English, no jargon.`;

  const text = await generateText(prompt, { maxTokens: 200, temperature: 0.35 });

  await vendorRepo.updateVendor(vendorId, {
    aiTrustNarrative: text,
    aiTrustNarrativeAt: new Date(),
  });

  return text;
}
