"use client";

import { cn } from "@/lib/utils";
import { ENTITY_COLORS, ENTITY_LABELS } from "@/lib/services/trust-graph/graph-constants";

export function EntityTypeBadge({ type, className }: { type: string; className?: string }) {
  const color = ENTITY_COLORS[type];
  const label = ENTITY_LABELS[type] ?? type;
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", className)}
      style={{ backgroundColor: `${color?.fill}22`, color: color?.stroke ?? "#fff", border: `1px solid ${color?.stroke}44` }}
    >
      {label}
    </span>
  );
}

export function GraphStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-white p-4">
      <p className="text-xs text-[var(--color-ink-faint)] mb-1">{label}</p>
      <p className={cn("text-2xl font-bold tabular-nums", accent ?? "text-[var(--color-ink)]")}>{value}</p>
      {sub && <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">{sub}</p>}
    </div>
  );
}

export function EntityLegend() {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(ENTITY_LABELS).map(([type, label]) => {
        const color = ENTITY_COLORS[type];
        return (
          <span
            key={type}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ backgroundColor: `${color?.fill}18`, color: color?.stroke }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color?.fill }} />
            {label}
          </span>
        );
      })}
    </div>
  );
}

export function ImpactSeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    Critical: "bg-red-100 text-red-700 border-red-200",
    High: "bg-orange-100 text-orange-700 border-orange-200",
    Medium: "bg-amber-100 text-amber-700 border-amber-200",
    Low: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold", styles[severity] ?? styles.Medium)}>
      {severity}
    </span>
  );
}
