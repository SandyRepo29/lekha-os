import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---- TrustNetworkStat — accent stat card (border-l-2 pattern) ----

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

export function TrustNetworkStat({
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

// ---- RelationshipTypeBadge ----

// Values must match the trust_relationship_type pg enum (customer · vendor · partner).
const RELATIONSHIP_TYPE_STYLES: Record<string, { label: string; classes: string }> = {
  partner:  { label: "Partner",  classes: "bg-emerald-100 text-emerald-700" },
  customer: { label: "Customer", classes: "bg-blue-100    text-blue-700"    },
  vendor:   { label: "Vendor",   classes: "bg-indigo-100  text-indigo-700"  },
};

export function RelationshipTypeBadge({ type }: { type: string }) {
  const s = RELATIONSHIP_TYPE_STYLES[type] ?? { label: type, classes: "bg-slate-100 text-[var(--color-ink-dim)]" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", s.classes)}>
      {s.label}
    </span>
  );
}

// ---- NetworkStatusBadge ----

const NETWORK_STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  active:     { label: "Active",     classes: "bg-emerald-100 text-emerald-700" },
  pending:    { label: "Pending",    classes: "bg-amber-100   text-amber-700"   },
  terminated: { label: "Terminated", classes: "bg-red-100     text-red-700"     },
  suspended:  { label: "Suspended",  classes: "bg-orange-100  text-orange-700"  },
};

export function NetworkStatusBadge({ status }: { status: string }) {
  const s = NETWORK_STATUS_STYLES[status] ?? { label: status, classes: "bg-slate-100 text-[var(--color-ink-dim)]" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", s.classes)}>
      {s.label}
    </span>
  );
}

// ---- TrustNetworkFilterChip ----

export function TrustNetworkFilterChip({
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
