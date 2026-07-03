export const dynamic = "force-dynamic";

import { requirePlatformUser } from "@/lib/platform-admin/auth";
import { getPlatformAuditLogsAction } from "@/lib/platform-admin/actions";
import { ClipboardList } from "lucide-react";

const ACTION_COLOR: Record<string, string> = {
  login:             "text-emerald-400",
  logout:            "text-slate-400",
  impersonate_start: "text-amber-400",
  impersonate_end:   "text-amber-300",
  flag_update:       "text-blue-400",
  org_view:          "text-slate-400",
  org_edit:          "text-orange-400",
  org_suspend:       "text-red-400",
  user_create:       "text-emerald-400",
  system_config_update: "text-purple-400",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export default async function PlatformAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requirePlatformUser();
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1", 10);

  const result = await getPlatformAuditLogsAction(page);
  const d = result.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Platform Audit Logs</h1>
        <p className="mt-0.5 text-sm text-white/40">
          Every administrative action is recorded. {d?.total ?? 0} total entries.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#30363d]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#30363d] bg-white/[0.02] text-[11px] text-white/30">
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">When</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">User</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">Action</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">Target</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d]">
            {(d?.logs ?? []).map((log, i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-[11px] text-white/30 whitespace-nowrap">
                  {fmtDate(log.created_at as string)}
                </td>
                <td className="px-4 py-3 text-[12px] text-white/60">{log.platform_user_email as string}</td>
                <td className="px-4 py-3">
                  <span className={`font-mono text-[12px] font-medium ${ACTION_COLOR[log.action as string] ?? "text-white/50"}`}>
                    {log.action as string}
                  </span>
                </td>
                <td className="px-4 py-3 text-[12px] text-white/40">
                  {log.target_label ? (
                    <span>
                      <span className="text-white/25">{log.target_type as string}:</span>{" "}
                      {log.target_label as string}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-[11px] font-mono text-white/25">
                  {(log.ip_address as string) ?? "—"}
                </td>
              </tr>
            ))}
            {(d?.logs ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-white/30">
                  No audit log entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {d && Math.ceil(d.total / 30) > 1 && (
        <div className="flex items-center justify-between text-sm text-white/40">
          <span>Page {page} of {Math.ceil(d.total / 30)}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`?page=${page - 1}`} className="rounded-lg border border-[#30363d] px-3 py-1.5 hover:bg-white/[0.04] text-white/60">
                Previous
              </a>
            )}
            {page < Math.ceil(d.total / 30) && (
              <a href={`?page=${page + 1}`} className="rounded-lg border border-[#30363d] px-3 py-1.5 hover:bg-white/[0.04] text-white/60">
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
