export const dynamic = "force-dynamic";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listFindings } from "@/lib/services/audit/finding-service";
import { listAudits } from "@/lib/services/audit/audit-service";
import { SeverityBadge, FindingStatusBadge } from "@/components/audit/audit-status-badge";
import { AuditFilterChip } from "@/components/audit/audit-ui";

const SEVERITY_FILTERS = [
  { label: "All", value: "" },
  { label: "Critical", value: "critical" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

const STATUS_FILTERS = [
  { label: "All Statuses", value: "" },
  { label: "Open", value: "open" },
  { label: "Remediating", value: "remediating" },
  { label: "Closed", value: "closed" },
];

export default async function AllFindingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await requireUser();
  const params = await searchParams;
  const severity = params.severity ?? "";
  const status = params.status ?? "open";

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState icon={AlertTriangle} title="Findings" description="Connect Supabase to view findings." />
      </Card>
    );
  }

  const [findings, audits] = await Promise.all([
    listFindings(session.org.id, { severity: severity || undefined, status: status || undefined }),
    listAudits(session.org.id),
  ]);

  const auditMap = new Map(audits.map((a) => [a.id, a.name]));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">All Findings</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">{findings.length} finding{findings.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SEVERITY_FILTERS.map((f) => (
          <AuditFilterChip
            key={f.value}
            href={`/audits/findings?severity=${f.value}&status=${status}`}
            label={f.label}
            active={severity === f.value}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <AuditFilterChip
            key={f.value}
            href={`/audits/findings?severity=${severity}&status=${f.value}`}
            label={f.label}
            active={status === f.value}
          />
        ))}
      </div>

      {findings.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-[var(--color-ink-faint)]">No findings match the selected filters.</p>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-[var(--color-line)]">
            {findings.map((f) => (
              <Link
                key={f.id}
                href={`/audits/${f.auditId}/findings`}
                className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-white transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.title}</p>
                  <p className="text-xs text-[var(--color-ink-faint)]">
                    {auditMap.get(f.auditId) ?? "Unknown audit"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <SeverityBadge severity={f.severity} />
                  <FindingStatusBadge status={f.status} />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
