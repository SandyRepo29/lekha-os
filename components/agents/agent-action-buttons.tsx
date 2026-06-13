"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveActionAction, rejectActionAction } from "@/lib/agents/actions";
import { CheckCircle, XCircle } from "lucide-react";

export function AgentActionButtons({ actionId }: { actionId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function approve() {
    startTransition(async () => {
      await approveActionAction(actionId);
      router.refresh();
    });
  }

  function reject() {
    startTransition(async () => {
      await rejectActionAction(actionId);
      router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        onClick={approve}
        disabled={pending}
        className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
      >
        <CheckCircle className="h-3.5 w-3.5" /> Approve
      </button>
      <button
        onClick={reject}
        disabled={pending}
        className="flex items-center gap-1.5 rounded-xl bg-white/[0.04] border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-dim)] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors disabled:opacity-50"
      >
        <XCircle className="h-3.5 w-3.5" /> Reject
      </button>
    </div>
  );
}
