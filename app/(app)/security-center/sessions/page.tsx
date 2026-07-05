export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getSessionOverview } from "@/lib/services/security-command-center/security-service";
import { SecSubNav, SecStat, StatusBadge } from "@/components/security-command-center/sec-ui";
import { RevokeSessionButton, RevokeAllSessionsButton } from "@/components/security-command-center/sec-actions";
import { Monitor, Globe, Clock } from "lucide-react";

export default async function SessionsPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const sessions = (await getSessionOverview(orgId).catch(() => [])) as Record<string, unknown>[];

  const byUser = sessions.reduce<Record<string, Record<string, unknown>[]>>((acc, s) => {
    const uid = String(s.user_id);
    acc[uid] = acc[uid] ?? [];
    acc[uid].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-6">
      <SecSubNav />
      <div className="pt-2">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Sessions™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">View and revoke active user sessions across your organization.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SecStat label="Active Sessions"  value={sessions.length}     accent="neutral" />
        <SecStat label="Unique Users"     value={Object.keys(byUser).length} accent="neutral" />
        <SecStat label="MFA Verified"     value={sessions.filter(s => s.mfa_verified).length} accent="good" />
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] p-12 text-center">
          <Monitor className="mx-auto h-10 w-10 text-[var(--color-ink-muted)]" />
          <p className="mt-3 text-sm text-[var(--color-ink-dim)]">No active sessions tracked.</p>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">Sessions are recorded when users log in through AUDT.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byUser).map(([uid, userSessions]) => {
            const first = userSessions[0];
            return (
              <div key={uid} className="rounded-2xl border border-[var(--color-line)] overflow-hidden">
                <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-[var(--color-line)]">
                  <div>
                    <div className="text-sm font-semibold">{String(first.full_name ?? "Unknown")}</div>
                    <div className="text-xs text-[var(--color-ink-dim)]">{String(first.email ?? "")} · {userSessions.length} session(s)</div>
                  </div>
                  <RevokeAllSessionsButton userId={uid} />
                </div>
                <div className="divide-y divide-[var(--color-line)]">
                  {userSessions.map(s => (
                    <div key={String(s.id)} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div className="flex items-center gap-6 text-[var(--color-ink-dim)]">
                        <span className="flex items-center gap-1.5">
                          <Monitor className="h-3.5 w-3.5" />
                          {String(s.browser ?? "Unknown browser")} · {String(s.os ?? "Unknown OS")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5" />
                          {String(s.ip_address ?? s.ipAddress ?? "—")} {s.country ? `(${s.country})` : ""}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {s.last_active ? new Date(String(s.last_active)).toLocaleString() : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={String(s.status ?? "active")} />
                        {!!s.mfa_verified && <span className="text-[10px] text-emerald-400">MFA</span>}
                        <RevokeSessionButton sessionId={String(s.id)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

