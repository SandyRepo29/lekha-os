export const dynamic = "force-dynamic";

import { requirePlatformUser } from "@/lib/platform-admin/auth";
import {
  getOrgDetailAction,
  updateOrgAction,
  suspendOrgAction,
  activateOrgAction,
  addOrgNoteAction,
} from "@/lib/platform-admin/actions";
import { notFound } from "next/navigation";
import { Building2, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MemberStatusButton } from "@/components/platform-admin/member-actions";
import { SuspendOrgButton } from "@/components/platform-admin/org-actions";

const ROLE_STYLE: Record<string, string> = {
  owner:                "bg-violet-500/20 text-violet-300",
  admin:                "bg-blue-500/20 text-blue-300",
  member:               "bg-white/10 text-white/60",
  viewer:               "bg-white/5 text-white/40",
  compliance_manager:   "bg-emerald-500/20 text-emerald-300",
  security_manager:     "bg-red-500/20 text-red-300",
  procurement_manager:  "bg-amber-500/20 text-amber-300",
};

const STATUS_BADGE: Record<string, string> = {
  trial:       "bg-amber-900/40 text-amber-400",
  active:      "bg-emerald-900/40 text-emerald-400",
  grace_period:"bg-orange-900/40 text-orange-400",
  suspended:   "bg-red-900/40 text-red-400",
  expired:     "bg-slate-800 text-slate-400",
  cancelled:   "bg-slate-800 text-slate-500",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const INDUSTRY_OPTIONS = [
  "Technology", "Financial Services", "Healthcare", "Manufacturing",
  "Retail", "Education", "Government", "Energy", "Media", "Professional Services", "Other",
];

const SIZE_OPTIONS = [
  { value: "1_10", label: "1–10" },
  { value: "11_50", label: "11–50" },
  { value: "51_200", label: "51–200" },
  { value: "201_500", label: "201–500" },
  { value: "501_1000", label: "501–1000" },
  { value: "1001_5000", label: "1001–5000" },
  { value: "5001_plus", label: "5001+" },
];

export default async function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePlatformUser();
  const { id } = await params;
  const result = await getOrgDetailAction(id);

  if (!result.data || !result.data.org) notFound();

  const { org, members, notes, auditLogs } = result.data;
  const canEdit = session.role !== "platform_support";

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Link href="/platform-admin/orgs" className="mt-0.5 text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00B8D9]/10">
              <Building2 className="h-4.5 w-4.5 text-[#00B8D9]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{org.name as string}</h1>
              <p className="text-xs text-white/35">Created {fmtDate(org.created_at as string)}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!!org.subscription_status && (
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_BADGE[org.subscription_status as string] ?? "bg-slate-800 text-slate-400"}`}>
              {(org.subscription_status as string).replace(/_/g, " ")}
            </span>
          )}
          {!!org.plan_name && <span className="text-xs text-white/40">{org.plan_name as string}</span>}
          {canEdit && (
            <SuspendOrgButton
              orgId={id}
              suspended={(org.subscription_status as string) === "suspended"}
            />
          )}
        </div>
      </div>

      {/* Edit profile */}
      {canEdit && (
        <div className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Organization Profile</h2>
          <form action={async (fd: FormData) => { "use server"; await updateOrgAction(id, fd); }} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-white/40">Name *</label>
                <input
                  name="name"
                  required
                  defaultValue={org.name as string}
                  className="w-full rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#007A94]/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/40">Website</label>
                <input
                  name="website"
                  defaultValue={(org.website as string) ?? ""}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white/70 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/40">Industry</label>
                <select name="industry" defaultValue={(org.industry as string) ?? ""} className="w-full rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white">
                  <option value="">Select industry</option>
                  {INDUSTRY_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/40">Company Size</label>
                <select name="company_size" defaultValue={(org.company_size as string) ?? ""} className="w-full rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white">
                  <option value="">Select size</option>
                  {SIZE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="rounded-lg bg-[#007A94] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* Members */}
      <div className="rounded-xl border border-[#30363d] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#30363d] px-5 py-3 bg-white/[0.02]">
          <Users className="h-4 w-4 text-white/40" />
          <h2 className="text-sm font-semibold text-white">Members ({members.length})</h2>
        </div>
        {members.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm text-white/30">No members.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#30363d] bg-white/[0.01] text-[11px] text-white/30">
                <th className="px-5 py-2.5 text-left font-semibold uppercase tracking-wider">User</th>
                <th className="px-5 py-2.5 text-left font-semibold uppercase tracking-wider">Role</th>
                <th className="px-5 py-2.5 text-left font-semibold uppercase tracking-wider">Status</th>
                <th className="px-5 py-2.5 text-left font-semibold uppercase tracking-wider">Joined</th>
                {canEdit && <th className="px-5 py-2.5 text-left font-semibold uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {members.map((m) => (
                <tr key={m.id as string} className="hover:bg-white/[0.01]">
                  <td className="px-5 py-3">
                    <div className="text-sm font-medium text-white">{(m.full_name as string) || "—"}</div>
                    <div className="text-xs text-white/35">{m.email as string}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${ROLE_STYLE[m.role as string] ?? "bg-white/5 text-white/40"}`}>
                      {m.role as string}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className={`flex items-center gap-1.5 text-xs ${m.is_active ? "text-emerald-400" : "text-white/30"}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${m.is_active ? "bg-emerald-400" : "bg-white/20"}`} />
                      {m.is_active ? "Active" : "Deactivated"}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-white/30">{fmtDate(m.created_at as string)}</td>
                  {canEdit && (
                    <td className="px-5 py-3">
                      <MemberStatusButton userId={m.id as string} orgId={id} isActive={!!(m.is_active)} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Platform Notes</h2>
        <form action={async (fd: FormData) => { "use server"; fd.set("orgId", id); await addOrgNoteAction(fd); }} className="flex gap-2">
          <input
            name="note"
            required
            placeholder="Add a note about this organization…"
            className="flex-1 rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-[#007A94]/50"
          />
          <button type="submit" className="rounded-lg bg-[#007A94] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Add Note
          </button>
        </form>
        {notes.length === 0 ? (
          <p className="text-xs text-white/25">No notes yet.</p>
        ) : (
          <div className="space-y-2">
            {notes.map((n) => (
              <div key={n.id as string} className="rounded-lg border border-[#30363d] px-4 py-3">
                <p className="text-sm text-white/80">{n.note as string}</p>
                <p className="mt-1 text-xs text-white/25">
                  {n.created_by_name as string} · {fmtDate(n.created_at as string)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit trail */}
      {auditLogs.length > 0 && (
        <div className="rounded-xl border border-[#30363d] overflow-hidden">
          <div className="border-b border-[#30363d] px-5 py-3 bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white">Recent Platform Actions</h2>
          </div>
          <div className="divide-y divide-[#30363d]">
            {auditLogs.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <span className="text-sm text-white/70">{(a.action as string).replace(/_/g, " ")}</span>
                  {!!a.target_label && <span className="ml-2 text-xs text-white/35">{a.target_label as string}</span>}
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/35">{a.platform_user_email as string}</div>
                  <div className="text-xs text-white/20">{fmtDate(a.created_at as string)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
