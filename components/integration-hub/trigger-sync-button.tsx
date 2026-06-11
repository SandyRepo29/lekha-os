"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { triggerSyncAction } from "@/lib/integration-hub/actions";
import { useRouter } from "next/navigation";

export function TriggerSyncButton({ instanceId }: { instanceId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      title="Trigger sync"
      onClick={() => startTransition(async () => {
        await triggerSyncAction(instanceId);
        router.refresh();
      })}
      className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
    </button>
  );
}
