"use client";

import { useState, useTransition } from "react";
import { PlusCircle, X, Loader2, Webhook } from "lucide-react";
import { createWebhookAction } from "@/lib/integration-hub/actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const ALL_EVENTS = [
  "user_created", "user_deleted", "control_failed", "risk_created",
  "evidence_updated", "workflow_triggered", "contract_updated",
  "vendor_updated", "misconfiguration_detected", "sync_completed", "sync_failed",
];

const EVENT_LABELS: Record<string, string> = {
  user_created: "User Created", user_deleted: "User Deleted", control_failed: "Control Failed",
  risk_created: "Risk Created", evidence_updated: "Evidence Updated", workflow_triggered: "Workflow Triggered",
  contract_updated: "Contract Updated", vendor_updated: "Vendor Updated",
  misconfiguration_detected: "Misconfiguration Detected", sync_completed: "Sync Completed", sync_failed: "Sync Failed",
};

export function CreateWebhookButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [direction, setDirection] = useState<"inbound" | "outbound">("outbound");
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(ev: string) {
    setSelectedEvents((s) => s.includes(ev) ? s.filter((e) => e !== ev) : [...s, ev]);
  }

  function handleSubmit() {
    if (!name.trim()) { setError("Name is required"); return; }
    if (selectedEvents.length === 0) { setError("Select at least one event type"); return; }
    setError(null);
    startTransition(async () => {
      const result = await createWebhookAction({ name, direction, url: url || undefined, eventTypes: selectedEvents });
      if (result.error) { setError(result.error); } else { setOpen(false); router.refresh(); }
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={cn("inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-blue)] text-white text-sm font-semibold hover:opacity-90 transition-opacity", className)}>
        <PlusCircle className="h-4 w-4" /> Add Webhook
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold flex items-center gap-2"><Webhook className="h-4 w-4 text-[var(--color-blue)]" /> New Webhook</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/[0.06] text-[var(--color-ink-faint)]"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1">Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Slack Governance Alerts" className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1">Direction</label>
                <select value={direction} onChange={(e) => setDirection(e.target.value as never)} className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50">
                  <option value="outbound">Outbound — Push events to external URL</option>
                  <option value="inbound">Inbound — Receive events from external system</option>
                </select>
              </div>
              {direction === "outbound" && (
                <div>
                  <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1">Destination URL</label>
                  <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://hooks.slack.com/..." className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-2">Event Types *</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {ALL_EVENTS.map((ev) => (
                    <label key={ev} className="flex items-center gap-2 cursor-pointer rounded-lg p-2 hover:bg-white/[0.04]">
                      <input type="checkbox" checked={selectedEvents.includes(ev)} onChange={() => toggle(ev)} className="h-3 w-3 accent-[var(--color-blue)]" />
                      <span className="text-xs text-[var(--color-ink-dim)]">{EVENT_LABELS[ev]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

            <div className="flex gap-2 mt-5">
              <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-[var(--color-line)] py-2 text-sm font-medium hover:bg-white/[0.04]">Cancel</button>
              <button onClick={handleSubmit} disabled={pending} className="flex-1 rounded-xl bg-[var(--color-blue)] py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
