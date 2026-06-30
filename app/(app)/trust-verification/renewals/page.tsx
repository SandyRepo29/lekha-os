export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getRenewals } from "@/lib/services/trust-verification/trust-verification-service";
import { startRenewalAction } from "@/lib/trust-verification/actions";
import { RefreshCw, Clock, CheckCircle, AlertTriangle } from "lucide-react";

function RenewalStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    upcoming:    "bg-[var(--color-blue)]/10 text-[var(--color-blue)]",
    due_soon:    "bg-amber-500/10 text-amber-400",
    in_progress: "bg-violet-500/10 text-violet-400",
    renewed:     "bg-emerald-500/10 text-emerald-400",
    expired:     "bg-white/5 text-[var(--color-ink-faint)]",
    cancelled:   "bg-red-500/10 text-red-400",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${map[status] ?? "bg-white/5 text-[var(--color-ink-faint)]"}`}>{status.replace(/_/g," ")}</span>;
}

function isDueSoon(dateStr: string) {
  const due = new Date(dateStr);
  return due.getTime() - Date.now() < 30 * 24 * 3600 * 1000;
}

export default async function RenewalsPage() {
  const session = await requireUser();
  const renewals = await getRenewals(session.org?.id ?? "").catch(() => []);
  const dueSoon = renewals.filter((r: any) => r.status === "upcoming" && isDueSoon(r.renewalDueDate));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Renewal Management™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Track and manage certification renewals to maintain uninterrupted verified status.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Renewals",  value: renewals.length,                                             icon: RefreshCw,    color: "text-[var(--color-blue)]" },
          { label: "Due Soon",        value: dueSoon.length,                                              icon: AlertTriangle, color: "text-amber-400" },
          { label: "Completed",       value: renewals.filter((r: any) => r.status === "renewed").length,  icon: CheckCircle,  color: "text-emerald-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
            <Icon className={`mb-3 h-5 w-5 ${color}`} />
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-[var(--color-ink-dim)]">{label}</div>
          </div>
        ))}
      </div>

      {/* Due soon alert */}
      {dueSoon.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <span className="text-sm font-semibold text-amber-400">{dueSoon.length} renewal{dueSoon.length > 1 ? "s" : ""} due within 30 days.</span>
            <span className="ml-2 text-xs text-[var(--color-ink-dim)]">Start the renewal process to avoid certification lapse.</span>
          </div>
        </div>
      )}

      {/* Renewals list */}
      {renewals.length > 0 ? (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-dim)] font-medium uppercase tracking-wider">
                <th className="px-4 py-3">Renewal Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]/50">
              {renewals.map((r: any) => {
                const soon = isDueSoon(r.renewalDueDate);
                return (
                  <tr key={r.id} className="hover:bg-white">
                    <td className="px-4 py-3">
                      <div className={`font-medium ${soon && r.status === "upcoming" ? "text-amber-400" : ""}`}>
                        {r.renewalDueDate}
                      </div>
                      {soon && r.status === "upcoming" && (
                        <div className="text-[11px] text-amber-400">Due soon</div>
                      )}
                    </td>
                    <td className="px-4 py-3"><RenewalStatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">
                      {r.startedAt ? new Date(r.startedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">
                      {r.completedAt ? new Date(r.completedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "upcoming" && (
                        <form action={async (_fd: FormData) => { "use server"; await startRenewalAction(r.id); }}>
                          <button type="submit" className="flex items-center gap-1.5 rounded-lg border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-blue)] hover:bg-[var(--color-blue)]/20">
                            <RefreshCw className="h-3 w-3" /> Start Renewal
                          </button>
                        </form>
                      )}
                      {r.status === "in_progress" && (
                        <span className="flex items-center gap-1 text-xs text-violet-400">
                          <Clock className="h-3 w-3" /> In Progress
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] p-12 text-center">
          <RefreshCw className="mx-auto mb-4 h-10 w-10 text-[var(--color-ink-faint)]" />
          <div className="text-sm font-medium mb-1">No renewals scheduled</div>
          <p className="text-xs text-[var(--color-ink-dim)]">Renewal schedules are created automatically when a certificate is issued.</p>
        </div>
      )}
    </div>
  );
}
