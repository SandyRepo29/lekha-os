"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveApprovalAction } from "@/backend/src/modules/toe/actions";
import { Check, X } from "lucide-react";

export function ResolveApprovalButtons({ approvalId }: { approvalId: string }) {
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const router = useRouter();

  function resolve(status: "approved" | "rejected") {
    startTransition(async () => {
      await resolveApprovalAction(approvalId, status, notes || undefined);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={() => resolve("approved")}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-40 transition-colors"
        >
          <Check className="h-3.5 w-3.5" /> Approve
        </button>
        <button
          onClick={() => setShowNotes(!showNotes)}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-40 transition-colors"
        >
          <X className="h-3.5 w-3.5" /> Reject
        </button>
      </div>
      {showNotes && (
        <div className="flex items-center gap-2 w-full">
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Rejection reason (optional)"
            className="flex-1 rounded-lg border border-[var(--color-line)] bg-[#F8F9FB] px-2.5 py-1.5 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:border-red-500/50"
          />
          <button
            onClick={() => resolve("rejected")}
            disabled={pending}
            className="rounded-lg bg-red-500/20 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-40"
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}
