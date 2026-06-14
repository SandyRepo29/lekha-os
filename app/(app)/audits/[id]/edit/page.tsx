export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getAudit } from "@/lib/services/audit/audit-service";
import { listFrameworks } from "@/lib/services/compliance/framework-service";
import { EditAuditForm } from "@/components/audit/edit-audit-form";

export default async function EditAuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;
  if (session.demo || !session.org) notFound();

  const [audit, fws] = await Promise.all([
    getAudit(session.org.id, id),
    listFrameworks(session.org.id),
  ]);
  if (!audit) notFound();

  const frameworks = fws.map((f) => ({ id: f.id, name: f.name }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/audits/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to audit
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
        Edit Audit
      </h1>
      <Card className="p-6">
        <EditAuditForm audit={audit} frameworks={frameworks} />
      </Card>
    </div>
  );
}
