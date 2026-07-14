"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { createRiskAction } from "@/backend/src/modules/risk-lens/actions";
import { computeRiskScore, RISK_CATEGORY_LABELS, TREATMENT_STRATEGY_LABELS } from "@/backend/src/modules/risk-lens/risk-scoring";

const CATEGORIES = Object.entries(RISK_CATEGORY_LABELS);
const STRATEGIES = Object.entries(TREATMENT_STRATEGY_LABELS);
const SOURCES = [
  ["manual", "Manual"],
  ["vendor", "Vendor"],
  ["audit_finding", "Audit Finding"],
  ["compliance_gap", "Compliance Gap"],
  ["control_failure", "Control Failure"],
  ["policy_exception", "Policy Exception"],
];

export function NewRiskForm() {
  const [state, action, pending] = useActionState(createRiskAction, undefined);
  const [impact, setImpact] = useState(3);
  const [likelihood, setLikelihood] = useState(3);

  const { score, level } = computeRiskScore(impact, likelihood);

  const levelColors: Record<string, string> = {
    low: "text-emerald-400",
    moderate: "text-lime-400",
    high: "text-amber-400",
    critical: "text-red-400",
    severe: "text-purple-400",
  };

  return (
    <form action={action} className="space-y-5">
      {state?.error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">
          Risk Title <span className="text-red-400">*</span>
        </label>
        <input
          name="title"
          required
          className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60 focus:ring-1 focus:ring-[var(--color-blue)]/20"
          placeholder="e.g. Unauthorised access to customer data"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Description</label>
        <textarea
          name="description"
          rows={3}
          className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60 focus:ring-1 focus:ring-[var(--color-blue)]/20 resize-none"
          placeholder="Describe the risk scenario, context, and potential consequences..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Category</label>
          <select name="category" className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none">
            {CATEGORIES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Source</label>
          <select name="source" className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none">
            {SOURCES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Risk Matrix */}
      <div className="rounded-xl border border-[var(--color-line)] bg-white p-4 space-y-4">
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
              <span>Impact</span>
              <span className="text-[var(--color-ink)]">{impact} / 5</span>
            </label>
            <input
              type="range" name="impact" min={1} max={5} step={1}
              value={impact}
              onChange={(e) => setImpact(Number(e.target.value))}
              className="w-full accent-[var(--color-blue)]"
            />
            <div className="mt-1 flex justify-between text-xs text-[var(--color-ink-faint)]">
              <span>Minimal</span><span>Catastrophic</span>
            </div>
          </div>
          <div>
            <label className="mb-2 flex items-center justify-between text-sm font-medium text-[var(--color-ink-dim)]">
              <span>Likelihood</span>
              <span className="text-[var(--color-ink)]">{likelihood} / 5</span>
            </label>
            <input
              type="range" name="likelihood" min={1} max={5} step={1}
              value={likelihood}
              onChange={(e) => setLikelihood(Number(e.target.value))}
              className="w-full accent-[var(--color-blue)]"
            />
            <div className="mt-1 flex justify-between text-xs text-[var(--color-ink-faint)]">
              <span>Rare</span><span>Almost certain</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Treatment Strategy</label>
          <select name="treatmentStrategy" className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none">
            {STRATEGIES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Target Date</label>
          <input type="date" name="targetDate" className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Identified Date</label>
          <input type="date" name="identifiedDate" defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink-dim)]">Next Review Date</label>
          <input type="date" name="nextReviewDate" className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" variant="primary" size="md" disabled={pending}>
          {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : "Create Risk"}
        </Button>
      </div>
    </form>
  );
}

// ---- AI Risk Generator (embedded in new risk page) ----

export function AiRiskGenerator({ onGenerated }: { onGenerated: (data: Record<string, unknown>) => void }) {
  const [observation, setObservation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!observation.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { generateRiskFromObservationAction } = await import("@/backend/src/modules/risk-lens/actions");
      const result = await generateRiskFromObservationAction(observation);
      if (result?.ok && result.data) {
        onGenerated(result.data as Record<string, unknown>);
      } else {
        setError(result?.error ?? "Generation failed.");
      }
    } catch {
      setError("Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-blue)]/25 bg-[var(--color-blue)]/[0.04] p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-blue)]">
        <Sparkles className="h-4 w-4" /> AI Risk Generator
      </div>
      <p className="text-xs text-[var(--color-ink-dim)]">
        Describe an observation, finding, or issue — AI will generate a structured risk entry.
      </p>
      <textarea
        value={observation}
        onChange={(e) => setObservation(e.target.value)}
        rows={2}
        className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60 resize-none"
        placeholder="e.g. Vendor X has not provided updated SOC 2 report for 18 months..."
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <Button type="button" variant="ghost" size="sm" disabled={loading || !observation.trim()} onClick={handleGenerate}>
        {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</> : <><Sparkles className="h-3.5 w-3.5" /> Generate Risk</>}
      </Button>
    </div>
  );
}
