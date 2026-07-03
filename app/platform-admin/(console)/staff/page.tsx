export const dynamic = "force-dynamic";

import { requirePlatformUser, isOwner } from "@/lib/platform-admin/auth";
import { getPlatformUsersAction } from "@/lib/platform-admin/actions";
import { Users, ShieldCheck, Eye, Wrench } from "lucide-react";

const ROLE_BADGE: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  platform_owner:   { label: "Platform Owner",   className: "bg-purple-900/40 text-purple-400", icon: ShieldCheck },
  platform_admin:   { label: "Platform Admin",   className: "bg-blue-900/40 text-blue-400",     icon: Wrench },
  platform_support: { label: "Platform Support", className: "bg-slate-800 text-slate-400",       icon: Eye },
};

function fmtDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function PlatformStaffPage() {
  const session = await requirePlatformUser();
  const { data: users } = await getPlatformUsersAction();
  const canCreate = isOwner(session);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Platform Users</h1>
          <p className="mt-0.5 text-sm text-white/40">Internal AUDT staff with platform console access.</p>
        </div>
        {canCreate && (
          <a
            href="/platform-admin/staff/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#007A94] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            <Users className="h-4 w-4" /> Add Staff
          </a>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#30363d]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#30363d] bg-white/[0.02] text-[11px] text-white/30">
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">Name</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">Role</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">MFA</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">Status</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">Last Login</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d]">
            {(users ?? []).map((u) => {
              const roleMeta = ROLE_BADGE[u.role as string];
              const RoleIcon = roleMeta?.icon ?? Eye;
              return (
                <tr key={u.id as string} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{u.name as string}</div>
                    <div className="text-[11px] text-white/35">{u.email as string}</div>
                  </td>
                  <td className="px-4 py-3">
                    {roleMeta && (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${roleMeta.className}`}>
                        <RoleIcon className="h-3 w-3" />
                        {roleMeta.label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${u.totp_enabled ? "bg-emerald-900/40 text-emerald-400" : "bg-amber-900/40 text-amber-400"}`}>
                      {u.totp_enabled ? "Enabled" : "Not set"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${u.is_active ? "bg-emerald-900/40 text-emerald-400" : "bg-red-900/40 text-red-400"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-white/35">
                    {fmtDate(u.last_login_at as string | null)}
                  </td>
                </tr>
              );
            })}
            {(users ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-white/30">
                  No platform users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
