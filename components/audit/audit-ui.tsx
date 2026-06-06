import Link from "next/link";
import { Card } from "@/components/ui/card";

const ACCENT_BORDER: Record<string, string> = {
  danger: "border-red-500/30",
  warn: "border-amber-500/30",
  good: "border-emerald-500/30",
  "": "",
};

export function AuditStat({
  label,
  value,
  accent,
  href,
}: {
  label: string;
  value: number | string;
  accent?: "danger" | "warn" | "good";
  href?: string;
}) {
  const inner = (
    <Card className={`px-4 py-3 ${accent ? ACCENT_BORDER[accent] : ""}`}>
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
