"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, Check, X } from "lucide-react";
import { updateVendorNotes } from "@/lib/vendors/actions";
import { Button } from "@/components/ui/button";

export function VendorNotes({ vendorId, notes }: { vendorId: string; notes: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(notes ?? "");
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      await updateVendorNotes(vendorId, value);
      setEditing(false);
      router.refresh();
    });
  }

  function cancel() {
    setValue(notes ?? "");
    setEditing(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
          <StickyNote className="h-4 w-4 text-[var(--color-ink-faint)]" /> Notes
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-xs text-[var(--color-blue)] hover:underline">
            {notes ? "Edit" : "Add note"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            placeholder="Add internal notes about this vendor — risk context, relationship history, action items…"
            className="w-full rounded-xl border border-[var(--color-line-strong)] bg-white/[0.03] px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]/30 resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={save} disabled={pending}>
              <Check className="h-3.5 w-3.5" /> {pending ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" variant="subtle" onClick={cancel} disabled={pending}>
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className={`text-sm leading-relaxed ${notes ? "text-[var(--color-ink-dim)]" : "italic text-[var(--color-ink-faint)]"}`}>
          {notes || "No notes added yet."}
        </p>
      )}
    </div>
  );
}
