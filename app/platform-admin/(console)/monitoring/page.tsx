export const dynamic = "force-dynamic";

import { requirePlatformUser } from "@/lib/platform-admin/auth";
import { getPlatformAuditLogsAction } from "@/lib/platform-admin/actions";
import { Activity, LogIn, Flag, ShieldAlert, UserCog } from "lucide-react";

const ACTION_COLORS: Record<string, string> = {
  login:        "text-emerald-400",
  logout:       "text-white/40",
  flag_update:  "text-blue-400",
  user_create:  "text-violet-400",
  org_suspend:  "text-red-400",
  impersonate_start: "text-amber-400",
};

export default async function MonitoringPage() {
  await requirePlatformUser();
  const { data } = await getPlatformAuditLogsAction(1);
  const logs = data?.logs ?? [];

  const loginCount = logs.filter((l) => (l.action as string) === "login").length;
  const flagUpdates = logs.filter((l) => (l.action as string) === "flag_update").length;
  const suspensions = logs.filter((l) => (l.action as string) === "org_suspend").length;
  const impersonations = logs.filter((l) => (l.action as string).includes("impersonate")).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Monitoring</h1>
        <p className="mt-0.5 text-sm text-white/40">Platform-level activity rates based on recent audit events.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Admin Logins",   value: loginCount,       icon: LogIn,      color: "text-emerald-400" },
          { label: "Flag Changes",   value: flagUpdates,      icon: Flag,       color: "text-blue-400" },
          { label: "Org Actions",    value: suspensions,      icon: ShieldAlert,color: "text-red-400" },
          { label: "Impersonations", value: impersonations,   icon: UserCog,    color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5">
            <s.icon className={`h-4 w-4 ${s.color} mb-3`} />
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="mt-0.5 text-xs text-white/40">{s.label} (last 25 logs)</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#30363d] bg-white/[0.02] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#30363d] px-5 py-3">
          <Activity className="h-4 w-4 text-white/40" />
          <h2 className="text-sm font-semibold text-white">Recent Platform Events</h2>
        </div>
        {logs.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-white/30">No events recorded yet.</div>
        ) : (
          <div className="divide-y divide-[#30363d]">
            {logs.map((log) => (
              <div key={log.id as string} className="flex items-center gap-4 px-5 py-3">
                <div className={`text-xs font-mono font-medium uppercase ${ACTION_COLORS[log.action as string] ?? "text-white/50"}`}>
                  {log.action as string}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white/70 truncate">{(log.platform_user_email as string) ?? "—"}</div>
                  {!!(log.target_label) && (
                    <div className="text-xs text-white/30 truncate">{log.target_label as string}</div>
                  )}
                </div>
                <div className="text-xs text-white/25 shrink-0">
                  {new Date(log.created_at as string).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
