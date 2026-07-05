import { cn } from "@/lib/utils";

// ─── Sensitivity Badge ────────────────────────────────────────────────────────

const SENSITIVITY_STYLES: Record<string, string> = {
  low: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  critical: "bg-red-100 text-red-700 border-red-200",
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
  submitted: "bg-blue-100 text-blue-700 border-blue-200",
  assigned: "bg-indigo-100 text-indigo-700 border-indigo-200",
  investigating: "bg-yellow-100 text-yellow-700 border-yellow-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  closed: "bg-slate-100 text-slate-700 border-slate-200",
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
  access: "bg-blue-100 text-blue-700 border-blue-200",
  correction: "bg-teal-100 text-teal-700 border-teal-200",
  deletion: "bg-red-100 text-red-700 border-red-200",
  portability: "bg-purple-100 text-purple-700 border-purple-200",
  consent_withdrawal: "bg-orange-100 text-orange-700 border-orange-200",
  grievance: "bg-pink-100 text-pink-700 border-pink-200",
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
  const styles = REQUEST_TYPE_STYLES[type] ?? "bg-slate-100 text-slate-700 border-slate-200";
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
  granted: "bg-green-100 text-green-700 border-green-200",
  withdrawn: "bg-red-100 text-red-700 border-red-200",
  expired: "bg-orange-100 text-orange-700 border-orange-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  rejected: "bg-slate-100 text-slate-700 border-slate-200",
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
  active: "bg-green-100 text-green-700 border-green-200",
  pending_approval: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-teal-100 text-teal-700 border-teal-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  suspended: "bg-slate-100 text-slate-700 border-slate-200",
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
  low: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  critical: "bg-red-100 text-red-700 border-red-200",
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
  active: "bg-green-100 text-green-700 border-green-200",
  inactive: "bg-slate-100 text-slate-700 border-slate-200",
  archived: "bg-gray-100 text-gray-700 border-gray-200",
  under_review: "bg-yellow-100 text-yellow-700 border-yellow-200",
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
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-teal-100 text-teal-700 border-teal-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  archived: "bg-gray-100 text-gray-700 border-gray-200",
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
