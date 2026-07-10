import { getAI, isAIConfigured, AI_MODEL } from "@/lib/providers/ai";
import { getGraphData } from "./graph-service";
import { db } from "@/lib/db";
import { aiComplianceInsights } from "@/lib/db/schema";
import { and, eq, gt } from "drizzle-orm";

const CACHE_HOURS = 24;

async function getCached(orgId: string, type: string, targetId: string): Promise<string | null> {
  const cutoff = new Date(Date.now() - CACHE_HOURS * 3600_000);
  const rows = await db.select({ content: aiComplianceInsights.content })
    .from(aiComplianceInsights)
    .where(and(
      eq(aiComplianceInsights.organizationId, orgId),
      eq(aiComplianceInsights.insightType, type),
      eq(aiComplianceInsights.targetId, targetId),
      gt(aiComplianceInsights.generatedAt, cutoff),
    ))
    .limit(1);
  return rows[0]?.content ?? null;
}

async function saveCache(orgId: string, type: string, targetId: string, content: string): Promise<void> {
  await db.insert(aiComplianceInsights).values({
    organizationId: orgId,
    insightType: type,
    targetId,
    content,
    generatedAt: new Date(),
  }).onConflictDoUpdate({
    target: [aiComplianceInsights.organizationId, aiComplianceInsights.insightType, aiComplianceInsights.targetId],
    set: { content, generatedAt: new Date() },
  }).catch(() => {});
}

/** Generate an AI governance network summary (cached 24h). */
export async function generateGraphSummary(orgId: string): Promise<string> {
  if (!isAIConfigured()) return "AI not configured.";
  const cached = await getCached(orgId, "trust_graph_summary", orgId);
  if (cached) return cached;

  const graph = await getGraphData(orgId);
  const ai = getAI();

  const prompt = `You are a governance analyst reviewing a Trust Graph™ for an organization.

Graph Summary:
- Total nodes: ${graph.metrics.totalNodes}
- Total relationships: ${graph.metrics.totalEdges}
- Entities: ${JSON.stringify(graph.metrics.entityCounts)}
- Most connected: ${graph.metrics.mostConnectedNode?.name ?? "N/A"} (${graph.metrics.mostConnectedNode?.connections ?? 0} connections)

Write a concise executive insight (3-4 sentences) about the governance network structure. Highlight:
1. The most critical entity dependencies
2. Key governance risk pathways
3. One actionable recommendation to strengthen the governance network

Be specific and governance-focused.`;

  const result = await ai.models.generateContent({ model: AI_MODEL, contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: 0 } }, });
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "Unable to generate summary.";
  await saveCache(orgId, "trust_graph_summary", orgId, text);
  return text;
}

/** AI chat for governance reasoning. */
export async function chat(orgId: string, message: string, history: Array<{ role: string; text: string }>): Promise<string> {
  if (!isAIConfigured()) return "AI not configured.";

  const graph = await getGraphData(orgId);
  const ai = getAI();

  const systemContext = `You are the Governance Reasoner™, an AI assistant for the AUDT Trust Graph™.

Current governance network:
- ${graph.metrics.totalNodes} entities across ${Object.entries(graph.metrics.entityCounts).map(([k, v]) => `${v} ${k}s`).join(", ")}
- ${graph.metrics.totalEdges} relationships tracked
- Most connected entity: ${graph.metrics.mostConnectedNode?.name ?? "none"}

Answer questions about governance relationships, dependencies, root causes, and impact. Be concise and specific.`;

  const contents = [
    { role: "user" as const, parts: [{ text: systemContext }] },
    { role: "model" as const, parts: [{ text: "Understood. I'm ready to analyze the governance network." }] },
    ...history.map(h => ({ role: h.role as "user" | "model", parts: [{ text: h.text }] })),
    { role: "user" as const, parts: [{ text: message }] },
  ];

  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents,
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });
  return result.candidates?.[0]?.content?.parts?.[0]?.text ?? "Unable to generate response.";
}
