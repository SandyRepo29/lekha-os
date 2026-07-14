"use client";

import { useState, useTransition } from "react";
import { Sparkles, RefreshCw, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { refreshRecommendedActions } from "@/backend/src/modules/vendor-hub/vendors-ai-insights-actions";
import type { RecommendedAction } from "@/backend/src/modules/vendor-hub/ai-insights-service";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<string, { badge: string; bar: string }> = {
  critical: { badge: "text-red-400 bg-red-500/10 border-red-500/25",   bar: "bg-red-500" },
  high:     { badge: "text-amber-400 bg-amber-500/10 border-amber-500/25", bar: "bg-amber-500" },
  medium:   { badge: "text-[var(--color-blue)] bg-[var(--color-blue)]/10 border-[var(--color-blue)]/25", bar: "bg-[var(--color-blue)]" },
  low:      { badge: "text-[var(--color-ink-faint)] bg-[#F8F9FB] border-[var(--color-line)]", bar: "bg-[var(--color-ink-faint)]" },
};

interface Props {
  vendorId: string;
  actions: RecommendedAction[] | null;
  generatedAt: Date | null;
  isStale: boolean;
  aiEnabled: boolean;
}

export function AiRecommendedActions({ vendorId, actions, generatedAt, isStale, aiEnabled }: Props) {
  const [open, setOpen] = useState(!actions || actions.length === 0);
  const [localActions, setLocalActions] = useState<RecommendedAction[] | null>(actions);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const since = generatedAt
    ? new Date(generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : null;

  function generate() {
    setError(null);
    start(async () => {
      const res = await refreshRecommendedActions(vendorId);
      if (!res) return;
      if (res.error) { setError(res.error); return; }
      if (res.data && Array.isArray(res.data)) {
        setLocalActions(res.data as RecommendedAction[]);
        setOpen(true);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => setOpen(!open)} className="flex flex-1 items-center gap-2 text-left">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-blue)]/10">
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-blue)]" />
          </span>
          <span className="text-sm font-semibold text-[var(--color-ink)]">Recommended actions</span>
          {since && !isStale && <span className="text-xs text-[var(--color-ink-faint)]">· {since}</span>}
          {isStale && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
              Data changed
            </span>
          )}
          {open ? <ChevronUp className="ml-auto h-3.5 w-3.5 text-[var(--color-ink-faint)]" />
                : <ChevronDown className="ml-auto h-3.5 w-3.5 text-[var(--color-ink-faint)]" />}
        </button>
        {aiEnabled && (
          <button onClick={generate} disabled={pending}
            className="shrink-0 text-xs text-[var(--color-blue)] hover:underline disabled:opacity-50 flex items-center gap-1">
            <RefreshCw className={cn("h-3.5 w-3.5", pending && "animate-spin")} />
            {localActions?.length ? "Refresh" : "Generate"}
          </button>
        )}
      </div>

      {open && (
        <div className="space-y-2">
          {pending && (
            <div className="rounded-xl border border-[var(--color-line)] bg-white px-4 py-3 flex items-center gap-2 text-sm text-[var(--color-ink-faint)]">
              <Sparkles className="h-4 w-4 animate-pulse text-[var(--color-blue)]" />
              Building action plan with Gemini…
            </div>
          )}

          {!pending && localActions && localActions.length > 0 && (
            <div className="space-y-2">
              {localActions.map((a, i) => {
                const styles = PRIORITY_STYLES[a.priority] ?? PRIORITY_STYLES.medium;
                return (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-[var(--color-line)] bg-white p-3.5">
                    <div className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${styles.bar}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-[var(--color-ink)]">{a.action}</span>
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", styles.badge)}>
                          {a.priority}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-ink-dim)]">{a.reason}</p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-[#F8F9FB] px-2 py-1 text-xs font-semibold text-emerald-400">
                      {a.impact}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {!pending && (!localActions || localActions.length === 0) && !error && (
            <div className="rounded-xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-ink-faint)]">
              {aiEnabled ? "Click Generate to get a prioritised action plan." : "Add GEMINI_API_KEY to enable AI recommendations."}
            </div>
          )}

          {error && <p className="text-xs text-red-400 px-1">{error}</p>}
        </div>
      )}
    </div>
  );
}
