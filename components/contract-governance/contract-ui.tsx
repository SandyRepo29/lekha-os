import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---- ContractStat — accent stat card (border-l-2 pattern) ----

export type StatAccent = "danger" | "warn" | "good" | "neutral";

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

export function ContractStat({
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
    <Card className={cn("border-l-2 px-4 py-3", border, leftBar, bg, href && "hover:bg-white transition-colors")}>
      <p className="text-xs text-[var(--color-ink-faint)]">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{sub}</p>}
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ---- ContractFilterChip ----

export function ContractFilterChip({
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
          : "bg-[#F8F9FB] text-[var(--color-ink-dim)] hover:bg-[#F8F9FB]"
      )}
    >
      {label}
    </Link>
  );
}

// ---- Contract status badge ----

const STATUS_STYLES: Record<string, string> = {
  draft:        "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]",
  review:       "text-amber-700 border-amber-200 bg-amber-100",
  negotiation:  "text-orange-700 border-orange-200 bg-orange-100",
  active:       "text-emerald-700 border-emerald-200 bg-emerald-100",
  expiring:     "text-amber-700 border-amber-200 bg-amber-100",
  expired:      "text-red-700 border-red-200 bg-red-100",
  renewed:      "text-[var(--color-blue)] border-[var(--color-blue)]/30 bg-[var(--color-blue)]/10",
  terminated:   "text-red-700 border-red-200 bg-red-100",
  archived:     "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]",
};

export function ContractStatusBadge({ status }: { status: string }) {
  const styles = STATUS_STYLES[status] ?? "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", styles)}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ---- Obligation status badge ----

const OBLIGATION_STATUS_STYLES: Record<string, string> = {
  open:        "text-amber-700 border-amber-200 bg-amber-100",
  in_progress: "text-[var(--color-blue)] border-[var(--color-blue)]/30 bg-[var(--color-blue)]/10",
  completed:   "text-emerald-700 border-emerald-200 bg-emerald-100",
  overdue:     "text-red-700 border-red-200 bg-red-100",
  waived:      "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]",
};

export function ObligationStatusBadge({ status }: { status: string }) {
  const styles = OBLIGATION_STATUS_STYLES[status] ?? "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap", styles)}>
      {status.replace("_", " ")}
    </span>
  );
}

// ---- Clause risk badge ----

const CLAUSE_RISK_STYLES: Record<string, string> = {
  low:      "text-emerald-700 border-emerald-200 bg-emerald-100",
  medium:   "text-amber-700 border-amber-200 bg-amber-100",
  high:     "text-red-700 border-red-200 bg-red-100",
  critical: "text-red-800 border-red-300 bg-red-200",
};

export function ClauseRiskBadge({ level }: { level: string }) {
  const styles = CLAUSE_RISK_STYLES[level] ?? "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", styles)}>
      {level}
    </span>
  );
}
