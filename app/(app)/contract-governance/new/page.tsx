export const dynamic = "force-dynamic";

import { FileSignature } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { NewContractForm } from "@/components/contract-governance/new-contract-form";

export default async function NewContractPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card className="p-8 text-center">
        <FileSignature className="h-8 w-8 mx-auto mb-3 text-[var(--color-ink-dim)]" />
        <p className="text-[var(--color-ink-dim)]">Not available in demo mode.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">New Contract</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">Add a contract to your governance portfolio</p>
      </div>
      <NewContractForm />
    </div>
  );
}
