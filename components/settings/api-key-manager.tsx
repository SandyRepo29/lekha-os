"use client";

import { useState, useTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  createApiKey,
  revokeApiKey,
  rotateApiKey,
  type ApiKeyState,
} from "@/lib/settings/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectOption } from "@/components/ui/select";
import { CheckCircle2, Copy, Eye, EyeOff, Plus, RefreshCw, Trash2, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SafeApiKey } from "@/lib/repositories/api-key-repo";

const PERMISSION_LABELS: Record<string, string> = {
  read_only: "Read Only",
  read_write: "Read & Write",
  admin: "Admin",
};

const PERMISSION_STYLES: Record<string, string> = {
  read_only: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  read_write: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  admin: "bg-red-500/10 text-red-400 border-red-500/30",
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="rounded p-1 hover:bg-white/10 transition-colors">
      {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-[var(--color-ink-faint)]" />}
    </button>
  );
}

function PlainKeyModal({ plainKey, onClose }: { plainKey: string; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-[var(--color-line)] bg-[#0f0f14] p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Key className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-ink)]">API key created</h3>
            <p className="text-xs text-[var(--color-ink-faint)]">Copy this key now — it won&apos;t be shown again.</p>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.03] p-3 font-mono text-sm">
          <div className="flex items-center gap-2">
            <span className={cn("flex-1 break-all text-[var(--color-ink)]", !visible && "blur-sm select-none")}>
              {plainKey}
            </span>
            <button onClick={() => setVisible((v) => !v)} className="shrink-0 rounded p-1 hover:bg-white/10">
              {visible ? <EyeOff className="h-4 w-4 text-[var(--color-ink-faint)]" /> : <Eye className="h-4 w-4 text-[var(--color-ink-faint)]" />}
            </button>
            <CopyButton value={plainKey} />
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-400">
          ⚠ Store this key in a secrets manager. It cannot be recovered after you close this dialog.
        </div>
        <Button variant="primary" onClick={onClose} className="mt-4 w-full">Done</Button>
      </div>
    </div>
  );
}

function CreateKeyForm({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState<ApiKeyState, FormData>(createApiKey, undefined);
  const router = useRouter();

  if (state?.ok && state.plainKey) {
    return <PlainKeyModal plainKey={state.plainKey} onClose={() => { onClose(); router.refresh(); }} />;
  }

  return (
    <Card>
      <CardHeader><CardTitle>Create API key</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div>
            <Label htmlFor="name">Key name</Label>
            <Input id="name" name="name" placeholder="e.g. CI/CD Pipeline, Webhook Server" required />
          </div>
          <div>
            <Label htmlFor="permissions">Permissions</Label>
            <Select id="permissions" name="permissions" defaultValue="read_only" className="w-full">
              <SelectOption value="read_only">Read Only</SelectOption>
              <SelectOption value="read_write">Read & Write</SelectOption>
              <SelectOption value="admin">Admin</SelectOption>
            </Select>
          </div>
          {state?.error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{state.error}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={pending}>{pending ? "Creating…" : "Create key"}</Button>
            <Button type="button" variant="subtle" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ApiKeyManager({
  keys,
  canManage,
  isDemoMode,
}: {
  keys: SafeApiKey[];
  canManage: boolean;
  isDemoMode: boolean;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [creating, setCreating] = useState(false);
  const [rotatedKey, setRotatedKey] = useState<string | null>(null);

  function onRevoke(keyId: string) {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    start(async () => {
      await revokeApiKey(keyId);
      router.refresh();
    });
  }

  function onRotate(keyId: string) {
    if (!confirm("Rotate this key? The current key will stop working immediately.")) return;
    start(async () => {
      const res = await rotateApiKey(keyId);
      if (res?.plainKey) setRotatedKey(res.plainKey);
      router.refresh();
    });
  }

  if (isDemoMode) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-300/90">
        Connect Supabase to manage API keys.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rotatedKey && (
        <PlainKeyModal plainKey={rotatedKey} onClose={() => setRotatedKey(null)} />
      )}

      {creating && <CreateKeyForm onClose={() => setCreating(false)} />}

      {!creating && canManage && (
        <Button variant="outline" onClick={() => setCreating(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Create API key
        </Button>
      )}

      {keys.length === 0 ? (
        <Card>
          <div className="px-5 py-10 text-center text-sm text-[var(--color-ink-dim)]">
            No API keys yet. Create one to enable programmatic access.
          </div>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-[var(--color-line)]">
            {keys.map((key) => (
              <div key={key.id} className={cn("flex flex-wrap items-center gap-3 px-5 py-4", key.status === "revoked" && "opacity-50")}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--color-ink)]">{key.name}</span>
                    {key.status === "revoked" && (
                      <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs text-red-400">Revoked</span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--color-ink-faint)]">
                    <code className="font-mono">{key.keyPrefix}…</code>
                    <span>·</span>
                    <span className={cn("rounded-full border px-2 py-0.5 text-xs", PERMISSION_STYLES[key.permissions])}>
                      {PERMISSION_LABELS[key.permissions]}
                    </span>
                    <span>·</span>
                    <span>Created {new Date(key.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                    {key.lastUsedAt && (
                      <>
                        <span>·</span>
                        <span>Last used {new Date(key.lastUsedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                      </>
                    )}
                  </div>
                </div>
                {canManage && key.status === "active" && (
                  <div className="flex gap-2">
                    <Button variant="subtle" size="sm" onClick={() => onRotate(key.id)} className="flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" /> Rotate
                    </Button>
                    <Button variant="subtle" size="sm" onClick={() => onRevoke(key.id)} className="flex items-center gap-1 text-red-400 hover:text-red-300">
                      <Trash2 className="h-3 w-3" /> Revoke
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
