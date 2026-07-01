﻿export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/asset-intelligence/asset-service";
import { generateAdvisorySummary } from "@/lib/services/asset-intelligence/ai-asset-service";
import { AssetSubNav } from "@/components/asset-intelligence/asset-ui";
import { AssetAiChat } from "@/components/asset-intelligence/asset-ai-chat";
import { Brain } from "lucide-react";

export default async function AssetAiPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const { metrics, byType } = await getDashboardData(orgId).catch(() => ({
    metrics: { totalAssets: 0, criticalAssets: 0, openAlerts: 0, assetsWithPii: 0, totalAlerts: 0, activeAssets: 0 },
    byType:  [],
  }));

  const topTypes = (byType as any[]).slice(0, 4).map((r: any) => r.type as string);
  const advisory = await generateAdvisorySummary(orgId, {
    totalAssets:    metrics.totalAssets,
    criticalAssets: metrics.criticalAssets,
    openAlerts:     metrics.openAlerts,
    assetsWithPii:  metrics.assetsWithPii,
    topTypes,
  }).catch(() => null);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Asset Intelligence Copilot™</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">AI-powered insights on critical assets, vendor concentration risk, dependency chains, and governance gaps.</p>
      </div>

      <AssetSubNav />

      {/* Advisory Summary */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--color-blue)]/10">
            <Brain className="h-4 w-4 text-[var(--color-blue)]" />
          </span>
          <div>
            <h2 className="font-semibold text-sm">Asset Intelligence Advisory</h2>
            <p className="text-xs text-[var(--color-ink-dim)]">Governance-focused AI advisory · refreshes every 24 hours</p>
          </div>
        </div>
        {advisory ? (
          <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed whitespace-pre-wrap">{advisory}</p>
        ) : (
          <p className="text-sm text-[var(--color-ink-dim)]">
            Configure your Gemini API key to enable AI-powered asset advisory. Add assets to your inventory to get started.
          </p>
        )}
      </div>

      {/* Suggested Questions */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
        <h2 className="font-semibold text-sm mb-3">Suggested Questions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            "Which assets depend on AWS?",
            "Which critical assets contain PII?",
            "Which assets have low vendor trust?",
            "Show assets with compliance gaps.",
            "Which assets would be impacted if this vendor becomes unavailable?",
            "Which assets are missing controls?",
            "Show me assets with the highest vendor concentration risk.",
            "Which assets need immediate governance attention?",
          ].map(q => (
            <button key={q} data-question={q}
              className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:border-[var(--color-blue)]/40 transition-colors">
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <AssetAiChat context={{ totalAssets: metrics.totalAssets, criticalAssets: metrics.criticalAssets, openAlerts: metrics.openAlerts, assetsWithPii: metrics.assetsWithPii }} />
    </div>
  );
}

