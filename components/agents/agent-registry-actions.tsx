"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { triggerAgentAction, pauseAgentAction, activateAgentAction } from "@/lib/agents/actions";
import { Play, Pause, RotateCcw, CheckCircle } from "lucide-react";

export function AgentRegistryActions({ agentId, status }: { agentId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function trigger() {
    startTransition(async () => {
      await triggerAgentAction(agentId);
      router.refresh();
    });
  }

  function togglePause() {
    startTransition(async () => {
      if (status === "paused" || status === "idle" || status === "draft") {
        await activateAgentAction(agentId);
      } else {
        await pauseAgentAction(agentId);
      }
      router.refresh();
    });
  }

  const isPaused = status === "paused" || status === "idle" || status === "draft";

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={trigger}
        disabled={pending}
        title="Run now"
        className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-blue)]/10 text-[var(--color-blue)] hover:bg-[var(--color-blue)]/20 transition-colors disabled:opacity-50"
      >
        <Play className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={togglePause}
        disabled={pending}
        title={isPaused ? "Activate" : "Pause"}
        className={`grid h-7 w-7 place-items-center rounded-lg transition-colors disabled:opacity-50 ${
          isPaused
            ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
            : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
        }`}
      >
        {isPaused ? <CheckCircle className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
