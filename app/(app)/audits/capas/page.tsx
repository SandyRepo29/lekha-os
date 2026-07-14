export const dynamic = "force-dynamic";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listCapas } from "@/backend/src/modules/audit-management/capa-service";
import { listFindings } from "@/backend/src/modules/audit-management/finding-service";
import { listAudits } from "@/backend/src/modules/audit-management/audit-service";
import { CapaStatusBadge } from "@/components/audit/audit-status-badge";
import { AuditFilterChip, formatDate, isOverdue, isDueSoon } from "@/components/audit/audit-ui";
import { CapaActions } from "@/components/audit/capa-actions";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Overdue", value: "overdue" },
  { label: "Completed", value: "completed" },
];

export default async function AllCapasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await requireUser();
  const params = await searchParams;
  const statusFilter = params.status ?? "";

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState icon={ShieldAlert} title="CAPAs" description="Connect Supabase to track corrective actions." />
      </Card>
    );
  }

  const [capas, findings, audits] = await Promise.all([
    listCapas(session.org.id, { status: statusFilter || undefined }),
    listFindings(session.org.id, {}),
    listAudits(session.org.id),
  ]);

  const findingMap = new Map(findings.map((f) => [f.id, f]));
  const auditMap = new Map(audits.map((a) => [a.id, a.name]));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">CAPA Tracker</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">
          {capas.filter((c) => c.status !== "completed").length} open corrective actions
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <AuditFilterChip
            key={f.value}
            href={`/audits/capas?status=${f.value}`}
            label={f.label}
            active={statusFilter === f.value}
          />
        ))}
      </div>

      {capas.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-[var(--color-ink-faint)]">No CAPAs found.</p>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-[var(--color-line)]">
            {capas.map((c) => {
              const finding = c.findingId ? findingMap.get(c.findingId) : null;
              const auditName = finding ? auditMap.get(finding.auditId) : null;
              const dueSoon = isDueSoon(c.dueDate);
              const overdue = isOverdue(c.dueDate) && c.status !== "completed";
              return (
                <div key={c.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{c.title}</p>
                      {finding && (
                        <p className="text-xs text-[var(--color-ink-faint)]">
                          Finding: {finding.title}
                        </p>
                      )}
                      {auditName && (
                        <p className="text-xs text-[var(--color-ink-faint)]">
                          Audit:{" "}
                          {finding ? (
                            <Link href={`/audits/${finding.auditId}/capas`} className="hover:underline">
                              {auditName}
                            </Link>
                          ) : auditName}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <CapaStatusBadge status={c.status} />
                      {c.dueDate && (
                        <span className={`text-xs ${overdue ? "text-red-700" : dueSoon ? "text-amber-700" : "text-[var(--color-ink-faint)]"}`}>
                          Due {formatDate(c.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  {finding && (
                    <div className="mt-2">
                      <CapaActions capa={c} auditId={finding.auditId} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
