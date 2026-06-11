import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import * as repo from "@/lib/repositories/trust-network-repo";
import { getDashboardMetrics as getExchangeMetrics } from "@/lib/services/trust-exchange/trust-exchange-service";
import { getDashboardData as getBenchmarkData } from "@/lib/services/benchmarking/benchmarking-service";
import { getDashboardData as getIntegrationData } from "@/lib/services/integration-hub/integration-service";

async function logAudit(orgId: string, userId: string, action: string) {
  await db.insert(auditLogs).values({
    organizationId: orgId, actorId: userId, action,
    entityType: "trust_network", entityId: orgId, metadata: {},
  }).catch(() => {});
}

// ─── Network Reputation Score™ ────────────────────────────────
// Weighted aggregation of external trust signals

function computeReputationScore(inputs: {
  profileCompleteness: number;    // 0–100
  verifiedDocuments: number;      // raw count
  activeBadges: number;           // raw count
  benchmarkPercentile: number;    // 0–100, 0 if no benchmark
  integrationAutomation: number;  // 0–100 %, 0 if no integrations
  orgTrustScore: number;          // 0–100
  activeRelationships: number;    // raw count
}): number {
  const profileQuality = Math.min(100,
    inputs.profileCompleteness * 0.6 +
    Math.min(inputs.verifiedDocuments * 8, 25) +
    Math.min(inputs.activeBadges * 5, 15)
  );
  const networkActivity = Math.min(100,
    Math.min(inputs.activeRelationships * 10, 60) +
    (inputs.activeBadges > 0 ? 20 : 0) +
    (inputs.verifiedDocuments > 0 ? 20 : 0)
  );

  const score =
    profileQuality              * 0.25 +
    inputs.benchmarkPercentile  * 0.20 +
    inputs.integrationAutomation * 0.20 +
    inputs.orgTrustScore        * 0.20 +
    networkActivity             * 0.15;

  return Math.round(Math.min(100, Math.max(0, score)));
}

function getReputationLevel(score: number): string {
  if (score >= 90) return "Trust Leader";
  if (score >= 80) return "Highly Trusted";
  if (score >= 70) return "Trusted";
  if (score >= 55) return "Developing";
  if (score >= 40) return "Emerging";
  return "Getting Started";
}

function getReputationColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-blue-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

// ─── Dashboard ────────────────────────────────────────────────

export async function getNetworkDashboard(orgId: string) {
  const [networkMetrics, benchmarkData, integrationData, profileViews, followerCount, followingCount] =
    await Promise.all([
      repo.getNetworkMetrics(orgId),
      getBenchmarkData(orgId).catch(() => ({ snapshot: null, scores: [], trends: [] })),
      getIntegrationData(orgId).catch(() => ({ metrics: null, connections: [], recentSyncs: [], openEvents: [] })),
      repo.getProfileViewCount(orgId, 30),
      repo.getFollowerCount(orgId),
      repo.getFollowingCount(orgId),
    ]);

  const benchmarkPercentile = (benchmarkData.snapshot as any)?.overallPercentile ?? 0;
  const connectedSystems = integrationData.connections.length;
  const automationPct = connectedSystems > 0
    ? Math.min(100, Math.round(connectedSystems * 12 + ((integrationData.metrics as any)?.totalSyncs ?? 0) * 2))
    : 0;
  const orgTrustScore = (networkMetrics.profile as any)?.trustScore ?? 0;
  const verifiedDocs = (networkMetrics as any).verifiedDocuments ?? 0;

  const reputationScore = computeReputationScore({
    profileCompleteness: networkMetrics.profileCompleteness,
    verifiedDocuments: verifiedDocs,
    activeBadges: networkMetrics.activeBadges,
    benchmarkPercentile,
    integrationAutomation: automationPct,
    orgTrustScore,
    activeRelationships: networkMetrics.activeRelationships,
  });

  const maturityLevel = getMaturityLevel(benchmarkPercentile);
  const benchmarkScores = benchmarkData.scores as any[];

  return {
    reputation: {
      score: reputationScore,
      level: getReputationLevel(reputationScore),
      color: getReputationColor(reputationScore),
    },
    profile: networkMetrics.profile,
    metrics: {
      profileViews30d: profileViews,
      followerCount,
      followingCount,
      totalDocuments: networkMetrics.totalDocuments,
      activeBadges: networkMetrics.activeBadges,
      activeRelationships: networkMetrics.activeRelationships,
      isPublished: networkMetrics.isPublished,
      profileCompleteness: networkMetrics.profileCompleteness,
    },
    benchmarking: {
      percentile: benchmarkPercentile,
      maturityLevel,
      overallScore: (benchmarkData.snapshot as any)?.overallScore ?? null,
      industryRank: (benchmarkData.snapshot as any)?.industryRank ?? null,
      industryName: (benchmarkData.snapshot as any)?.industryName ?? null,
    },
    automation: {
      connectedSystems,
      automationPct,
      evidenceAutomation: Math.min(100, automationPct + 5),
      monitoringCoverage: Math.min(100, connectedSystems * 8),
    },
    orgTrustScore,
  };
}

function getMaturityLevel(percentile: number): { level: number; label: string } {
  if (percentile >= 95) return { level: 6, label: "Trust Leader" };
  if (percentile >= 80) return { level: 5, label: "Optimized" };
  if (percentile >= 65) return { level: 4, label: "Measured" };
  if (percentile >= 45) return { level: 3, label: "Defined" };
  if (percentile >= 25) return { level: 2, label: "Managed" };
  return { level: 1, label: "Reactive" };
}

// ─── Public Profile 2.0 ───────────────────────────────────────

export async function getPublicProfile(orgId: string) {
  const [networkMetrics, benchmarkData, integrationData, profileViews, followerCount] = await Promise.all([
    repo.getNetworkMetrics(orgId),
    getBenchmarkData(orgId).catch(() => ({ snapshot: null, scores: [], trends: [] })),
    getIntegrationData(orgId).catch(() => ({ metrics: null, connections: [], recentSyncs: [], openEvents: [] })),
    repo.getProfileViewCount(orgId, 30),
    repo.getFollowerCount(orgId),
  ]);

  const benchmarkPercentile = (benchmarkData.snapshot as any)?.overallPercentile ?? 0;
  const connectedSystems = integrationData.connections.length;
  const automationPct = connectedSystems > 0 ? Math.min(100, connectedSystems * 12) : 0;

  const reputationScore = computeReputationScore({
    profileCompleteness: networkMetrics.profileCompleteness,
    verifiedDocuments: 0,
    activeBadges: networkMetrics.activeBadges,
    benchmarkPercentile,
    integrationAutomation: automationPct,
    orgTrustScore: (networkMetrics.profile as any)?.trustScore ?? 0,
    activeRelationships: networkMetrics.activeRelationships,
  });

  return {
    profile: networkMetrics.profile,
    reputation: {
      score: reputationScore,
      level: getReputationLevel(reputationScore),
      color: getReputationColor(reputationScore),
    },
    metrics: {
      profileViews30d: profileViews,
      followerCount,
      activeBadges: networkMetrics.activeBadges,
      activeRelationships: networkMetrics.activeRelationships,
      totalDocuments: networkMetrics.totalDocuments,
    },
    benchmarking: {
      percentile: benchmarkPercentile,
      maturityLevel: getMaturityLevel(benchmarkPercentile),
      overallScore: (benchmarkData.snapshot as any)?.overallScore ?? null,
      industryRank: (benchmarkData.snapshot as any)?.industryRank ?? null,
    },
    automation: {
      connectedSystems,
      automationPct,
      monitoringCoverage: Math.min(100, connectedSystems * 8),
    },
    sections: {
      trustScore: networkMetrics.profile?.trustScore ?? null,
      privacyScore: networkMetrics.profile?.privacyScore ?? null,
      profileCompleteness: networkMetrics.profileCompleteness,
    },
  };
}

// ─── Network Directory ────────────────────────────────────────

export async function getNetworkDirectory(filters?: { industry?: string; country?: string; minScore?: number }) {
  return repo.getPublicDirectory(filters);
}

// ─── Activity Feed ────────────────────────────────────────────

export async function getNetworkActivity(orgId: string, limit = 20) {
  return repo.getNetworkActivity(orgId, limit);
}

// ─── Relationships ────────────────────────────────────────────

export async function getTrustRelationships(orgId: string) {
  return repo.getTrustRelationships(orgId);
}

// ─── Follow / Unfollow ────────────────────────────────────────

export async function followOrg(followerOrgId: string, userId: string, followingOrgId: string) {
  if (followerOrgId === followingOrgId) return;
  await repo.followOrg(followerOrgId, followingOrgId);
  await logAudit(followerOrgId, userId, "trust_network.follow");
}

export async function unfollowOrg(followerOrgId: string, userId: string, followingOrgId: string) {
  await repo.unfollowOrg(followerOrgId, followingOrgId);
  await logAudit(followerOrgId, userId, "trust_network.unfollow");
}

export async function getIsFollowing(followerOrgId: string, followingOrgId: string) {
  return repo.isFollowing(followerOrgId, followingOrgId);
}

// ─── Profile view recording ───────────────────────────────────

export async function recordView(viewedOrgId: string, viewerOrgId?: string) {
  await repo.recordProfileView(viewedOrgId, viewerOrgId);
}
