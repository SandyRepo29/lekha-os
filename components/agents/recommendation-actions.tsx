"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptRecommendationAction, rejectRecommendationAction } from "@/lib/agents/actions";
import { CheckCircle, XCircle } from "lucide-react";

export function RecommendationActions({ recId }: { recId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function accept() {
    startTransition(async () => {
      await acceptRecommendationAction(recId);
      router.refresh();
    });
  }

  function reject() {
    startTransition(async () => {
      await rejectRecommendationAction(recId);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={accept}
        disabled={pending}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
      >
        <CheckCircle className="h-3.5 w-3.5" /> Accept
      </button>
      <button
        onClick={reject}
        disabled={pending}
        className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-dim)] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors disabled:opacity-50"
      >
        <XCircle className="h-3.5 w-3.5" /> Dismiss
      </button>
    </div>
  );
}
