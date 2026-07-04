"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { deactivateMemberAction, activateMemberAction } from "@/lib/platform-admin/actions";

export function MemberStatusButton({ userId, orgId, isActive }: { userId: string; orgId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const router = useRouter();

  function handle() {
    setErr("");
    startTransition(async () => {
      const res = isActive
        ? await deactivateMemberAction(userId, orgId)
        : await activateMemberAction(userId, orgId);
      if (res.error) setErr(res.error);
      else router.refresh();
    });
  }

  return (
    <div>
      <button
        onClick={handle}
        disabled={pending}
        className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
          isActive
            ? "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
        }`}
      >
        {pending ? "…" : isActive ? "Deactivate" : "Activate"}
      </button>
      {err && <div className="mt-0.5 text-[10px] text-red-400">{err}</div>}
    </div>
  );
}
