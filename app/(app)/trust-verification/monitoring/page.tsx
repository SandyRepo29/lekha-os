export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getMonitoringData } from "@/lib/services/trust-verification/trust-verification-service";
import { Activity, CheckCircle, AlertTriangle, Clock, ShieldCheck } from "lucide-react";

const EVENT_COLORS: Record<string, string> = {
  "verification.created":       "text-[var(--color-blue)]",
  "verification.review_started":"text-amber-400",
  "verification.approved":      "text-emerald-400",
  "verification.rejected":      "text-red-400",
  "verification.suspended":     "text-orange-400",
  "certificate.issued":         "text-violet-400",
  "certificate.revoked":        "text-red-400",
  "evidence.submitted":         "text-teal-400",
  "renewal.started":            "text-pink-400",
};

export default async function MonitoringPage() {
  const session = await requireUser();
  const data = await getMonitoringData(session.org?.id ?? "").catch(() => null);
  const certs = data?.certs ?? [];
  const badges = data?.badges ?? [];
  const events = data?.events ?? [];

  const expiringSoon = certs.filter((c: any) => {
    if (c.status !== "active" || !c.expiresAt) return false;
    return new Date(c.expiresAt).getTime() - Date.now() < 30 * 24 * 3600 * 1000;
  });

  const activeCerts  = certs.filter((c: any) => c.status === "active");
  const activeBadges = badges.filter((b: any) => b.status === "active");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Verification Monitoring™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Continuous monitoring of your verification status, certificates, and badge lifecycle.</p>
      </div>

      {/* Health strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Active Certs",     value: activeCerts.length,   icon: CheckCircle,    color: "text-emerald-400" },
          { label: "Active Badges",    value: activeBadges.length,  icon: ShieldCheck,    color: "text-violet-400" },
          { label: "Expiring Soon",    value: expiringSoon.length,  icon: AlertTriangle,  color: "text-amber-400" },
          { label: "Events (24h)",     value: events.length,        icon: Activity,       color: "text-[var(--color-blue)]" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
            <Icon className={`mb-3 h-5 w-5 ${color}`} />
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-[var(--color-ink-dim)]">{label}</div>
          </div>
        ))}
      </div>

      {/* Expiring Soon */}
      {expiringSoon.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5">
          <h3 className="font-semibold text-sm text-amber-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Certifications Expiring Within 30 Days
          </h3>
          <div className="space-y-2">
            {expiringSoon.map((cert: any) => (
              <div key={cert.id} className="flex items-center justify-between rounded-xl bg-amber-500/[0.08] px-3 py-2.5">
                <div className="font-mono text-xs font-medium">{cert.certificateNumber}</div>
                <div className="text-xs text-[var(--color-ink-dim)]">Expires {new Date(cert.expiresAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monitoring Rules */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h3 className="font-semibold text-sm mb-4">Active Monitoring Rules</h3>
        <div className="space-y-2">
          {[
            { rule: "certificate_expiring",         label: "Certificate Expiry Alert",          desc: "Alert 30 days before certificate expires",        active: true },
            { rule: "trust_score_drop",             label: "Trust Score Drop",                   desc: "Alert when trust score drops below threshold",     active: true },
            { rule: "critical_risk_open",           label: "Critical Risk Open",                 desc: "Alert when critical risk is open > 30 days",       active: true },
            { rule: "evidence_expired",             label: "Evidence Expired",                   desc: "Alert when required evidence expires",             active: true },
            { rule: "control_failure",              label: "Control Failure",                    desc: "Alert when a control health drops critically",     active: true },
            { rule: "privacy_incident",             label: "Privacy Incident",                   desc: "Alert on unresolved privacy incident",             active: true },
            { rule: "ai_incident_critical",         label: "AI Critical Incident",               desc: "Alert on unresolved critical AI incident",         active: true },
          ].map(r => (
            <div key={r.rule} className="flex items-center gap-4 rounded-xl border border-[var(--color-line)]/60 bg-white/[0.02] px-3 py-2.5">
              <div className={`h-2 w-2 rounded-full shrink-0 ${r.active ? "bg-emerald-400" : "bg-[var(--color-ink-faint)]"}`} />
              <div className="flex-1">
                <div className="text-sm font-medium">{r.label}</div>
                <div className="text-xs text-[var(--color-ink-faint)]">{r.desc}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.active ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-[var(--color-ink-faint)]"}`}>
                {r.active ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Event Feed */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h3 className="font-semibold text-sm mb-4">Verification Event Feed</h3>
        {events.length > 0 ? (
          <div className="space-y-2">
            {events.map((ev: any) => (
              <div key={ev.id} className="flex items-start gap-3 rounded-xl border border-[var(--color-line)]/60 bg-white/[0.02] px-3 py-2.5">
                <Activity className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${EVENT_COLORS[ev.eventType] ?? "text-[var(--color-ink-faint)]"}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium font-mono">{ev.eventType}</div>
                  {ev.details && Object.keys(ev.details).length > 0 && (
                    <div className="text-[11px] text-[var(--color-ink-faint)] mt-0.5 truncate">
                      {JSON.stringify(ev.details)}
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-[var(--color-ink-faint)] shrink-0">{new Date(ev.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-[var(--color-ink-faint)]">No events recorded yet.</p>
        )}
      </div>
    </div>
  );
}
