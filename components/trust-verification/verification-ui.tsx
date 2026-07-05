import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---- VerificationStat — accent stat card (border-l-2 pattern) ----

type StatAccent = "danger" | "warn" | "good" | "neutral";

const ACCENT_BORDER: Record<StatAccent, string> = {
  danger:  "border-red-200",
  warn:    "border-amber-200",
  good:    "border-emerald-200",
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

export function VerificationStat({
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

// ---- VerificationStatusBadge ----

const VERIFICATION_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  applied:                { label: "Applied",            cls: "bg-blue-100 text-blue-700" },
  under_review:           { label: "Under Review",       cls: "bg-amber-100 text-amber-700" },
  evidence_review:        { label: "Evidence Review",    cls: "bg-purple-100 text-purple-700" },
  decision_pending:       { label: "Decision Pending",   cls: "bg-sky-100 text-sky-700" },
  approved:               { label: "Approved",           cls: "bg-emerald-100 text-emerald-700" },
  conditionally_approved: { label: "Conditional",        cls: "bg-teal-100 text-teal-700" },
  rejected:               { label: "Rejected",           cls: "bg-red-100 text-red-700" },
  revoked:                { label: "Revoked",            cls: "bg-red-100 text-red-500" },
  expired:                { label: "Expired",            cls: "bg-slate-100 text-slate-700" },
  suspended:              { label: "Suspended",          cls: "bg-orange-100 text-orange-700" },
  pending:                { label: "Pending",            cls: "bg-amber-100 text-amber-700" },
  in_review:              { label: "In Review",          cls: "bg-blue-100 text-[var(--color-blue)]" },
  renewal_required:       { label: "Renewal Required",   cls: "bg-amber-100 text-amber-500" },
};

export function VerificationStatusBadge({ status }: { status: string }) {
  const s = VERIFICATION_STATUS_MAP[status] ?? { label: status.replace(/_/g, " "), cls: "bg-slate-100 text-[var(--color-ink-faint)]" };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", s.cls)}>
      {s.label}
    </span>
  );
}

// ---- VerificationLevelBadge ----

const LEVEL_MAP: Record<string, { label: string; cls: string }> = {
  level_1: { label: "Level 1 · Verified",      cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  level_2: { label: "Level 2 · Trusted",        cls: "bg-blue-100 text-blue-700 border border-blue-200" },
  level_3: { label: "Level 3 · Advanced",       cls: "bg-violet-100 text-violet-700 border border-violet-200" },
  level_4: { label: "Level 4 · Trust Leader",   cls: "bg-amber-100 text-amber-700 border border-amber-200" },
};

export function VerificationLevelBadge({ level }: { level: string }) {
  const s = LEVEL_MAP[level] ?? { label: level.replace("level_", "Level "), cls: "bg-slate-100 text-[var(--color-ink-faint)]" };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", s.cls)}>
      {s.label}
    </span>
  );
}

// ---- CertificateStatusBadge ----

const CERT_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active:    { label: "Active",    cls: "bg-emerald-100 text-emerald-700" },
  expired:   { label: "Expired",   cls: "bg-slate-100 text-slate-700" },
  revoked:   { label: "Revoked",   cls: "bg-red-100 text-red-700" },
  suspended: { label: "Suspended", cls: "bg-orange-100 text-orange-700" },
};

export function CertificateStatusBadge({ status }: { status: string }) {
  const s = CERT_STATUS_MAP[status] ?? { label: status, cls: "bg-slate-100 text-[var(--color-ink-faint)]" };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", s.cls)}>
      {s.label}
    </span>
  );
}
