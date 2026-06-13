import { cn } from "@/lib/utils";

// ─── Sensitivity Badge ────────────────────────────────────────────────────────

const SENSITIVITY_STYLES: Record<string, string> = {
  low: "bg-green-500/20 text-green-300 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  critical: "bg-red-500/20 text-red-300 border-red-500/30",
};

const SENSITIVITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export function SensitivityBadge({
  sensitivity,
  className,
}: {
  sensitivity: string;
  className?: string;
}) {
  const styles = SENSITIVITY_STYLES[sensitivity] ?? SENSITIVITY_STYLES.medium;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        styles,
        className
      )}
    >
      {SENSITIVITY_LABELS[sensitivity] ?? sensitivity}
    </span>
  );
}

// ─── Privacy Request Status Badge ────────────────────────────────────────────

const REQUEST_STATUS_STYLES: Record<string, string> = {
  submitted: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  assigned: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  investigating: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  completed: "bg-green-500/20 text-green-300 border-green-500/30",
  closed: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const REQUEST_STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  assigned: "Assigned",
  investigating: "Investigating",
  completed: "Completed",
  closed: "Closed",
};

export function PrivacyRequestStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const styles = REQUEST_STATUS_STYLES[status] ?? REQUEST_STATUS_STYLES.submitted;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        styles,
        className
      )}
    >
      {REQUEST_STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Privacy Request Type Badge ───────────────────────────────────────────────

const REQUEST_TYPE_STYLES: Record<string, string> = {
  access: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  correction: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  deletion: "bg-red-500/20 text-red-300 border-red-500/30",
  portability: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  consent_withdrawal: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  grievance: "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  access: "Access",
  correction: "Correction",
  deletion: "Deletion",
  portability: "Portability",
  consent_withdrawal: "Consent Withdrawal",
  grievance: "Grievance",
};

export function PrivacyRequestTypeBadge({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const styles = REQUEST_TYPE_STYLES[type] ?? "bg-slate-500/20 text-slate-300 border-slate-500/30";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        styles,
        className
      )}
    >
      {REQUEST_TYPE_LABELS[type] ?? type}
    </span>
  );
}

// ─── Consent Status Badge ─────────────────────────────────────────────────────

const CONSENT_STATUS_STYLES: Record<string, string> = {
  granted: "bg-green-500/20 text-green-300 border-green-500/30",
  withdrawn: "bg-red-500/20 text-red-300 border-red-500/30",
  expired: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  rejected: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const CONSENT_STATUS_LABELS: Record<string, string> = {
  granted: "Granted",
  withdrawn: "Withdrawn",
  expired: "Expired",
  pending: "Pending",
  rejected: "Rejected",
};

export function ConsentStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const styles = CONSENT_STATUS_STYLES[status] ?? CONSENT_STATUS_STYLES.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        styles,
        className
      )}
    >
      {CONSENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Transfer Status Badge ────────────────────────────────────────────────────

const TRANSFER_STATUS_STYLES: Record<string, string> = {
  active: "bg-green-500/20 text-green-300 border-green-500/30",
  pending_approval: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  approved: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
  suspended: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const TRANSFER_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  pending_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

export function TransferStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const styles =
    TRANSFER_STATUS_STYLES[status] ?? TRANSFER_STATUS_STYLES.pending_approval;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        styles,
        className
      )}
    >
      {TRANSFER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Privacy Risk Level Badge ─────────────────────────────────────────────────

const RISK_LEVEL_STYLES: Record<string, string> = {
  low: "bg-green-500/20 text-green-300 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  critical: "bg-red-500/20 text-red-300 border-red-500/30",
};

export function PrivacyRiskLevelBadge({
  level,
  className,
}: {
  level: string;
  className?: string;
}) {
  const styles = RISK_LEVEL_STYLES[level] ?? RISK_LEVEL_STYLES.medium;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        styles,
        className
      )}
    >
      {level}
    </span>
  );
}

// ─── Data Asset Status Badge ──────────────────────────────────────────────────

const ASSET_STATUS_STYLES: Record<string, string> = {
  active: "bg-green-500/20 text-green-300 border-green-500/30",
  inactive: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  archived: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  under_review: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
};

const ASSET_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
  under_review: "Under Review",
};

export function AssetStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const styles = ASSET_STATUS_STYLES[status] ?? ASSET_STATUS_STYLES.inactive;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        styles,
        className
      )}
    >
      {ASSET_STATUS_LABELS[status] ?? status.replace("_", " ")}
    </span>
  );
}

// ─── Assessment Status Badge ──────────────────────────────────────────────────

const ASSESSMENT_STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  in_progress: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  completed: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  approved: "bg-green-500/20 text-green-300 border-green-500/30",
  archived: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const ASSESSMENT_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
  approved: "Approved",
  archived: "Archived",
};

export function AssessmentStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const styles = ASSESSMENT_STATUS_STYLES[status] ?? ASSESSMENT_STATUS_STYLES.draft;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        styles,
        className
      )}
    >
      {ASSESSMENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}
