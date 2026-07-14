"use client";

import { useActionState } from "react";
import { createAuditAction } from "@/backend/src/modules/audit-management/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const AUDIT_TYPES = [
  { value: "internal", label: "Internal" },
  { value: "external", label: "External" },
  { value: "vendor", label: "Vendor" },
  { value: "security", label: "Security" },
  { value: "compliance", label: "Compliance" },
  { value: "regulatory", label: "Regulatory" },
];

export function NewAuditForm({
  frameworks,
}: {
  frameworks: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createAuditAction, undefined);

  return (
    <form action={action} className="space-y-5">
      {state?.error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="name">
          Audit Name <span className="text-red-400">*</span>
        </label>
        <Input id="name" name="name" placeholder="e.g. ISO 27001 Annual Audit 2026" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="auditType">
            Audit Type
          </label>
          <Select name="auditType" defaultValue="internal">
            {AUDIT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>

        {frameworks.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="frameworkId">
              Framework (optional)
            </label>
            <Select name="frameworkId" defaultValue="">
              <option value="">— None —</option>
              {frameworks.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="scope">
          Scope
        </label>
        <textarea
          id="scope"
          name="scope"
          rows={2}
          placeholder="Define the audit scope..."
          className="w-full rounded-xl border border-[var(--color-line)] bg-white px-4 py-2 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]/50 resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="objective">
          Objective
        </label>
        <textarea
          id="objective"
          name="objective"
          rows={2}
          placeholder="State the audit objective..."
          className="w-full rounded-xl border border-[var(--color-line)] bg-white px-4 py-2 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]/50 resize-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="startDate">
            Start Date
          </label>
          <Input id="startDate" name="startDate" type="date" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="endDate">
            End Date
          </label>
          <Input id="endDate" name="endDate" type="date" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="auditorName">
          Auditor Name
        </label>
        <Input id="auditorName" name="auditorName" placeholder="e.g. Ernst & Young / Jane Smith" />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" size="md" disabled={pending}>
          {pending ? "Creating…" : "Create Audit"}
        </Button>
      </div>
    </form>
  );
}
