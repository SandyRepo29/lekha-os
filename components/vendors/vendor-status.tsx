"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateVendorStatus } from "@/lib/vendors/actions";

const STATUS_OPTIONS = [
  { value: "active",   label: "Active",   color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { value: "pending",  label: "Pending",  color: "text-[var(--color-blue)] border-[var(--color-blue)]/30 bg-[var(--color-blue)]/10" },
  { value: "inactive", label: "Inactive", color: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-white/[0.04]" },
] as const;

export function VendorStatus({ vendorId, current }: { vendorId: string; current: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  const opt = STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0];

  function choose(val: string) {
    setOpen(false);
    if (val === status) return;
    setStatus(val);
    start(async () => {
      await updateVendorStatus(vendorId, val);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={pending}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${opt.color} ${pending ? "opacity-60" : "hover:opacity-80 cursor-pointer"}`}
      >
        {pending ? "Saving…" : opt.label}
        <span className="text-[10px] opacity-60">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-8 z-20 min-w-[130px] overflow-hidden rounded-xl border border-[var(--color-line-strong)] bg-[#0d0f1a] shadow-xl">
            {STATUS_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => choose(o.value)}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/[0.05] ${o.value === status ? "font-semibold text-[var(--color-ink)]" : "text-[var(--color-ink-dim)]"}`}
              >
                <span className={`h-2 w-2 rounded-full ${o.value === "active" ? "bg-emerald-400" : o.value === "pending" ? "bg-[var(--color-blue)]" : "bg-[var(--color-ink-faint)]"}`} />
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
