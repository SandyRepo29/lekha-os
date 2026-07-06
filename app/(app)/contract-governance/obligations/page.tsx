export const dynamic = "force-dynamic";

import Link from "next/link";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getObligations } from "@/lib/repositories/contract-repo";
import {
  ContractStat,
  ContractFilterChip,
  ObligationStatusBadge,
  ClauseRiskBadge,
} from "@/components/contract-governance/contract-ui";

import { formatDate, daysUntil } from "@/lib/contract-governance/date-utils";

const FILTER_STATUSES = ["", "open", "in_progress", "overdue", "completed", "waived"];

export default async function ObligationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireUser();
  const sp = await searchParams;

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState icon={CheckCircle2} title="Obligations" description="Connect Supabase to track obligations." />
      </Card>
    );
  }

  const allObligations = await getObligations(session.org.id);
  const obligations = sp.status
    ? allObligations.filter((o) => o.status === sp.status)
    : allObligations;

  const overdue = allObligations.filter((o) => {
    const d = daysUntil(o.dueDate);
    return d !== null && d < 0 && o.status !== "completed" && o.status !== "waived";
  }).length;

  const dueSoon = allObligations.filter((o) => {
    const d = daysUntil(o.dueDate);
    return d !== null && d >= 0 && d <= 7 && !["completed", "waived"].includes(o.status);
  }).length;

  const open = allObligations.filter((o) => o.status === "open").length;
  const completed = allObligations.filter((o) => o.status === "completed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Obligations Tracker</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">All contractual obligations across your portfolio</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ContractStat label="Overdue" value={overdue} accent={overdue > 0 ? "danger" : "neutral"} />
        <ContractStat label="Due This Week" value={dueSoon} accent={dueSoon > 0 ? "warn" : "neutral"} />
        <ContractStat label="Open" value={open} accent="neutral" />
        <ContractStat label="Completed" value={completed} accent={completed > 0 ? "good" : "neutral"} />
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-wrap gap-2">
        {FILTER_STATUSES.map((s) => (
          <ContractFilterChip
            key={s}
            label={s === "" ? "All" : s.replace("_", " ")}
            active={(sp.status ?? "") === s}
            href={`/contract-governance/obligations${s ? `?status=${s}` : ""}`}
          />
        ))}
      </Card>

      {obligations.length === 0 ? (
        <Card>
          <EmptyState icon={CheckCircle2} title="No obligations" description="No obligations match the selected filter." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Obligation</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Contract</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Due Date</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Risk</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {obligations.map((o) => {
                  const days = daysUntil(o.dueDate);
                  const isOverdue = days !== null && days < 0 && !["completed", "waived"].includes(o.status);
                  const isDueSoon = !isOverdue && days !== null && days <= 7 && !["completed", "waived"].includes(o.status);
                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-white transition-colors ${isOverdue ? "bg-red-500/[0.03]" : isDueSoon ? "bg-amber-500/[0.03]" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <p className={`font-medium ${isOverdue ? "text-red-700" : ""}`}>{o.title}</p>
                        {o.description && (
                          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5 line-clamp-1">{o.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/contract-governance/${o.contractId}`} className="text-[var(--color-blue)] hover:underline text-sm">
                          {o.contractTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={isOverdue ? "text-red-700 font-medium" : isDueSoon ? "text-amber-700 font-medium" : ""}>
                          {formatDate(o.dueDate)}
                        </span>
                        {isOverdue && days !== null && (
                          <span className="ml-1 text-xs text-red-700">({Math.abs(days)}d overdue)</span>
                        )}
                        {isDueSoon && days !== null && (
                          <span className="ml-1 text-xs text-amber-700">({days}d)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ClauseRiskBadge level={o.riskLevel} />
                      </td>
                      <td className="px-4 py-3">
                        <ObligationStatusBadge status={o.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
