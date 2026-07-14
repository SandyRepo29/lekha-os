"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleAutomationRuleAction, deleteAutomationRuleAction, createAutomationRuleAction } from "@/backend/src/modules/toe/actions";
import { Power, Trash2 } from "lucide-react";

export function ToggleRuleButton({ ruleId, active }: { ruleId: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => {
        await toggleAutomationRuleAction(ruleId, !active);
        router.refresh();
      })}
      title={active ? "Pause rule" : "Activate rule"}
      className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
        active
          ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
      }`}
    >
      <Power className="h-3.5 w-3.5" />
    </button>
  );
}

export function DeleteRuleButton({ ruleId }: { ruleId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this automation rule?")) return;
        startTransition(async () => {
          await deleteAutomationRuleAction(ruleId);
          router.refresh();
        });
      }}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

const ACTION_TYPES = [
  { value: "create_task", label: "Create Task" },
  { value: "create_issue", label: "Create Issue" },
  { value: "send_notification", label: "Send Notification" },
  { value: "trigger_workflow", label: "Trigger Workflow" },
  { value: "update_status", label: "Update Status" },
  { value: "assign_owner", label: "Assign Owner" },
  { value: "escalate", label: "Escalate" },
  { value: "ai_analyze", label: "AI Analysis" },
];

export function CreateRuleForm({ eventTypes }: { eventTypes: Array<{ name: string; label: string }> }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await createAutomationRuleAction(null, fd);
          if (!res.error) {
            (e.target as HTMLFormElement).reset();
            router.refresh();
          }
        });
      }}
      className="grid gap-3 sm:grid-cols-4"
    >
      <input
        name="name"
        placeholder="Rule name"
        required
        className="rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:border-[var(--color-blue)]"
      />
      <select
        name="triggerEvent"
        required
        className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-blue)]"
      >
        <option value="">When event&#8230;</option>
        {eventTypes.map(et => (
          <option key={et.name} value={et.name}>{et.label}</option>
        ))}
      </select>
      <select
        name="actionType"
        required
        className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-blue)]"
      >
        <option value="">Then do&#8230;</option>
        {ACTION_TYPES.map(at => (
          <option key={at.value} value={at.value}>{at.label}</option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
      >
        {pending ? "Creating&#8230;" : "Create Rule"}
      </button>
    </form>
  );
}
