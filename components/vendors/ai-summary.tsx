"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, RefreshCw } from "lucide-react";
import { refreshVendorSummary } from "@/lib/vendors/summary-actions";

export function AiSummary({
  vendorId,
  summary,
  summaryAt,
  aiEnabled,
}: {
  vendorId: string;
  summary: string | null;
  summaryAt: Date | null;
  aiEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function generate() {
    setError(null);
    start(async () => {
      const res = await refreshVendorSummary(vendorId);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  const formattedDate = summaryAt
    ? new Date(summaryAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-blue)]/10">
            <Sparkles className="h-4 w-4 text-[var(--color-blue)]" />
          </div>
          <span className="text-sm font-semibold text-[var(--color-ink)]">Lekha AI Summary</span>
          {formattedDate && (
            <span className="text-xs text-[var(--color-ink-faint)]">· Generated {formattedDate}</span>
          )}
        </div>
        {aiEnabled && (
          <button
            onClick={generate}
            disabled={pending}
            className="flex items-center gap-1.5 text-xs text-[var(--color-blue)] hover:underline disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} />
            {summary ? "Regenerate" : "Generate"}
          </button>
        )}
      </div>

      {pending && (
        <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-4 py-3 text-sm text-[var(--color-ink-faint)]">
          Analysing vendor data…
        </div>
      )}

      {!pending && summary && (
        <p className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-4 py-3 text-sm leading-relaxed text-[var(--color-ink-dim)]">
          {summary}
        </p>
      )}

      {!pending && !summary && (
        <p className="text-sm text-[var(--color-ink-faint)]">
          {aiEnabled
            ? "No summary yet. Click Generate to create one."
            : "AI is not configured. Add GEMINI_API_KEY to enable."}
        </p>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
