"use client";

import { useState, useTransition } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { refreshAssessmentSummary } from "@/lib/assessments/ai-actions";
import { cn } from "@/lib/utils";

interface Props {
  assessmentId: string;
  vendorId: string;
  summary: string | null;
  summaryAt: Date | null;
  aiEnabled: boolean;
}

export function AiAssessmentSummary({ assessmentId, vendorId, summary, summaryAt, aiEnabled }: Props) {
  const [text, setText] = useState<string | null>(summary);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const since = summaryAt
    ? new Date(summaryAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  function generate() {
    setError(null);
    start(async () => {
      const res = await refreshAssessmentSummary(assessmentId, vendorId);
      if (!res) return;
      if (res.error) { setError(res.error); return; }
      if (res.data) setText(res.data);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-blue)]/10">
            <Sparkles className="h-4 w-4 text-[var(--color-blue)]" />
          </span>
          <div>
            <span className="text-sm font-semibold text-[var(--color-ink)]">AI Assessment Summary</span>
            {since && <span className="ml-2 text-xs text-[var(--color-ink-faint)]">Generated {since}</span>}
          </div>
        </div>
        {aiEnabled && (
          <button onClick={generate} disabled={pending}
            className="flex items-center gap-1.5 text-xs text-[var(--color-blue)] hover:underline disabled:opacity-50">
            <RefreshCw className={cn("h-3.5 w-3.5", pending && "animate-spin")} />
            {text ? "Regenerate" : "Generate summary"}
          </button>
        )}
      </div>

      {pending && (
        <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-4 py-5 text-center">
          <Sparkles className="h-5 w-5 text-[var(--color-blue)] animate-pulse mx-auto mb-2" />
          <p className="text-sm text-[var(--color-ink-faint)]">Analysing assessment responses…</p>
        </div>
      )}

      {!pending && text && (
        <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-4 py-4">
          <p className="text-sm leading-relaxed text-[var(--color-ink-dim)] whitespace-pre-line">{text}</p>
        </div>
      )}

      {!pending && !text && !error && (
        <div className="rounded-xl border border-[var(--color-line)] border-dashed bg-white/[0.01] px-4 py-6 text-center">
          <Sparkles className="h-5 w-5 text-[var(--color-ink-faint)] mx-auto mb-2" />
          <p className="text-sm text-[var(--color-ink-faint)]">
            {aiEnabled
              ? "Get an AI narrative summary of this assessment's findings, strengths, and recommendations."
              : "Add GEMINI_API_KEY to enable AI assessment summaries."}
          </p>
          {aiEnabled && (
            <button onClick={generate}
              className="mt-3 rounded-full bg-[var(--color-blue)]/10 px-4 py-1.5 text-xs font-semibold text-[var(--color-blue)] hover:bg-[var(--color-blue)]/20 transition-colors">
              Generate summary
            </button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
