"use client";

import { useActionState } from "react";
import { CheckCircle2, Circle, AlertTriangle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { completeOffboardingStepAction } from "@/lib/vendors/offboarding-actions";
import type { OffboardingActionState } from "@/lib/vendors/offboarding-actions";
import type { OffboardingStep } from "@/lib/services/vendor-lifecycle/offboarding-service";

const STEP_LABELS: Record<OffboardingStep, string> = {
  access_disabled:            "Disable vendor access",
  contracts_closed:           "Close or terminate contracts",
  documents_archived:         "Archive all documents",
  final_assessment_done:      "Complete final security assessment",
  evidence_verified:          "Verify and lock evidence records",
  open_tasks_closed:          "Close or reassign open tasks",
  lessons_captured:           "Capture lessons learned",
  archive_package_generated:  "Generate offboarding archive package",
  lifecycle_updated:          "Mark vendor as offboarded",
};

const STEP_DESCRIPTIONS: Record<OffboardingStep, string> = {
  access_disabled:            "Revoke vendor portal access, API keys, and shared credentials.",
  contracts_closed:           "Ensure all contracts are formally closed, terminated, or transferred.",
  documents_archived:         "Move all vendor documents to the long-term archive bucket.",
  final_assessment_done:      "Run a final security assessment to capture the vendor's exit posture.",
  evidence_verified:          "Confirm all compliance evidence is correctly attributed and immutable.",
  open_tasks_closed:          "Resolve or reassign any open tasks, CAPAs, or issues linked to this vendor.",
  lessons_captured:           "Document key findings, recommendations, and lessons for future vendor selections.",
  archive_package_generated:  "Create the final governance archive package for audit trail purposes.",
  lifecycle_updated:          "Complete the lifecycle transition to offboarded status.",
};

const STEP_ORDER: OffboardingStep[] = [
  "access_disabled",
  "contracts_closed",
  "documents_archived",
  "final_assessment_done",
  "evidence_verified",
  "open_tasks_closed",
  "lessons_captured",
  "archive_package_generated",
  "lifecycle_updated",
];

export interface OffboardingChecklistRow {
  step: OffboardingStep;
  completed: boolean;
  completed_at?: string | Date | null;
  completed_by?: string | null;
  notes?: string | null;
}

interface StepItemProps {
  vendorId: string;
  step: OffboardingStep;
  row: OffboardingChecklistRow | undefined;
  isNext: boolean;
  canEdit: boolean;
}

function StepItem({ vendorId, step, row, isNext, canEdit }: StepItemProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, formAction, pending] = useActionState<OffboardingActionState | undefined>(completeOffboardingStepAction as any, undefined);
  const done = row?.completed ?? false;

  return (
    <div className={[
      "rounded-xl border p-4 transition-all",
      done ? "border-emerald-500/20 bg-emerald-500/5" : isNext ? "border-[var(--color-blue)]/30 bg-[var(--color-blue)]/5" : "border-[var(--color-line)] bg-white/[0.01]",
    ].join(" ")}>
      <div className="flex items-start gap-3">
        <div className={[
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
          done ? "bg-emerald-500/20" : isNext ? "bg-[var(--color-blue)]/20" : "bg-[var(--color-line)]",
        ].join(" ")}>
          {done
            ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            : isNext
            ? <Clock className="h-3.5 w-3.5 text-[var(--color-blue)]" />
            : <Circle className="h-3.5 w-3.5 text-[var(--color-ink-faint)]" />
          }
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${done ? "text-emerald-400 line-through" : "text-[var(--color-ink)]"}`}>
            {STEP_LABELS[step]}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-ink-faint)]">{STEP_DESCRIPTIONS[step]}</p>

          {done && row && (
            <p className="mt-1.5 text-[10px] text-[var(--color-ink-faint)]">
              Completed by {row.completed_by ?? "Unknown"} &#183; {row.completed_at ? new Date(row.completed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
              {row.notes && <span className="ml-1 italic">&#8212; {row.notes}</span>}
            </p>
          )}

          {state?.error && <p className="mt-1 text-xs text-red-400">{state.error}</p>}

          {!done && isNext && canEdit && (
            <form action={formAction} className="mt-3 space-y-2">
              <input type="hidden" name="vendorId" value={vendorId} />
              <input type="hidden" name="step" value={step} />
              <input
                name="notes"
                placeholder="Optional notes…"
                className="w-full rounded-lg border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-1.5 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]"
              />
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Saving…" : "Mark complete"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  vendorId: string;
  checklist: OffboardingChecklistRow[];
  targetDate?: string | null;
  canEdit: boolean;
}

export function OffboardingChecklist({ vendorId, checklist, targetDate, canEdit }: Props) {
  const completedCount = checklist.filter((r) => r.completed).length;
  const totalSteps = STEP_ORDER.length;
  const pct = Math.round((completedCount / totalSteps) * 100);

  // The next incomplete step in order
  const checklistByStep = Object.fromEntries(checklist.map((r) => [r.step, r]));
  const nextStep = STEP_ORDER.find((s) => !checklistByStep[s]?.completed);

  const allDone = completedCount === totalSteps;

  return (
    <div className="space-y-5">
      {/* Progress header */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">Offboarding Progress</h3>
            {targetDate && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-ink-faint)]">
                <Clock className="h-3 w-3" />
                Target: {new Date(targetDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
          <span className={`text-2xl font-bold ${allDone ? "text-emerald-400" : "text-[var(--color-blue)]"}`}>
            {pct}%
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEF2F7]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-emerald-500" : "bg-[var(--color-blue)]"}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="mt-2 text-xs text-[var(--color-ink-faint)]">
          {completedCount} of {totalSteps} steps complete
        </p>

        {allDone && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <p className="text-sm font-medium text-emerald-400">
              Offboarding complete &#8212; vendor has been offboarded.
            </p>
          </div>
        )}

        {!allDone && completedCount === 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-400">Complete each step in order to finalize offboarding.</p>
          </div>
        )}
      </Card>

      {/* Step-by-step checklist */}
      <div className="space-y-2">
        {STEP_ORDER.map((step) => (
          <StepItem
            key={step}
            vendorId={vendorId}
            step={step}
            row={checklistByStep[step]}
            isNext={step === nextStep}
            canEdit={canEdit}
          />
        ))}
      </div>
    </div>
  );
}
