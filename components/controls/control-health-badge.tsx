import { getHealthLevel, HEALTH_LEVEL_LABELS, HEALTH_LEVEL_COLORS, HEALTH_LEVEL_BG } from "@/lib/services/control-health";

interface Props {
  score: number | null;
  showScore?: boolean;
  size?: "sm" | "md";
}

export function ControlHealthBadge({ score, showScore = true, size = "sm" }: Props) {
  if (score === null) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-white/5 border-white/10 text-white/40">
        Not computed
      </span>
    );
  }

  const level = getHealthLevel(score);
  const label = HEALTH_LEVEL_LABELS[level];
  const color = HEALTH_LEVEL_COLORS[level];
  const bg = HEALTH_LEVEL_BG[level];
  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${padding} ${bg} ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {showScore && <span>{score}</span>}
      <span>{label}</span>
    </span>
  );
}
