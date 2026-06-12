import { generateText, isAIConfigured } from "@/lib/providers/ai";
import { db } from "@/lib/db";
import { aiComplianceInsights } from "@/lib/db/schema";
import { and, eq, gte } from "drizzle-orm";

const CACHE_TTL_HOURS = 24;

async function getCached(orgId: string, key: string) {
  const since = new Date(Date.now() - CACHE_TTL_HOURS * 3600 * 1000);
  const rows = await db
    .select()
    .from(aiComplianceInsights)
    .where(
      and(
        eq(aiComplianceInsights.organizationId, orgId),
        eq(aiComplianceInsights.insightType, key),
        eq(aiComplianceInsights.targetId, orgId),
        gte(aiComplianceInsights.generatedAt, since)
      )
    )
    .limit(1);
  return rows[0]?.content ?? null;
}

async function saveCache(orgId: string, key: string, content: string) {
  await db
    .insert(aiComplianceInsights)
    .values({
      organizationId: orgId,
      insightType: key,
      targetId: orgId,
      content,
    })
    .onConflictDoNothing()
    .catch(() => {});
}

export async function generateExecutiveSummary(
  orgId: string,
  kpis: Record<string, number>
): Promise<string> {
  const cacheKey = "exec_reporting_summary";
  const cached = await getCached(orgId, cacheKey);
  if (cached) return cached;

  if (!isAIConfigured()) {
    return "AI Executive Summary requires Gemini API configuration. Connect your AI provider in Settings → Integrations to enable this feature.";
  }

  const kpiText = Object.entries(kpis)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const summary = await generateText(
    `You are the AI Executive Analyst™ for AUDT, a Governance OS. Write a concise 3-4 sentence executive summary of the organization's governance posture based on these KPIs: ${kpiText}. Highlight what is strong, what needs attention, and one strategic recommendation. Be direct and board-appropriate in tone.`
  );

  await saveCache(orgId, cacheKey, summary);
  return summary;
}

export async function generateBoardReport(
  orgId: string,
  reportType: string,
  kpis: Record<string, number>
): Promise<string> {
  if (!isAIConfigured()) {
    return "AI Board Report generation requires Gemini API configuration.";
  }

  const kpiText = Object.entries(kpis)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  return generateText(
    `You are an AI Board Report Generator™ for AUDT. Generate a structured ${reportType.replace(/_/g, " ")} report section for the board. Include: Executive Summary (2 sentences), Key Metrics (bullet points from: ${kpiText}), Risk Highlights (2-3 points), Compliance Status (1-2 sentences), Recommendations (3 action items). Use formal board language. Be concise.`
  );
}

export async function chat(orgId: string, messages: { role: string; content: string }[], kpis: Record<string, number>): Promise<string> {
  if (!isAIConfigured()) {
    return "AI Executive Analyst™ requires Gemini API configuration. Please connect your AI provider in Settings → Integrations.";
  }

  const kpiContext = Object.entries(kpis)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const history = messages
    .slice(-6)
    .map((m) => `${m.role === "user" ? "Executive" : "AI Analyst"}: ${m.content}`)
    .join("\n");

  const lastMessage = messages[messages.length - 1]?.content ?? "";

  return generateText(
    `You are the AI Executive Analyst™ for AUDT Governance OS. Current governance KPIs: ${kpiContext}.\n\nConversation:\n${history}\n\nAnswer the executive's latest question: "${lastMessage}"\n\nBe concise, data-driven, and board-appropriate. Reference specific KPI values when relevant.`
  );
}

export async function generateTrendAnalysis(orgId: string, kpis: Record<string, number>): Promise<string> {
  if (!isAIConfigured()) return "AI Trend Analysis requires Gemini API configuration.";

  const kpiText = Object.entries(kpis).map(([k, v]) => `${k}: ${v}`).join(", ");
  return generateText(
    `As the AI Trend Analyst™ for AUDT, analyze governance trends based on: ${kpiText}. Identify 3 emerging trends, 2 positive developments, and 1 area requiring strategic attention. Be specific and actionable.`
  );
}
