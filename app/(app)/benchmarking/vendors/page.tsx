export const dynamic = "force-dynamic";

import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/benchmarking/benchmarking-service";
import {
  BENCHMARK_RANKING_LABELS,
  BENCHMARK_RANKING_COLORS,
} from "@/lib/services/benchmarking-score";
import { Building2, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";

export default async function VendorBenchmarkPage() {
  const session = await requireUser();
  if (!session.org) return null;
  const { snapshot, scores } = await getDashboardData(session.org.id);

  const vendorScore = scores.find((s) => s.category === "vendor_trust");
  const rankLabel = vendorScore ? BENCHMARK_RANKING_LABELS[vendorScore.rankingLabel] : null;
  const rankColor = vendorScore ? BENCHMARK_RANKING_COLORS[vendorScore.rankingLabel] : "text-[var(--color-ink-dim)]";

  const metrics = [
    { label: "Average Vendor Trust Score",   key: "vendor_trust" },
    { label: "Risk Posture vs Peers",         key: "risk_posture" },
    { label: "Compliance Coverage",           key: "compliance_coverage" },
    { label: "Control Health™",               key: "control_health" },
  ];

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
                  <p className={`text-sm font-semibold mt-1 ${rankColor}`}>{rankLabel}</p>
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
                    <p className="text-2xl font-bold">{vendorScore.percentile ?? "—"}<span className="text-sm font-normal">th</span></p>
                    <p className="text-xs text-[var(--color-ink-faint)]">Your Percentile</p>
                  </div>
                </div>
              </div>
              {vendorScore.deltaVsIndustry !== null && (
                <div className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${vendorScore.deltaVsIndustry >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {vendorScore.deltaVsIndustry >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {vendorScore.deltaVsIndustry >= 0 ? "+" : ""}{vendorScore.deltaVsIndustry} points vs industry average
                </div>
              )}
            </Card>
          )}

          {/* Related metrics */}
          <div className="grid md:grid-cols-2 gap-4">
            {metrics.map(({ label, key }) => {
              const s = scores.find((sc) => sc.category === key);
              if (!s) return null;
              return (
                <Card key={key} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--color-ink-dim)] mb-0.5">{label}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold">{s.orgScore ?? "—"}</span>
                        <span className="text-xs text-[var(--color-ink-dim)]">/ avg {s.industryAvg ?? "—"}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-semibold ${BENCHMARK_RANKING_COLORS[s.rankingLabel]}`}>
                        {BENCHMARK_RANKING_LABELS[s.rankingLabel]}
                      </p>
                      <p className="text-xs text-[var(--color-ink-dim)]">{s.percentile ?? "—"}th pct</p>
                    </div>
                  </div>
                </Card>
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
