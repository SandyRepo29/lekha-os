export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit, Sparkles, ShieldCheck, Calendar, User, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getRisk } from "@/lib/services/risk/risk-service";
import { getCachedNarrative } from "@/lib/services/risk/ai-risk-service";
import { db } from "@/lib/db";
import { count, eq } from "drizzle-orm";
import { riskVendors, riskControls, riskFindings, riskPolicies } from "@/lib/db/schema";
import { RiskStatusBadge, RiskScoreBadge, RiskCategoryBadge, TreatmentStatusBadge } from "@/components/risk/risk-status-badge";
import { formatDate, isDueSoon, isOverdue } from "@/components/risk/risk-ui";
import { RiskDetailActions } from "@/components/risk/risk-detail-actions";
import { RISK_CATEGORY_LABELS, RISK_SOURCE_LABELS, TREATMENT_STRATEGY_LABELS, computeRiskScore } from "@/lib/services/risk-scoring";
import { cn } from "@/lib/utils";

export default async function RiskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireUser();
  if (!session.org) return notFound();

  const [risk, aiNarrative, vendorCountResult, controlCountResult, findingCountResult, policyCountResult] = await Promise.all([
    getRisk(session.org.id, id),
    getCachedNarrative(session.org.id, id),
    db.select({ count: count() }).from(riskVendors).where(eq(riskVendors.riskId, id)),
    db.select({ count: count() }).from(riskControls).where(eq(riskControls.riskId, id)),
    db.select({ count: count() }).from(riskFindings).where(eq(riskFindings.riskId, id)),
    db.select({ count: count() }).from(riskPolicies).where(eq(riskPolicies.riskId, id)),
  ]);

  const linkedVendorCount = vendorCountResult[0]?.count ?? 0;
  const linkedControlCount = controlCountResult[0]?.count ?? 0;
  const linkedFindingCount = findingCountResult[0]?.count ?? 0;
  const linkedPolicyCount = policyCountResult[0]?.count ?? 0;

  if (!risk) return notFound();

  const inherent = computeRiskScore(risk.impact, risk.likelihood);
  const residual = risk.residualScore != null ? computeRiskScore(
    Math.ceil(risk.residualScore / 5),
    Math.ceil(risk.residualScore / 5)
  ) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/risks/list" className="mt-1 text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">{risk.title}</h1>
              <RiskStatusBadge status={risk.status} />
              <RiskScoreBadge score={risk.inherentScore} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <RiskCategoryBadge category={risk.category} />
              <span className="text-xs text-[var(--color-ink-faint)]">
                Source: {RISK_SOURCE_LABELS[risk.source] ?? risk.source}
              </span>
              {risk.identifiedDate && (
                <span className="text-xs text-[var(--color-ink-faint)]">
                  Identified {formatDate(risk.identifiedDate)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/risks/${id}/edit`}>
            <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /> Edit</Button>
          </Link>
          <RiskDetailActions riskId={id} currentStatus={risk.status} riskTitle={risk.title} />
        </div>
      </div>

      {/* AI Narrative — full-width panel, most valuable insight first */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--color-blue)]" />
            <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">AI Risk Narrative</h2>
          </div>
          <RiskNarrativeAction riskId={id} />
        </div>
        {aiNarrative ? (
          <div>
            <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">{aiNarrative.content}</p>
            <p className="mt-2 text-xs text-[var(--color-ink-faint)]">Generated {formatDate(aiNarrative.generatedAt.toISOString())}</p>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-ink-faint)] italic">Click "Generate" to create an AI narrative for this risk.</p>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2/3 */}
        <div className="space-y-5 lg:col-span-2">
          {/* Overview */}
          <Card className="p-5 space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">Overview</h2>
            {risk.description ? (
              <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">{risk.description}</p>
            ) : (
              <p className="text-sm text-[var(--color-ink-faint)] italic">No description provided.</p>
            )}

            {/* Score matrix */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--color-line)] bg-white p-3 text-center">
                <p className="text-xs text-[var(--color-ink-faint)] mb-1">Impact</p>
                <p className="font-[family-name:var(--font-display)] text-xl font-bold">{risk.impact}</p>
                <p className="text-xs text-[var(--color-ink-faint)]">/ 5</p>
              </div>
              <div className="rounded-xl border border-[var(--color-line)] bg-white p-3 text-center">
                <p className="text-xs text-[var(--color-ink-faint)] mb-1">Likelihood</p>
                <p className="font-[family-name:var(--font-display)] text-xl font-bold">{risk.likelihood}</p>
                <p className="text-xs text-[var(--color-ink-faint)]">/ 5</p>
              </div>
              <div className="rounded-xl border border-[var(--color-line)] bg-white p-3 text-center">
                <p className="text-xs text-[var(--color-ink-faint)] mb-1">Inherent Score</p>
                <p className={cn("font-[family-name:var(--font-display)] text-xl font-bold")} style={{ color: inherent.color }}>
                  {inherent.score}
                </p>
                <p className="text-xs capitalize" style={{ color: inherent.color }}>{inherent.level}</p>
              </div>
            </div>
          </Card>

          {/* Treatment Plan */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">
                Treatment Plan
                {risk.treatments.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-[var(--color-ink-faint)]">
                    {risk.treatmentProgress}% complete
                  </span>
                )}
              </h2>
              <AddTreatmentAction riskId={id} />
            </div>

            {risk.treatments.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-faint)] italic">No treatment actions yet.</p>
            ) : (
              <div className="space-y-2">
                {risk.treatments.map((t) => (
                  <div key={t.id} className="flex items-start justify-between gap-3 rounded-lg border border-[var(--color-line)] bg-white p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{t.action}</p>
                      {t.description && <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{t.description}</p>}
                      {t.targetDate && (
                        <p className={cn("mt-1 text-xs", isOverdue(t.targetDate) && t.status !== "completed" ? "text-red-400" : "text-[var(--color-ink-faint)]")}>
                          Due {formatDate(t.targetDate)}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <TreatmentStatusBadge status={t.status} />
                      {t.status !== "completed" && (
                        <CompleteTreatmentAction riskId={id} treatmentId={t.id} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Review History */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">Review History</h2>
              <AddReviewAction riskId={id} />
            </div>
            {risk.reviews.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-faint)] italic">No reviews yet.</p>
            ) : (
              <div className="space-y-2">
                {risk.reviews.map((r) => (
                  <div key={r.id} className="rounded-lg border border-[var(--color-line)] bg-white p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--color-ink-dim)]">{formatDate(r.reviewDate)}</span>
                      <span className="rounded-full bg-[#F8F9FB] px-2 py-0.5 text-xs capitalize">{r.outcome.replace(/_/g, " ")}</span>
                    </div>
                    {r.notes && <p className="mt-1 text-xs text-[var(--color-ink-faint)]">{r.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">Details</h3>
            <Detail icon={User} label="Owner" value={risk.ownerName ?? "Unassigned"} />
            <Detail icon={Tag} label="Treatment" value={TREATMENT_STRATEGY_LABELS[risk.treatmentStrategy ?? ""] ?? "—"} />
            <Detail icon={Calendar} label="Target Date" value={formatDate(risk.targetDate)} warn={isOverdue(risk.targetDate) && !["closed","archived"].includes(risk.status)} />
            <Detail icon={Calendar} label="Next Review" value={formatDate(risk.nextReviewDate)} warn={isOverdue(risk.nextReviewDate) && !["closed","archived"].includes(risk.status)} />
            <Detail icon={Calendar} label="Last Reviewed" value={formatDate(risk.lastReviewedDate)} />
            <Detail icon={ShieldCheck} label="Residual Score" value={risk.residualScore != null ? String(risk.residualScore) : "Not set"} />
          </Card>

          {risk.sourceFindingId && (
            <Card className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-faint)] mb-2">Linked Finding</h3>
              <Link href={`/audits/findings`} className="text-xs text-[var(--color-blue)] hover:underline">
                View audit finding →
              </Link>
            </Card>
          )}
        </div>
      </div>

      {/* Connected Entities */}
      <section className="rounded-2xl border border-[var(--color-line)] bg-white p-5 space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">Connected Entities</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href="/vendors" className="rounded-xl border border-[var(--color-line)] p-3 hover:bg-[#F8F9FB] transition-colors">
            <div className={`text-2xl font-bold ${linkedVendorCount > 0 ? "text-[var(--color-ink)]" : "text-[var(--color-ink-dim)]"}`}>{linkedVendorCount}</div>
            <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">Linked Vendors</div>
          </Link>
          <Link href="/controls/library" className="rounded-xl border border-[var(--color-line)] p-3 hover:bg-[#F8F9FB] transition-colors">
            <div className={`text-2xl font-bold ${linkedControlCount > 0 ? "text-[var(--color-ink)]" : "text-[var(--color-ink-dim)]"}`}>{linkedControlCount}</div>
            <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">Linked Controls</div>
          </Link>
          <Link href="/audits/findings" className="rounded-xl border border-[var(--color-line)] p-3 hover:bg-[#F8F9FB] transition-colors">
            <div className={`text-2xl font-bold ${linkedFindingCount > 0 ? "text-[var(--color-ink)]" : "text-[var(--color-ink-dim)]"}`}>{linkedFindingCount}</div>
            <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">Linked Findings</div>
          </Link>
          <Link href="/compliance/policies" className="rounded-xl border border-[var(--color-line)] p-3 hover:bg-[#F8F9FB] transition-colors">
            <div className={`text-2xl font-bold ${linkedPolicyCount > 0 ? "text-[var(--color-ink)]" : "text-[var(--color-ink-dim)]"}`}>{linkedPolicyCount}</div>
            <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">Linked Policies</div>
          </Link>
        </div>
        <p className="text-xs text-[var(--color-ink-dim)]">
          View the full dependency map in{" "}
          <Link href="/trust-intelligence/trust-graph" className="text-[var(--color-blue)] hover:underline">
            Trust Graph&#8482;
          </Link>
        </p>
      </section>
    </div>
  );
}

function Detail({ icon: Icon, label, value, warn }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-ink-faint)]" />
      <div>
        <p className="text-xs text-[var(--color-ink-faint)]">{label}</p>
        <p className={cn("text-sm", warn ? "text-red-400" : "text-[var(--color-ink-dim)]")}>{value}</p>
      </div>
    </div>
  );
}

// ---- Inline action components (client) ----
import { RiskNarrativeAction, AddTreatmentAction, CompleteTreatmentAction, AddReviewAction } from "@/components/risk/risk-detail-actions";
