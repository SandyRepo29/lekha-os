export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { createRegulationAction } from "@/backend/src/modules/regulatory-intelligence/actions";
import { RegNewForm, type RegField } from "@/components/regulatory-intelligence/reg-new-form";

const FIELDS: RegField[] = [
  { name: "name", label: "Regulation Name", required: true, placeholder: "e.g. Digital Personal Data Protection Act" },
  { name: "shortName", label: "Short Name", placeholder: "e.g. DPDP" },
  { name: "authority", label: "Issuing Authority", placeholder: "e.g. MeitY" },
  { name: "country", label: "Country", placeholder: "e.g. India" },
  { name: "region", label: "Region", placeholder: "e.g. APAC" },
  { name: "category", label: "Category", type: "select", options: [
    { value: "data_privacy", label: "Data Privacy" },
    { value: "financial", label: "Financial" },
    { value: "healthcare", label: "Healthcare" },
    { value: "cybersecurity", label: "Cybersecurity" },
    { value: "ai_governance", label: "AI Governance" },
    { value: "sector_specific", label: "Sector Specific" },
  ] },
  { name: "version", label: "Version", placeholder: "e.g. 2023" },
  { name: "effectiveDate", label: "Effective Date", type: "date" },
  { name: "reviewDate", label: "Next Review Date", type: "date" },
  { name: "sourceUrl", label: "Source URL", placeholder: "https://…" },
  { name: "description", label: "Description", type: "textarea" },
];

export default async function NewRegulationPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/regulatory-intelligence/library"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Regulation Library™
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold">Add Regulation</h1>
      </div>
      <RegNewForm action={createRegulationAction} fields={FIELDS} submitLabel="Add Regulation" redirectTo="/regulatory-intelligence/library" />
    </div>
  );
}
