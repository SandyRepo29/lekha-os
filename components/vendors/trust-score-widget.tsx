"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Shield, RefreshCw, Sparkles, CheckCircle, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getTrustLevel,
  TRUST_LEVEL_LABELS,
  TRUST_LEVEL_COLORS,
  TRUST_COMPONENT_WEIGHTS,
  TRUST_COMPONENT_LABELS,
} from "@/backend/src/modules/trust-score/trust-score";
import type { TrustScoreBreakdown } from "@/backend/src/modules/trust-score/trust-score";
import { recalculateTrustScore, generateTrustNarrativeAction } from "@/app/(app)/vendors/trust-score-actions";

interface TrustScoreWidgetProps {
  vendorId: string;
  trustScore: number | null;
  breakdown?: TrustScoreBreakdown | null;
  narrative?: string | null;
  aiEnabled: boolean;
}

const COMPONENT_KEYS = ["evidence", "compliance", "risk", "assessment", "operational", "freshness", "contract", "assetResilience"] as const;

function scoreBar(value: number) {
  const color =
    value >= 80 ? "bg-emerald-500" :
    value >= 60 ? "bg-yellow-500" :
    value >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="h-1.5 w-full rounded-full bg-white/10">
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export function TrustScoreWidget({ vendorId, trustScore, breakdown, narrative, aiEnabled }: TrustScoreWidgetProps) {
  const router = useRouter();
  const [isCalc, startCalc] = useTransition();
  const [isNarr, startNarr] = useTransition();

  const level = trustScore !== null ? getTrustLevel(trustScore) : null;

  function handleRecalculate() {
    startCalc(async () => {
      await recalculateTrustScore(vendorId);
      router.refresh();
    });
  }

  function handleNarrative() {
    startNarr(async () => {
      await generateTrustNarrativeAction(vendorId);
      router.refresh();
    });
  }

  return (
    <Card className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[var(--color-blue)]" />
          <h3 className="font-semibold text-sm">Trust Score™</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRecalculate} disabled={isCalc} className="h-7 gap-1.5 text-xs">
          <RefreshCw className={`h-3 w-3 ${isCalc ? "animate-spin" : ""}`} />
          Recalculate
        </Button>
      </div>

      {/* Score display */}
      {trustScore === null ? (
        <div className="rounded-xl border border-dashed border-[var(--color-line)] p-6 text-center">
          <p className="text-sm text-[var(--color-ink-faint)]">Trust Score not yet computed.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={handleRecalculate} disabled={isCalc}>
            {isCalc ? "Calculating…" : "Calculate Now"}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-[var(--color-line)] bg-white">
              <span className="font-[family-name:var(--font-display)] text-3xl font-bold">{trustScore}</span>
            </div>
            <div>
              {level && (
                <p className={`font-[family-name:var(--font-display)] text-lg font-bold ${TRUST_LEVEL_COLORS[level]}`}>
                  {TRUST_LEVEL_LABELS[level]}
                </p>
              )}
              <p className="text-xs text-[var(--color-ink-faint)]">out of 100</p>
            </div>
          </div>

          {/* Component breakdown */}
          {breakdown && (
            <div className="space-y-2.5">
              {COMPONENT_KEYS.map((key) => {
                const val = breakdown[key];
                const weight = TRUST_COMPONENT_WEIGHTS[key];
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--color-ink-dim)]">
                        {TRUST_COMPONENT_LABELS[key]}
                        <span className="ml-1 text-[var(--color-ink-faint)]">({weight}%)</span>
                      </span>
                      <span className="text-xs font-semibold tabular-nums">{val}</span>
                    </div>
                    {scoreBar(val)}
                  </div>
                );
              })}
            </div>
          )}

          {/* Strengths & Concerns */}
          {breakdown && (breakdown.strengths.length > 0 || breakdown.concerns.length > 0) && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              {breakdown.strengths.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Strengths
                  </p>
                  {breakdown.strengths.slice(0, 3).map((s, i) => (
                    <p key={i} className="text-xs text-[var(--color-ink-dim)] leading-snug">✓ {s}</p>
                  ))}
                </div>
              )}
              {breakdown.concerns.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Concerns
                  </p>
                  {breakdown.concerns.slice(0, 3).map((c, i) => (
                    <p key={i} className="text-xs text-[var(--color-ink-dim)] leading-snug">⚠ {c}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Trust Narrative */}
          {aiEnabled && (
            <div className="border-t border-[var(--color-line)] pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[var(--color-ink-dim)] flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[var(--color-blue)]" /> AI Trust Narrative
                </p>
                <Button variant="ghost" size="sm" onClick={handleNarrative} disabled={isNarr} className="h-6 text-xs px-2">
                  {isNarr ? "Generating…" : narrative ? "Refresh" : "Generate"}
                </Button>
              </div>
              {narrative ? (
                <p className="text-xs text-[var(--color-ink-dim)] leading-relaxed">{narrative}</p>
              ) : (
                <p className="text-xs text-[var(--color-ink-faint)] italic">
                  Generate an executive-ready trust summary for this vendor.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
