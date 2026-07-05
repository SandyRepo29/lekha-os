"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateObligationStatusAction } from "@/lib/regulatory-intelligence/actions";

const NEXT_STATUS: Record<string, string> = {
  not_started: "in_progress",
  in_progress: "implemented",
  implemented: "validated",
  validated: "validated",
  planned: "in_progress",
  exception: "exception",
  retired: "retired",
};

const NEXT_LABEL: Record<string, string> = {
  not_started: "Start",
  planned: "Start",
  in_progress: "Mark Implemented",
  implemented: "Mark Validated",
  validated: "Validated",
  exception: "Exception",
  retired: "Retired",
};

export function UpdateObligationStatusButton({ obligationId, currentStatus }: { obligationId: string; currentStatus: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  if (currentStatus === "validated" || currentStatus === "retired" || currentStatus === "exception") return null;

  const nextStatus = NEXT_STATUS[currentStatus];
  const label = NEXT_LABEL[currentStatus];

  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          await updateObligationStatusAction(obligationId, nextStatus);
          router.refresh();
        })
      }
      className="rounded-lg border border-[var(--color-line)] bg-[#F8F9FB] px-2.5 py-1 text-[11px] font-medium hover:bg-[#F8F9FB] transition-colors disabled:opacity-50"
    >
      {pending ? "Updating…" : label}
    </button>
  );
}
