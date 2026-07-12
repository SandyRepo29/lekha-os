export const dynamic = "force-dynamic";

import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/benchmarking/benchmarking-service";
import {
  BENCHMARK_RANKING_LABELS,
  BENCHMARK_CATEGORY_LABELS,
  type BenchmarkCategory,
} from "@/lib/services/benchmarking-score";
import { AlertTriangle, Shield } from "lucide-react";
import { PercentileBadge, RankingBadge, PercentileBar } from "@/components/benchmarking/benchmark-ui";

function accentForPercentile(pct: number | null): "good" | "warn" | "danger" | "neutral" {
  if (pct === null) return "neutral";
  if (pct >= 75) return "good";
  if (pct >= 50) return "neutral";
  if (pct >= 25) return "warn";
  return "danger";
}

const CAT_META: Record<string, { icon: React.ElementType; iconColor: string; bg: string }> = {
  risk_posture:     { icon: AlertTriangle, iconColor: "text-orange-700",  bg: "bg-orange-100" },
  control_health:   { icon: Shield,        iconColor: "text-blue-700",    bg: "bg-blue-100" },
  audit_readiness:  { icon: Shield,        iconColor: "text-emerald-700", bg: "bg-emerald-100" },
  issue_resolution: { icon: AlertTriangle, iconColor: "text-purple-700",  bg: "bg-purple-100" },
};

export default async function RiskControlsBenchmarkPage() {
  const session = await requireUser();
  if (!session.org) return null;
  const { snapshot, scores } = await getDashboardData(session.org.id);

  const categories: BenchmarkCategory[] = ["risk_posture", "control_health", "audit_readiness", "issue_resolution"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Risk &amp; Control Benchmark™</h2>
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
            const meta = CAT_META[cat] ?? CAT_META.risk_posture;
            const IconComp = meta.icon;
            return (
              <Card key={cat} className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                    <IconComp className={`h-5 w-5 ${meta.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{BENCHMARK_CATEGORY_LABELS[cat]}</p>
                    {s && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <RankingBadge ranking={s.rankingLabel} label={BENCHMARK_RANKING_LABELS[s.rankingLabel]} />
                        <PercentileBadge percentile={s.percentile} />
                      </div>
                    )}
                  </div>
                </div>
                {s ? (
                  <>
                    <div className="grid grid-cols-3 gap-3 text-center mb-3">
                      <div>
                        <p className="text-2xl font-bold">{s.orgScore ?? "—"}</p>
                        <p className="text-xs text-[var(--color-ink-faint)]">Your Score</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[var(--color-ink-dim)]">{s.industryAvg ?? "—"}</p>
                        <p className="text-xs text-[var(--color-ink-faint)]">Industry Avg</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {s.percentile ?? "—"}<span className="text-sm font-normal">th</span>
                        </p>
                        <p className="text-xs text-[var(--color-ink-faint)]">Percentile</p>
                      </div>
                    </div>
                    <PercentileBar percentile={s.percentile} />
                    {s.deltaVsIndustry !== null && s.deltaVsIndustry !== undefined && (
                      <div className="mt-3 pt-3 border-t border-[var(--color-line)]">
                        <p className={`text-xs font-semibold ${s.deltaVsIndustry >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                          {s.deltaVsIndustry >= 0 ? "+" : ""}{s.deltaVsIndustry} vs industry average · Top quartile: {s.topQuartile ?? "—"}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-[var(--color-ink-dim)]">No data available.</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
