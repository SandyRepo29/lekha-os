"use client";

import Link from "next/link";
import { Download, Archive, ArrowUp, ArrowDown, ArrowUpDown, CheckSquare2, Square } from "lucide-react";
import { useSelection } from "@/hooks/use-selection";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { RiskStatusBadge, RiskScoreBadge, RiskCategoryBadge } from "@/components/risk/risk-status-badge";
import { formatDate, isOverdue } from "@/components/risk/risk-ui";
import { TREATMENT_STRATEGY_LABELS } from "@/lib/services/risk-scoring";

export interface RiskListItem {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  status?: string | null;
  ownerName?: string | null;
  impact?: number | null;
  likelihood?: number | null;
  inherentScore?: number | null;
  treatmentStrategy?: string | null;
  targetDate?: string | null;
}

interface SortHeaderProps {
  column: string;
  label: string;
  currentSort: string;
  currentOrder: string;
  onSort: (col: string, order: string) => void;
}

function SortHeader({ column, label, currentSort, currentOrder, onSort }: SortHeaderProps) {
  const active = currentSort === column;
  const nextOrder = active && currentOrder === "asc" ? "desc" : "asc";
  return (
    <button
      onClick={() => onSort(column, nextOrder)}
      className={`inline-flex items-center gap-1 text-xs font-medium transition-colors hover:text-[var(--color-ink)] ${active ? "text-[var(--color-ink)]" : "text-[var(--color-ink-faint)]"}`}>
      {label}
      {active ? (nextOrder === "asc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
    </button>
  );
}

export interface RiskListTableProps {
  risks: RiskListItem[];
  canEdit?: boolean;
  canDelete?: boolean;
  sortBy?: string;
  sortOrder?: string;
  onSort?: (col: string, order: string) => void;
}

export function RiskListTable({
  risks,
  canEdit = false,
  canDelete = false,
  sortBy = "title",
  sortOrder = "asc",
  onSort,
}: RiskListTableProps) {
  const {
    allSelected,
    isSelected,
    toggleAll,
    toggleItem,
    clearAll,
    selected,
  } = useSelection(risks);

  const selectedIds = Array.from(selected);
  const exportUrl = `/reports/risks/csv?ids=${selectedIds.join(",")}`;

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
            label: "Update Status (Batch)",
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
      <div className="overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)]">
              <th className="px-4 py-3 text-left w-10">
                <button onClick={toggleAll} className="grid place-items-center text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors">
                  {allSelected ? <CheckSquare2 className="h-4 w-4 text-[var(--color-blue)]" /> : <Square className="h-4 w-4" />}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader column="title" label="Title" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader column="category" label="Category" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader column="status" label="Status" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left font-medium text-xs text-[var(--color-ink-faint)]">Owner</th>
              <th className="px-4 py-3 text-center font-medium text-xs text-[var(--color-ink-faint)]">I &#215; L</th>
              <th className="px-4 py-3 text-center">
                <SortHeader column="score" label="Score" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
              </th>
              <th className="px-4 py-3 text-left font-medium text-xs text-[var(--color-ink-faint)]">Treatment</th>
              <th className="px-4 py-3 text-left font-medium text-xs text-[var(--color-ink-faint)]">Due Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line)]">
            {risks.map((r) => {
              const due = r.targetDate ? isOverdue(r.targetDate) : false;
              const isSel = isSelected(r.id);
              return (
                <tr key={r.id} className={`hover:bg-white/[0.02] transition-colors ${isSel ? "bg-[var(--color-blue)]/[0.04]" : ""}`}>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleItem(r.id)} className="grid place-items-center text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors">
                      {isSel ? <CheckSquare2 className="h-4 w-4 text-[var(--color-blue)]" /> : <Square className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/risks/${r.id}`} className="font-medium hover:text-[var(--color-blue)] transition-colors line-clamp-1">
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <RiskCategoryBadge category={r.category} />
                  </td>
                  <td className="px-4 py-3">
                    <RiskStatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">
                    {r.ownerName ?? "&#8212;"}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-[var(--color-ink-dim)]">
                    {r.impact} &#215; {r.likelihood}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <RiskScoreBadge score={r.inherentScore} />
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">
                    {TREATMENT_STRATEGY_LABELS[r.treatmentStrategy ?? ""] ?? "&#8212;"}
                  </td>
                  <td className={`px-4 py-3 text-xs ${due ? "text-red-400" : "text-[var(--color-ink-dim)]"}`}>
                    {formatDate(r.targetDate)}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/risks/${r.id}`} className="text-xs text-[var(--color-blue)] hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <BulkActionBar
        selectedCount={selected.size}
        onClearSelection={clearAll}
        actions={bulkActions}
      />
    </>
  );
}
