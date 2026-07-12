import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---- WorkflowStat — accent stat card (border-l-2 pattern) ----

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

export function WorkflowStat({
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

// ---- WorkflowFilterChip ----

export function WorkflowFilterChip({
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

// ---- WorkflowStatusBadge ----

const WORKFLOW_STATUS_STYLES: Record<string, string> = {
  draft:       "bg-amber-100 text-amber-700 border border-amber-200",
  active:      "bg-emerald-100 text-emerald-700 border border-emerald-200",
  paused:      "bg-sky-100 text-sky-700 border border-sky-200",
  archived:    "bg-[#F8F9FB] text-[var(--color-ink-dim)] border border-[var(--color-line)]",
  deprecated:  "bg-red-100 text-red-700 border border-red-200",
};

const WORKFLOW_STATUS_LABELS: Record<string, string> = {
  draft:      "Draft",
  active:     "Active",
  paused:     "Paused",
  archived:   "Archived",
  deprecated: "Deprecated",
};

export function WorkflowStatusBadge({ status }: { status: string }) {
  const styles = WORKFLOW_STATUS_STYLES[status] ?? "bg-[#F8F9FB] text-[var(--color-ink-dim)] border border-[var(--color-line)]";
  const label  = WORKFLOW_STATUS_LABELS[status] ?? status;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", styles)}>
      {label}
    </span>
  );
}

// ---- WorkflowRunStatusBadge ----

const RUN_STATUS_STYLES: Record<string, string> = {
  pending:    "bg-slate-100 text-slate-700 border border-slate-200",
  running:    "bg-sky-100 text-sky-700 border border-sky-200",
  completed:  "bg-emerald-100 text-emerald-700 border border-emerald-200",
  failed:     "bg-red-100 text-red-700 border border-red-200",
  cancelled:  "bg-[#F8F9FB] text-[var(--color-ink-dim)] border border-[var(--color-line)]",
  timed_out:  "bg-orange-100 text-orange-700 border border-orange-200",
  waiting:    "bg-amber-100 text-amber-700 border border-amber-200",
};

const RUN_STATUS_LABELS: Record<string, string> = {
  pending:   "Pending",
  running:   "Running",
  completed: "Completed",
  failed:    "Failed",
  cancelled: "Cancelled",
  timed_out: "Timed Out",
  waiting:   "Waiting",
};

export function WorkflowRunStatusBadge({ status }: { status: string }) {
  const styles = RUN_STATUS_STYLES[status] ?? "bg-[#F8F9FB] text-[var(--color-ink-dim)] border border-[var(--color-line)]";
  const label  = RUN_STATUS_LABELS[status] ?? status;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", styles)}>
      {label}
    </span>
  );
}

// ---- ApprovalStatusBadge ----

const APPROVAL_STATUS_STYLES: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700 border border-amber-200",
  approved:  "bg-emerald-100 text-emerald-700 border border-emerald-200",
  rejected:  "bg-red-100 text-red-700 border border-red-200",
  escalated: "bg-orange-100 text-orange-700 border border-orange-200",
  expired:   "bg-[#F8F9FB] text-[var(--color-ink-dim)] border border-[var(--color-line)]",
  delegated: "bg-sky-100 text-sky-700 border border-sky-200",
};

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending:   "Pending",
  approved:  "Approved",
  rejected:  "Rejected",
  escalated: "Escalated",
  expired:   "Expired",
  delegated: "Delegated",
};

export function ApprovalStatusBadge({ status }: { status: string }) {
  const styles = APPROVAL_STATUS_STYLES[status] ?? "bg-[#F8F9FB] text-[var(--color-ink-dim)] border border-[var(--color-line)]";
  const label  = APPROVAL_STATUS_LABELS[status] ?? status;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", styles)}>
      {label}
    </span>
  );
}

// ---- WorkflowTriggerBadge ----

const TRIGGER_STYLES: Record<string, string> = {
  manual:         "bg-indigo-100 text-indigo-700 border border-indigo-200",
  scheduled:      "bg-sky-100 text-sky-700 border border-sky-200",
  event:          "bg-violet-100 text-violet-700 border border-violet-200",
  webhook:        "bg-teal-100 text-teal-700 border border-teal-200",
  api:            "bg-cyan-100 text-cyan-700 border border-cyan-200",
  record_created: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  score_threshold:"bg-orange-100 text-orange-700 border border-orange-200",
  date_reached:   "bg-amber-100 text-amber-700 border border-amber-200",
};

const TRIGGER_LABELS: Record<string, string> = {
  manual:          "Manual",
  scheduled:       "Scheduled",
  event:           "Event",
  webhook:         "Webhook",
  api:             "API",
  record_created:  "Record Created",
  score_threshold: "Score Threshold",
  date_reached:    "Date Reached",
};

export function WorkflowTriggerBadge({ trigger }: { trigger: string }) {
  const styles = TRIGGER_STYLES[trigger] ?? "bg-[#F8F9FB] text-[var(--color-ink-dim)] border border-[var(--color-line)]";
  const label  = TRIGGER_LABELS[trigger] ?? trigger.replace(/_/g, " ");
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize", styles)}>
      {label}
    </span>
  );
}
