export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { findAllExternalUsers } from "@/lib/repositories/auditor-collaboration-repo";
import { inviteExternalUserAction, revokeExternalUserAction } from "@/lib/auditor-collaboration/actions";
import { revalidatePath } from "next/cache";
import { Users, UserPlus, ShieldOff } from "lucide-react";
import { AuditorStat, ExternalUserTypeBadge } from "@/components/auditor-collaboration/auditor-ui";

const USER_TYPE_LABELS: Record<string, string> = {
  iso_auditor:           "ISO Auditor",
  soc_auditor:           "SOC Auditor",
  dpdp_assessor:         "DPDP Assessor",
  security_assessor:     "Security Assessor",
  privacy_consultant:    "Privacy Consultant",
  ai_governance_reviewer:"AI Governance Reviewer",
  customer_reviewer:     "Customer Reviewer",
  third_party_reviewer:  "Third-Party Reviewer",
};

const STATUS_BADGE: Record<string, string> = {
  invited:   "bg-amber-500/20 text-amber-400",
  active:    "bg-emerald-500/20 text-emerald-400",
  suspended: "bg-orange-500/20 text-orange-400",
  revoked:   "bg-red-500/20 text-red-400",
};

export default async function ExternalUsersPage() {
  const session = await requireUser();
  const oid = session.org?.id ?? "";
  const users = await findAllExternalUsers(oid).catch(() => []);

  const activeCount = users.filter(u => u.status === "active").length;
  const invitedCount = users.filter(u => u.status === "invited").length;

  async function inviteUser(fd: FormData) {
    "use server";
    const data: Record<string, unknown> = {};
    for (const [k, v] of fd.entries()) { if (v) data[k] = v; }
    await inviteExternalUserAction(data);
    revalidatePath("/auditor-collaboration/users");
  }

  async function revokeUser(fd: FormData) {
    "use server";
    await revokeExternalUserAction(fd.get("id") as string);
    revalidatePath("/auditor-collaboration/users");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-[var(--color-blue)]" /> External Users™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">Auditors, assessors, consultants, and reviewers with secure portal access.</p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-3">
        <AuditorStat label="Total"   value={users.length} accent="neutral" />
        <AuditorStat label="Active"  value={activeCount}  accent="good" />
        <AuditorStat label="Invited" value={invitedCount} accent="warn" />
      </div>

      {/* Invite Form */}
      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5">
        <h2 className="font-semibold text-sm flex items-center gap-2 mb-4">
          <UserPlus className="h-4 w-4 text-[var(--color-blue)]" /> Invite External User
        </h2>
        <form action={inviteUser} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs text-[var(--color-ink-dim)] mb-1">Email *</label>
            <input name="email" type="email" required placeholder="auditor@firm.com"
              className="w-full rounded-lg border border-[var(--color-line)] bg-white/5 px-3 py-2 text-xs focus:border-[var(--color-blue)] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-ink-dim)] mb-1">Full Name *</label>
            <input name="fullName" required placeholder="John Smith"
              className="w-full rounded-lg border border-[var(--color-line)] bg-white/5 px-3 py-2 text-xs focus:border-[var(--color-blue)] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-[var(--color-ink-dim)] mb-1">User Type</label>
            <select name="userType" className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-xs focus:border-[var(--color-blue)] focus:outline-none">
              {Object.entries(USER_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--color-ink-dim)] mb-1">Company</label>
            <input name="company" placeholder="Firm name"
              className="w-full rounded-lg border border-[var(--color-line)] bg-white/5 px-3 py-2 text-xs focus:border-[var(--color-blue)] focus:outline-none" />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              <UserPlus className="h-4 w-4" /> Send Invite
            </button>
          </div>
        </form>
      </div>

      {/* User List */}
      {users.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-[var(--color-ink-faint)]" />
          <p className="mt-3 font-semibold">No external users yet</p>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Invite auditors, assessors, or consultants above.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--color-line)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white text-xs text-[var(--color-ink-dim)]">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Invited</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-white">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.fullName}</div>
                    <div className="text-xs text-[var(--color-ink-dim)]">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs"><ExternalUserTypeBadge userType={u.userType} /></td>
                  <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">{u.company ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[u.status] ?? ""}`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">
                    {u.inviteSentAt ? new Date(u.inviteSentAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {u.status !== "revoked" && (
                      <form action={revokeUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20">
                          <ShieldOff className="h-3 w-3" /> Revoke
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
