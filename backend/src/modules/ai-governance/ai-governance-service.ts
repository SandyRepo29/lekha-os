"use server";

import * as repo from "@/backend/src/modules/ai-governance/ai-governance-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";
class DomainError extends Error {
  constructor(msg: string) { super(msg); this.name = "DomainError"; }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardData(orgId: string) {
  const [metrics, systems, vendors, risks, controls, policies, incidents, trustScores] =
    await Promise.all([
      repo.getDashboardMetrics(orgId),
      repo.findAllSystems(orgId),
      repo.findAllVendors(orgId),
      repo.findAllRisks(orgId),
      repo.findAllControls(orgId),
      repo.findAllPolicies(orgId),
      repo.findAllIncidents(orgId),
      repo.findAllCompliance(orgId),
    ]);

  return {
    metrics,
    systems,
    vendors,
    risks,
    controls,
    policies,
    incidents,
    compliance: trustScores,
  };
}

// ── AI Systems ────────────────────────────────────────────────────────────────

export async function createAiSystem(
  orgId: string,
  userId: string,
  data: {
    name: string;
    description?: string;
    systemType?: string;
    vendor?: string;
    status?: string;
    riskClassification?: string;
    purpose?: string;
    dataInputs?: string;
    dataOutputs?: string;
    deploymentEnv?: string;
    ownerDept?: string;
    ownerId?: string;
    approvalStatus?: string;
    approvedAt?: Date;
    lastAuditedAt?: Date;
    metadata?: Record<string, unknown>;
  }
) {
  if (!data.name?.trim()) throw new DomainError("AI system name is required.");

  const system = await repo.createSystem(orgId, data as any, userId);

  await recordAudit({
    organizationId: orgId,
    actorId: userId,
    action: "ai_system.create",
    entityType: "ai_system",
    entityId: system.id,
    metadata: { name: data.name },
  }).catch(() => {});

  return system;
}

export async function updateAiSystem(
  orgId: string,
  userId: string,
  id: string,
  data: Partial<{
    name: string;
    description: string;
    systemType: string;
    vendor: string;
    status: string;
    riskClassification: string;
    purpose: string;
    dataInputs: string;
    dataOutputs: string;
    deploymentEnv: string;
    ownerDept: string;
    ownerId: string;
    approvalStatus: string;
    approvedAt: Date;
    lastAuditedAt: Date;
    metadata: Record<string, unknown>;
  }>
) {
  const system = await repo.updateSystem(orgId, id, data as any);

  await recordAudit({
    organizationId: orgId,
    actorId: userId,
    action: "ai_system.update",
    entityType: "ai_system",
    entityId: id,
    metadata: { fields: Object.keys(data) },
  }).catch(() => {});

  return system;
}

export async function deleteAiSystem(orgId: string, userId: string, id: string) {
  await repo.deleteSystem(orgId, id);

  await recordAudit({
    organizationId: orgId,
    actorId: userId,
    action: "ai_system.delete",
    entityType: "ai_system",
    entityId: id,
  }).catch(() => {});
}

// ── AI Vendors ────────────────────────────────────────────────────────────────

export async function createAiVendor(
  orgId: string,
  userId: string,
  data: {
    name: string;
    description?: string;
    vendorType?: string;
    contractStatus?: string;
    riskLevel?: string;
    dataAccessLevel?: string;
    subprocessors?: string[];
    privacyPolicyUrl?: string;
    dpaSignedAt?: Date;
    lastReviewedAt?: Date;
    metadata?: Record<string, unknown>;
  }
) {
  if (!data.name?.trim()) throw new DomainError("AI vendor name is required.");

  const vendor = await repo.createVendor(orgId, data as any, userId);

  await recordAudit({
    organizationId: orgId,
    actorId: userId,
    action: "ai_vendor.create",
    entityType: "ai_vendor",
    entityId: vendor.id,
    metadata: { name: data.name },
  }).catch(() => {});

  return vendor;
}

export async function updateAiVendor(
  orgId: string,
  userId: string,
  id: string,
  data: Partial<{
    name: string;
    description: string;
    vendorType: string;
    contractStatus: string;
    riskLevel: string;
    dataAccessLevel: string;
    subprocessors: string[];
    privacyPolicyUrl: string;
    dpaSignedAt: Date;
    lastReviewedAt: Date;
    metadata: Record<string, unknown>;
  }>
) {
  const vendor = await repo.updateVendor(orgId, id, data as any);

  await recordAudit({
    organizationId: orgId,
    actorId: userId,
    action: "ai_vendor.update",
    entityType: "ai_vendor",
    entityId: id,
    metadata: { fields: Object.keys(data) },
  }).catch(() => {});

  return vendor;
}

// ── AI Risks ──────────────────────────────────────────────────────────────────

export async function createAiRisk(
  orgId: string,
  userId: string,
  data: {
    title: string;
    description?: string;
    systemId?: string;
    riskCategory?: string;
    severity?: string;
    likelihood?: string;
    impact?: string;
    status?: string;
    mitigationPlan?: string;
    ownerId?: string;
    dueDate?: Date;
    metadata?: Record<string, unknown>;
  }
) {
  if (!data.title?.trim()) throw new DomainError("AI risk title is required.");

  const risk = await repo.createRisk(orgId, data as any, userId);

  await recordAudit({
    organizationId: orgId,
    actorId: userId,
    action: "ai_risk.create",
    entityType: "ai_risk",
    entityId: risk.id,
    metadata: { title: data.title, severity: data.severity },
  }).catch(() => {});

  return risk;
}

export async function updateAiRisk(
  orgId: string,
  userId: string,
  id: string,
  data: Partial<{
    title: string;
    description: string;
    systemId: string;
    riskCategory: string;
    severity: string;
    likelihood: string;
    impact: string;
    status: string;
    mitigationPlan: string;
    ownerId: string;
    dueDate: Date;
    metadata: Record<string, unknown>;
  }>
) {
  const risk = await repo.updateRisk(orgId, id, data as any);

  await recordAudit({
    organizationId: orgId,
    actorId: userId,
    action: "ai_risk.update",
    entityType: "ai_risk",
    entityId: id,
    metadata: { fields: Object.keys(data) },
  }).catch(() => {});

  return risk;
}

// ── AI Controls ───────────────────────────────────────────────────────────────

export async function createAiControl(
  orgId: string,
  userId: string,
  data: {
    title: string;
    description?: string;
    systemId?: string;
    controlType?: string;
    category?: string;
    implementationStatus?: string;
    effectiveness?: string;
    ownerId?: string;
    lastTestedAt?: Date;
    nextTestDate?: Date;
    metadata?: Record<string, unknown>;
  }
) {
  if (!data.title?.trim()) throw new DomainError("AI control title is required.");

  const control = await repo.createControl(orgId, { name: data.title, ...data } as any, userId);

  await recordAudit({
    organizationId: orgId,
    actorId: userId,
    action: "ai_control.create",
    entityType: "ai_control",
    entityId: control.id,
    metadata: { title: data.title },
  }).catch(() => {});

  return control;
}

// ── AI Policies ───────────────────────────────────────────────────────────────

export async function createAiPolicy(
  orgId: string,
  userId: string,
  data: {
    title: string;
    description?: string;
    policyType?: string;
    status?: string;
    version?: string;
    content?: string;
    ownerId?: string;
    effectiveDate?: Date;
    reviewDate?: Date;
    metadata?: Record<string, unknown>;
  }
) {
  if (!data.title?.trim()) throw new DomainError("AI policy title is required.");

  const policy = await repo.createPolicy(orgId, { name: data.title, ...data } as any, userId);

  await recordAudit({
    organizationId: orgId,
    actorId: userId,
    action: "ai_policy.create",
    entityType: "ai_policy",
    entityId: policy.id,
    metadata: { title: data.title, policyType: data.policyType },
  }).catch(() => {});

  return policy;
}

// ── AI Incidents ──────────────────────────────────────────────────────────────

export async function createAiIncident(
  orgId: string,
  userId: string,
  data: {
    title: string;
    description?: string;
    systemId?: string;
    severity?: string;
    incidentType?: string;
    status?: string;
    reportedBy?: string;
    detectedAt?: Date;
    resolvedAt?: Date;
    rootCause?: string;
    remediation?: string;
    metadata?: Record<string, unknown>;
  }
) {
  if (!data.title?.trim()) throw new DomainError("AI incident title is required.");

  const incident = await repo.createIncident(orgId, data as any, userId);

  await recordAudit({
    organizationId: orgId,
    actorId: userId,
    action: "ai_incident.create",
    entityType: "ai_incident",
    entityId: incident.id,
    metadata: { title: data.title, severity: data.severity },
  }).catch(() => {});

  return incident;
}

export async function updateAiIncident(
  orgId: string,
  userId: string,
  id: string,
  data: Partial<{
    title: string;
    description: string;
    systemId: string;
    severity: string;
    incidentType: string;
    status: string;
    reportedBy: string;
    detectedAt: Date;
    resolvedAt: Date;
    rootCause: string;
    remediation: string;
    metadata: Record<string, unknown>;
  }>
) {
  const incident = await repo.updateIncident(orgId, id, data as any);

  await recordAudit({
    organizationId: orgId,
    actorId: userId,
    action: "ai_incident.update",
    entityType: "ai_incident",
    entityId: id,
    metadata: { fields: Object.keys(data), status: data.status },
  }).catch(() => {});

  return incident;
}

// ── AI Trust Score™ ───────────────────────────────────────────────────────────

export type AiTrustLevel =
  | "trusted"
  | "managed"
  | "monitored"
  | "needs_attention"
  | "high_risk"
  | "restricted";

export interface AiTrustScoreBreakdown {
  systemId: string;
  overall: number;
  level: AiTrustLevel;
  components: {
    risk: number;       // 25%
    controls: number;   // 25%
    compliance: number; // 20%
    monitoring: number; // 15%
    vendor: number;     // 10%
    incidents: number;  // 5%
  };
  computedAt: Date;
}

function getAiTrustLevel(score: number): AiTrustLevel {
  if (score >= 90) return "trusted";
  if (score >= 75) return "managed";
  if (score >= 60) return "monitored";
  if (score >= 45) return "needs_attention";
  if (score >= 30) return "high_risk";
  return "restricted";
}

export async function computeAiTrustScore(
  orgId: string,
  systemId: string
): Promise<AiTrustScoreBreakdown> {
  const [risks, controls, complianceRecords, incidents, system] = await Promise.all([
    repo.findAllRisks(orgId, { systemId }),
    repo.findAllControls(orgId),
    repo.findAllCompliance(orgId),
    repo.findAllIncidents(orgId, { systemId }),
    repo.findSystemById(orgId, systemId),
  ]);

  // Risk score (25%) — inversely proportional to high/critical risks
  const criticalRisks = risks.filter(
    (r: any) => r.riskLevel === "critical" || r.riskLevel === "high"
  ).length;
  const riskScore = Math.max(0, 100 - criticalRisks * 20);

  // Controls score (25%) — % of controls that are "implemented"
  const implementedControls = controls.filter(
    (c: any) => c.status === "implemented"
  ).length;
  const controlsScore =
    controls.length > 0
      ? Math.round((implementedControls / controls.length) * 100)
      : 50; // no controls defined: neutral 50

  // Compliance score (20%) — avg readiness across linked compliance records
  const readinessValues: number[] = complianceRecords.map(
    (cr: any) => Number(cr.readinessScore ?? 0)
  );
  const complianceScore =
    readinessValues.length > 0
      ? Math.round(
          readinessValues.reduce((sum: number, v: number) => sum + v, 0) /
            readinessValues.length
        )
      : 50;

  // Monitoring score (15%) — presence of monitoring controls + at least one assessment
  const monitoringControls = controls.filter(
    (c: any) => c.controlCategory === "model_monitoring"
  ).length;
  const hasAssessment = system?.lastAssessedAt != null;
  const monitoringScore = Math.min(
    100,
    (monitoringControls > 0 ? 60 : 20) + (hasAssessment ? 40 : 0)
  );

  // Vendor score (10%) — pull linked vendor trust score if applicable
  let vendorScore = 70; // default neutral when no vendor linked

  // Incident score (5%) — inversely proportional to open incidents
  const openIncidents = incidents.filter(
    (i: any) => i.status === "open" || i.status === "investigating"
  ).length;
  const incidentScore = Math.max(0, 100 - openIncidents * 25);

  const overall = Math.round(
    riskScore * 0.25 +
      controlsScore * 0.25 +
      complianceScore * 0.2 +
      monitoringScore * 0.15 +
      vendorScore * 0.1 +
      incidentScore * 0.05
  );

  const breakdown: AiTrustScoreBreakdown = {
    systemId,
    overall,
    level: getAiTrustLevel(overall),
    components: {
      risk: riskScore,
      controls: controlsScore,
      compliance: complianceScore,
      monitoring: monitoringScore,
      vendor: vendorScore,
      incidents: incidentScore,
    },
    computedAt: new Date(),
  };

  await repo.saveAiTrustScore(orgId, systemId, {
    overallScore: overall,
    riskScore,
    controlsScore,
    complianceScore,
    monitoringScore,
    vendorScore,
    incidentScore,
    trustLevel: breakdown.level,
    breakdown: breakdown.components,
  } as any).catch(() => {});

  return breakdown;
}
