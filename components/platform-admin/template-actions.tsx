"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateVendorTypeAction, createVendorTypeAction } from "@/lib/platform-admin/actions";
import { Pencil, Check, X, Plus } from "lucide-react";

export function EditVendorTypeRow({
  id,
  name,
  description,
}: {
  id: string;
  name: string;
  description: string;
}) {
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(name);
  const [descVal, setDescVal] = useState(description ?? "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    setError("");
    startTransition(async () => {
      const result = await updateVendorTypeAction(id, nameVal, descVal);
      if (result.error) { setError(result.error); return; }
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="text-white/25 hover:text-white/60 transition-colors">
        <Pencil className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center gap-1.5">
        <input
          value={nameVal}
          onChange={(e) => setNameVal(e.target.value)}
          className="flex-1 rounded border border-[#30363d] bg-[#161b22] px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#007A94]/50"
        />
        <button onClick={handleSave} disabled={isPending} className="rounded bg-[#007A94] p-1 text-white disabled:opacity-40">
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => { setEditing(false); setNameVal(name); setDescVal(description ?? ""); }} className="rounded border border-[#30363d] p-1 text-white/50">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        value={descVal}
        onChange={(e) => setDescVal(e.target.value)}
        placeholder="Description (optional)"
        className="w-full rounded border border-[#30363d] bg-[#161b22] px-2 py-1 text-xs text-white/60 focus:outline-none"
      />
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

export function CreateVendorTypeForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await createVendorTypeAction(formData);
      if (result.error) { setError(result.error); return; }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-[#007A94] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        <Plus className="h-4 w-4" /> New Template
      </button>
    );
  }

  return (
    <form action={handleSubmit as unknown as (fd: FormData) => void} className="rounded-xl border border-[#007A94]/40 bg-[#007A94]/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">New Vendor Type Template</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-white/40 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          name="name"
          required
          placeholder="Template name *"
          className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-[#007A94]/50"
        />
        <input
          name="description"
          placeholder="Description (optional)"
          className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white/70 placeholder-white/25 focus:outline-none"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="rounded-lg bg-[#007A94] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
          {isPending ? "Creating…" : "Create"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[#30363d] px-4 py-2 text-sm text-white/60 hover:bg-white/[0.04]">
          Cancel
        </button>
      </div>
    </form>
  );
}
