export const dynamic = "force-dynamic";

import Link from "next/link";
import { Shield, Plus, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getDashboardMetrics } from "@/lib/services/control-center/control-center-service";
import { findAllControls } from "@/lib/repositories/control-center-repo";
import { ControlHealthBadge } from "@/components/controls/control-health-badge";
import { ControlStatusBadge } from "@/components/controls/control-status-badge";
import { ControlStat } from "@/components/controls/control-ui";

export default async function ControlsDashboardPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState icon={Shield} title="Control Center™" description="Connect Supabase to manage your control library." />
      </Card>
    );
  }

  const [metrics, controls] = await Promise.all([
    getDashboardMetrics(session.org.id),
    findAllControls(session.org.id),
  ]);

  const topWeak = controls
    .filter((c) => c.healthScore !== null && c.healthScore < 70)
    .sort((a, b) => (a.healthScore ?? 0) - (b.healthScore ?? 0))
    .slice(0, 5);

  const byCategory = controls.reduce<Record<string, number>>((acc, c) => {
    const cat = c.category ?? "Uncategorised";
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Control Center™</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            Central governance layer — Control Health™ across your organisation
          </p>
        </div>
        <Link href="/controls/new">
          <Button><Plus className="h-4 w-4" /> New Control</Button>
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ControlStat label="Total Controls" value={metrics.total} accent="neutral" href="/controls/library" />
        <ControlStat label="Healthy (≥80)" value={metrics.healthy} accent="good" />
        <ControlStat label="Weak (<60)" value={metrics.weak} accent={metrics.weak > 0 ? "danger" : "neutral"} />
        <ControlStat label="Overdue Tests" value={metrics.overdueTests} accent={metrics.overdueTests > 0 ? "warn" : "neutral"} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ControlStat label="Avg Health Score" value={`${metrics.avgHealth}/100`} accent={metrics.avgHealth >= 80 ? "good" : metrics.avgHealth >= 60 ? "warn" : "danger"} />
        <ControlStat label="Implemented" value={metrics.implemented} accent="good" />
        <ControlStat label="Coverage" value={`${metrics.coverage}%`} accent={metrics.coverage >= 80 ? "good" : metrics.coverage >= 50 ? "warn" : "danger"} />
        <ControlStat label="Avg Effectiveness" value={`${metrics.avgEffectiveness}/100`} accent="neutral" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Weak Controls */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            Weakest Controls
          </h2>
          {topWeak.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">
              {controls.length === 0
                ? "No controls yet — add controls to track health."
                : "All controls have good health scores."}
            </p>
          ) : (
            <div className="space-y-3">
              {topWeak.map((c) => (
                <Link
                  key={c.id}
                  href={`/controls/${c.id}`}
                  className="flex items-center justify-between rounded-xl border border-[var(--color-line)] px-4 py-3 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-[var(--color-blue)] text-xs">{c.controlRef}</p>
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <ControlStatusBadge status={c.status} />
                    </div>
                  </div>
                  <ControlHealthBadge score={c.healthScore} />
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Category Breakdown */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-400" />
            Controls by Category
          </h2>
          {Object.keys(byCategory).length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No controls yet.</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, n]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-sm text-[var(--color-ink-dim)] w-36 truncate capitalize">{cat.replace(/_/g, " ")}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[var(--color-blue)] transition-all"
                        style={{ width: `${Math.round((n / metrics.total) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-6 text-right">{n}</span>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>

      {controls.length === 0 && (
        <Card>
          <EmptyState
            icon={Shield}
            title="No controls yet"
            description="Add controls to start tracking Control Health™ across your organisation."
            action={<Link href="/controls/new"><Button><Plus className="h-4 w-4" /> New Control</Button></Link>}
          />
        </Card>
      )}
    </div>
  );
}
