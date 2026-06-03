export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { NewEvidenceForm } from "@/components/compliance/new-evidence-form";

export default async function NewEvidencePage() {
  const session = await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/compliance/evidence"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to evidence
      </Link>

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Add evidence
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)]">
          Manually record an evidence item and map it to controls.
        </p>
      </div>

      {session.demo || !session.org ? (
        <Card className="p-6">
          <p className="text-sm text-[var(--color-ink-dim)]">Not available in demo mode.</p>
        </Card>
      ) : (
        <Card className="p-6">
          <NewEvidenceForm />
        </Card>
      )}
    </div>
  );
}
