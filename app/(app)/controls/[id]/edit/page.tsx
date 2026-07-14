export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { findControlById } from "@/backend/src/modules/control-center/control-center-repo";
import { EditControlForm } from "@/components/controls/edit-control-form";

export default async function EditControlPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;

  if (session.demo || !session.org) notFound();

  const control = await findControlById(session.org.id, id);
  if (!control) notFound();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href={`/controls/${id}`} className="text-[var(--color-ink-dim)] hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Edit Control</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5 font-mono">{control.controlRef}</p>
        </div>
      </div>

      <Card className="p-6">
        <EditControlForm control={control} />
      </Card>
    </div>
  );
}
