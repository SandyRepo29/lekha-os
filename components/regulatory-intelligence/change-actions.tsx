"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateChangeStatusAction } from "@/lib/regulatory-intelligence/actions";

const NEXT_STATUS: Record<string, string> = {
  new: "under_review",
  under_review: "assessed",
  assessed: "actioned",
  actioned: "closed",
  closed: "closed",
};

const NEXT_LABEL: Record<string, string> = {
  new: "Mark Under Review",
  under_review: "Mark Assessed",
  assessed: "Mark Actioned",
  actioned: "Close",
  closed: "Closed",
};

export function UpdateChangeStatusButton({ changeId, currentStatus }: { changeId: string; currentStatus: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  if (currentStatus === "closed") return null;

  const nextStatus = NEXT_STATUS[currentStatus];
  const label = NEXT_LABEL[currentStatus];

  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          await updateChangeStatusAction(changeId, nextStatus);
          router.refresh();
        })
      }
      className="rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium hover:bg-white/[0.07] transition-colors disabled:opacity-50"
    >
      {pending ? "Updating…" : label}
    </button>
  );
}
