import { db } from "@/lib/db";
import {
  trustProfiles, trustDocuments, trustShares, trustQuestionnaires,
  trustAnswers, trustVerifications, trustBadges, trustRelationships, trustActivity,
  organizations, profiles,
} from "@/lib/db/schema";
import { eq, and, desc, asc, or, sql, isNull, isNotNull } from "drizzle-orm";

// ─── Trust Profile ───────────────────────────────────────────

export async function getOrCreateProfile(orgId: string) {
  const [existing] = await db
    .select()
    .from(trustProfiles)
    .where(eq(trustProfiles.organizationId, orgId))
    .limit(1);
  if (existing) return existing;

  const org = await db
    .select({ name: organizations.name, industry: organizations.industry, country: organizations.country, website: organizations.website, logoUrl: organizations.logoUrl, companySize: organizations.companySize })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1)
    .then((r) => r[0]);

  const [created] = await db
    .insert(trustProfiles)
    .values({
      organizationId: orgId,
      displayName: org?.name ?? "My Organization",
      industry: org?.industry ?? undefined,
      country: org?.country ?? undefined,
      website: org?.website ?? undefined,
      logoUrl: org?.logoUrl ?? undefined,
      companySize: org?.companySize ?? undefined,
    })
    .returning();
  return created;
}

export async function updateProfile(orgId: string, data: Partial<typeof trustProfiles.$inferInsert>) {
  const [row] = await db
    .update(trustProfiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(trustProfiles.organizationId, orgId))
    .returning();
  return row;
}

export async function getPublicDirectory(filters?: {
  industry?: string;
  country?: string;
  minTrustScore?: number;
  riskLevel?: string;
}) {
  let q = db
    .select({
      id: trustProfiles.id,
      organizationId: trustProfiles.organizationId,
      displayName: trustProfiles.displayName,
      tagline: trustProfiles.tagline,
      industry: trustProfiles.industry,
      companySize: trustProfiles.companySize,
      country: trustProfiles.country,
      website: trustProfiles.website,
      logoUrl: trustProfiles.logoUrl,
      trustScore: trustProfiles.trustScore,
      privacyScore: trustProfiles.privacyScore,
      riskLevel: trustProfiles.riskLevel,
      certifications: trustProfiles.certifications,
      profileCompleteness: trustProfiles.profileCompleteness,
    })
    .from(trustProfiles)
    .where(eq(trustProfiles.isPublished, true))
    .$dynamic();

  const rows = await q.orderBy(desc(trustProfiles.trustScore));

  return rows.filter((r) => {
    if (filters?.industry && r.industry !== filters.industry) return false;
    if (filters?.country && r.country !== filters.country) return false;
    if (filters?.minTrustScore && (r.trustScore ?? 0) < filters.minTrustScore) return false;
    if (filters?.riskLevel && r.riskLevel !== filters.riskLevel) return false;
    return true;
  });
}

// ─── Trust Documents ─────────────────────────────────────────

export async function createDocument(data: typeof trustDocuments.$inferInsert) {
  const [row] = await db.insert(trustDocuments).values(data).returning();
  return row;
}

export async function listDocuments(orgId: string) {
  return db
    .select()
    .from(trustDocuments)
    .where(eq(trustDocuments.organizationId, orgId))
    .orderBy(desc(trustDocuments.createdAt));
}

export async function getDocument(orgId: string, docId: string) {
  return db
    .select()
    .from(trustDocuments)
    .where(and(eq(trustDocuments.id, docId), eq(trustDocuments.organizationId, orgId)))
    .limit(1)
    .then((r) => r[0] ?? null);
}

export async function updateDocument(orgId: string, docId: string, data: Partial<typeof trustDocuments.$inferInsert>) {
  const [row] = await db
    .update(trustDocuments)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(trustDocuments.id, docId), eq(trustDocuments.organizationId, orgId)))
    .returning();
  return row;
}

export async function deleteDocument(orgId: string, docId: string) {
  await db
    .delete(trustDocuments)
    .where(and(eq(trustDocuments.id, docId), eq(trustDocuments.organizationId, orgId)));
}

// ─── Trust Badges ─────────────────────────────────────────────

export async function listBadges(orgId: string) {
  return db
    .select()
    .from(trustBadges)
    .where(and(eq(trustBadges.organizationId, orgId), eq(trustBadges.isActive, true)))
    .orderBy(desc(trustBadges.issuedAt));
}

export async function issueBadge(data: typeof trustBadges.$inferInsert) {
  const [row] = await db.insert(trustBadges).values(data).returning();
  return row;
}

export async function revokeBadge(orgId: string, badgeId: string) {
  await db
    .update(trustBadges)
    .set({ isActive: false })
    .where(and(eq(trustBadges.id, badgeId), eq(trustBadges.organizationId, orgId)));
}

// ─── Trust Questionnaires ─────────────────────────────────────

export async function listQuestionnaires(orgId: string) {
  return db
    .select()
    .from(trustQuestionnaires)
    .where(or(eq(trustQuestionnaires.organizationId, orgId), eq(trustQuestionnaires.isGlobal, true)))
    .orderBy(asc(trustQuestionnaires.title));
}

export async function getAnswers(orgId: string, questionnaireId: string) {
  return db
    .select()
    .from(trustAnswers)
    .where(and(eq(trustAnswers.organizationId, orgId), eq(trustAnswers.questionnaireId, questionnaireId)))
    .limit(1)
    .then((r) => r[0] ?? null);
}

export async function upsertAnswers(data: typeof trustAnswers.$inferInsert) {
  const [row] = await db
    .insert(trustAnswers)
    .values(data)
    .onConflictDoUpdate({
      target: [trustAnswers.organizationId, trustAnswers.questionnaireId],
      set: {
        answers: data.answers,
        completionPercent: data.completionPercent,
        visibility: data.visibility,
        lastUpdatedBy: data.lastUpdatedBy,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}

export async function listAnswers(orgId: string) {
  return db
    .select({
      id: trustAnswers.id,
      questionnaireId: trustAnswers.questionnaireId,
      completionPercent: trustAnswers.completionPercent,
      visibility: trustAnswers.visibility,
      updatedAt: trustAnswers.updatedAt,
      questionnaireTitle: trustQuestionnaires.title,
      questionnaireCategory: trustQuestionnaires.category,
    })
    .from(trustAnswers)
    .leftJoin(trustQuestionnaires, eq(trustAnswers.questionnaireId, trustQuestionnaires.id))
    .where(eq(trustAnswers.organizationId, orgId))
    .orderBy(desc(trustAnswers.updatedAt));
}

// ─── Trust Verifications ─────────────────────────────────────

export async function createVerification(data: typeof trustVerifications.$inferInsert) {
  const [row] = await db.insert(trustVerifications).values(data).returning();
  return row;
}

// ─── Trust Relationships ──────────────────────────────────────

export async function listRelationships(orgId: string) {
  return db
    .select()
    .from(trustRelationships)
    .where(
      or(
        eq(trustRelationships.requesterOrgId, orgId),
        eq(trustRelationships.targetOrgId, orgId)
      )
    )
    .orderBy(desc(trustRelationships.createdAt));
}

export async function createRelationship(data: typeof trustRelationships.$inferInsert) {
  const [row] = await db
    .insert(trustRelationships)
    .values(data)
    .onConflictDoNothing()
    .returning();
  return row;
}

// ─── Trust Activity ───────────────────────────────────────────

export async function logActivity(data: typeof trustActivity.$inferInsert) {
  await db.insert(trustActivity).values(data).catch(() => {});
}

export async function listActivity(orgId: string, limit = 20) {
  return db
    .select({
      id: trustActivity.id,
      activityType: trustActivity.activityType,
      description: trustActivity.description,
      entityId: trustActivity.entityId,
      entityType: trustActivity.entityType,
      createdAt: trustActivity.createdAt,
      actorName: profiles.fullName,
    })
    .from(trustActivity)
    .leftJoin(profiles, eq(trustActivity.actorId, profiles.id))
    .where(eq(trustActivity.organizationId, orgId))
    .orderBy(desc(trustActivity.createdAt))
    .limit(limit);
}

// ─── Dashboard Metrics ────────────────────────────────────────

export async function getDashboardMetrics(orgId: string) {
  const [profile] = await db
    .select({ id: trustProfiles.id, isPublished: trustProfiles.isPublished, trustScore: trustProfiles.trustScore, profileCompleteness: trustProfiles.profileCompleteness })
    .from(trustProfiles)
    .where(eq(trustProfiles.organizationId, orgId))
    .limit(1);

  const profileId = profile?.id;

  const [docCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(trustDocuments)
    .where(eq(trustDocuments.organizationId, orgId));

  const [verifiedCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(trustDocuments)
    .where(and(eq(trustDocuments.organizationId, orgId), eq(trustDocuments.isVerified, true)));

  const [publicDocCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(trustDocuments)
    .where(and(eq(trustDocuments.organizationId, orgId), eq(trustDocuments.visibility, "public")));

  const [badgeCount] = profileId
    ? await db.select({ count: sql<number>`count(*)::int` }).from(trustBadges).where(and(eq(trustBadges.organizationId, orgId), eq(trustBadges.isActive, true)))
    : [{ count: 0 }];

  const [relCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(trustRelationships)
    .where(
      and(
        or(eq(trustRelationships.requesterOrgId, orgId), eq(trustRelationships.targetOrgId, orgId)),
        eq(trustRelationships.status, "active")
      )
    );

  const [answerCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(trustAnswers)
    .where(eq(trustAnswers.organizationId, orgId));

  return {
    isPublished: profile?.isPublished ?? false,
    trustScore: profile?.trustScore ?? null,
    profileCompleteness: profile?.profileCompleteness ?? 0,
    totalDocuments: docCount?.count ?? 0,
    verifiedDocuments: verifiedCount?.count ?? 0,
    publicDocuments: publicDocCount?.count ?? 0,
    activeBadges: badgeCount?.count ?? 0,
    activeRelationships: relCount?.count ?? 0,
    completedQuestionnaires: answerCount?.count ?? 0,
  };
}
