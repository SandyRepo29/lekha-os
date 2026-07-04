"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrgAction } from "@/lib/platform-admin/actions";
import { Plus, X } from "lucide-react";

const INDUSTRY_OPTIONS = [
  "Technology", "Financial Services", "Healthcare", "Manufacturing",
  "Retail", "Education", "Government", "Energy", "Media", "Professional Services", "Other",
];

const SIZE_OPTIONS = [
  "1_10", "11_50", "51_200", "201_500", "501_1000", "1001_5000", "5001_plus",
];

const SIZE_LABELS: Record<string, string> = {
  "1_10": "1–10", "11_50": "11–50", "51_200": "51–200", "201_500": "201–500",
  "501_1000": "501–1000", "1001_5000": "1001–5000", "5001_plus": "5001+",
};

export function CreateOrgForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await createOrgAction(formData);
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
        <Plus className="h-4 w-4" /> Create Organization
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[#007A94]/40 bg-[#007A94]/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Create Organization</h2>
        <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form action={handleSubmit as unknown as (fd: FormData) => void} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            name="name"
            required
            placeholder="Organization name *"
            className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-[#007A94]/50"
          />
          <select
            name="industry"
            className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white"
          >
            <option value="">Industry (optional)</option>
            {INDUSTRY_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <select
            name="company_size"
            className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white"
          >
            <option value="">Company size (optional)</option>
            {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{SIZE_LABELS[s]}</option>)}
          </select>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-[#007A94] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending ? "Creating…" : "Create"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[#30363d] px-4 py-2 text-sm text-white/60 hover:bg-white/[0.04]">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
