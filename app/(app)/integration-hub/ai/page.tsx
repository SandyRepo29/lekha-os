export const dynamic = "force-dynamic";

import { Sparkles, RefreshCw, Target, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { generateIntegrationSummary, getConnectorRecommendations, analyzeCoverageGaps } from "@/lib/services/integration-hub/ai-integration-service";
import { IntegrationAiChat } from "@/components/integration-hub/integration-ai-chat";

export default async function IntegrationAiPage() {
  const session = await requireUser();
  if (!session.org) return null;
  const orgId = session.org.id;

  const [summary, recommendations, gaps] = await Promise.all([
    generateIntegrationSummary(orgId).catch(() => null),
    getConnectorRecommendations(orgId).catch(() => null),
    analyzeCoverageGaps(orgId).catch(() => null),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[var(--color-blue)]" /> AI Integration Advisor™
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">
          AI-powered analysis of your integration health, coverage gaps, and connector recommendations.
        </p>
      </div>

      {/* Executive Summary */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--color-blue)]" /> Integration Health Summary
        </h2>
        {summary ? (
          <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed whitespace-pre-wrap">{summary}</p>
        ) : (
          <p className="text-sm text-[var(--color-ink-faint)]">Connect integrations to generate an AI health summary.</p>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recommendations */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-green-400" /> Connector Recommendations™
          </h2>
          {recommendations ? (
            <div className="text-sm text-[var(--color-ink-dim)] leading-relaxed whitespace-pre-wrap">{recommendations}</div>
          ) : (
            <p className="text-sm text-[var(--color-ink-faint)]">No recommendations available yet.</p>
          )}
        </Card>

        {/* Coverage Gaps */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Search className="h-4 w-4 text-orange-400" /> Coverage Gap Analysis™
          </h2>
          {gaps ? (
            <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed whitespace-pre-wrap">{gaps}</p>
          ) : (
            <p className="text-sm text-[var(--color-ink-faint)]">Connect integrations to see coverage gap analysis.</p>
          )}
        </Card>
      </div>

      {/* NL Chat */}
      <IntegrationAiChat />
    </div>
  );
}
