export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { createObligationAction } from "@/backend/src/modules/regulatory-intelligence/actions";
import { RegNewForm, type RegField } from "@/components/regulatory-intelligence/reg-new-form";

const PRIORITY = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const FIELDS: RegField[] = [
  { name: "title", label: "Obligation Title", required: true, placeholder: "e.g. Appoint a Data Protection Officer" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "requirement", label: "Requirement", type: "textarea", placeholder: "What the regulation requires" },
  { name: "obligationRef", label: "Reference", placeholder: "e.g. DPDP §8(7)" },
  { name: "category", label: "Category", placeholder: "e.g. governance, security" },
  { name: "priority", label: "Priority", type: "select", options: PRIORITY, defaultValue: "medium" },
  { name: "regulationId", label: "Regulation ID (optional)", placeholder: "linked regulation UUID" },
  { name: "businessUnit", label: "Business Unit", placeholder: "e.g. Legal" },
  { name: "dueDate", label: "Due Date", type: "date" },
  { name: "evidenceRequirements", label: "Evidence Requirements", type: "textarea" },
];

export default async function NewObligationPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/regulatory-intelligence/obligations"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Obligations™
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold">Add Obligation</h1>
      </div>
      <RegNewForm action={createObligationAction} fields={FIELDS} submitLabel="Add Obligation" redirectTo="/regulatory-intelligence/obligations" />
    </div>
  );
}
