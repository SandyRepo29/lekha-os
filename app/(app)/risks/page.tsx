export const dynamic = "force-dynamic";

import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getDashboardMetrics } from "@/lib/services/risk/risk-service";
import { RiskScoreBadge, RiskCategoryBadge, RiskStatusBadge } from "@/components/risk/risk-status-badge";
import { RiskStat, formatDate } from "@/components/risk/risk-ui";
import { RiskHeatMap } from "@/components/risk/risk-heat-map";
import { RISK_CATEGORY_LABELS } from "@/lib/services/risk-scoring";

export default async function RisksDashboardPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState
          icon={AlertTriangle}
          title="Risk Lens™"
          description="Connect Supabase to start managing risks."
        />
      </Card>
    );
  }

  const metrics = await getDashboardMetrics(session.org.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Risk Lens™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            {metrics.total} risk{metrics.total !== 1 ? "s" : ""} ·{" "}
            {metrics.critical} critical · {metrics.overdueReviews} overdue review{metrics.overdueReviews !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/risks/new">
          <Button variant="primary" size="md">
            <Plus className="h-4 w-4" /> New Risk
          </Button>
        </Link>
      </div>

      {/* Metrics grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RiskStat
          label="Total Risks"
          value={metrics.total}
          sub={`${metrics.open} open · ${metrics.identified} identified`}
          href="/risks/list"
        />
        <RiskStat
          label="Critical / Severe"
          value={metrics.critical}
          accent={metrics.critical > 0 ? "danger" : "neutral"}
          sub="Score ≥ 16 / 25"
          href="/risks/list?status=open"
        />
        <RiskStat
          label="Mitigating"
          value={metrics.mitigating}
          accent="warn"
          sub={`${metrics.accepted} accepted`}
          href="/risks/list?status=mitigating"
        />
        <RiskStat
          label="Overdue Reviews"
          value={metrics.overdueReviews}
          accent={metrics.overdueReviews > 0 ? "warn" : "neutral"}
          sub={`${metrics.closed} closed`}
        />
      </div>

      {/* Status strip */}
      <div className="grid gap-3 sm:grid-cols-5">
        <RiskStat label="Identified" value={metrics.identified} href="/risks/list?status=identified" />
        <RiskStat label="Open" value={metrics.open} accent="warn" href="/risks/list?status=open" />
        <RiskStat label="Mitigating" value={metrics.mitigating} accent="warn" href="/risks/list?status=mitigating" />
        <RiskStat label="Accepted" value={metrics.accepted} href="/risks/list?status=accepted" />
        <RiskStat label="Closed" value={metrics.closed} accent="good" href="/risks/list?status=closed" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Heat Map */}
        <Card>
          <div className="px-5 py-4 border-b border-[var(--color-line)]">
            <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">
              Risk Heat Map
            </h2>
            <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">Impact × Likelihood — click a cell to view risks</p>
          </div>
          <div className="p-5">
            {metrics.heatMapData.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-faint)] text-center py-8">No active risks to display.</p>
            ) : (
              <RiskHeatMap risks={metrics.heatMapData} />
            )}
          </div>
        </Card>

        {/* By Category */}
        <Card>
          <div className="px-5 py-4 border-b border-[var(--color-line)]">
            <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">Risk by Category</h2>
          </div>
          <div className="p-5 space-y-2">
            {Object.keys(metrics.byCategory).length === 0 ? (
              <p className="text-sm text-[var(--color-ink-faint)] text-center py-8">No risks yet.</p>
            ) : (
              Object.entries(metrics.byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, cnt]) => {
                  const total = Object.values(metrics.byCategory).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
                  return (
                    <Link key={cat} href={`/risks/list?category=${cat}`} className="flex items-center gap-3 group">
                      <span className="w-32 shrink-0 text-xs text-[var(--color-ink-dim)] group-hover:text-[var(--color-ink)] transition-colors">
                        {RISK_CATEGORY_LABELS[cat] ?? cat}
                      </span>
                      <div className="flex-1 rounded-full bg-white/[0.05] h-2 overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--color-blue)]/60" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right text-xs text-[var(--color-ink-dim)]">{cnt}</span>
                    </Link>
                  );
                })
            )}
          </div>
        </Card>
      </div>

      {/* Top Risks */}
      {metrics.topRisks.length > 0 && (
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-line)]">
            <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">Top Risks by Score</h2>
            <Link href="/risks/list" className="text-xs text-[var(--color-blue)] hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-[var(--color-line)]">
            {metrics.topRisks.map((r) => (
              <Link
                key={r.id}
                href={`/risks/${r.id}`}
                className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <RiskCategoryBadge category={r.category} />
                    {r.targetDate && (
                      <span className="text-xs text-[var(--color-ink-faint)]">Due {formatDate(r.targetDate)}</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <RiskStatusBadge status={r.status} />
                  <RiskScoreBadge score={r.inherentScore} />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {metrics.total === 0 && (
        <Card>
          <EmptyState
            icon={AlertTriangle}
            title="No risks logged yet"
            description="Risk Lens™ is your central register for operational, cyber, compliance and vendor risks. Log your first risk to start building your governance posture."
            action={
              <div className="flex flex-col items-center gap-2">
                <Link href="/risks/new">
                  <Button variant="primary" size="md">
                    <Plus className="h-4 w-4" /> Log your first risk
                  </Button>
                </Link>
                <p className="text-xs text-[var(--color-ink-faint)]">5×5 heat map · AI risk narratives · Treatment tracking</p>
              </div>
            }
          />
        </Card>
      )}
    </div>
  );
}
