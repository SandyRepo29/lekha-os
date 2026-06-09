"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createRequestAction } from "@/lib/privacy/actions";

const REQUEST_TYPES = [
  { value: "access", label: "Right to Access" },
  { value: "correction", label: "Right to Correction" },
  { value: "deletion", label: "Right to Deletion (Erasure)" },
  { value: "portability", label: "Right to Portability" },
  { value: "consent_withdrawal", label: "Consent Withdrawal" },
  { value: "grievance", label: "Grievance" },
];

export function NewRequestForm() {
  const [state, action, isPending] = useActionState(createRequestAction, undefined);

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {state.error}
        </div>
      )}

      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-xs text-yellow-300">
        Under DPDP Act 2023, data subject requests must be responded to within <strong>30 days</strong>. A due date will be automatically set.
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          Request Type <span className="text-red-400">*</span>
        </label>
        <select
          name="requestType"
          required
          className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        >
          {REQUEST_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Subject Name <span className="text-red-400">*</span>
          </label>
          <input
            name="subjectName"
            required
            placeholder="Data subject's full name"
            className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Subject Email <span className="text-red-400">*</span>
          </label>
          <input
            name="subjectEmail"
            type="email"
            required
            placeholder="subject@example.com"
            className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Description / Details</label>
        <textarea
          name="description"
          rows={3}
          placeholder="Describe the request in detail..."
          className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit Request"}
        </Button>
      </div>
    </form>
  );
}
