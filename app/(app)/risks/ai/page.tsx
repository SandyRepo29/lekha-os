export const dynamic = "force-dynamic";

import { Bot, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getCachedExecutiveSummary } from "@/backend/src/modules/risk-lens/ai-risk-service";
import { RiskAiChat } from "@/components/risk/risk-ai-chat";
import { ExecutiveSummaryPanel } from "@/components/risk/executive-summary-panel";
import { formatDate } from "@/components/risk/risk-ui";

export default async function RiskAiPage() {
  const session = await requireUser();

  let cached: { content: string; generatedAt: Date } | null = null;
  if (!session.demo && session.org) {
    cached = await getCachedExecutiveSummary(session.org.id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold flex items-center gap-2">
          <Bot className="h-5 w-5 text-[var(--color-blue)]" /> AI Risk Officer
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Ask anything about your risk posture, get AI-generated executive summaries.</p>
      </div>

      {/* Executive Summary */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--color-blue)]" />
            <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">AI Executive Summary</h2>
          </div>
          <ExecutiveSummaryPanel />
        </div>
        {cached ? (
          <div className="space-y-2">
            <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed whitespace-pre-line">{cached.content}</p>
            <p className="text-xs text-[var(--color-ink-faint)]">Generated {formatDate(cached.generatedAt.toISOString())}</p>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-ink-faint)] italic">Click "Generate" to create an AI executive summary of your risk posture.</p>
        )}
      </Card>

      {/* NL Chat */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-4 w-4 text-[var(--color-blue)]" />
          <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">AI Risk Chat</h2>
        </div>
        <RiskAiChat />
      </Card>
    </div>
  );
}
