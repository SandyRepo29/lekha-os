"use client";

import { useActionState } from "react";
import { createPolicyAction } from "@/backend/src/modules/policy-governance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const POLICY_TYPES = [
  { value: "information_security", label: "Information Security" },
  { value: "privacy", label: "Privacy" },
  { value: "vendor_management", label: "Vendor Management" },
  { value: "data_retention", label: "Data Retention" },
  { value: "access_control", label: "Access Control" },
  { value: "acceptable_use", label: "Acceptable Use" },
  { value: "business_continuity", label: "Business Continuity" },
  { value: "incident_response", label: "Incident Response" },
  { value: "hr", label: "Human Resources" },
  { value: "finance", label: "Finance" },
  { value: "custom", label: "Custom" },
];

const AUDIENCE_OPTIONS = [
  { value: "everyone", label: "Everyone" },
  { value: "department", label: "Department" },
  { value: "role", label: "Role" },
  { value: "team", label: "Team" },
  { value: "custom", label: "Custom" },
];

export function NewPolicyForm() {
  const [state, action, pending] = useActionState(createPolicyAction, undefined);

  return (
    <form action={action} className="space-y-5">
      {state?.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">
            Policy Name <span className="text-red-400">*</span>
          </label>
          <Input name="name" placeholder="e.g. Information Security Policy" required />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Policy Type</label>
          <select name="policyType" className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
            <option value="">Select type…</option>
            {POLICY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Version</label>
          <Input name="version" placeholder="1.0" defaultValue="1.0" />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium">Description</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Brief description of this policy's purpose…"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Effective Date</label>
          <Input name="effectiveDate" type="date" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Next Review Date</label>
          <Input name="nextReviewDate" type="date" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Policy Owner (name)</label>
          <Input name="owner" placeholder="e.g. CISO, Compliance Manager" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Audience</label>
          <select name="audience" className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
            {AUDIENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 flex items-center gap-3">
          <input
            type="checkbox"
            id="attestationRequired"
            name="attestationRequired"
            value="true"
            className="h-4 w-4 rounded border-[var(--color-line)] bg-[var(--color-bg-2)] accent-indigo-500"
          />
          <label htmlFor="attestationRequired" className="text-sm">
            Require user attestation for this policy
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create Policy"}
        </Button>
      </div>
    </form>
  );
}
