"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { ImportModal } from "@/components/ui/import-modal";
import { importVendorsAction } from "@/lib/vendors/import-actions";
import { useRouter } from "next/navigation";

export function VendorImportButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleImport(rows: Record<string, string>[]) {
    const result = await importVendorsAction(rows);
    if (result.success > 0) {
      router.refresh();
    }
    return result;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-[#F8F9FB] transition-colors"
      >
        <Upload className="h-3.5 w-3.5" />
        Import CSV
      </button>
      <ImportModal
        open={open}
        onClose={() => setOpen(false)}
        entityType="Vendors"
        requiredColumns={["name", "category", "riskLevel"]}
        optionalColumns={["contactEmail", "contactName", "website", "country", "description", "complianceScore"]}
        templateUrl="/templates/vendors-import-template.csv"
        onImport={handleImport}
      />
    </>
  );
}
