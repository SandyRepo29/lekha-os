export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { createChangeAction } from "@/backend/src/modules/regulatory-intelligence/actions";
import { RegNewForm, type RegField } from "@/components/regulatory-intelligence/reg-new-form";

const SEVERITY = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const FIELDS: RegField[] = [
  { name: "title", label: "Change Title", required: true, placeholder: "e.g. New consent requirements under DPDP Rules" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "changeType", label: "Change Type", placeholder: "e.g. amendment, new_rule, guidance" },
  { name: "severity", label: "Severity", type: "select", options: SEVERITY, defaultValue: "medium" },
  { name: "regulationId", label: "Regulation ID (optional)", placeholder: "linked regulation UUID" },
  { name: "source", label: "Source", placeholder: "e.g. Official Gazette" },
  { name: "sourceUrl", label: "Source URL", placeholder: "https://…" },
  { name: "publishedDate", label: "Published Date", type: "date" },
  { name: "effectiveDate", label: "Effective Date", type: "date" },
];

export default async function NewChangePage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/regulatory-intelligence/changes"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Change Monitor™
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold">Log Regulatory Change</h1>
      </div>
      <RegNewForm action={createChangeAction} fields={FIELDS} submitLabel="Log Change" redirectTo="/regulatory-intelligence/changes" />
    </div>
  );
}
