export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getAccessControl } from "@/backend/src/modules/security-command-center/security-service";
import { SecSubNav, SecStat, StatusBadge } from "@/components/security-command-center/sec-ui";
import { DeleteIpRuleButton } from "@/components/security-command-center/sec-actions";
import { addIpRuleAction } from "@/backend/src/modules/security-command-center/actions";
import { Shield, Lock, CheckCircle } from "lucide-react";

export default async function AccessControlPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const data = await getAccessControl(orgId).catch(() => null);
  const allowlists = data?.allowlists ?? [];
  const permissions = data?.permissions ?? [];
  const rolePerms = data?.rolePermissions ?? [];

  const enabledRules = allowlists.filter(r => r.enabled).length;

  const permsByModule = permissions.reduce<Record<string, typeof permissions>>((acc, p) => {
    acc[p.module] = acc[p.module] ?? [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-6">
      <SecSubNav />
      <div className="pt-2">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Access Control™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">IP allow lists, fine-grained permissions, and resource-level access controls.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SecStat label="IP Rules"         value={allowlists.length} accent="neutral" />
        <SecStat label="Active Rules"     value={enabledRules}      accent={enabledRules > 0 ? "good" : "warn"} />
        <SecStat label="Permissions"      value={permissions.length} accent="neutral" />
      </div>

      {/* IP Allow Lists */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-red-400" /> IP Allow Lists</h2>
        </div>

        {/* Add Rule Form */}
        <form action={addIpRuleAction.bind(null, undefined) as unknown as (fd: FormData) => void} className="flex flex-wrap gap-2 rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <input name="cidrRange" placeholder="192.168.1.0/24" required
            className="flex-1 min-w-[160px] rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50" />
          <input name="description" placeholder="Description (e.g. Office network)" required
            className="flex-1 min-w-[200px] rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50" />
          <select name="appliesTo"
            className="rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm outline-none">
            <option value="all">All Resources</option>
            <option value="login">Login Only</option>
            <option value="api">API Access</option>
            <option value="auditor_rooms">Auditor Rooms</option>
            <option value="trust_exchange">Trust Exchange</option>
          </select>
          <button type="submit" className="rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow">
            Add Rule
          </button>
        </form>

        {allowlists.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-line)] p-8 text-center">
            <Shield className="mx-auto h-10 w-10 text-[var(--color-ink-muted)]" />
            <p className="mt-3 text-sm text-[var(--color-ink-dim)]">No IP rules configured. Add office, VPN, and SOC team IP ranges.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--color-line)] divide-y divide-[var(--color-line)] overflow-hidden">
            {allowlists.map(rule => (
              <div key={rule.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-4">
                  <code className="text-sm font-mono text-[var(--color-blue)]">{rule.cidrRange}</code>
                  <div>
                    <div className="text-sm">{rule.description}</div>
                    <div className="text-xs text-[var(--color-ink-dim)] capitalize">Applies to: {rule.appliesTo}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={rule.enabled ? "active" : "disabled"} />
                  <DeleteIpRuleButton id={rule.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Permissions Reference */}
      <div className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><Lock className="h-4 w-4 text-[var(--color-blue)]" /> Fine-Grained Permissions Reference</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(permsByModule).map(([mod, perms]) => (
            <div key={mod} className="rounded-2xl border border-[var(--color-line)] bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-dim)] mb-3 capitalize">{mod}</div>
              <div className="space-y-1.5">
                {perms.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <div>
                      <code className="text-[11px] text-[var(--color-blue)]">{p.key}</code>
                      <div className="text-[11px] text-[var(--color-ink-dim)]">{p.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--color-ink-dim)]">
          Fine-grained permissions allow you to grant or restrict specific capabilities per role or user. Custom role-permission mapping is available on the Enterprise plan.
        </p>
      </div>
    </div>
  );
}

