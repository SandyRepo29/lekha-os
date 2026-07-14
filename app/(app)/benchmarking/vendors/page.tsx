export const dynamic = "force-dynamic";

import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/backend/src/modules/benchmarking/benchmarking-service";
import { BENCHMARK_RANKING_LABELS } from "@/backend/src/modules/benchmarking/benchmarking-score";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { BenchmarkStat, PercentileBadge, RankingBadge, PercentileBar } from "@/components/benchmarking/benchmark-ui";

function accentForPercentile(pct: number | null): "good" | "warn" | "danger" | "neutral" {
  if (pct === null) return "neutral";
  if (pct >= 75) return "good";
  if (pct >= 50) return "neutral";
  if (pct >= 25) return "warn";
  return "danger";
}

export default async function VendorBenchmarkPage() {
  const session = await requireUser();
  if (!session.org) return null;
  const { snapshot, scores } = await getDashboardData(session.org.id);

  const vendorScore = scores.find((s) => s.category === "vendor_trust");

  const metrics = [
    { label: "Average Vendor Trust Score",   key: "vendor_trust" },
    { label: "Risk Posture vs Peers",         key: "risk_posture" },
    { label: "Compliance Coverage",           key: "compliance_coverage" },
    { label: "Control Health™",               key: "control_health" },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Vendor Trust Benchmark™</h2>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">
          How your vendor governance compares to industry peers.
        </p>
      </div>

      {!snapshot ? (
        <Card className="p-8 text-center">
          <p className="text-[var(--color-ink-dim)]">Run a benchmark first to see vendor trust comparisons.</p>
        </Card>
      ) : (
        <>
          {/* Hero */}
          {vendorScore && (
            <Card className="p-6 border-[var(--color-blue)]/30">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-[var(--color-ink-dim)] mb-1">Vendor Trust Score™</p>
                  <p className="text-5xl font-bold">{vendorScore.orgScore ?? "—"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <RankingBadge ranking={vendorScore.rankingLabel} label={BENCHMARK_RANKING_LABELS[vendorScore.rankingLabel]} />
                    <PercentileBadge percentile={vendorScore.percentile} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-2xl font-bold text-[var(--color-ink-dim)]">{vendorScore.industryAvg ?? "—"}</p>
                    <p className="text-xs text-[var(--color-ink-faint)]">Industry Average</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--color-ink-dim)]">{vendorScore.topQuartile ?? "—"}</p>
                    <p className="text-xs text-[var(--color-ink-faint)]">Top Quartile</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {vendorScore.percentile ?? "—"}<span className="text-sm font-normal">th</span>
                    </p>
                    <p className="text-xs text-[var(--color-ink-faint)]">Your Percentile</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <PercentileBar percentile={vendorScore.percentile} />
              </div>
              {vendorScore.deltaVsIndustry !== null && (
                <div className={`mt-3 inline-flex items-center gap-1 text-sm font-semibold ${vendorScore.deltaVsIndustry >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {vendorScore.deltaVsIndustry >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {vendorScore.deltaVsIndustry >= 0 ? "+" : ""}{vendorScore.deltaVsIndustry} points vs industry average
                </div>
              )}
            </Card>
          )}

          {/* Related metrics */}
          <div className="grid md:grid-cols-2 gap-3">
            {metrics.map(({ label, key }) => {
              const s = scores.find((sc) => sc.category === key);
              if (!s) return null;
              return (
                <BenchmarkStat
                  key={key}
                  label={label}
                  value={s.orgScore ?? "—"}
                  accent={accentForPercentile(s.percentile)}
                  sub={`Avg ${s.industryAvg ?? "—"} · ${s.percentile ?? "—"}th pct`}
                />
              );
            })}
          </div>

          {/* Interpretation */}
          <Card className="p-5 border-[var(--color-blue)]/20 bg-[var(--color-blue)]/[0.03]">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-[var(--color-blue)]" />
              <p className="text-sm font-semibold">What This Means</p>
            </div>
            <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">
              {vendorScore
                ? vendorScore.percentile !== null && vendorScore.percentile >= 75
                  ? "Your vendor governance is in the top quartile. You have strong vendor assessment and monitoring processes compared to peers."
                  : vendorScore.percentile !== null && vendorScore.percentile >= 50
                  ? "Your vendor trust performance is above average. Focus on vendor assessment coverage and evidence freshness to reach the top quartile."
                  : "There is room to improve vendor trust governance. Prioritize completing vendor assessments, improving document coverage, and increasing review frequency."
                : "Run a benchmark to see vendor trust comparisons."}
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
