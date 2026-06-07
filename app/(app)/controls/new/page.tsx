export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { NewControlForm } from "@/components/controls/new-control-form";

export default async function NewControlPage() {
  await requireUser();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/controls/library" className="text-[var(--color-ink-dim)] hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">New Control</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">Add a control to your library</p>
        </div>
      </div>

      <Card className="p-6">
        <NewControlForm />
      </Card>
    </div>
  );
}
