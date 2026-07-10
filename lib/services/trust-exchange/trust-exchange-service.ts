import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import * as repo from "@/lib/repositories/trust-exchange-repo";
import { DomainError } from "@/lib/services/errors";

async function logAudit(orgId: string, userId: string | null, action: string, entityId: string) {
  await db.insert(auditLogs).values({
    organizationId: orgId,
    actorId: userId,
    action,
    entityId,
    entityType: "trust_exchange",
    metadata: {},
  }).catch(() => {});
}

// ─── Profile ─────────────────────────────────────────────────

export async function getOrCreateProfile(orgId: string) {
  return repo.getOrCreateProfile(orgId);
}

export async function updateProfile(
  orgId: string,
  userId: string,
  data: {
    displayName?: string;
    tagline?: string;
    description?: string;
    industry?: string;
    companySize?: string;
    country?: string;
    website?: string;
    isPublished?: boolean;
    visibility?: string;
  }
) {
  if (data.displayName !== undefined && !data.displayName.trim()) {
    throw new DomainError("Display name is required.");
  }
  const completeness = computeCompleteness(data);
  const profile = await repo.updateProfile(orgId, { ...data as any, profileCompleteness: completeness });
  await repo.logActivity({
    organizationId: orgId,
    actorId: userId,
    activityType: "profile_updated",
    entityId: profile.id,
    entityType: "trust_profile",
    description: "Trust Profile updated",
  });
  return profile;
}

function computeCompleteness(data: Record<string, unknown>): number {
  const fields = ["displayName", "tagline", "description", "industry", "country", "website"];
  const filled = fields.filter((f) => data[f] && String(data[f]).trim()).length;
  return Math.round((filled / fields.length) * 100);
}

export async function publishProfile(orgId: string, userId: string) {
  const profile = await repo.updateProfile(orgId, { isPublished: true, visibility: "public" });
  await logAudit(orgId, userId, "trust_profile.published", profile.id);
  return profile;
}

export async function unpublishProfile(orgId: string, userId: string) {
  const profile = await repo.updateProfile(orgId, { isPublished: false });
  await logAudit(orgId, userId, "trust_profile.unpublished", profile.id);
  return profile;
}

export async function getDashboardMetrics(orgId: string) {
  return repo.getDashboardMetrics(orgId);
}

export async function getDirectory(filters?: {
  industry?: string;
  country?: string;
  minTrustScore?: number;
  riskLevel?: string;
}) {
  return repo.getPublicDirectory(filters);
}

// ─── Documents ───────────────────────────────────────────────

export async function listDocuments(orgId: string) {
  return repo.listDocuments(orgId);
}

export async function addDocument(
  orgId: string,
  userId: string | null,
  data: {
    docType: string;
    title: string;
    description?: string;
    fileName?: string;
    fileSize?: number;
    issuedDate?: string;
    expiryDate?: string;
    issuer?: string;
    visibility?: string;
  }
) {
  if (!data.title?.trim()) throw new DomainError("Document title is required.");
  const profile = await repo.getOrCreateProfile(orgId);

  const doc = await repo.createDocument({
    organizationId: orgId,
    trustProfileId: profile.id,
    docType: data.docType as any,
    title: data.title.trim(),
    description: data.description,
    fileName: data.fileName,
    fileSize: data.fileSize,
    issuedDate: data.issuedDate,
    expiryDate: data.expiryDate,
    issuer: data.issuer,
    visibility: (data.visibility ?? "private") as any,
    verificationLevel: "self_attested",
    createdBy: userId,
  });

  await repo.logActivity({
    organizationId: orgId,
    actorId: userId,
    activityType: data.visibility === "public" ? "document_shared" : "profile_updated",
    entityId: doc.id,
    entityType: "trust_document",
    description: `Document "${doc.title}" added`,
  });

  await logAudit(orgId, userId, "trust_document.added", doc.id);
  return doc;
}

export async function updateDocument(orgId: string, userId: string, docId: string, data: {
  title?: string;
  description?: string;
  visibility?: string;
  issuedDate?: string;
  expiryDate?: string;
  issuer?: string;
}) {
  const doc = await repo.updateDocument(orgId, docId, data as any);
  await logAudit(orgId, userId, "trust_document.updated", docId);
  return doc;
}

export async function deleteDocument(orgId: string, userId: string, docId: string) {
  await repo.deleteDocument(orgId, docId);
  await logAudit(orgId, userId, "trust_document.deleted", docId);
}

export async function verifyDocument(orgId: string, userId: string, docId: string, notes?: string) {
  const doc = await repo.getDocument(orgId, docId);
  if (!doc) throw new DomainError("Document not found.");

  await repo.createVerification({
    trustDocumentId: docId,
    organizationId: orgId,
    verificationLevel: "customer_verified",
    verifiedBy: userId,
    verifierOrgId: orgId,
    verificationNotes: notes,
  });

  const updated = await repo.updateDocument(orgId, docId, {
    isVerified: true,
    verificationLevel: "customer_verified",
    verifiedAt: new Date(),
    verifiedBy: userId,
  });

  await repo.logActivity({
    organizationId: orgId,
    actorId: userId,
    activityType: "document_verified",
    entityId: docId,
    entityType: "trust_document",
    description: `Document "${doc.title}" verified`,
  });

  return updated;
}

// ─── Badges ──────────────────────────────────────────────────

export async function listBadges(orgId: string) {
  return repo.listBadges(orgId);
}

export async function issueBadge(orgId: string, userId: string, data: {
  badgeType: string;
  label: string;
  description?: string;
}) {
  const profile = await repo.getOrCreateProfile(orgId);
  const badge = await repo.issueBadge({
    organizationId: orgId,
    trustProfileId: profile.id,
    badgeType: data.badgeType as any,
    label: data.label,
    description: data.description,
    issuedBy: userId,
  });
  await repo.logActivity({
    organizationId: orgId,
    actorId: userId,
    activityType: "badge_issued",
    entityId: badge.id,
    entityType: "trust_badge",
    description: `Badge "${badge.label}" issued`,
  });
  await logAudit(orgId, userId, "trust_badge.issued", badge.id);
  return badge;
}

export async function revokeBadge(orgId: string, userId: string, badgeId: string) {
  await repo.revokeBadge(orgId, badgeId);
  await logAudit(orgId, userId, "trust_badge.revoked", badgeId);
}

// ─── Questionnaires ───────────────────────────────────────────

export async function listQuestionnaires(orgId: string) {
  return repo.listQuestionnaires(orgId);
}

export async function listAnswers(orgId: string) {
  return repo.listAnswers(orgId);
}

/** A single questionnaire plus this org's saved answer row (if any). */
export async function getQuestionnaireDetail(orgId: string, questionnaireId: string) {
  const questionnaires = await repo.listQuestionnaires(orgId);
  const questionnaire = questionnaires.find((q) => q.id === questionnaireId) ?? null;
  const answers = questionnaire ? await repo.getAnswers(orgId, questionnaireId) : null;
  return { questionnaire, answers };
}

export async function saveAnswers(orgId: string, userId: string, questionnaireId: string, answers: Record<string, unknown>, visibility?: string) {
  const profile = await repo.getOrCreateProfile(orgId);
  const totalKeys = Object.keys(answers).length;
  const filledKeys = Object.values(answers).filter((v) => v !== "" && v !== null && v !== undefined).length;
  const completionPercent = totalKeys > 0 ? Math.round((filledKeys / totalKeys) * 100) : 0;

  const row = await repo.upsertAnswers({
    organizationId: orgId,
    trustProfileId: profile.id,
    questionnaireId,
    answers,
    completionPercent,
    visibility: (visibility ?? "private") as any,
    lastUpdatedBy: userId,
  });

  await repo.logActivity({
    organizationId: orgId,
    actorId: userId,
    activityType: "questionnaire_answered",
    entityId: row.id,
    entityType: "trust_answer",
    description: `Questionnaire answers updated (${completionPercent}% complete)`,
  });

  return row;
}

// ─── Relationships ────────────────────────────────────────────

export async function listRelationships(orgId: string) {
  return repo.listRelationships(orgId);
}

export async function requestRelationship(orgId: string, userId: string, targetOrgId: string, type: string) {
  if (orgId === targetOrgId) throw new DomainError("Cannot connect to your own organization.");
  const rel = await repo.createRelationship({
    requesterOrgId: orgId,
    targetOrgId,
    relationshipType: type as any,
    status: "pending",
    initiatedBy: userId,
  });
  if (rel) {
    await repo.logActivity({
      organizationId: orgId,
      actorId: userId,
      activityType: "relationship_created",
      entityId: rel.id,
      entityType: "trust_relationship",
      description: "Trust relationship requested",
    });
  }
  return rel;
}

// ─── Activity ─────────────────────────────────────────────────

export async function listActivity(orgId: string) {
  return repo.listActivity(orgId, 30);
}
