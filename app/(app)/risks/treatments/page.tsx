export const dynamic = "force-dynamic";

import Link from "next/link";
import { Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import * as treatmentRepo from "@/backend/src/modules/risk-lens/risk-treatment-repo";
import * as riskRepo from "@/backend/src/modules/risk-lens/risk-repo";
import { TreatmentStatusBadge } from "@/components/risk/risk-status-badge";
import { formatDate, isOverdue, isDueSoon } from "@/components/risk/risk-ui";
import { cn } from "@/lib/utils";

export default async function RiskTreatmentsPage() {
  const session = await requireUser();
  if (session.demo || !session.org) {
    return <Card><EmptyState icon={Shield} title="Treatments" description="Connect Supabase to view treatment plans." /></Card>;
  }

  const [treatments, risks] = await Promise.all([
    treatmentRepo.findByOrg(session.org.id),
    riskRepo.findByOrg(session.org.id),
  ]);

  const riskMap = Object.fromEntries(risks.map((r) => [r.id, r]));
  const open = treatments.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const completed = treatments.filter((t) => t.status === "completed");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Treatment Plans</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">{open.length} open · {completed.length} completed</p>
      </div>

      {treatments.length === 0 ? (
        <Card>
          <EmptyState icon={Shield} title="No treatment actions" description="Add treatment actions from individual risk pages." />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-xs text-[var(--color-ink-faint)]">
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                  <th className="px-4 py-3 text-left font-medium">Risk</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Progress</th>
                  <th className="px-4 py-3 text-left font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {treatments.map((t) => {
                  const risk = riskMap[t.riskId];
                  const overdue = isOverdue(t.targetDate) && t.status !== "completed";
                  const soon = isDueSoon(t.targetDate);
                  return (
                    <tr key={t.id} className="hover:bg-white transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium line-clamp-1">{t.action}</p>
                        {t.description && <p className="text-xs text-[var(--color-ink-faint)] line-clamp-1">{t.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {risk ? (
                          <Link href={`/risks/${risk.id}`} className="text-xs text-[var(--color-blue)] hover:underline line-clamp-1">
                            {risk.title}
                          </Link>
                        ) : (
                          <span className="text-xs text-[var(--color-ink-faint)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <TreatmentStatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-[#F8F9FB]">
                            <div className="h-full rounded-full bg-[var(--color-blue)]/60" style={{ width: `${t.progressPercent}%` }} />
                          </div>
                          <span className="text-xs text-[var(--color-ink-faint)]">{t.progressPercent}%</span>
                        </div>
                      </td>
                      <td className={cn("px-4 py-3 text-xs", overdue ? "text-red-400" : soon ? "text-amber-400" : "text-[var(--color-ink-dim)]")}>
                        {formatDate(t.targetDate)}
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
