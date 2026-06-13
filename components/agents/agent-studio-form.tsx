"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Loader2, CheckCircle } from "lucide-react";

interface Option { value: string; label: string; desc: string; }

interface Props {
  agentTypes: Option[];
  executionModes: Option[];
  triggerTypes: Option[];
  approvalModes: Option[];
  createAction: (formData: FormData) => Promise<{ data?: unknown; error?: string }>;
}

export function AgentStudioForm({ agentTypes, executionModes, triggerTypes, approvalModes, createAction }: Props) {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [selectedType, setSelectedType] = useState(agentTypes[0].value);
  const [selectedMode, setSelectedMode] = useState(executionModes[1].value); // supervised default
  const [selectedTrigger, setSelectedTrigger] = useState(triggerTypes[0].value);
  const [selectedApproval, setSelectedApproval] = useState(approvalModes[0].value);

  async function formAction(fd: FormData) {
    const result = await createAction(fd);
    if (!result?.error) {
      setSuccess(true);
      setTimeout(() => router.push("/agents/registry"), 1500);
    }
    return result;
  }

  const [state, action, isPending] = useActionState(
    async (_prev: unknown, fd: FormData) => formAction(fd),
    null
  );

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] py-16">
        <CheckCircle className="h-12 w-12 text-emerald-400" />
        <p className="font-semibold text-emerald-300">Agent created! Redirecting to Registry…</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      {(state as { error?: string } | null)?.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/[0.06] p-3 text-sm text-red-400">
          {(state as { error: string }).error}
        </div>
      )}

      {/* Basic info */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5 space-y-4">
        <h3 className="font-semibold text-sm">Basic Information</h3>
        <div>
          <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1.5">Agent Name *</label>
          <input name="name" required placeholder="e.g. My Risk Sentinel" className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-4 py-2.5 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-blue)]/50" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1.5">Description</label>
          <input name="description" placeholder="What does this agent do?" className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-4 py-2.5 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-blue)]/50" />
        </div>
      </div>

      {/* Agent type */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h3 className="mb-3 font-semibold text-sm">Agent Type</h3>
        <input type="hidden" name="agentType" value={selectedType} />
        <div className="grid gap-2 sm:grid-cols-2">
          {agentTypes.map(t => (
            <button
              type="button"
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                selectedType === t.value
                  ? "border-[var(--color-blue)]/50 bg-[var(--color-blue)]/[0.08]"
                  : "border-[var(--color-line)] bg-white/[0.02] hover:border-[var(--color-blue)]/30"
              }`}
            >
              <div className="font-medium text-xs">{t.label}</div>
              <div className="mt-0.5 text-[11px] text-[var(--color-ink-faint)]">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Execution + trigger */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <h3 className="mb-3 font-semibold text-sm">Execution Mode</h3>
          <input type="hidden" name="executionMode" value={selectedMode} />
          <div className="space-y-2">
            {executionModes.map(m => (
              <button
                type="button"
                key={m.value}
                onClick={() => setSelectedMode(m.value)}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  selectedMode === m.value
                    ? "border-[var(--color-blue)]/50 bg-[var(--color-blue)]/[0.08]"
                    : "border-[var(--color-line)] bg-white/[0.02] hover:border-[var(--color-blue)]/30"
                }`}
              >
                <div className="font-medium text-xs">{m.label}</div>
                <div className="mt-0.5 text-[11px] text-[var(--color-ink-faint)]">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <h3 className="mb-3 font-semibold text-sm">Trigger</h3>
          <input type="hidden" name="triggerType" value={selectedTrigger} />
          <div className="space-y-2">
            {triggerTypes.map(t => (
              <button
                type="button"
                key={t.value}
                onClick={() => setSelectedTrigger(t.value)}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  selectedTrigger === t.value
                    ? "border-[var(--color-blue)]/50 bg-[var(--color-blue)]/[0.08]"
                    : "border-[var(--color-line)] bg-white/[0.02] hover:border-[var(--color-blue)]/30"
                }`}
              >
                <div className="font-medium text-xs">{t.label}</div>
                <div className="mt-0.5 text-[11px] text-[var(--color-ink-faint)]">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule (if scheduled) */}
      {selectedTrigger === "scheduled" && (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <h3 className="mb-3 font-semibold text-sm">Schedule</h3>
          <select name="schedule" className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-blue)]/50">
            <option value="every_15min">Every 15 minutes</option>
            <option value="every_hour">Every hour</option>
            <option value="every_6h">Every 6 hours</option>
            <option value="daily">Daily at 9am</option>
            <option value="weekly">Weekly on Monday</option>
          </select>
        </div>
      )}

      {/* Approval mode */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h3 className="mb-3 font-semibold text-sm">Approval Mode</h3>
        <input type="hidden" name="approvalMode" value={selectedApproval} />
        <div className="grid gap-2 sm:grid-cols-3">
          {approvalModes.map(m => (
            <button
              type="button"
              key={m.value}
              onClick={() => setSelectedApproval(m.value)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                selectedApproval === m.value
                  ? "border-[var(--color-blue)]/50 bg-[var(--color-blue)]/[0.08]"
                  : "border-[var(--color-line)] bg-white/[0.02] hover:border-[var(--color-blue)]/30"
              }`}
            >
              <div className="font-medium text-xs">{m.label}</div>
              <div className="mt-0.5 text-[11px] text-[var(--color-ink-faint)]">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h3 className="mb-1 font-semibold text-sm">Agent Instructions (Prompt)</h3>
        <p className="mb-3 text-xs text-[var(--color-ink-dim)]">Describe what this agent should focus on, what to look for, and how to prioritize findings.</p>
        <textarea
          name="prompt"
          rows={5}
          placeholder="e.g. Monitor all open risks every 6 hours. Flag any critical risks that have been open for more than 30 days without a treatment plan. Escalate vendors with trust score below 60 for immediate review..."
          className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-4 py-3 text-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-blue)]/50 resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <a href="/agents/registry" className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-5 py-2.5 text-sm font-medium hover:bg-white/[0.07] transition-colors">
          Cancel
        </a>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl grad-brand px-5 py-2.5 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
          {isPending ? "Creating…" : "Create Agent"}
        </button>
      </div>
    </form>
  );
}
