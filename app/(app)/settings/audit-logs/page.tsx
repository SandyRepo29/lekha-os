export const dynamic = "force-dynamic";

import { Shield } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listByOrg, countByOrg } from "@/lib/repositories/audit-repo";
import { listMembers } from "@/backend/src/modules/team/team-repo";
import { AuditLogTable } from "@/components/settings/audit-log-table";

const PAGE_SIZE = 50;

const MODULE_OPTIONS = [
  { value: "", label: "All modules" },
  { value: "vendor", label: "Vendor" },
  { value: "document", label: "Documents" },
  { value: "team", label: "Team" },
  { value: "organization", label: "Organization" },
  { value: "compliance", label: "Compliance" },
  { value: "api_key", label: "API Keys" },
  { value: "integration", label: "Integrations" },
  { value: "security", label: "Security" },
];

function deriveSeverity(action: string): "critical" | "warning" | "info" {
  if (action.startsWith("security.") || action.startsWith("api_key.") || action.includes("ownership")) return "critical";
  if (action.startsWith("team.") || action.startsWith("organization.")) return "warning";
  return "info";
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await requireUser();
  const params = await searchParams;

  if (!session.org) {
    return <div className="text-[var(--color-ink-dim)]">No organization found.</div>;
  }

  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const userId = params.userId ?? "";
  const module = params.module ?? "";
  const search = params.search ?? "";
  const from = params.from ? new Date(params.from) : undefined;
  const to = params.to ? new Date(params.to) : undefined;

  const filters = { userId: userId || undefined, module: module || undefined, search: search || undefined, from, to };

  const [logs, total, members] = await Promise.all([
    listByOrg(session.org.id, { ...filters, page, pageSize: PAGE_SIZE }),
    countByOrg(session.org.id, filters),
    listMembers(session.org.id),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const logsWithSeverity = logs.map((l) => ({ ...l, severity: deriveSeverity(l.action) }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Audit Logs</h1>
          <p className="text-sm text-[var(--color-ink-dim)]">Complete activity trail for {session.orgName}.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-line)] bg-white px-3 py-2">
          <Shield className="h-4 w-4 text-[var(--color-blue)]" />
          <span className="text-sm font-semibold text-[var(--color-ink)]">{total.toLocaleString()}</span>
          <span className="text-sm text-[var(--color-ink-faint)]">events</span>
        </div>
      </div>

      <AuditLogTable
        logs={logsWithSeverity}
        members={members}
        moduleOptions={MODULE_OPTIONS}
        filters={{ userId, module, search, from: params.from ?? "", to: params.to ?? "" }}
        page={page}
        totalPages={totalPages}
        total={total}
        orgId={session.org.id}
      />
    </div>
  );
}
