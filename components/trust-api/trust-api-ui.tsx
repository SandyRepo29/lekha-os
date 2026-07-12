import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---- TrustAPIStat — accent stat card (border-l-2 pattern) ----

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

export function TrustAPIStat({
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

// ---- ApiKeyStatusBadge ----

const API_KEY_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active:  { label: "Active",  cls: "bg-emerald-100 text-emerald-700" },
  revoked: { label: "Revoked", cls: "bg-red-100 text-red-700" },
  expired: { label: "Expired", cls: "bg-slate-100 text-slate-700" },
};

export function ApiKeyStatusBadge({ status }: { status: string }) {
  const s = API_KEY_STATUS_MAP[status] ?? { label: status, cls: "bg-white/5 text-[var(--color-ink-faint)]" };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", s.cls)}>
      {s.label}
    </span>
  );
}

// ---- WebhookStatusBadge ----

const WEBHOOK_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-700" },
  paused: { label: "Paused", cls: "bg-amber-100 text-amber-700" },
  error:  { label: "Error",  cls: "bg-red-100 text-red-700" },
};

export function WebhookStatusBadge({ status }: { status: string }) {
  const s = WEBHOOK_STATUS_MAP[status] ?? { label: status, cls: "bg-white/5 text-[var(--color-ink-faint)]" };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", s.cls)}>
      {s.label}
    </span>
  );
}

// ---- ApiPlanBadge ----

const API_PLAN_MAP: Record<string, { label: string; cls: string }> = {
  free:       { label: "Free",       cls: "bg-emerald-100 text-emerald-700 border border-emerald-500/20" },
  growth:     { label: "Growth",     cls: "bg-blue-100 text-blue-700 border border-blue-500/20" },
  business:   { label: "Business",   cls: "bg-violet-100 text-violet-700 border border-violet-500/20" },
  enterprise: { label: "Enterprise", cls: "bg-amber-100 text-amber-700 border border-amber-500/20" },
};

export function ApiPlanBadge({ plan }: { plan: string }) {
  const s = API_PLAN_MAP[plan] ?? { label: plan, cls: "bg-white/5 text-[var(--color-ink-faint)]" };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", s.cls)}>
      {s.label}
    </span>
  );
}
