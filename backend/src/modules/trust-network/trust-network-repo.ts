import { db } from "@/lib/db";
import {
  networkProfileViews, networkFollowers,
  trustProfiles, trustDocuments, trustBadges, trustRelationships, trustActivity,
  organizations,
} from "@/lib/db/schema";
import { eq, desc, count, and, sql, gte } from "drizzle-orm";

// ─── Profile Views ────────────────────────────────────────────

export async function recordProfileView(viewedOrgId: string, viewerOrgId?: string) {
  await db.insert(networkProfileViews).values({
    viewedOrgId,
    viewerOrgId: viewerOrgId ?? null,
  }).catch(() => {});
}

export async function getProfileViewCount(orgId: string, days = 30): Promise<number> {
  const since = new Date(Date.now() - days * 86400_000);
  const rows = await db
    .select({ total: count() })
    .from(networkProfileViews)
    .where(and(eq(networkProfileViews.viewedOrgId, orgId), gte(networkProfileViews.viewedAt, since)));
  return rows[0]?.total ?? 0;
}

// ─── Followers ────────────────────────────────────────────────

export async function followOrg(followerOrgId: string, followingOrgId: string) {
  await db.insert(networkFollowers)
    .values({ followerOrgId, followingOrgId })
    .onConflictDoNothing();
}

export async function unfollowOrg(followerOrgId: string, followingOrgId: string) {
  await db.delete(networkFollowers).where(
    and(eq(networkFollowers.followerOrgId, followerOrgId), eq(networkFollowers.followingOrgId, followingOrgId))
  );
}

export async function getFollowerCount(orgId: string): Promise<number> {
  const rows = await db.select({ total: count() }).from(networkFollowers)
    .where(eq(networkFollowers.followingOrgId, orgId));
  return rows[0]?.total ?? 0;
}

export async function getFollowingCount(orgId: string): Promise<number> {
  const rows = await db.select({ total: count() }).from(networkFollowers)
    .where(eq(networkFollowers.followerOrgId, orgId));
  return rows[0]?.total ?? 0;
}

export async function isFollowing(followerOrgId: string, followingOrgId: string): Promise<boolean> {
  const rows = await db.select({ total: count() }).from(networkFollowers)
    .where(and(eq(networkFollowers.followerOrgId, followerOrgId), eq(networkFollowers.followingOrgId, followingOrgId)));
  return (rows[0]?.total ?? 0) > 0;
}

// ─── Network metrics (from trust exchange tables) ─────────────

export async function getNetworkMetrics(orgId: string) {
  const [profileRow, docRow, badgeRow, relRow, viewRow] = await Promise.all([
    db.select().from(trustProfiles).where(eq(trustProfiles.organizationId, orgId)).limit(1),
    db.select({ total: count() }).from(trustDocuments).where(eq(trustDocuments.organizationId, orgId)),
    db.select({ total: count() }).from(trustBadges)
      .where(and(eq(trustBadges.organizationId, orgId), eq(trustBadges.isActive, true))),
    db.select({ total: count() }).from(trustRelationships)
      .where(and(eq(trustRelationships.requesterOrgId, orgId), eq(trustRelationships.status, "active"))),
    db.select({ total: count() }).from(networkProfileViews)
      .where(and(eq(networkProfileViews.viewedOrgId, orgId),
        gte(networkProfileViews.viewedAt, new Date(Date.now() - 30 * 86400_000)))),
  ]);

  const profile = profileRow[0];
  return {
    profile,
    totalDocuments: docRow[0]?.total ?? 0,
    activeBadges: badgeRow[0]?.total ?? 0,
    activeRelationships: relRow[0]?.total ?? 0,
    profileViews30d: viewRow[0]?.total ?? 0,
    isPublished: profile?.isPublished ?? false,
    profileCompleteness: profile?.profileCompleteness ?? 0,
    trustScore: profile?.trustScore,
    privacyScore: profile?.privacyScore,
  };
}

// ─── Network directory (public profiles) ─────────────────────

export async function getPublicDirectory(filters?: { industry?: string; country?: string; minScore?: number }) {
  const rows = await db
    .select({
      id: trustProfiles.id,
      organizationId: trustProfiles.organizationId,
      displayName: trustProfiles.displayName,
      tagline: trustProfiles.tagline,
      industry: trustProfiles.industry,
      country: trustProfiles.country,
      trustScore: trustProfiles.trustScore,
      privacyScore: trustProfiles.privacyScore,
      profileCompleteness: trustProfiles.profileCompleteness,
      updatedAt: trustProfiles.updatedAt,
    })
    .from(trustProfiles)
    .where(eq(trustProfiles.isPublished, true))
    .orderBy(desc(trustProfiles.trustScore))
    .limit(100);

  return rows.filter((r) => {
    if (filters?.industry && r.industry !== filters.industry) return false;
    if (filters?.country && r.country !== filters.country) return false;
    if (filters?.minScore && (r.trustScore ?? 0) < filters.minScore) return false;
    return true;
  });
}

// ─── Network activity feed ────────────────────────────────────

export async function getNetworkActivity(orgId: string, limit = 20) {
  return db
    .select()
    .from(trustActivity)
    .where(eq(trustActivity.organizationId, orgId))
    .orderBy(desc(trustActivity.createdAt))
    .limit(limit);
}

// ─── Trust relationships detail ───────────────────────────────

export async function getTrustRelationships(orgId: string) {
  const rows = await db
    .select({ rel: trustRelationships, targetName: trustProfiles.displayName })
    .from(trustRelationships)
    .leftJoin(trustProfiles, eq(trustProfiles.organizationId, trustRelationships.targetOrgId))
    .where(eq(trustRelationships.requesterOrgId, orgId))
    .orderBy(desc(trustRelationships.createdAt));
  return rows.map(({ rel, targetName }) => ({ ...rel, targetName: targetName ?? null }));
}
