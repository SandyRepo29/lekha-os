"use client";

export const dynamic = "force-dynamic";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Key, Plus, Copy, Check, Trash2, Shield, X,
} from "lucide-react";
import { getClientsAction, getApiKeysAction, createClientAction, issueApiKeyAction, revokeApiKeyAction, deleteClientAction } from "@/backend/src/modules/trust-api/actions";
import { useEffect } from "react";
import { ApiKeyStatusBadge, ApiPlanBadge } from "@/components/trust-api/trust-api-ui";

type Client = { id: string; name: string; plan: string; status: string; clientType: string; contactEmail?: string | null; createdAt: Date };
type ApiKey  = { id: string; name: string; keyPrefix: string; plan: string; status: string; permissions: string[] | null; usageCount: number; lastUsedAt?: Date | null; createdAt: Date; clientId?: string | null };

export default function ApiKeysPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clients, setClients] = useState<Client[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [c, k] = await Promise.all([getClientsAction(), getApiKeysAction()]);
    if (c.data) setClients(c.data as Client[]);
    if (k.data) setKeys(k.data as ApiKey[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function copyKey() {
    if (newKey) { navigator.clipboard.writeText(newKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }

  async function handleCreateClient(fd: FormData) {
    const res = await createClientAction(fd);
    if (res.data) { setShowClientForm(false); load(); }
  }

  async function handleIssueKey(fd: FormData) {
    const res = await issueApiKeyAction(fd);
    if (res.data) { setNewKey((res.data as { key: string }).key); setShowKeyForm(false); load(); }
  }

  async function handleRevokeKey(id: string) {
    startTransition(async () => { await revokeApiKeyAction(id); load(); });
  }

  async function handleDeleteClient(id: string) {
    startTransition(async () => { await deleteClientAction(id); load(); });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-xs text-[var(--color-ink-faint)]">
            <Link href="/trust-api" className="hover:underline">Trust API Platform™</Link> / API Keys
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">API Keys</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Manage registered clients and their Trust API access credentials.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowClientForm(true)} className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-2 text-sm font-medium hover:bg-[#F8F9FB] transition-colors">
            <Plus className="h-4 w-4" /> New Client
          </button>
          <button onClick={() => setShowKeyForm(true)} className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90">
            <Key className="h-4 w-4" /> Issue Key
          </button>
        </div>
      </div>

      {/* Newly issued key reveal */}
      {newKey && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-emerald-400">
              <Shield className="h-4 w-4" /> API Key Issued — Copy now, shown once only
            </div>
            <button onClick={() => setNewKey(null)}><X className="h-4 w-4 text-[var(--color-ink-faint)]" /></button>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-black/20 px-4 py-3">
            <code className="flex-1 text-sm font-mono text-emerald-400 break-all">{newKey}</code>
            <button onClick={copyKey} className="shrink-0 rounded-lg border border-[var(--color-line)] p-2 hover:bg-[#F8F9FB]">
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--color-ink-faint)]">Use as: Authorization: Bearer {newKey.slice(0, 16)}…</p>
        </div>
      )}

      {/* API Keys table */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h2 className="mb-4 font-semibold">Active API Keys ({keys.filter(k => k.status === "active").length})</h2>
        {loading ? (
          <p className="py-8 text-center text-sm text-[var(--color-ink-faint)]">Loading…</p>
        ) : keys.length === 0 ? (
          <div className="py-8 text-center">
            <Key className="mx-auto mb-2 h-8 w-8 text-[var(--color-ink-faint)]" />
            <p className="text-sm text-[var(--color-ink-faint)]">No API keys issued yet. Issue your first key to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line)]/50">
            {keys.map(k => (
              <div key={k.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{k.name}</span>
                    <code className="rounded bg-[#F8F9FB] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-ink-faint)]">{k.keyPrefix}…</code>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--color-ink-faint)]">
                    <span>{k.plan} plan</span>
                    <span>·</span>
                    <span>{k.usageCount} calls</span>
                    {k.lastUsedAt && <><span>·</span><span>last used {new Date(k.lastUsedAt).toLocaleDateString()}</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ApiKeyStatusBadge status={k.status} />
                  {k.status === "active" && (
                    <button onClick={() => handleRevokeKey(k.id)} disabled={isPending} className="rounded-lg border border-[var(--color-line)] px-2 py-1 text-[11px] text-[var(--color-ink-dim)] hover:text-red-400 hover:border-red-500/30 transition-colors">Revoke</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clients table */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h2 className="mb-4 font-semibold">Registered Clients ({clients.length})</h2>
        {clients.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--color-ink-faint)]">No clients registered yet. Add a client to organize API access.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line)]/50">
            {clients.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="mt-0.5 text-[11px] text-[var(--color-ink-faint)]">{c.clientType} · {c.plan} plan{c.contactEmail ? ` · ${c.contactEmail}` : ""}</div>
                </div>
                <div className="flex items-center gap-2">
                  <ApiKeyStatusBadge status={c.status} />
                  <button onClick={() => handleDeleteClient(c.id)} disabled={isPending} className="rounded-lg p-1.5 text-[var(--color-ink-faint)] hover:text-red-400 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Client Modal */}
      {showClientForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Register API Client</h2>
              <button onClick={() => setShowClientForm(false)}><X className="h-4 w-4" /></button>
            </div>
            <form action={handleCreateClient} className="space-y-4">
              <div><label className="mb-1 block text-xs font-medium text-[var(--color-ink-dim)]">Client Name *</label>
                <input name="name" required className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50" placeholder="Procurement Portal" /></div>
              <div><label className="mb-1 block text-xs font-medium text-[var(--color-ink-dim)]">Client Type</label>
                <select name="clientType" className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm outline-none">
                  {["application","partner","internal","vendor","auditor","custom"].map(t => <option key={t} value={t}>{t}</option>)}
                </select></div>
              <div><label className="mb-1 block text-xs font-medium text-[var(--color-ink-dim)]">Plan</label>
                <select name="plan" className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm outline-none">
                  {["free","growth","business","enterprise"].map(p => <option key={p} value={p}>{p}</option>)}
                </select></div>
              <div><label className="mb-1 block text-xs font-medium text-[var(--color-ink-dim)]">Contact Email</label>
                <input name="contactEmail" type="email" className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50" placeholder="dev@example.com" /></div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowClientForm(false)} className="flex-1 rounded-xl border border-[var(--color-line)] py-2 text-sm hover:bg-[#F8F9FB]">Cancel</button>
                <button type="submit" className="flex-1 rounded-xl grad-brand py-2 text-sm font-semibold text-white">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Key Modal */}
      {showKeyForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Issue API Key</h2>
              <button onClick={() => setShowKeyForm(false)}><X className="h-4 w-4" /></button>
            </div>
            <form action={handleIssueKey} className="space-y-4">
              <div><label className="mb-1 block text-xs font-medium text-[var(--color-ink-dim)]">Key Name *</label>
                <input name="name" required className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50" placeholder="Production Key" /></div>
              {clients.length > 0 && (
                <div><label className="mb-1 block text-xs font-medium text-[var(--color-ink-dim)]">Assign to Client (optional)</label>
                  <select name="clientId" className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm outline-none">
                    <option value="">— No client —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select></div>
              )}
              <div><label className="mb-1 block text-xs font-medium text-[var(--color-ink-dim)]">Plan</label>
                <select name="plan" className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm outline-none">
                  {["free","growth","business","enterprise"].map(p => <option key={p} value={p}>{p}</option>)}
                </select></div>
              <div><label className="mb-1 block text-xs font-medium text-[var(--color-ink-dim)]">Permissions</label>
                <select name="permissions" className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm outline-none">
                  <option value="read">read (recommended)</option>
                  <option value="read_write">read_write</option>
                </select></div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowKeyForm(false)} className="flex-1 rounded-xl border border-[var(--color-line)] py-2 text-sm hover:bg-[#F8F9FB]">Cancel</button>
                <button type="submit" className="flex-1 rounded-xl grad-brand py-2 text-sm font-semibold text-white">Issue Key</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
