"use client";

import { useTransition } from "react";
import { Unplug } from "lucide-react";
import { disconnectAction } from "@/lib/integration-hub/actions";
import { useRouter } from "next/navigation";

export function DisconnectButton({ instanceId, connectorName }: { instanceId: string; connectorName: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      title={`Disconnect ${connectorName}`}
      onClick={() => {
        if (!confirm(`Disconnect ${connectorName}? Credentials will be deleted.`)) return;
        startTransition(async () => {
          await disconnectAction(instanceId);
          router.refresh();
        });
      }}
      className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--color-ink-faint)] hover:text-red-400 transition-colors disabled:opacity-50"
    >
      <Unplug className="h-4 w-4" />
    </button>
  );
}
