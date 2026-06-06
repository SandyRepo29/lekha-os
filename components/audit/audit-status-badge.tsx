import { cn } from "@/lib/utils";

const AUDIT_STATUS_STYLES: Record<string, string> = {
  planned: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  cancelled: "bg-white/5 text-[var(--color-ink-dim)] border border-white/10",
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
        AUDIT_STATUS_STYLES[status] ?? "bg-white/5 text-[var(--color-ink-dim)] border border-white/10",
        className
      )}
    >
      {AUDIT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  medium: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  low: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
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
        SEVERITY_STYLES[severity] ?? "bg-white/5 text-[var(--color-ink-dim)] border border-white/10",
        className
      )}
    >
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

const FINDING_STATUS_STYLES: Record<string, string> = {
  open: "bg-red-500/10 text-red-400 border border-red-500/20",
  accepted: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  remediating: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  closed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
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
        FINDING_STATUS_STYLES[status] ?? "bg-white/5 text-[var(--color-ink-dim)] border border-white/10",
        className
      )}
    >
      {FINDING_STATUS_LABELS[status] ?? status}
    </span>
  );
}

const CAPA_STATUS_STYLES: Record<string, string> = {
  open: "bg-red-500/10 text-red-400 border border-red-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  overdue: "bg-red-600/15 text-red-300 border border-red-600/30",
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
        CAPA_STATUS_STYLES[status] ?? "bg-white/5 text-[var(--color-ink-dim)] border border-white/10",
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
