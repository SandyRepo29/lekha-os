export const dynamic = "force-dynamic";

import Link from "next/link";
import { BarChart3, TrendingUp, Award, Zap, RefreshCw, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData, computeAndSaveBenchmark } from "@/lib/services/benchmarking/benchmarking-service";
import {
  BENCHMARK_CATEGORY_LABELS,
  BENCHMARK_MATURITY_LABELS,
  BENCHMARK_RANKING_LABELS,
  BENCHMARK_MATURITY_COLORS,
  BENCHMARK_RANKING_COLORS,
  type BenchmarkCategory,
} from "@/lib/services/benchmarking-score";
import { ComputeBenchmarkButton } from "@/components/benchmarking/compute-button";

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-xs text-[var(--color-ink-faint)]">—</span>;
  if (delta > 0) return (
    <span className="flex items-center gap-0.5 text-xs text-green-400">
      <ArrowUpRight className="h-3 w-3" />+{delta}
    </span>
  );
  if (delta < 0) return (
    <span className="flex items-center gap-0.5 text-xs text-red-400">
      <ArrowDownRight className="h-3 w-3" />{delta}
    </span>
  );
  return <span className="flex items-center gap-0.5 text-xs text-[var(--color-ink-dim)]"><Minus className="h-3 w-3" />0</span>;
}

function PercentileBar({ percentile, topQuartile }: { percentile: number | null; topQuartile: number | null }) {
  const pct = percentile ?? 0;
  const color = pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : pct >= 25 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="w-full h-1.5 rounded-full bg-white/10">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

export default async function BenchmarkingDashboard() {
  const session = await requireUser();
  if (!session.org) return null;
  const orgId = session.org.id;

  const { snapshot, scores } = await getDashboardData(orgId);

  const maturityLabel = snapshot ? BENCHMARK_MATURITY_LABELS[snapshot.maturityLevel] : null;
  const maturityColor = snapshot ? BENCHMARK_MATURITY_COLORS[snapshot.maturityLevel] : "text-[var(--color-ink-dim)]";
  const rankingLabel = snapshot ? BENCHMARK_RANKING_LABELS[snapshot.overallRanking] : null;
  const rankingColor = snapshot ? BENCHMARK_RANKING_COLORS[snapshot.overallRanking] : "text-[var(--color-ink-dim)]";

  const strengths = scores
    .filter((s) => s.deltaVsIndustry !== null && s.deltaVsIndustry > 0)
    .sort((a, b) => (b.deltaVsIndustry ?? 0) - (a.deltaVsIndustry ?? 0))
    .slice(0, 3);

  const weaknesses = scores
    .filter((s) => s.deltaVsIndustry !== null && s.deltaVsIndustry < 0)
    .sort((a, b) => (a.deltaVsIndustry ?? 0) - (b.deltaVsIndustry ?? 0))
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Governance Benchmarking™</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">
            Compare your governance posture against industry peers and discover your competitive position.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/benchmarking/rankings" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-line)] text-sm font-semibold hover:bg-white/[0.04] transition-colors">
            <Award className="h-4 w-4" /> Rankings
          </Link>
          <ComputeBenchmarkButton />
        </div>
      </div>

      {!snapshot ? (
        <Card className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-[var(--color-ink-faint)] mx-auto mb-3" />
          <p className="font-semibold text-lg">No Benchmark Data Yet</p>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1 max-w-sm mx-auto">
            Run your first benchmark to see how your governance compares to industry peers across all 10 categories.
          </p>
          <ComputeBenchmarkButton className="mt-5 mx-auto" />
        </Card>
      ) : (
        <>
          {/* Hero metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5 col-span-2 md:col-span-1">
              <p className="text-xs text-[var(--color-ink-dim)] mb-1">Overall Score</p>
              <p className="text-4xl font-bold">{snapshot.overallScore ?? "—"}</p>
              <p className="text-xs text-[var(--color-ink-dim)] mt-1">out of 100</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-[var(--color-ink-dim)] mb-1">Industry Percentile</p>
              <p className="text-3xl font-bold">{snapshot.overallPercentile ?? "—"}<span className="text-base font-normal">th</span></p>
              <p className={`text-xs mt-1 font-semibold ${rankingColor}`}>{rankingLabel ?? "—"}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-[var(--color-ink-dim)] mb-1">Maturity Level</p>
              <p className={`text-xl font-bold mt-1 ${maturityColor}`}>{maturityLabel ?? "—"}</p>
              <p className="text-xs text-[var(--color-ink-dim)] mt-1">{snapshot.industry?.replace(/_/g, " ") ?? "All Industries"}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-[var(--color-ink-dim)] mb-1">Peer Group</p>
              <p className="text-3xl font-bold">{snapshot.peerCount ?? 0}<span className="text-base font-normal">+</span></p>
              <p className="text-xs text-[var(--color-ink-dim)] mt-1">organizations benchmarked</p>
            </Card>
          </div>

          {/* Category scores grid */}
          <div>
            <h2 className="text-base font-semibold mb-4">Benchmark Scorecards™</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {scores.map((score) => {
                const label = BENCHMARK_CATEGORY_LABELS[score.category as BenchmarkCategory] ?? score.category;
                const rankLabel = BENCHMARK_RANKING_LABELS[score.rankingLabel] ?? score.rankingLabel;
                const rankColor = BENCHMARK_RANKING_COLORS[score.rankingLabel] ?? "text-[var(--color-ink-dim)]";
                return (
                  <Card key={score.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium">{label}</p>
                      <span className={`text-xs font-semibold ${rankColor}`}>{rankLabel}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold">{score.orgScore ?? "—"}</span>
                      <div className="flex-1 space-y-0.5">
                        <p className="text-xs text-[var(--color-ink-faint)]">Industry avg: {score.industryAvg ?? "—"}</p>
                        <PercentileBar percentile={score.percentile} topQuartile={score.topQuartile} />
                      </div>
                      <DeltaBadge delta={score.deltaVsIndustry} />
                    </div>
                    <p className="text-xs text-[var(--color-ink-dim)]">
                      {score.percentile !== null ? `${score.percentile}th percentile` : "No data"} · Top quartile: {score.topQuartile ?? "—"}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" /> Top Strengths™
              </h2>
              <div className="space-y-2">
                {strengths.length === 0 && (
                  <p className="text-sm text-[var(--color-ink-dim)]">No categories above industry average yet.</p>
                )}
                {strengths.map((s) => (
                  <Card key={s.id} className="p-3 flex items-center justify-between">
                    <p className="text-sm font-medium">{BENCHMARK_CATEGORY_LABELS[s.category as BenchmarkCategory]}</p>
                    <span className="text-xs font-semibold text-green-400">+{s.deltaVsIndustry} vs industry</span>
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-400" /> Improvement Opportunities™
              </h2>
              <div className="space-y-2">
                {weaknesses.length === 0 && (
                  <p className="text-sm text-[var(--color-ink-dim)]">Performing above industry average in all categories.</p>
                )}
                {weaknesses.map((s) => (
                  <Card key={s.id} className="p-3 flex items-center justify-between">
                    <p className="text-sm font-medium">{BENCHMARK_CATEGORY_LABELS[s.category as BenchmarkCategory]}</p>
                    <span className="text-xs font-semibold text-orange-400">{s.deltaVsIndustry} vs industry</span>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-[var(--color-ink-faint)]">
            Last benchmarked: {snapshot.snapshotDate} · Peer data: {snapshot.peerCount}+ organizations
          </p>
        </>
      )}
    </div>
  );
}
