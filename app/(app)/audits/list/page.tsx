export const dynamic = "force-dynamic";

import Link from "next/link";
import { ClipboardCheck, Plus, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listAudits } from "@/backend/src/modules/audit-management/audit-service";
import {
  AuditStatusBadge,
  AuditTypeBadge,
} from "@/components/audit/audit-status-badge";
import { AuditFilterChip, formatDate } from "@/components/audit/audit-ui";
import { SearchInput } from "@/components/ui/search-input";

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

function SortHeader({ column, label, currentSort, currentOrder, base }: {
  column: string; label: string; currentSort: string; currentOrder: string; base: URLSearchParams;
}) {
  const active = currentSort === column;
  const nextOrder = active && currentOrder === "asc" ? "desc" : "asc";
  const p = new URLSearchParams(base);
  p.set("sortBy", column);
  p.set("sortOrder", nextOrder);
  return (
    <Link href={`/audits/list?${p.toString()}`}
      className={`inline-flex items-center gap-1 text-xs font-medium transition-colors hover:text-[var(--color-ink)] ${active ? "text-[var(--color-ink)]" : "text-[var(--color-ink-faint)]"}`}>
      {label}
      {active ? (nextOrder === "asc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
    </Link>
  );
}

const STATUS_ORDER: Record<string, number> = { planned: 0, in_progress: 1, completed: 2, cancelled: 3 };

export default async function AuditListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await requireUser();
  const params = await searchParams;
  const statusFilter = params.status ?? "";
  const typeFilter = params.type ?? "";
  const searchFilter = params.search?.toLowerCase() ?? "";
  const sortBy = params.sortBy ?? "name";
  const sortOrder = params.sortOrder === "desc" ? "desc" : "asc";

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState icon={ClipboardCheck} title="Audits" description="Connect Supabase to manage audits." />
      </Card>
    );
  }

  const allAudits = await listAudits(session.org.id);
  let filtered = allAudits.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (typeFilter && a.auditType !== typeFilter) return false;
    if (searchFilter && !a.name.toLowerCase().includes(searchFilter)) return false;
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "name")       cmp = a.name.localeCompare(b.name);
    else if (sortBy === "type")  cmp = (a.auditType ?? "").localeCompare(b.auditType ?? "");
    else if (sortBy === "status") cmp = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
    else if (sortBy === "startDate") cmp = (a.startDate ?? "").localeCompare(b.startDate ?? "");
    else if (sortBy === "endDate")   cmp = (a.endDate ?? "").localeCompare(b.endDate ?? "");
    return sortOrder === "asc" ? cmp : -cmp;
  });

  const baseParams = new URLSearchParams({ status: statusFilter, type: typeFilter, sortBy, sortOrder });

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

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput placeholder="Search audits&#8230;" />
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <AuditFilterChip
            key={f.value}
            href={`/audits/list?status=${f.value}&type=${typeFilter}&sortBy=${sortBy}&sortOrder=${sortOrder}${searchFilter ? `&search=${encodeURIComponent(searchFilter)}` : ""}`}
            label={f.label}
            active={statusFilter === f.value}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => (
          <AuditFilterChip
            key={f.value}
            href={`/audits/list?status=${statusFilter}&type=${f.value}&sortBy=${sortBy}&sortOrder=${sortOrder}${searchFilter ? `&search=${encodeURIComponent(searchFilter)}` : ""}`}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)]">
                  <th className="px-5 py-3 text-left"><SortHeader column="name" label="Name" currentSort={sortBy} currentOrder={sortOrder} base={baseParams} /></th>
                  <th className="px-5 py-3 text-left"><SortHeader column="type" label="Type" currentSort={sortBy} currentOrder={sortOrder} base={baseParams} /></th>
                  <th className="px-5 py-3 text-left"><SortHeader column="status" label="Status" currentSort={sortBy} currentOrder={sortOrder} base={baseParams} /></th>
                  <th className="px-5 py-3 text-left"><SortHeader column="startDate" label="Start" currentSort={sortBy} currentOrder={sortOrder} base={baseParams} /></th>
                  <th className="px-5 py-3 text-left"><SortHeader column="endDate" label="Due" currentSort={sortBy} currentOrder={sortOrder} base={baseParams} /></th>
                  <th className="px-5 py-3 text-left font-medium text-xs text-[var(--color-ink-faint)]">Findings</th>
                  <th className="px-5 py-3 text-left font-medium text-xs text-[var(--color-ink-faint)]">Checks</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-white transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/audits/${a.id}`} className="font-medium hover:text-[var(--color-blue)] transition-colors line-clamp-1">
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <AuditTypeBadge type={a.auditType} />
                    </td>
                    <td className="px-5 py-3">
                      <AuditStatusBadge status={a.status} />
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--color-ink-dim)]">
                      {formatDate(a.startDate)}
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--color-ink-dim)]">
                      {formatDate(a.endDate)}
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--color-ink-dim)]">
                      {a.totalFindings}
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--color-ink-dim)]">
                      {a.programCount}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/audits/${a.id}`} className="text-xs text-[var(--color-blue)] hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
