import { getTrustLevel, TRUST_LEVEL_LABELS, TRUST_LEVEL_BG } from "@/lib/services/trust-score";

interface TrustScoreBadgeProps {
  score: number | null;
  showScore?: boolean;
  size?: "sm" | "md";
}

export function TrustScoreBadge({ score, showScore = true, size = "sm" }: TrustScoreBadgeProps) {
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

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${cls} ${sizeClass}`}>
      {showScore && <span>{score}</span>}
      {TRUST_LEVEL_LABELS[level]}
    </span>
  );
}
