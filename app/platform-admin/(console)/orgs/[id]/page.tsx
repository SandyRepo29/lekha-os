export const dynamic = "force-dynamic";

import { requirePlatformUser } from "@/lib/platform-admin/auth";
import {
  getOrgDetailAction,
  updateOrgAction,
  addOrgNoteAction,
  getOrgSubscriptionDetailAction,
  getOrgInvoicesAction,
  cancelSubscriptionAction,
  markInvoicePaidAction,
} from "@/lib/platform-admin/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building2, Users, CreditCard, Receipt,
  CheckCircle2, Clock, AlertTriangle, Ban,
} from "lucide-react";
import { MemberStatusButton } from "@/components/platform-admin/member-actions";
import { SuspendOrgButton } from "@/components/platform-admin/org-actions";
import { CancelSubscriptionButton } from "@/components/platform-admin/cancel-subscription-button";
import { RoleDropdown, RemoveMemberButton } from "@/components/platform-admin/org-member-controls";
import { ChangePlanSelect, ExtendTrialButton } from "@/components/platform-admin/subscription-controls";

// ── helpers ──────────────────────────────────────────────────────────────────

const ROLE_STYLE: Record<string, string> = {
  owner:               "bg-violet-500/20 text-violet-300",
  admin:               "bg-blue-500/20 text-blue-300",
  member:              "bg-white/10 text-white/60",
  viewer:              "bg-white/5 text-white/40",
  compliance_manager:  "bg-emerald-500/20 text-emerald-300",
  security_manager:    "bg-red-500/20 text-red-300",
  procurement_manager: "bg-amber-500/20 text-amber-300",
};

const SUB_BADGE: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  trial:        { label: "Trial",        cls: "bg-amber-500/20 text-amber-300",   icon: Clock },
  active:       { label: "Active",       cls: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle2 },
  grace_period: { label: "Grace Period", cls: "bg-orange-500/20 text-orange-300", icon: AlertTriangle },
  suspended:    { label: "Suspended",    cls: "bg-red-500/20 text-red-400",       icon: Ban },
  expired:      { label: "Expired",      cls: "bg-slate-700 text-slate-400",      icon: Ban },
  cancelled:    { label: "Cancelled",    cls: "bg-slate-700 text-slate-400",      icon: Ban },
};

const INV_BADGE: Record<string, string> = {
  paid:     "bg-emerald-500/20 text-emerald-300",
  pending:  "bg-amber-500/20 text-amber-300",
  overdue:  "bg-red-500/20 text-red-400",
  void:     "bg-slate-700 text-slate-400",
  cancelled:"bg-slate-700 text-slate-400",
};

const INDUSTRY_OPTIONS = [
  "Technology","Financial Services","Healthcare","Manufacturing",
  "Retail","Education","Government","Energy","Media","Professional Services","Other",
];
const SIZE_OPTIONS = [
  { value: "1_10",     label: "1–10" },
  { value: "11_50",    label: "11–50" },
  { value: "51_200",   label: "51–200" },
  { value: "201_500",  label: "201–500" },
  { value: "501_1000", label: "501–1,000" },
  { value: "1001_5000",label: "1,001–5,000" },
  { value: "5001_plus",label: "5,001+" },
];

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso as string).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso as string).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
function fmtAmount(cents: unknown, currency = "INR") {
  if (!cents) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency as string, maximumFractionDigits: 0 })
    .format(Number(cents) / 100);
}

const TABS = [
  { id: "overview",     label: "Overview",     icon: Building2  },
  { id: "users",        label: "Users",        icon: Users      },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "billing",      label: "Billing",      icon: Receipt    },
];

// ── page ─────────────────────────────────────────────────────────────────────

export default async function OrgDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requirePlatformUser();
  const { id } = await params;
  const sp = await searchParams;
  const tab = (sp.tab as string) || "overview";

  // Always fetch core data
  const [coreResult, subResult] = await Promise.all([
    getOrgDetailAction(id),
    getOrgSubscriptionDetailAction(id),
  ]);

  if (!coreResult.data?.org) notFound();

  const { org, members, notes, auditLogs } = coreResult.data;
  const sub = subResult.data;
  const invoicesResult = tab === "billing" ? await getOrgInvoicesAction(id) : null;

  const canEdit = session.role !== "platform_support";
  const subMeta = sub.subscription
    ? SUB_BADGE[(sub.subscription.status as string) ?? ""] ?? null
    : null;

  return (
    <div className="space-y-5">

      {/* ── header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <Link
          href="/platform-admin/orgs"
          className="mt-1 text-white/30 hover:text-white/60 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-white truncate">{org.name as string}</h1>
            {subMeta && (() => {
              const Icon = subMeta.icon;
              return (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${subMeta.cls}`}>
                  <Icon className="h-3 w-3" />
                  {subMeta.label}
                </span>
              );
            })()}
            {!!sub.subscription?.plan_name && (
              <span className="text-xs text-white/40">{sub.subscription.plan_name as string}</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-white/30">
            {org.industry as string || "—"} · {(org.company_size as string || "").replace(/_/g, "–")} employees ·
            Created {fmtDate(org.created_at as string)}
          </p>
        </div>
        {canEdit && (
          <SuspendOrgButton
            orgId={id}
            suspended={(sub.subscription?.status as string) === "suspended"}
          />
        )}
      </div>

      {/* ── metrics strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Active Users",   value: sub.userCount },
          { label: "Vendors",        value: sub.vendorCount },
          { label: "Members (total)",value: members.length },
          { label: "Plan",           value: (sub.subscription?.plan_name as string) || "None" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-[#30363d] bg-white/[0.02] px-4 py-3">
            <div className="text-[11px] text-white/35">{m.label}</div>
            <div className="mt-1 text-lg font-bold text-white">{m.value}</div>
          </div>
        ))}
      </div>

      {/* ── tab nav ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 rounded-2xl border border-[#30363d] bg-white/[0.02] p-1">
        {TABS.map(({ id: tid, label, icon: Icon }) => (
          <Link
            key={tid}
            href={`/platform-admin/orgs/${id}?tab=${tid}`}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === tid
                ? "bg-white/[0.08] text-white"
                : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        ))}
      </div>

      {/* ══════════════════════ OVERVIEW TAB ═══════════════════════════════ */}
      {tab === "overview" && (
        <div className="space-y-5">
          {/* Profile edit */}
          {canEdit && (
            <div className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5">
              <h2 className="mb-4 text-sm font-semibold text-white">Organization Profile</h2>
              <form
                action={async (fd: FormData) => { "use server"; await updateOrgAction(id, fd); }}
                className="space-y-3"
              >
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
                      placeholder="https://…"
                      className="w-full rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white/70 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/40">Industry</label>
                    <select
                      name="industry"
                      defaultValue={(org.industry as string) ?? ""}
                      className="w-full rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white"
                    >
                      <option value="">Select industry</option>
                      {INDUSTRY_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/40">Company Size</label>
                    <select
                      name="company_size"
                      defaultValue={(org.company_size as string) ?? ""}
                      className="w-full rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white"
                    >
                      <option value="">Select size</option>
                      {SIZE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-[#007A94] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {/* Notes */}
          <div className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white">Platform Notes</h2>
            <form
              action={async (fd: FormData) => { "use server"; fd.set("orgId", id); await addOrgNoteAction(fd); }}
              className="flex gap-2"
            >
              <input
                name="note"
                required
                placeholder="Add a note about this organization…"
                className="flex-1 rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#007A94]/50"
              />
              <button
                type="submit"
                className="rounded-lg bg-[#007A94] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Add
              </button>
            </form>
            {notes.length === 0 ? (
              <p className="text-xs text-white/20">No notes yet.</p>
            ) : (
              <div className="space-y-2">
                {notes.map((n) => (
                  <div key={n.id as string} className="rounded-lg border border-[#30363d] px-4 py-3">
                    <p className="text-sm text-white/80">{n.note as string}</p>
                    <p className="mt-1 text-xs text-white/25">
                      {n.created_by_name as string} · {fmtDateTime(n.created_at as string)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit trail */}
          {auditLogs.length > 0 && (
            <div className="rounded-xl border border-[#30363d] overflow-hidden">
              <div className="border-b border-[#30363d] bg-white/[0.02] px-5 py-3">
                <h2 className="text-sm font-semibold text-white">Recent Platform Actions</h2>
              </div>
              <div className="divide-y divide-[#30363d]">
                {auditLogs.map((a, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.01]">
                    <div>
                      <span className="text-sm text-white/70">{(a.action as string).replace(/_/g, " ")}</span>
                      {!!a.target_label && (
                        <span className="ml-2 text-xs text-white/30">{a.target_label as string}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/35">{a.platform_user_email as string}</div>
                      <div className="text-xs text-white/20">{fmtDateTime(a.created_at as string)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════ USERS TAB ══════════════════════════════════ */}
      {tab === "users" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-[#30363d] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#30363d] bg-white/[0.02] px-5 py-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-white/40" />
                <h2 className="text-sm font-semibold text-white">Members ({members.length})</h2>
              </div>
              <div className="flex gap-2">
                {Object.entries(ROLE_STYLE).slice(0, 3).map(([r, cls]) => (
                  <span key={r} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>
                    {r.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>

            {members.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-white/25">No members in this org.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#30363d] bg-white/[0.01] text-[11px] text-white/30">
                    <th className="px-5 py-2.5 text-left font-semibold uppercase tracking-wider">User</th>
                    <th className="px-5 py-2.5 text-left font-semibold uppercase tracking-wider">Role</th>
                    <th className="px-5 py-2.5 text-left font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-5 py-2.5 text-left font-semibold uppercase tracking-wider">Joined</th>
                    {canEdit && (
                      <>
                        <th className="px-5 py-2.5 text-left font-semibold uppercase tracking-wider">Change Role</th>
                        <th className="px-5 py-2.5 text-left font-semibold uppercase tracking-wider">Deactivate</th>
                        <th className="px-5 py-2.5 text-left font-semibold uppercase tracking-wider">Remove</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363d]">
                  {members.map((m) => {
                    const isOwnerRole = (m.role as string) === "owner";
                    return (
                      <tr key={m.id as string} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-5 py-3">
                          <div className="text-sm font-medium text-white">{(m.full_name as string) || "—"}</div>
                          <div className="text-xs text-white/35">{m.email as string}</div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${ROLE_STYLE[m.role as string] ?? "bg-white/5 text-white/40"}`}>
                            {(m.role as string).replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className={`flex items-center gap-1.5 text-xs ${m.is_active ? "text-emerald-400" : "text-white/25"}`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${m.is_active ? "bg-emerald-400" : "bg-white/20"}`} />
                            {m.is_active ? "Active" : "Deactivated"}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-white/30">{fmtDate(m.created_at as string)}</td>
                        {canEdit && (
                          <>
                            <td className="px-5 py-3">
                              <RoleDropdown
                                userId={m.id as string}
                                orgId={id}
                                currentRole={m.role as string}
                                isOwnerRole={isOwnerRole}
                              />
                            </td>
                            <td className="px-5 py-3">
                              <MemberStatusButton
                                userId={m.id as string}
                                orgId={id}
                                isActive={!!(m.is_active)}
                              />
                            </td>
                            <td className="px-5 py-3">
                              <RemoveMemberButton
                                userId={m.id as string}
                                orgId={id}
                                name={(m.full_name as string) || "User"}
                                isOwnerRole={isOwnerRole}
                              />
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════ SUBSCRIPTION TAB ════════════════════════════════ */}
      {tab === "subscription" && (
        <div className="space-y-5">

          {/* Current subscription */}
          {sub.subscription ? (
            <div className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">Current Subscription</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { label: "Plan",         value: (sub.subscription.plan_name as string) || "None" },
                  { label: "Status",       value: (sub.subscription.status as string || "—").replace(/_/g, " ") },
                  { label: "Trial Ends",   value: fmtDate(sub.subscription.trial_ends_at as string) },
                  { label: "Period Start", value: fmtDate(sub.subscription.current_period_start as string) },
                  { label: "Period End",   value: fmtDate(sub.subscription.current_period_end as string) },
                ].map((f) => (
                  <div key={f.label}>
                    <div className="text-[11px] text-white/35">{f.label}</div>
                    <div className="mt-1 text-sm font-medium text-white capitalize">{f.value}</div>
                  </div>
                ))}
              </div>
              {!!(sub.subscription.cancel_at_period_end) && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                  <span className="text-sm text-red-300">Cancels at end of current period</span>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-[#30363d] bg-white/[0.02] px-5 py-8 text-center text-sm text-white/30">
              No subscription found for this organization.
            </div>
          )}

          {/* Usage vs limits */}
          {sub.subscription && (
            <div className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5">
              <h2 className="mb-4 text-sm font-semibold text-white">Usage vs Plan Limits</h2>
              <div className="space-y-3">
                {[
                  {
                    label: "Users",
                    used: sub.userCount,
                    max: sub.subscription.max_users as number | null,
                  },
                  {
                    label: "Vendors",
                    used: sub.vendorCount,
                    max: sub.subscription.max_vendors as number | null,
                  },
                ].map(({ label, used, max }) => {
                  const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
                  return (
                    <div key={label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-white/50">{label}</span>
                        <span className="text-white/70">
                          {used} / {max ?? "∞"}
                          {max ? ` (${pct}%)` : ""}
                        </span>
                      </div>
                      {max && (
                        <div className="h-1.5 w-full rounded-full bg-[#30363d]">
                          <div
                            className={`h-1.5 rounded-full transition-all ${pct >= 90 ? "bg-red-400" : pct >= 70 ? "bg-amber-400" : "bg-emerald-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Change plan */}
          {canEdit && (
            <div className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5 space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-white">Change Plan</h2>
                <p className="text-xs text-white/35 mt-0.5">Switching plan takes effect immediately and sets status to active.</p>
              </div>
              <ChangePlanSelect
                orgId={id}
                currentPlanId={(sub.subscription?.plan_id as string) ?? null}
                plans={sub.plans as Array<{ id: string; name: string; price_monthly: number | null }>}
              />
            </div>
          )}

          {/* Extend trial */}
          {canEdit && (sub.subscription?.status as string) === "trial" && (
            <div className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5 space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-white">Extend Trial</h2>
                <p className="text-xs text-white/35 mt-0.5">
                  Current trial ends {fmtDate(sub.subscription?.trial_ends_at as string)}.
                </p>
              </div>
              <ExtendTrialButton orgId={id} />
            </div>
          )}

          {/* Cancel */}
          {canEdit && sub.subscription && !["cancelled", "expired"].includes(sub.subscription.status as string) && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-5 space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-red-300">Cancel Subscription</h2>
                <p className="text-xs text-red-400/60 mt-0.5">
                  Marks subscription as cancelled. The org retains access until the period end.
                </p>
              </div>
              <CancelSubscriptionButton orgId={id} orgName={org.name as string} />
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════ BILLING TAB ════════════════════════════════ */}
      {tab === "billing" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-[#30363d] overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[#30363d] bg-white/[0.02] px-5 py-3">
              <Receipt className="h-4 w-4 text-white/40" />
              <h2 className="text-sm font-semibold text-white">
                Invoices ({invoicesResult?.data?.length ?? 0})
              </h2>
            </div>

            {!invoicesResult?.data?.length ? (
              <div className="px-5 py-10 text-center text-sm text-white/25">
                No invoices found for this organization.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#30363d] bg-white/[0.01] text-[11px] text-white/30">
                    <th className="px-5 py-2.5 text-left font-semibold uppercase tracking-wider">Invoice</th>
                    <th className="px-5 py-2.5 text-left font-semibold uppercase tracking-wider">Amount</th>
                    <th className="px-5 py-2.5 text-left font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-5 py-2.5 text-left font-semibold uppercase tracking-wider">Issued</th>
                    <th className="px-5 py-2.5 text-left font-semibold uppercase tracking-wider">Due</th>
                    {canEdit && <th className="px-5 py-2.5 text-left font-semibold uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363d]">
                  {invoicesResult.data.map((inv) => (
                    <tr key={inv.id as string} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-white/70">
                        {(inv.invoice_number as string) || (inv.id as string).slice(0, 8)}
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-white">
                        {fmtAmount(inv.amount_cents, inv.currency as string)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${INV_BADGE[inv.status as string] ?? "bg-white/5 text-white/40"}`}>
                          {inv.status as string}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-white/40">{fmtDate(inv.issued_at as string)}</td>
                      <td className="px-5 py-3 text-xs text-white/40">{fmtDate(inv.due_at as string)}</td>
                      {canEdit && (
                        <td className="px-5 py-3">
                          {(inv.status as string) === "pending" && (
                            <form action={async () => { "use server"; await markInvoicePaidAction(inv.id as string); }}>
                              <button
                                type="submit"
                                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                              >
                                Mark Paid
                              </button>
                            </form>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
