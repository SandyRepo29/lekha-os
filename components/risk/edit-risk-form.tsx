"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { updateRiskAction } from "@/lib/risk/actions";
import { computeRiskScore, RISK_CATEGORY_LABELS, TREATMENT_STRATEGY_LABELS, RISK_STATUS_LABELS } from "@/lib/services/risk-scoring";
import type { RiskWithOwner } from "@/lib/services/risk/risk-service";

const CATEGORIES = Object.entries(RISK_CATEGORY_LABELS);
const STRATEGIES = Object.entries(TREATMENT_STRATEGY_LABELS);
const STATUSES = Object.entries(RISK_STATUS_LABELS);

export function EditRiskForm({ risk }: { risk: RiskWithOwner }) {
  const boundAction = (_prev: unknown, formData: FormData) => updateRiskAction(risk.id, formData);
  const [state, action, pending] = useActionState(boundAction, undefined);
  const [impact, setImpact] = useState(risk.impact);
  const [likelihood, setLikelihood] = useState(risk.likelihood);

  const { score, level } = computeRiskScore(impact, likelihood);

  const levelColors: Record<string, string> = {
    low: "text-emerald-400", moderate: "text-lime-400", high: "text-amber-400",
    critical: "text-red-400", severe: "text-purple-400",
  };

  return (
    <form action={action} className="space-y-5">
      {state?.error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-3 text-sm text-red-400">{state.error}</div>
      )}
      {state?.ok && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-3 text-sm text-emerald-400">Saved.</div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Risk Title</label>
        <input name="title" required defaultValue={risk.title} className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Description</label>
        <textarea name="description" rows={3} defaultValue={risk.description ?? ""} className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60 resize-none" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Category</label>
          <select name="category" defaultValue={risk.category} className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none">
            {CATEGORIES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Status</label>
          <select name="status" defaultValue={risk.status} className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none">
            {STATUSES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Risk Matrix */}
      <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Risk Score Matrix</h3>
          <div className="flex items-center gap-2">
            <span className={`font-[family-name:var(--font-display)] text-2xl font-bold ${levelColors[level]}`}>{score}</span>
            <span className={`text-sm font-medium ${levelColors[level]}`}>/ 25 · {level.charAt(0).toUpperCase() + level.slice(1)}</span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 flex items-center justify-between text-sm font-medium text-[var(--color-ink-dim)]">
              <span>Impact</span><span className="text-[var(--color-ink)]">{impact} / 5</span>
            </label>
            <input type="range" name="impact" min={1} max={5} step={1} value={impact} onChange={(e) => setImpact(Number(e.target.value))} className="w-full accent-[var(--color-blue)]" />
          </div>
          <div>
            <label className="mb-2 flex items-center justify-between text-sm font-medium text-[var(--color-ink-dim)]">
              <span>Likelihood</span><span className="text-[var(--color-ink)]">{likelihood} / 5</span>
            </label>
            <input type="range" name="likelihood" min={1} max={5} step={1} value={likelihood} onChange={(e) => setLikelihood(Number(e.target.value))} className="w-full accent-[var(--color-blue)]" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Treatment Strategy</label>
          <select name="treatmentStrategy" defaultValue={risk.treatmentStrategy ?? "mitigate"} className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none">
            {STRATEGIES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Target Date</label>
          <input type="date" name="targetDate" defaultValue={risk.targetDate ?? ""} className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-sm focus:outline-none" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Next Review Date</label>
        <input type="date" name="nextReviewDate" defaultValue={risk.nextReviewDate ?? ""} className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-sm focus:outline-none" />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" variant="primary" size="md" disabled={pending}>
          {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
