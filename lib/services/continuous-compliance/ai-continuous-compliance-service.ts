"use server";

import { getAI, AI_MODEL, isAIConfigured } from "@/lib/providers/ai";
import { db } from "@/lib/db";
import { aiComplianceInsights } from "@/lib/db/schema";
import { and, eq, gt } from "drizzle-orm";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function getCached(orgId: string, insightType: string, targetId: string) {
  const cutoff = new Date(Date.now() - CACHE_TTL_MS);
  const rows = await db.select().from(aiComplianceInsights)
    .where(and(
      eq(aiComplianceInsights.organizationId, orgId),
      eq(aiComplianceInsights.insightType, insightType),
      eq(aiComplianceInsights.targetId, targetId),
      gt(aiComplianceInsights.generatedAt, cutoff)
    )).limit(1);
  return rows[0]?.content ?? null;
}

async function saveCache(orgId: string, insightType: string, targetId: string, content: string) {
  await db.insert(aiComplianceInsights).values({
    organizationId: orgId,
    insightType,
    targetId,
    content,
    generatedAt: new Date(),
  }).onConflictDoNothing();
}

export async function generateComplianceSummary(orgId: string, context: {
  totalChecks: number; passingChecks: number; failingChecks: number;
  checkPassRate: number; openSignals: number; healthScore?: number | null;
}): Promise<string> {
  if (!isAIConfigured()) return "AI not configured.";
  const cached = await getCached(orgId, "cc_summary", orgId);
  if (cached) return cached;

  const ai = getAI();
  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents: [{
      role: "user",
      parts: [{
        text: `You are the AUDT Continuous Compliance AI Officer. Generate a concise executive summary (3-4 sentences) for the board.

Compliance metrics:
- Total checks: ${context.totalChecks}
- Passing: ${context.passingChecks} (${context.checkPassRate}% pass rate)
- Failing: ${context.failingChecks}
- Open signals: ${context.openSignals}
- Health score: ${context.healthScore ?? "Not computed"}

Focus on compliance posture, key risks, and top 2 recommended actions. Be direct and professional.`
      }]
    }],
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (text) await saveCache(orgId, "cc_summary", orgId, text);
  return text;
}

export async function chat(orgId: string, messages: Array<{ role: string; content: string }>, context: {
  totalChecks: number; passingChecks: number; failingChecks: number;
  openSignals: number; healthScore?: number | null;
}): Promise<string> {
  if (!isAIConfigured()) return "AI not configured. Please set GEMINI_API_KEY.";

  const ai = getAI();
  const systemContext = `You are the AUDT AI Compliance Officer. You help organizations maintain continuous compliance.

Current compliance state:
- ${context.totalChecks} total checks, ${context.passingChecks} passing (${context.failingChecks} failing)
- ${context.openSignals} open compliance signals
- Health score: ${context.healthScore ?? "N/A"}

Answer questions about compliance checks, signals, access reviews, attestations, and training. Be concise.`;

  const contents = [
    { role: "user" as const, parts: [{ text: systemContext }] },
    { role: "model" as const, parts: [{ text: "Understood. I'm ready to assist with continuous compliance." }] },
    ...messages.map(m => ({
      role: m.role === "user" ? "user" as const : "model" as const,
      parts: [{ text: m.content }],
    })),
  ];

  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents,
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });
  return result.candidates?.[0]?.content?.parts?.[0]?.text ?? "Unable to generate response.";
}

export async function generateCheckRemediation(checkName: string, result: string, details: Record<string, unknown>): Promise<string> {
  if (!isAIConfigured()) return "AI not configured.";
  const ai = getAI();
  const res = await ai.models.generateContent({
    model: AI_MODEL,
    contents: [{
      role: "user",
      parts: [{
        text: `Generate a concise remediation guide (3-5 bullet points) for this compliance check failure.

Check: ${checkName}
Result: ${result}
Details: ${JSON.stringify(details)}

Provide specific, actionable steps. Format as bullet points.`
      }]
    }],
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });
  return res.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}
