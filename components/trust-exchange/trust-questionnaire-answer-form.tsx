"use client";

import { useActionState, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Lock, Users, CheckCircle2 } from "lucide-react";
import { saveAnswersAction } from "@/backend/src/modules/trust-exchange/actions";

type Props = {
  questionnaireId: string;
  questionCount: number;
  initialAnswers: Record<string, string>;
  initialVisibility: string;
};

const VISIBILITY_OPTIONS: { value: string; label: string; icon: typeof Lock }[] = [
  { value: "private", label: "Private", icon: Lock },
  { value: "network", label: "Network", icon: Users },
  { value: "public", label: "Public", icon: Globe },
];

export function TrustQuestionnaireAnswerForm({
  questionnaireId,
  questionCount,
  initialAnswers,
  initialVisibility,
}: Props) {
  // Answers are stored as an opaque q1..qN JSON map; build the ordered slot list
  // from the questionnaire's question count plus any pre-existing keys.
  const count = Math.max(questionCount, Object.keys(initialAnswers).length, 1);
  const keys = Array.from({ length: count }, (_, i) => `q${i + 1}`);
  for (const k of Object.keys(initialAnswers)) if (!keys.includes(k)) keys.push(k);

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    keys.forEach((k) => { base[k] = initialAnswers[k] ?? ""; });
    return base;
  });
  const [visibility, setVisibility] = useState(initialVisibility || "private");
  const [state, formAction, pending] = useActionState<{ ok?: boolean; error?: string } | null, FormData>(saveAnswersAction, null);

  const filled = Object.values(answers).filter((v) => v.trim() !== "").length;
  const pct = keys.length ? Math.round((filled / keys.length) * 100) : 0;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="questionnaireId" value={questionnaireId} />
      <input type="hidden" name="answers" value={JSON.stringify(answers)} />
      <input type="hidden" name="visibility" value={visibility} />

      {/* Completion + visibility */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-[180px] flex-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[var(--color-ink-dim)]">Completion</span>
            <span className="font-medium">{pct}% · {filled}/{keys.length} answered</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EEF2F7]">
            <div className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-[var(--color-line)] p-1">
          {VISIBILITY_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setVisibility(value)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                visibility === value ? "bg-[#EEF2F7] text-[var(--color-ink)]" : "text-[var(--color-ink-dim)] hover:bg-[#F8F9FB]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </Card>

      {/* Answer slots */}
      <div className="space-y-3">
        {keys.map((k, i) => (
          <Card key={k} className="p-4">
            <label htmlFor={`ans-${k}`} className="text-sm font-medium">Question {i + 1}</label>
            <textarea
              id={`ans-${k}`}
              value={answers[k]}
              onChange={(e) => setAnswers((a) => ({ ...a, [k]: e.target.value }))}
              rows={2}
              placeholder="Enter your answer…"
              className="mt-2 w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]"
            />
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save answers"}
        </Button>
        {state?.ok && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" /> Saved
          </span>
        )}
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
