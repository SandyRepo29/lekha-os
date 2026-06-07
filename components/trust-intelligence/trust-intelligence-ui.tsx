"use client";

import { cn } from "@/lib/utils";

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
    blue: "text-[var(--color-blue)]",
    green: "text-green-400",
    amber: "text-amber-400",
    red: "text-red-400",
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
