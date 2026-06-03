"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { resolveGapAction } from "@/lib/compliance/actions";

export function ResolveGapButton({ gapId }: { gapId: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (done) {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" /> Resolved
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await resolveGapAction(gapId);
            if (res?.error) setError(res.error);
            else {
              setDone(true);
              router.refresh();
            }
          })
        }
        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
      >
        {pending ? "…" : "Resolve"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
