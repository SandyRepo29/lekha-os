import { requireUser } from "@/lib/auth/session";
import { getLatestSnapshot, getLatestScoresByCategory } from "@/backend/src/modules/benchmarking/benchmarking-repo";
import { BENCHMARK_CATEGORY_LABELS, type BenchmarkCategory } from "@/backend/src/modules/benchmarking/benchmarking-score";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await requireUser();
  if (!session.org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.org.id;
  const [snapshot, scores] = await Promise.all([
    getLatestSnapshot(orgId),
    getLatestScoresByCategory(orgId),
  ]);

  const header = ["Category", "Org Score", "Industry Avg", "Top Quartile", "Percentile", "Ranking", "Delta vs Industry"];
  const rows = scores.map((s) => [
    BENCHMARK_CATEGORY_LABELS[s.category as BenchmarkCategory] ?? s.category,
    s.orgScore ?? "",
    s.industryAvg ?? "",
    s.topQuartile ?? "",
    s.percentile ?? "",
    s.rankingLabel ?? "",
    s.deltaVsIndustry ?? "",
  ]);

  if (snapshot) {
    rows.unshift(["OVERALL", snapshot.overallScore ?? "", "", "", snapshot.overallPercentile ?? "", snapshot.overallRanking ?? "", ""]);
  }

  const csv = [header, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="benchmark-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
