import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---- TrustExchangeStat — accent stat card (border-l-2 pattern) ----

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

export function TrustExchangeStat({
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

// ---- TrustDocStatusBadge ----

const DOC_STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  pending:  { label: "Pending",  classes: "bg-amber-100  text-amber-700"  },
  verified: { label: "Verified", classes: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected", classes: "bg-red-100    text-red-700"    },
  expired:  { label: "Expired",  classes: "bg-orange-100 text-orange-700" },
  revoked:  { label: "Revoked",  classes: "bg-slate-100  text-slate-700"  },
};

export function TrustDocStatusBadge({ status }: { status: string }) {
  const s = DOC_STATUS_STYLES[status] ?? { label: status, classes: "bg-slate-100 text-[var(--color-ink-dim)]" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", s.classes)}>
      {s.label}
    </span>
  );
}

// ---- TrustBadgeTypeBadge ----

const BADGE_TYPE_STYLES: Record<string, { label: string; classes: string }> = {
  audt_verified:   { label: "AUDT Verified™",    classes: "bg-blue-100    text-blue-700"    },
  dpdp_ready:      { label: "DPDP Ready™",        classes: "bg-indigo-100  text-indigo-700"  },
  privacy_verified:{ label: "Privacy Verified™",  classes: "bg-purple-100  text-purple-700"  },
  vendor_trusted:  { label: "Vendor Trusted™",    classes: "bg-emerald-100 text-emerald-700" },
  low_risk:        { label: "Low Risk Vendor™",   classes: "bg-teal-100    text-teal-700"    },
  enterprise_ready:{ label: "Enterprise Ready™",  classes: "bg-yellow-100  text-yellow-700"  },
  iso_verified:    { label: "ISO Verified™",      classes: "bg-orange-100  text-orange-700"  },
  soc2_verified:   { label: "SOC2 Verified™",     classes: "bg-red-100     text-red-700"     },
  custom:          { label: "Custom",              classes: "bg-slate-100   text-slate-700"   },
};

export function TrustBadgeTypeBadge({ badgeType }: { badgeType: string }) {
  const s = BADGE_TYPE_STYLES[badgeType] ?? { label: badgeType, classes: "bg-slate-100 text-[var(--color-ink-dim)]" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", s.classes)}>
      {s.label}
    </span>
  );
}

// ---- QuestionnaireStatusBadge ----

const QUESTIONNAIRE_STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  draft:     { label: "Draft",     classes: "bg-slate-100  text-slate-700"   },
  published: { label: "Published", classes: "bg-blue-100   text-blue-700"    },
  completed: { label: "Completed", classes: "bg-emerald-100 text-emerald-700" },
  archived:  { label: "Archived",  classes: "bg-slate-100      text-[var(--color-ink-faint)]" },
};

export function QuestionnaireStatusBadge({ status }: { status: string }) {
  const s = QUESTIONNAIRE_STATUS_STYLES[status] ?? { label: status, classes: "bg-slate-100 text-[var(--color-ink-dim)]" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", s.classes)}>
      {s.label}
    </span>
  );
}

// ---- TrustExchangeFilterChip ----

export function TrustExchangeFilterChip({
  label,
  active,
  href,
}: {
  label: string;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-[var(--color-blue)]/20 text-[var(--color-blue)]"
          : "bg-[#F8F9FB] text-[var(--color-ink-dim)] hover:bg-[#F8F9FB]"
      )}
    >
      {label}
    </Link>
  );
}
