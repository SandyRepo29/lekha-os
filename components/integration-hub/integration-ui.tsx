import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---- IntegrationStat — border-l-2 accent stat card ----

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

export function IntegrationStat({
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

// ---- SyncStatusBadge ----

const SYNC_STATUS: Record<string, { label: string; cls: string }> = {
  running:   { label: "Running",   cls: "bg-[var(--color-blue)]/10 text-[var(--color-blue)]" },
  completed: { label: "Completed", cls: "bg-emerald-100 text-emerald-700" },
  failed:    { label: "Failed",    cls: "bg-red-100 text-red-700" },
  partial:   { label: "Partial",   cls: "bg-amber-100 text-amber-700" },
  queued:    { label: "Queued",    cls: "bg-white/5 text-[var(--color-ink-dim)]" },
  pending:   { label: "Pending",   cls: "bg-white/5 text-[var(--color-ink-dim)]" },
  cancelled: { label: "Cancelled", cls: "bg-white/5 text-[var(--color-ink-faint)]" },
};

export function SyncStatusBadge({ status }: { status: string }) {
  const { label, cls } = SYNC_STATUS[status] ?? {
    label: status,
    cls: "bg-white/5 text-[var(--color-ink-faint)]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ---- WebhookStatusBadge ----

const WEBHOOK_STATUS: Record<string, { label: string; cls: string }> = {
  active:   { label: "Active",   cls: "bg-emerald-100 text-emerald-700" },
  inactive: { label: "Inactive", cls: "bg-white/5 text-[var(--color-ink-faint)]" },
  error:    { label: "Error",    cls: "bg-red-100 text-red-700" },
};

export function WebhookStatusBadge({ isActive, hasError }: { isActive: boolean; hasError?: boolean }) {
  const key = hasError ? "error" : isActive ? "active" : "inactive";
  const { label, cls } = WEBHOOK_STATUS[key];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
