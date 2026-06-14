export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { NewRequestForm } from "@/components/privacy/new-request-form";

export default async function NewRequestPage() {
  await requireUser();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/dpdp-privacy/requests"
          className="flex items-center gap-2 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Requests
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
          New Data Subject Request
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          Register a DPDP Act 2023 data subject rights request
        </p>
      </div>

      <Card className="p-6">
        <NewRequestForm />
      </Card>
    </div>
  );
}
