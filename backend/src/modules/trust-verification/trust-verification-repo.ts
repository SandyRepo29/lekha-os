import { db } from "@/lib/db";
import {
  verificationPrograms, tvaVerifications, verificationReviews,
  verificationEvidence, verificationBadges, verificationCertificates,
  verificationRegistry, verificationEvents, verificationRenewals,
  verificationAssessments, verificationDecisions, verificationAuditors,
  profiles,
  type VerificationProgram, type TvaVerification, type VerificationReview,
  type VerificationEvidence, type VerificationBadge, type VerificationCertificate,
  type VerificationRegistry, type VerificationEvent, type VerificationRenewal,
  type VerificationAssessment, type VerificationDecision, type VerificationAuditor,
} from "@/lib/db/schema";
import { eq, and, desc, sql, isNull, or, lte, gte, ne, count } from "drizzle-orm";

// ── Programs ──────────────────────────────────────────────────────────────────

export async function findAllPrograms(orgId?: string): Promise<VerificationProgram[]> {
  return db.select().from(verificationPrograms).where(
    or(
      eq(verificationPrograms.programType, "builtin"),
      orgId ? eq(verificationPrograms.organizationId, orgId) : isNull(verificationPrograms.organizationId)
    )
  ).orderBy(verificationPrograms.name);
}

export async function findProgramById(id: string): Promise<VerificationProgram | null> {
  const rows = await db.select().from(verificationPrograms).where(eq(verificationPrograms.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function insertProgram(data: Partial<VerificationProgram>): Promise<VerificationProgram> {
  const rows = await db.insert(verificationPrograms).values(data as any).returning();
  return rows[0]!;
}

// ── Dashboard metrics ─────────────────────────────────────────────────────────

export async function getDashboardMetrics(orgId: string) {
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

  const [
    total, approved, rejected, suspended, revoked,
    pending, expiringSoon, trustLeaders,
    recentApplications, recentCerts,
  ] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(tvaVerifications).where(eq(tvaVerifications.organizationId, orgId)),
    db.select({ c: sql<number>`count(*)::int` }).from(tvaVerifications).where(and(eq(tvaVerifications.organizationId, orgId), eq(tvaVerifications.status, "approved"))),
    db.select({ c: sql<number>`count(*)::int` }).from(tvaVerifications).where(and(eq(tvaVerifications.organizationId, orgId), eq(tvaVerifications.status, "rejected"))),
    db.select({ c: sql<number>`count(*)::int` }).from(tvaVerifications).where(and(eq(tvaVerifications.organizationId, orgId), eq(tvaVerifications.status, "suspended"))),
    db.select({ c: sql<number>`count(*)::int` }).from(tvaVerifications).where(and(eq(tvaVerifications.organizationId, orgId), eq(tvaVerifications.status, "revoked"))),
    db.select({ c: sql<number>`count(*)::int` }).from(tvaVerifications).where(and(eq(tvaVerifications.organizationId, orgId), eq(tvaVerifications.status, "pending"))),
    db.select({ c: sql<number>`count(*)::int` }).from(verificationCertificates).where(and(eq(verificationCertificates.organizationId, orgId), eq(verificationCertificates.status, "active"), lte(verificationCertificates.expiresAt, soon))),
    db.select({ c: sql<number>`count(*)::int` }).from(tvaVerifications).where(and(eq(tvaVerifications.organizationId, orgId), eq(tvaVerifications.verificationLevel, "level_4"))),
    db
      .select({ tv: tvaVerifications, programName: verificationPrograms.name })
      .from(tvaVerifications)
      .leftJoin(verificationPrograms, eq(tvaVerifications.programId, verificationPrograms.id))
      .where(eq(tvaVerifications.organizationId, orgId))
      .orderBy(desc(tvaVerifications.createdAt))
      .limit(5),
    db.select().from(verificationCertificates).where(eq(verificationCertificates.organizationId, orgId)).orderBy(desc(verificationCertificates.issuedAt)).limit(5),
  ]);

  return {
    total: total[0]?.c ?? 0,
    approved: approved[0]?.c ?? 0,
    rejected: rejected[0]?.c ?? 0,
    suspended: suspended[0]?.c ?? 0,
    revoked: revoked[0]?.c ?? 0,
    pending: pending[0]?.c ?? 0,
    expiringSoon: expiringSoon[0]?.c ?? 0,
    trustLeaders: trustLeaders[0]?.c ?? 0,
    recentApplications: recentApplications.map(r => ({ ...r.tv, programName: r.programName ?? undefined })),
    recentCerts,
  };
}

// ── Verifications ─────────────────────────────────────────────────────────────

export async function findAllVerifications(orgId: string, status?: string): Promise<(TvaVerification & { programName?: string })[]> {
  const rows = await db
    .select({
      tv: tvaVerifications,
      programName: verificationPrograms.name,
    })
    .from(tvaVerifications)
    .leftJoin(verificationPrograms, eq(tvaVerifications.programId, verificationPrograms.id))
    .where(
      status
        ? and(eq(tvaVerifications.organizationId, orgId), eq(tvaVerifications.status, status))
        : eq(tvaVerifications.organizationId, orgId)
    )
    .orderBy(desc(tvaVerifications.createdAt));
  return rows.map(r => ({ ...r.tv, programName: r.programName ?? undefined }));
}

export async function findVerificationById(orgId: string, id: string): Promise<TvaVerification | null> {
  const rows = await db.select().from(tvaVerifications).where(and(eq(tvaVerifications.id, id), eq(tvaVerifications.organizationId, orgId))).limit(1);
  return rows[0] ?? null;
}

export async function insertVerification(data: Partial<TvaVerification>): Promise<TvaVerification> {
  const rows = await db.insert(tvaVerifications).values(data as any).returning();
  return rows[0]!;
}

export async function updateVerification(orgId: string, id: string, data: Partial<TvaVerification>): Promise<TvaVerification> {
  const rows = await db.update(tvaVerifications).set({ ...data as any, updatedAt: new Date() }).where(and(eq(tvaVerifications.id, id), eq(tvaVerifications.organizationId, orgId))).returning();
  return rows[0]!;
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function findReviewsByVerification(orgId: string, verificationId: string): Promise<VerificationReview[]> {
  return db.select().from(verificationReviews).where(and(eq(verificationReviews.verificationId, verificationId), eq(verificationReviews.organizationId, orgId))).orderBy(desc(verificationReviews.createdAt));
}

export async function insertReview(data: Partial<VerificationReview>): Promise<VerificationReview> {
  const rows = await db.insert(verificationReviews).values(data as any).returning();
  return rows[0]!;
}

export async function updateReview(orgId: string, id: string, data: Partial<VerificationReview>): Promise<VerificationReview> {
  const rows = await db.update(verificationReviews).set({ ...data as any, updatedAt: new Date() }).where(and(eq(verificationReviews.id, id), eq(verificationReviews.organizationId, orgId))).returning();
  return rows[0]!;
}

// ── Evidence ──────────────────────────────────────────────────────────────────

export async function findEvidenceByVerification(orgId: string, verificationId: string): Promise<VerificationEvidence[]> {
  return db.select().from(verificationEvidence).where(and(eq(verificationEvidence.verificationId, verificationId), eq(verificationEvidence.organizationId, orgId))).orderBy(desc(verificationEvidence.submittedAt));
}

export async function insertEvidence(data: Partial<VerificationEvidence>): Promise<VerificationEvidence> {
  const rows = await db.insert(verificationEvidence).values(data as any).returning();
  return rows[0]!;
}

export async function updateEvidence(orgId: string, id: string, data: Partial<VerificationEvidence>): Promise<VerificationEvidence> {
  const rows = await db.update(verificationEvidence).set({ ...data as any, updatedAt: new Date() }).where(and(eq(verificationEvidence.id, id), eq(verificationEvidence.organizationId, orgId))).returning();
  return rows[0]!;
}

// ── Badges ────────────────────────────────────────────────────────────────────

export async function findBadgesByOrg(orgId: string): Promise<VerificationBadge[]> {
  return db.select().from(verificationBadges).where(eq(verificationBadges.organizationId, orgId)).orderBy(desc(verificationBadges.issuedAt));
}

export async function insertBadge(data: Partial<VerificationBadge>): Promise<VerificationBadge> {
  const rows = await db.insert(verificationBadges).values(data as any).returning();
  return rows[0]!;
}

export async function updateBadge(orgId: string, id: string, data: Partial<VerificationBadge>): Promise<VerificationBadge> {
  const rows = await db.update(verificationBadges).set({ ...data as any, updatedAt: new Date() }).where(and(eq(verificationBadges.id, id), eq(verificationBadges.organizationId, orgId))).returning();
  return rows[0]!;
}

// ── Certificates ──────────────────────────────────────────────────────────────

export async function findCertificatesByOrg(orgId: string): Promise<VerificationCertificate[]> {
  return db.select().from(verificationCertificates).where(eq(verificationCertificates.organizationId, orgId)).orderBy(desc(verificationCertificates.issuedAt));
}

export async function findCertificateByNumber(certNumber: string): Promise<VerificationCertificate | null> {
  const rows = await db.select().from(verificationCertificates).where(eq(verificationCertificates.certificateNumber, certNumber)).limit(1);
  return rows[0] ?? null;
}

export async function insertCertificate(data: Partial<VerificationCertificate>): Promise<VerificationCertificate> {
  const rows = await db.insert(verificationCertificates).values(data as any).returning();
  return rows[0]!;
}

export async function updateCertificate(orgId: string, id: string, data: Partial<VerificationCertificate>): Promise<VerificationCertificate> {
  const rows = await db.update(verificationCertificates).set({ ...data as any, updatedAt: new Date() }).where(and(eq(verificationCertificates.id, id), eq(verificationCertificates.organizationId, orgId))).returning();
  return rows[0]!;
}

// ── Registry ──────────────────────────────────────────────────────────────────

export async function findPublicRegistry(filters?: { industry?: string; country?: string; minScore?: number }): Promise<VerificationRegistry[]> {
  let q = db.select().from(verificationRegistry).where(eq(verificationRegistry.isPublic, true)) as any;
  if (filters?.minScore) q = q.where(gte(verificationRegistry.trustScore, filters.minScore));
  return q.orderBy(desc(verificationRegistry.publishedAt));
}

export async function findRegistryByOrg(orgId: string): Promise<VerificationRegistry[]> {
  return db.select().from(verificationRegistry).where(eq(verificationRegistry.organizationId, orgId)).orderBy(desc(verificationRegistry.publishedAt));
}

export async function upsertRegistry(data: Partial<VerificationRegistry>): Promise<VerificationRegistry> {
  const rows = await db.insert(verificationRegistry).values(data as any).onConflictDoUpdate({
    target: verificationRegistry.certificateId,
    set: { ...data as any, updatedAt: new Date() },
  }).returning();
  return rows[0]!;
}

// ── Renewals ──────────────────────────────────────────────────────────────────

export async function findRenewalsByOrg(orgId: string): Promise<VerificationRenewal[]> {
  return db.select().from(verificationRenewals).where(eq(verificationRenewals.organizationId, orgId)).orderBy(verificationRenewals.renewalDueDate);
}

export async function insertRenewal(data: Partial<VerificationRenewal>): Promise<VerificationRenewal> {
  const rows = await db.insert(verificationRenewals).values(data as any).returning();
  return rows[0]!;
}

export async function updateRenewal(orgId: string, id: string, data: Partial<VerificationRenewal>): Promise<VerificationRenewal> {
  const rows = await db.update(verificationRenewals).set({ ...data as any, updatedAt: new Date() }).where(and(eq(verificationRenewals.id, id), eq(verificationRenewals.organizationId, orgId))).returning();
  return rows[0]!;
}

// ── Assessments ───────────────────────────────────────────────────────────────

export async function findAssessmentByVerification(orgId: string, verificationId: string): Promise<VerificationAssessment | null> {
  const rows = await db.select().from(verificationAssessments).where(and(eq(verificationAssessments.verificationId, verificationId), eq(verificationAssessments.organizationId, orgId))).orderBy(desc(verificationAssessments.createdAt)).limit(1);
  return rows[0] ?? null;
}

export async function insertAssessment(data: Partial<VerificationAssessment>): Promise<VerificationAssessment> {
  const rows = await db.insert(verificationAssessments).values(data as any).returning();
  return rows[0]!;
}

export async function updateAssessment(orgId: string, id: string, data: Partial<VerificationAssessment>): Promise<VerificationAssessment> {
  const rows = await db.update(verificationAssessments).set({ ...data as any, updatedAt: new Date() }).where(and(eq(verificationAssessments.id, id), eq(verificationAssessments.organizationId, orgId))).returning();
  return rows[0]!;
}

// ── Decisions ─────────────────────────────────────────────────────────────────

export async function findDecisionsByVerification(orgId: string, verificationId: string): Promise<VerificationDecision[]> {
  return db.select().from(verificationDecisions).where(and(eq(verificationDecisions.verificationId, verificationId), eq(verificationDecisions.organizationId, orgId))).orderBy(desc(verificationDecisions.createdAt));
}

export async function insertDecision(data: Partial<VerificationDecision>): Promise<VerificationDecision> {
  const rows = await db.insert(verificationDecisions).values(data as any).returning();
  return rows[0]!;
}

// ── Events ────────────────────────────────────────────────────────────────────

export async function recordEvent(orgId: string, data: { verificationId?: string; eventType: string; actorId?: string; details?: Record<string, unknown> }) {
  await db.insert(verificationEvents).values({
    organizationId: orgId,
    verificationId: data.verificationId,
    eventType: data.eventType,
    actorId: data.actorId,
    details: data.details ?? {},
  });
}

export async function findRecentEvents(orgId: string, limit = 20): Promise<VerificationEvent[]> {
  return db.select().from(verificationEvents).where(eq(verificationEvents.organizationId, orgId)).orderBy(desc(verificationEvents.createdAt)).limit(limit);
}
