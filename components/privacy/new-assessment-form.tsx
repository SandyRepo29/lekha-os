"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createAssessmentAction } from "@/backend/src/modules/privacy/actions";

const RISK_LEVELS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export function NewAssessmentForm() {
  const [state, action, isPending] = useActionState(createAssessmentAction, undefined);

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5">
          Assessment Title <span className="text-red-400">*</span>
        </label>
        <input
          name="title"
          required
          placeholder="e.g. PIA for Customer Analytics Platform"
          className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Scope</label>
        <textarea
          name="scope"
          rows={2}
          placeholder="Describe the processing activity or system in scope"
          className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1.5">Risk Level</label>
          <select
            name="riskLevel"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          >
            {RISK_LEVELS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Purpose of Processing</label>
          <input
            name="purpose"
            placeholder="e.g. Personalised product recommendations"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Data Types Involved</label>
        <input
          name="dataTypes"
          placeholder="e.g. Name, email, purchase history, location data"
          className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Assessment"}
        </Button>
      </div>
    </form>
  );
}
