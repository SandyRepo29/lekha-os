"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { updateTicketStatusAction, assignTicketAction } from "@/lib/platform-admin/actions";

export function TicketStatusSelect({ ticketId, status }: { ticketId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const router = useRouter();

  function handle(newStatus: string) {
    if (newStatus === status) return;
    setErr("");
    startTransition(async () => {
      const res = await updateTicketStatusAction(ticketId, newStatus);
      if (res.error) setErr(res.error);
      else router.refresh();
    });
  }

  return (
    <div>
      <select
        defaultValue={status}
        onChange={(e) => handle(e.target.value)}
        disabled={pending}
        className="rounded-lg border border-[#30363d] bg-[#161b22] px-2 py-1 text-xs text-white disabled:opacity-50"
      >
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>
      {err && <div className="mt-0.5 text-[10px] text-red-400">{err}</div>}
    </div>
  );
}

export function AssignSelect({
  ticketId,
  currentAssigneeId,
  staff,
}: {
  ticketId: string;
  currentAssigneeId: string | null;
  staff: Array<{ id: string; name: string }>;
}) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const router = useRouter();

  function handle(assigneeId: string) {
    setErr("");
    startTransition(async () => {
      const res = await assignTicketAction(ticketId, assigneeId);
      if (res.error) setErr(res.error);
      else router.refresh();
    });
  }

  return (
    <div>
      <select
        defaultValue={currentAssigneeId ?? ""}
        onChange={(e) => handle(e.target.value)}
        disabled={pending}
        className="rounded-lg border border-[#30363d] bg-[#161b22] px-2 py-1 text-xs text-white disabled:opacity-50"
      >
        <option value="" disabled>Assign to…</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      {err && <div className="mt-0.5 text-[10px] text-red-400">{err}</div>}
    </div>
  );
}
