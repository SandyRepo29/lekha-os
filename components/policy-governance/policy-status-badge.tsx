"use client";

import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-500/20 border-slate-500/30 text-slate-400",
  review: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
  approved: "bg-blue-500/20 border-blue-500/30 text-blue-400",
  published: "bg-green-500/20 border-green-500/30 text-green-400",
  expired: "bg-red-500/20 border-red-500/30 text-red-400",
  archived: "bg-gray-500/20 border-gray-500/30 text-gray-400",
  retired: "bg-purple-500/20 border-purple-500/30 text-purple-400",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  review: "Under Review",
  approved: "Approved",
  published: "Published",
  expired: "Expired",
  archived: "Archived",
  retired: "Retired",
};

interface PolicyStatusBadgeProps {
  status: string;
  className?: string;
}

export function PolicyStatusBadge({ status, className }: PolicyStatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? "bg-white/5 border-white/10 text-[var(--color-ink-dim)]";
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", style, className)}>
      {label}
    </span>
  );
}

interface AttestationStatusBadgeProps {
  status: string;
  className?: string;
}

export function AttestationStatusBadge({ status, className }: AttestationStatusBadgeProps) {
  const ATTEST_STYLES: Record<string, string> = {
    pending: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
    acknowledged: "bg-green-500/20 border-green-500/30 text-green-400",
    rejected: "bg-red-500/20 border-red-500/30 text-red-400",
    overdue: "bg-orange-500/20 border-orange-500/30 text-orange-400",
  };
  const style = ATTEST_STYLES[status] ?? "bg-white/5 border-white/10 text-[var(--color-ink-dim)]";
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", style, className)}>
      {label}
    </span>
  );
}
