"use client";

import { useState, useTransition } from "react";
import { Plug, X, Loader2 } from "lucide-react";
import { connectAction, disconnectAction } from "@/backend/src/modules/integration-hub/actions";
import { useRouter } from "next/navigation";

type AuthField = { key: string; label: string; type: string; required: boolean };

interface Props {
  registryId: string;
  connectorName: string;
  authFields: AuthField[];
  instanceId?: string;
  isConnected: boolean;
}

export function ConnectButton({ registryId, connectorName, authFields, instanceId, isConnected }: Props) {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (isConnected && instanceId) {
    return (
      <button
        onClick={() => {
          if (!confirm(`Disconnect ${connectorName}?`)) return;
          startTransition(async () => {
            await disconnectAction(instanceId);
            router.refresh();
          });
        }}
        disabled={pending}
        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Disconnect"}
      </button>
    );
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await connectAction(registryId, fields, "daily");
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setFields({});
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[var(--color-blue)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
      >
        Connect
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Plug className="h-4 w-4 text-[var(--color-blue)]" /> Connect {connectorName}
              </h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-[#F8F9FB] text-[var(--color-ink-faint)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {authFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1">
                    {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      rows={4}
                      placeholder={`Enter ${field.label}`}
                      value={fields[field.key] ?? ""}
                      onChange={(e) => setFields((f) => ({ ...f, [field.key]: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50 resize-none font-mono text-xs"
                    />
                  ) : (
                    <input
                      type={field.type === "password" ? "password" : "text"}
                      placeholder={`Enter ${field.label}`}
                      value={fields[field.key] ?? ""}
                      onChange={(e) => setFields((f) => ({ ...f, [field.key]: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50"
                    />
                  )}
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1">Sync Frequency</label>
                <select
                  value={fields._syncFrequency ?? "daily"}
                  onChange={(e) => setFields((f) => ({ ...f, _syncFrequency: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50"
                >
                  <option value="real_time">Real-time</option>
                  <option value="fifteen_minutes">Every 15 minutes</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="manual">Manual only</option>
                </select>
              </div>
            </div>

            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

            <div className="flex gap-2 mt-5">
              <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-[var(--color-line)] py-2 text-sm font-medium hover:bg-[#F8F9FB] transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={pending}
                className="flex-1 rounded-xl bg-[var(--color-blue)] py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {pending ? "Connecting…" : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
