export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getAudit } from "@/backend/src/modules/audit-management/audit-service";
import { listFindings } from "@/backend/src/modules/audit-management/finding-service";
import { listCapas } from "@/backend/src/modules/audit-management/capa-service";
import { CapaStatusBadge } from "@/components/audit/audit-status-badge";
import { formatDate } from "@/components/audit/audit-ui";
import { NewCapaForm } from "@/components/audit/new-capa-form";
import { CapaActions } from "@/components/audit/capa-actions";

export default async function AuditCapasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  if (session.demo || !session.org) notFound();

  const [audit, findings, capas] = await Promise.all([
    getAudit(session.org.id, id),
    listFindings(session.org.id, { auditId: id }),
    listCapas(session.org.id),
  ]);
  if (!audit) notFound();

  const auditCapas = capas.filter((c) =>
    findings.map((f) => f.id).includes(c.findingId)
  );
  const preselectedFinding = sp.findingId ?? "";

  return (
    <div className="space-y-6">
      <Link
        href={`/audits/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to audit
      </Link>

      <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
        CAPAs — {audit.name}
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* New CAPA form */}
        <Card className="p-5">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-sm font-semibold">
            Add CAPA
          </h2>
          <NewCapaForm
            auditId={id}
            findings={findings}
            preselectedFindingId={preselectedFinding}
          />
        </Card>

        {/* CAPA list */}
        <Card>
          <div className="px-5 py-4 border-b border-[var(--color-line)]">
            <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">
              Corrective Actions ({auditCapas.length})
            </h2>
          </div>
          {auditCapas.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[var(--color-ink-faint)]">
              No CAPAs assigned yet.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line)]">
              {auditCapas.map((c) => {
                const finding = findings.find((f) => f.id === c.findingId);
                return (
                  <div key={c.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{c.title}</p>
                        {finding && (
                          <p className="text-xs text-[var(--color-ink-faint)]">
                            Finding: {finding.title}
                          </p>
                        )}
                        {c.dueDate && (
                          <p className="text-xs text-[var(--color-ink-dim)]">
                            Due: {formatDate(c.dueDate)}
                          </p>
                        )}
                      </div>
                      <CapaStatusBadge status={c.status} />
                    </div>
                    <div className="mt-2">
                      <CapaActions capa={c} auditId={id} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
