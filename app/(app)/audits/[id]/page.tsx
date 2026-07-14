export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Sparkles, AlertTriangle, CheckSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getAudit } from "@/backend/src/modules/audit-management/audit-service";
import { listFindings } from "@/backend/src/modules/audit-management/finding-service";
import { listCapas } from "@/backend/src/modules/audit-management/capa-service";
import { getCachedSummary } from "@/backend/src/modules/audit-management/ai-audit-service";
import * as programRepo from "@/backend/src/modules/audit-management/audit-program-repo";
import {
  AuditStatusBadge,
  AuditTypeBadge,
  SeverityBadge,
  FindingStatusBadge,
  CapaStatusBadge,
} from "@/components/audit/audit-status-badge";
import { AuditStat, formatDate } from "@/components/audit/audit-ui";
import { AuditDetailActions } from "@/components/audit/audit-detail-actions";

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;

  if (session.demo || !session.org) notFound();

  const [audit, findings, capas, programs, aiSummary] = await Promise.all([
    getAudit(session.org.id, id),
    listFindings(session.org.id, { auditId: id }),
    listCapas(session.org.id),
    programRepo.findByAudit(session.org.id, id),
    getCachedSummary(session.org.id, id),
  ]);

  if (!audit) notFound();

  const auditCapas = capas.filter((c) =>
    findings.map((f) => f.id).includes(c.findingId)
  );
  const openFindings = findings.filter((f) => f.status === "open");
  const criticalFindings = findings.filter((f) => f.severity === "critical");
  const passedPrograms = programs.filter((p) => p.status === "passed").length;
  const failedPrograms = programs.filter((p) => p.status === "failed").length;

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <Link
        href="/audits/list"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to audits
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {audit.name}
            </h1>
            <AuditStatusBadge status={audit.status} />
            {audit.isOverdue && (
              <span className="rounded-full bg-red-100 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-700">
                Overdue
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--color-ink-dim)]">
            <AuditTypeBadge type={audit.auditType} />
            {audit.startDate && <span>From {formatDate(audit.startDate)}</span>}
            {audit.endDate && <span>· Due {formatDate(audit.endDate)}</span>}
            {audit.auditorName && <span>· {audit.auditorName}</span>}
          </div>
        </div>
        <AuditDetailActions audit={audit} />
      </div>

      {/* Metrics strip */}
      <div className="grid gap-3 sm:grid-cols-4">
        <AuditStat
          label="Findings"
          value={findings.length}
          accent={openFindings.length > 0 ? "warn" : undefined}
          href={`/audits/${id}/findings`}
        />
        <AuditStat
          label="Critical"
          value={criticalFindings.length}
          accent={criticalFindings.length > 0 ? "danger" : undefined}
        />
        <AuditStat
          label="Checks"
          value={programs.length}
          accent={failedPrograms > 0 ? "warn" : programs.length > 0 ? "good" : undefined}
        />
        <AuditStat
          label="CAPAs"
          value={auditCapas.length}
          accent={auditCapas.filter((c) => c.status !== "completed").length > 0 ? "warn" : undefined}
          href={`/audits/${id}/capas`}
        />
      </div>

      {/* AI Summary — prominent at top, above the detail grid */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--color-blue)]" />
            <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">
              AI Summary
            </h2>
          </div>
          <AuditGenerateSummaryButton auditId={id} />
        </div>
        {aiSummary ? (
          <p className="mt-3 text-sm text-[var(--color-ink-dim)] leading-relaxed">
            {aiSummary.content}
          </p>
        ) : (
          <p className="mt-3 text-xs text-[var(--color-ink-faint)]">
            No AI summary yet. Click Generate to create one.
          </p>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: audit details */}
        <div className="space-y-4 lg:col-span-1">
          <Card className="p-5">
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-sm font-semibold">
              Audit Details
            </h2>
            <dl className="space-y-2 text-sm">
              {audit.scope && (
                <>
                  <dt className="text-[var(--color-ink-faint)]">Scope</dt>
                  <dd className="text-[var(--color-ink-dim)]">{audit.scope}</dd>
                </>
              )}
              {audit.objective && (
                <>
                  <dt className="mt-2 text-[var(--color-ink-faint)]">Objective</dt>
                  <dd className="text-[var(--color-ink-dim)]">{audit.objective}</dd>
                </>
              )}
            </dl>
          </Card>
        </div>

        {/* Right: findings + program */}
        <div className="space-y-4 lg:col-span-2">
          {/* Findings */}
          <Card>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-line)]">
              <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">
                Findings ({findings.length})
              </h2>
              <Link href={`/audits/${id}/findings/new`}>
                <Button variant="ghost" size="sm">
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </Link>
            </div>
            {findings.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-[var(--color-ink-faint)]">
                No findings yet.{" "}
                <Link href={`/audits/${id}/findings/new`} className="text-[var(--color-blue)] hover:underline">
                  Add a finding
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-line)]">
                {findings.slice(0, 5).map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{f.title}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <SeverityBadge severity={f.severity} />
                      <FindingStatusBadge status={f.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {findings.length > 5 && (
              <div className="border-t border-[var(--color-line)] px-5 py-3">
                <Link
                  href={`/audits/${id}/findings`}
                  className="text-xs text-[var(--color-blue)] hover:underline"
                >
                  View all {findings.length} findings →
                </Link>
              </div>
            )}
          </Card>

          {/* Audit program checklist */}
          {programs.length > 0 && (
            <Card>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-line)]">
                <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">
                  Audit Program ({programs.length} checks)
                </h2>
                <span className="text-xs text-[var(--color-ink-faint)]">
                  {passedPrograms} passed · {failedPrograms} failed
                </span>
              </div>
              <div className="divide-y divide-[var(--color-line)]">
                {programs.slice(0, 8).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-2.5">
                    <CheckSquare
                      className={`h-4 w-4 shrink-0 ${
                        p.status === "passed"
                          ? "text-emerald-700"
                          : p.status === "failed"
                          ? "text-red-700"
                          : "text-[var(--color-ink-faint)]"
                      }`}
                    />
                    <span className="text-sm text-[var(--color-ink-dim)]">{p.title}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function AuditGenerateSummaryButton({ auditId }: { auditId: string }) {
  return (
    <form
      action={async () => {
        "use server";
        const { generateAuditSummaryAction } = await import("@/backend/src/modules/audit-management/actions");
        await generateAuditSummaryAction(auditId);
      }}
    >
      <button
        type="submit"
        className="text-xs text-[var(--color-blue)] hover:underline"
      >
        Generate
      </button>
    </form>
  );
}
