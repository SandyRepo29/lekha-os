import { db } from "@/lib/db";
import { aiComplianceInsights } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateText, isAIConfigured } from "@/lib/providers/ai";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function getCached(orgId: string, cacheKey: string): Promise<string | null> {
  const [row] = await db.select().from(aiComplianceInsights).where(
    and(eq(aiComplianceInsights.organizationId, orgId),
      eq(aiComplianceInsights.insightType, cacheKey),
      eq(aiComplianceInsights.targetId, orgId))
  ).orderBy(desc(aiComplianceInsights.generatedAt)).limit(1);
  if (!row) return null;
  if (Date.now() - new Date(row.generatedAt).getTime() > CACHE_TTL_MS) return null;
  return row.content;
}

async function saveCache(orgId: string, cacheKey: string, content: string) {
  await db.insert(aiComplianceInsights).values({
    organizationId: orgId, insightType: cacheKey, targetId: orgId, content,
  }).catch(() => {});
}

// ─── Network Executive Summary ────────────────────────────────

export async function generateNetworkSummary(orgId: string, context: {
  reputationScore: number;
  reputationLevel: string;
  profileCompleteness: number;
  activeBadges: number;
  activeRelationships: number;
  benchmarkPercentile: number;
  maturityLabel: string;
  connectedSystems: number;
  automationPct: number;
  profileViews30d: number;
}): Promise<string> {
  const cacheKey = "trust_network_summary";
  const cached = await getCached(orgId, cacheKey);
  if (cached) return cached;

  if (!isAIConfigured()) {
    return `Your Trust Network™ Reputation Score is ${context.reputationScore}/100 (${context.reputationLevel}). ` +
      `Profile completeness is ${context.profileCompleteness}% with ${context.activeBadges} active badges and ` +
      `${context.activeRelationships} trust relationships. You are in the ${context.benchmarkPercentile}th percentile ` +
      `(${context.maturityLabel}) with ${context.connectedSystems} connected systems providing ${context.automationPct}% automation coverage.`;
  }

  const prompt = `You are the AI Trust Network Advisor™ for an enterprise governance platform called AUDT.

Analyze this organization's Trust Network presence and write a 3-4 sentence executive summary.

Network data:
- Trust Network Reputation Score™: ${context.reputationScore}/100 (${context.reputationLevel})
- Profile completeness: ${context.profileCompleteness}%
- Active trust badges: ${context.activeBadges}
- Active trust relationships: ${context.activeRelationships}
- Governance benchmark: ${context.benchmarkPercentile}th percentile (${context.maturityLabel})
- Connected systems (Integration Hub): ${context.connectedSystems}
- Automation coverage: ${context.automationPct}%
- Profile views (30 days): ${context.profileViews30d}

Write a professional board-ready summary of this org's external trust posture. Focus on strengths, any gaps, and strategic value of the network presence. Be specific with numbers.`;

  const text = await generateText(prompt);
  await saveCache(orgId, cacheKey, text);
  return text;
}

// ─── Network Strategy Recommendations ────────────────────────

export async function generateNetworkRecommendations(orgId: string, context: {
  reputationScore: number;
  profileCompleteness: number;
  activeBadges: number;
  activeRelationships: number;
  automationPct: number;
  benchmarkPercentile: number;
}): Promise<Array<{ action: string; impact: "high" | "medium" | "low"; effort: "high" | "medium" | "low"; detail: string }>> {
  if (!isAIConfigured()) {
    return [
      { action: "Complete Trust Profile to 100%", impact: "high", effort: "low", detail: "A complete profile increases trust network credibility by up to 40%." },
      { action: "Add verified governance documents", impact: "high", effort: "medium", detail: "Verified SOC 2 and ISO 27001 documents significantly boost your reputation score." },
      { action: "Connect more integration systems", impact: "medium", effort: "medium", detail: "Each connected system improves automation coverage and governance evidence." },
    ];
  }

  const prompt = `You are the AI Trust Network Advisor™ for AUDT governance platform.

Generate 4 strategic recommendations to improve this org's Trust Network™ presence.

Current metrics:
- Reputation Score: ${context.reputationScore}/100
- Profile completeness: ${context.profileCompleteness}%
- Active badges: ${context.activeBadges}
- Active relationships: ${context.activeRelationships}
- Automation coverage: ${context.automationPct}%
- Benchmark percentile: ${context.benchmarkPercentile}th

Return ONLY valid JSON array (no markdown) with this structure:
[{"action":"...","impact":"high|medium|low","effort":"high|medium|low","detail":"..."}]`;

  try {
    const text = await generateText(prompt);
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  } catch {}

  return [
    { action: "Publish your Trust Profile publicly", impact: "high", effort: "low", detail: "Publishing makes your org discoverable in the Trust Network directory." },
    { action: "Earn governance certifications", impact: "high", effort: "high", detail: "ISO 27001 or SOC 2 certification adds significant weight to your reputation." },
    { action: "Expand your trust relationship network", impact: "medium", effort: "medium", detail: "More active relationships improves your Trust Reach™ score." },
    { action: "Automate evidence collection", impact: "medium", effort: "medium", detail: "Connect more systems via Integration Hub™ to boost automation coverage." },
  ];
}

// ─── AI Chat ─────────────────────────────────────────────────

export async function chat(orgId: string, context: string, messages: { role: "user" | "assistant"; content: string }[]): Promise<string> {
  if (!isAIConfigured()) return "AI is not configured. Please add your GEMINI_API_KEY environment variable.";

  const system = `You are the AI Trust Network Advisor™ for AUDT — an enterprise governance platform.
You help organizations understand and improve their external trust posture on the Trust Network.
You have access to the org's reputation data, benchmarking position, integration coverage, and trust relationships.

Organization trust network context:
${context}

Be concise, strategic, and data-driven. Always reference specific metrics from the context.`;

  const history = messages.slice(-8).map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");
  const lastUser = messages[messages.length - 1]?.content ?? "";
  const prompt = `${system}\n\nConversation:\n${history}\n\nRespond to: "${lastUser}"`;

  try {
    return await generateText(prompt);
  } catch {
    return "The AI advisor is temporarily unavailable — please try again in a moment.";
  }
}
