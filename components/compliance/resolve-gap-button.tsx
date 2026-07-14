"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { resolveGapAction } from "@/backend/src/modules/compliance/actions";

export function ResolveGapButton({ gapId }: { gapId: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (done) {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-700">
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
        className="rounded-lg border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
      >
        {pending ? "…" : "Resolve"}
      </button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
