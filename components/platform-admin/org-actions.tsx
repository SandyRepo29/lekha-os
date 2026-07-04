"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { suspendOrgAction, activateOrgAction } from "@/lib/platform-admin/actions";

export function SuspendOrgButton({ orgId, suspended }: { orgId: string; suspended: boolean }) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const router = useRouter();

  function handle() {
    setErr("");
    startTransition(async () => {
      const res = suspended ? await activateOrgAction(orgId) : await suspendOrgAction(orgId);
      if (res.error) setErr(res.error);
      else router.refresh();
    });
  }

  return (
    <div>
      <button
        onClick={handle}
        disabled={pending}
        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
          suspended
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
            : "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
        }`}
      >
        {pending ? "…" : suspended ? "Activate" : "Suspend"}
      </button>
      {err && <div className="mt-1 text-[10px] text-red-400">{err}</div>}
    </div>
  );
}

export function AddOrgNoteForm({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const router = useRouter();

  function handle(fd: FormData) {
    setErr("");
    startTransition(async () => {
      const { addOrgNoteAction } = await import("@/lib/platform-admin/actions");
      const res = await addOrgNoteAction(fd);
      if (res.error) setErr(res.error);
      else { setOpen(false); router.refresh(); }
    });
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-xs text-[#00B8D9] hover:underline">
      + Add note
    </button>
  );

  return (
    <form action={handle as unknown as (fd: FormData) => void} className="mt-2 space-y-2">
      <input type="hidden" name="orgId" value={orgId} />
      <textarea
        name="note"
        rows={2}
        placeholder="Note..."
        className="w-full rounded-lg border border-[#30363d] bg-white/[0.03] px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#00B8D9]/50 resize-none"
      />
      {err && <div className="text-[10px] text-red-400">{err}</div>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded-lg bg-[#00B8D9]/10 border border-[#00B8D9]/30 px-3 py-1 text-xs text-[#00B8D9] hover:bg-[#00B8D9]/20 disabled:opacity-50">
          {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-white/30 hover:text-white/60">Cancel</button>
      </div>
    </form>
  );
}
