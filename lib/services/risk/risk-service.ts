import { db } from "@/lib/db";
import { DomainError } from "@/lib/services/errors";
import { recordAudit } from "@/lib/repositories/audit-repo";
import { computeRiskScore } from "@/lib/services/risk-scoring";
import * as riskRepo from "@/lib/repositories/risk-repo";
import * as reviewRepo from "@/lib/repositories/risk-review-repo";
import * as treatmentRepo from "@/lib/repositories/risk-treatment-repo";
import type { Risk, RiskReview, RiskTreatment } from "@/lib/db/schema";

export type RiskWithOwner = Awaited<ReturnType<typeof riskRepo.findByOrg>>[number];

export type RiskDetail = RiskWithOwner & {
  treatments: RiskTreatment[];
  reviews: RiskReview[];
  treatmentProgress: number;
};

export async function listRisks(
  orgId: string,
  filters?: { status?: string; category?: string }
): Promise<RiskWithOwner[]> {
  return riskRepo.findByOrg(orgId, filters);
}

export async function getRisk(orgId: string, riskId: string): Promise<RiskDetail | null> {
  const risk = await riskRepo.findById(orgId, riskId);
  if (!risk) return null;

  const [treatments, reviews] = await Promise.all([
    treatmentRepo.findByRisk(riskId),
    reviewRepo.findByRisk(riskId),
  ]);

  const completedTreatments = treatments.filter((t) => t.status === "completed").length;
  const treatmentProgress =
    treatments.length > 0 ? Math.round((completedTreatments / treatments.length) * 100) : 0;

  return { ...risk, treatments, reviews, treatmentProgress };
}

export async function createRisk(params: {
  orgId: string;
  actorId: string;
  input: {
    title: string;
    description?: string | null;
    category?: Risk["category"];
    status?: Risk["status"];
    ownerId?: string | null;
    source?: Risk["source"];
    impact?: number;
    likelihood?: number;
    residualScore?: number | null;
    treatmentStrategy?: Risk["treatmentStrategy"];
    targetDate?: string | null;
    identifiedDate?: string | null;
    nextReviewDate?: string | null;
    sourceVendorId?: string | null;
    sourceFindingId?: string | null;
    sourceGapId?: string | null;
  };
}): Promise<{ id: string }> {
  const title = (params.input.title || "").trim();
  if (title.length < 2) throw new DomainError("Risk title must be at least 2 characters.");

  const impact = params.input.impact ?? 3;
  const likelihood = params.input.likelihood ?? 3;
  const { score: inherentScore } = computeRiskScore(impact, likelihood);

  let result!: { id: string };
  await db.transaction(async (tx) => {
    result = await riskRepo.insertRisk(
      {
        organizationId: params.orgId,
        title,
        description: params.input.description ?? null,
        category: params.input.category ?? "operational",
        status: params.input.status ?? "identified",
        ownerId: params.input.ownerId ?? null,
        source: params.input.source ?? "manual",
        impact,
        likelihood,
        inherentScore,
        residualScore: params.input.residualScore ?? null,
        treatmentStrategy: params.input.treatmentStrategy ?? "mitigate",
        targetDate: params.input.targetDate ?? null,
        identifiedDate: params.input.identifiedDate ?? new Date().toISOString().slice(0, 10),
        nextReviewDate: params.input.nextReviewDate ?? null,
        sourceVendorId: params.input.sourceVendorId ?? null,
        sourceFindingId: params.input.sourceFindingId ?? null,
        sourceGapId: params.input.sourceGapId ?? null,
        createdBy: params.actorId,
      },
      tx
    );
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "risk.created",
        entityType: "risk",
        entityId: result.id,
        metadata: { title, category: params.input.category ?? "operational", inherentScore },
      },
      tx
    );
  });
  return result;
}

export async function updateRisk(params: {
  orgId: string;
  actorId: string;
  riskId: string;
  input: Partial<{
    title: string;
    description: string | null;
    category: Risk["category"];
    status: Risk["status"];
    ownerId: string | null;
    source: Risk["source"];
    impact: number;
    likelihood: number;
    residualScore: number | null;
    treatmentStrategy: Risk["treatmentStrategy"];
    targetDate: string | null;
    identifiedDate: string | null;
    nextReviewDate: string | null;
  }>;
}): Promise<void> {
  const existing = await riskRepo.findById(params.orgId, params.riskId);
  if (!existing) throw new DomainError("Risk not found.");

  const updates: Parameters<typeof riskRepo.updateRisk>[1] = { ...params.input } as any;

  // Recompute inherent score if impact or likelihood changed
  const impact = params.input.impact ?? existing.impact;
  const likelihood = params.input.likelihood ?? existing.likelihood;
  if (params.input.impact !== undefined || params.input.likelihood !== undefined) {
    const { score } = computeRiskScore(impact, likelihood);
    (updates as any).inherentScore = score;
  }

  await db.transaction(async (tx) => {
    await riskRepo.updateRisk(params.riskId, updates, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "risk.updated",
        entityType: "risk",
        entityId: params.riskId,
        metadata: params.input,
      },
      tx
    );
  });
}

export async function updateRiskStatus(params: {
  orgId: string;
  actorId: string;
  riskId: string;
  status: Risk["status"];
}): Promise<void> {
  const existing = await riskRepo.findById(params.orgId, params.riskId);
  if (!existing) throw new DomainError("Risk not found.");

  const actionMap: Partial<Record<Risk["status"], string>> = {
    closed: "risk.closed",
    accepted: "risk.accepted",
    transferred: "risk.transferred",
  };
  const action = actionMap[params.status] ?? "risk.updated";

  await db.transaction(async (tx) => {
    await riskRepo.updateRisk(params.riskId, { status: params.status }, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action,
        entityType: "risk",
        entityId: params.riskId,
        metadata: { status: params.status },
      },
      tx
    );
  });
}

export async function deleteRisk(params: {
  orgId: string;
  actorId: string;
  riskId: string;
}): Promise<void> {
  const existing = await riskRepo.findById(params.orgId, params.riskId);
  if (!existing) throw new DomainError("Risk not found.");

  await db.transaction(async (tx) => {
    await riskRepo.deleteRisk(params.orgId, params.riskId, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "risk.deleted",
        entityType: "risk",
        entityId: params.riskId,
        metadata: { title: existing.title },
      },
      tx
    );
  });
}

export async function addReview(params: {
  orgId: string;
  actorId: string;
  riskId: string;
  input: {
    reviewDate: string;
    outcome: string;
    notes?: string | null;
    newStatus?: Risk["status"] | null;
    newScore?: number | null;
  };
}): Promise<void> {
  const existing = await riskRepo.findById(params.orgId, params.riskId);
  if (!existing) throw new DomainError("Risk not found.");

  await db.transaction(async (tx) => {
    await reviewRepo.insertReview(
      {
        organizationId: params.orgId,
        riskId: params.riskId,
        reviewerId: params.actorId,
        reviewDate: params.input.reviewDate,
        outcome: params.input.outcome,
        notes: params.input.notes ?? null,
        previousStatus: existing.status,
        newStatus: params.input.newStatus ?? null,
        previousScore: existing.inherentScore,
        newScore: params.input.newScore ?? null,
      },
      tx
    );

    const riskUpdates: Parameters<typeof riskRepo.updateRisk>[1] = {
      lastReviewedDate: params.input.reviewDate,
    } as any;
    if (params.input.newStatus) riskUpdates.status = params.input.newStatus;

    await riskRepo.updateRisk(params.riskId, riskUpdates, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "risk.reviewed",
        entityType: "risk",
        entityId: params.riskId,
        metadata: { outcome: params.input.outcome },
      },
      tx
    );
  });
}

export async function addTreatment(params: {
  orgId: string;
  actorId: string;
  riskId: string;
  input: {
    action: string;
    description?: string | null;
    ownerId?: string | null;
    targetDate?: string | null;
  };
}): Promise<void> {
  const existing = await riskRepo.findById(params.orgId, params.riskId);
  if (!existing) throw new DomainError("Risk not found.");

  await db.transaction(async (tx) => {
    await treatmentRepo.insertTreatment(
      {
        organizationId: params.orgId,
        riskId: params.riskId,
        action: params.input.action.trim(),
        description: params.input.description ?? null,
        ownerId: params.input.ownerId ?? null,
        targetDate: params.input.targetDate ?? null,
        status: "open",
        createdBy: params.actorId,
      },
      tx
    );
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "risk.treatment_created",
        entityType: "risk",
        entityId: params.riskId,
        metadata: { action: params.input.action },
      },
      tx
    );
  });
}

export async function completeTreatment(params: {
  orgId: string;
  actorId: string;
  riskId: string;
  treatmentId: string;
}): Promise<void> {
  await db.transaction(async (tx) => {
    await treatmentRepo.updateTreatment(
      params.treatmentId,
      { status: "completed", progressPercent: 100, completedAt: new Date() },
      tx
    );
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "risk.treatment_completed",
        entityType: "risk",
        entityId: params.riskId,
        metadata: { treatmentId: params.treatmentId },
      },
      tx
    );
  });
}

export async function getDashboardMetrics(orgId: string) {
  const [statusCounts, categoryCounts, overdueReviews] = await Promise.all([
    riskRepo.countByStatus(orgId),
    riskRepo.countByCategory(orgId),
    riskRepo.countOverdueReviews(orgId),
  ]);

  const all = await riskRepo.findByOrg(orgId);
  const active = all.filter((r) => !["closed", "archived"].includes(r.status));
  const criticalRisks = active.filter((r) => r.inherentScore >= 16).length;
  const acceptedRisks = active.filter((r) => r.status === "accepted").length;
  const mitigatingRisks = active.filter((r) => r.status === "mitigating").length;

  return {
    total: all.length,
    open: statusCounts["open"] ?? 0,
    identified: statusCounts["identified"] ?? 0,
    mitigating: mitigatingRisks,
    accepted: acceptedRisks,
    closed: statusCounts["closed"] ?? 0,
    critical: criticalRisks,
    overdueReviews,
    byCategory: categoryCounts,
    topRisks: active.sort((a, b) => b.inherentScore - a.inherentScore).slice(0, 5),
    heatMapData: active.map((r) => ({ impact: r.impact, likelihood: r.likelihood, id: r.id, title: r.title, score: r.inherentScore })),
  };
}
