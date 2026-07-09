"use client";

import { useState, useTransition, useEffect } from "react";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  content: string | null;
  generatedAt: Date | null;
  isStale?: boolean;
  aiEnabled: boolean;
  onGenerate: () => Promise<{ error?: string; ok?: boolean } | undefined>;
  className?: string;
  /** Start expanded? Default: collapsed if content exists */
  defaultOpen?: boolean;
}

export function AiInsightPanel({
  title, content, generatedAt, isStale = false,
  aiEnabled, onGenerate, className, defaultOpen,
}: Props) {
  const [open, setOpen] = useState(defaultOpen ?? !content);
  const [text, setText] = useState<string | null>(content);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // The parent Server Component re-fetches `content` after onGenerate()
  // revalidates the route — sync it in, since useState(content) only
  // seeds the initial render.
  useEffect(() => {
    setText(content);
  }, [content]);

  const since = generatedAt
    ? new Date(generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : null;

  function generate() {
    setError(null);
    start(async () => {
      const res = await onGenerate();
      if (!res) return;
      if (res.error) { setError(res.error); return; }
      // Page will revalidate and re-render with fresh data
    });
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setOpen(!open)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-blue)]/10">
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-blue)]" />
          </span>
          <span className="text-sm font-semibold text-[var(--color-ink)]">{title}</span>
          {since && !isStale && (
            <span className="text-xs text-[var(--color-ink-faint)]">· {since}</span>
          )}
          {isStale && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
              Data changed
            </span>
          )}
          {open ? <ChevronUp className="ml-auto h-3.5 w-3.5 text-[var(--color-ink-faint)]" />
                : <ChevronDown className="ml-auto h-3.5 w-3.5 text-[var(--color-ink-faint)]" />}
        </button>
        {aiEnabled && (
          <button
            onClick={generate}
            disabled={pending}
            className="shrink-0 text-xs text-[var(--color-blue)] hover:underline disabled:opacity-50 flex items-center gap-1"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", pending && "animate-spin")} />
            {text ? "Refresh" : "Generate"}
          </button>
        )}
      </div>

      {/* Content area */}
      {open && (
        <div className="rounded-xl border border-[var(--color-line)] bg-white px-4 py-3">
          {pending && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-ink-faint)]">
              <Sparkles className="h-4 w-4 animate-pulse text-[var(--color-blue)]" />
              Analysing with Gemini…
            </div>
          )}
          {!pending && text && (
            <p className="text-sm leading-relaxed text-[var(--color-ink-dim)]">{text}</p>
          )}
          {!pending && !text && !error && (
            <p className="text-sm text-[var(--color-ink-faint)]">
              {aiEnabled
                ? "Click Generate to get an AI explanation."
                : "AI is not configured — add GEMINI_API_KEY to enable."}
            </p>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
