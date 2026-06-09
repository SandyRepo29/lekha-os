import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import * as repo from "@/lib/repositories/privacy-repo";
import { computePrivacyScore } from "@/lib/services/privacy-score";
import { DomainError } from "@/lib/services/errors";

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getDashboardData(orgId: string) {
  const [assetMetrics, consentMetrics, dsrMetrics, recentRequests, latestScore] =
    await Promise.all([
      repo.getDataAssetDashboardMetrics(orgId),
      repo.getConsentMetrics(orgId),
      repo.getDsrMetrics(orgId),
      repo.findRequestsByOrg(orgId, { status: "submitted" }),
      repo.getLatestPrivacyScore(orgId),
    ]);

  return {
    assetMetrics,
    consentMetrics,
    dsrMetrics,
    recentRequests: recentRequests.slice(0, 5),
    latestScore,
  };
}

// ─── Data Assets ─────────────────────────────────────────────────────────────

export async function listAssets(
  orgId: string,
  filters?: { status?: string; category?: string; sensitivity?: string }
) {
  return repo.findAssetsByOrg(orgId, filters);
}

export async function getAssetDetail(orgId: string, assetId: string) {
  return repo.findAssetById(assetId, orgId);
}

export async function createAsset(
  orgId: string,
  userId: string,
  data: {
    name: string;
    description?: string;
    ownerId?: string;
    department?: string;
    dataCategory?: string;
    sensitivity?: string;
    purpose?: string;
    storageLocation?: string;
    retentionPeriod?: number;
    crossBorder?: boolean;
  }
) {
  if (!data.name?.trim()) throw new DomainError("Asset name is required.");

  const asset = await repo.createAsset({ organizationId: orgId, ...data, name: data.name.trim() });
  await logAction(orgId, userId, "dpdp_privacy.asset_created", asset.id, { name: asset.name });
  return asset;
}

export async function updateAsset(
  orgId: string,
  userId: string,
  assetId: string,
  data: Parameters<typeof repo.updateAsset>[2]
) {
  const existing = await repo.findAssetById(assetId, orgId);
  if (!existing) throw new DomainError("Data asset not found.");

  const updated = await repo.updateAsset(assetId, orgId, data);
  await logAction(orgId, userId, "dpdp_privacy.asset_updated", assetId, { name: updated.name });
  return updated;
}

export async function deleteAsset(orgId: string, userId: string, assetId: string) {
  const existing = await repo.findAssetById(assetId, orgId);
  if (!existing) throw new DomainError("Data asset not found.");

  await repo.deleteAsset(assetId, orgId);
  await logAction(orgId, userId, "dpdp_privacy.asset_deleted", assetId, { name: existing.name });
}

// ─── Consent Records ─────────────────────────────────────────────────────────

export async function listConsents(
  orgId: string,
  filters?: { status?: string; assetId?: string }
) {
  return repo.findConsentsByOrg(orgId, filters);
}

export async function createConsent(
  orgId: string,
  userId: string,
  data: {
    subjectId: string;
    subjectName?: string;
    subjectEmail?: string;
    purpose: string;
    consentStatus?: string;
    dataAssetId?: string;
    obtainedAt?: Date;
    expiresAt?: Date;
    source?: string;
    notes?: string;
  }
) {
  if (!data.subjectId?.trim()) throw new DomainError("Subject ID is required.");
  if (!data.purpose?.trim()) throw new DomainError("Purpose is required.");

  const consent = await repo.createConsent({ organizationId: orgId, ...data });
  await logAction(orgId, userId, "dpdp_privacy.consent_created", consent.id, {
    subjectId: data.subjectId,
  });
  return consent;
}

export async function updateConsent(
  orgId: string,
  userId: string,
  consentId: string,
  data: Parameters<typeof repo.updateConsent>[2]
) {
  const updated = await repo.updateConsent(consentId, orgId, data);
  await logAction(orgId, userId, "dpdp_privacy.consent_updated", consentId, {});
  return updated;
}

// ─── Privacy Requests (DSR) ──────────────────────────────────────────────────

export async function listRequests(
  orgId: string,
  filters?: { status?: string; type?: string }
) {
  return repo.findRequestsByOrg(orgId, filters);
}

export async function getRequestDetail(orgId: string, requestId: string) {
  return repo.findRequestById(requestId, orgId);
}

export async function createRequest(
  orgId: string,
  userId: string,
  data: {
    requestType: string;
    subjectName: string;
    subjectEmail: string;
    description?: string;
    ownerId?: string;
  }
) {
  if (!data.subjectName?.trim()) throw new DomainError("Subject name is required.");
  if (!data.subjectEmail?.trim()) throw new DomainError("Subject email is required.");
  if (!data.requestType) throw new DomainError("Request type is required.");

  // DPDP SLA: 30 days from submission
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const request = await repo.createRequest({
    organizationId: orgId,
    ...data,
    dueDate,
  });
  await logAction(orgId, userId, "dpdp_privacy.dsr_created", request.id, {
    type: data.requestType,
    subject: data.subjectEmail,
  });
  return request;
}

export async function updateRequestStatus(
  orgId: string,
  userId: string,
  requestId: string,
  status: string,
  notes?: string
) {
  const existing = await repo.findRequestById(requestId, orgId);
  if (!existing) throw new DomainError("Privacy request not found.");

  const completedAt = ["completed", "closed"].includes(status) ? new Date() : undefined;
  const updated = await repo.updateRequest(requestId, orgId, {
    status,
    resolutionNotes: notes,
    completedAt,
  });
  await logAction(orgId, userId, "dpdp_privacy.dsr_status_updated", requestId, {
    status,
  });
  return updated;
}

// ─── Retention Policies ──────────────────────────────────────────────────────

export async function listRetentionPolicies(orgId: string) {
  return repo.findRetentionPoliciesByOrg(orgId);
}

export async function createRetentionPolicy(
  orgId: string,
  userId: string,
  data: {
    name: string;
    description?: string;
    dataCategory?: string;
    retentionDays: number;
    legalBasis?: string;
    actionOnExpiry?: string;
  }
) {
  if (!data.name?.trim()) throw new DomainError("Policy name is required.");
  if (!data.retentionDays || data.retentionDays < 1)
    throw new DomainError("Retention days must be at least 1.");

  const policy = await repo.createRetentionPolicy({ organizationId: orgId, ...data });
  await logAction(orgId, userId, "dpdp_privacy.retention_policy_created", policy.id, {
    name: policy.name,
  });
  return policy;
}

// ─── Privacy Assessments (PIA) ────────────────────────────────────────────────

export async function listAssessments(
  orgId: string,
  filters?: { status?: string; riskLevel?: string }
) {
  return repo.findAssessmentsByOrg(orgId, filters);
}

export async function getAssessmentDetail(orgId: string, assessmentId: string) {
  return repo.findAssessmentById(assessmentId, orgId);
}

export async function createAssessment(
  orgId: string,
  userId: string,
  data: {
    title: string;
    scope?: string;
    ownerId?: string;
    riskLevel?: string;
    purpose?: string;
    dataTypes?: string;
  }
) {
  if (!data.title?.trim()) throw new DomainError("Assessment title is required.");

  const assessment = await repo.createAssessment({ organizationId: orgId, ...data });
  await logAction(orgId, userId, "dpdp_privacy.pia_created", assessment.id, {
    title: assessment.title,
  });
  return assessment;
}

export async function updateAssessment(
  orgId: string,
  userId: string,
  assessmentId: string,
  data: Parameters<typeof repo.updateAssessment>[2]
) {
  const existing = await repo.findAssessmentById(assessmentId, orgId);
  if (!existing) throw new DomainError("Assessment not found.");

  const updated = await repo.updateAssessment(assessmentId, orgId, data);
  await logAction(orgId, userId, "dpdp_privacy.pia_updated", assessmentId, {
    title: updated.title,
  });
  return updated;
}

// ─── Data Transfers ──────────────────────────────────────────────────────────

export async function listTransfers(orgId: string) {
  return repo.findTransfersByOrg(orgId);
}

export async function createTransfer(
  orgId: string,
  userId: string,
  data: {
    dataAssetId?: string;
    destinationCountry: string;
    recipientName: string;
    transferBasis: string;
    riskNotes?: string;
    reviewDate?: Date;
  }
) {
  if (!data.destinationCountry?.trim()) throw new DomainError("Destination country is required.");
  if (!data.recipientName?.trim()) throw new DomainError("Recipient name is required.");
  if (!data.transferBasis?.trim()) throw new DomainError("Transfer basis is required.");

  const transfer = await repo.createTransfer({ organizationId: orgId, ...data });
  await logAction(orgId, userId, "dpdp_privacy.transfer_created", transfer.id, {
    country: data.destinationCountry,
    recipient: data.recipientName,
  });
  return transfer;
}

export async function approveTransfer(
  orgId: string,
  approverId: string,
  transferId: string
) {
  const updated = await repo.updateTransfer(transferId, orgId, {
    status: "approved",
    approvedBy: approverId,
    approvedAt: new Date(),
  });
  await logAction(orgId, approverId, "dpdp_privacy.transfer_approved", transferId, {});
  return updated;
}

// ─── Privacy Trust Score ─────────────────────────────────────────────────────

export async function computeAndSavePrivacyScore(orgId: string) {
  const inputs = await repo.getScoreInputs(orgId);
  const breakdown = computePrivacyScore(inputs);

  await repo.savePrivacyScore({
    organizationId: orgId,
    score: breakdown.score,
    inventoryScore: breakdown.components.inventory,
    consentScore: breakdown.components.consent,
    dsrScore: breakdown.components.dsr,
    retentionScore: breakdown.components.retention,
    riskScore: breakdown.components.risks,
    controlsScore: breakdown.components.controls,
  });

  return breakdown;
}

// ─── Metric wrappers (re-exported for pages via service layer) ───────────────

export async function getConsentMetrics(orgId: string) {
  return repo.getConsentMetrics(orgId);
}

export async function getDsrMetrics(orgId: string) {
  return repo.getDsrMetrics(orgId);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function logAction(
  orgId: string,
  userId: string,
  action: string,
  entityId: string,
  meta: Record<string, unknown>
) {
  await db
    .insert(auditLogs)
    .values({
      organizationId: orgId,
      actorId: userId,
      action,
      entityType: "dpdp_privacy",
      entityId,
      metadata: meta,
    })
    .catch(() => {});
}
