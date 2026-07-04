"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePlatformUserProfileAction } from "@/lib/platform-admin/actions";
import { Pencil, Check, X } from "lucide-react";

export function EditStaffForm({
  userId,
  currentName,
  currentEmail,
}: {
  userId: string;
  currentName: string;
  currentEmail: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [email, setEmail] = useState(currentEmail);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    setError("");
    startTransition(async () => {
      const result = await updatePlatformUserProfileAction(userId, name, email);
      if (result.error) { setError(result.error); return; }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-white/30 hover:text-white/60 transition-colors" title="Edit name/email">
        <Pencil className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[200px]">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full name"
        className="rounded border border-[#30363d] bg-[#161b22] px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#007A94]/50"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
        className="rounded border border-[#30363d] bg-[#161b22] px-2 py-1 text-xs text-white focus:outline-none"
      />
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      <div className="flex gap-1.5">
        <button onClick={handleSave} disabled={isPending} className="inline-flex items-center gap-1 rounded bg-[#007A94] px-2 py-1 text-xs font-semibold text-white disabled:opacity-50">
          <Check className="h-3 w-3" /> {isPending ? "Saving…" : "Save"}
        </button>
        <button onClick={() => { setOpen(false); setName(currentName); setEmail(currentEmail); }} className="inline-flex items-center gap-1 rounded border border-[#30363d] px-2 py-1 text-xs text-white/50">
          <X className="h-3 w-3" /> Cancel
        </button>
      </div>
    </div>
  );
}
