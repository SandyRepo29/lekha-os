export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getChanges, getAlerts } from "@/lib/services/regulatory-intelligence/regulatory-service";
import {
  RegSubNav, RegStat, SeverityBadge, ChangeStatusBadge, AlertIcon,
} from "@/components/regulatory-intelligence/reg-ui";
import { RefreshCw, Plus, Bell } from "lucide-react";
import { UpdateChangeStatusButton } from "@/components/regulatory-intelligence/change-actions";

export default async function RegChangesPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const [changes, alerts] = await Promise.all([
    getChanges(orgId).catch(() => []),
    getAlerts(orgId, { status: "open" }).catch(() => []),
  ]);

  const byStatus = {
    new: changes.filter(c => c.status === "new").length,
    under_review: changes.filter(c => c.status === "under_review").length,
    assessed: changes.filter(c => c.status === "assessed").length,
    actioned: changes.filter(c => c.status === "actioned").length,
  };

  const bySeverity = {
    critical: changes.filter(c => c.severity === "critical").length,
    high: changes.filter(c => c.severity === "high").length,
  };

  return (
    <div className="space-y-6 p-6">
      <RegSubNav />

      <div className="flex items-start justify-between gap-4 pt-2">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Regulatory Change Monitor™</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Track regulatory amendments, new guidance, and enforcement actions — assess impact and assign remediation tasks.</p>
        </div>
        <Link
          href="/regulatory-intelligence/changes/new"
          className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Log Change
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RegStat label="Total Changes"  value={changes.length}       accent="neutral" />
        <RegStat label="New"            value={byStatus.new}         accent={byStatus.new > 0 ? "warn" : "neutral"} />
        <RegStat label="Critical"       value={bySeverity.critical}  accent={bySeverity.critical > 0 ? "danger" : "neutral"} />
        <RegStat label="Open Alerts"    value={alerts.length}        accent={alerts.length > 0 ? "danger" : "good"} />
      </div>

      {/* Open Alerts strip */}
      {alerts.length > 0 && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-red-400" />
            <h3 className="font-semibold text-sm text-red-300">Open Regulatory Alerts</h3>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 3).map(a => (
              <div key={a.id} className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-white px-3 py-2.5">
                <AlertIcon severity={a.severity} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium">{a.title}</div>
                  {a.description && <div className="mt-0.5 text-[11px] text-[var(--color-ink-faint)] truncate">{a.description}</div>}
                </div>
                <SeverityBadge severity={a.severity} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Changes Table */}
      {changes.length > 0 ? (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-[var(--color-ink-faint)]">
                  <th className="px-4 py-3 text-left font-medium">Change</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Severity</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Effective</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]/40">
                {changes.map(c => (
                  <tr key={c.id} className="hover:bg-white transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold max-w-[240px]">{c.title}</div>
                      {c.description && (
                        <div className="mt-0.5 text-[var(--color-ink-faint)] max-w-[240px] truncate">{c.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize text-[var(--color-ink-dim)]">{c.changeType?.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3"><SeverityBadge severity={c.severity} /></td>
                    <td className="px-4 py-3"><ChangeStatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-[var(--color-ink-faint)]">
                      {c.effectiveDate ? new Date(c.effectiveDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <UpdateChangeStatusButton changeId={c.id} currentStatus={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-bg-2)]/40 py-16">
          <RefreshCw className="h-10 w-10 text-[var(--color-blue)] opacity-40" />
          <div className="text-center">
            <p className="font-semibold text-sm">No regulatory changes logged</p>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)]">Track regulatory amendments, new guidance, and enforcement actions.</p>
          </div>
          <Link href="/regulatory-intelligence/changes/new" className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> Log First Change
          </Link>
        </div>
      )}
    </div>
  );
}
