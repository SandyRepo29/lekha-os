"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { updateControlAction } from "@/lib/control-center/actions";
import type { ControlWithMeta } from "@/lib/repositories/control-center-repo";

const TYPES = [
  ["preventive", "Preventive"], ["detective", "Detective"], ["corrective", "Corrective"],
  ["compensating", "Compensating"], ["administrative", "Administrative"],
  ["technical", "Technical"], ["physical", "Physical"], ["hybrid", "Hybrid"],
];
const FREQUENCIES = [
  ["continuous", "Continuous"], ["daily", "Daily"], ["weekly", "Weekly"], ["monthly", "Monthly"],
  ["quarterly", "Quarterly"], ["semi_annual", "Semi-Annual"], ["annual", "Annual"], ["ad_hoc", "Ad Hoc"],
];
const AUTOMATION = [
  ["manual", "Manual"], ["semi_automated", "Semi-Automated"],
  ["automated", "Automated"], ["ai_assisted", "AI Assisted"],
];
const CATEGORIES = [
  "Security", "Compliance", "Vendor", "Privacy", "Financial",
  "Operational", "Technology", "Business Continuity", "Legal", "Custom",
];

export function EditControlForm({ control }: { control: ControlWithMeta }) {
  const [state, action, pending] = useActionState(updateControlAction, undefined);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={control.id} />

      {state?.error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Control ID *</label>
          <input name="controlRef" required defaultValue={control.controlRef}
            className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Name *</label>
          <input name="name" required defaultValue={control.name}
            className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Description</label>
        <textarea name="description" rows={3} defaultValue={control.description ?? ""}
          className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60 resize-none" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Objective</label>
        <textarea name="objective" rows={2} defaultValue={control.objective ?? ""}
          className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60 resize-none" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Category</label>
          <select name="category" defaultValue={control.category ?? ""}
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60">
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c} value={c.toLowerCase().replace(/ /g, "_")}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Control Type</label>
          <select name="controlType" defaultValue={control.controlType ?? ""}
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60">
            <option value="">Select type</option>
            {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Status</label>
          <select name="status" defaultValue={control.status}
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60">
            <option value="not_implemented">Not Implemented</option>
            <option value="partial">Partially Implemented</option>
            <option value="implemented">Implemented</option>
            <option value="not_applicable">N/A</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Priority</label>
          <select name="priority" defaultValue={control.priority}
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Frequency</label>
          <select name="frequency" defaultValue={control.frequency ?? ""}
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60">
            <option value="">Select frequency</option>
            {FREQUENCIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Automation</label>
          <select name="automationLevel" defaultValue={control.automationLevel ?? "manual"}
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60">
            {AUTOMATION.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Owner</label>
          <input name="owner" defaultValue={control.owner ?? ""}
            className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Next Review Date</label>
          <input name="nextReviewDate" type="date" defaultValue={control.nextReviewDate ?? ""}
            className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Next Test Date</label>
          <input name="nextTestDate" type="date" defaultValue={control.nextTestDate ?? ""}
            className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Last Review Date</label>
          <input name="reviewDate" type="date" defaultValue={control.reviewDate ?? ""}
            className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
