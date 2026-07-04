"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { markInvoicePaidAction } from "@/lib/platform-admin/actions";

export function MarkPaidButton({ invoiceId }: { invoiceId: string }) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const router = useRouter();

  function handle() {
    setErr("");
    startTransition(async () => {
      const res = await markInvoicePaidAction(invoiceId);
      if (res.error) setErr(res.error);
      else router.refresh();
    });
  }

  return (
    <div>
      <button
        onClick={handle}
        disabled={pending}
        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
      >
        {pending ? "…" : "Mark Paid"}
      </button>
      {err && <div className="mt-0.5 text-[10px] text-red-400">{err}</div>}
    </div>
  );
}
