export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getEncryptionOverview } from "@/lib/services/security-command-center/security-service";
import { SecSubNav, SecStat, ProviderBadge, StatusBadge } from "@/components/security-command-center/sec-ui";
import { RemoveEncProviderButton } from "@/components/security-command-center/sec-actions";
import { addEncryptionProviderAction } from "@/lib/security-command-center/actions";
import { KeyRound, Lock, CheckCircle } from "lucide-react";

export default async function EncryptionPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const data = await getEncryptionOverview(orgId).catch(() => null);
  const providers = data?.providers ?? [];
  const auditLog = (data?.auditLog ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-6 p-6">
      <SecSubNav />
      <div className="pt-2">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Encryption™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Customer Managed Encryption Keys (CMK) — bring your own keys from AWS KMS, Azure Key Vault, or Google KMS.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SecStat label="Configured Providers" value={providers.length} accent="neutral" />
        <SecStat label="Active CMK"            value={data?.activeCmk ? 1 : 0} accent={data?.activeCmk ? "good" : "warn"} />
        <SecStat label="Audit Events"          value={auditLog.length}          accent="neutral" />
      </div>

      {/* Platform Encryption Banner */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
        <div className="flex items-start gap-4">
          <Lock className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
          <div>
            <div className="font-semibold text-sm text-emerald-400">Platform Encryption — Active by Default</div>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)] leading-relaxed">
              All data in AUDT is encrypted at rest using AES-256-GCM and in transit using TLS 1.3. Integration credentials, API keys, and sensitive configs are encrypted using a per-organization ENCRYPTION_KEY stored in your secure environment.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              {["AES-256-GCM at rest", "TLS 1.3 in transit", "Per-org encryption keys"].map(f => (
                <div key={f} className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle className="h-3 w-3" /> {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CMK Configuration */}
      <div className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><KeyRound className="h-4 w-4 text-[var(--color-blue)]" /> Customer Managed Keys (Enterprise)</h2>

        <form action={addEncryptionProviderAction.bind(null, undefined) as unknown as (fd: FormData) => void} className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-4 sm:grid-cols-3">
          <input name="name" placeholder="Provider name" required
            className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50" />
          <select name="providerType"
            className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm outline-none">
            <option value="aws_kms">AWS KMS</option>
            <option value="azure_key_vault">Azure Key Vault</option>
            <option value="google_kms">Google KMS</option>
          </select>
          <input name="awsRegion" placeholder="AWS region (e.g. ap-south-1)"
            className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50" />
          <input name="awsKeyId" placeholder="AWS Key ID / ARN"
            className="col-span-2 rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50" />
          <button type="submit" className="rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow">
            Add Provider
          </button>
        </form>

        {providers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-line)] p-8 text-center">
            <KeyRound className="mx-auto h-10 w-10 text-[var(--color-ink-muted)]" />
            <p className="mt-3 text-sm text-[var(--color-ink-dim)]">No CMK providers configured.</p>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">Add AWS KMS, Azure Key Vault, or Google KMS to take ownership of your encryption keys.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--color-line)] divide-y divide-[var(--color-line)] overflow-hidden">
            {providers.map(p => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <ProviderBadge type={p.providerType} />
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-[var(--color-ink-dim)]">
                      {p.awsRegion ? `Region: ${p.awsRegion}` : p.azureVaultUrl ? `Vault: ${p.azureVaultUrl}` : p.gcpProject ? `Project: ${p.gcpProject}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.isActive ? "active" : p.testStatus ?? "disabled"} />
                  <RemoveEncProviderButton id={p.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Log */}
      {auditLog.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Encryption Audit Log</h2>
          <div className="rounded-2xl border border-[var(--color-line)] divide-y divide-[var(--color-line)] overflow-hidden">
            {auditLog.slice(0, 15).map(log => (
              <div key={String(log.id)} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <span className="font-medium capitalize">{String(log.action).replace(/_/g, " ")}</span>
                  {!!log.full_name && <span className="text-[var(--color-ink-dim)]"> by {String(log.full_name)}</span>}
                </div>
                <span className="text-xs text-[var(--color-ink-dim)]">{new Date(String(log.created_at)).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


