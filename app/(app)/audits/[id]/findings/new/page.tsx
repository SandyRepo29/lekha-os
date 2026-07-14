export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getAudit } from "@/backend/src/modules/audit-management/audit-service";
import { NewFindingForm } from "@/components/audit/new-finding-form";

export default async function NewFindingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;
  if (session.demo || !session.org) notFound();

  const audit = await getAudit(session.org.id, id);
  if (!audit) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/audits/${id}/findings`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to findings
      </Link>
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Add Finding
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)]">{audit.name}</p>
      </div>
      <Card className="p-6">
        <NewFindingForm auditId={id} />
      </Card>
    </div>
  );
}
