"use client";

import { useActionState, useState } from "react";
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ChevronRight, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { startRenewalAction, finaliseRenewalAction } from "@/lib/vendors/renewal-actions";
import type { RenewalActionState } from "@/lib/vendors/renewal-actions";
import type { RenewalRecommendation } from "@/lib/services/vendor-lifecycle/renewal-service";

const RECOMMENDATION_CONFIG: Record<RenewalRecommendation, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  Icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = {
  renew: {
    label: "Renew",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    Icon: CheckCircle2,
    description: "Vendor is performing well. Recommend straightforward renewal.",
  },
  renew_with_conditions: {
    label: "Renew with Conditions",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    Icon: AlertTriangle,
    description: "Renewal is advisable but with specific conditions or improvements required.",
  },
  renegotiate: {
    label: "Renegotiate",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    Icon: RefreshCw,
    description: "Contract terms need revision before renewal.",
  },
  suspend: {
    label: "Suspend",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    Icon: AlertTriangle,
    description: "Temporarily suspend engagement pending investigation or remediation.",
  },
  offboard: {
    label: "Offboard",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    Icon: TrendingDown,
    description: "Significant concerns. Recommend ending the vendor relationship.",
  },
};

interface RenewalAssessmentRow {
  id: string;
  assessment_date: string | Date;
  recommendation: RenewalRecommendation | null;
  confidence_score: number | null;
  notes?: string | null;
  ai_rationale?: string | null;
  conditions?: string[] | null;
  rationale?: string[] | null;
  conducted_by?: string | null;
  status: string;
}

interface Props {
  vendorId: string;
  vendorName: string;
  currentState: string;
  assessments: RenewalAssessmentRow[];
  trustScore?: number | null;
  complianceScore?: number | null;
  canEdit: boolean;
}

export function RenewalWorkspace({ vendorId, vendorName, currentState, assessments, trustScore, complianceScore, canEdit }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [startState, startAction, startPending] = useActionState<RenewalActionState | undefined>(startRenewalAction as any, undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [finalState, finalAction, finalPending] = useActionState<RenewalActionState | undefined>(finaliseRenewalAction as any, undefined);
  const [selectedDecision, setSelectedDecision] = useState<RenewalRecommendation | null>(null);

  const latestAssessment = assessments[0] ?? null;
  const recommendation = latestAssessment?.recommendation ?? startState?.recommendation ?? null;
  const recConfig = recommendation ? RECOMMENDATION_CONFIG[recommendation] : null;

  const inRenewalState = ["renewal_due", "renewing", "under_review"].includes(currentState);

  return (
    <div className="space-y-5">
      {/* Score summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Trust Score", value: trustScore, suffix: "/100", icon: TrendingUp },
          { label: "Compliance", value: complianceScore, suffix: "/100", icon: CheckCircle2 },
          { label: "Assessments", value: assessments.length, suffix: " total", icon: RefreshCw },
        ].map(({ label, value, suffix, icon: Icon }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-3.5 w-3.5 text-[var(--color-ink-faint)]" />
              <span className="text-xs text-[var(--color-ink-faint)]">{label}</span>
            </div>
            <span className="text-2xl font-bold text-[var(--color-ink)]">
              {value ?? "&#8212;"}
            </span>
            <span className="text-xs text-[var(--color-ink-faint)]">{suffix}</span>
          </Card>
        ))}
      </div>

      {/* Start renewal assessment */}
      {canEdit && !latestAssessment && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-[var(--color-blue)]" />
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">Start Renewal Assessment</h3>
          </div>
          <p className="mb-4 text-xs text-[var(--color-ink-faint)]">
            Run an AI-powered renewal assessment for <strong className="text-[var(--color-ink)]">{vendorName}</strong>.
            The system will analyse trust scores, risks, compliance, and contracts to generate a recommendation.
          </p>
          {startState?.error && <p className="mb-3 text-sm text-red-400">{startState.error}</p>}
          <form action={startAction}>
            <input type="hidden" name="vendorId" value={vendorId} />
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-[var(--color-ink-dim)]">Notes (optional)</label>
              <textarea name="notes" rows={2} placeholder="Any context for this renewal assessment..."
                className="w-full rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)] resize-none" />
            </div>
            <Button type="submit" disabled={startPending}>
              {startPending ? "Running assessment…" : "Run Renewal Assessment"}
            </Button>
          </form>
        </Card>
      )}

      {/* AI Recommendation */}
      {recConfig && recommendation && (
        <Card className={`border p-5 ${recConfig.borderColor} ${recConfig.bgColor}`}>
          <div className="flex items-start gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${recConfig.bgColor}`}>
              <recConfig.Icon className={`h-5 w-5 ${recConfig.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">AI Recommendation</span>
                {latestAssessment?.confidence_score && (
                  <span className="rounded-full bg-white/[0.06] border border-[var(--color-line)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-ink-dim)]">
                    {latestAssessment.confidence_score}% confidence
                  </span>
                )}
              </div>
              <p className={`text-lg font-bold ${recConfig.color}`}>{recConfig.label}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-faint)]">{recConfig.description}</p>

              {latestAssessment?.conditions && latestAssessment.conditions.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-[var(--color-ink-dim)] mb-1">Conditions:</p>
                  <ul className="space-y-1">
                    {latestAssessment.conditions.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-[var(--color-ink-faint)]">
                        <ChevronRight className="mt-0.5 h-3 w-3 shrink-0" /> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {latestAssessment?.rationale && latestAssessment.rationale.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-[var(--color-ink-dim)] mb-1">Rationale:</p>
                  <ul className="space-y-1">
                    {latestAssessment.rationale.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-[var(--color-ink-faint)]">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--color-ink-faint)]" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {latestAssessment?.ai_rationale && (
                <div className="mt-3 rounded-lg bg-white/[0.04] border border-[var(--color-line)] p-3">
                  <p className="text-xs font-semibold text-[var(--color-ink-dim)] mb-1">AI Analysis</p>
                  <p className="text-xs text-[var(--color-ink-faint)] leading-relaxed">{latestAssessment.ai_rationale}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Final decision */}
      {canEdit && inRenewalState && latestAssessment && latestAssessment.status !== "completed" && (
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-ink)]">Finalise Renewal Decision</h3>
          <p className="mb-4 text-xs text-[var(--color-ink-faint)]">
            Select the final decision. This will transition the vendor lifecycle accordingly.
          </p>
          {finalState?.error && <p className="mb-3 text-sm text-red-400">{finalState.error}</p>}

          <div className="grid gap-2 sm:grid-cols-2 mb-4">
            {(Object.keys(RECOMMENDATION_CONFIG) as RenewalRecommendation[]).map((r) => {
              const cfg = RECOMMENDATION_CONFIG[r];
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedDecision(selectedDecision === r ? null : r)}
                  className={[
                    "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all",
                    selectedDecision === r ? `${cfg.borderColor} ${cfg.bgColor}` : "border-[var(--color-line)] bg-white/[0.02] hover:bg-white/[0.04]",
                  ].join(" ")}
                >
                  <cfg.Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
                  <div>
                    <p className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedDecision && (
            <form action={finalAction}>
              <input type="hidden" name="vendorId" value={vendorId} />
              <input type="hidden" name="decision" value={selectedDecision} />
              <Button type="submit" disabled={finalPending}>
                {finalPending ? "Saving…" : `Confirm: ${RECOMMENDATION_CONFIG[selectedDecision].label}`}
              </Button>
            </form>
          )}
        </Card>
      )}

      {/* Assessment history */}
      {assessments.length > 0 && (
        <Card>
          <h3 className="px-5 pt-5 pb-3 text-sm font-semibold text-[var(--color-ink)]">Renewal History</h3>
          <div className="divide-y divide-[var(--color-line)]">
            {assessments.map((a) => {
              const cfg = a.recommendation ? RECOMMENDATION_CONFIG[a.recommendation] : null;
              return (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                  {cfg ? (
                    <cfg.Icon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
                  ) : (
                    <RefreshCw className="h-4 w-4 shrink-0 text-[var(--color-ink-faint)]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--color-ink)]">
                      {cfg ? <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span> : "Assessment"}
                      {a.confidence_score ? ` &#183; ${a.confidence_score}% confidence` : ""}
                    </p>
                    <p className="text-xs text-[var(--color-ink-faint)]">
                      {new Date(a.assessment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {a.conducted_by ? ` &#183; ${a.conducted_by}` : ""}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-ink-faint)]">{a.status}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
