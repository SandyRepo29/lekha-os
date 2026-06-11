"use client";

import { useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { resolveEventAction } from "@/lib/integration-hub/actions";
import { useRouter } from "next/navigation";

export function ResolveEventButton({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      title="Mark resolved"
      onClick={() => startTransition(async () => {
        await resolveEventAction(eventId);
        router.refresh();
      })}
      className="shrink-0 p-1.5 rounded-lg hover:bg-green-500/10 text-[var(--color-ink-faint)] hover:text-green-400 transition-colors disabled:opacity-50"
    >
      <CheckCircle2 className="h-4 w-4" />
    </button>
  );
}
