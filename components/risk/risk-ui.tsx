import Link from "next/link";
import { cn } from "@/lib/utils";

// ---- RiskStat — small stat chip ----

export function RiskStat({
  label,
  value,
  accent,
  href,
}: {
  label: string;
  value: number;
  accent?: "warn" | "danger" | "good";
  href?: string;
}) {
  const color =
    accent === "danger"
      ? "text-red-400"
      : accent === "warn"
      ? "text-amber-400"
      : accent === "good"
      ? "text-emerald-400"
      : "text-[var(--color-ink)]";

  const inner = (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 px-4 py-3 text-center hover:bg-white/[0.03] transition-colors">
      <p className={cn("font-[family-name:var(--font-display)] text-xl font-bold", color)}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-[var(--color-ink-faint)]">{label}</p>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ---- RiskFilterChip ----

export function RiskFilterChip({
  label,
  active,
  href,
}: {
  label: string;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-[var(--color-blue)]/20 text-[var(--color-blue)]"
          : "bg-white/[0.04] text-[var(--color-ink-dim)] hover:bg-white/[0.07]"
      )}
    >
      {label}
    </Link>
  );
}

// ---- formatDate ----

export function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
  } catch {
    return d;
  }
}

// ---- isDueSoon / isOverdue ----

export function isDueSoon(date: string | null | undefined, days = 30): boolean {
  if (!date) return false;
  const diff = new Date(date).getTime() - Date.now();
  return diff > 0 && diff < days * 86400_000;
}

export function isOverdue(date: string | null | undefined): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

// ---- Score matrix cell color ----

export function heatMapCellColor(impact: number, likelihood: number): string {
  const score = impact * likelihood;
  if (score <= 5) return "bg-emerald-500/20 text-emerald-300";
  if (score <= 10) return "bg-lime-500/20 text-lime-300";
  if (score <= 15) return "bg-amber-500/20 text-amber-300";
  if (score <= 20) return "bg-red-500/20 text-red-400";
  return "bg-purple-600/25 text-purple-300";
}
