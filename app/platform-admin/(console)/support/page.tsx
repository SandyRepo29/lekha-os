export const dynamic = "force-dynamic";

import { requirePlatformUser } from "@/lib/platform-admin/auth";
import { getSupportTicketsAction } from "@/lib/platform-admin/actions";
import { HeadphonesIcon } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  open:        "bg-emerald-500/20 text-emerald-300",
  in_progress: "bg-blue-500/20 text-blue-300",
  resolved:    "bg-white/10 text-white/40",
  closed:      "bg-white/5 text-white/25",
};

const PRIORITY_STYLE: Record<string, string> = {
  critical: "bg-red-500/20 text-red-300",
  high:     "bg-orange-500/20 text-orange-300",
  medium:   "bg-amber-500/20 text-amber-300",
  low:      "bg-blue-500/20 text-blue-300",
};

export default async function SupportPage() {
  await requirePlatformUser();
  const { data: tickets } = await getSupportTicketsAction();
  const list = (tickets ?? []) as Array<Record<string, unknown>>;

  const open = list.filter((t) => t.status === "open").length;
  const inProg = list.filter((t) => t.status === "in_progress").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Support Console</h1>
        <p className="mt-0.5 text-sm text-white/40">Platform support tickets and org notes.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open",        value: open,          color: "text-emerald-400" },
          { label: "In Progress", value: inProg,        color: "text-blue-400" },
          { label: "Total",       value: list.length,   color: "text-white" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="mt-0.5 text-xs text-white/40">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#30363d] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#30363d] px-5 py-3 bg-white/[0.02]">
          <HeadphonesIcon className="h-4 w-4 text-white/40" />
          <h2 className="text-sm font-semibold text-white">All Tickets</h2>
        </div>
        {list.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <HeadphonesIcon className="h-8 w-8 text-white/20 mx-auto mb-3" />
            <div className="text-sm text-white/30">No support tickets yet.</div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#30363d] bg-white/[0.01]">
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Ticket</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Organization</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Priority</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Assigned To</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {list.map((t) => (
                <tr key={t.id as string} className="hover:bg-white/[0.015] transition-colors">
                  <td className="px-5 py-3 text-sm text-white max-w-xs truncate">{t.title as string}</td>
                  <td className="px-5 py-3 text-sm text-white/60">{(t.org_name as string) || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_STYLE[t.priority as string] ?? "bg-white/5 text-white/40"}`}>
                      {t.priority as string}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[t.status as string] ?? "bg-white/5 text-white/40"}`}>
                      {t.status as string}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-white/50">{(t.assigned_to_name as string) || "Unassigned"}</td>
                  <td className="px-5 py-3 text-xs text-white/25">{new Date(t.created_at as string).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
