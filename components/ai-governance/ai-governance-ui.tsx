import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---- AIGovStat — border-l-2 accent stat card ----

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

export function AIGovStat({
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

// ---- AIRiskLevelBadge ----

const AI_RISK_LEVEL_STYLES: Record<string, string> = {
  critical:   "bg-red-500/10 text-red-400",
  high:       "bg-orange-500/10 text-orange-400",
  medium:     "bg-yellow-500/10 text-yellow-400",
  moderate:   "bg-yellow-500/10 text-yellow-400",
  low:        "bg-emerald-500/10 text-emerald-400",
  prohibited: "bg-purple-500/10 text-purple-400",
};

const AI_RISK_LEVEL_LABELS: Record<string, string> = {
  critical:   "Critical",
  high:       "High",
  medium:     "Medium",
  moderate:   "Moderate",
  low:        "Low",
  prohibited: "Prohibited",
};

export function AIRiskLevelBadge({ level }: { level: string }) {
  const cls = AI_RISK_LEVEL_STYLES[level] ?? "bg-white/5 text-[var(--color-ink-faint)]";
  const label = AI_RISK_LEVEL_LABELS[level] ?? level;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ---- AISystemTypeBadge ----

const AI_SYSTEM_TYPE_STYLES: Record<string, string> = {
  llm:               "bg-[var(--color-blue)]/10 text-[var(--color-blue)]",
  ml_model:          "bg-violet-500/10 text-violet-400",
  decision_system:   "bg-amber-500/10 text-amber-400",
  recommendation:    "bg-sky-500/10 text-sky-400",
  nlp:               "bg-indigo-500/10 text-indigo-400",
  computer_vision:   "bg-teal-500/10 text-teal-400",
  automation:        "bg-emerald-500/10 text-emerald-400",
  commercial:        "bg-[var(--color-blue)]/10 text-[var(--color-blue)]",
  open_source:       "bg-emerald-500/10 text-emerald-400",
  internal:          "bg-violet-500/10 text-violet-400",
  agent:             "bg-amber-500/10 text-amber-400",
  rag:               "bg-sky-500/10 text-sky-400",
  llm_app:           "bg-indigo-500/10 text-indigo-400",
  workflow:          "bg-teal-500/10 text-teal-400",
  other:             "bg-white/5 text-[var(--color-ink-dim)]",
};

const AI_SYSTEM_TYPE_LABELS: Record<string, string> = {
  llm:             "LLM",
  ml_model:        "ML Model",
  decision_system: "Decision System",
  recommendation:  "Recommendation",
  nlp:             "NLP",
  computer_vision: "Computer Vision",
  automation:      "Automation",
  commercial:      "Commercial",
  open_source:     "Open Source",
  internal:        "Internal",
  agent:           "Agent",
  rag:             "RAG",
  llm_app:         "LLM App",
  workflow:        "Workflow",
  other:           "Other",
};

export function AISystemTypeBadge({ type }: { type: string }) {
  const cls = AI_SYSTEM_TYPE_STYLES[type] ?? "bg-white/5 text-[var(--color-ink-faint)]";
  const label = AI_SYSTEM_TYPE_LABELS[type] ?? type;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ---- AIIncidentSeverityBadge ----

const AI_INCIDENT_SEV_STYLES: Record<string, string> = {
  critical:      "bg-red-500/10 text-red-400",
  high:          "bg-orange-500/10 text-orange-400",
  medium:        "bg-yellow-500/10 text-yellow-400",
  low:           "bg-emerald-500/10 text-emerald-400",
  informational: "bg-[var(--color-blue)]/10 text-[var(--color-blue)]",
};

const AI_INCIDENT_SEV_LABELS: Record<string, string> = {
  critical:      "Critical",
  high:          "High",
  medium:        "Medium",
  low:           "Low",
  informational: "Info",
};

export function AIIncidentSeverityBadge({ severity }: { severity: string }) {
  const cls = AI_INCIDENT_SEV_STYLES[severity] ?? "bg-white/5 text-[var(--color-ink-faint)]";
  const label = AI_INCIDENT_SEV_LABELS[severity] ?? severity;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ---- AIComplianceBadge ----

const AI_COMPLIANCE_STYLES: Record<string, string> = {
  compliant:     "bg-emerald-500/10 text-emerald-400",
  partial:       "bg-amber-500/10 text-amber-400",
  non_compliant: "bg-red-500/10 text-red-400",
  not_assessed:  "bg-white/5 text-[var(--color-ink-faint)]",
};

const AI_COMPLIANCE_LABELS: Record<string, string> = {
  compliant:     "Compliant",
  partial:       "Partial",
  non_compliant: "Non-Compliant",
  not_assessed:  "Not Assessed",
};

export function AIComplianceBadge({ status }: { status: string }) {
  const cls = AI_COMPLIANCE_STYLES[status] ?? "bg-white/5 text-[var(--color-ink-faint)]";
  const label = AI_COMPLIANCE_LABELS[status] ?? status;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
