import { eq, and, desc, asc, lte, gte, isNotNull, avg as sqlAvg, count, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  vendors,
  risks,
  controls,
  audits,
  auditFindings,
  readinessScores,
  governanceSnapshots,
} from "@/lib/db/schema";
import type { GovernanceSnapshot } from "@/lib/db/schema";

// ── Vendor Trust inputs ───────────────────────────────────────────────────────

export async function getVendorTrustMetrics(orgId: string) {
  const rows = await db
    .select({ trustScore: vendors.trustScore, name: vendors.name, id: vendors.id, status: vendors.status })
    .from(vendors)
    .where(and(eq(vendors.organizationId, orgId), eq(vendors.status, "active")));

  const scored = rows.filter((v) => v.trustScore !== null) as Array<{
    id: string; name: string; trustScore: number; status: string;
  }>;

  const total = rows.length;
  const scoredCount = scored.length;
  const avgScore = scoredCount > 0
    ? Math.round(scored.reduce((s, v) => s + v.trustScore, 0) / scoredCount)
    : 0;

  const sorted = [...scored].sort((a, b) => b.trustScore - a.trustScore);
  const top10 = sorted.slice(0, 10);
  const bottom10 = sorted.slice(-10).reverse().filter((_, i) => i < 10);

  return { total, scoredCount, avgScore, top10, bottom10, allScored: sorted };
}

// ── Risk inputs ───────────────────────────────────────────────────────────────

export async function getRiskMetrics(orgId: string) {
  const rows = await db
    .select({
      id: risks.id,
      title: risks.title,
      status: risks.status,
      category: risks.category,
      inherentScore: risks.inherentScore,
      ownerId: risks.ownerId,
    })
    .from(risks)
    .where(eq(risks.organizationId, orgId));

  const INACTIVE = new Set(["closed", "archived", "accepted", "transferred"]);
  const active = rows.filter((r) => !INACTIVE.has(r.status));
  const critical = active.filter((r) => r.inherentScore >= 20);
  const high = active.filter((r) => r.inherentScore >= 12 && r.inherentScore < 20);
  const medium = active.filter((r) => r.inherentScore < 12);

  // Category breakdown
  const byCategory: Record<string, number> = {};
  for (const r of active) {
    byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
  }

  return {
    total: rows.length,
    activeCount: active.length,
    criticalCount: critical.length,
    highCount: high.length,
    mediumCount: medium.length,
    topRisks: critical.slice(0, 5),
    byCategory,
  };
}

// ── Control inputs ────────────────────────────────────────────────────────────

export async function getControlMetrics(orgId: string) {
  const rows = await db
    .select({
      id: controls.id,
      name: controls.name,
      healthScore: controls.healthScore,
      status: controls.status,
      lastTested: controls.lastTested,
    })
    .from(controls)
    .where(eq(controls.organizationId, orgId));

  const scored = rows.filter((c) => c.healthScore !== null) as Array<{
    id: string; name: string; healthScore: number; status: string; lastTested: string | null;
  }>;

  const totalCount = rows.length;
  const avgHealth = scored.length > 0
    ? Math.round(scored.reduce((s, c) => s + c.healthScore, 0) / scored.length)
    : 0;

  const healthy = scored.filter((c) => c.healthScore >= 80);
  const weak = scored.filter((c) => c.healthScore < 60);
  const sorted = [...scored].sort((a, b) => a.healthScore - b.healthScore);

  return {
    totalCount,
    avgHealth,
    healthyCount: healthy.length,
    weakCount: weak.length,
    weakControls: sorted.slice(0, 10),
  };
}

// ── Audit inputs ──────────────────────────────────────────────────────────────

export async function getAuditReadinessMetrics(orgId: string) {
  const auditRows = await db
    .select({ status: audits.status })
    .from(audits)
    .where(eq(audits.organizationId, orgId));

  const findingRows = await db
    .select({ id: auditFindings.id, status: auditFindings.status, severity: auditFindings.severity })
    .from(auditFindings)
    .where(eq(auditFindings.organizationId, orgId));

  const completed = auditRows.filter((a) => a.status === "completed").length;
  const openFindings = findingRows.filter((f) => f.status !== "closed" && f.status !== "accepted");
  const openCritical = openFindings.filter((f) => f.severity === "critical").length;
  const openHigh = openFindings.filter((f) => f.severity === "high").length;

  return {
    totalAudits: auditRows.length,
    completedAudits: completed,
    totalOpenFindings: openFindings.length,
    openCriticalFindings: openCritical,
    openHighFindings: openHigh,
  };
}

// ── Compliance inputs ─────────────────────────────────────────────────────────

export async function getComplianceMetrics(orgId: string) {
  const rows = await db
    .select({
      frameworkId: readinessScores.frameworkId,
      overallScore: readinessScores.overallScore,
      controlCoverage: readinessScores.controlCoverage,
      evidenceCoverage: readinessScores.evidenceCoverage,
    })
    .from(readinessScores)
    .where(eq(readinessScores.organizationId, orgId));

  const avg = rows.length > 0
    ? Math.round(rows.reduce((s, r) => s + r.overallScore, 0) / rows.length)
    : 0;

  return {
    frameworkCount: rows.length,
    avgReadiness: avg,
    frameworks: rows,
  };
}

// ── Governance snapshots ──────────────────────────────────────────────────────

export type GovernanceSnapshotInsert = {
  organizationId: string;
  snapshotDate: string;
  orgTrustScore: number;
  vendorTrustScore: number;
  riskPostureScore: number;
  controlHealthScore: number;
  auditReadinessScore: number;
  complianceCoverageScore: number;
  totalVendors: number;
  scoredVendors: number;
  activeRisks: number;
  criticalRisks: number;
  openFindings: number;
  avgControlHealth: number;
  avgFrameworkReadiness: number;
};

export async function upsertSnapshot(values: GovernanceSnapshotInsert): Promise<void> {
  await db
    .insert(governanceSnapshots)
    .values(values)
    .onConflictDoUpdate({
      target: [governanceSnapshots.organizationId, governanceSnapshots.snapshotDate],
      set: {
        orgTrustScore: values.orgTrustScore,
        vendorTrustScore: values.vendorTrustScore,
        riskPostureScore: values.riskPostureScore,
        controlHealthScore: values.controlHealthScore,
        auditReadinessScore: values.auditReadinessScore,
        complianceCoverageScore: values.complianceCoverageScore,
        totalVendors: values.totalVendors,
        scoredVendors: values.scoredVendors,
        activeRisks: values.activeRisks,
        criticalRisks: values.criticalRisks,
        openFindings: values.openFindings,
        avgControlHealth: values.avgControlHealth,
        avgFrameworkReadiness: values.avgFrameworkReadiness,
      },
    });
}

export async function getSnapshotHistory(
  orgId: string,
  days = 90
): Promise<GovernanceSnapshot[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  return db
    .select()
    .from(governanceSnapshots)
    .where(
      and(
        eq(governanceSnapshots.organizationId, orgId),
        gte(governanceSnapshots.snapshotDate, sinceStr)
      )
    )
    .orderBy(asc(governanceSnapshots.snapshotDate));
}

export async function getLatestSnapshot(orgId: string): Promise<GovernanceSnapshot | null> {
  const rows = await db
    .select()
    .from(governanceSnapshots)
    .where(eq(governanceSnapshots.organizationId, orgId))
    .orderBy(desc(governanceSnapshots.snapshotDate))
    .limit(1);

  return rows[0] ?? null;
}

// ── Recommendations data ──────────────────────────────────────────────────────

export async function getRecommendationData(orgId: string) {
  const [vendorData, riskData, controlData, auditData] = await Promise.all([
    // Low trust vendors
    db
      .select({ id: vendors.id, name: vendors.name, trustScore: vendors.trustScore })
      .from(vendors)
      .where(and(eq(vendors.organizationId, orgId), eq(vendors.status, "active"))),

    // Critical/high open risks
    db
      .select({ id: risks.id, title: risks.title, inherentScore: risks.inherentScore, category: risks.category })
      .from(risks)
      .where(eq(risks.organizationId, orgId)),

    // Weak controls
    db
      .select({ id: controls.id, name: controls.name, healthScore: controls.healthScore })
      .from(controls)
      .where(eq(controls.organizationId, orgId)),

    // Open critical findings
    db
      .select({ id: auditFindings.id, title: auditFindings.title, severity: auditFindings.severity })
      .from(auditFindings)
      .where(eq(auditFindings.organizationId, orgId)),
  ]);

  const INACTIVE = new Set(["closed", "archived", "accepted", "transferred"]);

  return {
    lowTrustVendors: vendorData.filter((v) => v.trustScore !== null && v.trustScore < 60) as Array<{ id: string; name: string; trustScore: number }>,
    criticalRisks: riskData.filter((r) => r.inherentScore >= 20 && !INACTIVE.has(r.category)),
    highRisks: riskData.filter((r) => r.inherentScore >= 12 && r.inherentScore < 20),
    weakControls: (controlData.filter((c) => c.healthScore !== null && c.healthScore < 60) as Array<{ id: string; name: string; healthScore: number }>)
      .sort((a, b) => a.healthScore - b.healthScore),
    openCriticalFindings: auditData.filter((f) => f.severity === "critical"),
    openHighFindings: auditData.filter((f) => f.severity === "high"),
  };
}

// ── Timeline events ───────────────────────────────────────────────────────────

export async function getGovernanceTimeline(orgId: string, limit = 30) {
  const { auditLogs } = await import("@/lib/db/schema");
  const { profiles } = await import("@/lib/db/schema");

  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      actorName: profiles.fullName,
    })
    .from(auditLogs)
    .leftJoin(profiles, eq(auditLogs.actorId, profiles.id))
    .where(eq(auditLogs.organizationId, orgId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
