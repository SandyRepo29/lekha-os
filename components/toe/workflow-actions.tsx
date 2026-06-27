"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { startWorkflowAction, deleteWorkflowAction } from "@/lib/toe/actions";
import { Play, Plus, Trash2 } from "lucide-react";

export function StartWorkflowButton({ workflowId, name }: { workflowId: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => {
        const res = await startWorkflowAction(workflowId);
        if (!res.error) router.refresh();
      })}
      title={`Start ${name}`}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-blue)]/10 text-[var(--color-blue)] hover:bg-[var(--color-blue)]/20 disabled:opacity-40 transition-colors"
    >
      {pending ? (
        <span className="h-3 w-3 animate-spin rounded-full border border-[var(--color-blue)] border-t-transparent" />
      ) : (
        <Play className="h-3.5 w-3.5 fill-current" />
      )}
    </button>
  );
}

export function CreateWorkflowButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        <Plus className="h-4 w-4" /> New Workflow
      </button>
    );
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await import("@/lib/toe/actions").then(m => m.createWorkflowAction(null, fd));
          if (!res.error) { setOpen(false); router.refresh(); }
        });
      }}
      className="flex items-center gap-2"
    >
      <input name="name" placeholder="Workflow name" required autoFocus
        className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:border-[var(--color-blue)]"
      />
      <button type="submit" disabled={pending}
        className="rounded-xl bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
      >
        {pending ? "Creating&#8230;" : "Create"}
      </button>
      <button type="button" onClick={() => setOpen(false)}
        className="rounded-xl border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}

export function DeleteWorkflowButton({ workflowId }: { workflowId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this workflow?")) return;
        startTransition(async () => {
          await deleteWorkflowAction(workflowId);
          router.refresh();
        });
      }}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
