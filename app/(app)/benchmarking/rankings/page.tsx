export const dynamic = "force-dynamic";

import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/backend/src/modules/benchmarking/benchmarking-service";
import {
  BENCHMARK_CATEGORY_LABELS,
  BENCHMARK_MATURITY_LABELS,
  BENCHMARK_RANKING_LABELS,
  type BenchmarkCategory,
  type BenchmarkMaturityLevel,
  type BenchmarkRankingLabel,
} from "@/backend/src/modules/benchmarking/benchmarking-score";
import { Award, Crown, Medal, Star } from "lucide-react";
import { MaturityBadge, PercentileBadge, RankingBadge, PercentileBar } from "@/components/benchmarking/benchmark-ui";

const MATURITY_DESCRIPTIONS: Record<BenchmarkMaturityLevel, string> = {
  reactive:     "Governance is ad-hoc. No formal processes or measurement.",
  managed:      "Basic governance processes exist but are inconsistently applied.",
  defined:      "Governance processes are documented and consistently followed.",
  measured:     "Governance metrics are tracked and benchmarked against peers.",
  optimized:    "Governance is continuously improved based on data and feedback.",
  trust_leader: "Industry-leading governance. Top 1% of all organizations.",
};

const RANKING_META: Record<BenchmarkRankingLabel, { icon: React.ElementType; color: string }> = {
  top_1_percent:  { icon: Crown,  color: "text-purple-700" },
  top_5_percent:  { icon: Crown,  color: "text-blue-700" },
  top_10_percent: { icon: Medal,  color: "text-blue-700" },
  top_quartile:   { icon: Medal,  color: "text-emerald-700" },
  above_average:  { icon: Star,   color: "text-emerald-700" },
  average:        { icon: Star,   color: "text-amber-700" },
  below_average:  { icon: Award,  color: "text-orange-700" },
  at_risk:        { icon: Award,  color: "text-red-700" },
};

const MATURITY_ORDER: BenchmarkMaturityLevel[] = [
  "reactive", "managed", "defined", "measured", "optimized", "trust_leader",
];

export default async function RankingsPage() {
  const session = await requireUser();
  if (!session.org) return null;
  const { snapshot, scores } = await getDashboardData(session.org.id);

  const meta = snapshot ? RANKING_META[snapshot.overallRanking] : null;
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
          {meta && (
            <Card className="p-6 border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.04]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-blue)]/20 flex items-center justify-center flex-shrink-0">
                  <meta.icon className={`h-7 w-7 ${meta.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <RankingBadge
                    ranking={snapshot.overallRanking}
                    label={BENCHMARK_RANKING_LABELS[snapshot.overallRanking]}
                    className="mb-1.5"
                  />
                  <p className="text-sm text-[var(--color-ink-dim)]">
                    Overall Percentile: {snapshot.overallPercentile ?? "—"}th · Score: {snapshot.overallScore ?? "—"}/100
                  </p>
                </div>
                <PercentileBadge percentile={snapshot.overallPercentile} />
              </div>
            </Card>
          )}

          {/* Maturity level */}
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <p className="text-xs text-[var(--color-ink-dim)] mb-1.5">Governance Maturity Level</p>
                <div className="flex items-center gap-2">
                  <MaturityBadge level={snapshot.maturityLevel} />
                  <span className="text-sm font-semibold text-[var(--color-ink-dim)]">
                    Level {MATURITY_ORDER.indexOf(snapshot.maturityLevel) + 1} — {BENCHMARK_MATURITY_LABELS[snapshot.maturityLevel]}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-ink-dim)] mt-2">
                  {MATURITY_DESCRIPTIONS[snapshot.maturityLevel]}
                </p>
              </div>
            </div>
            {/* Maturity progress bar */}
            <div className="flex gap-1">
              {MATURITY_ORDER.map((level, i) => {
                const current = MATURITY_ORDER.indexOf(snapshot.maturityLevel);
                return (
                  <div
                    key={level}
                    className={`flex-1 h-2 rounded-full ${i <= current ? "bg-[var(--color-blue)]" : "bg-slate-100"}`}
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
                return (
                  <Card key={s.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[var(--color-ink-faint)] w-6 text-center">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {BENCHMARK_CATEGORY_LABELS[s.category as BenchmarkCategory]}
                        </p>
                      </div>
                      <div className="hidden sm:block w-24">
                        <PercentileBar percentile={s.percentile} />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-bold">{s.orgScore ?? "—"}</p>
                          <p className="text-xs text-[var(--color-ink-faint)]">score</p>
                        </div>
                        <PercentileBadge percentile={s.percentile} />
                        <RankingBadge
                          ranking={s.rankingLabel}
                          label={BENCHMARK_RANKING_LABELS[s.rankingLabel]}
                          className="hidden md:inline-flex"
                        />
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
