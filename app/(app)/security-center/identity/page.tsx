export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getMfaOverview, getSsoOverview } from "@/lib/services/security-command-center/security-service";
import { SecSubNav, SecStat, EnforcementBadge, MfaCoverageBar, ProviderBadge, StatusBadge } from "@/components/security-command-center/sec-ui";
import { SsoToggleButton, DeleteSsoButton } from "@/components/security-command-center/sec-actions";
import { CheckCircle, XCircle, Users, Shield, Key } from "lucide-react";

export default async function IdentityPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const [mfa, sso] = await Promise.all([
    getMfaOverview(orgId).catch(() => null),
    getSsoOverview(orgId).catch(() => null),
  ]);

  const users = (mfa?.users ?? []) as Record<string, unknown>[];
  const providers = sso?.providers ?? [];
  const settings = mfa?.settings;
  const mfaEnabled = users.filter(u => u.mfa_enabled).length;
  const mfaPercent = users.length ? Math.round((mfaEnabled / users.length) * 100) : 0;

  return (
    <div className="space-y-6 p-6">
      <SecSubNav />
      <div className="pt-2">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Identityâ„¢</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Multi-Factor Authentication, Enterprise SSO, and SCIM provisioning.</p>
      </div>

      {/* MFA KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SecStat label="Total Users"     value={users.length}   accent="neutral" />
        <SecStat label="MFA Enabled"     value={mfaEnabled}     accent={mfaEnabled === users.length ? "good" : "warn"} />
        <SecStat label="MFA Disabled"    value={users.length - mfaEnabled} accent={(users.length - mfaEnabled) > 0 ? "danger" : "good"} />
        <SecStat label="Coverage"        value={`${mfaPercent}%`} accent={mfaPercent >= 95 ? "good" : mfaPercent >= 75 ? "warn" : "danger"} />
      </div>

      {/* MFA Settings Panel */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-400" />
            <h2 className="font-semibold">MFA Enforcement Policy</h2>
          </div>
          <EnforcementBadge mode={settings?.enforcementMode ?? "optional"} />
        </div>
        <MfaCoverageBar percent={mfaPercent} />
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-[var(--color-ink-dim)]">Remember Device</div>
            <div className="font-medium mt-0.5">{settings?.allowRememberDevice ? `Yes â€” ${settings.rememberDays} days` : "No"}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-ink-dim)]">New Device Challenge</div>
            <div className="font-medium mt-0.5">{settings?.requireOnNewDevice ? "Required" : "Not required"}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-ink-dim)]">Supported Methods</div>
            <div className="font-medium mt-0.5">TOTP, Recovery Codes</div>
          </div>
        </div>
        <p className="text-xs text-[var(--color-ink-dim)]">
          MFA enforcement settings are configured via Settings &rarr; Security. To change enforcement policy, contact your organization admin.
        </p>
      </div>

      {/* User MFA Table */}
      {users.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-line)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-line)]">
            <Users className="h-4 w-4 text-[var(--color-ink-dim)]" />
            <h2 className="font-semibold text-sm">Team MFA Status</h2>
          </div>
          <div className="divide-y divide-[var(--color-line)]">
            {users.map(u => (
              <div key={String(u.id)} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium">{String(u.full_name ?? "â€”")}</div>
                  <div className="text-xs text-[var(--color-ink-dim)]">{String(u.email ?? "")}</div>
                </div>
                <div className="flex items-center gap-3">
                  {!!u.last_verified_at && (
                    <span className="text-xs text-[var(--color-ink-dim)]">
                      Verified {new Date(String(u.last_verified_at)).toLocaleDateString()}
                    </span>
                  )}
                  {u.mfa_enabled
                    ? <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle className="h-3.5 w-3.5" /> Enabled</span>
                    : <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="h-3.5 w-3.5" /> Disabled</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SSO Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><Key className="h-4 w-4 text-[var(--color-blue)]" /> Enterprise SSO Providers</h2>
        </div>

        {providers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-line)] p-8 text-center">
            <Key className="mx-auto h-10 w-10 text-[var(--color-ink-muted)]" />
            <p className="mt-3 text-sm text-[var(--color-ink-dim)]">No SSO providers configured.</p>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">Configure Microsoft Entra ID, Okta, Google Workspace, or a custom SAML/OIDC provider.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line)] rounded-2xl border border-[var(--color-line)] overflow-hidden">
            {providers.map(p => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <ProviderBadge type={p.providerType} />
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-[var(--color-ink-dim)]">
                      JIT: {p.jitEnabled ? "Enabled" : "Disabled"} Â· Default role: {p.defaultRole}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.enabled ? "enabled" : "disabled"} />
                  <SsoToggleButton id={p.id} enabled={p.enabled} />
                  <DeleteSsoButton id={p.id} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SSO Provider Note */}
        <div className="rounded-xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/[0.04] p-4">
          <p className="text-xs text-[var(--color-ink-dim)] leading-relaxed">
            <strong className="text-[var(--color-blue)]">Enterprise SSO</strong> is available on the Enterprise plan. Supported providers: Microsoft Entra ID, Okta, Google Workspace, Ping Identity, Generic SAML 2.0, Generic OIDC. Contact your AUDT account manager to enable SSO for your organization.
          </p>
        </div>
      </div>

      {/* SCIM Note */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5">
        <h2 className="font-semibold text-sm mb-2">SCIM Provisioning</h2>
        <p className="text-xs text-[var(--color-ink-dim)] leading-relaxed">
          SCIM 2.0 provisioning automates user lifecycle management â€” create, update, and deactivate users from your Identity Provider. Available on Enterprise plan.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-[var(--color-ink-dim)]">
          <div className="rounded-lg border border-[var(--color-line)] p-3">
            <div className="font-medium text-[var(--color-ink)]">SCIM Users Endpoint</div>
            <div className="mt-1 font-mono">/api/scim/v2/users</div>
          </div>
          <div className="rounded-lg border border-[var(--color-line)] p-3">
            <div className="font-medium text-[var(--color-ink)]">SCIM Groups Endpoint</div>
            <div className="mt-1 font-mono">/api/scim/v2/groups</div>
          </div>
        </div>
      </div>
    </div>
  );
}

