"use client";

/**
 * Shared badge components for the AI Governance™ module.
 * Client component — safe to render in any RSC tree.
 */

// ---- AI System Type ------------------------------------------

const AI_SYSTEM_TYPE: Record<string, { label: string; cls: string }> = {
  commercial:   { label: "Commercial",   cls: "text-[var(--color-blue)] border-[var(--color-blue)]/30 bg-[var(--color-blue)]/10" },
  open_source:  { label: "Open Source",  cls: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  internal:     { label: "Internal",     cls: "text-violet-400 border-violet-500/30 bg-violet-500/10" },
  agent:        { label: "Agent",        cls: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  rag:          { label: "RAG",          cls: "text-sky-400 border-sky-500/30 bg-sky-500/10" },
  llm_app:      { label: "LLM App",      cls: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10" },
  workflow:     { label: "Workflow",     cls: "text-teal-400 border-teal-500/30 bg-teal-500/10" },
};

export function AiSystemTypeBadge({ type }: { type: string }) {
  const { label, cls } = AI_SYSTEM_TYPE[type] ?? {
    label: type,
    cls: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

// ---- AI Risk Level -------------------------------------------

const AI_RISK_LEVEL: Record<string, { label: string; cls: string }> = {
  low:        { label: "Low",        cls: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  moderate:   { label: "Moderate",   cls: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" },
  high:       { label: "High",       cls: "text-orange-400 border-orange-500/30 bg-orange-500/10" },
  critical:   { label: "Critical",   cls: "text-red-400 border-red-500/30 bg-red-500/10" },
  prohibited: { label: "Prohibited", cls: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
};

export function AiRiskLevelBadge({ level }: { level: string }) {
  const { label, cls } = AI_RISK_LEVEL[level] ?? {
    label: level,
    cls: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

// ---- AI Approval Status --------------------------------------

const AI_APPROVAL_STATUS: Record<string, { label: string; cls: string }> = {
  approved:        { label: "Approved",        cls: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  pending:         { label: "Pending",         cls: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" },
  under_review:    { label: "Under Review",    cls: "text-[var(--color-blue)] border-[var(--color-blue)]/30 bg-[var(--color-blue)]/10" },
  rejected:        { label: "Rejected",        cls: "text-red-400 border-red-500/30 bg-red-500/10" },
  decommissioned:  { label: "Decommissioned",  cls: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]" },
};

export function AiApprovalStatusBadge({ status }: { status: string }) {
  const { label, cls } = AI_APPROVAL_STATUS[status] ?? {
    label: status,
    cls: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

// ---- AI Trust Level ------------------------------------------

const AI_TRUST_LEVEL: Record<string, { label: string; cls: string }> = {
  trusted:         { label: "Trusted",         cls: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  managed:         { label: "Managed",         cls: "text-[var(--color-blue)] border-[var(--color-blue)]/30 bg-[var(--color-blue)]/10" },
  monitored:       { label: "Monitored",       cls: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" },
  needs_attention: { label: "Needs Attention", cls: "text-orange-400 border-orange-500/30 bg-orange-500/10" },
  high_risk:       { label: "High Risk",       cls: "text-red-400 border-red-500/30 bg-red-500/10" },
  restricted:      { label: "Restricted",      cls: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
};

export function AiTrustLevelBadge({ level }: { level: string }) {
  const { label, cls } = AI_TRUST_LEVEL[level] ?? {
    label: level,
    cls: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

// ---- AI Incident Severity ------------------------------------
// Reuses the same color scale as AiRiskLevelBadge.

const AI_INCIDENT_SEVERITY: Record<string, { label: string; cls: string }> = {
  low:        { label: "Low",        cls: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  moderate:   { label: "Moderate",   cls: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" },
  high:       { label: "High",       cls: "text-orange-400 border-orange-500/30 bg-orange-500/10" },
  critical:   { label: "Critical",   cls: "text-red-400 border-red-500/30 bg-red-500/10" },
  prohibited: { label: "Prohibited", cls: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
};

export function AiIncidentSeverityBadge({ severity }: { severity: string }) {
  const { label, cls } = AI_INCIDENT_SEVERITY[severity] ?? {
    label: severity,
    cls: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}
