export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { NewFrameworkForm } from "@/components/compliance/new-framework-form";

export default async function NewFrameworkPage() {
  const session = await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/compliance/frameworks"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to frameworks
      </Link>

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Add framework</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">
          Choose a standard framework or create a custom one.
        </p>
      </div>

      {session.demo || !session.org ? (
        <Card className="p-6">
          <p className="text-sm text-[var(--color-ink-dim)]">Not available in demo mode.</p>
        </Card>
      ) : (
        <Card className="p-6">
          <NewFrameworkForm />
        </Card>
      )}
    </div>
  );
}
