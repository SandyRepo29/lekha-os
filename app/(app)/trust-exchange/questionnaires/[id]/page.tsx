export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getQuestionnaireDetail } from "@/backend/src/modules/trust-exchange/trust-exchange-service";
import { TrustQuestionnaireAnswerForm } from "@/components/trust-exchange/trust-questionnaire-answer-form";

export default async function TrustQuestionnaireDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireUser();
  if (!session.org) return null;

  const { questionnaire, answers } = await getQuestionnaireDetail(session.org.id, id);
  if (!questionnaire) notFound();

  const initialAnswers = (answers?.answers as Record<string, string> | undefined) ?? {};

  return (
    <div className="space-y-6">
      <div>
        <Link href="/trust-exchange/questionnaires"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Questionnaire Exchange™
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{questionnaire.title}</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#EEF2F7] text-[var(--color-ink-dim)] capitalize">{questionnaire.category}</span>
        </div>
        {questionnaire.description && (
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">{questionnaire.description}</p>
        )}
      </div>

      <TrustQuestionnaireAnswerForm
        questionnaireId={questionnaire.id}
        questionCount={questionnaire.questionCount}
        initialAnswers={initialAnswers}
        initialVisibility={answers?.visibility ?? "private"}
      />
    </div>
  );
}
