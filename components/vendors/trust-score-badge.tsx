import { getTrustLevel, TRUST_LEVEL_LABELS, TRUST_LEVEL_BG } from "@/backend/src/modules/trust-score/trust-score";

interface TrustScoreBadgeProps {
  score: number | null;
  showScore?: boolean;
  size?: "sm" | "md";
  previousScore?: number;
}

export function TrustScoreBadge({ score, showScore = true, size = "sm", previousScore }: TrustScoreBadgeProps) {
  if (score === null) {
    return (
      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-[var(--color-ink-faint)]">
        Not scored
      </span>
    );
  }
  const level = getTrustLevel(score);
  const cls = TRUST_LEVEL_BG[level];
  const sizeClass = size === "md" ? "px-3 py-1 text-sm font-semibold" : "px-2.5 py-0.5 text-xs font-semibold";

  const delta = previousScore !== undefined ? score - previousScore : null;
  const showTrend = delta !== null && Math.abs(delta) > 1;
  const trendUp = delta !== null && delta > 0;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${cls} ${sizeClass}`}>
      {showScore && <span>{score}</span>}
      {TRUST_LEVEL_LABELS[level]}
      {showTrend && (
        <span className={trendUp ? "text-emerald-400" : "text-red-400"} aria-hidden="true">
          {trendUp ? "↑" : "↓"}
        </span>
      )}
    </span>
  );
}
