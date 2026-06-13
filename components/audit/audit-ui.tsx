import Link from "next/link";
import { Card } from "@/components/ui/card";

type StatAccent = "danger" | "warn" | "good";

const ACCENT_BORDER: Record<StatAccent, string> = {
  danger: "border-red-500/25",
  warn:   "border-amber-500/25",
  good:   "border-emerald-500/25",
};

const ACCENT_LEFT_BAR: Record<StatAccent, string> = {
  danger: "border-l-red-500/60",
  warn:   "border-l-amber-500/60",
  good:   "border-l-emerald-500/60",
};

const ACCENT_BG: Record<StatAccent, string> = {
  danger: "bg-red-500/[0.04]",
  warn:   "bg-amber-500/[0.04]",
  good:   "bg-emerald-500/[0.04]",
};

export function AuditStat({
  label,
  value,
  accent,
  href,
}: {
  label: string;
  value: number | string;
  accent?: StatAccent;
  href?: string;
}) {
  const border  = accent ? ACCENT_BORDER[accent]  : "border-[var(--color-line)]";
  const leftBar = accent ? ACCENT_LEFT_BAR[accent] : "border-l-[var(--color-line-strong)]";
  const bg      = accent ? ACCENT_BG[accent]       : "";

  const inner = (
    <Card className={`border-l-2 px-4 py-3 ${border} ${leftBar} ${bg}`}>
      <p className="text-xs text-[var(--color-ink-faint)]">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
        {value}
      </p>
    </Card>
  );
  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

export function AuditFilterChip({
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
          : "border-[var(--color-line)] text-[var(--color-ink-dim)] hover:border-[var(--color-blue)]/30"
      }`}
    >
      {label}
    </Link>
  );
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function isDueSoon(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  return due <= in30 && due >= new Date();
}

export function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}
