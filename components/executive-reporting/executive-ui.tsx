import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, CheckCircle2, Clock, Archive, FileEdit } from "lucide-react";

// ---- ExecStat — accent stat card (border-l-2 pattern, mirrors ControlStat) ----

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

export function ExecStat({
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

// ---- KpiBadge — trend badge: up / down / stable ----

type KpiTrend = "up" | "down" | "stable";

export function KpiBadge({
  trend,
  delta,
  inverse = false,
}: {
  trend: KpiTrend;
  delta?: number;
  /** When true, "up" is bad (e.g. open risks rising) */
  inverse?: boolean;
}) {
  const isGood = inverse ? trend === "down" : trend === "up";
  const isBad  = inverse ? trend === "up"   : trend === "down";

  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const cls = isGood
    ? "bg-emerald-100 text-emerald-700"
    : isBad
    ? "bg-red-100 text-red-700"
    : "bg-[var(--color-line)] text-[var(--color-ink-dim)]";

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", cls)}>
      <Icon className="h-3 w-3" />
      {delta !== undefined && (
        <span>{delta > 0 ? "+" : ""}{delta.toFixed(1)}</span>
      )}
    </span>
  );
}

// ---- ReportStatusBadge ----

type ReportStatus = "draft" | "ready" | "published" | "scheduled" | "archived" | "generating" | "failed";

const REPORT_STATUS_CFG: Record<ReportStatus, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
  draft:      { label: "Draft",      cls: "bg-[var(--color-line)] text-[var(--color-ink-dim)]",  Icon: FileEdit },
  ready:      { label: "Ready",      cls: "bg-emerald-100 text-emerald-700",                  Icon: CheckCircle2 },
  published:  { label: "Published",  cls: "bg-emerald-100 text-emerald-700",                  Icon: CheckCircle2 },
  scheduled:  { label: "Scheduled",  cls: "bg-[var(--color-blue)]/15 text-[var(--color-blue)]", Icon: Clock },
  archived:   { label: "Archived",   cls: "bg-[var(--color-line)] text-[var(--color-ink-dim)]",  Icon: Archive },
  generating: { label: "Generating", cls: "bg-amber-100 text-amber-700",                      Icon: Clock },
  failed:     { label: "Failed",     cls: "bg-red-100 text-red-700",                          Icon: FileEdit },
};

export function ReportStatusBadge({ status }: { status: string }) {
  const cfg = REPORT_STATUS_CFG[status as ReportStatus] ?? REPORT_STATUS_CFG.draft;
  const { label, cls, Icon } = cfg;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", cls)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

// ---- ForecastBadge ----

type ForecastTrend = "improving" | "declining" | "stable";

export function ForecastBadge({ trend }: { trend: ForecastTrend | string }) {
  const cfg =
    trend === "improving"
      ? { label: "Improving", cls: "bg-emerald-100 text-emerald-700", Icon: TrendingUp }
      : trend === "declining"
      ? { label: "Declining", cls: "bg-red-100 text-red-700",         Icon: TrendingDown }
      : { label: "Stable",    cls: "bg-[var(--color-line)] text-[var(--color-ink-dim)]", Icon: Minus };

  const { label, cls, Icon } = cfg;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", cls)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

// ---- ScorecardStatusBadge ----

type ScorecardStatus = "on_track" | "monitor" | "attention";

export function ScorecardStatusBadge({ status }: { status: ScorecardStatus | string }) {
  const cfg =
    status === "on_track" || status === "green"
      ? { label: "On Track",  cls: "bg-emerald-100 text-emerald-700" }
      : status === "monitor" || status === "amber"
      ? { label: "Monitor",   cls: "bg-amber-100 text-amber-700" }
      : { label: "Attention", cls: "bg-red-100 text-red-700" };

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", cfg.cls)}>
      {cfg.label}
    </span>
  );
}
