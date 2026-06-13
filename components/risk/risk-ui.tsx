import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---- RiskStat — accent stat card (border-l-2 pattern) ----

type StatAccent = "danger" | "warn" | "good" | "neutral";

const ACCENT_BORDER: Record<StatAccent, string> = {
  danger:  "border-red-500/25",
  warn:    "border-amber-500/25",
  good:    "border-emerald-500/25",
  neutral: "border-[var(--color-line)]",
};

const ACCENT_LEFT_BAR: Record<StatAccent, string> = {
  danger:  "border-l-red-500/60",
  warn:    "border-l-amber-500/60",
  good:    "border-l-emerald-500/60",
  neutral: "border-l-[var(--color-line-strong)]",
};

const ACCENT_BG: Record<StatAccent, string> = {
  danger:  "bg-red-500/[0.04]",
  warn:    "bg-amber-500/[0.04]",
  good:    "bg-emerald-500/[0.04]",
  neutral: "",
};

export function RiskStat({
  label,
  value,
  accent = "neutral",
  sub,
  href,
}: {
  label: string;
  value: number | string;
  accent?: StatAccent;
  sub?: string;
  href?: string;
}) {
  const border  = ACCENT_BORDER[accent];
  const leftBar = ACCENT_LEFT_BAR[accent];
  const bg      = ACCENT_BG[accent];

  const inner = (
    <Card className={cn("border-l-2 px-4 py-3", border, leftBar, bg, href && "hover:bg-white/[0.03] transition-colors")}>
      <p className="text-xs text-[var(--color-ink-faint)]">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{sub}</p>}
    </Card>
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
