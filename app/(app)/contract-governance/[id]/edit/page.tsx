export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getContractDetail } from "@/lib/services/contract-governance/contract-service";
import { EditContractForm } from "@/components/contract-governance/edit-contract-form";

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;

  if (session.demo || !session.org) notFound();

  const contract = await getContractDetail(session.org.id, id);
  if (!contract) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1 text-sm text-[var(--color-ink-dim)]">
          <Link href="/contract-governance/library" className="hover:text-[var(--color-ink)]">Contracts</Link>
          <span>/</span>
          <Link href={`/contract-governance/${id}`} className="hover:text-[var(--color-ink)]">{contract.title}</Link>
          <span>/</span>
          <span>Edit</span>
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Edit Contract</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">Update contract details and metadata.</p>
      </div>

      <EditContractForm contract={contract} />
    </div>
  );
}
