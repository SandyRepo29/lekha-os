export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { NewAssessmentForm } from "@/components/privacy/new-assessment-form";

export default async function NewAssessmentPage() {
  await requireUser();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/dpdp-privacy/assessments"
          className="flex items-center gap-2 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Assessments
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
          New Privacy Impact Assessment
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          Assess privacy risks for a data processing activity
        </p>
      </div>
      <Card className="p-6">
        <NewAssessmentForm />
      </Card>
    </div>
  );
}
