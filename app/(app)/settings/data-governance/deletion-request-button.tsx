"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

export function DeletionRequestButton({ orgName }: { orgName: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2 text-sm text-emerald-400">
        Request submitted. Our team will contact you within 2 business days.
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/[0.08]"
      >
        <Trash2 className="h-4 w-4" />
        Request Data Deletion
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-[var(--color-ink)]">
              Request Data Deletion
            </h2>
            <p className="mt-2 text-sm text-[var(--color-ink-dim)]">
              You are requesting permanent deletion of all data for{" "}
              <strong className="text-[var(--color-ink)]">{orgName}</strong>. This includes
              documents, vendors, assessments, audit logs, and all associated records.
            </p>
            <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-sm text-amber-400">
              This action is irreversible. A support ticket will be created and our team will
              contact you to verify the request before any deletion occurs.
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-[var(--color-line)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setSent(true);
                }}
                className="flex-1 rounded-xl bg-red-500/80 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
