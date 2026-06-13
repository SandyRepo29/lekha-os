"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Webhook, Plus, Pause, Play, Trash2, X, Zap } from "lucide-react";
import { getWebhooksAction, createWebhookAction, toggleWebhookAction, deleteWebhookAction } from "@/lib/trust-api/actions";

const ALL_EVENTS = [
  "trust.score.updated", "vendor.verified", "badge.issued", "risk.created",
  "risk.closed", "audit.completed", "assessment.completed", "ai.trust.updated", "benchmark.updated",
];

type Hook = { id: string; name: string; url: string; events: string[] | null; status: string; failureCount: number; lastTriggeredAt?: Date | null; createdAt: Date };

export default function WebhooksPage() {
  const [isPending, startTransition] = useTransition();
  const [webhooks, setWebhooks] = useState<Hook[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  async function load() {
    const res = await getWebhooksAction();
    if (res.data) setWebhooks(res.data as Hook[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function toggleEvent(e: string) {
    setSelectedEvents(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  }

  async function handleCreate(fd: FormData) {
    fd.set("events", selectedEvents.join(","));
    const res = await createWebhookAction(fd);
    if (res.data) { setShowForm(false); setSelectedEvents([]); load(); }
  }

  async function handleToggle(id: string, current: string) {
    startTransition(async () => {
      await toggleWebhookAction(id, current === "active" ? "paused" : "active");
      load();
    });
  }

  async function handleDelete(id: string) {
    startTransition(async () => { await deleteWebhookAction(id); load(); });
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-xs text-[var(--color-ink-faint)]">
            <Link href="/trust-api" className="hover:underline">Trust API Platform™</Link> / Webhooks
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Webhook Platform™</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Subscribe to real-time trust events and push updates to your systems.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add Webhook
        </button>
      </div>

      {/* Event types */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h2 className="mb-4 font-semibold text-sm">Available Events</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ALL_EVENTS.map(event => (
            <div key={event} className="flex items-center gap-2 rounded-xl border border-[var(--color-line)]/50 bg-white/[0.02] px-3 py-2">
              <Zap className="h-3 w-3 shrink-0 text-amber-400" />
              <code className="text-[11px] font-mono text-[var(--color-ink-dim)]">{event}</code>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-[var(--color-line)]/40 bg-white/[0.02] p-3">
          <div className="text-xs font-semibold text-[var(--color-ink-dim)] mb-1">Example Payload</div>
          <pre className="text-[11px] font-mono text-[var(--color-ink-faint)] whitespace-pre-wrap">{`{
  "event": "trust.score.updated",
  "data": { "orgId": "...", "score": 82, "previous": 78 },
  "timestamp": "2026-06-13T10:00:00Z"
}`}</pre>
        </div>
      </div>

      {/* Webhooks list */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h2 className="mb-4 font-semibold">Registered Webhooks ({webhooks.length})</h2>
        {loading ? (
          <p className="py-8 text-center text-sm text-[var(--color-ink-faint)]">Loading…</p>
        ) : webhooks.length === 0 ? (
          <div className="py-8 text-center">
            <Webhook className="mx-auto mb-2 h-8 w-8 text-[var(--color-ink-faint)]" />
            <p className="text-sm text-[var(--color-ink-faint)]">No webhooks yet. Add one to receive trust event notifications.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map(w => (
              <div key={w.id} className="rounded-xl border border-[var(--color-line)]/60 bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{w.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        w.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                        w.status === "paused" ? "bg-amber-500/10 text-amber-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>{w.status}</span>
                      {w.failureCount > 0 && (
                        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">{w.failureCount} failures</span>
                      )}
                    </div>
                    <code className="mt-1 block text-xs font-mono text-[var(--color-ink-faint)] truncate">{w.url}</code>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {((w.events ?? []) as string[]).map(e => (
                        <code key={e} className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-ink-dim)]">{e}</code>
                      ))}
                    </div>
                    {w.lastTriggeredAt && (
                      <p className="mt-1.5 text-[11px] text-[var(--color-ink-faint)]">Last triggered {new Date(w.lastTriggeredAt).toLocaleString()}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleToggle(w.id, w.status)} disabled={isPending} className="rounded-lg border border-[var(--color-line)] p-2 hover:bg-white/[0.06] transition-colors">
                      {w.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => handleDelete(w.id)} disabled={isPending} className="rounded-lg border border-[var(--color-line)] p-2 hover:border-red-500/30 hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Webhook Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Add Webhook</h2>
              <button onClick={() => { setShowForm(false); setSelectedEvents([]); }}><X className="h-4 w-4" /></button>
            </div>
            <form action={handleCreate} className="space-y-4">
              <div><label className="mb-1 block text-xs font-medium text-[var(--color-ink-dim)]">Webhook Name *</label>
                <input name="name" required className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50" placeholder="Procurement System Hook" /></div>
              <div><label className="mb-1 block text-xs font-medium text-[var(--color-ink-dim)]">Endpoint URL *</label>
                <input name="url" required type="url" className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50" placeholder="https://example.com/webhooks/audt" /></div>
              <div>
                <label className="mb-2 block text-xs font-medium text-[var(--color-ink-dim)]">Events to Subscribe ({selectedEvents.length} selected)</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {ALL_EVENTS.map(event => (
                    <label key={event} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-[11px] transition-colors ${
                      selectedEvents.includes(event)
                        ? "border-[var(--color-blue)]/40 bg-[var(--color-blue)]/[0.08] text-[var(--color-blue)]"
                        : "border-[var(--color-line)]/50 bg-white/[0.02] text-[var(--color-ink-dim)] hover:border-[var(--color-line)]"
                    }`}>
                      <input type="checkbox" className="sr-only" checked={selectedEvents.includes(event)} onChange={() => toggleEvent(event)} />
                      <Zap className="h-3 w-3 shrink-0" />
                      <code className="font-mono">{event}</code>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setSelectedEvents([]); }} className="flex-1 rounded-xl border border-[var(--color-line)] py-2 text-sm hover:bg-white/[0.04]">Cancel</button>
                <button type="submit" disabled={selectedEvents.length === 0} className="flex-1 rounded-xl grad-brand py-2 text-sm font-semibold text-white disabled:opacity-50">Add Webhook</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
