import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "stable";

type TrendStatCardProps = {
  label: string;
  current: number;
  change: number;
  changePct: number;
  direction: Direction;
  suffix?: string;
  higherIsBetter?: boolean;
};

export function TrendStatCard({
  label,
  current,
  change,
  changePct,
  direction,
  suffix = "",
  higherIsBetter = true,
}: TrendStatCardProps) {
  const isPositive = higherIsBetter ? direction === "up" : direction === "down";
  const isNegative = higherIsBetter ? direction === "down" : direction === "up";

  const Icon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
  const trendColor = direction === "stable"
    ? "text-[var(--color-ink-faint)]"
    : isPositive ? "text-emerald-700" : "text-red-700";

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-[var(--color-ink-faint)]">{label}</span>
      <span className="text-2xl font-bold text-[var(--color-ink)]">{current}{suffix}</span>
      <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
        <Icon className="h-3 w-3" />
        <span>
          {direction === "stable"
            ? "Stable"
            : `${change > 0 ? "+" : ""}${change}pts (${changePct > 0 ? "+" : ""}${changePct}%)`}
        </span>
      </div>
    </div>
  );
}
