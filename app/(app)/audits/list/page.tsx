export const dynamic = "force-dynamic";

import Link from "next/link";
import { ClipboardCheck, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listAudits } from "@/lib/services/audit/audit-service";
import {
  AuditStatusBadge,
  AuditTypeBadge,
} from "@/components/audit/audit-status-badge";
import { AuditFilterChip, formatDate } from "@/components/audit/audit-ui";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Planned", value: "planned" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const TYPE_FILTERS = [
  { label: "All Types", value: "" },
  { label: "Internal", value: "internal" },
  { label: "External", value: "external" },
  { label: "Vendor", value: "vendor" },
  { label: "Security", value: "security" },
  { label: "Compliance", value: "compliance" },
  { label: "Regulatory", value: "regulatory" },
];

export default async function AuditListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await requireUser();
  const params = await searchParams;
  const statusFilter = params.status ?? "";
  const typeFilter = params.type ?? "";

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState icon={ClipboardCheck} title="Audits" description="Connect Supabase to manage audits." />
      </Card>
    );
  }

  const allAudits = await listAudits(session.org.id);
  const filtered = allAudits.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (typeFilter && a.auditType !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
          All Audits
        </h1>
        <Link href="/audits/new">
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4" /> New Audit
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <AuditFilterChip
            key={f.value}
            href={`/audits/list?status=${f.value}&type=${typeFilter}`}
            label={f.label}
            active={statusFilter === f.value}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => (
          <AuditFilterChip
            key={f.value}
            href={`/audits/list?status=${statusFilter}&type=${f.value}`}
            label={f.label}
            active={typeFilter === f.value}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardCheck}
            title="No audits found"
            description={
              statusFilter || typeFilter
                ? "No audits match the selected filters."
                : "Create your first audit to get started."
            }
            action={
              <Link href="/audits/new">
                <Button variant="primary" size="sm">
                  <Plus className="h-4 w-4" /> New Audit
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-[var(--color-line)]">
            {filtered.map((a) => (
              <Link
                key={a.id}
                href={`/audits/${a.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-ink-dim)]">
                    <AuditTypeBadge type={a.auditType} />
                    {a.startDate && <span>From {formatDate(a.startDate)}</span>}
                    {a.endDate && <span>· Due {formatDate(a.endDate)}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <AuditStatusBadge status={a.status} />
                  <span className="text-xs text-[var(--color-ink-faint)]">
                    {a.totalFindings} finding{a.totalFindings !== 1 ? "s" : ""} ·{" "}
                    {a.programCount} checks
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
