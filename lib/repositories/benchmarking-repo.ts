import { db } from "@/lib/db";
import {
  benchmarkIndustries,
  benchmarkSnapshots,
  benchmarkScores,
  benchmarkTrends,
} from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import type { BenchmarkCategory } from "@/lib/services/benchmarking-score";

// ─── Industry Baselines ──────────────────────────────────────────────────────

export async function getBaselines(industry: string, companySize: string) {
  const industryKey = industry || "all";
  const sizeKey = companySize || "all";

  const rows = await db
    .select()
    .from(benchmarkIndustries)
    .where(and(eq(benchmarkIndustries.industry, industryKey), eq(benchmarkIndustries.companySize, sizeKey)));

  if (rows.length > 0) return rows;

  // fallback: all industries
  return db
    .select()
    .from(benchmarkIndustries)
    .where(and(eq(benchmarkIndustries.industry, "all"), eq(benchmarkIndustries.companySize, "all")));
}

// ─── Snapshots ───────────────────────────────────────────────────────────────

export async function getLatestSnapshot(orgId: string) {
  const rows = await db
    .select()
    .from(benchmarkSnapshots)
    .where(eq(benchmarkSnapshots.organizationId, orgId))
    .orderBy(desc(benchmarkSnapshots.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function createSnapshot(data: typeof benchmarkSnapshots.$inferInsert) {
  const [row] = await db.insert(benchmarkSnapshots).values(data).returning();
  return row;
}

// ─── Scores ──────────────────────────────────────────────────────────────────

export async function getScoresForSnapshot(snapshotId: string) {
  return db
    .select()
    .from(benchmarkScores)
    .where(eq(benchmarkScores.snapshotId, snapshotId))
    .orderBy(benchmarkScores.category);
}

export async function insertScores(rows: (typeof benchmarkScores.$inferInsert)[]) {
  if (!rows.length) return;
  await db.insert(benchmarkScores).values(rows);
}

export async function getLatestScoresByCategory(orgId: string) {
  const snapshot = await getLatestSnapshot(orgId);
  if (!snapshot) return [];
  return getScoresForSnapshot(snapshot.id);
}

// ─── Trends ──────────────────────────────────────────────────────────────────

export async function upsertTrend(data: typeof benchmarkTrends.$inferInsert) {
  await db
    .insert(benchmarkTrends)
    .values(data)
    .onConflictDoUpdate({
      target: [benchmarkTrends.organizationId, benchmarkTrends.category, benchmarkTrends.periodMonth],
      set: {
        score: data.score,
        percentile: data.percentile,
        rankingLabel: data.rankingLabel,
        industryAvg: data.industryAvg,
      },
    })
    .catch(() => {});
}

export async function getTrends(orgId: string, months = 6) {
  return db
    .select()
    .from(benchmarkTrends)
    .where(eq(benchmarkTrends.organizationId, orgId))
    .orderBy(desc(benchmarkTrends.periodMonth))
    .limit(months * 10);
}

export async function getTrendsByCategory(orgId: string, category: BenchmarkCategory, months = 6) {
  return db
    .select()
    .from(benchmarkTrends)
    .where(and(eq(benchmarkTrends.organizationId, orgId), eq(benchmarkTrends.category, category)))
    .orderBy(desc(benchmarkTrends.periodMonth))
    .limit(months);
}
