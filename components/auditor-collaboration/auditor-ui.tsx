import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---- AuditorStat — accent stat card (border-l-2 pattern) ----

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

export function AuditorStat({
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

// ---- EvidenceRequestStatusBadge ----

const EVIDENCE_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:      { label: "Pending",      cls: "bg-amber-100 text-amber-700" },
  submitted:    { label: "Submitted",    cls: "bg-blue-100 text-blue-700" },
  under_review: { label: "Under Review", cls: "bg-purple-100 text-purple-700" },
  accepted:     { label: "Accepted",     cls: "bg-emerald-100 text-emerald-700" },
  rejected:     { label: "Rejected",     cls: "bg-red-100 text-red-700" },
  overdue:      { label: "Overdue",      cls: "bg-red-700/15 text-red-500" },
  expired:      { label: "Expired",      cls: "bg-slate-100 text-slate-700" },
};

export function EvidenceRequestStatusBadge({ status }: { status: string }) {
  const s = EVIDENCE_STATUS_MAP[status] ?? { label: status, cls: "bg-white/5 text-[var(--color-ink-faint)]" };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", s.cls)}>
      {s.label}
    </span>
  );
}

// ---- ExternalFindingStatusBadge ----

const FINDING_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  open:             { label: "Open",             cls: "bg-red-100 text-red-700" },
  in_remediation:   { label: "In Remediation",   cls: "bg-amber-100 text-amber-700" },
  ready_for_review: { label: "Ready for Review",  cls: "bg-blue-100 text-blue-700" },
  verified:         { label: "Verified",          cls: "bg-emerald-100 text-emerald-700" },
  closed:           { label: "Closed",            cls: "bg-slate-100 text-slate-700" },
  accepted:         { label: "Accepted",          cls: "bg-purple-100 text-purple-700" },
};

export function ExternalFindingStatusBadge({ status }: { status: string }) {
  const s = FINDING_STATUS_MAP[status] ?? { label: status.replace(/_/g, " "), cls: "bg-white/5 text-[var(--color-ink-faint)]" };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", s.cls)}>
      {s.label}
    </span>
  );
}

// ---- AuditRoomStatusBadge ----

const ROOM_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  planning:     { label: "Planning",     cls: "bg-slate-100 text-slate-700" },
  active:       { label: "Active",       cls: "bg-emerald-100 text-emerald-700" },
  under_review: { label: "Under Review", cls: "bg-amber-100 text-amber-700" },
  completed:    { label: "Completed",    cls: "bg-blue-100 text-blue-700" },
  archived:     { label: "Archived",     cls: "bg-slate-600/15 text-slate-500" },
  cancelled:    { label: "Cancelled",    cls: "bg-red-100 text-red-700" },
};

export function AuditRoomStatusBadge({ status }: { status: string }) {
  const s = ROOM_STATUS_MAP[status] ?? { label: status.replace(/_/g, " "), cls: "bg-white/5 text-[var(--color-ink-faint)]" };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", s.cls)}>
      {s.label}
    </span>
  );
}

// ---- ExternalUserTypeBadge ----

const USER_TYPE_MAP: Record<string, { label: string; cls: string }> = {
  iso_auditor:            { label: "ISO Auditor",        cls: "bg-indigo-100 text-indigo-700" },
  soc_auditor:            { label: "SOC Auditor",        cls: "bg-violet-500/15 text-violet-400" },
  dpdp_assessor:          { label: "DPDP Assessor",      cls: "bg-sky-500/15 text-sky-400" },
  security_assessor:      { label: "Security Assessor",  cls: "bg-orange-100 text-orange-700" },
  privacy_consultant:     { label: "Privacy Consultant", cls: "bg-pink-500/15 text-pink-400" },
  ai_governance_reviewer: { label: "AI Governance",      cls: "bg-purple-100 text-purple-700" },
  customer_reviewer:      { label: "Customer Reviewer",  cls: "bg-teal-500/15 text-teal-400" },
  third_party_reviewer:   { label: "Third Party",        cls: "bg-slate-100 text-slate-700" },
  law_firm:               { label: "Law Firm",           cls: "bg-amber-100 text-amber-700" },
  auditor:                { label: "Auditor",            cls: "bg-blue-100 text-blue-700" },
};

export function ExternalUserTypeBadge({ userType }: { userType: string }) {
  const s = USER_TYPE_MAP[userType] ?? { label: userType.replace(/_/g, " "), cls: "bg-white/5 text-[var(--color-ink-faint)]" };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", s.cls)}>
      {s.label}
    </span>
  );
}
