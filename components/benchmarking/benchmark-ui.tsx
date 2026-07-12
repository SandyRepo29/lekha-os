import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BenchmarkMaturityLevel, BenchmarkRankingLabel } from "@/lib/services/benchmarking-score";

// ---- BenchmarkStat — accent stat card (border-l-2 pattern) ----

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

export function BenchmarkStat({
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

// ---- MaturityBadge ----

const MATURITY_STYLES: Record<BenchmarkMaturityLevel, { text: string; bg: string; border: string }> = {
  reactive:     { text: "text-red-700",    bg: "bg-red-100",     border: "border-red-200" },
  managed:      { text: "text-orange-700", bg: "bg-orange-100",  border: "border-orange-200" },
  defined:      { text: "text-amber-700",  bg: "bg-amber-100",   border: "border-amber-200" },
  measured:     { text: "text-blue-700",   bg: "bg-blue-100",    border: "border-blue-200" },
  optimized:    { text: "text-emerald-700",bg: "bg-emerald-100", border: "border-emerald-200" },
  trust_leader: { text: "text-purple-700", bg: "bg-purple-100",  border: "border-purple-200" },
};

const MATURITY_LABELS: Record<BenchmarkMaturityLevel, string> = {
  reactive:     "Reactive",
  managed:      "Developing",
  defined:      "Established",
  measured:     "Advanced",
  optimized:    "Leading",
  trust_leader: "Trust Leader",
};

export function MaturityBadge({
  level,
  className,
}: {
  level: BenchmarkMaturityLevel;
  className?: string;
}) {
  const s = MATURITY_STYLES[level];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        s.text,
        s.bg,
        s.border,
        className
      )}
    >
      {MATURITY_LABELS[level]}
    </span>
  );
}

// ---- PercentileBadge ----

function percentileAccent(pct: number | null): { text: string; bg: string; border: string } {
  if (pct === null) return { text: "text-[var(--color-ink-dim)]", bg: "bg-[#F8F9FB]", border: "border-[var(--color-line)]" };
  if (pct >= 90) return { text: "text-purple-700",  bg: "bg-purple-100",  border: "border-purple-200" };
  if (pct >= 75) return { text: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-200" };
  if (pct >= 50) return { text: "text-blue-700",    bg: "bg-blue-100",    border: "border-blue-200" };
  if (pct >= 25) return { text: "text-amber-700",   bg: "bg-amber-100",   border: "border-amber-200" };
  return           { text: "text-red-700",    bg: "bg-red-100",    border: "border-red-200" };
}

export function PercentileBadge({
  percentile,
  className,
}: {
  percentile: number | null;
  className?: string;
}) {
  const s = percentileAccent(percentile);
  const label = percentile !== null ? `${percentile}th pct` : "No data";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        s.text,
        s.bg,
        s.border,
        className
      )}
    >
      {label}
    </span>
  );
}

// ---- RankingBadge — wraps BENCHMARK_RANKING_LABELS with colour ----

const RANKING_STYLES: Record<BenchmarkRankingLabel, { text: string; bg: string; border: string }> = {
  top_1_percent:  { text: "text-purple-700",  bg: "bg-purple-100",  border: "border-purple-200" },
  top_5_percent:  { text: "text-purple-700",  bg: "bg-purple-100",  border: "border-purple-200" },
  top_10_percent: { text: "text-blue-700",    bg: "bg-blue-100",    border: "border-blue-200" },
  top_quartile:   { text: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-200" },
  above_average:  { text: "text-emerald-700", bg: "bg-emerald-500/[0.07]", border: "border-emerald-200" },
  average:        { text: "text-amber-700",   bg: "bg-amber-100",   border: "border-amber-200" },
  below_average:  { text: "text-orange-700",  bg: "bg-orange-100",  border: "border-orange-200" },
  at_risk:        { text: "text-red-700",     bg: "bg-red-100",     border: "border-red-200" },
};

export function RankingBadge({
  ranking,
  label,
  className,
}: {
  ranking: BenchmarkRankingLabel;
  label: string;
  className?: string;
}) {
  const s = RANKING_STYLES[ranking];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        s.text,
        s.bg,
        s.border,
        className
      )}
    >
      {label}
    </span>
  );
}

// ---- PercentileBar ----

export function PercentileBar({ percentile }: { percentile: number | null }) {
  const pct = percentile ?? 0;
  const color =
    pct >= 90 ? "bg-purple-500" :
    pct >= 75 ? "bg-emerald-500" :
    pct >= 50 ? "bg-blue-500" :
    pct >= 25 ? "bg-amber-500" :
    "bg-red-500";
  return (
    <div className="w-full h-1.5 rounded-full bg-white/10">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}
