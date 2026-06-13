export const dynamic = "force-dynamic";

import Link from "next/link";
import { ClipboardCheck, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getDashboardMetrics, listAudits } from "@/lib/services/audit/audit-service";
import { AuditStatusBadge, AuditTypeBadge } from "@/components/audit/audit-status-badge";
import { AuditStat, formatDate } from "@/components/audit/audit-ui";

export default async function AuditsDashboardPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardCheck}
          title="Audit Management"
          description="Connect Supabase to start planning and executing audits."
        />
      </Card>
    );
  }

  const [metrics, audits] = await Promise.all([
    getDashboardMetrics(session.org.id),
    listAudits(session.org.id),
  ]);

  const recentAudits = audits.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Audit Management™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            {metrics.total} audit{metrics.total !== 1 ? "s" : ""} ·{" "}
            {metrics.openFindings} open finding{metrics.openFindings !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/audits/new">
          <Button variant="primary" size="md">
            <Plus className="h-4 w-4" /> New Audit
          </Button>
        </Link>
      </div>

      {/* Metrics strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AuditStat
          label="Total Audits"
          value={metrics.total}
          href="/audits/list"
        />
        <AuditStat
          label="Overdue"
          value={metrics.overdue}
          accent={metrics.overdue > 0 ? "danger" : undefined}
          href="/audits/list?status=in_progress"
        />
        <AuditStat
          label="Open Findings"
          value={metrics.openFindings}
          accent={metrics.criticalFindings > 0 ? "danger" : metrics.openFindings > 0 ? "warn" : "good"}
          href="/audits/findings"
        />
        <AuditStat
          label="CAPAs Due Soon"
          value={metrics.capasDueSoon}
          accent={metrics.capasDueSoon > 0 ? "warn" : undefined}
          href="/audits/capas"
        />
      </div>

      {/* Status strip */}
      <div className="grid gap-3 sm:grid-cols-4">
        <AuditStat label="Planned" value={metrics.planned} href="/audits/list?status=planned" />
        <AuditStat label="In Progress" value={metrics.inProgress} accent="warn" href="/audits/list?status=in_progress" />
        <AuditStat label="Completed" value={metrics.completed} accent="good" href="/audits/list?status=completed" />
        <AuditStat label="Cancelled" value={metrics.cancelled} href="/audits/list?status=cancelled" />
      </div>

      {/* Recent audits */}
      {audits.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardCheck}
            title="No audits yet"
            description="Create your first audit — internal, external, vendor, or regulatory."
            action={
              <Link href="/audits/new">
                <Button variant="primary" size="sm">
                  <Plus className="h-4 w-4" /> New Audit
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-line)]">
            <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">
              Recent Audits
            </h2>
            <Link href="/audits/list" className="text-xs text-[var(--color-blue)] hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-line)]">
            {recentAudits.map((a) => (
              <Link
                key={a.id}
                href={`/audits/${a.id}`}
                className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <AuditTypeBadge type={a.auditType} />
                    {a.endDate && (
                      <span className="text-xs text-[var(--color-ink-faint)]">
                        Due {formatDate(a.endDate)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {a.openFindings > 0 && (
                    <span className="text-xs text-amber-400">
                      {a.openFindings} finding{a.openFindings !== 1 ? "s" : ""}
                    </span>
                  )}
                  <AuditStatusBadge status={a.status} />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
