"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createAssetAction } from "@/lib/privacy/actions";

const DATA_CATEGORIES = [
  { value: "customer", label: "Customer" },
  { value: "employee", label: "Employee" },
  { value: "vendor", label: "Vendor" },
  { value: "marketing", label: "Marketing" },
  { value: "financial", label: "Financial" },
  { value: "health", label: "Health" },
  { value: "biometric", label: "Biometric" },
  { value: "custom", label: "Custom / Other" },
];

const SENSITIVITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export function NewAssetForm() {
  const [state, action, isPending] = useActionState(createAssetAction, undefined);

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Asset Name <span className="text-red-400">*</span>
          </label>
          <input
            name="name"
            required
            placeholder="e.g. Customer Contact Database"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Department</label>
          <input
            name="department"
            placeholder="e.g. Marketing, HR, Finance"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Description</label>
        <textarea
          name="description"
          rows={2}
          placeholder="What personal data does this asset contain?"
          className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1.5">Data Category</label>
          <select
            name="dataCategory"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          >
            {DATA_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Sensitivity Level</label>
          <select
            name="sensitivity"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          >
            {SENSITIVITIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1.5">Purpose of Processing</label>
          <input
            name="purpose"
            placeholder="e.g. Customer communication, payroll processing"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Storage Location</label>
          <input
            name="storageLocation"
            placeholder="e.g. AWS Mumbai, on-premise server"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1.5">Retention Period (days)</label>
          <input
            name="retentionPeriod"
            type="number"
            min={1}
            placeholder="e.g. 365"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>

        <div className="flex items-end pb-1">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="crossBorder"
              value="true"
              className="h-4 w-4 rounded border-[var(--color-line)] bg-[#F8F9FB] accent-indigo-500"
            />
            <span className="text-sm">Cross-border transfer involved</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Asset"}
        </Button>
      </div>
    </form>
  );
}
