"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// ─── Sub-nav ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/asset-intelligence",                 label: "Dashboard"        },
  { href: "/asset-intelligence/registry",        label: "Registry™"        },
  { href: "/asset-intelligence/data-assets",     label: "Data Assets™"     },
  { href: "/asset-intelligence/relationships",   label: "Relationships™"   },
  { href: "/asset-intelligence/impact-analysis", label: "Impact Analysis™" },
  { href: "/asset-intelligence/alerts",          label: "Alerts"           },
  { href: "/asset-intelligence/ai",              label: "Copilot™"         },
];

export function AssetSubNav() {
  const pathname = usePathname();
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white p-1 flex gap-1 flex-wrap">
      {NAV_ITEMS.map(({ href, label }) => {
        const active = pathname === href || (href !== "/asset-intelligence" && pathname.startsWith(href));
        return (
          <Link key={href} href={href}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-[#EEF2F7] text-[var(--color-ink)]"
                : "text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] hover:text-[var(--color-ink)]"
            )}>
            {label}
          </Link>
        );
      })}
    </div>
  );
}

// ─── Asset Stat Card ──────────────────────────────────────────────────────────

type Accent = "neutral" | "good" | "warn" | "danger" | "purple";

const ACCENT_CLASSES: Record<Accent, { border: string; bg: string; text: string }> = {
  neutral: { border: "border-l-slate-400",   bg: "bg-slate-50",    text: "text-slate-600"   },
  good:    { border: "border-l-emerald-500", bg: "bg-emerald-50",  text: "text-emerald-600" },
  warn:    { border: "border-l-amber-500",   bg: "bg-amber-50",    text: "text-amber-600"   },
  danger:  { border: "border-l-red-500",     bg: "bg-red-50",      text: "text-red-600"     },
  purple:  { border: "border-l-purple-500",  bg: "bg-purple-50",   text: "text-purple-600"  },
};

export function AssetStat({
  label, value, accent = "neutral", href,
}: { label: string; value: string | number; accent?: Accent; href?: string }) {
  const { border, bg, text } = ACCENT_CLASSES[accent];
  const inner = (
    <div className={cn("rounded-xl border border-[var(--color-line)] border-l-2 p-4", border, bg)}>
      <p className="text-[var(--color-ink-dim)] text-xs mb-1">{label}</p>
      <p className={cn("text-2xl font-bold", text)}>{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Criticality Badge ────────────────────────────────────────────────────────

const CRIT_STYLES: Record<string, string> = {
  mission_critical: "bg-red-100 text-red-800 border-red-200",
  critical:         "bg-red-100 text-red-700 border-red-200",
  high:             "bg-orange-100 text-orange-700 border-orange-200",
  medium:           "bg-amber-100 text-amber-700 border-amber-200",
  low:              "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function CriticalityBadge({ level }: { level: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize", CRIT_STYLES[level] ?? "bg-slate-100 text-slate-600 border-slate-200")}>
      {level.replace("_", " ")}
    </span>
  );
}

// ─── Asset Status Badge ───────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  active:       "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive:     "bg-slate-100 text-slate-600 border-slate-200",
  retired:      "bg-red-100 text-red-700 border-red-200",
  planned:      "bg-blue-100 text-blue-700 border-blue-200",
  deprecated:   "bg-orange-100 text-orange-700 border-orange-200",
  under_review: "bg-purple-100 text-purple-700 border-purple-200",
};

export function AssetStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize", STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600 border-slate-200")}>
      {status.replace("_", " ")}
    </span>
  );
}

// ─── Asset Type Badge ─────────────────────────────────────────────────────────

const TYPE_STYLES: Record<string, string> = {
  application:      "bg-blue-100 text-blue-700 border-blue-200",
  database:         "bg-purple-100 text-purple-700 border-purple-200",
  api:              "bg-cyan-100 text-cyan-700 border-cyan-200",
  server:           "bg-orange-100 text-orange-700 border-orange-200",
  cloud_resource:   "bg-sky-100 text-sky-700 border-sky-200",
  data_asset:       "bg-amber-100 text-amber-700 border-amber-200",
  business_process: "bg-green-100 text-green-700 border-green-200",
  ai_system:        "bg-violet-100 text-violet-700 border-violet-200",
  vendor_service:   "bg-indigo-100 text-indigo-700 border-indigo-200",
  network_asset:    "bg-teal-100 text-teal-700 border-teal-200",
  endpoint:         "bg-rose-100 text-rose-700 border-rose-200",
  custom:           "bg-slate-100 text-slate-600 border-slate-200",
};

export function AssetTypeBadge({ type }: { type: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", TYPE_STYLES[type] ?? "bg-slate-100 text-slate-600 border-slate-200")}>
      {type.replace("_", " ")}
    </span>
  );
}

// ─── Asset Trust Score Badge ──────────────────────────────────────────────────

export function AssetTrustBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-xs text-[var(--color-ink-dim)]">–</span>;
  const color = score >= 90 ? "text-emerald-600" : score >= 70 ? "text-amber-600" : "text-red-600";
  const label = score >= 90 ? "Trusted" : score >= 70 ? "Moderate" : "At Risk";
  return (
    <span className={cn("text-xs font-semibold", color)}>
      {score} <span className="text-[var(--color-ink-dim)] font-normal">· {label}</span>
    </span>
  );
}

// ─── Alert Severity Badge ─────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high:     "bg-orange-100 text-orange-700 border-orange-200",
  medium:   "bg-amber-100 text-amber-700 border-amber-200",
  low:      "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function AlertSeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize", ALERT_STYLES[severity] ?? "bg-slate-100 text-slate-600 border-slate-200")}>
      {severity}
    </span>
  );
}
