"use client";

import { useState } from "react";
import { updateAuditAction, deleteAuditAction } from "@/lib/audit/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Audit } from "@/lib/db/schema";

const AUDIT_TYPES = [
  { value: "internal", label: "Internal" },
  { value: "external", label: "External" },
  { value: "vendor", label: "Vendor" },
  { value: "security", label: "Security" },
  { value: "compliance", label: "Compliance" },
  { value: "regulatory", label: "Regulatory" },
];

export function EditAuditForm({
  audit,
  frameworks,
}: {
  audit: Audit;
  frameworks: { id: string; name: string }[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(formData: FormData) {
    setBusy(true);
    setError(null);
    const res = await updateAuditAction(audit.id, formData);
    if (res?.error) setError(res.error);
    setBusy(false);
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="name">Audit Name</label>
        <Input id="name" name="name" defaultValue={audit.name} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="auditType">Audit Type</label>
          <Select name="auditType" defaultValue={audit.auditType}>
            {AUDIT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </div>
        {frameworks.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="frameworkId">Framework</label>
            <Select name="frameworkId" defaultValue={audit.frameworkId ?? ""}>
              <option value="">— None —</option>
              {frameworks.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="scope">Scope</label>
        <textarea
          id="scope" name="scope" rows={2} defaultValue={audit.scope ?? ""}
          className="w-full rounded-xl border border-[var(--color-line)] bg-white px-4 py-2 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]/50 resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="objective">Objective</label>
        <textarea
          id="objective" name="objective" rows={2} defaultValue={audit.objective ?? ""}
          className="w-full rounded-xl border border-[var(--color-line)] bg-white px-4 py-2 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]/50 resize-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Start Date</label>
          <Input name="startDate" type="date" defaultValue={audit.startDate ?? ""} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">End Date</label>
          <Input name="endDate" type="date" defaultValue={audit.endDate ?? ""} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="auditorName">Auditor Name</label>
        <Input id="auditorName" name="auditorName" defaultValue={audit.auditorName ?? ""} />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" size="md" disabled={busy}>
          {busy ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
