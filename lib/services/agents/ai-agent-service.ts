"use server";

import { getAI, AI_MODEL, isAIConfigured } from "@/lib/providers/ai";
import { db } from "@/lib/db";
import { aiComplianceInsights } from "@/lib/db/schema";
import { and, eq, gt } from "drizzle-orm";
import * as repo from "@/lib/repositories/agents-repo";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ---------------------------------------------------------------------------
// generateAgentSummary
// ---------------------------------------------------------------------------
export async function generateAgentSummary(
  orgId: string,
  context: {
    totalAgents: number;
    activeAgents: number;
    totalRuns: number;
    successRate: number;
    totalObservations: number;
    pendingApprovals: number;
  }
): Promise<string> {
  const insightType = "agent_summary";
  const cutoff = new Date(Date.now() - CACHE_TTL_MS);

  // Check cache
  const [cached] = await db
    .select()
    .from(aiComplianceInsights)
    .where(
      and(
        eq(aiComplianceInsights.organizationId, orgId),
        eq(aiComplianceInsights.insightType, insightType),
        eq(aiComplianceInsights.targetId, orgId),
        gt(aiComplianceInsights.generatedAt, cutoff)
      )
    )
    .limit(1);

  if (cached) return cached.content;

  if (!isAIConfigured()) {
    return "AI is not configured. Please set GEMINI_API_KEY to enable governance agent summaries.";
  }

  const ai = getAI();
  const prompt = `You are AUDT's Governance AI. Generate a 3-4 sentence executive summary of autonomous governance activity for board reporting.

Governance Agent Stats:
- Total Agents: ${context.totalAgents}
- Active Agents: ${context.activeAgents}
- Total Runs: ${context.totalRuns}
- Success Rate: ${context.successRate.toFixed(1)}%
- Total Observations: ${context.totalObservations}
- Pending Approvals: ${context.pendingApprovals}

Write a concise, professional executive summary suitable for a board report. Highlight key governance automation activity, effectiveness, and any items requiring attention.`;

  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const content = result.text ?? "Unable to generate summary.";

  // Upsert cache
  await db
    .insert(aiComplianceInsights)
    .values({
      organizationId: orgId,
      insightType,
      targetId: orgId,
      content,
      generatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        aiComplianceInsights.organizationId,
        aiComplianceInsights.insightType,
        aiComplianceInsights.targetId,
      ],
      set: { content, generatedAt: new Date() },
    });

  return content;
}

// ---------------------------------------------------------------------------
// generateCopilotResponse
// ---------------------------------------------------------------------------
export async function generateCopilotResponse(
  orgId: string,
  userId: string,
  message: string,
  history: Array<{ role: string; content: string }>,
  agentContext?: {
    totalAgents: number;
    activeAgents: number;
    recentObservations: Array<{ title: string; severity: string }>;
    pendingActions: Array<{ title: string; actionType: string }>;
  }
): Promise<string> {
  if (!isAIConfigured()) {
    return "AI is not configured. Please set GEMINI_API_KEY to enable the Governance Copilot™.";
  }

  const ai = getAI();

  const systemContext = agentContext
    ? `
Current governance agent context:
- Total Agents: ${agentContext.totalAgents}
- Active Agents: ${agentContext.activeAgents}
- Recent Observations: ${agentContext.recentObservations.map((o) => `${o.title} (${o.severity})`).join(", ") || "None"}
- Pending Actions: ${agentContext.pendingActions.map((a) => `${a.title} (${a.actionType})`).join(", ") || "None"}
`
    : "";

  const systemPrompt = `You are the AUDT Governance Copilot™, an autonomous governance AI. You help users understand governance risks, agent activity, and recommended actions across all AUDT modules. Be concise, professional, and actionable.${systemContext}`;

  // Build conversation contents
  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Understood. I'm ready to assist with governance insights." }] },
    ...history.map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents,
  });

  return result.text ?? "I was unable to generate a response. Please try again.";
}

// ---------------------------------------------------------------------------
// generateAgentInsight
// ---------------------------------------------------------------------------
export async function generateAgentInsight(
  orgId: string,
  agentType: string,
  context: string
): Promise<{
  observations: Array<{
    title: string;
    description: string;
    severity: string;
    observationType: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    reasoning: string;
    priority: string;
    confidenceScore: number;
    suggestedActions: string[];
  }>;
}> {
  if (!isAIConfigured()) {
    return { observations: [], recommendations: [] };
  }

  const ai = getAI();

  const prompt = `You are the AUDT Governance Agent Engine. Analyze the following governance context for a "${agentType}" agent and return structured JSON with observations and recommendations.

Context:
${context}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "observations": [
    {
      "title": "short title",
      "description": "detailed description",
      "severity": "critical|high|medium|low|info",
      "observationType": "risk_detected|control_gap|compliance_gap|vendor_issue|policy_violation|anomaly|improvement"
    }
  ],
  "recommendations": [
    {
      "title": "short title",
      "description": "detailed description",
      "reasoning": "why this is recommended",
      "priority": "critical|high|medium|low",
      "confidenceScore": 0.85,
      "suggestedActions": ["action 1", "action 2"]
    }
  ]
}

Generate 2-4 observations and 2-3 recommendations based on the context. Be specific and actionable.`;

  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const raw = result.text ?? "{}";

  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      observations: Array.isArray(parsed.observations) ? parsed.observations : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch {
    return { observations: [], recommendations: [] };
  }
}

// ---------------------------------------------------------------------------
// generateRecommendationReasoning
// ---------------------------------------------------------------------------
export async function generateRecommendationReasoning(recommendation: {
  title: string;
  description: string;
  priority: string;
  impact: string;
}): Promise<string> {
  if (!isAIConfigured()) {
    return "AI is not configured. Please set GEMINI_API_KEY to enable recommendation reasoning.";
  }

  const ai = getAI();

  const prompt = `Generate a concise 1-2 sentence reasoning explanation for this governance recommendation.

Title: ${recommendation.title}
Description: ${recommendation.description}
Priority: ${recommendation.priority}
Impact: ${recommendation.impact}

Write the reasoning from the perspective of a governance risk expert. Be specific about why this action is needed and what risk it mitigates.`;

  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  return result.text ?? "This recommendation addresses a governance gap that requires immediate attention.";
}
