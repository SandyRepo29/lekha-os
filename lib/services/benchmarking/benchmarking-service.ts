import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import * as repo from "@/lib/repositories/benchmarking-repo";
import { getTrustIntelligenceOverview } from "@/lib/services/trust-intelligence/trust-intelligence-service";
import {
  computeBenchmark,
  ALL_BENCHMARK_CATEGORIES,
  type BenchmarkCategory,
  type BaselineData,
} from "@/lib/services/benchmarking-score";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function logAudit(orgId: string, userId: string | null, action: string) {
  if (!userId) return;
  await db
    .insert(auditLogs)
    .values({ organizationId: orgId, actorId: userId, action, entityType: "benchmarking", metadata: {} })
    .catch(() => {});
}

function periodMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Convert org's industry_type enum value to benchmark industry key. */
function normalizeIndustry(raw: string | null | undefined): string {
  if (!raw) return "all";
  const map: Record<string, string> = {
    saas: "technology",
    fintech: "financial_services",
    banking: "financial_services",
    insurance: "financial_services",
    healthcare: "healthcare",
    pharma: "healthcare",
    manufacturing: "manufacturing",
    professional_services: "professional_services",
    consulting: "professional_services",
    it_services: "technology",
    telecom: "technology",
    retail: "all",
    ecommerce: "all",
    education: "all",
    government: "all",
    ngo: "all",
  };
  return map[raw.toLowerCase()] ?? "all";
}

// ─── Gather module scores ─────────────────────────────────────────────────────

async function gatherOrgScores(orgId: string): Promise<Partial<Record<BenchmarkCategory, number | null>>> {
  const overviewResult = await getTrustIntelligenceOverview(orgId).catch(() => null);
  const scores: Partial<Record<BenchmarkCategory, number | null>> = {};

  if (overviewResult) {
    const { orgTrustScore } = overviewResult;
    // All component scores are already 0-100
    scores.organizational_trust = orgTrustScore.overall ?? null;
    scores.vendor_trust = orgTrustScore.vendorTrust ?? null;
    scores.risk_posture = orgTrustScore.riskPosture ?? null;
    scores.control_health = orgTrustScore.controlHealth ?? null;
    scores.audit_readiness = orgTrustScore.auditReadiness ?? null;
    scores.compliance_coverage = orgTrustScore.complianceCoverage ?? null;
  }

  // For categories not in Trust Intelligence, derive from overall
  const overall = scores.organizational_trust ?? null;
  if (overall !== null) {
    if (scores.privacy_trust == null) scores.privacy_trust = Math.min(100, Math.round(overall * 0.96));
    if (scores.contract_trust == null) scores.contract_trust = Math.min(100, Math.round(overall * 0.93));
    if (scores.issue_resolution == null) scores.issue_resolution = Math.min(100, Math.round(overall * 0.90));
    if (scores.workflow_automation == null) scores.workflow_automation = Math.min(100, Math.round(overall * 0.87));
  }

  return scores;
}

// ─── Main compute function ────────────────────────────────────────────────────

export async function computeAndSaveBenchmark(orgId: string, userId: string | null) {
  // 1. Get org profile for industry/size
  const orgRows = await db.query.organizations.findFirst({ where: (o, { eq }) => eq(o.id, orgId) });
  const industry = normalizeIndustry(orgRows?.industry);
  const companySize = (orgRows as any)?.companySize ?? "all";

  // 2. Load baselines
  const baselineRows = await repo.getBaselines(industry, "all");
  const baselines = {} as Record<BenchmarkCategory, BaselineData>;
  for (const row of baselineRows) {
    baselines[row.category as BenchmarkCategory] = {
      avgScore: row.avgScore,
      medianScore: row.medianScore,
      topQuartile: row.topQuartile,
      topDecile: row.topDecile,
      bottomQuartile: row.bottomQuartile,
      stdDev: row.stdDev,
      sampleSize: row.sampleSize,
    };
  }
  // Fill missing categories with defaults
  for (const cat of ALL_BENCHMARK_CATEGORIES) {
    if (!baselines[cat]) {
      baselines[cat] = { avgScore: 65, medianScore: 65, topQuartile: 80, topDecile: 90, bottomQuartile: 50, stdDev: 15, sampleSize: 100 };
    }
  }

  // 3. Gather current org scores
  const orgScores = await gatherOrgScores(orgId);

  // 4. Compute benchmark
  const result = computeBenchmark(orgScores, baselines);

  // 5. Persist snapshot
  const today = new Date().toISOString().slice(0, 10);
  const snapshot = await repo.createSnapshot({
    organizationId: orgId,
    snapshotDate: today,
    industry,
    companySize,
    overallScore: result.overallScore,
    overallPercentile: result.overallPercentile,
    maturityLevel: result.maturityLevel,
    overallRanking: result.overallRanking,
    peerCount: baselineRows[0]?.sampleSize ?? 0,
  });

  // 6. Persist per-category scores
  const scoreRows = result.categories.map((cat) => ({
    snapshotId: snapshot.id,
    organizationId: orgId,
    category: cat.category,
    orgScore: cat.orgScore,
    industryAvg: cat.industryAvg,
    peerAvg: cat.peerAvg,
    topQuartile: cat.topQuartile,
    percentile: cat.percentile,
    rankingLabel: cat.rankingLabel,
    deltaVsIndustry: cat.deltaVsIndustry,
  }));
  await repo.insertScores(scoreRows);

  // 7. Upsert monthly trend
  const month = periodMonth();
  for (const cat of result.categories) {
    if (cat.orgScore === null) continue;
    await repo.upsertTrend({
      organizationId: orgId,
      category: cat.category,
      periodMonth: month,
      score: cat.orgScore,
      percentile: cat.percentile,
      rankingLabel: cat.rankingLabel,
      industryAvg: cat.industryAvg,
    });
  }

  await logAudit(orgId, userId, "benchmark.snapshot_created");
  return { snapshot, result };
}

// ─── Dashboard data ───────────────────────────────────────────────────────────

export async function getDashboardData(orgId: string) {
  const snapshot = await repo.getLatestSnapshot(orgId);
  const scores = snapshot ? await repo.getScoresForSnapshot(snapshot.id) : [];
  const trends = await repo.getTrends(orgId, 6);
  return { snapshot, scores, trends };
}

export async function getTrends(orgId: string, months = 6) {
  return repo.getTrends(orgId, months);
}
