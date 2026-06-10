export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { listDocuments } from "@/lib/services/trust-exchange/trust-exchange-service";
import { TrustDocumentsClient } from "@/components/trust-exchange/trust-documents-client";

export default async function TrustDocumentsPage() {
  const session = await requireUser();
  if (!session.org) return null;
  const docs = await listDocuments(session.org.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Evidence Exchange™</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">
          Upload trust documents once. Share with multiple customers and partners.
        </p>
      </div>
      <TrustDocumentsClient docs={docs} />
    </div>
  );
}
