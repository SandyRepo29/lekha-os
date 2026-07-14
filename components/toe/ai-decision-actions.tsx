"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveAiDecisionAction, generateRecommendationsAction } from "@/backend/src/modules/toe/actions";
import { Check, X, Sparkles } from "lucide-react";

export function DecisionActions({ decisionId }: { decisionId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function resolve(status: "accepted" | "dismissed") {
    startTransition(async () => {
      await resolveAiDecisionAction(decisionId, status);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        onClick={() => resolve("accepted")}
        disabled={pending}
        title="Accept recommendation"
        className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-40 transition-colors"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => resolve("dismissed")}
        disabled={pending}
        title="Dismiss recommendation"
        className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 disabled:opacity-40 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function GenerateRecommendationsButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => {
        await generateRecommendationsAction();
        router.refresh();
      })}
      className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
    >
      {pending
        ? <><span className="h-4 w-4 animate-spin rounded-full border border-white border-t-transparent" /> Generating&#8230;</>
        : <><Sparkles className="h-4 w-4" /> Generate Recommendations</>
      }
    </button>
  );
}
