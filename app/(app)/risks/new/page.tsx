export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { NewRiskForm } from "@/components/risk/new-risk-form";

export default async function NewRiskPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/risks" className="text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">New Risk</h1>
          <p className="text-xs text-[var(--color-ink-faint)]">Add a risk to the register</p>
        </div>
      </div>

      <Card className="p-6">
        <NewRiskForm />
      </Card>
    </div>
  );
}
