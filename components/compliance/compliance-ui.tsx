/**
 * Shared UI helpers for the Compliance module.
 * Extracts the repeated local components from individual pages:
 *   - ComplianceStat  (was StatChip / MiniStat / SummaryCard / GapStat)
 *   - FilterChip      (was FilterLink / FilterChip)
 *   - CoverageBar     (was CoverageBar / ReadinessBar)
 *   - SectionLabel    (uppercase section heading)
 *   - formatDate      (shared date formatter)
 */

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { scoreTextColor } from "@/lib/ui/colors";

// ---- Stat card ----------------------------------------------

type StatAccent = "danger" | "warn" | "good";

const ACCENT_BORDER: Record<StatAccent, string> = {
  danger: "border-red-500/25",
  warn:   "border-amber-500/25",
  good:   "border-emerald-500/25",
};

/**
 * Compact metric card used in stat strips across all compliance pages.
 *
 * @param size  "lg" = text-2xl (default), "sm" = text-xl
 * @param accent  Coloured border for warning/danger states
 */
export function ComplianceStat({
  label,
  value,
  color,
  accent,
  size = "lg",
}: {
  label: string;
  value: number | string;
  color?: string;
  accent?: StatAccent;
  size?: "lg" | "sm";
}) {
  const border = accent ? ACCENT_BORDER[accent] : "border-[var(--color-line)]";
  const valueSize = size === "sm" ? "text-xl" : "text-2xl";
  return (
    <Card className={`px-4 py-3 ${border}`}>
      <p className="text-xs text-[var(--color-ink-faint)]">{label}</p>
      <p
        className={`mt-1 font-[family-name:var(--font-display)] ${valueSize} font-bold ${
          color ?? "text-[var(--color-ink)]"
        }`}
      >
        {value}
      </p>
    </Card>
  );
}

// ---- Filter chip --------------------------------------------

/** Pill-style filter link — active state uses blue accent. */
export function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-[var(--color-blue)]/50 bg-[var(--color-blue)]/10 text-[var(--color-blue)]"
          : "border-[var(--color-line)] text-[var(--color-ink-dim)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink)]"
      }`}
    >
      {label}
    </Link>
  );
}

// ---- Coverage / readiness bar --------------------------------

/**
 * Horizontal bar showing a 0–100% coverage metric.
 * Used in both the dashboard framework cards and framework detail page.
 *
 * @param labelWidth  Tailwind width class for the label (default "w-32")
 */
export function CoverageBar({
  label,
  value,
  labelWidth = "w-32",
}: {
  label: string;
  value: number;
  labelWidth?: string;
}) {
  const fill =
    value >= 75
      ? "bg-emerald-500"
      : value >= 50
      ? "bg-[var(--color-blue)]"
      : value >= 25
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <span className={`${labelWidth} shrink-0 text-xs text-[var(--color-ink-faint)]`}>
        {label}
      </span>
      <div className="h-1.5 flex-1 rounded-full bg-white/[0.06]">
        <div
          className={`h-1.5 rounded-full transition-all ${fill}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`w-10 text-right text-xs font-semibold ${scoreTextColor(value)}`}>
        {value}%
      </span>
    </div>
  );
}

// ---- Section label ------------------------------------------

/** Uppercase section sub-heading (e.g. "PDF Reports", "CSV Exports"). */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
      {children}
    </h3>
  );
}

// ---- Date formatter -----------------------------------------

export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function isExpiredDate(d: string): boolean {
  return new Date(d) < new Date();
}
