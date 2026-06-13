export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getSignals } from "@/lib/services/continuous-compliance/continuous-compliance-service";
import { resolveSignalAction } from "@/lib/continuous-compliance/actions";
import { Activity, CheckCircle, ArrowLeft } from "lucide-react";
import { SeverityBadge, StatusBadge, CcStat } from "@/components/continuous-compliance/cc-ui";

export default async function SignalsPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const [open, resolved] = await Promise.all([
    getSignals(orgId, "open").catch(() => []),
    getSignals(orgId, "resolved").catch(() => []),
  ]);

  const criticalCount = open.filter(s => s.severity === "critical").length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/continuous-compliance" className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Compliance Signals™</h1>
          <p className="text-sm text-[var(--color-ink-dim)]">Auto-generated signals from integrations, checks, and module events</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <CcStat label="Open"     value={open.length}     accent={open.length > 0 ? "warn" : "good"} />
        <CcStat label="Critical" value={criticalCount}   accent={criticalCount > 0 ? "danger" : "good"} />
        <CcStat label="Resolved" value={resolved.length} accent="neutral" />
      </div>

      {/* Open signals */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h3 className="mb-4 font-semibold text-sm">Open Signals ({open.length})</h3>
        {open.length > 0 ? (
          <div className="space-y-2">
            {open.map(s => (
              <div key={s.id} className="flex items-start justify-between gap-4 rounded-xl border border-[var(--color-line)]/60 bg-white/[0.02] px-4 py-3">
                <div className="flex items-start gap-3">
                  <Activity className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <div>
                    <div className="text-sm font-medium">{s.title}</div>
                    {s.description && <p className="mt-0.5 text-xs text-[var(--color-ink-faint)]">{s.description}</p>}
                    <div className="mt-1 flex items-center gap-2">
                      <SeverityBadge severity={s.severity} />
                      {s.sourceModule && (
                        <span className="text-[11px] text-[var(--color-ink-faint)] capitalize">{s.sourceModule.replace(/_/g, " ")}</span>
                      )}
                      <span className="text-[11px] text-[var(--color-ink-faint)]">{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <form action={async () => { "use server"; await resolveSignalAction(s.id); }}>
                  <button type="submit"
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                    <CheckCircle className="h-3 w-3" /> Resolve
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-8 gap-2">
            <CheckCircle className="h-8 w-8 text-emerald-400 opacity-60" />
            <p className="text-sm text-[var(--color-ink-dim)]">No open signals. All clear!</p>
          </div>
        )}
      </div>

      {/* Resolved signals */}
      {resolved.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <h3 className="mb-4 font-semibold text-sm text-[var(--color-ink-dim)]">Recently Resolved ({resolved.length})</h3>
          <div className="space-y-2">
            {resolved.slice(0, 10).map(s => (
              <div key={s.id} className="flex items-center justify-between gap-4 rounded-xl px-4 py-2.5 opacity-60">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs">{s.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={s.severity} />
                  <StatusBadge status={s.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
