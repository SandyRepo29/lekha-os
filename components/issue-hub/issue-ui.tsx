import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---- IssueStat — accent stat card (border-l-2 pattern) ----

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

export function IssueStat({
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

// ---- IssueFilterChip ----

export function IssueFilterChip({
  label,
  active,
  href,
}: {
  label: string;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-[var(--color-blue)]/20 text-[var(--color-blue)]"
          : "bg-[#F8F9FB] text-[var(--color-ink-dim)] hover:bg-[#F8F9FB]"
      )}
    >
      {label}
    </Link>
  );
}

// ---- IssueStatusBadge ----

const ISSUE_STATUS_STYLES: Record<string, string> = {
  open:           "bg-amber-100 text-amber-700 border border-amber-200",
  assigned:       "bg-[var(--color-blue)]/10 text-[var(--color-blue)] border border-[var(--color-blue)]/25",
  in_progress:    "bg-indigo-100 text-indigo-700 border border-indigo-200",
  blocked:        "bg-red-100 text-red-700 border border-red-200",
  pending_review: "bg-purple-100 text-purple-700 border border-purple-200",
  resolved:       "bg-emerald-100 text-emerald-700 border border-emerald-200",
  closed:         "bg-slate-100 text-[var(--color-ink-dim)] border border-[var(--color-line)]",
  accepted_risk:  "bg-orange-100 text-orange-700 border border-orange-200",
  deferred:       "bg-slate-100 text-[var(--color-ink-dim)] border border-[var(--color-line)]",
};

const ISSUE_STATUS_LABELS: Record<string, string> = {
  open:           "Open",
  assigned:       "Assigned",
  in_progress:    "In Progress",
  blocked:        "Blocked",
  pending_review: "Pending Review",
  resolved:       "Resolved",
  closed:         "Closed",
  accepted_risk:  "Accepted Risk",
  deferred:       "Deferred",
};

export function IssueStatusBadge({ status }: { status: string }) {
  const style = ISSUE_STATUS_STYLES[status] ?? "bg-slate-100 text-[var(--color-ink-dim)] border border-[var(--color-line)]";
  const label = ISSUE_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", style)}>
      {label}
    </span>
  );
}

// ---- IssueSeverityBadge ----

const ISSUE_SEVERITY_STYLES: Record<string, string> = {
  critical:      "bg-red-100 text-red-700 border border-red-200",
  high:          "bg-orange-100 text-orange-700 border border-orange-200",
  medium:        "bg-amber-100 text-amber-700 border border-amber-200",
  low:           "bg-[var(--color-blue)]/10 text-[var(--color-blue)] border border-[var(--color-blue)]/25",
  informational: "bg-slate-100 text-[var(--color-ink-dim)] border border-[var(--color-line)]",
};

export function IssueSeverityBadge({ severity }: { severity: string }) {
  const style = ISSUE_SEVERITY_STYLES[severity] ?? "bg-slate-100 text-[var(--color-ink-dim)] border border-[var(--color-line)]";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize", style)}>
      {severity}
    </span>
  );
}

// ---- IssuePriorityBadge ----

const ISSUE_PRIORITY_STYLES: Record<string, string> = {
  p1: "bg-red-100 text-red-700 border border-red-200",
  p2: "bg-orange-100 text-orange-700 border border-orange-200",
  p3: "bg-amber-100 text-amber-700 border border-amber-200",
  p4: "bg-[var(--color-blue)]/10 text-[var(--color-blue)] border border-[var(--color-blue)]/25",
  p5: "bg-slate-100 text-[var(--color-ink-dim)] border border-[var(--color-line)]",
};

const ISSUE_PRIORITY_LABELS: Record<string, string> = {
  p1: "P1 — Critical",
  p2: "P2 — High",
  p3: "P3 — Medium",
  p4: "P4 — Low",
  p5: "P5 — Info",
};

export function IssuePriorityBadge({ priority }: { priority: string }) {
  const style = ISSUE_PRIORITY_STYLES[priority] ?? "bg-slate-100 text-[var(--color-ink-dim)] border border-[var(--color-line)]";
  const label = ISSUE_PRIORITY_LABELS[priority] ?? priority.toUpperCase();
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", style)}>
      {label}
    </span>
  );
}

// ---- TaskStatusBadge ----

const TASK_STATUS_STYLES: Record<string, string> = {
  open:        "bg-amber-100 text-amber-700 border border-amber-200",
  in_progress: "bg-indigo-100 text-indigo-700 border border-indigo-200",
  blocked:     "bg-red-100 text-red-700 border border-red-200",
  completed:   "bg-emerald-100 text-emerald-700 border border-emerald-200",
  cancelled:   "bg-slate-100 text-[var(--color-ink-dim)] border border-[var(--color-line)]",
};

export function TaskStatusBadge({ status }: { status: string }) {
  const style = TASK_STATUS_STYLES[status] ?? "bg-slate-100 text-[var(--color-ink-dim)] border border-[var(--color-line)]";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", style)}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ---- ExceptionStatusBadge ----

const EXCEPTION_STATUS_STYLES: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-700 border border-amber-200",
  approved: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
  expired:  "bg-slate-100 text-[var(--color-ink-dim)] border border-[var(--color-line)]",
  revoked:  "bg-slate-100 text-[var(--color-ink-dim)] border border-[var(--color-line)]",
};

export function ExceptionStatusBadge({ status }: { status: string }) {
  const style = EXCEPTION_STATUS_STYLES[status] ?? "bg-slate-100 text-[var(--color-ink-dim)] border border-[var(--color-line)]";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize", style)}>
      {status}
    </span>
  );
}
