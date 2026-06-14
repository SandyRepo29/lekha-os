export const dynamic = "force-dynamic";

import { Bell, CheckCircle, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { EmptyState } from "@/components/ui/empty-state";
import { findAlerts, countAlerts } from "@/lib/repositories/governance-alerts-repo";
import { GovernanceAlertBadge, AlertTypeLabel } from "@/components/trust-intelligence/governance-alert-badge";
import { TrustStat } from "@/components/trust-intelligence/trust-intelligence-ui";
import { MonitoringActions } from "@/components/trust-intelligence/monitoring-actions";

export default async function MonitoringPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState
          icon={Bell}
          title="Continuous Monitoring™"
          description="Connect Supabase to unlock governance monitoring."
        />
      </Card>
    );
  }

  const [openAlerts, counts] = await Promise.all([
    findAlerts(session.org.id, { status: "open" }),
    countAlerts(session.org.id),
  ]);

  const recentResolved = await findAlerts(session.org.id, { status: "resolved", limit: 10 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-[var(--color-blue)]" />
            Continuous Monitoring™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            Automated governance change detection and alerting
          </p>
        </div>
        <MonitoringActions />
      </div>

      {/* Metrics strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TrustStat label="Open Alerts" value={counts.open} accent={counts.open > 0 ? "warn" : "neutral"} />
        <TrustStat label="Critical" value={counts.critical} accent={counts.critical > 0 ? "danger" : "neutral"} />
        <TrustStat label="High" value={counts.high} accent={counts.high > 0 ? "warn" : "neutral"} />
        <TrustStat label="Resolved" value={counts.resolved} accent="good" />
      </div>

      {/* Open alerts */}
      <Card className="p-5">
        <p className="text-sm font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          Open Alerts ({openAlerts.length})
        </p>
        {openAlerts.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-[var(--color-ink-dim)]">No open alerts. Governance is clean.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {openAlerts.map((alert) => (
              <div key={alert.id} className="py-3 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <GovernanceAlertBadge severity={alert.severity as any} />
                    {alert.type && <AlertTypeLabel type={alert.type} />}
                  </div>
                  <p className="text-sm font-medium text-[var(--color-ink)] truncate">{alert.title}</p>
                  {alert.description && (
                    <p className="text-xs text-[var(--color-ink-faint)] mt-0.5 line-clamp-2">{alert.description}</p>
                  )}
                  <p className="text-xs text-[var(--color-ink-faint)] mt-1">
                    {new Date(alert.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <MonitoringActions alertId={alert.id} variant="resolve" />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recently resolved */}
      {recentResolved.length > 0 && (
        <Card className="p-5">
          <p className="text-sm font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            Recently Resolved
          </p>
          <div className="divide-y divide-[var(--color-line)]">
            {recentResolved.map((alert) => (
              <div key={alert.id} className="py-3 flex items-start gap-3 opacity-60">
                <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-[var(--color-ink)]">{alert.title}</p>
                  <p className="text-xs text-[var(--color-ink-faint)]">
                    Resolved {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
