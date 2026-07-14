export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { listQuestionnaires, listAnswers } from "@/backend/src/modules/trust-exchange/trust-exchange-service";
import { TrustQuestionnairesClient } from "@/components/trust-exchange/trust-questionnaires-client";

export default async function TrustQuestionnairesPage() {
  const session = await requireUser();
  if (!session.org) return null;
  const orgId = session.org.id;

  const [questionnaires, answers] = await Promise.all([
    listQuestionnaires(orgId),
    listAnswers(orgId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Questionnaire Exchange™</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">
          Answer security questionnaires once. Share reusable answers with multiple customers.
        </p>
      </div>
      <TrustQuestionnairesClient questionnaires={questionnaires} answers={answers} />
    </div>
  );
}
