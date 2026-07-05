/**
 * Shared badge components for the Compliance module.
 * Server-renderable — no client state.
 */

// ---- Framework status ----------------------------------------

const FRAMEWORK_STATUS: Record<string, { label: string; cls: string }> = {
  not_started:  { label: "Not Started",  cls: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]" },
  in_progress:  { label: "In Progress",  cls: "text-[var(--color-blue)] border-[var(--color-blue)]/30 bg-[var(--color-blue)]/10" },
  ready:        { label: "Ready",        cls: "text-emerald-700 border-emerald-200 bg-emerald-100" },
  certified:    { label: "Certified",    cls: "text-emerald-700 border-emerald-200 bg-emerald-100" },
  expired:      { label: "Expired",      cls: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]" },
};

export function FrameworkStatusBadge({ status }: { status: string }) {
  const { label, cls } = FRAMEWORK_STATUS[status] ?? FRAMEWORK_STATUS.not_started;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ---- Control status ------------------------------------------

const CONTROL_STATUS: Record<string, { label: string; cls: string }> = {
  implemented:      { label: "Implemented",      cls: "text-emerald-700 border-emerald-200 bg-emerald-100" },
  partial:          { label: "Partial",           cls: "text-amber-700 border-amber-200 bg-amber-100" },
  not_implemented:  { label: "Not Implemented",   cls: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]" },
  not_applicable:   { label: "N/A",               cls: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-white" },
};

export function ControlStatusBadge({ status }: { status: string }) {
  const { label, cls } = CONTROL_STATUS[status] ?? CONTROL_STATUS.not_implemented;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ---- Control priority ----------------------------------------

const CONTROL_PRIORITY: Record<string, { label: string; cls: string }> = {
  low:      { label: "Low",      cls: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]" },
  medium:   { label: "Medium",   cls: "text-amber-700 border-amber-200 bg-amber-100" },
  high:     { label: "High",     cls: "text-red-700 border-red-200 bg-red-100" },
  critical: { label: "Critical", cls: "text-red-700 border-red-200 bg-red-100" },
};

export function ControlPriorityBadge({ priority }: { priority: string }) {
  const { label, cls } = CONTROL_PRIORITY[priority] ?? CONTROL_PRIORITY.medium;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ---- Evidence status ----------------------------------------

const EVIDENCE_STATUS: Record<string, { label: string; cls: string }> = {
  draft:          { label: "Draft",          cls: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]" },
  pending_review: { label: "Pending Review", cls: "text-[var(--color-blue)] border-[var(--color-blue)]/30 bg-[var(--color-blue)]/10" },
  approved:       { label: "Approved",       cls: "text-emerald-700 border-emerald-200 bg-emerald-100" },
  expired:        { label: "Expired",        cls: "text-amber-700 border-amber-200 bg-amber-100" },
  archived:       { label: "Archived",       cls: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-white" },
};

export function EvidenceStatusBadge({ status }: { status: string }) {
  const { label, cls } = EVIDENCE_STATUS[status] ?? EVIDENCE_STATUS.draft;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ---- Evidence source ----------------------------------------

const EVIDENCE_SOURCE: Record<string, { label: string; cls: string }> = {
  vendor_document:   { label: "Vendor Doc",   cls: "text-[var(--color-blue)] border-[var(--color-blue)]/30 bg-[var(--color-blue)]/10" },
  vendor_assessment: { label: "Assessment",   cls: "text-purple-700 border-purple-200 bg-purple-100" },
  vendor_review:     { label: "Review",       cls: "text-indigo-700 border-indigo-200 bg-indigo-100" },
  manual:            { label: "Manual",       cls: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]" },
  policy:            { label: "Policy",       cls: "text-emerald-700 border-emerald-200 bg-emerald-100" },
};

export function EvidenceSourceBadge({ source }: { source: string }) {
  const { label, cls } = EVIDENCE_SOURCE[source] ?? EVIDENCE_SOURCE.manual;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ---- Policy status ------------------------------------------

const POLICY_STATUS: Record<string, { label: string; cls: string }> = {
  draft:    { label: "Draft",    cls: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]" },
  review:   { label: "Review",   cls: "text-[var(--color-blue)] border-[var(--color-blue)]/30 bg-[var(--color-blue)]/10" },
  approved: { label: "Approved", cls: "text-emerald-700 border-emerald-200 bg-emerald-100" },
  archived: { label: "Archived", cls: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-white" },
  expired:  { label: "Expired",  cls: "text-amber-700 border-amber-200 bg-amber-100" },
};

export function PolicyStatusBadge({ status }: { status: string }) {
  const { label, cls } = POLICY_STATUS[status] ?? POLICY_STATUS.draft;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ---- Gap severity -------------------------------------------

export function GapSeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    low:      { label: "Low",      cls: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]" },
    medium:   { label: "Medium",   cls: "text-amber-700 border-amber-200 bg-amber-100" },
    high:     { label: "High",     cls: "text-red-700 border-red-200 bg-red-100" },
    critical: { label: "Critical", cls: "text-red-700 border-red-200 bg-red-100" },
  };
  const { label, cls } = map[severity] ?? map.medium;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
