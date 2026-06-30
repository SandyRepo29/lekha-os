export const dynamic = "force-dynamic";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getRiskMetrics } from "@/lib/repositories/trust-intelligence-repo";
import { TrustStat } from "@/components/trust-intelligence/trust-intelligence-ui";
import { RiskScoreBadge, RiskCategoryBadge } from "@/components/risk/risk-status-badge";
import { RISK_CATEGORY_LABELS } from "@/lib/services/risk-scoring";

export default async function RiskInsightsPage() {
  const session = await requireUser();
  if (!session.org) return null;

  const metrics = await getRiskMetrics(session.org.id);

  const categoryEntries = Object.entries(metrics.byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Risk Insights</h2>
        <p className="text-sm text-[var(--color-ink-dim)]">Risk exposure from Risk Lens™</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TrustStat label="Total Risks" value={metrics.total} sub={`${metrics.activeCount} active`} accent="neutral" />
        <TrustStat label="Critical Risks" value={metrics.criticalCount} sub="Score ≥ 20/25" accent={metrics.criticalCount > 0 ? "danger" : "neutral"} />
        <TrustStat label="High Risks" value={metrics.highCount} sub="Score 12–19" accent={metrics.highCount > 0 ? "warn" : "neutral"} />
        <TrustStat label="Medium Risks" value={metrics.mediumCount} sub="Score < 12" accent="neutral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold mb-4 text-red-400">Top Critical Risks</p>
          {metrics.topRisks.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-faint)]">No critical risks. Great posture!</p>
          ) : (
            <div className="space-y-2">
              {metrics.topRisks.map((r) => (
                <Link key={r.id} href={`/risks/${r.id}`}>
                  <div className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white transition-colors">
                    <span className="flex-1 text-sm text-[var(--color-ink)]">{r.title}</span>
                    <RiskCategoryBadge category={r.category} />
                    <RiskScoreBadge score={r.inherentScore} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold mb-4">Risk Distribution by Category</p>
          {categoryEntries.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-faint)]">No active risks.</p>
          ) : (
            <div className="space-y-3">
              {categoryEntries.map(([cat, count]) => {
                const pct = Math.round((count / metrics.activeCount) * 100);
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--color-ink-dim)]">
                        {RISK_CATEGORY_LABELS[cat] ?? cat}
                      </span>
                      <span className="text-xs font-semibold text-[var(--color-ink)]">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-red-500/60" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <p className="text-sm font-semibold mb-2">Go Deeper</p>
        <p className="text-xs text-[var(--color-ink-dim)] mb-4">Full risk management in Risk Lens™.</p>
        <Link href="/risks">
          <span className="text-sm text-[var(--color-blue)] hover:underline">Open Risk Lens™ →</span>
        </Link>
      </Card>
    </div>
  );
}
