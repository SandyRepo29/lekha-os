export const dynamic = "force-dynamic";

import { Key } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listKeys } from "@/lib/services/api-key-service";
import { ApiKeyManager } from "@/components/settings/api-key-manager";

export default async function ApiKeysPage() {
  const session = await requireUser();

  if (!session.org) {
    return <div className="text-[var(--color-ink-dim)]">No organization found.</div>;
  }

  const keys = session.demo ? [] : await listKeys(session.org.id);
  const canManage = session.org.role === "owner" || session.org.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">API Keys</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Manage programmatic access to Lekha OS.</p>
      </div>

      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Key className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
            API keys ({keys.filter((k) => k.status === "active").length} active)
          </span>
        </div>

        <ApiKeyManager keys={keys} canManage={canManage} isDemoMode={session.demo} />

        <div className="rounded-xl border border-[var(--color-line)] bg-white p-4 text-xs text-[var(--color-ink-faint)] space-y-1.5">
          <p><strong className="text-[var(--color-ink)]">Security notes:</strong></p>
          <p>· Keys are shown only once at creation. Store them in a secret manager immediately.</p>
          <p>· Rotate keys regularly. Revoked keys cannot be restored.</p>
          <p>· Key format: <code className="font-mono text-[var(--color-blue)]">lk_live_*</code> — 64 hex characters after the prefix.</p>
          <p>· All key activity is recorded in Audit Logs.</p>
        </div>
      </div>
    </div>
  );
}
