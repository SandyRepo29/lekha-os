"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Clock, XCircle, AlertCircle, Info } from "lucide-react";

// ─── Sub-nav ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/regulatory-intelligence",              label: "Dashboard" },
  { href: "/regulatory-intelligence/library",      label: "Regulation Library™" },
  { href: "/regulatory-intelligence/changes",      label: "Change Monitor™" },
  { href: "/regulatory-intelligence/obligations",  label: "Obligations™" },
  { href: "/regulatory-intelligence/assessments",  label: "Impact Assessments™" },
  { href: "/regulatory-intelligence/watchlists",   label: "Watchlists™" },
  { href: "/regulatory-intelligence/horizon",      label: "Compliance Horizon™" },
  { href: "/regulatory-intelligence/ai",           label: "AI Advisor™" },
];

export function RegSubNav() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white p-1 scrollbar-thin">
      {NAV_ITEMS.map(({ href, label }) => {
        const active =
          href === "/regulatory-intelligence"
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-[#EEF2F7] text-[var(--color-ink)]"
                : "text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] hover:text-[var(--color-ink)]"
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

type Accent = "neutral" | "good" | "warn" | "danger" | "purple";

const ACCENT_MAP: Record<Accent, { bar: string; bg: string; text: string }> = {
  neutral: { bar: "border-l-[var(--color-line)]",  bg: "bg-[var(--color-bg-2)]/60",       text: "text-[var(--color-ink)]" },
  good:    { bar: "border-l-emerald-500",           bg: "bg-emerald-500/[0.06]",            text: "text-emerald-400" },
  warn:    { bar: "border-l-amber-500",             bg: "bg-amber-500/[0.06]",              text: "text-amber-400" },
  danger:  { bar: "border-l-red-500",               bg: "bg-red-500/[0.06]",               text: "text-red-400" },
  purple:  { bar: "border-l-violet-500",            bg: "bg-violet-500/[0.06]",            text: "text-violet-400" },
};

export function RegStat({
  label, value, accent = "neutral", href,
}: { label: string; value: string | number; accent?: Accent; href?: string }) {
  const { bar, bg, text } = ACCENT_MAP[accent];
  const inner = (
    <div className={cn("rounded-2xl border-l-2 p-4", bar, bg)}>
      <div className={cn("text-2xl font-bold tabular-nums", text)}>{value}</div>
      <div className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Status Badges ────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/20 text-red-300 border-red-500/30",
  high:     "bg-orange-500/20 text-orange-300 border-orange-500/30",
  medium:   "bg-amber-500/20 text-amber-300 border-amber-500/30",
  low:      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
      SEVERITY_STYLES[severity] ?? "bg-white/10 text-[var(--color-ink-dim)] border-[var(--color-line)]")}>
      {severity}
    </span>
  );
}

const CHANGE_STATUS_STYLES: Record<string, string> = {
  new:          "bg-blue-500/20 text-blue-300 border-blue-500/30",
  under_review: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  assessed:     "bg-violet-500/20 text-violet-300 border-violet-500/30",
  actioned:     "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  closed:       "bg-white/10 text-[var(--color-ink-faint)] border-[var(--color-line)]",
};

export function ChangeStatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
      CHANGE_STATUS_STYLES[status] ?? "bg-white/10 text-[var(--color-ink-faint)] border-[var(--color-line)]")}>
      {label}
    </span>
  );
}

const OBL_STATUS_STYLES: Record<string, string> = {
  not_started: "bg-white/10 text-[var(--color-ink-faint)] border-[var(--color-line)]",
  planned:     "bg-blue-500/20 text-blue-300 border-blue-500/30",
  in_progress: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  implemented: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  validated:   "bg-teal-500/20 text-teal-300 border-teal-500/30",
  exception:   "bg-orange-500/20 text-orange-300 border-orange-500/30",
  retired:     "bg-white/10 text-[var(--color-ink-faint)] border-[var(--color-line)]",
};

export function ObligationStatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
      OBL_STATUS_STYLES[status] ?? "bg-white/10 text-[var(--color-ink-faint)] border-[var(--color-line)]")}>
      {label}
    </span>
  );
}

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/20 text-red-300 border-red-500/30",
  high:     "bg-orange-500/20 text-orange-300 border-orange-500/30",
  medium:   "bg-amber-500/20 text-amber-300 border-amber-500/30",
  low:      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
      PRIORITY_STYLES[priority] ?? "bg-white/10 text-[var(--color-ink-faint)] border-[var(--color-line)]")}>
      {priority}
    </span>
  );
}

const CAT_STYLES: Record<string, string> = {
  privacy:           "bg-violet-500/20 text-violet-300 border-violet-500/30",
  security:          "bg-blue-500/20 text-blue-300 border-blue-500/30",
  ai_governance:     "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  financial:         "bg-amber-500/20 text-amber-300 border-amber-500/30",
  operational_risk:  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  third_party_risk:  "bg-rose-500/20 text-rose-300 border-rose-500/30",
  cloud_security:    "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  business_continuity: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  audit:             "bg-slate-500/20 text-slate-300 border-slate-500/30",
  industry_specific: "bg-lime-500/20 text-lime-300 border-lime-500/30",
  custom:            "bg-white/10 text-[var(--color-ink-dim)] border-[var(--color-line)]",
};

export function CategoryBadge({ category }: { category: string }) {
  const label = category.replace(/_/g, " ");
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
      CAT_STYLES[category] ?? "bg-white/10 text-[var(--color-ink-dim)] border-[var(--color-line)]")}>
      {label}
    </span>
  );
}

export function AlertIcon({ severity }: { severity: string }) {
  if (severity === "critical") return <XCircle className="h-4 w-4 text-red-400 shrink-0" />;
  if (severity === "high") return <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />;
  if (severity === "medium") return <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />;
  if (severity === "low") return <Info className="h-4 w-4 text-blue-400 shrink-0" />;
  return <Info className="h-4 w-4 text-[var(--color-ink-faint)] shrink-0" />;
}

export function ReadinessBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : score >= 40 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEF2F7]">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
    </div>
  );
}

export function ReadinessLabel({ score }: { score: number }) {
  if (score >= 80) return <span className="text-xs font-semibold text-emerald-400">Excellent</span>;
  if (score >= 60) return <span className="text-xs font-semibold text-amber-400">Good</span>;
  if (score >= 40) return <span className="text-xs font-semibold text-orange-400">Needs Attention</span>;
  if (score >= 20) return <span className="text-xs font-semibold text-red-400">At Risk</span>;
  return <span className="text-xs font-semibold text-red-500">Critical</span>;
}
