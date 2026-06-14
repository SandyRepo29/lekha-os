export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listAssessments } from "@/lib/services/privacy/privacy-service";
import {
  AssessmentStatusBadge,
  PrivacyRiskLevelBadge,
} from "@/components/privacy/privacy-badges";

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; riskLevel?: string }>;
}) {
  const session = await requireUser();
  if (session.demo || !session.org) {
    return <EmptyState icon={Shield} title="Privacy Assessments™" description="Connect Supabase to manage PIAs." />;
  }

  const params = await searchParams;
  const assessments = await listAssessments(session.org.id, {
    status: params.status,
    riskLevel: params.riskLevel,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Privacy Impact Assessments™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            PIAs for high-risk personal data processing activities
          </p>
        </div>
        <Link href="/dpdp-privacy/assessments/new">
          <Button>
            <Plus className="h-4 w-4" /> New Assessment
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["draft", "in_progress", "completed", "approved"].map((s) => (
          <Link
            key={s}
            href={`/dpdp-privacy/assessments?status=${s}`}
            className="rounded-full border border-[var(--color-line)] bg-white/[0.03] px-3 py-1 text-xs capitalize hover:bg-white/[0.07] transition-colors"
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      {assessments.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No assessments yet"
          description="Create a Privacy Impact Assessment for each high-risk data processing activity."
          action={
            <Link href="/dpdp-privacy/assessments/new">
              <Button>
                <Plus className="h-4 w-4" /> New Assessment
              </Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-xs text-[var(--color-ink-dim)]">
                  <th className="px-4 py-3 text-left font-medium">Assessment</th>
                  <th className="px-4 py-3 text-left font-medium">Risk Level</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Review Date</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-[var(--color-line)]/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dpdp-privacy/assessments/${a.id}`}
                        className="font-medium hover:text-indigo-400 transition-colors"
                      >
                        {a.title}
                      </Link>
                      {a.scope && (
                        <p className="text-xs text-[var(--color-ink-dim)] truncate max-w-[250px] mt-0.5">
                          {a.scope}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <PrivacyRiskLevelBadge level={a.riskLevel} />
                    </td>
                    <td className="px-4 py-3">
                      <AssessmentStatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">
                      {formatDate(a.reviewDate)}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">
                      {formatDate(a.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
