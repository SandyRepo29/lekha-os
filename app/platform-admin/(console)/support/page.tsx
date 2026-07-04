export const dynamic = "force-dynamic";

import { requirePlatformUser } from "@/lib/platform-admin/auth";
import { getSupportTicketsAction, getPlatformUsersAction, createTicketAction } from "@/lib/platform-admin/actions";
import { HeadphonesIcon } from "lucide-react";
import { TicketStatusSelect, AssignSelect } from "@/components/platform-admin/ticket-actions";

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
  const [{ data: tickets }, { data: staffUsers }] = await Promise.all([
    getSupportTicketsAction(),
    getPlatformUsersAction(),
  ]);
  const list = (tickets ?? []) as Array<Record<string, unknown>>;
  const staff = (staffUsers ?? []).map((u) => ({ id: u.id as string, name: u.name as string }));

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

      {/* Create ticket form */}
      <form action={createTicketAction as unknown as (fd: FormData) => void} className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white">Create Support Ticket</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            name="title"
            required
            placeholder="Ticket title..."
            className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-[#00B8D9]/50 sm:col-span-2"
          />
          <select
            name="priority"
            className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <textarea
          name="description"
          placeholder="Description (optional)..."
          rows={2}
          className="w-full rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-[#00B8D9]/50"
        />
        <button
          type="submit"
          className="rounded-lg bg-[#007A94] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Create Ticket
        </button>
      </form>

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
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Assign To</th>
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
                    <TicketStatusSelect ticketId={t.id as string} status={t.status as string} />
                  </td>
                  <td className="px-5 py-3">
                    <AssignSelect
                      ticketId={t.id as string}
                      currentAssigneeId={(t.assigned_to as string) ?? null}
                      staff={staff}
                    />
                  </td>
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
