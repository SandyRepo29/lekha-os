"use client";

import { cn } from "@/lib/utils";
import {
  getOrgTrustLevel,
  ORG_TRUST_LEVEL_LABELS,
  ORG_TRUST_LEVEL_BG,
  ORG_TRUST_LEVEL_COLORS,
  type OrgTrustLevel,
} from "@/lib/services/org-trust-score";

type Props = { score: number; showScore?: boolean; className?: string };

export function OrgTrustBadge({ score, showScore = true, className }: Props) {
  const level = getOrgTrustLevel(score);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        ORG_TRUST_LEVEL_BG[level],
        className
      )}
    >
      {showScore && <span className="font-bold">{score}</span>}
      {ORG_TRUST_LEVEL_LABELS[level]}
    </span>
  );
}

export function OrgTrustScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const level = getOrgTrustLevel(score);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const strokeColor: Record<OrgTrustLevel, string> = {
    exceptional: "#34d399",
    trusted: "#34d399",
    strong: "#4ade80",
    moderate: "#facc15",
    needs_attention: "#fb923c",
    critical: "#f87171",
  };

  return (
    <div className="relative inline-flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(30,41,59,0.12)" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={strokeColor[level]}
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("font-[family-name:var(--font-display)] text-3xl font-bold", ORG_TRUST_LEVEL_COLORS[level])}>
          {score}
        </span>
        <span className="text-[10px] text-[var(--color-ink-faint)] uppercase tracking-wider">Trust</span>
      </div>
    </div>
  );
}
