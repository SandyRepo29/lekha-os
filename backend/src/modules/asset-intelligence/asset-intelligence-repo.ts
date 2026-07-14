import { db } from "@/lib/db";
import {
  assets, assetTypes, assetRelationships, assetDependencies,
  assetReviews, assetScores, assetAlerts, assetDataFlows,
  assetIncidents, assetSnapshots, assetRisks, assetControls,
  assetVendors, assetRegulations, assetOwners, assetCriticalityLog,
} from "@/lib/db/schema";
import { eq, and, desc, count, isNull, or, sql, inArray } from "drizzle-orm";

// ─── Dashboard Metrics ───────────────────────────────────────────────────────

export async function getDashboardMetrics(orgId: string) {
  const [
    totalAssets, activeAssets, criticalAssets, openAlerts,
    missionCritical, assetsWithPii, totalAlerts,
  ] = await Promise.all([
    db.select({ n: count() }).from(assets).where(eq(assets.organizationId, orgId)),
    db.select({ n: count() }).from(assets).where(and(eq(assets.organizationId, orgId), eq(assets.status, "active"))),
    db.select({ n: count() }).from(assets).where(and(eq(assets.organizationId, orgId), eq(assets.criticality, "critical"))),
    db.select({ n: count() }).from(assetAlerts).where(and(eq(assetAlerts.organizationId, orgId), eq(assetAlerts.status, "open"))),
    db.select({ n: count() }).from(assets).where(and(eq(assets.organizationId, orgId), eq(assets.criticality, "mission_critical"))),
    db.select({ n: count() }).from(assets).where(and(eq(assets.organizationId, orgId), eq(assets.containsPii, true))),
    db.select({ n: count() }).from(assetAlerts).where(eq(assetAlerts.organizationId, orgId)),
  ]);

  return {
    totalAssets:     Number(totalAssets[0]?.n ?? 0),
    activeAssets:    Number(activeAssets[0]?.n ?? 0),
    criticalAssets:  Number(criticalAssets[0]?.n ?? 0) + Number(missionCritical[0]?.n ?? 0),
    openAlerts:      Number(openAlerts[0]?.n ?? 0),
    assetsWithPii:   Number(assetsWithPii[0]?.n ?? 0),
    totalAlerts:     Number(totalAlerts[0]?.n ?? 0),
  };
}

// ─── Asset CRUD ──────────────────────────────────────────────────────────────

export async function findAllAssets(
  orgId: string,
  filters: { type?: string; criticality?: string; status?: string; environment?: string; limit?: number } = {}
) {
  const rows = await db.select().from(assets)
    .where(and(
      eq(assets.organizationId, orgId),
      filters.type        ? eq(assets.assetType, filters.type as any)        : undefined,
      filters.criticality ? eq(assets.criticality, filters.criticality as any) : undefined,
      filters.status      ? eq(assets.status, filters.status as any)          : undefined,
      filters.environment ? eq(assets.environment, filters.environment as any) : undefined,
    ))
    .orderBy(desc(assets.createdAt))
    .limit(filters.limit ?? 200);
  return rows;
}

export async function findAssetById(orgId: string, id: string) {
  const [row] = await db.select().from(assets)
    .where(and(eq(assets.organizationId, orgId), eq(assets.id, id)));
  return row ?? null;
}

export async function insertAsset(data: typeof assets.$inferInsert) {
  const [row] = await db.insert(assets).values(data).returning();
  return row;
}

export async function updateAsset(orgId: string, id: string, data: Partial<typeof assets.$inferInsert>) {
  const [row] = await db.update(assets)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(assets.organizationId, orgId), eq(assets.id, id)))
    .returning();
  return row;
}

export async function deleteAsset(orgId: string, id: string) {
  await db.delete(assets).where(and(eq(assets.organizationId, orgId), eq(assets.id, id)));
}

// ─── Asset Types ─────────────────────────────────────────────────────────────

export async function findAssetTypes(orgId: string) {
  return db.select().from(assetTypes)
    .where(or(isNull(assetTypes.organizationId), eq(assetTypes.organizationId, orgId)))
    .orderBy(assetTypes.name);
}

// ─── Asset Relationships ─────────────────────────────────────────────────────

export async function findRelationshipsByAsset(assetId: string) {
  return db.select().from(assetRelationships)
    .where(eq(assetRelationships.sourceAssetId, assetId))
    .orderBy(desc(assetRelationships.createdAt));
}

export async function findAllRelationships(orgId: string) {
  return db.select().from(assetRelationships)
    .where(eq(assetRelationships.organizationId, orgId))
    .orderBy(desc(assetRelationships.createdAt))
    .limit(500);
}

export async function insertRelationship(data: typeof assetRelationships.$inferInsert) {
  const [row] = await db.insert(assetRelationships).values(data).returning();
  return row;
}

export async function deleteRelationship(orgId: string, id: string) {
  await db.delete(assetRelationships)
    .where(and(eq(assetRelationships.organizationId, orgId), eq(assetRelationships.id, id)));
}

// ─── Dependencies ────────────────────────────────────────────────────────────

export async function findDependencies(orgId: string, assetId: string) {
  return db.select().from(assetDependencies)
    .where(and(eq(assetDependencies.organizationId, orgId), eq(assetDependencies.assetId, assetId)));
}

export async function insertDependency(data: typeof assetDependencies.$inferInsert) {
  const [row] = await db.insert(assetDependencies).values(data).returning();
  return row;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export async function findReviewsByAsset(assetId: string) {
  return db.select().from(assetReviews)
    .where(eq(assetReviews.assetId, assetId))
    .orderBy(desc(assetReviews.reviewedAt));
}

export async function insertReview(data: typeof assetReviews.$inferInsert) {
  const [row] = await db.insert(assetReviews).values(data).returning();
  return row;
}

// ─── Scores ──────────────────────────────────────────────────────────────────

export async function findLatestScore(orgId: string, assetId: string) {
  const [row] = await db.select().from(assetScores)
    .where(and(eq(assetScores.organizationId, orgId), eq(assetScores.assetId, assetId)))
    .orderBy(desc(assetScores.computedAt))
    .limit(1);
  return row ?? null;
}

export async function saveAssetScore(data: typeof assetScores.$inferInsert) {
  const [row] = await db.insert(assetScores).values(data).returning();
  // Update cached columns on asset
  await db.update(assets)
    .set({ trustScore: data.trustScore, trustScoreAt: new Date() })
    .where(eq(assets.id, data.assetId));
  return row;
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export async function findAlertsByOrg(
  orgId: string,
  filters: { status?: string; severity?: string } = {}
) {
  return db.select().from(assetAlerts)
    .where(and(
      eq(assetAlerts.organizationId, orgId),
      filters.status   ? eq(assetAlerts.status, filters.status)     : undefined,
      filters.severity ? eq(assetAlerts.severity, filters.severity) : undefined,
    ))
    .orderBy(desc(assetAlerts.createdAt))
    .limit(100);
}

export async function insertAlert(data: typeof assetAlerts.$inferInsert) {
  const [row] = await db.insert(assetAlerts).values(data).returning();
  return row;
}

export async function resolveAlert(orgId: string, id: string, resolvedBy: string) {
  const [row] = await db.update(assetAlerts)
    .set({ status: "resolved", resolvedAt: new Date(), resolvedBy })
    .where(and(eq(assetAlerts.organizationId, orgId), eq(assetAlerts.id, id)))
    .returning();
  return row;
}

// ─── Data Flows ──────────────────────────────────────────────────────────────

export async function findDataFlows(orgId: string, assetId?: string) {
  return db.select().from(assetDataFlows)
    .where(and(
      eq(assetDataFlows.organizationId, orgId),
      assetId ? eq(assetDataFlows.sourceAssetId, assetId) : undefined,
    ))
    .orderBy(desc(assetDataFlows.createdAt));
}

export async function insertDataFlow(data: typeof assetDataFlows.$inferInsert) {
  const [row] = await db.insert(assetDataFlows).values(data).returning();
  return row;
}

// ─── Incidents ───────────────────────────────────────────────────────────────

export async function findIncidentsByOrg(orgId: string) {
  return db.select().from(assetIncidents)
    .where(eq(assetIncidents.organizationId, orgId))
    .orderBy(desc(assetIncidents.createdAt))
    .limit(100);
}

export async function insertIncident(data: typeof assetIncidents.$inferInsert) {
  const [row] = await db.insert(assetIncidents).values(data).returning();
  return row;
}

// ─── Snapshots ───────────────────────────────────────────────────────────────

export async function saveSnapshot(data: typeof assetSnapshots.$inferInsert) {
  const [row] = await db.insert(assetSnapshots).values(data).returning();
  return row;
}

export async function getLatestSnapshot(orgId: string) {
  const [row] = await db.select().from(assetSnapshots)
    .where(eq(assetSnapshots.organizationId, orgId))
    .orderBy(desc(assetSnapshots.snapshottedAt))
    .limit(1);
  return row ?? null;
}

// ─── Junction: Risks / Controls / Vendors / Regulations ─────────────────────

export async function linkAssetRisk(orgId: string, assetId: string, riskId: string) {
  await db.insert(assetRisks).values({ organizationId: orgId, assetId, riskId }).onConflictDoNothing();
}
export async function unlinkAssetRisk(orgId: string, assetId: string, riskId: string) {
  await db.delete(assetRisks).where(and(eq(assetRisks.organizationId, orgId), eq(assetRisks.assetId, assetId), eq(assetRisks.riskId, riskId)));
}
export async function findAssetRisks(assetId: string) {
  return db.select().from(assetRisks).where(eq(assetRisks.assetId, assetId));
}

export async function linkAssetControl(orgId: string, assetId: string, controlId: string) {
  await db.insert(assetControls).values({ organizationId: orgId, assetId, controlId }).onConflictDoNothing();
}
export async function findAssetControls(assetId: string) {
  return db.select().from(assetControls).where(eq(assetControls.assetId, assetId));
}

export async function linkAssetVendor(orgId: string, assetId: string, vendorId: string, accessType = "provides") {
  await db.insert(assetVendors).values({ organizationId: orgId, assetId, vendorId, accessType }).onConflictDoNothing();
}
export async function findAssetVendors(assetId: string) {
  return db.select().from(assetVendors).where(eq(assetVendors.assetId, assetId));
}

export async function linkAssetRegulation(orgId: string, assetId: string, regulationId: string) {
  await db.insert(assetRegulations).values({ organizationId: orgId, assetId, regulationId }).onConflictDoNothing();
}
export async function findAssetRegulations(assetId: string) {
  return db.select().from(assetRegulations).where(eq(assetRegulations.assetId, assetId));
}

// ─── Criticality Log ─────────────────────────────────────────────────────────

export async function logCriticalityChange(data: typeof assetCriticalityLog.$inferInsert) {
  await db.insert(assetCriticalityLog).values(data);
}

// ─── Asset Counts by Type (for dashboard charts) ─────────────────────────────

export async function getAssetCountsByType(orgId: string) {
  const rows = await db.select({
    type: assets.assetType,
    n: count(),
  }).from(assets)
    .where(and(eq(assets.organizationId, orgId), eq(assets.status, "active")))
    .groupBy(assets.assetType);
  return rows;
}

export async function getAssetCountsByCriticality(orgId: string) {
  const rows = await db.select({
    criticality: assets.criticality,
    n: count(),
  }).from(assets)
    .where(eq(assets.organizationId, orgId))
    .groupBy(assets.criticality);
  return rows;
}
