export const dynamic = "force-dynamic";

import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { listFrameworks } from "@/lib/services/compliance/framework-service";
import { getCachedInsight } from "@/lib/services/compliance/ai-compliance-service";
import { AiInsightPanel } from "@/components/ai/ai-insight-panel";
import {
  FrameworkSummaryPanel,
  ReadinessExplanationPanel,
  GapNarrativePanel,
} from "@/components/compliance/framework-ai-panels";
import { AiComplianceChat } from "@/components/compliance/ai-chat";
import {
  generateExecutiveSummaryAction,
} from "@/lib/compliance/actions";

export default async function AiOfficerPage() {
  const session = await requireUser();
  const aiEnabled = isGeminiConfigured();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState
          icon={Sparkles}
          title="Compliance Copilot™"
          description="Connect Supabase to use AI-powered compliance insights."
        />
      </Card>
    );
  }

  const orgId = session.org.id;

  // Load frameworks + cached insights in parallel
  const frameworks = await listFrameworks(orgId);

  const [execInsight, ...frameworkInsights] = await Promise.all([
    getCachedInsight(orgId, "executive_summary", orgId),
    ...frameworks.flatMap((fw) => [
      getCachedInsight(orgId, "framework_summary", fw.id),
      getCachedInsight(orgId, "readiness_explanation", fw.id),
      getCachedInsight(orgId, "gap_summary", fw.id),
    ]),
  ]);

  // Re-chunk per framework: [summary, explanation, gap] × n frameworks
  const perFramework = frameworks.map((fw, i) => ({
    fw,
    summary:     frameworkInsights[i * 3 + 0] ?? null,
    explanation: frameworkInsights[i * 3 + 1] ?? null,
    gap:         frameworkInsights[i * 3 + 2] ?? null,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-blue)]/10">
          <Sparkles className="h-5 w-5 text-[var(--color-blue)]" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Compliance Copilot™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            {aiEnabled
              ? "Gemini-powered insights across all your compliance frameworks."
              : "Add GEMINI_API_KEY to .env.local to enable AI features."}
          </p>
        </div>
      </div>

      {/* Executive summary */}
      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
          Executive Summary
        </h2>
        <Card className="p-5">
          <AiInsightPanel
            title="Organisation Compliance Posture"
            content={execInsight?.content ?? null}
            generatedAt={execInsight?.generatedAt ?? null}
            aiEnabled={aiEnabled}
            onGenerate={generateExecutiveSummaryAction}
            defaultOpen={!execInsight}
          />
        </Card>
      </section>

      {/* Per-framework insights */}
      {frameworks.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
            Framework Insights
          </h2>
          {perFramework.map(({ fw, summary, explanation, gap }) => (
            <Card key={fw.id} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-[family-name:var(--font-display)] font-semibold text-sm">
                    {fw.name}
                  </p>
                  <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">
                    {fw.readiness?.overallScore ?? 0}% readiness · {fw.openGapCount} open gaps
                  </p>
                </div>
              </div>

              <div className="space-y-3 border-t border-[var(--color-line)] pt-3">
                <FrameworkSummaryPanel
                  frameworkId={fw.id}
                  content={summary?.content ?? null}
                  generatedAt={summary?.generatedAt ?? null}
                  aiEnabled={aiEnabled}
                />
                <ReadinessExplanationPanel
                  frameworkId={fw.id}
                  content={explanation?.content ?? null}
                  generatedAt={explanation?.generatedAt ?? null}
                  aiEnabled={aiEnabled}
                />
                <GapNarrativePanel
                  frameworkId={fw.id}
                  content={gap?.content ?? null}
                  generatedAt={gap?.generatedAt ?? null}
                  aiEnabled={aiEnabled}
                />
              </div>
            </Card>
          ))}
        </section>
      )}

      {frameworks.length === 0 && (
        <Card className="p-5">
          <EmptyState
            icon={Sparkles}
            title="No frameworks yet"
            description="Add a compliance framework to generate AI insights."
          />
        </Card>
      )}

      {/* Chat */}
      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
          Ask Compliance Copilot™
        </h2>
        <Card>
          <AiComplianceChat aiEnabled={aiEnabled} />
        </Card>
      </section>
    </div>
  );
}
