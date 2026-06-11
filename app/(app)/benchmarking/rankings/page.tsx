export const dynamic = "force-dynamic";

import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/benchmarking/benchmarking-service";
import {
  BENCHMARK_CATEGORY_LABELS,
  BENCHMARK_MATURITY_LABELS,
  BENCHMARK_RANKING_LABELS,
  BENCHMARK_MATURITY_COLORS,
  BENCHMARK_RANKING_COLORS,
  type BenchmarkCategory,
  type BenchmarkMaturityLevel,
  type BenchmarkRankingLabel,
} from "@/lib/services/benchmarking-score";
import { Award, Crown, Medal, Star } from "lucide-react";

const MATURITY_DESCRIPTIONS: Record<BenchmarkMaturityLevel, string> = {
  reactive: "Governance is ad-hoc. No formal processes or measurement.",
  managed: "Basic governance processes exist but are inconsistently applied.",
  defined: "Governance processes are documented and consistently followed.",
  measured: "Governance metrics are tracked and benchmarked against peers.",
  optimized: "Governance is continuously improved based on data and feedback.",
  trust_leader: "Industry-leading governance. Top 1% of all organizations.",
};

const RANKING_DESCRIPTIONS: Record<BenchmarkRankingLabel, { label: string; color: string; icon: React.ElementType }> = {
  top_1_percent:   { label: "Top 1% — Trust Leader",          color: "text-purple-400",  icon: Crown },
  top_5_percent:   { label: "Top 5% — Elite Performer",        color: "text-blue-400",    icon: Crown },
  top_10_percent:  { label: "Top 10% — Top Performer",         color: "text-blue-400",    icon: Medal },
  top_quartile:    { label: "Top Quartile — Strong Performer", color: "text-green-400",   icon: Medal },
  above_average:   { label: "Above Average",                   color: "text-green-400",   icon: Star },
  average:         { label: "Average — Meets Baseline",        color: "text-yellow-400",  icon: Star },
  below_average:   { label: "Below Average",                   color: "text-orange-400",  icon: Award },
  at_risk:         { label: "At Risk — Needs Improvement",     color: "text-red-400",     icon: Award },
};

export default async function RankingsPage() {
  const session = await requireUser();
  if (!session.org) return null;
  const { snapshot, scores } = await getDashboardData(session.org.id);

  const ranking = snapshot ? RANKING_DESCRIPTIONS[snapshot.overallRanking] : null;
  const maturityColor = snapshot ? BENCHMARK_MATURITY_COLORS[snapshot.maturityLevel] : "text-[var(--color-ink-dim)]";

  const sortedScores = [...scores].sort((a, b) => (b.percentile ?? 0) - (a.percentile ?? 0));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Governance Rankings™</h2>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">
          Your industry ranking across all governance categories.
        </p>
      </div>

      {!snapshot ? (
        <Card className="p-8 text-center">
          <Award className="h-12 w-12 text-[var(--color-ink-faint)] mx-auto mb-3" />
          <p className="text-[var(--color-ink-dim)]">Run a benchmark first to see your rankings.</p>
        </Card>
      ) : (
        <>
          {/* Overall ranking banner */}
          {ranking && (
            <Card className="p-6 border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.04]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-blue)]/20 flex items-center justify-center flex-shrink-0">
                  <ranking.icon className={`h-7 w-7 ${ranking.color}`} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${ranking.color}`}>{ranking.label}</p>
                  <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
                    Overall Percentile: {snapshot.overallPercentile ?? "—"}th · Score: {snapshot.overallScore ?? "—"}/100
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Maturity level */}
          <Card className="p-5">
            <div className="flex items-start gap-4">
              <div>
                <p className="text-xs text-[var(--color-ink-dim)] mb-0.5">Governance Maturity Level</p>
                <p className={`text-2xl font-bold ${maturityColor}`}>
                  Level {["reactive","managed","defined","measured","optimized","trust_leader"].indexOf(snapshot.maturityLevel) + 1} — {BENCHMARK_MATURITY_LABELS[snapshot.maturityLevel]}
                </p>
                <p className="text-sm text-[var(--color-ink-dim)] mt-1">
                  {MATURITY_DESCRIPTIONS[snapshot.maturityLevel]}
                </p>
              </div>
            </div>
            {/* Maturity progress bar */}
            <div className="mt-4 flex gap-1">
              {(["reactive","managed","defined","measured","optimized","trust_leader"] as BenchmarkMaturityLevel[]).map((level, i) => {
                const current = ["reactive","managed","defined","measured","optimized","trust_leader"].indexOf(snapshot.maturityLevel);
                return (
                  <div
                    key={level}
                    className={`flex-1 h-2 rounded-full ${i <= current ? "bg-[var(--color-blue)]" : "bg-white/10"}`}
                    title={BENCHMARK_MATURITY_LABELS[level]}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-[var(--color-ink-faint)]">Reactive</span>
              <span className="text-xs text-[var(--color-ink-faint)]">Trust Leader</span>
            </div>
          </Card>

          {/* Category rankings */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Category Rankings</h3>
            <div className="space-y-2">
              {sortedScores.map((s, i) => {
                const rankInfo = RANKING_DESCRIPTIONS[s.rankingLabel];
                const RankIcon = rankInfo.icon;
                return (
                  <Card key={s.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[var(--color-ink-faint)] w-6 text-center">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{BENCHMARK_CATEGORY_LABELS[s.category as BenchmarkCategory]}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold">{s.orgScore ?? "—"}</p>
                          <p className="text-xs text-[var(--color-ink-faint)]">score</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{s.percentile ?? "—"}<span className="text-xs font-normal">th</span></p>
                          <p className="text-xs text-[var(--color-ink-faint)]">pct</p>
                        </div>
                        <span className={`text-xs font-semibold min-w-[90px] text-right ${rankInfo.color}`}>
                          {BENCHMARK_RANKING_LABELS[s.rankingLabel]}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
