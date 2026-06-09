"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, ShieldCheck, AlertTriangle } from "lucide-react";
import {
  type PrivacyScoreBreakdown,
  PRIVACY_SCORE_LABELS,
  PRIVACY_LEVEL_LABELS,
  PRIVACY_LEVEL_COLORS,
  PRIVACY_LEVEL_BG,
} from "@/lib/services/privacy-score";
import { computePrivacyScoreAction } from "@/lib/privacy/actions";
import { cn } from "@/lib/utils";

type Props = {
  initialScore?: number | null;
  initialBreakdown?: PrivacyScoreBreakdown | null;
};

export function PrivacyScoreWidget({ initialScore, initialBreakdown }: Props) {
  const [breakdown, setBreakdown] = useState<PrivacyScoreBreakdown | null>(
    initialBreakdown ?? null
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const score = breakdown?.score ?? initialScore ?? null;
  const level = breakdown?.level ?? null;

  function handleCompute() {
    setError(null);
    startTransition(async () => {
      const result = await computePrivacyScoreAction();
      if (result?.error) {
        setError(result.error);
      } else if (result?.data) {
        setBreakdown(result.data as PrivacyScoreBreakdown);
      }
    });
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Privacy Trust Score™</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCompute}
          disabled={isPending}
        >
          <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
          {isPending ? "Computing..." : "Compute"}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {score !== null ? (
        <div className="flex items-center gap-6">
          {/* Score ring */}
          <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-white/[0.06]"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 251.2} 251.2`}
                className={level ? PRIVACY_LEVEL_COLORS[level].replace("text-", "stroke-") : "stroke-indigo-500"}
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-bold">{score}</span>
              <span className="block text-[10px] text-[var(--color-ink-dim)]">/100</span>
            </div>
          </div>

          <div className="flex-1">
            {level && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                  PRIVACY_LEVEL_BG[level]
                )}
              >
                {PRIVACY_LEVEL_LABELS[level]}
              </span>
            )}
            {breakdown && (
              <p className="mt-2 text-xs text-[var(--color-ink-dim)]">
                Based on 6 privacy governance signals
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-sm text-[var(--color-ink-dim)]">
          <ShieldCheck className="h-5 w-5" />
          Click Compute to calculate your Privacy Trust Score™
        </div>
      )}

      {breakdown && (
        <>
          {/* Component bars */}
          <div className="space-y-2.5">
            {(Object.keys(PRIVACY_SCORE_LABELS) as Array<keyof typeof PRIVACY_SCORE_LABELS>).map(
              (key) => {
                const value = breakdown.components[key];
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--color-ink-dim)]">
                        {PRIVACY_SCORE_LABELS[key]}
                      </span>
                      <span className="text-xs font-semibold">{value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06]">
                      <div
                        className="h-1.5 rounded-full bg-indigo-500"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {/* Strengths & Concerns */}
          {breakdown.strengths.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-green-400">Strengths</p>
              {breakdown.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[var(--color-ink-dim)]">
                  <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-green-400 mt-0.5" />
                  {s}
                </div>
              ))}
            </div>
          )}

          {breakdown.concerns.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-orange-400">Concerns</p>
              {breakdown.concerns.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[var(--color-ink-dim)]">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-orange-400 mt-0.5" />
                  {c}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
