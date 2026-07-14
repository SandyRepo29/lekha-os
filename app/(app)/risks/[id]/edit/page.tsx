export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getRisk } from "@/backend/src/modules/risk-lens/risk-service";
import { EditRiskForm } from "@/components/risk/edit-risk-form";

export default async function EditRiskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireUser();
  if (!session.org) return notFound();

  const risk = await getRisk(session.org.id, id);
  if (!risk) return notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/risks/${id}`} className="text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Edit Risk</h1>
          <p className="text-xs text-[var(--color-ink-faint)] truncate max-w-xs">{risk.title}</p>
        </div>
      </div>
      <Card className="p-6">
        <EditRiskForm risk={risk} />
      </Card>
    </div>
  );
}
