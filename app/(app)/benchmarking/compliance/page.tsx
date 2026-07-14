export const dynamic = "force-dynamic";

import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/backend/src/modules/benchmarking/benchmarking-service";
import {
  BENCHMARK_RANKING_LABELS,
  type BenchmarkCategory,
} from "@/backend/src/modules/benchmarking/benchmarking-score";
import { ShieldCheck, Lock, FileText, FileSignature } from "lucide-react";
import { PercentileBadge, RankingBadge, PercentileBar } from "@/components/benchmarking/benchmark-ui";

const COMPLIANCE_CATEGORIES: {
  cat: BenchmarkCategory;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}[] = [
  { cat: "compliance_coverage", label: "Compliance Coverage",  icon: ShieldCheck,   color: "text-emerald-700", bg: "bg-emerald-100" },
  { cat: "privacy_trust",       label: "Privacy Trust™",       icon: Lock,          color: "text-purple-700",  bg: "bg-purple-100" },
  { cat: "contract_trust",      label: "Contract Trust™",      icon: FileSignature, color: "text-blue-700",    bg: "bg-blue-100" },
  { cat: "workflow_automation", label: "Workflow Automation™", icon: FileText,      color: "text-orange-700",  bg: "bg-orange-100" },
];

export default async function ComplianceBenchmarkPage() {
  const session = await requireUser();
  if (!session.org) return null;
  const { snapshot, scores } = await getDashboardData(session.org.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Compliance Benchmark™</h2>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">
          Compliance coverage, privacy posture, and contract governance vs. industry.
        </p>
      </div>

      {!snapshot ? (
        <Card className="p-8 text-center">
          <p className="text-[var(--color-ink-dim)]">Run a benchmark first to see compliance comparisons.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {COMPLIANCE_CATEGORIES.map(({ cat, label, icon: Icon, color, bg }) => {
            const s = scores.find((sc) => sc.category === cat);
            return (
              <Card key={cat} className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{label}</p>
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
                          {s.deltaVsIndustry >= 0 ? "+" : ""}{s.deltaVsIndustry} vs industry average
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
