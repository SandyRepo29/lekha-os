import { getAI, AI_MODEL, isAIConfigured } from "@/lib/providers/ai";
import { db } from "@/lib/db";
import { aiComplianceInsights } from "@/lib/db/schema";
import { and, eq, gt } from "drizzle-orm";
import type { ControlWithMeta } from "@/backend/src/modules/control-center/control-center-repo";
import type { ControlHealthBreakdown } from "@/backend/src/modules/control-center/control-health";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// ─── Control Narrative ───────────────────────────────────────────────────────

export async function generateControlNarrative(
  orgId: string,
  control: ControlWithMeta,
  health: ControlHealthBreakdown
): Promise<string> {
  if (!isAIConfigured()) return "AI is not configured.";

  const cacheKey = `control_narrative_${control.id}`;
  const cached = await getCached(orgId, cacheKey, control.id);
  if (cached) return cached;

  const ai = getAI();
  const prompt = `You are a GRC expert. Analyse this control and its health data.

Control: ${control.controlRef} — ${control.name}
Description: ${control.description ?? "N/A"}
Objective: ${control.objective ?? "N/A"}
Category: ${control.category ?? "N/A"}
Type: ${control.controlType ?? "N/A"}
Status: ${control.status}
Health Score: ${health.overall}/100 (${health.level})

Component Scores:
- Evidence Coverage: ${health.components.evidence}/100
- Testing Results: ${health.components.testing}/100
- Audit Performance: ${health.components.audit}/100
- Policy Support: ${health.components.policy}/100
- Review Freshness: ${health.components.freshness}/100
- Risk Reduction: ${health.components.riskReduction}/100

Strengths: ${health.strengths.join(", ") || "None identified"}
Concerns: ${health.concerns.join(", ") || "None identified"}

Write a concise 2–3 paragraph executive narrative about this control's health, effectiveness, and recommended actions. Be specific and actionable.`;

  const result = await ai.models.generateContent({ model: AI_MODEL, contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: 0 } }, });
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  await saveCache(orgId, cacheKey, control.id, text);
  return text;
}

// ─── Executive Summary ───────────────────────────────────────────────────────

export async function generateExecutiveSummary(orgId: string, metrics: {
  total: number;
  healthy: number;
  weak: number;
  avgHealth: number;
  coverage: number;
  overdueTests: number;
}): Promise<string> {
  if (!isAIConfigured()) return "AI is not configured.";

  const cacheKey = `control_executive_summary`;
  const cached = await getCached(orgId, cacheKey, orgId);
  if (cached) return cached;

  const ai = getAI();
  const prompt = `You are a Chief Risk Officer. Write a board-ready executive summary of the organisation's Control Center™ posture.

Control Metrics:
- Total Controls: ${metrics.total}
- Healthy Controls (≥80): ${metrics.healthy}
- Weak Controls (<60): ${metrics.weak}
- Average Health Score: ${metrics.avgHealth}/100
- Implementation Coverage: ${metrics.coverage}%
- Overdue Tests: ${metrics.overdueTests}

Write 3–4 paragraphs covering: overall control posture, key strengths, critical gaps, and recommended priorities. Use executive language suitable for a board report.`;

  const result = await ai.models.generateContent({ model: AI_MODEL, contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: 0 } }, });
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  await saveCache(orgId, cacheKey, orgId, text);
  return text;
}

// ─── AI Gap Detection ────────────────────────────────────────────────────────

export async function detectControlGaps(orgId: string, controls: ControlWithMeta[]): Promise<string> {
  if (!isAIConfigured()) return "AI is not configured.";
  if (controls.length === 0) return "No controls to analyse.";

  const ai = getAI();
  const weakControls = controls.filter((c) => (c.healthScore ?? 0) < 70).slice(0, 20);
  const prompt = `You are a GRC analyst. Identify and explain the top gaps in this organisation's control framework.

Weak Controls (Health < 70):
${weakControls.map((c) => `- ${c.controlRef}: ${c.name} | Status: ${c.status} | Health: ${c.healthScore ?? "Not computed"} | Evidence: ${c.evidenceCount} items | Tests: ${c.testCount}`).join("\n")}

Total controls: ${controls.length}
Controls without evidence: ${controls.filter((c) => c.evidenceCount === 0).length}
Controls not implemented: ${controls.filter((c) => c.status === "not_implemented").length}

List the top 5 gaps with specific recommended actions for each. Be concrete.`;

  const result = await ai.models.generateContent({ model: AI_MODEL, contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: 0 } }, });
  return result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ─── AI Chat ─────────────────────────────────────────────────────────────────

export async function chat(orgId: string, messages: { role: "user" | "model"; text: string }[], controls: ControlWithMeta[]): Promise<string> {
  if (!isAIConfigured()) return "AI is not configured.";

  const ai = getAI();

  const systemContext = `You are an AI Control Advisor for AUDT's Control Center™. You have access to this organisation's control library.

Controls summary:
- Total: ${controls.length}
- Implemented: ${controls.filter((c) => c.status === "implemented").length}
- Partially Implemented: ${controls.filter((c) => c.status === "partial").length}
- Not Implemented: ${controls.filter((c) => c.status === "not_implemented").length}
- Avg Health Score: ${controls.length === 0 ? 0 : Math.round(controls.reduce((s, c) => s + (c.healthScore ?? 0), 0) / controls.length)}

Control list:
${controls.slice(0, 50).map((c) => `${c.controlRef}: ${c.name} | ${c.status} | Health: ${c.healthScore ?? "?"} | Category: ${c.category ?? "?"}`).join("\n")}

Answer questions about controls concisely and accurately. If asked about specific controls, reference them by ID and name.`;

  const contents = [
    { role: "user" as const, parts: [{ text: systemContext }] },
    { role: "model" as const, parts: [{ text: "Understood. I'm ready to help with your control questions." }] },
    ...messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
  ];

  try {
    const result = await ai.models.generateContent({
      model: AI_MODEL,
      contents,
      config: { thinkingConfig: { thinkingBudget: 0 } },
    });
    return result.candidates?.[0]?.content?.parts?.[0]?.text ?? "Unable to generate a response.";
  } catch {
    return "The AI advisor is temporarily unavailable — please try again in a moment.";
  }
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

async function getCached(orgId: string, key: string, targetId: string): Promise<string | null> {
  const cutoff = new Date(Date.now() - CACHE_TTL_MS);
  const [row] = await db
    .select({ content: aiComplianceInsights.content })
    .from(aiComplianceInsights)
    .where(
      and(
        eq(aiComplianceInsights.organizationId, orgId),
        eq(aiComplianceInsights.insightType, key),
        eq(aiComplianceInsights.targetId, targetId),
        gt(aiComplianceInsights.generatedAt, cutoff)
      )
    );
  return row?.content ?? null;
}

async function saveCache(orgId: string, key: string, targetId: string, content: string) {
  await db
    .insert(aiComplianceInsights)
    .values({ organizationId: orgId, insightType: key, targetId, content, generatedAt: new Date() })
    .onConflictDoUpdate({
      target: [aiComplianceInsights.organizationId, aiComplianceInsights.insightType, aiComplianceInsights.targetId],
      set: { content, generatedAt: new Date() },
    });
}
