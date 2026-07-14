"use client";

import { useState, useTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";
import { updateDocument, type DocState } from "@/backend/src/modules/vendor-hub/documents-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";

type Props = {
  documentId: string;
  documentType: string;
  issuedOn: string | null;
  expiresOn: string | null;
};

export function DocumentEdit({ documentId, documentType, issuedOn, expiresOn }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<DocState, FormData>(updateDocument, undefined);

  function onAction(fd: FormData) {
    formAction(fd);
  }

  // Close on success
  if (state?.ok && open) {
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        title="Edit document"
        className="rounded-md p-1.5 text-[var(--color-ink-faint)] transition-colors hover:bg-white/10 hover:text-[var(--color-ink)]"
      >
        <Pencil className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-[60] w-full max-w-md rounded-2xl border border-[var(--color-line-strong)] bg-[#0d0f1a] p-6 shadow-2xl">
            <h3 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">Edit document</h3>
            <form action={onAction} className="space-y-4">
              <input type="hidden" name="documentId" value={documentId} />

              <div>
                <Label htmlFor="documentType">Document type</Label>
                <Input id="documentType" name="documentType" defaultValue={documentType} placeholder="ISO 27001, SOC 2…" required />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="issuedOn">Issue date</Label>
                  <Input id="issuedOn" name="issuedOn" type="date" defaultValue={issuedOn ?? ""} />
                </div>
                <div>
                  <Label htmlFor="expiresOn">Expiry date</Label>
                  <Input id="expiresOn" name="expiresOn" type="date" defaultValue={expiresOn ?? ""} />
                </div>
              </div>

              {state?.error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{state.error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <Button type="submit" variant="primary" disabled={pending}>
                  <Check className="h-4 w-4" /> {pending ? "Saving…" : "Save"}
                </Button>
                <Button type="button" variant="subtle" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" /> Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
