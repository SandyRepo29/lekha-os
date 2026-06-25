"use client";

import Link from "next/link";
import {
  CheckSquare2, Square, Eye, BarChart2, ExternalLink,
  Download, Archive, FileText, ArrowRight,
  TrendingUp, TrendingDown, Minus, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import { useSelection } from "@/hooks/use-selection";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Badge } from "@/components/ui/badge";
import { riskTone } from "@/lib/ui-maps";
import { scoreTextColor } from "@/lib/ui/colors";
import type { VendorRow } from "@/lib/services/vendor-service";

const LIFECYCLE_COLORS: Record<string, string> = {
  discover:  "border-slate-500/30 bg-slate-500/10 text-slate-400",
  inventory: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  classify:  "border-violet-500/30 bg-violet-500/10 text-violet-400",
  assess:    "border-purple-500/30 bg-purple-500/10 text-purple-400",
  risk:      "border-orange-500/30 bg-orange-500/10 text-orange-400",
  comply:    "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  monitor:   "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  audit:     "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  renew:     "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
  offboard:  "border-red-500/30 bg-red-500/10 text-red-400",
};

const LIFECYCLE_LABELS: Record<string, string> = {
  discover: "Discover", inventory: "Inventory", classify: "Classify",
  assess: "Assess", risk: "Risk Review", comply: "Comply",
  monitor: "Monitor", audit: "Audit", renew: "Renew", offboard: "Offboard",
};

function LifecycleBadge({ stage }: { stage: string }) {
  const cls = LIFECYCLE_COLORS[stage] ?? "border-[var(--color-line)] bg-white/5 text-[var(--color-ink-faint)]";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {LIFECYCLE_LABELS[stage] ?? stage}
    </span>
  );
}

type HealthLevel = "Excellent" | "Good" | "Monitor" | "At Risk" | "Critical";

function getHealth(v: VendorRow): { label: HealthLevel; cls: string } {
  if (v.risk === "critical" || v.score < 35)
    return { label: "Critical",  cls: "text-red-400 border-red-500/30 bg-red-500/10" };
  if (v.risk === "high" || v.score < 50 || v.expired > 1)
    return { label: "At Risk",   cls: "text-orange-400 border-orange-500/30 bg-orange-500/10" };
  if (v.score < 65 || v.expired > 0 || v.expiring > 1)
    return { label: "Monitor",   cls: "text-amber-400 border-amber-500/30 bg-amber-500/10" };
  if (v.score >= 80 && v.expired === 0 && v.risk === "low")
    return { label: "Excellent", cls: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" };
  return { label: "Good",      cls: "text-green-400 border-green-500/30 bg-green-500/10" };
}

type TrendDir = "up" | "down" | "stable";

function getTrend(v: VendorRow): TrendDir {
  if (v.risk === "critical" || v.expired > 0) return "down";
  if (v.score >= 75 && v.expiring === 0 && (v.risk === "low" || v.risk === "medium")) return "up";
  return "stable";
}

function TrendBadge({ dir }: { dir: TrendDir }) {
  if (dir === "up")
    return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-400"><TrendingUp className="h-3 w-3" />Up</span>;
  if (dir === "down")
    return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-red-400"><TrendingDown className="h-3 w-3" />Down</span>;
  return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[var(--color-ink-faint)]"><Minus className="h-3 w-3" />Stable</span>;
}

type ActionPriority = "high" | "medium" | "low";

function getNextAction(v: VendorRow): { label: string; href: string; priority: ActionPriority } {
  if (!v.ownerName)
    return { label: "Assign Owner",    href: `/vendors/${v.id}/edit`,       priority: "medium" };
  if (v.expired > 0)
    return { label: "Upload Evidence", href: `/vendors/${v.id}`,            priority: "high" };
  if (v.risk === "critical")
    return { label: "Review Risk",     href: `/risks/list`,                 priority: "high" };
  if (v.lifecycleStage === "assess")
    return { label: "Run Assessment",  href: `/vendors/${v.id}/assessment`, priority: "medium" };
  if (v.lifecycleStage === "renew")
    return { label: "Renew Contract",  href: `/vendors/${v.id}`,            priority: "high" };
  if (v.lifecycleStage === "audit")
    return { label: "Schedule Audit",  href: `/audits/new`,                 priority: "medium" };
  if (v.expiring > 0)
    return { label: "Renew Docs",      href: `/vendors/${v.id}`,            priority: "medium" };
  return { label: "No Action",         href: `/vendors/${v.id}`,            priority: "low" };
}

const ACTION_PRIORITY_CLS: Record<ActionPriority, string> = {
  high:   "text-red-400",
  medium: "text-amber-400",
  low:    "text-[var(--color-ink-faint)]",
};

function SortBtn({ col, label, sortBy, sortOrder, onSort }: {
  col: string; label: string; sortBy: string; sortOrder: "asc" | "desc";
  onSort: (col: string, order: "asc" | "desc") => void;
}) {
  const active = sortBy === col;
  const next: "asc" | "desc" = active && sortOrder === "asc" ? "desc" : "asc";
  return (
    <button onClick={() => onSort(col, next)}
      className={`flex items-center gap-1 transition-colors hover:text-[var(--color-ink)] ${active ? "text-[var(--color-ink)]" : ""}`}>
      {label}
      {active ? (sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
    </button>
  );
}

export interface VendorListTableProps {
  vendors: VendorRow[];
  canEdit?: boolean;
  canDelete?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (col: string, order: "asc" | "desc") => void;
  emptyMessage?: string;
}

export function VendorListTable({
  vendors,
  canEdit = false,
  canDelete = false,
  sortBy = "name",
  sortOrder = "asc",
  onSort,
  emptyMessage = "No vendors match your filters.",
}: VendorListTableProps) {
  const {
    allSelected,
    isSelected,
    toggleAll,
    toggleItem,
    clearAll,
    selected,
  } = useSelection(vendors);

  const selectedIds = Array.from(selected);
  const exportUrl = `/api/v1/vendors/export/csv?ids=${selectedIds.join(",")}`;

  const bulkActions = [
    {
      label: "Export Selected",
      icon: <Download className="h-3.5 w-3.5" />,
      onClick: () => {
        window.location.href = exportUrl;
      },
    },
    ...(canEdit
      ? [
          {
            label: "Update Status",
            icon: <Archive className="h-3.5 w-3.5" />,
            onClick: () => {
              alert("This action will be available in the next update");
            },
          },
        ]
      : []),
    ...(canDelete
      ? [
          {
            label: "Archive Selected",
            icon: <Archive className="h-3.5 w-3.5" />,
            onClick: () => {
              alert("This action will be available in the next update");
            },
            danger: true,
          },
        ]
      : []),
  ];

  const handleSort = onSort ?? (() => {});

  return (
    <>
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white/[0.035]">
        <div className="hidden grid-cols-[40px_minmax(0,2.5fr)_130px_110px_90px_80px_100px_minmax(0,1.2fr)_96px] items-center gap-3 border-b border-[var(--color-line)] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)] lg:grid">
          <button onClick={toggleAll} className="grid place-items-center text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors">
            {allSelected ? <CheckSquare2 className="h-4 w-4 text-[var(--color-blue)]" /> : <Square className="h-4 w-4" />}
          </button>
          <SortBtn col="name" label="Vendor" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
          <span>Owner</span>
          <span>Stage</span>
          <SortBtn col="score" label="Trust" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
          <SortBtn col="risk" label="Risk" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
          <span>Health</span>
          <span>Next Action</span>
          <span className="text-right">Actions</span>
        </div>

        {vendors.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[var(--color-ink-dim)]">
            {emptyMessage}
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {vendors.map((v) => {
              const health = getHealth(v);
              const trend = getTrend(v);
              const action = getNextAction(v);
              const isSel = isSelected(v.id);
              return (
                <div key={v.id}
                  className={`grid grid-cols-1 gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.025] lg:grid-cols-[40px_minmax(0,2.5fr)_130px_110px_90px_80px_100px_minmax(0,1.2fr)_96px] lg:items-center lg:gap-3 ${isSel ? "bg-[var(--color-blue)]/[0.04]" : ""}`}>

                  <button onClick={() => toggleItem(v.id)} className="hidden lg:grid place-items-center text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors">
                    {isSel ? <CheckSquare2 className="h-4 w-4 text-[var(--color-blue)]" /> : <Square className="h-4 w-4" />}
                  </button>

                  <Link href={`/vendors/${v.id}`} className="flex items-center gap-3 min-w-0">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] font-[family-name:var(--font-display)] text-sm font-bold text-[var(--color-ink-dim)]">
                      {v.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[var(--color-ink)] hover:text-[var(--color-blue)] transition-colors">{v.name}</div>
                      <div className="truncate text-[11px] text-[var(--color-ink-faint)]">{v.category ?? "Uncategorized"}</div>
                    </div>
                  </Link>

                  <div className="hidden lg:block min-w-0">
                    {v.ownerName ? (
                      <div>
                        <div className="truncate text-xs font-medium text-[var(--color-ink-dim)]">{v.ownerName}</div>
                        {v.ownerDepartment && <div className="truncate text-[11px] text-[var(--color-ink-faint)]">{v.ownerDepartment}</div>}
                      </div>
                    ) : (
                      <span className="text-[11px] text-[var(--color-ink-faint)] italic">Unassigned</span>
                    )}
                  </div>

                  <div className="hidden lg:block">
                    <LifecycleBadge stage={v.lifecycleStage ?? "inventory"} />
                  </div>

                  <div className="hidden lg:flex items-center gap-1.5">
                    <span className={`font-[family-name:var(--font-display)] text-sm font-bold ${scoreTextColor(v.score)}`}>{v.score}</span>
                    <TrendBadge dir={trend} />
                  </div>

                  <div className="hidden lg:block">
                    <Badge tone={riskTone(v.risk)}>{v.risk}</Badge>
                  </div>

                  <div className="hidden lg:block">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${health.cls}`}>
                      {health.label}
                    </span>
                  </div>

                  <div className="hidden lg:block min-w-0">
                    {action.priority === "low" ? (
                      <span className="text-[11px] text-[var(--color-ink-faint)]">No Action</span>
                    ) : (
                      <Link href={action.href}
                        className={`inline-flex items-center gap-1 text-[11px] font-medium hover:underline transition-colors ${ACTION_PRIORITY_CLS[action.priority]}`}>
                        {action.label} <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>

                  <div className="hidden lg:flex items-center justify-end gap-0.5">
                    <Link href={`/vendors/${v.id}`} title="View"
                      className="rounded-lg p-1.5 text-[var(--color-ink-faint)] hover:bg-white/[0.06] hover:text-[var(--color-ink)] transition-colors">
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                    <Link href={`/risks/list?vendorId=${v.id}`} title="Risks"
                      className="rounded-lg p-1.5 text-[var(--color-ink-faint)] hover:bg-white/[0.06] hover:text-[var(--color-ink)] transition-colors">
                      <BarChart2 className="h-3.5 w-3.5" />
                    </Link>
                    <a href={`/vendors/${v.id}/executive-report`} target="_blank" rel="noopener noreferrer" title="Executive Report"
                      className="rounded-lg p-1.5 text-[var(--color-ink-faint)] hover:bg-white/[0.06] hover:text-[var(--color-ink)] transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between lg:hidden">
                    <div className="flex items-center gap-2">
                      <Badge tone={riskTone(v.risk)}>{v.risk}</Badge>
                      <LifecycleBadge stage={v.lifecycleStage ?? "inventory"} />
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${health.cls}`}>{health.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--color-ink-faint)]">
                      <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{v.docs}</span>
                      {v.expiring > 0 && <span className="text-amber-400">{v.expiring} exp</span>}
                      <Link href={`/vendors/${v.id}`} className="ml-1 text-[var(--color-blue)]">View</Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BulkActionBar
        selectedCount={selected.size}
        onClearSelection={clearAll}
        actions={bulkActions}
      />
    </>
  );
}
