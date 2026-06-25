export const dynamic = "force-dynamic";

export const metadata = { title: 'Risk Lens&#8482; — AUDT' };

import Link from "next/link";
import { AlertTriangle, Plus, Sparkles, Clock } from "lucide-react";
import { RiskImportButton } from "@/components/risks/risk-import-button";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getDashboardMetrics } from "@/lib/services/risk/risk-service";
import { RiskScoreBadge, RiskCategoryBadge, RiskStatusBadge } from "@/components/risk/risk-status-badge";
import { RiskStat, formatDate } from "@/components/risk/risk-ui";
import { RiskHeatMap } from "@/components/risk/risk-heat-map";
import { RISK_CATEGORY_LABELS } from "@/lib/services/risk-scoring";
import { listModuleActivity } from "@/lib/repositories/activity-repo";
import { ActivityFeed } from "@/components/activity/activity-feed";

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

  const [metrics, recentActivity] = await Promise.all([
    getDashboardMetrics(session.org.id),
    listModuleActivity(session.org.id, "risk", 5).catch(() => [] as any[]),
  ]);

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
        <div className="flex items-center gap-2">
          <Link href="/risks/ai" className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-white/[0.04] transition-colors">
            <Sparkles className="h-3.5 w-3.5" />
            AI Risk Officer&#8482;
          </Link>
          <RiskImportButton />
          <Link href="/risks/new">
            <Button variant="primary" size="md">
              <Plus className="h-4 w-4" /> New Risk
            </Button>
          </Link>
        </div>
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
          <div className="px-5 py-4 border-b border-[var(--color-line)] flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">Risk by Category</h2>
            <Link href="/risks/list" className="text-xs text-[var(--color-blue)] hover:underline">View all &rarr;</Link>
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
            description="Risk Lens&#8482; is your central register for operational, cyber, compliance and vendor risks. Log your first risk to start building your governance posture."
            action={
              <div className="flex flex-col items-center gap-2">
                <Link href="/risks/new">
                  <Button variant="primary" size="md">
                    <Plus className="h-4 w-4" /> Log your first risk
                  </Button>
                </Link>
                <p className="text-xs text-[var(--color-ink-faint)]">5&#215;5 heat map &#183; AI risk narratives &#183; Treatment tracking</p>
              </div>
            }
          />
        </Card>
      )}

      {/* Recent Activity */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--color-ink-dim)]" />
            <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">Recent Activity</h2>
          </div>
          <Link href="/settings/audit-logs" className="text-xs text-[var(--color-blue)] hover:underline">
            View all &#8594;
          </Link>
        </div>
        <ActivityFeed items={recentActivity} emptyMessage="No risk activity yet." />
      </div>
    </div>
  );
}
