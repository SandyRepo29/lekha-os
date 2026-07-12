"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// ── Sub-nav ───────────────────────────────────────────────────────────────────

const AGENT_SUB_NAV = [
  { href: "/agents",               label: "Hub" },
  { href: "/agents/registry",      label: "Registry" },
  { href: "/agents/studio",        label: "Studio" },
  { href: "/agents/runs",          label: "Runs" },
  { href: "/agents/observations",  label: "Observations" },
  { href: "/agents/recommendations", label: "Recommendations" },
  { href: "/agents/actions",       label: "Actions" },
  { href: "/agents/orchestration", label: "Orchestration" },
  { href: "/agents/analytics",     label: "Analytics" },
  { href: "/agents/copilot",       label: "Copilot™" },
];

export function AgentSubNav() {
  const path = usePathname();
  return (
    <div className="border-b border-[var(--color-line)] pb-1">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white p-1">
        {AGENT_SUB_NAV.map(n => {
          const active = n.href === "/agents"
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

// ── Stat card ──────────────────────────────────────────────────────────────────

type Accent = "good" | "warn" | "danger" | "neutral" | "blue" | "purple";

const ACCENT: Record<Accent, { border: string; bg: string; text: string }> = {
  good:    { border: "border-l-emerald-500",  bg: "bg-emerald-100",  text: "text-emerald-700" },
  warn:    { border: "border-l-amber-500",    bg: "bg-amber-100",    text: "text-amber-700" },
  danger:  { border: "border-l-red-500",      bg: "bg-red-100",      text: "text-red-700" },
  neutral: { border: "border-l-[var(--color-line)]", bg: "bg-white", text: "text-[var(--color-ink)]" },
  blue:    { border: "border-l-[var(--color-blue)]", bg: "bg-[var(--color-blue)]/[0.06]", text: "text-[var(--color-blue)]" },
  purple:  { border: "border-l-purple-500",   bg: "bg-purple-100",   text: "text-purple-700" },
};

export function AgentStat({
  label, value, accent = "neutral", href,
}: {
  label: string; value: string | number; accent?: Accent; href?: string;
}) {
  const a = ACCENT[accent];
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

// ── Status badges ──────────────────────────────────────────────────────────────

const AGENT_STATUS: Record<string, string> = {
  active:  "bg-emerald-100 text-emerald-700 border border-emerald-200",
  paused:  "bg-amber-100 text-amber-700 border border-amber-200",
  idle:    "bg-[#F8F9FB] text-[var(--color-ink-dim)] border border-[var(--color-line)]",
  error:   "bg-red-100 text-red-700 border border-red-200",
  draft:   "bg-purple-100 text-purple-700 border border-purple-200",
};

const RUN_STATUS: Record<string, string> = {
  running:   "bg-blue-100 text-blue-700 border border-blue-200",
  completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  failed:    "bg-red-100 text-red-700 border border-red-200",
  cancelled: "bg-[#F8F9FB] text-[var(--color-ink-faint)] border border-[var(--color-line)]",
  success:   "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border border-red-200",
  high:     "bg-orange-100 text-orange-700 border border-orange-200",
  medium:   "bg-amber-100 text-amber-700 border border-amber-200",
  low:      "bg-blue-100 text-blue-700 border border-blue-200",
  info:     "bg-[#F8F9FB] text-[var(--color-ink-faint)] border border-[var(--color-line)]",
};

const OBS_STATUS: Record<string, string> = {
  new:       "bg-amber-100 text-amber-700 border border-amber-200",
  reviewed:  "bg-blue-100 text-blue-700 border border-blue-200",
  actioned:  "bg-emerald-100 text-emerald-700 border border-emerald-200",
  dismissed: "bg-[#F8F9FB] text-[var(--color-ink-faint)] border border-[var(--color-line)]",
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border border-red-200",
  high:   "bg-orange-100 text-orange-700 border border-orange-200",
  medium: "bg-amber-100 text-amber-700 border border-amber-200",
  low:    "bg-blue-100 text-blue-700 border border-blue-200",
};

const ACTION_STATUS: Record<string, string> = {
  pending_approval: "bg-amber-100 text-amber-700 border border-amber-200",
  approved:         "bg-emerald-100 text-emerald-700 border border-emerald-200",
  rejected:         "bg-red-100 text-red-700 border border-red-200",
  executed:         "bg-blue-100 text-blue-700 border border-blue-200",
  failed:           "bg-red-100 text-red-700 border border-red-200",
};

const EXEC_MODE: Record<string, string> = {
  autonomous:    "bg-purple-100 text-purple-700 border border-purple-200",
  supervised:    "bg-blue-100 text-blue-700 border border-blue-200",
  advisory:      "bg-[#F8F9FB] text-[var(--color-ink-dim)] border border-[var(--color-line)]",
  semi_autonomous: "bg-indigo-100 text-indigo-700 border border-indigo-200",
};

function badge(styles: Record<string, string>, value: string) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize", styles[value] ?? styles["info"] ?? "bg-slate-100 text-[var(--color-ink-dim)] border border-[var(--color-line)]")}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

export function AgentStatusBadge({ status }: { status: string }) { return badge(AGENT_STATUS, status); }
export function RunStatusBadge({ status }: { status: string }) { return badge(RUN_STATUS, status); }
export function SeverityBadge({ severity }: { severity: string }) { return badge(SEVERITY_STYLES, severity); }
export function ObsStatusBadge({ status }: { status: string }) { return badge(OBS_STATUS, status); }
export function PriorityBadge({ priority }: { priority: string }) { return badge(PRIORITY_STYLES, priority); }
export function ActionStatusBadge({ status }: { status: string }) { return badge(ACTION_STATUS, status); }
export function ExecModeBadge({ mode }: { mode: string }) { return badge(EXEC_MODE, mode); }

// ── Confidence ring ────────────────────────────────────────────────────────────

export function ConfidenceRing({ value }: { value: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const dash = (pct / 100) * circ;
  const color = pct >= 85 ? "#34d399" : pct >= 60 ? "#fbbf24" : "#f87171";
  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      <svg className="-rotate-90" width={44} height={44} viewBox="0 0 44 44">
        <circle cx={22} cy={22} r={r} stroke="rgba(30,41,59,0.12)" strokeWidth={3} fill="none" />
        <circle cx={22} cy={22} r={r} stroke={color} strokeWidth={3} fill="none"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute text-[11px] font-bold" style={{ color }}>{pct}%</span>
    </div>
  );
}

// ── Agent type label ───────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  risk_monitor:       "Risk Monitor",
  vendor_watcher:     "Vendor Watch",
  compliance_checker: "Compliance",
  control_validator:  "Controls",
  policy_enforcer:    "Policy",
  audit_assistant:    "Audit Prep",
  custom:             "Custom",
};

export function AgentTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--color-indigo)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--color-indigo)] border border-[var(--color-indigo)]/20">
      {TYPE_LABELS[type] ?? type.replace(/_/g, " ")}
    </span>
  );
}

