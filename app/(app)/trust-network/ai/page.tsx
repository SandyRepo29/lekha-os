export const dynamic = "force-dynamic";

import { Zap, Network, TrendingUp, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getNetworkDashboard } from "@/lib/services/trust-network/trust-network-service";
import {
  generateNetworkSummary,
  generateNetworkRecommendations,
} from "@/lib/services/trust-network/ai-trust-network-service";
import { TrustNetworkAiChat } from "@/components/trust-network/trust-network-ai-chat";

const IMPACT_COLOR = { high: "text-red-700", medium: "text-yellow-700", low: "text-green-700" };
const EFFORT_COLOR = { high: "text-red-700", medium: "text-yellow-700", low: "text-green-700" };

export default async function TrustNetworkAiPage() {
  const session = await requireUser();
  if (!session.org) return null;
  const orgId = session.org.id;

  const dashboard = await getNetworkDashboard(orgId);
  const { reputation, metrics, benchmarking, automation } = dashboard;

  const aiContext = {
    reputationScore: reputation.score,
    reputationLevel: reputation.level,
    profileCompleteness: metrics.profileCompleteness,
    activeBadges: metrics.activeBadges,
    activeRelationships: metrics.activeRelationships,
    benchmarkPercentile: benchmarking.percentile,
    maturityLabel: benchmarking.maturityLevel.label,
    connectedSystems: automation.connectedSystems,
    automationPct: automation.automationPct,
    profileViews30d: metrics.profileViews30d,
  };

  const [summary, recommendations] = await Promise.all([
    generateNetworkSummary(orgId, aiContext),
    generateNetworkRecommendations(orgId, {
      reputationScore: reputation.score,
      profileCompleteness: metrics.profileCompleteness,
      activeBadges: metrics.activeBadges,
      activeRelationships: metrics.activeRelationships,
      automationPct: automation.automationPct,
      benchmarkPercentile: benchmarking.percentile,
    }),
  ]);

  const chatContext = `Trust Network Reputation: ${reputation.score}/100 (${reputation.level}). ` +
    `Profile: ${metrics.profileCompleteness}% complete, ${metrics.activeBadges} badges, ${metrics.activeRelationships} relationships. ` +
    `Benchmark: ${benchmarking.percentile}th percentile (${benchmarking.maturityLevel.label}). ` +
    `Automation: ${automation.automationPct}% coverage, ${automation.connectedSystems} connected systems. ` +
    `Profile views: ${metrics.profileViews30d} (30 days).`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">AI Trust Network Advisor™</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">
          AI-powered strategy to grow your Trust Network presence and reputation.
        </p>
      </div>

      {/* Executive Summary */}
      <Card className="p-6 border-[var(--color-blue)]/25 bg-[var(--color-blue)]/[0.04]">
        <div className="flex items-center gap-2 mb-4">
          <Network className="h-5 w-5 text-[var(--color-blue)]" />
          <h2 className="font-semibold">Network Executive Summary</h2>
        </div>
        <p className="text-sm leading-relaxed text-[var(--color-ink-dim)]">{summary}</p>
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-[var(--color-line)]">
          <div className="text-center">
            <p className={`text-2xl font-black ${reputation.color}`}>{reputation.score}</p>
            <p className="text-xs text-[var(--color-ink-faint)]">Reputation Score</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-purple-700">{benchmarking.percentile > 0 ? `${benchmarking.percentile}th` : "—"}</p>
            <p className="text-xs text-[var(--color-ink-faint)]">Industry Percentile</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-pink-700">{automation.automationPct}%</p>
            <p className="text-xs text-[var(--color-ink-faint)]">Automation Coverage</p>
          </div>
        </div>
      </Card>

      {/* Improvement Plan */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-emerald-700" />
          <h2 className="font-semibold">Network Improvement Plan™</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {recommendations.map((rec, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="font-semibold text-sm flex-1">{rec.action}</p>
                <div className="flex gap-2 flex-shrink-0">
                  <span className={`text-xs font-medium ${IMPACT_COLOR[rec.impact] ?? "text-[var(--color-ink-dim)]"}`}>
                    {rec.impact} impact
                  </span>
                  <span className="text-xs text-[var(--color-ink-faint)]">·</span>
                  <span className={`text-xs font-medium ${EFFORT_COLOR[rec.effort] ?? "text-[var(--color-ink-dim)]"}`}>
                    {rec.effort} effort
                  </span>
                </div>
              </div>
              <p className="text-xs text-[var(--color-ink-dim)] leading-relaxed">{rec.detail}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* AI Chat */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-[var(--color-blue)]" />
          <h2 className="font-semibold">Governance Copilot™ — Trust Network Mode</h2>
        </div>
        <TrustNetworkAiChat context={chatContext} />
      </div>
    </div>
  );
}
