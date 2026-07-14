"use client";

import { useActionState } from "react";
import { createCapaAction } from "@/backend/src/modules/audit-management/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AuditFinding } from "@/lib/db/schema";

export function NewCapaForm({
  auditId,
  findings,
  preselectedFindingId = "",
}: {
  auditId: string;
  findings: AuditFinding[];
  preselectedFindingId?: string;
}) {
  const [state, action, pending] = useActionState(createCapaAction, undefined);

  const openFindings = findings.filter((f) => f.status !== "closed");

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <input type="hidden" name="auditId" value={auditId} />

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Finding <span className="text-red-400">*</span></label>
        <Select name="findingId" defaultValue={preselectedFindingId} required>
          <option value="">Select a finding…</option>
          {openFindings.map((f) => (
            <option key={f.id} value={f.id}>{f.title}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">CAPA Title <span className="text-red-400">*</span></label>
        <Input name="title" required placeholder="e.g. Implement MFA for all admin accounts" />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <textarea
          name="description"
          rows={2}
          className="w-full rounded-xl border border-[var(--color-line)] bg-white px-4 py-2 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]/50 resize-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Due Date</label>
          <Input name="dueDate" type="date" />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add CAPA"}
        </Button>
      </div>
    </form>
  );
}
