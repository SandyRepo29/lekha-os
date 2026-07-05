export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getObligations } from "@/lib/services/regulatory-intelligence/regulatory-service";
import {
  RegSubNav, RegStat, ObligationStatusBadge, PriorityBadge,
} from "@/components/regulatory-intelligence/reg-ui";
import { ClipboardList, Plus, CheckCircle } from "lucide-react";
import { UpdateObligationStatusButton } from "@/components/regulatory-intelligence/obligation-actions";

export default async function ObligationsPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const obligations = await getObligations(orgId).catch(() => []);

  const byStatus = {
    not_started: obligations.filter(o => o.status === "not_started").length,
    in_progress: obligations.filter(o => o.status === "in_progress").length,
    implemented: obligations.filter(o => o.status === "implemented").length,
    validated: obligations.filter(o => o.status === "validated").length,
  };
  const complete = byStatus.implemented + byStatus.validated;
  const completionRate = obligations.length > 0 ? Math.round((complete / obligations.length) * 100) : 0;

  return (
    <div className="space-y-6 p-6">
      <RegSubNav />

      <div className="flex items-start justify-between gap-4 pt-2">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Obligation Management™</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Track and manage all regulatory obligations — from identification through implementation and validation.</p>
        </div>
        <Link
          href="/regulatory-intelligence/obligations/new"
          className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add Obligation
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RegStat label="Total Obligations" value={obligations.length}    accent="neutral" />
        <RegStat label="Not Started"       value={byStatus.not_started}  accent={byStatus.not_started > 0 ? "warn" : "neutral"} />
        <RegStat label="In Progress"       value={byStatus.in_progress}  accent="purple" />
        <RegStat label="Completion Rate"   value={`${completionRate}%`}  accent={completionRate >= 60 ? "good" : "danger"} />
      </div>

      {obligations.length > 0 ? (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-[var(--color-ink-faint)]">
                  <th className="px-4 py-3 text-left font-medium">Obligation</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Priority</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Due</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]/40">
                {obligations.map(o => {
                  const isOverdue = o.dueDate && new Date(o.dueDate) < new Date() && o.status !== "implemented" && o.status !== "validated";
                  return (
                    <tr key={o.id} className="hover:bg-white transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold max-w-[220px]">{o.title}</div>
                        {o.obligationRef && <div className="mt-0.5 text-[var(--color-ink-faint)]">{o.obligationRef}</div>}
                      </td>
                      <td className="px-4 py-3 capitalize text-[var(--color-ink-dim)]">{o.category?.replace(/_/g, " ") ?? "—"}</td>
                      <td className="px-4 py-3"><PriorityBadge priority={o.priority} /></td>
                      <td className="px-4 py-3"><ObligationStatusBadge status={o.status} /></td>
                      <td className="px-4 py-3">
                        {o.dueDate ? (
                          <span className={isOverdue ? "text-red-400 font-medium" : "text-[var(--color-ink-faint)]"}>
                            {new Date(o.dueDate).toLocaleDateString()}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <UpdateObligationStatusButton obligationId={o.id} currentStatus={o.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-bg-2)]/40 py-16">
          <ClipboardList className="h-10 w-10 text-[var(--color-blue)] opacity-40" />
          <div className="text-center">
            <p className="font-semibold text-sm">No obligations yet</p>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)]">Add obligations manually or use the AI Extractor to extract them from regulation text.</p>
          </div>
          <Link href="/regulatory-intelligence/obligations/new" className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> Add Obligation
          </Link>
        </div>
      )}
    </div>
  );
}
