export const dynamic = "force-dynamic";

export const metadata = { title: 'Governance Benchmarking&#8482; — AUDT' };

import Link from "next/link";
import { BarChart3, TrendingUp, Award, Zap, ArrowUpRight, ArrowDownRight, Sparkles, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/benchmarking/benchmarking-service";
import {
  BENCHMARK_CATEGORY_LABELS,
  BENCHMARK_MATURITY_LABELS,
  BENCHMARK_RANKING_LABELS,
  type BenchmarkCategory,
} from "@/lib/services/benchmarking-score";
import { ComputeBenchmarkButton } from "@/components/benchmarking/compute-button";
import {
  BenchmarkStat,
  MaturityBadge,
  PercentileBadge,
  RankingBadge,
  PercentileBar,
} from "@/components/benchmarking/benchmark-ui";

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-xs text-[var(--color-ink-faint)]">—</span>;
  if (delta > 0) return (
    <span className="flex items-center gap-0.5 text-xs text-emerald-400">
      <ArrowUpRight className="h-3 w-3" />+{delta}
    </span>
  );
  if (delta < 0) return (
    <span className="flex items-center gap-0.5 text-xs text-red-400">
      <ArrowDownRight className="h-3 w-3" />{delta}
    </span>
  );
  return <span className="text-xs text-[var(--color-ink-dim)]">0</span>;
}

function accentForPercentile(pct: number | null): "good" | "warn" | "danger" | "neutral" {
  if (pct === null) return "neutral";
  if (pct >= 75) return "good";
  if (pct >= 50) return "neutral";
  if (pct >= 25) return "warn";
  return "danger";
}

export default async function BenchmarkingDashboard() {
  const session = await requireUser();
  if (!session.org) return null;
  const orgId = session.org.id;

  const { snapshot, scores } = await getDashboardData(orgId);

  const strengths = scores
    .filter((s) => s.deltaVsIndustry !== null && s.deltaVsIndustry > 0)
    .sort((a, b) => (b.deltaVsIndustry ?? 0) - (a.deltaVsIndustry ?? 0))
    .slice(0, 3);

  const weaknesses = scores
    .filter((s) => s.deltaVsIndustry !== null && s.deltaVsIndustry < 0)
    .sort((a, b) => (a.deltaVsIndustry ?? 0) - (b.deltaVsIndustry ?? 0))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Governance Benchmarking&#8482;</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">
            Compare your governance posture against industry peers and discover your competitive position.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/v1/benchmarking/export/csv"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-white/[0.04]"
          >
            <Download className="h-3.5 w-3.5" />
            Export Benchmark CSV
          </a>
          <Link href="/benchmarking/ai" className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-white/[0.04] transition-colors">
            <Sparkles className="h-3.5 w-3.5" />
            AI Benchmark Analyst&#8482;
          </Link>
          <Link
            href="/benchmarking/rankings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-line)] text-sm font-semibold hover:bg-white/[0.04] transition-colors"
          >
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
          {/* Hero metrics — BenchmarkStat strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <BenchmarkStat
              label="Overall Score"
              value={snapshot.overallScore ?? "—"}
              accent={accentForPercentile(snapshot.overallPercentile)}
              sub="out of 100"
            />
            <BenchmarkStat
              label="Industry Percentile"
              value={snapshot.overallPercentile !== null ? `${snapshot.overallPercentile}th` : "—"}
              accent={accentForPercentile(snapshot.overallPercentile)}
              sub={
                snapshot.overallPercentile !== null && snapshot.overallPercentile >= 75
                  ? "Top quartile"
                  : snapshot.overallPercentile !== null && snapshot.overallPercentile >= 50
                  ? "Above average"
                  : "Below average"
              }
            />
            <div className="flex flex-col gap-1">
              <Card className="border-l-2 border-[var(--color-line)] border-l-[var(--color-line-strong)] px-4 py-3 h-full">
                <p className="text-xs text-[var(--color-ink-faint)]">Maturity Level</p>
                <div className="mt-1.5">
                  <MaturityBadge level={snapshot.maturityLevel} />
                </div>
                <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">
                  {snapshot.industry?.replace(/_/g, " ") ?? "All Industries"}
                </p>
              </Card>
            </div>
            <BenchmarkStat
              label="Peer Group"
              value={`${snapshot.peerCount ?? 0}+`}
              accent="neutral"
              sub="organizations benchmarked"
            />
          </div>

          {/* Ranking banner */}
          <Card className="p-4 border-[var(--color-blue)]/20 bg-[var(--color-blue)]/[0.03] flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Award className="h-5 w-5 text-[var(--color-blue)] flex-shrink-0" />
              <div>
                <p className="text-xs text-[var(--color-ink-dim)]">Overall Ranking</p>
                <RankingBadge
                  ranking={snapshot.overallRanking}
                  label={BENCHMARK_RANKING_LABELS[snapshot.overallRanking]}
                  className="mt-1"
                />
              </div>
            </div>
            <PercentileBar percentile={snapshot.overallPercentile} />
          </Card>

          {/* Category scores grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Benchmark Scorecards&#8482;</h2>
              <Link href="/benchmarking/rankings" className="text-xs text-[var(--color-blue)] hover:underline">View all &#8594;</Link>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {scores.map((score) => {
                const label = BENCHMARK_CATEGORY_LABELS[score.category as BenchmarkCategory] ?? score.category;
                const acc = accentForPercentile(score.percentile);
                return (
                  <Card
                    key={score.id}
                    className="p-4 border-l-2 border-[var(--color-line)] border-l-[var(--color-line-strong)]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium">{label}</p>
                      <div className="flex items-center gap-1.5">
                        <PercentileBadge percentile={score.percentile} />
                        <RankingBadge
                          ranking={score.rankingLabel}
                          label={BENCHMARK_RANKING_LABELS[score.rankingLabel]}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold">{score.orgScore ?? "—"}</span>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs text-[var(--color-ink-faint)]">
                          Industry avg: {score.industryAvg ?? "—"} · Top quartile: {score.topQuartile ?? "—"}
                        </p>
                        <PercentileBar percentile={score.percentile} />
                      </div>
                      <DeltaBadge delta={score.deltaVsIndustry} />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" /> Top Strengths™
              </h2>
              <div className="space-y-2">
                {strengths.length === 0 && (
                  <p className="text-sm text-[var(--color-ink-dim)]">No categories above industry average yet.</p>
                )}
                {strengths.map((s) => (
                  <Card key={s.id} className="p-3 flex items-center justify-between">
                    <p className="text-sm font-medium">{BENCHMARK_CATEGORY_LABELS[s.category as BenchmarkCategory]}</p>
                    <span className="text-xs font-semibold text-emerald-400">+{s.deltaVsIndustry} vs industry</span>
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
