import { getAI, AI_MODEL, isAIConfigured } from "@/lib/providers/ai";
import { db } from "@/lib/db";
import { aiComplianceInsights } from "@/lib/db/schema";
import { and, eq, gt } from "drizzle-orm";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function getCached(orgId: string, insightType: string, targetId: string) {
  const cutoff = new Date(Date.now() - CACHE_TTL_MS);
  const [row] = await db
    .select()
    .from(aiComplianceInsights)
    .where(
      and(
        eq(aiComplianceInsights.organizationId, orgId),
        eq(aiComplianceInsights.insightType, insightType),
        eq(aiComplianceInsights.targetId, targetId),
        gt(aiComplianceInsights.generatedAt, cutoff)
      )
    )
    .limit(1);
  return row?.content ?? null;
}

async function saveCache(orgId: string, insightType: string, targetId: string, content: string) {
  await db
    .insert(aiComplianceInsights)
    .values({ organizationId: orgId, insightType, targetId, content, generatedAt: new Date() })
    .onConflictDoUpdate({
      target: [aiComplianceInsights.organizationId, aiComplianceInsights.insightType, aiComplianceInsights.targetId],
      set: { content, generatedAt: new Date() },
    });
}

// ─── Executive Summary ────────────────────────────────────────────────────────

export async function generateRegulatoryAdvisorySummary(
  orgId: string,
  context: {
    totalRegulations: number;
    newChanges: number;
    openAlerts: number;
    openObligations: number;
    openTasks: number;
    readinessScore: number;
  }
): Promise<string> {
  const cached = await getCached(orgId, "regulatory_summary", orgId);
  if (cached) return cached;

  if (!isAIConfigured()) return "AI is not configured. Please set GEMINI_API_KEY.";

  const ai = getAI();
  const prompt = `You are AUDT's Regulatory Intelligence AI. Generate a 3-4 sentence executive summary of the organization's regulatory compliance posture.

Regulatory Intelligence Stats:
- Applicable Regulations: ${context.totalRegulations}
- New Unreviewed Changes: ${context.newChanges}
- Open Regulatory Alerts: ${context.openAlerts}
- Open Obligations: ${context.openObligations}
- Open Tasks: ${context.openTasks}
- Regulatory Readiness Score: ${context.readinessScore}%

Write a concise, professional summary for a board report. Highlight exposure, readiness, and urgent items.`;

  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const content = result.text ?? "Unable to generate summary.";
  await saveCache(orgId, "regulatory_summary", orgId, content);
  return content;
}

// ─── Change Analyzer ──────────────────────────────────────────────────────────

export async function analyzeRegulatoryChange(
  orgId: string,
  change: { id: string; title: string; description?: string; changeType: string; severity: string }
): Promise<{ summary: string; keyChanges: string[]; requiredActions: string[]; impactAreas: string[] }> {
  const cached = await getCached(orgId, "reg_change_analysis", change.id);
  if (cached) {
    try { return JSON.parse(cached); } catch { /* fall through */ }
  }

  if (!isAIConfigured()) {
    return { summary: "AI not configured.", keyChanges: [], requiredActions: [], impactAreas: [] };
  }

  const ai = getAI();
  const prompt = `Analyze this regulatory change and return structured JSON:

Change: ${change.title}
Type: ${change.changeType}
Severity: ${change.severity}
Description: ${change.description ?? "N/A"}

Return ONLY valid JSON:
{
  "summary": "2-3 sentence plain-language summary",
  "keyChanges": ["change 1", "change 2", "change 3"],
  "requiredActions": ["action 1", "action 2", "action 3"],
  "impactAreas": ["area 1", "area 2"]
}`;

  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const raw = result.text ?? "{}";
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    await saveCache(orgId, "reg_change_analysis", change.id, JSON.stringify(parsed));
    return parsed;
  } catch {
    return { summary: raw.slice(0, 300), keyChanges: [], requiredActions: [], impactAreas: [] };
  }
}

// ─── Obligation Extractor ─────────────────────────────────────────────────────

export async function extractObligations(
  orgId: string,
  regulationText: string,
  regulationName: string
): Promise<Array<{ title: string; description: string; priority: string; category: string; requirement: string }>> {
  if (!isAIConfigured()) return [];

  const ai = getAI();
  const prompt = `Extract compliance obligations from this regulatory text for ${regulationName}.

Text: ${regulationText.slice(0, 3000)}

Return ONLY valid JSON array:
[
  {
    "title": "short obligation title",
    "description": "what this obligation requires",
    "priority": "high|medium|low",
    "category": "data_protection|access_control|reporting|training|governance|other",
    "requirement": "specific requirement text"
  }
]

Extract up to 10 clear, actionable obligations.`;

  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const raw = result.text ?? "[]";
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── Control Mapper ───────────────────────────────────────────────────────────

export async function suggestControlMappings(
  orgId: string,
  obligation: { title: string; description?: string; requirement?: string }
): Promise<Array<{ controlType: string; controlCategory: string; rationale: string; priority: string }>> {
  if (!isAIConfigured()) return [];

  const ai = getAI();
  const prompt = `Suggest governance controls that would satisfy this regulatory obligation.

Obligation: ${obligation.title}
Description: ${obligation.description ?? ""}
Requirement: ${obligation.requirement ?? ""}

Return ONLY valid JSON array:
[
  {
    "controlType": "technical|administrative|physical",
    "controlCategory": "access_control|data_protection|monitoring|training|governance|incident_response",
    "rationale": "why this control satisfies the obligation",
    "priority": "high|medium|low"
  }
]

Suggest 3-5 controls.`;

  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const raw = result.text ?? "[]";
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

// ─── Compliance Horizon ───────────────────────────────────────────────────────

export async function generateComplianceHorizon(
  orgId: string,
  regulations: Array<{ name: string; category: string; country: string }>
): Promise<{ emerging: string[]; deadlines: string[]; trends: string[]; recommendations: string[] }> {
  const cached = await getCached(orgId, "reg_horizon", orgId);
  if (cached) {
    try { return JSON.parse(cached); } catch { /* fall through */ }
  }

  if (!isAIConfigured()) {
    return { emerging: [], deadlines: [], trends: [], recommendations: [] };
  }

  const ai = getAI();
  const regList = regulations.map(r => `${r.name} (${r.category}, ${r.country})`).join("\n");
  const prompt = `Based on these applicable regulations and current regulatory trends, generate a Compliance Horizon forecast:

Applicable Regulations:
${regList}

Return ONLY valid JSON:
{
  "emerging": ["upcoming regulation 1", "upcoming regulation 2"],
  "deadlines": ["deadline 1", "deadline 2"],
  "trends": ["trend 1", "trend 2", "trend 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

Focus on AI regulation, privacy law, and financial regulation trends for 2025-2026.`;

  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const raw = result.text ?? "{}";
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    await saveCache(orgId, "reg_horizon", orgId, JSON.stringify(parsed));
    return parsed;
  } catch {
    return { emerging: [], deadlines: [], trends: [], recommendations: [] };
  }
}

// ─── NL Chat ─────────────────────────────────────────────────────────────────

export async function chat(
  orgId: string,
  message: string,
  history: Array<{ role: string; content: string }>,
  context?: {
    totalRegulations: number;
    newChanges: number;
    openAlerts: number;
    openObligations: number;
  }
): Promise<string> {
  if (!isAIConfigured()) return "AI is not configured. Please set GEMINI_API_KEY.";

  const ai = getAI();
  const contextStr = context
    ? `\nCurrent regulatory posture: ${context.totalRegulations} regulations tracked, ${context.newChanges} new changes, ${context.openAlerts} open alerts, ${context.openObligations} open obligations.`
    : "";

  const systemPrompt = `You are AUDT's Regulatory Intelligence Advisor™. You help compliance teams understand regulations, track changes, manage obligations, and assess regulatory exposure. Be concise, professional, and actionable.${contextStr}`;

  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Understood. I'm ready to help with regulatory intelligence." }] },
    ...history.map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const result = await ai.models.generateContent({ model: AI_MODEL, contents });
  return result.text ?? "Unable to generate a response. Please try again.";
}
