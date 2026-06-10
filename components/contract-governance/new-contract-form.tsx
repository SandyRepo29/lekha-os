"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createContractAction, type ContractState } from "@/lib/contract-governance/actions";

const CONTRACT_TYPES = [
  { value: "vendor_agreement", label: "Vendor Agreement" },
  { value: "msa", label: "Master Service Agreement (MSA)" },
  { value: "sow", label: "Statement of Work (SOW)" },
  { value: "nda", label: "Non-Disclosure Agreement (NDA)" },
  { value: "dpa", label: "Data Processing Agreement (DPA)" },
  { value: "employment", label: "Employment Contract" },
  { value: "partner_agreement", label: "Partner Agreement" },
  { value: "procurement", label: "Procurement Contract" },
  { value: "custom", label: "Custom" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "SGD", "AED"];

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[var(--color-ink-dim)]">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl bg-white/5 border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-[var(--color-ink-dim)]";

export function NewContractForm() {
  const [state, action, pending] = useActionState<ContractState, FormData>(
    createContractAction,
    undefined
  );

  return (
    <Card className="p-6">
      <form action={action} className="space-y-5">
        {state?.error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {state.error}
          </div>
        )}

        <FieldGroup label="Contract Title *">
          <input name="title" required className={inputClass} placeholder="e.g. Acme Corp MSA 2025" />
        </FieldGroup>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label="Contract Type">
            <select name="contractType" className={inputClass}>
              {CONTRACT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup label="Currency">
            <select name="currency" className={inputClass}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FieldGroup>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label="Contract Value">
            <input name="value" type="number" min="0" step="0.01" className={inputClass} placeholder="0.00" />
          </FieldGroup>
          <FieldGroup label="Notice Period (days)">
            <input name="noticePeriodDays" type="number" min="0" className={inputClass} defaultValue="30" />
          </FieldGroup>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FieldGroup label="Effective Date">
            <input name="effectiveDate" type="date" className={inputClass} />
          </FieldGroup>
          <FieldGroup label="Expiry Date">
            <input name="expiryDate" type="date" className={inputClass} />
          </FieldGroup>
          <FieldGroup label="Renewal Date">
            <input name="renewalDate" type="date" className={inputClass} />
          </FieldGroup>
        </div>

        <FieldGroup label="Auto Renewal">
          <label className="flex items-center gap-2 cursor-pointer">
            <input name="autoRenewal" type="checkbox" value="true" className="rounded" />
            <span className="text-sm">This contract auto-renews</span>
          </label>
        </FieldGroup>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create Contract"}
          </Button>
          <Link href="/contract-governance/library">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </Card>
  );
}
