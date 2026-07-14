"use client";

import { useTransition } from "react";
import { toggleWebhookAction } from "@/backend/src/modules/integration-hub/actions";
import { useRouter } from "next/navigation";

export function ToggleWebhookButton({ webhookId, isActive }: { webhookId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await toggleWebhookAction(webhookId, !isActive); router.refresh(); })}
      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${isActive ? "bg-white/5 text-[var(--color-ink-dim)] hover:bg-white/10" : "bg-green-500/10 text-green-400 hover:bg-green-500/20"}`}
    >
      {isActive ? "Pause" : "Enable"}
    </button>
  );
}
