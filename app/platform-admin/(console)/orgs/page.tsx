export const dynamic = "force-dynamic";

import { requirePlatformUser } from "@/lib/platform-admin/auth";
import { getOrganizationsAction } from "@/lib/platform-admin/actions";
import { Building2, Users, Package } from "lucide-react";
import { SuspendOrgButton, AddOrgNoteForm } from "@/components/platform-admin/org-actions";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_BADGE: Record<string, string> = {
  trial:      "bg-amber-900/40 text-amber-400",
  active:     "bg-emerald-900/40 text-emerald-400",
  grace_period:"bg-orange-900/40 text-orange-400",
  suspended:  "bg-red-900/40 text-red-400",
  expired:    "bg-slate-800 text-slate-400",
  cancelled:  "bg-slate-800 text-slate-500",
};

export default async function PlatformOrgsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requirePlatformUser();
  const sp = await searchParams;
  const search = sp.q ?? "";
  const page = parseInt(sp.page ?? "1", 10);

  const result = await getOrganizationsAction(page, search);
  const d = result.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Organizations</h1>
          <p className="mt-0.5 text-sm text-white/40">
            {d?.total ?? 0} organizations on the AUDT platform
          </p>
        </div>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-3">
        <input
          name="q"
          defaultValue={search}
          placeholder="Search by organization name..."
          className="flex-1 rounded-xl border border-[#30363d] bg-white/[0.04] px-4 py-2 text-sm text-white placeholder:text-white/25 focus:border-[#00B8D9]/50 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-[#007A94] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#30363d]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#30363d] bg-white/[0.02] text-[11px] text-white/30">
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">Organization</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">Industry</th>
              <th className="px-4 py-3 text-center font-semibold uppercase tracking-widest">Members</th>
              <th className="px-4 py-3 text-center font-semibold uppercase tracking-widest">Vendors</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">Plan</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">Joined</th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d]">
            {(d?.orgs ?? []).map((org) => (
              <tr key={org.id as string} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#00B8D9]/10">
                      <Building2 className="h-3.5 w-3.5 text-[#00B8D9]" />
                    </div>
                    <span className="font-medium text-white">{org.name as string}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-white/50">{(org.industry as string) ?? "—"}</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 text-white/60">
                    <Users className="h-3.5 w-3.5" /> {org.member_count as number}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 text-white/60">
                    <Package className="h-3.5 w-3.5" /> {org.vendor_count as number}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {org.subscription_status ? (
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_BADGE[org.subscription_status as string] ?? "bg-slate-800 text-slate-400"}`}>
                      {(org.subscription_status as string).replace(/_/g, " ")}
                    </span>
                  ) : (
                    <span className="text-white/25 text-[11px]">No plan</span>
                  )}
                </td>
                <td className="px-4 py-3 text-white/35 text-[12px]">{fmtDate(org.created_at as string)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <SuspendOrgButton
                      orgId={org.id as string}
                      suspended={(org.subscription_status as string) === "suspended"}
                    />
                    <AddOrgNoteForm orgId={org.id as string} />
                  </div>
                </td>
              </tr>
            ))}
            {(d?.orgs ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/30">
                  {search ? `No organizations matching "${search}"` : "No organizations yet."}
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {d && d.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-white/40">
          <span>Page {d.page} of {d.totalPages}</span>
          <div className="flex gap-2">
            {d.page > 1 && (
              <a
                href={`?q=${search}&page=${d.page - 1}`}
                className="rounded-lg border border-[#30363d] px-3 py-1.5 hover:bg-white/[0.04] text-white/60"
              >
                Previous
              </a>
            )}
            {d.page < d.totalPages && (
              <a
                href={`?q=${search}&page=${d.page + 1}`}
                className="rounded-lg border border-[#30363d] px-3 py-1.5 hover:bg-white/[0.04] text-white/60"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
