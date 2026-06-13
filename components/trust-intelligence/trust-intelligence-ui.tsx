"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---- TrustStat — accent stat card (border-l-2 pattern) ----

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

export function TrustStat({
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
    <Card className={cn("border-l-2 px-4 py-3", border, leftBar, bg, href && "hover:bg-white/[0.03] transition-colors")}>
      <p className="text-xs text-[var(--color-ink-faint)]">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{sub}</p>}
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ---- TIStat — legacy inline stat (used inside existing Cards) ----

export function TIStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "blue" | "green" | "amber" | "red" | "purple";
}) {
  const accentClass = {
    blue:   "text-[var(--color-blue)]",
    green:  "text-green-400",
    amber:  "text-amber-400",
    red:    "text-red-400",
    purple: "text-purple-400",
  }[accent ?? "blue"];

  return (
    <div>
      <p className="text-xs text-[var(--color-ink-faint)]">{label}</p>
      <p className={cn("font-[family-name:var(--font-display)] text-2xl font-bold mt-0.5", accentClass)}>
        {value}
      </p>
      {sub && <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">{sub}</p>}
    </div>
  );
}

export function ComponentBar({
  label,
  score,
  weight,
}: {
  label: string;
  score: number;
  weight: number;
}) {
  const color =
    score >= 80 ? "bg-emerald-500" :
    score >= 60 ? "bg-yellow-500" :
    score >= 40 ? "bg-amber-500" :
    "bg-red-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--color-ink-dim)]">{label}</span>
        <span className="text-xs font-semibold text-[var(--color-ink)]">
          {score}<span className="text-[var(--color-ink-faint)]">/100</span>
          <span className="ml-2 text-[10px] text-[var(--color-ink-faint)]">{weight}%</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function PriorityChip({ priority }: { priority: "high" | "medium" | "low" }) {
  const styles = {
    high: "bg-red-500/10 border-red-500/30 text-red-400",
    medium: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    low: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", styles[priority])}>
      {priority}
    </span>
  );
}

export function CategoryChip({ category }: { category: string }) {
  const styles: Record<string, string> = {
    vendor: "bg-purple-500/10 border-purple-500/30 text-purple-400",
    risk: "bg-red-500/10 border-red-500/30 text-red-400",
    control: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    audit: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    compliance: "bg-green-500/10 border-green-500/30 text-green-400",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize", styles[category] ?? "bg-white/5 border-white/10 text-[var(--color-ink-dim)]")}>
      {category}
    </span>
  );
}
