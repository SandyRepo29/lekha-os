"use client";

import { useActionState } from "react";
import { STANDARD_QUESTIONS, groupByCategory } from "@/lib/constants/assessment-questions";
import { Button } from "@/components/ui/button";
import type { AssessmentResponse } from "@/lib/db/schema";
import type { AssessmentState } from "@/backend/src/modules/vendor-hub/assessments-actions";

const ANSWER_OPTIONS = [
  { value: "yes",     label: "Yes",     color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/[0.08]" },
  { value: "partial", label: "Partial", color: "text-amber-400 border-amber-500/30 bg-amber-500/[0.08]" },
  { value: "no",      label: "No",      color: "text-red-400 border-red-500/30 bg-red-500/[0.08]" },
  { value: "na",      label: "N/A",     color: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-white" },
];

type Props = {
  assessmentId: string;
  vendorId: string;
  existingResponses: AssessmentResponse[];
  action: (prev: AssessmentState, fd: FormData) => Promise<AssessmentState>;
};

export function AssessmentForm({ assessmentId, vendorId, existingResponses, action }: Props) {
  const [state, formAction, pending] = useActionState<AssessmentState, FormData>(action, undefined);
  const existingMap = new Map(existingResponses.map((r) => [r.questionKey, r.answer ?? ""]));
  const groups = groupByCategory(STANDARD_QUESTIONS);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="assessmentId" value={assessmentId} />
      <input type="hidden" name="vendorId" value={vendorId} />

      {Array.from(groups.entries()).map(([category, questions]) => (
        <div key={category} className="rounded-2xl border border-[var(--color-line)] bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--color-line)] bg-white">
            <h3 className="font-semibold text-sm text-[var(--color-ink)]">{category}</h3>
          </div>
          <div className="divide-y divide-[var(--color-line)]">
            {questions.map((q) => {
              const current = existingMap.get(q.key) ?? "";
              return (
                <div key={q.key} className="px-5 py-4 space-y-2.5">
                  <p className="text-sm text-[var(--color-ink)] leading-relaxed">{q.question}</p>
                  <div className="flex flex-wrap gap-2">
                    {ANSWER_OPTIONS.map((opt) => (
                      <label key={opt.value} className="cursor-pointer">
                        <input type="radio" name={`q_${q.key}`} value={opt.value} defaultChecked={current === opt.value} className="sr-only" />
                        <span className={`inline-block text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-offset-1 ${opt.color}`}>
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {state?.error && <p className="text-sm text-red-400 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-400">Progress saved.</p>}

      <div className="flex gap-3">
        <Button type="submit" name="complete" value="1" variant="primary" disabled={pending}>
          {pending ? "Submitting…" : "Complete assessment"}
        </Button>
        <Button type="submit" variant="subtle" disabled={pending}>
          Save draft
        </Button>
      </div>
    </form>
  );
}
