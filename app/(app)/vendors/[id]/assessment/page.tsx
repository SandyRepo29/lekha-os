export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getVendor } from "@/lib/services/vendor-service";
import { startAssessment, submitAssessment } from "@/lib/assessments/actions";
import { listAssessments, getAssessment } from "@/lib/services/assessment-service";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { AssessmentForm } from "@/components/assessments/assessment-form";
import { AiAssessmentSummary } from "@/components/assessments/ai-assessment-summary";

export default async function AssessmentPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ a?: string }>;
}) {
  const { id } = await params;
  const { a: assessmentId } = await searchParams;
  const session = await requireUser();
  if (session.demo || !session.org) notFound();

  const vendor = await getVendor(session.org.id, id);
  if (!vendor) notFound();

  if (!assessmentId) {
    const result = await startAssessment(id);
    if (result.error) return <div className="p-8 text-red-400">{result.error}</div>;
    redirect(`/vendors/${id}/assessment?a=${result.id}`);
  }

  const assessment = await getAssessment(session.org.id, assessmentId);
  if (!assessment) notFound();

  const past = await listAssessments(session.org.id, id);
  const scoreColor = (assessment.assessment.score ?? 0) >= 70 ? "#10b981" : (assessment.assessment.score ?? 0) >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href={`/vendors/${id}`} className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">
        <ArrowLeft className="h-4 w-4" /> Back to {vendor.name}
      </Link>

      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Security Assessment</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">{vendor.name} · {assessment.assessment.title}</p>
      </div>

      {/* Past assessments */}
      {past.filter((a) => a.id !== assessmentId && a.status === "completed").length > 0 && (
        <Card className="p-5">
          <div className="text-sm font-semibold text-[var(--color-ink)] mb-3">Previous assessments</div>
          <div className="space-y-2">
            {past.filter((a) => a.status === "completed").map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-ink-dim)]">{a.title}</span>
                <span className="font-bold font-[family-name:var(--font-display)]"
                  style={{ color: (a.score ?? 0) >= 70 ? "#10b981" : (a.score ?? 0) >= 50 ? "#f59e0b" : "#ef4444" }}>
                  {a.score ?? "—"}/100
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {assessment.assessment.status === "completed" ? (
        <div className="space-y-5">
          {/* Score card */}
          <Card className="p-6 text-center">
            <div className="text-5xl font-bold font-[family-name:var(--font-display)] mb-2" style={{ color: scoreColor }}>
              {assessment.assessment.score}/100
            </div>
            <div className="text-[var(--color-ink-dim)] mb-4">Assessment completed</div>
            <Link href={`/vendors/${id}/assessment`} className="text-sm text-[var(--color-blue)] hover:underline">
              Start a new assessment
            </Link>
          </Card>

          {/* AI Assessment Summary */}
          <Card className="p-5">
            <AiAssessmentSummary
              assessmentId={assessmentId}
              vendorId={id}
              summary={(assessment.assessment as any).aiSummary ?? null}
              summaryAt={(assessment.assessment as any).aiSummaryAt ?? null}
              aiEnabled={isGeminiConfigured()}
            />
          </Card>
        </div>
      ) : (
        <AssessmentForm
          assessmentId={assessmentId}
          vendorId={id}
          existingResponses={assessment.responses}
          action={submitAssessment}
        />
      )}
    </div>
  );
}
