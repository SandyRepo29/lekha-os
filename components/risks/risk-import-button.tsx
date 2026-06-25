"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { ImportModal } from "@/components/ui/import-modal";
import { importRisksAction } from "@/lib/risk/import-actions";
import { useRouter } from "next/navigation";

export function RiskImportButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleImport(rows: Record<string, string>[]) {
    const result = await importRisksAction(rows);
    if (result.success > 0) {
      router.refresh();
    }
    return result;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-white/[0.04] transition-colors"
      >
        <Upload className="h-3.5 w-3.5" />
        Import CSV
      </button>
      <ImportModal
        open={open}
        onClose={() => setOpen(false)}
        entityType="Risks"
        requiredColumns={["title", "category", "status", "impact", "likelihood"]}
        optionalColumns={["description", "treatmentStrategy", "owner"]}
        templateUrl="/templates/risks-import-template.csv"
        onImport={handleImport}
      />
    </>
  );
}
