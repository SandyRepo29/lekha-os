export const dynamic = "force-dynamic";

import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/benchmarking/benchmarking-service";
import {
  BENCHMARK_RANKING_LABELS,
  BENCHMARK_RANKING_COLORS,
  BENCHMARK_CATEGORY_LABELS,
  type BenchmarkCategory,
} from "@/lib/services/benchmarking-score";
import { AlertTriangle, Shield } from "lucide-react";

export default async function RiskControlsBenchmarkPage() {
  const session = await requireUser();
  if (!session.org) return null;
  const { snapshot, scores } = await getDashboardData(session.org.id);

  const categories: BenchmarkCategory[] = ["risk_posture", "control_health", "audit_readiness", "issue_resolution"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Risk & Control Benchmark™</h2>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">
          Risk posture, control effectiveness, and audit readiness vs. peers.
        </p>
      </div>

      {!snapshot ? (
        <Card className="p-8 text-center">
          <p className="text-[var(--color-ink-dim)]">Run a benchmark first to see risk and control comparisons.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const s = scores.find((sc) => sc.category === cat);
            const icon = cat === "risk_posture" || cat === "issue_resolution" ? AlertTriangle : Shield;
            const IconComp = icon;
            const iconColor = cat === "risk_posture" ? "text-orange-400" : cat === "control_health" ? "text-blue-400" : cat === "audit_readiness" ? "text-green-400" : "text-purple-400";
            const bgColor = cat === "risk_posture" ? "bg-orange-500/20" : cat === "control_health" ? "bg-blue-500/20" : cat === "audit_readiness" ? "bg-green-500/20" : "bg-purple-500/20";
            return (
              <Card key={cat} className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
                    <IconComp className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{BENCHMARK_CATEGORY_LABELS[cat]}</p>
                    {s && <p className={`text-xs font-semibold ${BENCHMARK_RANKING_COLORS[s.rankingLabel]}`}>{BENCHMARK_RANKING_LABELS[s.rankingLabel]}</p>}
                  </div>
                </div>
                {s ? (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-2xl font-bold">{s.orgScore ?? "—"}</p>
                      <p className="text-xs text-[var(--color-ink-faint)]">Your Score</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[var(--color-ink-dim)]">{s.industryAvg ?? "—"}</p>
                      <p className="text-xs text-[var(--color-ink-faint)]">Industry Avg</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{s.percentile ?? "—"}<span className="text-sm font-normal">th</span></p>
                      <p className="text-xs text-[var(--color-ink-faint)]">Percentile</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-ink-dim)]">No data available.</p>
                )}
                {s?.deltaVsIndustry !== null && s?.deltaVsIndustry !== undefined && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-line)]">
                    <p className={`text-xs font-semibold ${s.deltaVsIndustry >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {s.deltaVsIndustry >= 0 ? "+" : ""}{s.deltaVsIndustry} vs industry average · Top quartile: {s.topQuartile ?? "—"}
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
