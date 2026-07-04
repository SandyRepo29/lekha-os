export const dynamic = "force-dynamic";

import { requirePlatformUser, isOwner } from "@/lib/platform-admin/auth";
import {
  getFeatureFlagsAction,
  createFeatureFlagAction,
  deleteFeatureFlagAction,
} from "@/lib/platform-admin/actions";
import { FlagToggle } from "@/components/platform-admin/flag-toggle";
import { FlagOverridePanel } from "@/components/platform-admin/flag-override-panel";
import { Flag, Plus, Trash2 } from "lucide-react";

const SCOPE_OPTIONS = ["global", "org", "user", "beta"];

// Built-in flag keys seeded at migration — cannot be deleted
const BUILTIN_KEYS = new Set([
  "vendor_hub", "compliance_management", "audit_management", "risk_lens", "control_center",
  "trust_score", "trust_intelligence", "policy_governance", "dpdp_privacy", "contract_governance",
  "issue_hub", "workflow_studio", "trust_exchange", "trust_graph", "governance_trends",
]);

async function DeleteFlagButton({ flagKey, isOwnerUser }: { flagKey: string; isOwnerUser: boolean }) {
  if (!isOwnerUser || BUILTIN_KEYS.has(flagKey)) return null;
  return (
    <form
      action={async () => {
        "use server";
        await deleteFeatureFlagAction(flagKey);
      }}
    >
      <button
        type="submit"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        title="Delete flag"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}

async function CreateFlagForm({ isOwnerUser }: { isOwnerUser: boolean }) {
  if (!isOwnerUser) return null;
  return (
    <details className="group rounded-xl border border-[#30363d] bg-white/[0.02]">
      <summary className="flex cursor-pointer items-center gap-2 px-5 py-3 text-sm text-white/60 hover:text-white transition-colors list-none">
        <Plus className="h-4 w-4 text-[#00B8D9]" />
        <span>Create Feature Flag</span>
      </summary>
      <form
        action={async (fd: FormData) => {
          "use server";
          await createFeatureFlagAction(fd);
        }}
        className="border-t border-[#30363d] p-5 space-y-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input
            name="key"
            required
            placeholder="flag_key (snake_case)"
            className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-[#00B8D9]/50"
          />
          <input
            name="name"
            required
            placeholder="Display name"
            className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none"
          />
          <input
            name="description"
            placeholder="Description (optional)"
            className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white/70 placeholder-white/25 focus:outline-none"
          />
          <select name="scope" className="rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-white">
            {SCOPE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button type="submit" className="rounded-lg bg-[#007A94] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
          Create Flag (disabled by default)
        </button>
      </form>
    </details>
  );
}

export default async function FeatureFlagsPage() {
  const session = await requirePlatformUser();
  const { data: flags } = await getFeatureFlagsAction();
  const ownerUser = isOwner(session);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Feature Flags</h1>
        <p className="mt-0.5 text-sm text-white/40">
          Control which features are available platform-wide. Changes take effect immediately.
        </p>
      </div>

      <CreateFlagForm isOwnerUser={ownerUser} />

      <div className="rounded-xl border border-[#30363d] divide-y divide-[#30363d] overflow-hidden">
        {(flags ?? []).length === 0 && (
          <div className="px-5 py-8 text-center text-white/30">No feature flags configured.</div>
        )}
        {(flags ?? []).map((flag) => (
          <div key={flag.key as string} className="bg-white/[0.02] px-5 py-4 hover:bg-white/[0.03] transition-colors">
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00B8D9]/10">
                <Flag className="h-4 w-4 text-[#00B8D9]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-white">{flag.name as string}</span>
                  <span className="rounded-full border border-[#30363d] bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-white/30">
                    {flag.key as string}
                  </span>
                  <span className="rounded-full bg-[#30363d] px-2 py-0.5 text-[10px] text-white/40">
                    {flag.scope as string}
                  </span>
                  {BUILTIN_KEYS.has(flag.key as string) && (
                    <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/25">built-in</span>
                  )}
                </div>
                {!!flag.description && (
                  <div className="mt-0.5 text-[12px] text-white/35">{flag.description as string}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <DeleteFlagButton flagKey={flag.key as string} isOwnerUser={ownerUser} />
                <FlagToggle flagKey={flag.key as string} enabled={flag.enabled as boolean} />
              </div>
            </div>
            <div className="mt-2 pl-12">
              <FlagOverridePanel flagKey={flag.key as string} isOwner={ownerUser} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
