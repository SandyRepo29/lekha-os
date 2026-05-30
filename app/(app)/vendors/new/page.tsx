export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { NewVendorForm } from "@/components/vendors/new-vendor-form";

export default function NewVendorPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/vendors"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to vendors
      </Link>

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Add vendor</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">
          Register a vendor to start tracking documents, certifications and risk.
        </p>
      </div>

      <Card className="p-6">
        <NewVendorForm />
      </Card>
    </div>
  );
}
