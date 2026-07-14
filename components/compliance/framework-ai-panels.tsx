"use client";

/**
 * Wires the existing AiInsightPanel to the compliance AI actions.
 * One component per insight type — each calls its own server action.
 */
import { AiInsightPanel } from "@/components/ai/ai-insight-panel";
import {
  generateFrameworkSummaryAction,
  generateReadinessExplanationAction,
  generateGapNarrativeAction,
} from "@/backend/src/modules/compliance/actions";

interface InsightProps {
  frameworkId: string;
  content: string | null;
  generatedAt: Date | null;
  aiEnabled: boolean;
}

export function FrameworkSummaryPanel(p: InsightProps) {
  return (
    <AiInsightPanel
      title="Framework Summary"
      content={p.content}
      generatedAt={p.generatedAt}
      aiEnabled={p.aiEnabled}
      onGenerate={() => generateFrameworkSummaryAction(p.frameworkId)}
      defaultOpen={!p.content}
    />
  );
}

export function ReadinessExplanationPanel(p: InsightProps) {
  return (
    <AiInsightPanel
      title="Readiness Explanation"
      content={p.content}
      generatedAt={p.generatedAt}
      aiEnabled={p.aiEnabled}
      onGenerate={() => generateReadinessExplanationAction(p.frameworkId)}
    />
  );
}

export function GapNarrativePanel(p: InsightProps) {
  return (
    <AiInsightPanel
      title="Gap Analysis Narrative"
      content={p.content}
      generatedAt={p.generatedAt}
      aiEnabled={p.aiEnabled}
      onGenerate={() => generateGapNarrativeAction(p.frameworkId)}
    />
  );
}
