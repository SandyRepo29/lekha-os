"use client";

import { useActionState } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createRetentionPolicyAction } from "@/lib/privacy/actions";

const inputCls =
  "w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50";

export function NewRetentionForm() {
  const [state, formAction, pending] = useActionState(createRetentionPolicyAction, undefined);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <label className="block text-xs font-medium mb-1.5">Policy Name</label>
        <input name="name" required placeholder="e.g. Customer Data Retention" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5">Data Category</label>
        <select name="dataCategory" className={inputCls}>
          {["customer", "employee", "vendor", "marketing", "financial", "health", "biometric", "custom"].map((c) => (
            <option key={c} value={c} className="capitalize">{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5">Retention Days</label>
        <input name="retentionDays" type="number" min={1} required placeholder="e.g. 730" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5">Legal Basis</label>
        <input name="legalBasis" placeholder="e.g. Contractual obligation, statutory requirement" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5">Action on Expiry</label>
        <select name="actionOnExpiry" className={inputCls}>
          <option value="delete">Delete</option>
          <option value="anonymize">Anonymize</option>
          <option value="archive">Archive</option>
          <option value="review">Flag for Review</option>
        </select>
      </div>
      <div className="flex items-end gap-3">
        <Button type="submit" disabled={pending} className="w-full">
          <Plus className="h-4 w-4" /> {pending ? "Adding…" : "Add Policy"}
        </Button>
      </div>
      {state?.error && <p className="sm:col-span-2 lg:col-span-3 text-sm text-red-600">{state.error}</p>}
      {state?.ok && (
        <p className="sm:col-span-2 lg:col-span-3 inline-flex items-center gap-1.5 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" /> Retention policy added.
        </p>
      )}
    </form>
  );
}
