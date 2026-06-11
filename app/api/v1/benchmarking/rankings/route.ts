import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getDashboardData } from "@/lib/services/benchmarking/benchmarking-service";
import { BENCHMARK_RANKING_LABELS, BENCHMARK_MATURITY_LABELS } from "@/lib/services/benchmarking-score";

export async function GET(req: NextRequest) {
  let ctx;
  try { ctx = await validateApiKey(req); } catch (e) { return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401); }
  const { snapshot, scores } = await getDashboardData(ctx.orgId);
  if (!snapshot) return ok({ rankings: null, message: "No benchmark data yet" });
  const rankings = {
    overall: {
      score: snapshot.overallScore,
      percentile: snapshot.overallPercentile,
      ranking: snapshot.overallRanking,
      rankingLabel: BENCHMARK_RANKING_LABELS[snapshot.overallRanking],
      maturityLevel: snapshot.maturityLevel,
      maturityLabel: BENCHMARK_MATURITY_LABELS[snapshot.maturityLevel],
    },
    categories: scores
      .sort((a, b) => (b.percentile ?? 0) - (a.percentile ?? 0))
      .map((s) => ({
        category: s.category,
        score: s.orgScore,
        percentile: s.percentile,
        ranking: s.rankingLabel,
        rankingLabel: BENCHMARK_RANKING_LABELS[s.rankingLabel],
        deltaVsIndustry: s.deltaVsIndustry,
      })),
  };
  return ok({ rankings });
}
