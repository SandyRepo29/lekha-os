export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { listFrameworks } from "@/backend/src/modules/compliance/framework-service";
import { NewAuditForm } from "@/components/audit/new-audit-form";

export default async function NewAuditPage() {
  const session = await requireUser();

  let frameworks: { id: string; name: string }[] = [];
  if (!session.demo && session.org) {
    const fws = await listFrameworks(session.org.id);
    frameworks = fws.map((f) => ({ id: f.id, name: f.name }));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/audits/list"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to audits
      </Link>

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
          New Audit
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)]">
          Plan an internal, external, vendor, or regulatory audit.
        </p>
      </div>

      {session.demo || !session.org ? (
        <Card className="p-6">
          <p className="text-sm text-[var(--color-ink-dim)]">Not available in demo mode.</p>
        </Card>
      ) : (
        <Card className="p-6">
          <NewAuditForm frameworks={frameworks} />
        </Card>
      )}
    </div>
  );
}
