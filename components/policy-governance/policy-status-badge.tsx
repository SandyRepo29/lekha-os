"use client";

import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 border-slate-200 text-slate-700",
  review: "bg-yellow-100 border-yellow-200 text-yellow-700",
  approved: "bg-blue-100 border-blue-200 text-blue-700",
  published: "bg-green-100 border-green-200 text-green-700",
  expired: "bg-red-100 border-red-200 text-red-700",
  archived: "bg-gray-100 border-gray-200 text-gray-700",
  retired: "bg-purple-100 border-purple-200 text-purple-700",
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
  const style = STATUS_STYLES[status] ?? "bg-slate-100 border-slate-200 text-[var(--color-ink-dim)]";
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
    pending: "bg-yellow-100 border-yellow-200 text-yellow-700",
    acknowledged: "bg-green-100 border-green-200 text-green-700",
    rejected: "bg-red-100 border-red-200 text-red-700",
    overdue: "bg-orange-100 border-orange-200 text-orange-700",
  };
  const style = ATTEST_STYLES[status] ?? "bg-slate-100 border-slate-200 text-[var(--color-ink-dim)]";
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", style, className)}>
      {label}
    </span>
  );
}
