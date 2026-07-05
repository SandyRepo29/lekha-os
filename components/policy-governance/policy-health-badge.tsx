"use client";

import { getHealthLevel, HEALTH_LEVEL_LABELS, HEALTH_LEVEL_BG, HEALTH_LEVEL_COLORS } from "@/lib/services/policy-health";
import { cn } from "@/lib/utils";

interface PolicyHealthBadgeProps {
  score: number | null;
  className?: string;
  showScore?: boolean;
}

export function PolicyHealthBadge({ score, className, showScore = true }: PolicyHealthBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-slate-100 border-slate-200 text-[var(--color-ink-dim)]", className)}>
        Not scored
      </span>
    );
  }

  const level = getHealthLevel(score);
  const label = HEALTH_LEVEL_LABELS[level];
  const bgCls = HEALTH_LEVEL_BG[level];
  const textCls = HEALTH_LEVEL_COLORS[level];

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", bgCls, textCls, className)}>
      {showScore && <span>{score}</span>}
      <span>{label}</span>
    </span>
  );
}
