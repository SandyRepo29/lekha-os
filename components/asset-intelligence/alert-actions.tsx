"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveAlertAction } from "@/backend/src/modules/asset-intelligence/actions";

export function ResolveAlertButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => {
        await resolveAlertAction(id);
        router.refresh();
      })}
      className="rounded-lg border border-emerald-400/30 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-400/10 disabled:opacity-50 transition-colors">
      {pending ? "…" : "Resolve"}
    </button>
  );
}
