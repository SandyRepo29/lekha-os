"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Trash2 } from "lucide-react";
import { reextractDocument, deleteDocument } from "@/lib/documents/actions";

export function DocumentActions({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function reextract() {
    setError(null);
    start(async () => {
      const res = await reextractDocument(documentId);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  function remove() {
    if (!window.confirm("Delete this document? This also removes the stored file.")) return;
    setError(null);
    start(async () => {
      const res = await deleteDocument(documentId);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={reextract}
        disabled={pending}
        title="Re-run AI extraction"
        className="rounded-md p-1.5 text-[var(--color-ink-faint)] transition-colors hover:bg-white/10 hover:text-[var(--color-blue)] disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
      </button>
      <button
        onClick={remove}
        disabled={pending}
        title="Delete document"
        className="rounded-md p-1.5 text-[var(--color-ink-faint)] transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
