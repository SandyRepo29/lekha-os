export const dynamic = "force-dynamic";

import { requirePlatformUser } from "@/lib/platform-admin/auth";
import { getNotificationsAction, sendNotificationAction } from "@/lib/platform-admin/actions";
import { Bell } from "lucide-react";

const SEVERITY_STYLE: Record<string, string> = {
  info:    "bg-[#00B8D9]/20 text-[#00B8D9]",
  warning: "bg-amber-500/20 text-amber-300",
  critical:"bg-red-500/20 text-red-300",
  success: "bg-emerald-500/20 text-emerald-300",
};

export default async function NotificationsPage() {
  await requirePlatformUser();
  const { data: notifications } = await getNotificationsAction();
  const list = notifications ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Notifications</h1>
        <p className="mt-0.5 text-sm text-white/40">Send platform-wide announcements or targeted org messages.</p>
      </div>

      {/* Send Form */}
      <form action={sendNotificationAction as unknown as (formData: FormData) => void} className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Send Notification</h2>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Title</label>
          <input
            name="title"
            required
            placeholder="Notification title..."
            className="w-full rounded-lg border border-[#30363d] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#00B8D9]/50"
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Body</label>
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Message body..."
            className="w-full rounded-lg border border-[#30363d] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#00B8D9]/50 resize-none"
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Severity</label>
          <select
            name="severity"
            className="rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00B8D9]/50"
          >
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-[#00B8D9]/10 border border-[#00B8D9]/30 px-5 py-2.5 text-sm font-medium text-[#00B8D9] hover:bg-[#00B8D9]/20 transition-colors"
        >
          Send Notification
        </button>
      </form>

      {/* History */}
      <div className="rounded-xl border border-[#30363d] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#30363d] px-5 py-3 bg-white/[0.02]">
          <Bell className="h-4 w-4 text-white/40" />
          <h2 className="text-sm font-semibold text-white">Sent Notifications ({list.length})</h2>
        </div>
        {list.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-white/30">No notifications sent yet.</div>
        ) : (
          <div className="divide-y divide-[#30363d]">
            {list.map((n) => (
              <div key={n.id as string} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${SEVERITY_STYLE[n.severity as string] ?? "bg-white/5 text-white/40"}`}>
                        {n.severity as string}
                      </span>
                      <span className="text-sm font-medium text-white">{n.title as string}</span>
                    </div>
                    <div className="mt-1 text-xs text-white/40">{n.body as string}</div>
                    <div className="mt-1.5 text-[11px] text-white/20">
                      Sent by {(n.sent_by_name as string) ?? "unknown"} &middot; {new Date(n.sent_at as string).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
