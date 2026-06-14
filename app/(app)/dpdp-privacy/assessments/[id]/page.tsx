export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getAssessmentDetail } from "@/lib/services/privacy/privacy-service";
import {
  AssessmentStatusBadge,
  PrivacyRiskLevelBadge,
} from "@/components/privacy/privacy-badges";

function Section({ title, content }: { title: string; content?: string | null }) {
  if (!content) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold text-[var(--color-ink-dim)] uppercase tracking-wider mb-2">
        {title}
      </h3>
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  );
}

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;
  if (session.demo || !session.org) return notFound();

  const assessment = await getAssessmentDetail(session.org.id, id);
  if (!assessment) return notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/dpdp-privacy/assessments"
          className="flex items-center gap-2 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Assessments
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {assessment.title}
            </h1>
            {assessment.scope && (
              <p className="text-sm text-[var(--color-ink-dim)] mt-1">{assessment.scope}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <PrivacyRiskLevelBadge level={assessment.riskLevel} />
            <AssessmentStatusBadge status={assessment.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5 space-y-3">
          <h2 className="font-semibold text-sm">Assessment Info</h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-xs text-[var(--color-ink-dim)]">Risk Level</dt>
              <dd><PrivacyRiskLevelBadge level={assessment.riskLevel} /></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-xs text-[var(--color-ink-dim)]">Status</dt>
              <dd><AssessmentStatusBadge status={assessment.status} /></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-xs text-[var(--color-ink-dim)]">Created</dt>
              <dd className="text-xs">{new Date(assessment.createdAt).toLocaleDateString("en-IN")}</dd>
            </div>
            {assessment.reviewDate && (
              <div className="flex justify-between">
                <dt className="text-xs text-[var(--color-ink-dim)]">Review Date</dt>
                <dd className="text-xs">{new Date(assessment.reviewDate).toLocaleDateString("en-IN")}</dd>
              </div>
            )}
          </dl>
        </Card>

        {assessment.purpose && (
          <Card className="p-5">
            <h2 className="font-semibold text-sm mb-3">Purpose</h2>
            <p className="text-sm text-[var(--color-ink-dim)]">{assessment.purpose}</p>
          </Card>
        )}
      </div>

      <Card className="p-5 space-y-6">
        <h2 className="font-semibold">Assessment Details</h2>
        <Section title="Data Types Involved" content={assessment.dataTypes} />
        <Section title="Privacy Risks Identified" content={assessment.risks} />
        <Section title="Proposed Mitigations" content={assessment.mitigations} />
        <Section title="Controls Required" content={assessment.controls} />
        <Section title="Residual Risk" content={assessment.residualRisk} />
        {!assessment.dataTypes && !assessment.risks && (
          <p className="text-sm text-[var(--color-ink-dim)]">
            No assessment details recorded yet. Use the AI Privacy Officer to generate a PIA from scope.
          </p>
        )}
      </Card>

      {assessment.aiSummary && (
        <Card className="p-5">
          <h2 className="font-semibold mb-3 text-indigo-400">AI Summary</h2>
          <p className="text-sm whitespace-pre-wrap leading-relaxed text-[var(--color-ink-dim)]">
            {assessment.aiSummary}
          </p>
        </Card>
      )}
    </div>
  );
}
