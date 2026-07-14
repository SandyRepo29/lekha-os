export const dynamic = "force-dynamic";

import Link from "next/link";
import { FileText, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listAudits } from "@/backend/src/modules/audit-management/audit-service";
import { AuditStatusBadge, AuditTypeBadge } from "@/components/audit/audit-status-badge";
import { formatDate } from "@/components/audit/audit-ui";

export default async function AuditReportsPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState icon={FileText} title="Reports" description="Connect Supabase to generate audit reports." />
      </Card>
    );
  }

  const audits = await listAudits(session.org.id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Audit Reports</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">
          Generate PDF and CSV reports for any audit.
        </p>
      </div>

      {audits.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No audits yet"
            description="Create an audit first to generate reports."
            action={
              <Link href="/audits/new" className="text-sm text-[var(--color-blue)] hover:underline">
                New Audit
              </Link>
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-[var(--color-line)]">
            {audits.map((a) => (
              <div key={a.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <AuditTypeBadge type={a.auditType} />
                      <AuditStatusBadge status={a.status} />
                      {a.endDate && (
                        <span className="text-xs text-[var(--color-ink-faint)]">
                          {formatDate(a.endDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`/reports/audits/${a.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-white px-3 py-1.5 text-xs text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> Full Report PDF
                  </a>
                  <a
                    href={`/reports/audits/${a.id}/findings`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-white px-3 py-1.5 text-xs text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> Findings PDF
                  </a>
                  <a
                    href={`/reports/audits/${a.id}/capas`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-white px-3 py-1.5 text-xs text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> CAPAs PDF
                  </a>
                  <a
                    href={`/reports/audits/${a.id}/findings/csv`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-white px-3 py-1.5 text-xs text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> Findings CSV
                  </a>
                  <a
                    href={`/reports/audits/${a.id}/capas/csv`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-white px-3 py-1.5 text-xs text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> CAPAs CSV
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
