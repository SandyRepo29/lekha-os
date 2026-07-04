"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelSubscriptionAction } from "@/lib/platform-admin/actions";
import { XCircle } from "lucide-react";

export function CancelSubscriptionButton({ orgId, orgName }: { orgId: string; orgName: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCancel() {
    setError("");
    startTransition(async () => {
      const result = await cancelSubscriptionAction(orgId);
      if (result.error) { setError(result.error); return; }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 transition-colors"
      >
        <XCircle className="h-3.5 w-3.5" /> Cancel
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 space-y-2 min-w-[220px]">
      <p className="text-xs text-white/70">
        Cancel subscription for <span className="font-semibold text-white">{orgName}</span>?
      </p>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? "Cancelling…" : "Confirm Cancel"}
        </button>
        <button onClick={() => setOpen(false)} className="rounded border border-[#30363d] px-3 py-1 text-xs text-white/50 hover:bg-white/[0.04]">
          Keep
        </button>
      </div>
    </div>
  );
}
