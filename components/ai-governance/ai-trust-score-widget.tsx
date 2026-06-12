"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, CheckCircle, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { computeAiTrustScoreAction } from "@/lib/ai-governance/actions";
import { AiTrustLevelBadge } from "@/components/ai-governance/ai-status-badges";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AiTrustBreakdown {
  risk: number;         // 25 %
  controls: number;     // 25 %
  compliance: number;   // 20 %
  monitoring: number;   // 15 %
  vendor: number;       // 10 %
  incidents: number;    //  5 %
  overall: number;
  level: string;
  strengths: string[];
  concerns: string[];
}

const COMPONENTS: {
  key: keyof Omit<AiTrustBreakdown, "overall" | "level" | "strengths" | "concerns">;
  label: string;
  weight: number;
}[] = [
  { key: "risk",       label: "Risk Assessment",   weight: 25 },
  { key: "controls",   label: "AI Controls",       weight: 25 },
  { key: "compliance", label: "Regulatory Compliance", weight: 20 },
  { key: "monitoring", label: "Runtime Monitoring", weight: 15 },
  { key: "vendor",     label: "Vendor Governance",  weight: 10 },
  { key: "incidents",  label: "Incident History",   weight: 5  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(value: number) {
  if (value >= 80) return "bg-emerald-500";
  if (value >= 60) return "bg-yellow-500";
  if (value >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-white/10">
      <div
        className={`h-1.5 rounded-full transition-all ${scoreColor(value)}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function SkeletonBar() {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
        <div className="h-3 w-6 animate-pulse rounded bg-white/10" />
      </div>
      <div className="h-1.5 w-full animate-pulse rounded-full bg-white/10" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AiTrustScoreWidgetProps {
  systemId: string;
  systemName: string;
}

export function AiTrustScoreWidget({ systemId, systemName }: AiTrustScoreWidgetProps) {
  const [breakdown, setBreakdown] = useState<AiTrustBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const compute = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await computeAiTrustScoreAction(systemId);
      if ("error" in res) {
        setError(res.error ?? "Failed");
      } else {
        const d = res.data as any;
        setBreakdown({
          ...d.components,
          overall: d.overall,
          level: d.level,
          strengths: d.strengths ?? [],
          concerns: d.concerns ?? [],
        });
      }
    } catch {
      setError("Failed to compute AI Trust Score.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    compute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemId]);

  return (
    <Card className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">AI Trust Score™</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={compute}
          disabled={loading}
          className="h-7 gap-1.5 text-xs"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Recalculate
        </Button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 animate-pulse rounded-2xl bg-white/10" />
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
            </div>
          </div>
          <div className="space-y-3">
            {COMPONENTS.map(({ key }) => <SkeletonBar key={key} />)}
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Score display */}
      {!loading && !error && breakdown && (
        <>
          {/* Overall score ring + level */}
          <div className="flex items-center gap-4">
            <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-[var(--color-line)] bg-white/[0.03]">
              <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--color-ink)]">
                {breakdown.overall}
              </span>
            </div>
            <div className="space-y-1">
              <AiTrustLevelBadge level={breakdown.level} />
              <p className="text-xs text-[var(--color-ink-faint)]">
                {systemName} · out of 100
              </p>
            </div>
          </div>

          {/* Component breakdown bars */}
          <div className="space-y-2.5">
            {COMPONENTS.map(({ key, label, weight }) => {
              const val = breakdown[key];
              return (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-[var(--color-ink-dim)]">
                      {label}
                      <span className="ml-1 text-[var(--color-ink-faint)]">({weight}%)</span>
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-[var(--color-ink)]">
                      {val}
                    </span>
                  </div>
                  <ScoreBar value={val} />
                </div>
              );
            })}
          </div>

          {/* Strengths & Concerns */}
          {(breakdown.strengths.length > 0 || breakdown.concerns.length > 0) && (
            <div className="grid grid-cols-2 gap-3 border-t border-[var(--color-line)] pt-3">
              {breakdown.strengths.length > 0 && (
                <div className="space-y-1.5">
                  <p className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                    <CheckCircle className="h-3 w-3" /> Strengths
                  </p>
                  {breakdown.strengths.slice(0, 3).map((s, i) => (
                    <p key={i} className="text-xs leading-snug text-[var(--color-ink-dim)]">
                      ✓ {s}
                    </p>
                  ))}
                </div>
              )}
              {breakdown.concerns.length > 0 && (
                <div className="space-y-1.5">
                  <p className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                    <AlertTriangle className="h-3 w-3" /> Concerns
                  </p>
                  {breakdown.concerns.slice(0, 3).map((c, i) => (
                    <p key={i} className="text-xs leading-snug text-[var(--color-ink-dim)]">
                      ⚠ {c}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
