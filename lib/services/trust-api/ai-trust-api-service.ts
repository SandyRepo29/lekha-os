"use server";

import { generateText, isAIConfigured } from "@/lib/providers/ai";
import { db } from "@/lib/db";
import { aiComplianceInsights } from "@/lib/db/schema";
import { and, eq, gte } from "drizzle-orm";
import * as repo from "@/lib/repositories/trust-api-repo";

const CACHE_TTL_HOURS = 24;

async function getCached(orgId: string, insightType: string): Promise<string | null> {
  const since = new Date(Date.now() - CACHE_TTL_HOURS * 3600 * 1000);
  const rows = await db.select().from(aiComplianceInsights).where(and(
    eq(aiComplianceInsights.organizationId, orgId),
    eq(aiComplianceInsights.insightType, insightType),
    eq(aiComplianceInsights.targetId, orgId),
    gte(aiComplianceInsights.generatedAt, since),
  )).limit(1);
  return rows[0]?.content ?? null;
}

async function saveCache(orgId: string, insightType: string, content: string): Promise<void> {
  await db.insert(aiComplianceInsights).values({ organizationId: orgId, insightType, targetId: orgId, content }).onConflictDoNothing().catch(() => {});
}

// ── API Platform Summary ──────────────────────────────────────────────────────

export interface ApiPlatformSummary {
  summary: string;
  integrationHealth: string;
  topOpportunities: string[];
  recommendations: string[];
  generatedAt: Date;
}

export async function generateApiPlatformSummary(orgId: string): Promise<ApiPlatformSummary> {
  const cacheKey = "tap_platform_summary";
  const cached = await getCached(orgId, cacheKey);
  if (cached) {
    try { return { ...JSON.parse(cached), generatedAt: new Date() }; } catch {}
  }

  const metrics = await repo.getDashboardMetrics(orgId);

  if (!isAIConfigured()) {
    return {
      summary: `Trust API Platform™ has ${metrics.totalClients} registered consumers, ${metrics.activeKeys} active keys, and ${metrics.totalCalls30d.toLocaleString()} API calls in the last 30 days. Configure GEMINI_API_KEY to unlock AI-powered insights.`,
      integrationHealth: "Configure AI to assess integration health.",
      topOpportunities: [],
      recommendations: [],
      generatedAt: new Date(),
    };
  }

  const successRate = metrics.totalCalls30d > 0 ? Math.round(((metrics.totalCalls30d - metrics.errorCalls30d) / metrics.totalCalls30d) * 100) : 100;

  const prompt = `You are an API platform strategist. Analyze this Trust API Platform™ data and respond in valid JSON only.

Data:
- API clients: ${metrics.totalClients} total (${metrics.activeClients} active)
- API keys: ${metrics.totalKeys} total (${metrics.activeKeys} active)
- Webhooks: ${metrics.totalWebhooks} total (${metrics.activeWebhooks} active)
- API calls last 30 days: ${metrics.totalCalls30d}
- Error calls: ${metrics.errorCalls30d} (success rate: ${successRate}%)

Return JSON:
{
  "summary": "2-3 sentence executive summary of API platform health and adoption",
  "integrationHealth": "one sentence assessment of integration health",
  "topOpportunities": ["3-4 specific growth opportunities for API adoption"],
  "recommendations": ["3-4 specific recommendations to improve platform"]
}`;

  try {
    const raw = await generateText(prompt);
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : null;
    if (parsed?.summary) {
      const result = { ...parsed, generatedAt: new Date() };
      await saveCache(orgId, cacheKey, JSON.stringify(parsed));
      return result;
    }
  } catch {}

  return {
    summary: `${metrics.totalClients} API clients have been registered with ${metrics.totalCalls30d.toLocaleString()} calls in the last 30 days (${successRate}% success rate).`,
    integrationHealth: successRate >= 95 ? "Healthy — error rate is within acceptable range." : "Attention required — error rate is elevated.",
    topOpportunities: ["Onboard procurement system integrations", "Enable vendor trust API for supplier portals"],
    recommendations: ["Add more webhooks for real-time trust updates", "Upgrade high-usage clients to Business plan"],
    generatedAt: new Date(),
  };
}

// ── AI API Builder Docs ───────────────────────────────────────────────────────

export interface ApiDocs {
  endpoint: string;
  description: string;
  exampleRequest: string;
  exampleResponse: string;
  sdkSample: string;
}

export async function generateApiDocs(productSlug: string): Promise<ApiDocs> {
  const endpointMap: Record<string, string> = {
    "trust-score": "/api/v1/public/trust-score",
    "vendor-trust": "/api/v1/public/vendor-trust",
    "ai-trust": "/api/v1/public/ai-trust",
    "benchmarking": "/api/v1/public/benchmarking",
    "verification": "/api/v1/public/verification",
    "trust-network": "/api/v1/public/trust-network",
  };

  const endpoint = endpointMap[productSlug] ?? `/api/v1/public/${productSlug}`;

  if (!isAIConfigured()) {
    return {
      endpoint,
      description: `Retrieve ${productSlug.replace("-", " ")} data for your organization.`,
      exampleRequest: `curl -H "Authorization: Bearer tap_your_key" https://audt.tech${endpoint}`,
      exampleResponse: `{ "data": { "score": 82, "level": "Strong" }, "meta": { "generated_at": "2026-06-13" } }`,
      sdkSample: `import AUDT from '@audt/sdk';\nconst client = new AUDT({ apiKey: 'tap_your_key' });\nconst data = await client.${productSlug.replace("-", "")}();`,
    };
  }

  const prompt = `Generate concise developer documentation for the AUDT Trust API Platform™ endpoint ${endpoint}.

Return JSON:
{
  "endpoint": "${endpoint}",
  "description": "one clear sentence describing what this endpoint returns",
  "exampleRequest": "curl example with placeholder key",
  "exampleResponse": "compact JSON showing 3-5 key response fields",
  "sdkSample": "5-8 line TypeScript/JavaScript code sample using hypothetical @audt/sdk"
}`;

  try {
    const raw = await generateText(prompt);
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : null;
    if (parsed?.endpoint) return parsed;
  } catch {}

  return {
    endpoint,
    description: `Retrieve ${productSlug.replace("-", " ")} data programmatically.`,
    exampleRequest: `curl -H "Authorization: Bearer tap_your_key" https://audt.tech${endpoint}`,
    exampleResponse: `{ "data": {}, "meta": { "generated_at": "2026-06-13" } }`,
    sdkSample: `const client = new AUDT({ apiKey: process.env.AUDT_API_KEY });\nconst result = await client.get('${endpoint}');`,
  };
}

// ── AI NL Chat ────────────────────────────────────────────────────────────────

export async function chat(orgId: string, messages: { role: "user" | "assistant"; content: string }[]): Promise<string> {
  const metrics = await repo.getDashboardMetrics(orgId);

  if (!isAIConfigured()) {
    return `I can help with your Trust API Platform™. You have ${metrics.totalClients} clients, ${metrics.activeKeys} active keys, and ${metrics.totalCalls30d} calls this month. Enable GEMINI_API_KEY for full AI assistance.`;
  }

  const context = `Trust API Platform™ context: ${metrics.totalClients} clients (${metrics.activeClients} active), ${metrics.activeKeys} active API keys, ${metrics.totalWebhooks} webhooks (${metrics.activeWebhooks} active), ${metrics.totalCalls30d} API calls last 30 days, ${metrics.errorCalls30d} errors.`;

  const history = messages.slice(-8).map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");

  const prompt = `You are AUDT AI Integration Advisor™, expert on the Trust API Platform™.
${context}

Conversation:
${history}

Respond helpfully in 2-4 sentences about API integration, webhook setup, authentication, or platform strategy.`;

  try {
    return await generateText(prompt);
  } catch {
    return "I'm having trouble connecting to AI. Please try again shortly.";
  }
}
