export const dynamic = "force-dynamic";

import Link from "next/link";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getObligations } from "@/lib/repositories/contract-repo";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-400",
  in_progress: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  overdue: "bg-red-500/20 text-red-400",
  waived: "bg-gray-500/20 text-gray-400",
};

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-500/20 text-green-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  high: "bg-orange-500/20 text-orange-400",
  critical: "bg-red-500/20 text-red-400",
};

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(d: string | null | undefined) {
  if (!d) return null;
  return Math.floor((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

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

  const open = allObligations.filter((o) => o.status === "open").length;
  const completed = allObligations.filter((o) => o.status === "completed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Obligations Tracker</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">All contractual obligations across your portfolio</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div>
            <p className="text-xl font-bold text-red-400">{overdue}</p>
            <p className="text-xs text-[var(--color-ink-dim)]">Overdue</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-yellow-400" />
          <div>
            <p className="text-xl font-bold">{open}</p>
            <p className="text-xs text-[var(--color-ink-dim)]">Open</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-400" />
          <div>
            <p className="text-xl font-bold text-green-400">{completed}</p>
            <p className="text-xs text-[var(--color-ink-dim)]">Completed</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-wrap gap-3">
        {["", "open", "in_progress", "overdue", "completed", "waived"].map((s) => (
          <Link
            key={s}
            href={`/contract-governance/obligations${s ? `?status=${s}` : ""}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              (sp.status ?? "") === s
                ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/40"
                : "bg-white/5 text-[var(--color-ink-dim)] hover:bg-white/10"
            }`}
          >
            {s === "" ? "All" : s.replace("_", " ")}
          </Link>
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
                  return (
                    <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{o.title}</p>
                        {o.description && (
                          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5 line-clamp-1">{o.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/contract-governance/${o.contractId}`} className="text-indigo-400 hover:text-indigo-300 text-sm">
                          {o.contractTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={isOverdue ? "text-red-400" : ""}>
                          {formatDate(o.dueDate)}
                        </span>
                        {isOverdue && days !== null && (
                          <span className="ml-1 text-xs text-red-400">({Math.abs(days)}d overdue)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RISK_COLORS[o.riskLevel] ?? "bg-slate-500/20 text-slate-400"}`}>
                          {o.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] ?? "bg-slate-500/20 text-slate-400"}`}>
                          {o.status.replace("_", " ")}
                        </span>
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
