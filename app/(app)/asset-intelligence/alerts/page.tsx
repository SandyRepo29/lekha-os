﻿export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getAlerts } from "@/lib/services/asset-intelligence/asset-service";
import { AssetSubNav, AlertSeverityBadge } from "@/components/asset-intelligence/asset-ui";
import { ResolveAlertButton } from "@/components/asset-intelligence/alert-actions";

export default async function AlertsPage() {
  const session  = await requireUser();
  const orgId = session.org?.id ?? "";
  const open     = await getAlerts(orgId, { status: "open" }).catch(() => []);
  const resolved = await getAlerts(orgId, { status: "resolved" }).catch(() => []);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Asset Alertsâ„¢</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">Governance alerts for assets requiring attention.</p>
      </div>

      <AssetSubNav />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] border-l-2 border-l-red-400 p-4">
          <p className="text-xs text-[var(--color-ink-dim)]">Open Alerts</p>
          <p className="text-2xl font-bold text-red-400">{open.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] border-l-2 border-l-orange-400 p-4">
          <p className="text-xs text-[var(--color-ink-dim)]">Critical / High</p>
          <p className="text-2xl font-bold text-orange-400">{(open as any[]).filter((a: any) => ["critical","high"].includes(a.severity)).length}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] border-l-2 border-l-emerald-400 p-4">
          <p className="text-xs text-[var(--color-ink-dim)]">Resolved</p>
          <p className="text-2xl font-bold text-emerald-400">{resolved.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] border-l-2 border-l-slate-400 p-4">
          <p className="text-xs text-[var(--color-ink-dim)]">Total</p>
          <p className="text-2xl font-bold text-slate-400">{open.length + resolved.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
        <h2 className="font-semibold text-sm mb-4">Open Alerts</h2>
        {open.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-dim)] text-center py-8">No open alerts â€” all assets are in good governance health.</p>
        ) : (
          <div className="space-y-2">
            {(open as any[]).map((al: any) => (
              <div key={al.id} className="flex items-start gap-3 rounded-xl border border-[var(--color-line)] p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{al.title}</p>
                  {al.description && <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">{al.description}</p>}
                  <p className="text-xs text-[var(--color-ink-dim)] mt-1 capitalize">{al.alertType?.replace(/_/g," ")}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <AlertSeverityBadge severity={al.severity} />
                  <ResolveAlertButton id={al.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {resolved.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
          <h2 className="font-semibold text-sm mb-4 text-[var(--color-ink-dim)]">Recently Resolved</h2>
          <div className="space-y-2">
            {(resolved as any[]).slice(0, 10).map((al: any) => (
              <div key={al.id} className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] p-3 opacity-60">
                <div className="flex-1 text-sm line-through text-[var(--color-ink-dim)]">{al.title}</div>
                <AlertSeverityBadge severity={al.severity} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

