import { db } from "@/lib/db";
import { aiComplianceInsights } from "@/lib/db/schema";
import { getAI, AI_MODEL } from "@/lib/providers/ai";
import { eq, and } from "drizzle-orm";
import * as repo from "@/lib/repositories/integration-hub-repo";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function getCached(orgId: string, insightType: string) {
  const [row] = await db
    .select()
    .from(aiComplianceInsights)
    .where(and(eq(aiComplianceInsights.organizationId, orgId), eq(aiComplianceInsights.insightType, insightType), eq(aiComplianceInsights.targetId, orgId)));
  if (!row) return null;
  if (Date.now() - row.generatedAt.getTime() > CACHE_TTL_MS) return null;
  return row.content as string;
}

async function saveCache(orgId: string, insightType: string, content: string) {
  await db
    .insert(aiComplianceInsights)
    .values({ organizationId: orgId, insightType, targetId: orgId, content })
    .onConflictDoUpdate({
      target: [aiComplianceInsights.organizationId, aiComplianceInsights.insightType, aiComplianceInsights.targetId],
      set: { content, generatedAt: new Date() },
    })
    .catch(() => {});
}

// ── Executive Summary ─────────────────────────────────────────────────────────

export async function generateIntegrationSummary(orgId: string, forceRefresh = false): Promise<string> {
  if (!forceRefresh) {
    const cached = await getCached(orgId, "integration_summary");
    if (cached) return cached;
  }

  const ai = getAI();
  if (!ai) return "AI features require GEMINI_API_KEY to be configured.";

  const [metrics, connections] = await Promise.all([
    repo.getDashboardMetrics(orgId),
    repo.getInstancesByOrg(orgId),
  ]);

  const connectorList = connections.map((c) => `${c.connector.name} (${c.instance.status})`).join(", ");

  const prompt = `You are an integration governance advisor for AUDT, an AI-native GRC platform.

Integration Hub™ status for this organization:
- Total connectors configured: ${metrics.total}
- Connected: ${metrics.connected}
- In error state: ${metrics.error}
- Connectors: ${connectorList || "None connected"}
- Evidence collected automatically: ${metrics.totalEvidence}
- Risks generated: ${metrics.totalRisks}
- Open governance events: ${metrics.openEvents} (${metrics.criticalEvents} critical)
- Total sync runs: ${metrics.totalSyncs} (${metrics.failedSyncs} failed)

Write a concise executive summary (3–4 sentences) covering:
1. Overall integration connectivity health
2. Key governance signals collected
3. Critical issues requiring attention
4. One recommendation for improving automation coverage

Return plain text only, no markdown headers.`;

  try {
    const result = await ai.models.generateContent({ model: AI_MODEL, contents: [{ role: "user", parts: [{ text: prompt }] }] });
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "Unable to generate summary.";
    await saveCache(orgId, "integration_summary", text);
    return text;
  } catch {
    return "Unable to generate AI summary at this time.";
  }
}

// ── Connector Recommendations ─────────────────────────────────────────────────

export async function getConnectorRecommendations(orgId: string): Promise<string> {
  const cached = await getCached(orgId, "integration_recommendations");
  if (cached) return cached;

  const ai = getAI();
  if (!ai) return "AI features require GEMINI_API_KEY to be configured.";

  const [connections, allConnectors] = await Promise.all([
    repo.getInstancesByOrg(orgId),
    repo.getAllConnectors(),
  ]);

  const connectedSlugs = connections.map((c) => c.connector.slug);
  const available = allConnectors.filter((c) => !connectedSlugs.includes(c.slug) && c.status === "available");
  const phase1Available = available.filter((c) => c.isPhase1);

  const prompt = `You are an integration advisor for AUDT, a GRC platform.

Currently connected integrations: ${connections.map((c) => c.connector.name).join(", ") || "None"}
Available Phase 1 connectors not yet connected: ${phase1Available.map((c) => `${c.name} (${c.category})`).join(", ") || "All Phase 1 connectors are connected"}

Provide 3–5 specific connector recommendations that would most improve governance automation coverage for a typical SaaS/tech company. For each recommendation explain:
- Which connector to add
- What governance evidence it would collect
- Which compliance controls it would help automate

Format as a brief numbered list. Be practical and specific.`;

  try {
    const result = await ai.models.generateContent({ model: AI_MODEL, contents: [{ role: "user", parts: [{ text: prompt }] }] });
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "Unable to generate recommendations.";
    await saveCache(orgId, "integration_recommendations", text);
    return text;
  } catch {
    return "Unable to generate recommendations at this time.";
  }
}

// ── Coverage Gap Analysis ─────────────────────────────────────────────────────

export async function analyzeCoverageGaps(orgId: string): Promise<string> {
  const ai = getAI();
  if (!ai) return "AI features require GEMINI_API_KEY to be configured.";

  const connections = await repo.getInstancesByOrg(orgId);
  const categories = [...new Set(connections.map((c) => c.connector.category))];
  const missingCategories = ["identity", "cloud", "security", "source_control", "endpoint"].filter(
    (cat) => !categories.includes(cat as never)
  );

  const prompt = `You are a compliance automation analyst for AUDT.

Connected integration categories: ${categories.join(", ") || "none"}
Missing coverage areas: ${missingCategories.join(", ") || "all major areas covered"}

Provide a brief gap analysis (3–4 sentences) identifying:
1. The most significant governance blind spots from missing integration categories
2. Which compliance frameworks (SOC 2, ISO 27001, etc.) are most impacted
3. The highest-priority gap to address first

Be specific and actionable. Plain text only.`;

  try {
    const result = await ai.models.generateContent({ model: AI_MODEL, contents: [{ role: "user", parts: [{ text: prompt }] }] });
    return result.candidates?.[0]?.content?.parts?.[0]?.text ?? "Unable to analyze gaps.";
  } catch {
    return "Unable to generate gap analysis at this time.";
  }
}

// ── NL Chat ───────────────────────────────────────────────────────────────────

export async function chat(orgId: string, userMessage: string, history: { role: "user" | "model"; text: string }[]): Promise<string> {
  const ai = getAI();
  if (!ai) return "AI chat requires GEMINI_API_KEY to be configured.";

  const metrics = await repo.getDashboardMetrics(orgId);
  const connections = await repo.getInstancesByOrg(orgId);

  const systemContext = `You are the AI Integration Advisor™ for AUDT, an AI-native GRC platform. Help users understand their integration health, coverage gaps, and governance automation status.

Integration Hub™ context:
Connected integrations: ${connections.map((c) => `${c.connector.name} (${c.instance.status}, last sync: ${c.instance.lastSyncAt ? new Date(c.instance.lastSyncAt).toLocaleDateString() : "never"})`).join(" | ") || "None"}
Open governance events: ${metrics.openEvents} (${metrics.criticalEvents} critical)
Evidence collected: ${metrics.totalEvidence} | Risks generated: ${metrics.totalRisks}

Answer questions about integrations, sync health, connector recommendations, evidence automation, and continuous monitoring. Be concise and actionable.`;

  const contextualHistory = [
    { role: "user" as const, parts: [{ text: systemContext + "\n\nAcknowledge you are ready to help with Integration Hub questions." }] },
    { role: "model" as const, parts: [{ text: "Ready to help with Integration Hub™ questions about connectivity, sync health, and governance automation coverage." }] },
    ...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
    { role: "user" as const, parts: [{ text: userMessage }] },
  ];

  try {
    const result = await ai.models.generateContent({ model: AI_MODEL, contents: contextualHistory });
    return result.candidates?.[0]?.content?.parts?.[0]?.text ?? "Unable to respond at this time.";
  } catch {
    return "Unable to respond at this time. Please try again.";
  }
}
