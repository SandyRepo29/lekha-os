"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Accent = "good" | "warn" | "danger" | "neutral" | "blue";

const accentMap: Record<Accent, { border: string; bg: string; text: string }> = {
  good:    { border: "border-l-emerald-500",  bg: "bg-emerald-500/[0.06]",  text: "text-emerald-400" },
  warn:    { border: "border-l-amber-500",    bg: "bg-amber-500/[0.06]",    text: "text-amber-400" },
  danger:  { border: "border-l-red-500",      bg: "bg-red-500/[0.06]",      text: "text-red-400" },
  neutral: { border: "border-l-[var(--color-line)]", bg: "bg-white/[0.03]", text: "text-[var(--color-ink)]" },
  blue:    { border: "border-l-[var(--color-blue)]", bg: "bg-[var(--color-blue)]/[0.06]", text: "text-[var(--color-blue)]" },
};

export function CcStat({
  label, value, accent = "neutral", href,
}: {
  label: string; value: string | number; accent?: Accent; href?: string;
}) {
  const a = accentMap[accent];
  const cls = cn(
    "rounded-xl border border-l-2 p-3 flex flex-col gap-1 transition-colors",
    a.border, a.bg,
    href && "hover:opacity-90 cursor-pointer"
  );
  const inner = (
    <>
      <span className={cn("text-xl font-bold tabular-nums", a.text)}>{value}</span>
      <span className="text-[11px] text-[var(--color-ink-dim)]">{label}</span>
    </>
  );
  return href ? <Link href={href} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

const RESULT_STYLES: Record<string, string> = {
  pass:               "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  fail:               "bg-red-500/10 text-red-400 border border-red-500/20",
  warning:            "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  unknown:            "bg-white/[0.06] text-[var(--color-ink-faint)] border border-[var(--color-line)]",
  exception_approved: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border border-red-500/20",
  high:     "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  medium:   "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  low:      "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  info:     "bg-white/[0.06] text-[var(--color-ink-faint)] border border-[var(--color-line)]",
};

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  draft:     "bg-white/[0.06] text-[var(--color-ink-faint)] border border-[var(--color-line)]",
  completed: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  cancelled: "bg-red-500/10 text-red-400 border border-red-500/20",
  overdue:   "bg-red-500/10 text-red-400 border border-red-500/20",
  inactive:  "bg-white/[0.06] text-[var(--color-ink-dim)] border border-[var(--color-line)]",
  approved:  "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  pending:   "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  rejected:  "bg-red-500/10 text-red-400 border border-red-500/20",
  open:      "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  resolved:  "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
};

const LEVEL_STYLES: Record<string, string> = {
  excellent:      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  good:           "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  needs_attention:"bg-amber-500/10 text-amber-400 border border-amber-500/20",
  at_risk:        "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  critical:       "bg-red-500/10 text-red-400 border border-red-500/20",
};

export function CheckResultBadge({ result }: { result: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", RESULT_STYLES[result] ?? RESULT_STYLES.unknown)}>
      {result.replace(/_/g, " ")}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.medium)}>
      {severity}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize", STATUS_STYLES[status] ?? STATUS_STYLES.inactive)}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function HealthLevelBadge({ level }: { level: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", LEVEL_STYLES[level] ?? LEVEL_STYLES.needs_attention)}>
      {level.replace(/_/g, " ")}
    </span>
  );
}

export function HealthBar({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const color = score >= 90 ? "bg-emerald-500" : score >= 75 ? "bg-blue-500" : score >= 60 ? "bg-amber-500" : score >= 40 ? "bg-orange-500" : "bg-red-500";
  const h = size === "sm" ? "h-1.5" : "h-2";
  return (
    <div className={cn("w-full rounded-full bg-white/[0.08]", h)}>
      <div className={cn("rounded-full transition-all", color, h)} style={{ width: `${Math.min(score, 100)}%` }} />
    </div>
  );
}

export function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, string> = {
    aws: "☁️", azure: "🔷", gcp: "🌐", github: "🐙",
    microsoft_365: "📧", google_workspace: "🔍", okta: "🔐",
    identity: "👤", network: "🔗", endpoint: "💻", custom: "⚙️",
  };
  return <span className="text-base">{icons[category] ?? "⚙️"}</span>;
}
