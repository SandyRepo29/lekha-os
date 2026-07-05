"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SUB_NAV = [
  { href: "/continuous-compliance",                        label: "Overview" },
  { href: "/continuous-compliance/readiness",              label: "Framework Health" },
  { href: "/continuous-compliance/checks",                 label: "Control Monitoring" },
  { href: "/continuous-compliance/health",                 label: "Evidence Monitoring" },
  { href: "/continuous-compliance/vendor-compliance",      label: "Vendor Compliance" },
  { href: "/continuous-compliance/signals",                label: "Compliance Alerts" },
  { href: "/continuous-compliance/timeline",               label: "Timeline" },
  { href: "/continuous-compliance/reports",                label: "Reports" },
  { href: "/continuous-compliance/ai",                     label: "Compliance Copilot™" },
];

export function CcSubNav() {
  const path = usePathname();
  return (
    <div className="border-b border-[var(--color-line)] pb-1">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white p-1">
        {SUB_NAV.map(n => {
          const active = n.href === "/continuous-compliance"
            ? path === n.href
            : path === n.href || path.startsWith(n.href + "/");
          return (
            <Link key={n.href} href={n.href}
              className={cn(
                "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[#EEF2F7] text-[var(--color-ink)]"
                  : "text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] hover:text-[var(--color-ink)]"
              )}>
              {n.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

type Accent = "good" | "warn" | "danger" | "neutral" | "blue";

const accentMap: Record<Accent, { border: string; bg: string; text: string }> = {
  good:    { border: "border-l-emerald-500",  bg: "bg-emerald-500/[0.06]",  text: "text-emerald-700" },
  warn:    { border: "border-l-amber-500",    bg: "bg-amber-500/[0.06]",    text: "text-amber-700" },
  danger:  { border: "border-l-red-500",      bg: "bg-red-500/[0.06]",      text: "text-red-700" },
  neutral: { border: "border-l-[var(--color-line)]", bg: "bg-white", text: "text-[var(--color-ink)]" },
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
  pass:               "bg-emerald-100 text-emerald-700 border border-emerald-200",
  fail:               "bg-red-100 text-red-700 border border-red-200",
  warning:            "bg-amber-100 text-amber-700 border border-amber-200",
  unknown:            "bg-[#F8F9FB] text-[var(--color-ink-faint)] border border-[var(--color-line)]",
  exception_approved: "bg-purple-100 text-purple-700 border border-purple-200",
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border border-red-200",
  high:     "bg-orange-100 text-orange-700 border border-orange-200",
  medium:   "bg-amber-100 text-amber-700 border border-amber-200",
  low:      "bg-blue-100 text-blue-700 border border-blue-200",
  info:     "bg-[#F8F9FB] text-[var(--color-ink-faint)] border border-[var(--color-line)]",
};

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-emerald-100 text-emerald-700 border border-emerald-200",
  draft:     "bg-[#F8F9FB] text-[var(--color-ink-faint)] border border-[var(--color-line)]",
  completed: "bg-blue-100 text-blue-700 border border-blue-200",
  cancelled: "bg-red-100 text-red-700 border border-red-200",
  overdue:   "bg-red-100 text-red-700 border border-red-200",
  inactive:  "bg-[#F8F9FB] text-[var(--color-ink-dim)] border border-[var(--color-line)]",
  approved:  "bg-emerald-100 text-emerald-700 border border-emerald-200",
  pending:   "bg-amber-100 text-amber-700 border border-amber-200",
  rejected:  "bg-red-100 text-red-700 border border-red-200",
  open:      "bg-amber-100 text-amber-700 border border-amber-200",
  resolved:  "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

const LEVEL_STYLES: Record<string, string> = {
  excellent:      "bg-emerald-100 text-emerald-700 border border-emerald-200",
  good:           "bg-blue-100 text-blue-700 border border-blue-200",
  needs_attention:"bg-amber-100 text-amber-700 border border-amber-200",
  at_risk:        "bg-orange-100 text-orange-700 border border-orange-200",
  critical:       "bg-red-100 text-red-700 border border-red-200",
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
    <div className={cn("w-full rounded-full bg-[#EEF2F7]", h)}>
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
