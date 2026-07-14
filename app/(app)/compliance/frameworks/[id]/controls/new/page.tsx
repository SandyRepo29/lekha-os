export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getFramework } from "@/backend/src/modules/compliance/framework-service";
import { NewControlForm } from "@/components/compliance/new-control-form";

export default async function NewControlPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireUser();
  if (session.demo || !session.org) notFound();

  const fw = await getFramework(session.org.id, id);
  if (!fw) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/compliance/frameworks/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {fw.name}
      </Link>

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Add control</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">
          Add a control to <span className="text-[var(--color-ink)]">{fw.name}</span>
        </p>
      </div>

      <Card className="p-6">
        <NewControlForm frameworkId={id} />
      </Card>
    </div>
  );
}
