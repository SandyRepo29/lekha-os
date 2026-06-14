import * as repo from "@/lib/repositories/asset-intelligence-repo";

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getDashboardData(orgId: string) {
  const [metrics, recentAssets, alerts, byType, byCriticality] = await Promise.all([
    repo.getDashboardMetrics(orgId),
    repo.findAllAssets(orgId, { limit: 10 }),
    repo.findAlertsByOrg(orgId, { status: "open" }),
    repo.getAssetCountsByType(orgId),
    repo.getAssetCountsByCriticality(orgId),
  ]);

  return { metrics, recentAssets, alerts, byType, byCriticality };
}

// ─── Asset CRUD ──────────────────────────────────────────────────────────────

export async function getAssets(
  orgId: string,
  filters: { type?: string; criticality?: string; status?: string; environment?: string } = {}
) {
  return repo.findAllAssets(orgId, filters);
}

export async function getAsset(orgId: string, id: string) {
  const asset = await repo.findAssetById(orgId, id);
  if (!asset) return null;

  const [risks, controls, vendors, regulations, reviews, score, relationships] = await Promise.all([
    repo.findAssetRisks(id),
    repo.findAssetControls(id),
    repo.findAssetVendors(id),
    repo.findAssetRegulations(id),
    repo.findReviewsByAsset(id),
    repo.findLatestScore(orgId, id),
    repo.findRelationshipsByAsset(id),
  ]);

  return { asset, risks, controls, vendors, regulations, reviews, score, relationships };
}

export async function createAsset(
  orgId: string,
  userId: string,
  data: {
    name: string;
    description?: string;
    assetType: string;
    category?: string;
    status?: string;
    environment?: string;
    criticality?: string;
    dataClass?: string;
    ownerId?: string;
    businessUnit?: string;
    location?: string;
    cloudProvider?: string;
    technologyStack?: string;
    complianceScope?: string[];
    containsPii?: boolean;
    containsSensitive?: boolean;
    isCrossB?: boolean;
    vendorId?: string;
    notes?: string;
  }
) {
  const asset = await repo.insertAsset({
    organizationId:   orgId,
    name:             data.name,
    description:      data.description,
    assetType:        data.assetType as any,
    category:         data.category,
    status:           (data.status ?? "active") as any,
    environment:      (data.environment ?? "production") as any,
    criticality:      (data.criticality ?? "medium") as any,
    dataClass:        data.dataClass as any,
    ownerId:          data.ownerId,
    businessUnit:     data.businessUnit,
    location:         data.location,
    cloudProvider:    data.cloudProvider,
    technologyStack:  data.technologyStack,
    complianceScope:  data.complianceScope,
    containsPii:      data.containsPii ?? false,
    containsSensitive: data.containsSensitive ?? false,
    isCrossB:         data.isCrossB ?? false,
    vendorId:         data.vendorId,
    notes:            data.notes,
    createdBy:        userId,
  });

  // Auto-generate alerts for missing critical fields
  if (data.criticality === "critical" || data.criticality === "mission_critical") {
    if (!data.ownerId) {
      await repo.insertAlert({
        organizationId: orgId,
        assetId:        asset.id,
        alertType:      "missing_owner",
        severity:       "high",
        title:          `Critical asset "${data.name}" has no owner assigned`,
        status:         "open",
      });
    }
  }

  return asset;
}

export async function updateAsset(orgId: string, id: string, data: Record<string, unknown>) {
  return repo.updateAsset(orgId, id, data as any);
}

export async function deleteAsset(orgId: string, id: string) {
  return repo.deleteAsset(orgId, id);
}

// ─── Relationships ────────────────────────────────────────────────────────────

export async function getRelationships(orgId: string) {
  const [all, assets] = await Promise.all([
    repo.findAllRelationships(orgId),
    repo.findAllAssets(orgId, { limit: 500 }),
  ]);
  return { relationships: all, assets };
}

export async function createRelationship(
  orgId: string,
  userId: string,
  data: {
    sourceAssetId: string;
    targetAssetId?: string;
    targetEntityType?: string;
    targetEntityId?: string;
    relationshipType: string;
    description?: string;
    isCritical?: boolean;
  }
) {
  return repo.insertRelationship({
    organizationId:   orgId,
    sourceAssetId:    data.sourceAssetId,
    targetAssetId:    data.targetAssetId,
    targetEntityType: data.targetEntityType,
    targetEntityId:   data.targetEntityId,
    relationshipType: data.relationshipType as any,
    description:      data.description,
    isCritical:       data.isCritical ?? false,
    createdBy:        userId,
  });
}

export async function removeRelationship(orgId: string, id: string) {
  return repo.deleteRelationship(orgId, id);
}

// ─── Asset Types ─────────────────────────────────────────────────────────────

export async function getAssetTypes(orgId: string) {
  return repo.findAssetTypes(orgId);
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export async function addReview(
  orgId: string,
  assetId: string,
  reviewerId: string,
  data: { outcome: string; findings?: string; recommendations?: string; nextReviewAt?: string }
) {
  const review = await repo.insertReview({
    organizationId:  orgId,
    assetId,
    reviewerId,
    outcome:         data.outcome as any,
    findings:        data.findings,
    recommendations: data.recommendations,
    nextReviewAt:    data.nextReviewAt,
  });
  await repo.updateAsset(orgId, assetId, {
    lastReviewAt: new Date(),
    nextReviewAt: data.nextReviewAt ? new Date(data.nextReviewAt) : undefined,
  });
  return review;
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export async function getAlerts(orgId: string, filters: { status?: string; severity?: string } = {}) {
  return repo.findAlertsByOrg(orgId, filters);
}

export async function resolveAlert(orgId: string, id: string, userId: string) {
  return repo.resolveAlert(orgId, id, userId);
}

// ─── Trust Score Computation ─────────────────────────────────────────────────

export async function computeAndSaveAssetScore(orgId: string, assetId: string) {
  const detail = await getAsset(orgId, assetId);
  if (!detail) return null;

  const { risks, controls, vendors, regulations } = detail;

  // Security Controls: based on controls linked
  const securityControls = Math.min(100, controls.length * 20);

  // Compliance Coverage: based on regulations + compliance scope
  const complianceCoverage = Math.min(100,
    (detail.asset.complianceScope?.length ?? 0) * 15 +
    regulations.length * 15
  );

  // Risk Posture: inverse of linked risks (fewer risks = better)
  const riskPosture = Math.max(0, 100 - risks.length * 15);

  // Data Protection: PII + encryption
  const dataProtection = detail.asset.containsPii
    ? (detail.asset.encryptionStatus ? 60 : 20)
    : 80;

  // Operational Health: reviews done
  const operationalHealth = detail.reviews.length > 0
    ? Math.min(100, 60 + detail.reviews.length * 10)
    : 30;

  // Monitoring Coverage: vendor links suggest coverage
  const monitoringCoverage = Math.min(100, vendors.length * 25 + 25);

  const trustScore = Math.round(
    securityControls   * 0.25 +
    complianceCoverage * 0.20 +
    riskPosture        * 0.20 +
    dataProtection     * 0.15 +
    operationalHealth  * 0.10 +
    monitoringCoverage * 0.10
  );

  return repo.saveAssetScore({
    organizationId:     orgId,
    assetId,
    trustScore,
    securityControls,
    complianceCoverage,
    riskPosture,
    dataProtection,
    operationalHealth,
    monitoringCoverage,
    triggerEvent:       "computed",
  });
}

// ─── Snapshot ────────────────────────────────────────────────────────────────

export async function takeSnapshot(orgId: string) {
  const [metrics, byType] = await Promise.all([
    repo.getDashboardMetrics(orgId),
    repo.getAssetCountsByType(orgId),
  ]);

  const typeMap: Record<string, number> = {};
  for (const row of byType) typeMap[row.type] = Number(row.n);

  return repo.saveSnapshot({
    organizationId: orgId,
    totalAssets:    metrics.totalAssets,
    activeAssets:   metrics.activeAssets,
    criticalAssets: metrics.criticalAssets,
    openAlerts:     metrics.openAlerts,
    assetsByType:   typeMap,
  });
}

// ─── Data Flows ──────────────────────────────────────────────────────────────

export async function getDataFlows(orgId: string, assetId?: string) {
  return repo.findDataFlows(orgId, assetId);
}
