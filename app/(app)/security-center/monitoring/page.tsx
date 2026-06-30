export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getMonitoringOverview } from "@/lib/services/security-command-center/security-service";
import { SecSubNav, SecStat, SeverityBadge, StatusBadge } from "@/components/security-command-center/sec-ui";
import { AcknowledgeAlertButton, ResolveMonAlertButton } from "@/components/security-command-center/sec-actions";
import { addMonitoringAssetAction } from "@/lib/security-command-center/actions";
import { Globe, Clock, AlertTriangle } from "lucide-react";

export default async function MonitoringPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const data = await getMonitoringOverview(orgId).catch(() => null);
  const assets = (data?.assets ?? []) as Record<string, unknown>[];
  const alerts = (data?.alerts ?? []) as Record<string, unknown>[];

  const openAlerts = alerts.filter(a => a.status === "open").length;
  const criticalAlerts = alerts.filter(a => a.severity === "critical" && a.status === "open").length;

  const CHECK_TYPES = [
    { key: "domain_expiry",  label: "Domain Expiry" },
    { key: "ssl_expiry",     label: "SSL Expiry" },
    { key: "ssl_weak",       label: "Weak SSL Config" },
    { key: "breach",         label: "Data Breach" },
    { key: "dns_change",     label: "DNS Changes" },
    { key: "cert_expiry",    label: "Certificate Expiry" },
    { key: "reputation",     label: "Reputation / Incidents" },
  ];

  return (
    <div className="space-y-6 p-6">
      <SecSubNav />
      <div className="pt-2">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Monitoring™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Continuous vendor security monitoring — domain expiry, SSL, reputation, and breach detection.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SecStat label="Monitored Assets"  value={assets.length}   accent="neutral" />
        <SecStat label="Open Alerts"       value={openAlerts}      accent={openAlerts > 0 ? "danger" : "good"} />
        <SecStat label="Critical Alerts"   value={criticalAlerts}  accent={criticalAlerts > 0 ? "danger" : "good"} />
        <SecStat label="Total Alerts"      value={alerts.length}   accent="neutral" />
      </div>

      {/* Monitor Types */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {CHECK_TYPES.map(ct => (
          <div key={ct.key} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2.5 text-center">
            <Globe className="mx-auto h-4 w-4 text-[var(--color-blue)] mb-1" />
            <div className="text-[11px] font-medium">{ct.label}</div>
          </div>
        ))}
      </div>

      {/* Add Asset */}
      <div className="space-y-3">
        <h2 className="font-semibold">Add Monitoring Asset</h2>
        <form action={addMonitoringAssetAction.bind(null, undefined) as unknown as (fd: FormData) => void} className="flex flex-wrap gap-2 rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <input name="assetValue" placeholder="example.com or IP" required
            className="flex-1 min-w-[180px] rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50" />
          <select name="assetType"
            className="rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm outline-none">
            <option value="domain">Domain</option>
            <option value="ssl">SSL Certificate</option>
            <option value="reputation">Reputation</option>
          </select>
          <select name="checkInterval"
            className="rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm outline-none">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="hourly">Hourly</option>
          </select>
          <button type="submit" className="rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow">
            Add Asset
          </button>
        </form>
      </div>

      {/* Assets List */}
      {assets.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-sm">Monitored Assets</h2>
          <div className="rounded-2xl border border-[var(--color-line)] divide-y divide-[var(--color-line)] overflow-hidden">
            {assets.map(a => (
              <div key={String(a.id)} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-4">
                  <Globe className="h-4 w-4 text-[var(--color-ink-dim)] shrink-0" />
                  <div>
                    <div className="font-mono text-sm">{String(a.asset_value)}</div>
                    <div className="text-xs text-[var(--color-ink-dim)] capitalize">{String(a.asset_type)} · {String(a.check_interval)} checks {a.vendor_name ? `· ${a.vendor_name}` : ""}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!!a.last_checked && (
                    <span className="flex items-center gap-1 text-xs text-[var(--color-ink-dim)]">
                      <Clock className="h-3 w-3" /> {new Date(String(a.last_checked)).toLocaleDateString()}
                    </span>
                  )}
                  <StatusBadge status={a.enabled ? "active" : "disabled"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] p-12 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-[var(--color-ink-muted)]" />
          <p className="mt-3 text-sm text-[var(--color-ink-dim)]">No monitoring alerts.</p>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">Add assets to start monitoring your vendors&apos; security posture.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-400" /> Monitoring Alerts</h2>
          <div className="rounded-2xl border border-[var(--color-line)] divide-y divide-[var(--color-line)] overflow-hidden">
            {alerts.map(a => (
              <div key={String(a.id)} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{String(a.title)}</div>
                  {!!a.description && <div className="text-xs text-[var(--color-ink-dim)] mt-0.5 truncate">{String(a.description)}</div>}
                  <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">{String(a.vendor_name ?? "—")} · {new Date(String(a.created_at)).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <SeverityBadge severity={String(a.severity)} />
                  <StatusBadge status={String(a.status)} />
                  {a.status === "open" && <AcknowledgeAlertButton id={String(a.id)} />}
                  {a.status !== "resolved" && <ResolveMonAlertButton id={String(a.id)} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


