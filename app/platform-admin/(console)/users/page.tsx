export const dynamic = "force-dynamic";

import { requirePlatformUser } from "@/lib/platform-admin/auth";
import { getAllUsersAction } from "@/lib/platform-admin/actions";
import { Users, Search } from "lucide-react";
import { MemberStatusButton } from "@/components/platform-admin/member-actions";

const ROLE_STYLE: Record<string, string> = {
  owner:                "bg-violet-500/20 text-violet-300",
  admin:                "bg-blue-500/20 text-blue-300",
  member:               "bg-white/10 text-white/60",
  viewer:               "bg-white/5 text-white/40",
  compliance_manager:   "bg-emerald-500/20 text-emerald-300",
  security_manager:     "bg-red-500/20 text-red-300",
  procurement_manager:  "bg-amber-500/20 text-amber-300",
};

export default async function UsersPage(props: { searchParams: Promise<Record<string, string>> }) {
  await requirePlatformUser();
  const sp = await props.searchParams;
  const page = parseInt(sp.page ?? "1");
  const search = sp.q ?? "";

  const { data } = await getAllUsersAction(page, search);
  const users = data?.users ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">All Users</h1>
          <p className="mt-0.5 text-sm text-white/40">Cross-tenant user directory. {data?.total ?? 0} total users.</p>
        </div>
      </div>

      <form method="GET" className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            name="q"
            defaultValue={search}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-[#30363d] bg-white/[0.03] pl-9 pr-4 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-[#00B8D9]/50"
          />
        </div>
        <button type="submit" className="rounded-lg bg-[#00B8D9]/10 border border-[#00B8D9]/30 px-4 py-2 text-sm text-[#00B8D9] hover:bg-[#00B8D9]/20 transition-colors">
          Search
        </button>
      </form>

      <div className="rounded-xl border border-[#30363d] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#30363d] bg-white/[0.02]">
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">User</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Organization</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Role</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Joined</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d]">
            {users.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-white/30">No users found.</td></tr>
            ) : users.map((u) => (
              <tr key={`${u.id}-${u.org_name}`} className="hover:bg-white/[0.015] transition-colors">
                <td className="px-5 py-3">
                  <div className="text-sm font-medium text-white">{u.full_name as string || "—"}</div>
                  <div className="text-xs text-white/40">{u.email as string}</div>
                </td>
                <td className="px-5 py-3 text-sm text-white/60">{u.org_name as string}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${ROLE_STYLE[u.role as string] ?? "bg-white/5 text-white/40"}`}>
                    {u.role as string}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className={`flex items-center gap-1.5 text-xs ${u.is_active ? "text-emerald-400" : "text-white/30"}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${u.is_active ? "bg-emerald-400" : "bg-white/20"}`} />
                    {u.is_active ? "Active" : "Deactivated"}
                  </div>
                </td>
                <td className="px-5 py-3 text-xs text-white/30">
                  {new Date(u.created_at as string).toLocaleDateString()}
                </td>
                <td className="px-5 py-3">
                  <MemberStatusButton
                    userId={u.id as string}
                    orgId={u.org_id as string}
                    isActive={!!(u.is_active)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/30">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`?page=${page - 1}&q=${search}`} className="rounded-lg border border-[#30363d] px-4 py-2 text-sm text-white/60 hover:bg-white/[0.03]">Previous</a>
            )}
            {page < totalPages && (
              <a href={`?page=${page + 1}&q=${search}`} className="rounded-lg border border-[#30363d] px-4 py-2 text-sm text-white/60 hover:bg-white/[0.03]">Next</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
