"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteWatchlistAction } from "@/backend/src/modules/regulatory-intelligence/actions";
import { Trash2 } from "lucide-react";

export function DeleteWatchlistButton({ watchlistId }: { watchlistId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this watchlist?")) return;
        start(async () => {
          await deleteWatchlistAction(watchlistId);
          router.refresh();
        });
      }}
      className="rounded-lg p-1.5 text-[var(--color-ink-faint)] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
      title="Delete watchlist"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
