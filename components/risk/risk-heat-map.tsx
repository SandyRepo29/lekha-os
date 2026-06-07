"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { heatMapCellColor } from "@/components/risk/risk-ui";

type HeatMapRisk = { id: string; title: string; impact: number; likelihood: number; score: number };

export function RiskHeatMap({ risks }: { risks: HeatMapRisk[] }) {
  const router = useRouter();

  // Build grid: rows = impact 5→1 (high to low), cols = likelihood 1→5
  const getCell = (impact: number, likelihood: number) =>
    risks.filter((r) => r.impact === impact && r.likelihood === likelihood);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[400px]">
        {/* Y-axis label */}
        <div className="flex items-start gap-2">
          <div className="flex flex-col items-center justify-center" style={{ width: 80, minHeight: 320 }}>
            <span
              className="text-xs text-[var(--color-ink-faint)] font-medium tracking-wider"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              IMPACT ↑
            </span>
          </div>

          <div className="flex-1">
            {/* Grid */}
            <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
              {[5, 4, 3, 2, 1].map((impact) =>
                [1, 2, 3, 4, 5].map((likelihood) => {
                  const cellRisks = getCell(impact, likelihood);
                  const colorClass = heatMapCellColor(impact, likelihood);
                  return (
                    <div
                      key={`${impact}-${likelihood}`}
                      className={cn(
                        "relative flex min-h-[56px] cursor-default flex-col items-center justify-center rounded-lg border border-white/5 p-1 transition-all",
                        colorClass,
                        cellRisks.length > 0 && "cursor-pointer hover:ring-1 hover:ring-white/20"
                      )}
                      onClick={() => {
                        if (cellRisks.length === 1) router.push(`/risks/${cellRisks[0].id}`);
                        else if (cellRisks.length > 1)
                          router.push(`/risks/list?impact=${impact}&likelihood=${likelihood}`);
                      }}
                    >
                      <span className="text-xs font-bold opacity-40">{impact * likelihood}</span>
                      {cellRisks.length > 0 && (
                        <span className="mt-0.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                          {cellRisks.length}
                        </span>
                      )}
                      {/* Tooltip-style title for single risk */}
                      {cellRisks.length === 1 && (
                        <span className="absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[var(--color-bg-2)] px-2 py-1 text-[10px] text-[var(--color-ink)] shadow group-hover:block">
                          {cellRisks[0].title}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* X-axis labels */}
            <div
              className="mt-1 grid gap-1 text-center text-xs text-[var(--color-ink-faint)]"
              style={{ gridTemplateColumns: "repeat(5, 1fr)" }}
            >
              {[1, 2, 3, 4, 5].map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
            <p className="mt-1 text-center text-xs text-[var(--color-ink-faint)] font-medium tracking-wider">
              LIKELIHOOD →
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--color-ink-dim)]">
          {[
            { label: "Low (1–5)", cls: "bg-emerald-500/20" },
            { label: "Moderate (6–10)", cls: "bg-lime-500/20" },
            { label: "High (11–15)", cls: "bg-amber-500/20" },
            { label: "Critical (16–20)", cls: "bg-red-500/20" },
            { label: "Severe (21–25)", cls: "bg-purple-600/25" },
          ].map(({ label, cls }) => (
            <span key={label} className="flex items-center gap-1">
              <span className={cn("inline-block h-2.5 w-2.5 rounded", cls)} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
