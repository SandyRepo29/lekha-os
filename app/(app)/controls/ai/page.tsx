export const dynamic = "force-dynamic";

import { Bot, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { findAllControls } from "@/backend/src/modules/control-center/control-center-repo";
import { getDashboardMetrics } from "@/backend/src/modules/control-center/control-center-service";
import { generateExecutiveSummary, detectControlGaps } from "@/backend/src/modules/control-center/ai-control-service";
import { ControlAiChat } from "@/components/controls/control-ai-chat";

export default async function ControlAiPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card className="p-6">
        <p className="text-sm text-[var(--color-ink-dim)]">Connect Supabase to use Control Copilot™.</p>
      </Card>
    );
  }

  const [controls, metrics] = await Promise.all([
    findAllControls(session.org.id),
    getDashboardMetrics(session.org.id),
  ]);

  const [executiveSummary, gapAnalysis] = await Promise.all([
    generateExecutiveSummary(session.org.id, metrics).catch(() => null),
    detectControlGaps(session.org.id, controls).catch(() => null),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold flex items-center gap-2">
          <Bot className="h-5 w-5 text-[var(--color-blue)]" />
          Control Copilot™
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          AI-powered analysis of your control library, health posture, and governance connections
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Executive Summary */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Bot className="h-4 w-4 text-[var(--color-blue)]" />
            Executive Summary
          </h2>
          {executiveSummary ? (
            <div className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap">
              {executiveSummary}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-ink-dim)]">
              {controls.length === 0
                ? "Add controls to generate an executive summary."
                : "Unable to generate summary. Check AI configuration."}
            </p>
          )}
        </Card>

        {/* Gap Analysis */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Bot className="h-4 w-4 text-orange-400" />
            AI Gap Detection
          </h2>
          {gapAnalysis ? (
            <div className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap">
              {gapAnalysis}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-ink-dim)]">
              {controls.length === 0
                ? "Add controls to detect gaps."
                : "No gaps detected or AI unavailable."}
            </p>
          )}
        </Card>
      </div>

      {/* Chat */}
      <Card>
        <div className="p-4 border-b border-[var(--color-line)]">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Bot className="h-4 w-4 text-[var(--color-blue)]" />
            Control Copilot™ Chat
          </h2>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">
            Ask about your controls, health, coverage, and improvements
          </p>
        </div>
        <ControlAiChat />
      </Card>
    </div>
  );
}
