"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ─── Sub-nav ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/operations",               label: "Dashboard" },
  { href: "/operations/events",        label: "Event Log" },
  { href: "/operations/workflows",     label: "Workflows" },
  { href: "/operations/approvals",     label: "Approvals" },
  { href: "/operations/automation",    label: "Automation" },
  { href: "/operations/analytics",     label: "Analytics" },
  { href: "/operations/command-center", label: "Command Center" },
  { href: "/operations/ai",            label: "AI Engine" },
];

export function ToeSubNav() {
  const path = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 rounded-2xl border border-[var(--color-line)] bg-white p-1">
      {NAV_ITEMS.map(({ href, label }) => {
        const active = href === "/operations" ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-[#EEF2F7] text-[var(--color-ink)]"
                : "text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] hover:text-[var(--color-ink)]"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

type Accent = "neutral" | "good" | "warn" | "danger" | "blue" | "purple";

const ACCENT: Record<Accent, string> = {
  neutral: "border-[var(--color-line)]",
  good:    "border-emerald-500",
  warn:    "border-amber-500",
  danger:  "border-red-500",
  blue:    "border-[var(--color-blue)]",
  purple:  "border-purple-500",
};

const ACCENT_TEXT: Record<Accent, string> = {
  neutral: "text-[var(--color-ink)]",
  good:    "text-emerald-400",
  warn:    "text-amber-400",
  danger:  "text-red-400",
  blue:    "text-[var(--color-blue)]",
  purple:  "text-purple-400",
};

export function ToeStat({
  label, value, accent = "neutral", href,
}: {
  label: string; value: string | number; accent?: Accent; href?: string;
}) {
  const content = (
    <div className={`rounded-xl border border-l-2 ${ACCENT[accent]} border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-4`}>
      <div className={`text-2xl font-bold ${ACCENT_TEXT[accent]}`}>{value}</div>
      <div className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export function InstanceStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:          "bg-slate-500/20 text-slate-300",
    running:          "bg-blue-500/20 text-blue-300",
    waiting_approval: "bg-amber-500/20 text-amber-300",
    completed:        "bg-emerald-500/20 text-emerald-300",
    failed:           "bg-red-500/20 text-red-300",
    cancelled:        "bg-slate-600/20 text-slate-400",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${map[status] ?? "bg-slate-500/20 text-slate-300"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function ApprovalStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:   "bg-amber-500/20 text-amber-300",
    approved:  "bg-emerald-500/20 text-emerald-300",
    rejected:  "bg-red-500/20 text-red-300",
    escalated: "bg-purple-500/20 text-purple-300",
    expired:   "bg-slate-500/20 text-slate-400",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${map[status] ?? "bg-slate-500/20 text-slate-300"}`}>
      {status}
    </span>
  );
}

export function EventSeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    critical: "bg-red-500/20 text-red-300",
    high:     "bg-orange-500/20 text-orange-300",
    medium:   "bg-amber-500/20 text-amber-300",
    low:      "bg-blue-500/20 text-blue-300",
    info:     "bg-slate-500/20 text-slate-400",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${map[severity] ?? "bg-slate-500/20 text-slate-300"}`}>
      {severity}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    critical: "bg-red-500/20 text-red-300",
    high:     "bg-orange-500/20 text-orange-300",
    medium:   "bg-amber-500/20 text-amber-300",
    low:      "bg-blue-500/20 text-blue-300",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${map[priority] ?? "bg-slate-500/20 text-slate-300"}`}>
      {priority}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmtDt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}
