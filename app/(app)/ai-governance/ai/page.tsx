export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/ai-governance/ai-governance-service";
import { generateAiGovernanceSummary } from "@/lib/services/ai-governance/ai-copilot-service";
import { Brain, AlertTriangle, ShieldCheck, Bot } from "lucide-react";
import { AiGovernanceChat } from "@/components/ai-governance/ai-governance-chat";
import { AIGovStat } from "@/components/ai-governance/ai-governance-ui";

export default async function AiCopilotPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";

  const [dash, summary] = await Promise.all([
    getDashboardData(orgId).catch(() => null),
    generateAiGovernanceSummary(orgId).catch(() => null),
  ]);
  const m = dash?.metrics;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-[var(--color-blue)]" /> AI Governance Copilot™
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
          AI-powered governance intelligence — executive summary, risk advisory, compliance readiness, and conversational analysis.
        </p>
      </div>

      {/* Governance Summary */}
      {summary && (
        <div className="rounded-xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/[0.04] p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-[var(--color-blue)]">
            <Bot className="h-4 w-4" /> AI Governance Executive Summary
          </h2>
          <p className="text-sm leading-relaxed">{summary.summary}</p>
          {summary.riskHighlights?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-[var(--color-ink-dim)] uppercase tracking-wide mb-2">Risk Highlights</div>
              <ul className="space-y-1">
                {summary.riskHighlights.map((h: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-orange-400 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {summary.recommendations?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-[var(--color-ink-dim)] uppercase tracking-wide mb-2">Recommendations</div>
              <ul className="space-y-1">
                {summary.recommendations.map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <ShieldCheck className="h-3.5 w-3.5 mt-0.5 text-emerald-400 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Metrics context */}
      {m && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AIGovStat label="AI Systems" value={m.totalSystems} accent="neutral" />
          <AIGovStat label="Approved" value={m.approvedSystems} accent="good" />
          <AIGovStat label="High Risk" value={m.highRiskSystems} accent={m.highRiskSystems > 0 ? "warn" : "neutral"} />
          <AIGovStat label="Pending Review" value={m.pendingReview} accent={m.pendingReview > 0 ? "warn" : "neutral"} />
        </div>
      )}

      {/* Chat */}
      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Brain className="h-4 w-4 text-[var(--color-blue)]" /> Governance Copilot™ Chat
        </h2>
        <AiGovernanceChat aiEnabled={!!summary} />
      </div>
    </div>
  );
}
