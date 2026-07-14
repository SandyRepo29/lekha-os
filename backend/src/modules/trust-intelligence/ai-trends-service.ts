import { generateText, isAIConfigured } from "@/lib/providers/ai";
import * as aiRepo from "@/backend/src/modules/compliance/ai-compliance-repo";
import type { TrendsOverview } from "./trends-service";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function isFresh(at: Date | null): boolean {
  if (!at) return false;
  return Date.now() - at.getTime() < CACHE_TTL_MS;
}

function trendCtx(trends: TrendsOverview): string {
  const { metrics: m, period } = trends;
  const fmt = (t: { current: number; change: number; direction: string }) =>
    `${t.current} (${t.direction === "up" ? "+" : ""}${t.change}pts over ${period}d)`;

  return `
Governance trends over the last ${period} days:
- Organizational Trust: ${fmt(m.orgTrust)}
- Vendor Trust: ${fmt(m.vendorTrust)}
- Risk Posture: ${fmt(m.riskPosture)}
- Control Health: ${fmt(m.controlHealth)}
- Audit Readiness: ${fmt(m.auditReadiness)}
- Compliance Coverage: ${fmt(m.compliance)}
Data points available: ${trends.points.length}
`.trim();
}

export async function generateWeeklySummary(
  orgId: string,
  trends: TrendsOverview
): Promise<string> {
  if (!isAIConfigured()) return "";

  const insightType = `weekly_trends_${new Date().toISOString().slice(0, 10)}`;
  const cached = await aiRepo.findInsight(orgId, insightType, orgId);
  if (cached && isFresh(cached.generatedAt)) return cached.content;

  const prompt = `You are the AI Governance Monitor for AUDT. Analyze the governance trend data and write a concise weekly governance summary (3-4 sentences) suitable for an executive audience. Focus on what changed, what improved, what declined, and the most important action item.

${trendCtx(trends)}

Write the summary now:`;

  const text = await generateText(prompt, { maxTokens: 300, temperature: 0.3 });
  await aiRepo.upsertInsight({ organizationId: orgId, targetId: orgId, insightType, content: text });
  return text;
}

export async function generateForecast(
  orgId: string,
  trends: TrendsOverview
): Promise<string> {
  if (!isAIConfigured()) return "";

  const insightType = `trends_forecast_${new Date().toISOString().slice(0, 10)}`;
  const cached = await aiRepo.findInsight(orgId, insightType, orgId);
  if (cached && isFresh(cached.generatedAt)) return cached.content;

  const prompt = `You are the AI Governance Forecaster. Based on the 90-day governance trend data, provide a brief forecast (2-3 sentences) predicting where governance posture is likely to be in 30 days. Mention specific risks or improvements expected.

${trendCtx(trends)}

Write the forecast now:`;

  const text = await generateText(prompt, { maxTokens: 250, temperature: 0.4 });
  await aiRepo.upsertInsight({ organizationId: orgId, targetId: orgId, insightType, content: text });
  return text;
}

export async function getCachedWeeklySummary(orgId: string): Promise<string | null> {
  const insightType2 = `weekly_trends_${new Date().toISOString().slice(0, 10)}`;
  const cached = await aiRepo.findInsight(orgId, insightType2, orgId);
  if (cached && isFresh(cached.generatedAt)) return cached.content;
  return null;
}

export async function chatTrends(
  orgId: string,
  question: string,
  trends: TrendsOverview,
  history: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<string> {
  if (!isAIConfigured()) return "AI is not configured. Please set GEMINI_API_KEY.";

  const ctx = trendCtx(trends);
  const historyText = history.slice(-4).map((h) => `${h.role}: ${h.content}`).join("\n");

  const prompt = `You are the AUDT AI Governance Monitor. You have access to governance trend data.

${ctx}

${historyText ? `Conversation so far:\n${historyText}\n` : ""}
User question: ${question}

Answer concisely and specifically. If asked for recommendations, be actionable.`;

  return generateText(prompt, { maxTokens: 400, temperature: 0.4 });
}
