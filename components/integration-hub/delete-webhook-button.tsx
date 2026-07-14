"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteWebhookAction } from "@/backend/src/modules/integration-hub/actions";
import { useRouter } from "next/navigation";

export function DeleteWebhookButton({ webhookId, name }: { webhookId: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete webhook "${name}"?`)) return;
        startTransition(async () => { await deleteWebhookAction(webhookId); router.refresh(); });
      }}
      className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--color-ink-faint)] hover:text-red-400 transition-colors disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
