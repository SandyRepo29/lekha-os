"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { UsageWarning } from "@/lib/billing/usage";

interface UsageWarningBannerProps {
  warnings: UsageWarning[];
}

export function UsageWarningBanner({ warnings }: UsageWarningBannerProps) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((w) => (
        <div
          key={w.resource}
          className={[
            "flex items-center gap-3 rounded-xl border p-3",
            w.level === "critical"
              ? "border-red-500/30 bg-red-500/[0.05] text-red-300"
              : "border-amber-500/30 bg-amber-500/[0.05] text-amber-300",
          ].join(" ")}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="flex-1 text-sm">
            {w.level === "critical" ? (
              <>
                You&#8217;ve used <strong>{w.pct}%</strong> of your {w.resource} limit ({w.current}/{w.limit} used).
                Create operations will be blocked at 100%.
              </>
            ) : (
              <>
                You&#8217;re at <strong>{w.pct}%</strong> of your {w.resource} limit ({w.current}/{w.limit} used).
                Upgrade to avoid disruption.
              </>
            )}
          </p>
          <Link
            href="/settings/billing"
            className="shrink-0 rounded-lg border border-current px-3 py-1 text-xs font-medium hover:bg-white/[0.06] transition-colors"
          >
            Upgrade Plan
          </Link>
        </div>
      ))}
    </div>
  );
}
