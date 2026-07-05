export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { createAssessmentAction } from "@/lib/regulatory-intelligence/actions";
import { RegNewForm, type RegField } from "@/components/regulatory-intelligence/reg-new-form";

const IMPACT = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const FIELDS: RegField[] = [
  { name: "title", label: "Assessment Title", required: true, placeholder: "e.g. DPDP Rules 2025 Impact Assessment" },
  { name: "regulationId", label: "Regulation ID (optional)", placeholder: "linked regulation UUID" },
  { name: "changeId", label: "Change ID (optional)", placeholder: "linked change UUID" },
  { name: "impactLevel", label: "Impact Level", type: "select", options: IMPACT, defaultValue: "medium" },
  { name: "summary", label: "Summary", type: "textarea" },
  { name: "dueDate", label: "Due Date", type: "date" },
];

export default async function NewAssessmentPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/regulatory-intelligence/assessments"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Impact Assessments™
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold">New Impact Assessment</h1>
      </div>
      <RegNewForm action={createAssessmentAction} fields={FIELDS} submitLabel="Create Assessment" redirectTo="/regulatory-intelligence/assessments" />
    </div>
  );
}
