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
  neutral: { border: "border-l-slate-400",   bg: "bg-slate-400/[0.06]",   text: "text-slate-400"   },
  good:    { border: "border-l-emerald-400",  bg: "bg-emerald-400/[0.06]", text: "text-emerald-400"  },
  warn:    { border: "border-l-amber-400",    bg: "bg-amber-400/[0.06]",   text: "text-amber-400"    },
  danger:  { border: "border-l-red-400",      bg: "bg-red-400/[0.06]",     text: "text-red-400"      },
  purple:  { border: "border-l-purple-400",   bg: "bg-purple-400/[0.06]",  text: "text-purple-400"   },
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
  mission_critical: "bg-red-500/20 text-red-400 border-red-500/30",
  critical:         "bg-red-400/20 text-red-300 border-red-400/30",
  high:             "bg-orange-400/20 text-orange-300 border-orange-400/30",
  medium:           "bg-amber-400/20 text-amber-300 border-amber-400/30",
  low:              "bg-emerald-400/20 text-emerald-300 border-emerald-400/30",
};

export function CriticalityBadge({ level }: { level: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize", CRIT_STYLES[level] ?? "bg-slate-400/20 text-slate-300 border-slate-400/30")}>
      {level.replace("_", " ")}
    </span>
  );
}

// ─── Asset Status Badge ───────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  active:       "bg-emerald-400/20 text-emerald-300 border-emerald-400/30",
  inactive:     "bg-slate-400/20 text-slate-300 border-slate-400/30",
  retired:      "bg-red-400/20 text-red-300 border-red-400/30",
  planned:      "bg-blue-400/20 text-blue-300 border-blue-400/30",
  deprecated:   "bg-orange-400/20 text-orange-300 border-orange-400/30",
  under_review: "bg-purple-400/20 text-purple-300 border-purple-400/30",
};

export function AssetStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize", STATUS_STYLES[status] ?? "bg-slate-400/20 text-slate-300 border-slate-400/30")}>
      {status.replace("_", " ")}
    </span>
  );
}

// ─── Asset Type Badge ─────────────────────────────────────────────────────────

const TYPE_STYLES: Record<string, string> = {
  application:      "bg-blue-400/20 text-blue-300 border-blue-400/30",
  database:         "bg-purple-400/20 text-purple-300 border-purple-400/30",
  api:              "bg-cyan-400/20 text-cyan-300 border-cyan-400/30",
  server:           "bg-orange-400/20 text-orange-300 border-orange-400/30",
  cloud_resource:   "bg-sky-400/20 text-sky-300 border-sky-400/30",
  data_asset:       "bg-amber-400/20 text-amber-300 border-amber-400/30",
  business_process: "bg-green-400/20 text-green-300 border-green-400/30",
  ai_system:        "bg-violet-400/20 text-violet-300 border-violet-400/30",
  vendor_service:   "bg-indigo-400/20 text-indigo-300 border-indigo-400/30",
  network_asset:    "bg-teal-400/20 text-teal-300 border-teal-400/30",
  endpoint:         "bg-rose-400/20 text-rose-300 border-rose-400/30",
  custom:           "bg-slate-400/20 text-slate-300 border-slate-400/30",
};

export function AssetTypeBadge({ type }: { type: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", TYPE_STYLES[type] ?? "bg-slate-400/20 text-slate-300 border-slate-400/30")}>
      {type.replace("_", " ")}
    </span>
  );
}

// ─── Asset Trust Score Badge ──────────────────────────────────────────────────

export function AssetTrustBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-xs text-[var(--color-ink-dim)]">–</span>;
  const color = score >= 90 ? "text-emerald-400" : score >= 70 ? "text-amber-400" : "text-red-400";
  const label = score >= 90 ? "Trusted" : score >= 70 ? "Moderate" : "At Risk";
  return (
    <span className={cn("text-xs font-semibold", color)}>
      {score} <span className="text-[var(--color-ink-dim)] font-normal">· {label}</span>
    </span>
  );
}

// ─── Alert Severity Badge ─────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high:     "bg-orange-400/20 text-orange-300 border-orange-400/30",
  medium:   "bg-amber-400/20 text-amber-300 border-amber-400/30",
  low:      "bg-emerald-400/20 text-emerald-300 border-emerald-400/30",
};

export function AlertSeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize", ALERT_STYLES[severity] ?? "bg-slate-400/20 text-slate-300 border-slate-400/30")}>
      {severity}
    </span>
  );
}
