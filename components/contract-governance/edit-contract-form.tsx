"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateContractAction, type ContractState } from "@/backend/src/modules/contract-governance/actions";
import type { Contract } from "@/lib/db/schema";

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

const CONTRACT_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "In Review" },
  { value: "negotiation", label: "Negotiation" },
  { value: "active", label: "Active" },
  { value: "expiring", label: "Expiring" },
  { value: "expired", label: "Expired" },
  { value: "renewed", label: "Renewed" },
  { value: "terminated", label: "Terminated" },
  { value: "archived", label: "Archived" },
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
  "w-full rounded-xl bg-[#F8F9FB] border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-[var(--color-ink-dim)]";

function toDateInput(val: string | null | undefined): string {
  if (!val) return "";
  return val.slice(0, 10);
}

export function EditContractForm({ contract }: { contract: Contract }) {
  const [state, action, pending] = useActionState<ContractState, FormData>(updateContractAction, undefined);

  return (
    <Card className="p-6">
      <form action={action} className="space-y-5">
        <input type="hidden" name="id" value={contract.id} />
        {state?.error && (
          <div className="rounded-xl bg-red-100 border border-red-200 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}
        {state?.ok && (
          <div className="rounded-xl bg-green-100 border border-green-200 px-4 py-3 text-sm text-green-700">
            Contract updated.
          </div>
        )}

        <FieldGroup label="Contract Title *">
          <input
            name="title"
            required
            defaultValue={contract.title}
            className={inputClass}
            placeholder="e.g. Acme Corp MSA 2025"
          />
        </FieldGroup>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label="Contract Type">
            <select name="contractType" defaultValue={contract.contractType} className={inputClass}>
              {CONTRACT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup label="Status">
            <select name="status" defaultValue={contract.status} className={inputClass}>
              {CONTRACT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </FieldGroup>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label="Currency">
            <select name="currency" defaultValue={contract.currency ?? "USD"} className={inputClass}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FieldGroup>
          <FieldGroup label="Contract Value">
            <input
              name="value"
              type="number"
              min="0"
              step="0.01"
              defaultValue={contract.value ? String(contract.value) : ""}
              className={inputClass}
              placeholder="0.00"
            />
          </FieldGroup>
        </div>

        <FieldGroup label="Notice Period (days)">
          <input
            name="noticePeriodDays"
            type="number"
            min="0"
            defaultValue={contract.noticePeriodDays ?? 30}
            className={inputClass}
          />
        </FieldGroup>

        <div className="grid gap-4 sm:grid-cols-3">
          <FieldGroup label="Effective Date">
            <input
              name="effectiveDate"
              type="date"
              defaultValue={toDateInput(contract.effectiveDate)}
              className={inputClass}
            />
          </FieldGroup>
          <FieldGroup label="Expiry Date">
            <input
              name="expiryDate"
              type="date"
              defaultValue={toDateInput(contract.expiryDate)}
              className={inputClass}
            />
          </FieldGroup>
          <FieldGroup label="Renewal Date">
            <input
              name="renewalDate"
              type="date"
              defaultValue={toDateInput(contract.renewalDate)}
              className={inputClass}
            />
          </FieldGroup>
        </div>

        <FieldGroup label="Auto Renewal">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              name="autoRenewal"
              type="checkbox"
              value="true"
              defaultChecked={contract.autoRenewal ?? false}
              className="rounded"
            />
            <span className="text-sm">This contract auto-renews</span>
          </label>
        </FieldGroup>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Changes"}
          </Button>
          <Link href={`/contract-governance/${contract.id}`}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </Card>
  );
}
