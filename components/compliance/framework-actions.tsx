"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteFrameworkAction, runGapAnalysisAction } from "@/lib/compliance/actions";

// ---- Delete Framework ---------------------------------------

export function DeleteFramework({ frameworkId, frameworkName }: { frameworkId: string; frameworkName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-ink-dim)]">Delete &ldquo;{frameworkName}&rdquo;?</span>
        <Button
          variant="danger"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await deleteFrameworkAction(frameworkId);
              if (res?.error) setError(res.error);
            })
          }
        >
          {pending ? "Deleting…" : "Yes, delete"}
        </Button>
        <Button variant="subtle" size="sm" onClick={() => setConfirming(false)}>Cancel</Button>
        {error && <span className="text-xs text-red-700">{error}</span>}
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
      <Trash2 className="h-4 w-4" />
      Delete
    </Button>
  );
}

// ---- Run Gap Analysis ---------------------------------------

export function RunGapAnalysisButton({
  frameworkId,
  frameworkName,
}: {
  frameworkId: string;
  frameworkName?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ detected?: number; error?: string } | null>(null);
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        title={frameworkName ? `Run gap analysis — ${frameworkName}` : undefined}
        onClick={() =>
          startTransition(async () => {
            const res = await runGapAnalysisAction(frameworkId);
            setResult(res);
            if (!res.error) router.refresh();
          })
        }
      >
        <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Analysing…" : frameworkName ? `Run: ${frameworkName}` : "Run gap analysis"}
      </Button>
      {result?.detected !== undefined && (
        <span className="text-xs text-[var(--color-ink-dim)]">
          {result.detected} gap{result.detected !== 1 ? "s" : ""} detected
        </span>
      )}
      {result?.error && <span className="text-xs text-red-700">{result.error}</span>}
    </div>
  );
}

// ---- Update Control Status (inline select) ------------------

export function ControlStatusSelect({
  controlId,
  frameworkId,
  currentStatus,
}: {
  controlId: string;
  frameworkId: string;
  currentStatus: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      defaultValue={currentStatus}
      disabled={pending}
      className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-2 py-1 text-xs text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)] disabled:opacity-50"
      onChange={(e) => {
        const status = e.target.value as "implemented" | "partial" | "not_implemented" | "not_applicable";
        startTransition(async () => {
          const { updateControlStatusAction } = await import("@/lib/compliance/actions");
          await updateControlStatusAction(controlId, frameworkId, status);
          router.refresh();
        });
      }}
    >
      <option value="not_implemented">Not Implemented</option>
      <option value="partial">Partial</option>
      <option value="implemented">Implemented</option>
      <option value="not_applicable">N/A</option>
    </select>
  );
}

// ---- Delete Control -----------------------------------------

export function DeleteControl({ controlId, frameworkId }: { controlId: string; frameworkId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <Button
          variant="danger"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const { deleteControlAction } = await import("@/lib/compliance/actions");
              await deleteControlAction(controlId, frameworkId);
              router.refresh();
            })
          }
        >
          {pending ? "…" : "Delete"}
        </Button>
        <Button variant="subtle" size="sm" onClick={() => setConfirming(false)}>✕</Button>
      </span>
    );
  }
  return (
    <button
      className="text-xs text-[var(--color-ink-faint)] hover:text-red-700 transition-colors"
      onClick={() => setConfirming(true)}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
