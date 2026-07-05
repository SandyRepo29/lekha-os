import { cn } from "@/lib/utils";

const AUDIT_STATUS_STYLES: Record<string, string> = {
  planned: "bg-blue-100 text-blue-700 border border-blue-200",
  in_progress: "bg-amber-100 text-amber-700 border border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  cancelled: "bg-slate-100 text-[var(--color-ink-dim)] border border-slate-200",
};

const AUDIT_STATUS_LABELS: Record<string, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function AuditStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        AUDIT_STATUS_STYLES[status] ?? "bg-slate-100 text-[var(--color-ink-dim)] border border-slate-200",
        className
      )}
    >
      {AUDIT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border border-red-200",
  high: "bg-orange-100 text-orange-700 border border-orange-200",
  medium: "bg-amber-100 text-amber-700 border border-amber-200",
  low: "bg-blue-100 text-blue-700 border border-blue-200",
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        SEVERITY_STYLES[severity] ?? "bg-slate-100 text-[var(--color-ink-dim)] border border-slate-200",
        className
      )}
    >
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

const FINDING_STATUS_STYLES: Record<string, string> = {
  open: "bg-red-100 text-red-700 border border-red-200",
  accepted: "bg-blue-100 text-blue-700 border border-blue-200",
  remediating: "bg-amber-100 text-amber-700 border border-amber-200",
  closed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

const FINDING_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  accepted: "Accepted",
  remediating: "Remediating",
  closed: "Closed",
};

export function FindingStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        FINDING_STATUS_STYLES[status] ?? "bg-slate-100 text-[var(--color-ink-dim)] border border-slate-200",
        className
      )}
    >
      {FINDING_STATUS_LABELS[status] ?? status}
    </span>
  );
}

const CAPA_STATUS_STYLES: Record<string, string> = {
  open: "bg-red-100 text-red-700 border border-red-200",
  in_progress: "bg-amber-100 text-amber-700 border border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  overdue: "bg-red-100 text-red-700 border border-red-200",
};

const CAPA_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
};

export function CapaStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        CAPA_STATUS_STYLES[status] ?? "bg-slate-100 text-[var(--color-ink-dim)] border border-slate-200",
        className
      )}
    >
      {CAPA_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function AuditTypeBadge({ type }: { type: string }) {
  const label = type.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--color-blue)]/10 border border-[var(--color-blue)]/20 px-2 py-0.5 text-xs font-medium text-[var(--color-blue)]">
      {label}
    </span>
  );
}
