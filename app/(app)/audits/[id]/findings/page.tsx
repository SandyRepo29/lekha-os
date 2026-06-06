export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getAudit } from "@/lib/services/audit/audit-service";
import { listFindings } from "@/lib/services/audit/finding-service";
import { listCapas } from "@/lib/services/audit/capa-service";
import {
  SeverityBadge,
  FindingStatusBadge,
} from "@/components/audit/audit-status-badge";
import { FindingActions } from "@/components/audit/finding-actions";

export default async function AuditFindingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;
  if (session.demo || !session.org) notFound();

  const [audit, findings, capas] = await Promise.all([
    getAudit(session.org.id, id),
    listFindings(session.org.id, { auditId: id }),
    listCapas(session.org.id),
  ]);
  if (!audit) notFound();

  return (
    <div className="space-y-4">
      <Link
        href={`/audits/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {audit.name}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Findings — {audit.name}
        </h1>
        <Link href={`/audits/${id}/findings/new`}>
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4" /> Add Finding
          </Button>
        </Link>
      </div>

      {findings.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-[var(--color-ink-faint)]">No findings yet.</p>
          <Link href={`/audits/${id}/findings/new`} className="mt-2 inline-block text-sm text-[var(--color-blue)] hover:underline">
            Add the first finding
          </Link>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-[var(--color-line)]">
            {findings.map((f) => {
              const findingCapas = capas.filter((c) => c.findingId === f.id);
              return (
                <div key={f.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{f.title}</p>
                      {f.description && (
                        <p className="mt-0.5 text-sm text-[var(--color-ink-dim)] line-clamp-2">
                          {f.description}
                        </p>
                      )}
                      {f.recommendation && (
                        <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
                          Rec: {f.recommendation}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <SeverityBadge severity={f.severity} />
                      <FindingStatusBadge status={f.status} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-[var(--color-ink-faint)]">
                      {findingCapas.length} CAPA{findingCapas.length !== 1 ? "s" : ""}
                    </span>
                    <FindingActions finding={f} auditId={id} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
