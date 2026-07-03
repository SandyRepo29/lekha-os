export const dynamic = "force-dynamic";

import { requirePlatformUser } from "@/lib/platform-admin/auth";
import { getFeatureFlagsAction } from "@/lib/platform-admin/actions";
import { FlagToggle } from "@/components/platform-admin/flag-toggle";
import { Flag } from "lucide-react";

export default async function FeatureFlagsPage() {
  await requirePlatformUser();
  const { data: flags } = await getFeatureFlagsAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Feature Flags</h1>
        <p className="mt-0.5 text-sm text-white/40">
          Control which features are available platform-wide. Changes take effect immediately.
        </p>
      </div>

      <div className="rounded-xl border border-[#30363d] divide-y divide-[#30363d] overflow-hidden">
        {(flags ?? []).length === 0 && (
          <div className="px-5 py-8 text-center text-white/30">No feature flags configured.</div>
        )}
        {(flags ?? []).map((flag) => (
          <div key={flag.key as string} className="flex items-center gap-4 bg-white/[0.02] px-5 py-4 hover:bg-white/[0.03] transition-colors">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00B8D9]/10">
              <Flag className="h-4 w-4 text-[#00B8D9]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-white">{flag.name as string}</span>
                <span className="rounded-full border border-[#30363d] bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-white/30">
                  {flag.key as string}
                </span>
                <span className="rounded-full bg-[#30363d] px-2 py-0.5 text-[10px] text-white/40">
                  {flag.scope as string}
                </span>
              </div>
              {!!flag.description && (
                <div className="mt-0.5 text-[12px] text-white/35">{flag.description as string}</div>
              )}
            </div>
            <FlagToggle flagKey={flag.key as string} enabled={flag.enabled as boolean} />
          </div>
        ))}
      </div>
    </div>
  );
}
