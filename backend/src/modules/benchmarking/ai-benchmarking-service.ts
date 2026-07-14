import { db } from "@/lib/db";
import { aiComplianceInsights } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAI, AI_MODEL, isAIConfigured } from "@/lib/providers/ai";
import type { BenchmarkSnapshot, BenchmarkScore } from "@/lib/db/schema";
import {
  BENCHMARK_CATEGORY_LABELS,
  BENCHMARK_MATURITY_LABELS,
  BENCHMARK_RANKING_LABELS,
  type BenchmarkCategory,
} from "@/backend/src/modules/benchmarking/benchmarking-score";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function getCached(orgId: string, type: string): Promise<string | null> {
  const [row] = await db
    .select()
    .from(aiComplianceInsights)
    .where(
      and(
        eq(aiComplianceInsights.organizationId, orgId),
        eq(aiComplianceInsights.insightType, type),
        eq(aiComplianceInsights.targetId, orgId)
      )
    )
    .orderBy(desc(aiComplianceInsights.generatedAt))
    .limit(1);
  if (!row) return null;
  if (Date.now() - new Date(row.generatedAt).getTime() > CACHE_TTL_MS) return null;
  return row.content;
}

async function saveCache(orgId: string, type: string, content: string) {
  await db
    .insert(aiComplianceInsights)
    .values({ organizationId: orgId, insightType: type, targetId: orgId, content })
    .catch(() => {});
}

function formatScores(scores: BenchmarkScore[]): string {
  return scores
    .map((s) => {
      const label = BENCHMARK_CATEGORY_LABELS[s.category as BenchmarkCategory] ?? s.category;
      const pct = s.percentile !== null ? `${s.percentile}th percentile` : "no data";
      const delta = s.deltaVsIndustry !== null
        ? (s.deltaVsIndustry >= 0 ? `+${s.deltaVsIndustry}` : `${s.deltaVsIndustry}`) + " vs industry"
        : "";
      return `${label}: score=${s.orgScore ?? "N/A"}, industry avg=${s.industryAvg ?? "N/A"}, ${pct}${delta ? ", " + delta : ""}`;
    })
    .join("\n");
}

// ─── Executive Benchmark Report ───────────────────────────────────────────────

export async function generateBenchmarkReport(
  orgId: string,
  snapshot: BenchmarkSnapshot | null,
  scores: BenchmarkScore[]
): Promise<string> {
  const cached = await getCached(orgId, "benchmark_executive_report");
  if (cached) return cached;
  if (!isAIConfigured() || !snapshot) return "";

  const ai = getAI();
  const maturity = BENCHMARK_MATURITY_LABELS[snapshot.maturityLevel] ?? snapshot.maturityLevel;
  const ranking = BENCHMARK_RANKING_LABELS[snapshot.overallRanking] ?? snapshot.overallRanking;

  const prompt = `You are an AI Benchmark Analyst for AUDT, a Governance Intelligence Platform.

Generate a board-ready governance benchmark report for this organization.

Benchmark Summary:
- Overall Score: ${snapshot.overallScore ?? "N/A"}/100
- Overall Percentile: ${snapshot.overallPercentile ?? "N/A"}th
- Governance Maturity: ${maturity}
- Industry Ranking: ${ranking}
- Industry: ${snapshot.industry ?? "All Industries"}
- Peer Group Size: ${snapshot.peerCount ?? 0}+ organizations

Category Benchmarks:
${formatScores(scores)}

Write a 3-paragraph executive benchmark report:
1. Overall governance position and what the percentile ranking means for the business
2. Key strengths (categories where we outperform industry average) and competitive advantages
3. Priority improvement areas and expected business impact if addressed

Be specific, data-driven, and board-appropriate. Avoid generic advice.`;

  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (content) await saveCache(orgId, "benchmark_executive_report", content);
  return content;
}

// ─── Industry Insights ────────────────────────────────────────────────────────

export async function generateIndustryInsights(
  orgId: string,
  industry: string,
  scores: BenchmarkScore[]
): Promise<string> {
  const cached = await getCached(orgId, "benchmark_industry_insights");
  if (cached) return cached;
  if (!isAIConfigured()) return "";

  const ai = getAI();
  const prompt = `You are an AI Benchmark Analyst for AUDT.

Generate industry-specific governance insights for a ${industry.replace(/_/g, " ")} organization.

Their current benchmark position:
${formatScores(scores)}

Provide 3 key insights about:
1. What governance challenges are common in this industry right now
2. What top performers in this industry do differently
3. One emerging governance risk or trend specific to ${industry.replace(/_/g, " ")} organizations

Keep each insight to 2-3 sentences. Be specific to the industry context.`;

  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (content) await saveCache(orgId, "benchmark_industry_insights", content);
  return content;
}

// ─── Improvement Planner ──────────────────────────────────────────────────────

export async function generateImprovementPlan(
  orgId: string,
  scores: BenchmarkScore[]
): Promise<Array<{ category: string; action: string; impact: string; effort: string }>> {
  if (!isAIConfigured()) return [];

  const weakCategories = scores
    .filter((s) => s.deltaVsIndustry !== null && s.deltaVsIndustry < 0)
    .sort((a, b) => (a.deltaVsIndustry ?? 0) - (b.deltaVsIndustry ?? 0))
    .slice(0, 5);

  if (!weakCategories.length) return [];

  const ai = getAI();
  const prompt = `You are an AI Governance Improvement Planner for AUDT.

These governance categories are below industry average:
${weakCategories.map((s) => `- ${BENCHMARK_CATEGORY_LABELS[s.category as BenchmarkCategory]}: score ${s.orgScore ?? "N/A"}, industry avg ${s.industryAvg ?? "N/A"}, gap ${s.deltaVsIndustry ?? 0}`).join("\n")}

For each category, suggest the highest-ROI improvement action.

Respond ONLY with JSON array:
[
  {
    "category": "category_key",
    "action": "specific actionable improvement (1 sentence)",
    "impact": "high|medium|low",
    "effort": "high|medium|low"
  }
]`;

  try {
    const result = await ai.models.generateContent({
      model: AI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { thinkingConfig: { thinkingBudget: 0 } },
    });
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────

export async function chat(
  orgId: string,
  context: {
    overallScore: number | null;
    overallPercentile: number | null;
    maturityLevel: string;
    industry: string | null;
    topCategories: string[];
    weakCategories: string[];
  },
  messages: Array<{ role: "user" | "model"; text: string }>
): Promise<string> {
  if (!isAIConfigured()) return "AI is not configured.";

  const ai = getAI();
  const systemPrompt = `You are the AI Benchmark Analyst for AUDT's Governance Benchmarking™ module.

Organization's benchmark context:
- Overall Governance Score: ${context.overallScore ?? "N/A"}/100
- Industry Percentile: ${context.overallPercentile ?? "N/A"}th
- Maturity Level: ${context.maturityLevel}
- Industry: ${context.industry ?? "Not specified"}
- Top performing areas: ${context.topCategories.join(", ") || "None identified"}
- Areas needing improvement: ${context.weakCategories.join(", ") || "None identified"}

Answer questions about governance benchmarking, peer comparisons, industry position, and improvement priorities. Be specific and data-driven.`;

  const contents = [
    { role: "user" as const, parts: [{ text: systemPrompt }] },
    { role: "model" as const, parts: [{ text: "I'm ready to discuss your governance benchmarking results." }] },
    ...messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
  ];

  try {
    const result = await ai.models.generateContent({
      model: AI_MODEL,
      contents,
      config: { thinkingConfig: { thinkingBudget: 0 } },
    });
    return result.candidates?.[0]?.content?.parts?.[0]?.text ?? "I couldn't generate a response.";
  } catch {
    return "The AI advisor is temporarily unavailable — please try again in a moment.";
  }
}
