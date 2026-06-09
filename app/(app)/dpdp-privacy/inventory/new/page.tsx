export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { NewAssetForm } from "@/components/privacy/new-asset-form";

export default async function NewAssetPage() {
  await requireUser();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/dpdp-privacy/inventory"
          className="flex items-center gap-2 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Inventory
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Add Data Asset
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          Register a personal data asset in your DPDP inventory
        </p>
      </div>

      <Card className="p-6">
        <NewAssetForm />
      </Card>
    </div>
  );
}
