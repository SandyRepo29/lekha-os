"use client";

import { useActionState, useState } from "react";
import { createFindingAction, generateFindingFromObservationAction } from "@/lib/audit/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sparkles } from "lucide-react";

const SEVERITIES = ["critical", "high", "medium", "low"];

export function NewFindingForm({ auditId }: { auditId: string }) {
  const [state, action, pending] = useActionState(createFindingAction, undefined);
  const [observation, setObservation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFields, setAiFields] = useState<{
    title: string;
    severity: string;
    description: string;
    recommendation: string;
  } | null>(null);

  async function handleAiGenerate() {
    if (!observation.trim()) return;
    setAiLoading(true);
    const res = await generateFindingFromObservationAction(observation);
    if (!("error" in res)) setAiFields(res);
    setAiLoading(false);
  }

  return (
    <form action={action} className="space-y-5">
      {state?.error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <input type="hidden" name="auditId" value={auditId} />

      {/* AI assist */}
      <div className="rounded-xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/5 p-4 space-y-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-blue)]">
          <Sparkles className="h-3.5 w-3.5" /> AI Finding Generator
        </p>
        <textarea
          rows={2}
          placeholder="Describe your observation and let AI structure it as a finding..."
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-line)] bg-white px-4 py-2 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]/50 resize-none"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={aiLoading || !observation.trim()}
          onClick={handleAiGenerate}
        >
          {aiLoading ? "Generating…" : "Generate Finding"}
        </Button>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Title <span className="text-red-400">*</span></label>
        <Input
          name="title"
          required
          defaultValue={aiFields?.title ?? ""}
          key={aiFields?.title}
          placeholder="e.g. Missing MFA for privileged accounts"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Severity</label>
          <Select name="severity" defaultValue={aiFields?.severity ?? "medium"} key={aiFields?.severity}>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={aiFields?.description ?? ""}
          key={`desc-${aiFields?.description}`}
          className="w-full rounded-xl border border-[var(--color-line)] bg-white px-4 py-2 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]/50 resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Recommendation</label>
        <textarea
          name="recommendation"
          rows={2}
          defaultValue={aiFields?.recommendation ?? ""}
          key={`rec-${aiFields?.recommendation}`}
          className="w-full rounded-xl border border-[var(--color-line)] bg-white px-4 py-2 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]/50 resize-none"
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" size="md" disabled={pending}>
          {pending ? "Adding…" : "Add Finding"}
        </Button>
      </div>
    </form>
  );
}
