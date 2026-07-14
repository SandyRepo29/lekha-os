"use server";

import { generateText, isAIConfigured } from "@/lib/providers/ai";
import { db } from "@/lib/db";
import { aiComplianceInsights } from "@/lib/db/schema";
import { and, eq, gte } from "drizzle-orm";
import * as repo from "@/backend/src/modules/ai-governance/ai-governance-repo";

const CACHE_TTL_HOURS = 24;

// ── Cache helpers ─────────────────────────────────────────────────────────────

async function getCached(
  orgId: string,
  insightType: string,
  targetId: string
): Promise<string | null> {
  const since = new Date(Date.now() - CACHE_TTL_HOURS * 3600 * 1000);
  const rows = await db
    .select()
    .from(aiComplianceInsights)
    .where(
      and(
        eq(aiComplianceInsights.organizationId, orgId),
        eq(aiComplianceInsights.insightType, insightType),
        eq(aiComplianceInsights.targetId, targetId),
        gte(aiComplianceInsights.generatedAt, since)
      )
    )
    .limit(1);
  return rows[0]?.content ?? null;
}

async function saveCache(
  orgId: string,
  insightType: string,
  targetId: string,
  content: string
): Promise<void> {
  await db
    .insert(aiComplianceInsights)
    .values({ organizationId: orgId, insightType, targetId, content })
    .onConflictDoNothing()
    .catch(() => {});
}

// ── AI Governance Summary ─────────────────────────────────────────────────────

export interface AiGovernanceSummaryResult {
  summary: string;
  riskHighlights: string[];
  recommendations: string[];
  generatedAt: Date;
}

export async function generateAiGovernanceSummary(
  orgId: string
): Promise<AiGovernanceSummaryResult> {
  const cacheKey = "ai_governance_summary";
  const cached = await getCached(orgId, cacheKey, orgId);
  if (cached) {
    try {
      return JSON.parse(cached) as AiGovernanceSummaryResult;
    } catch {
      // fall through to regenerate
    }
  }

  const metrics = await repo.getDashboardMetrics(orgId);

  const totalSystems = (metrics as any).totalSystems ?? 0;
  const approvedSystems = (metrics as any).approvedSystems ?? 0;
  const highRiskSystems = (metrics as any).highRiskSystems ?? 0;
  const openIncidents = (metrics as any).openIncidents ?? 0;
  const avgComplianceReadiness = (metrics as any).avgComplianceReadiness ?? 0;
  const approvedPct =
    totalSystems > 0 ? Math.round((approvedSystems / totalSystems) * 100) : 0;

  if (!isAIConfigured()) {
    const fallback: AiGovernanceSummaryResult = {
      summary:
        "AI Governance Copilot™ requires Gemini API configuration. Connect your AI provider in Settings → Integrations to enable this feature.",
      riskHighlights: [],
      recommendations: [],
      generatedAt: new Date(),
    };
    return fallback;
  }

  const prompt = `You are the AI Governance Copilot™ for AUDT, a Governance OS focused on Responsible AI.

Current AI governance posture:
- Total AI systems registered: ${totalSystems}
- Approved systems: ${approvedSystems} (${approvedPct}%)
- High-risk AI systems: ${highRiskSystems}
- Open AI incidents: ${openIncidents}
- Average compliance readiness: ${avgComplianceReadiness}%

Respond in strict JSON (no markdown) matching this shape:
{
  "summary": "<3-4 sentence executive summary of AI governance posture>",
  "riskHighlights": ["<risk highlight 1>", "<risk highlight 2>", "<risk highlight 3>"],
  "recommendations": ["<action 1>", "<action 2>", "<action 3>"]
}

Be concise, board-appropriate, and grounded in the numbers above.`;

  const raw = await generateText(prompt);

  let result: AiGovernanceSummaryResult;
  try {
    const parsed = JSON.parse(raw.trim());
    result = {
      summary: parsed.summary ?? raw,
      riskHighlights: parsed.riskHighlights ?? [],
      recommendations: parsed.recommendations ?? [],
      generatedAt: new Date(),
    };
  } catch {
    result = {
      summary: raw,
      riskHighlights: [],
      recommendations: [],
      generatedAt: new Date(),
    };
  }

  await saveCache(orgId, cacheKey, orgId, JSON.stringify(result));
  return result;
}

// ── AI Risk Advisory ──────────────────────────────────────────────────────────

export interface AiRiskAdvisoryResult {
  recommendations: { title: string; description: string; priority: "high" | "medium" | "low" }[];
}

export async function generateAiRiskAdvisory(
  orgId: string,
  systemId: string
): Promise<AiRiskAdvisoryResult> {
  const risks = await repo.findAllRisks(orgId, { systemId });

  if (!isAIConfigured()) {
    return {
      recommendations: [
        {
          title: "AI configuration required",
          description:
            "Connect your Gemini API key in Settings → Integrations to generate AI risk recommendations.",
          priority: "medium",
        },
      ],
    };
  }

  const riskSummary = risks
    .slice(0, 10)
    .map(
      (r: any) =>
        `- ${r.title} (severity: ${r.severity ?? "unknown"}, status: ${r.status ?? "open"})`
    )
    .join("\n");

  const prompt = `You are the AI Risk Advisor™ for AUDT. An AI system has the following identified risks:

${riskSummary || "No risks currently identified."}

Generate exactly 5 risk treatment recommendations. Respond in strict JSON (no markdown):
{
  "recommendations": [
    { "title": "...", "description": "...", "priority": "high" | "medium" | "low" },
    ...
  ]
}

Each recommendation should be specific, actionable, and address the risks above. Prioritize critical gaps.`;

  const raw = await generateText(prompt);

  try {
    const parsed = JSON.parse(raw.trim());
    return { recommendations: parsed.recommendations ?? [] };
  } catch {
    return {
      recommendations: [
        {
          title: "Review AI risk register",
          description: raw,
          priority: "medium",
        },
      ],
    };
  }
}

// ── AI Compliance Readiness ───────────────────────────────────────────────────

export interface AiComplianceReadinessResult {
  readiness: number;
  gaps: string[];
  actions: string[];
  generatedAt: Date;
}

export async function generateAiComplianceReadiness(
  orgId: string,
  framework: string
): Promise<AiComplianceReadinessResult> {
  const cacheKey = `ai_governance_compliance_${framework}`;
  const cached = await getCached(orgId, cacheKey, orgId);
  if (cached) {
    try {
      return JSON.parse(cached) as AiComplianceReadinessResult;
    } catch {
      // fall through
    }
  }

  const allCompliance = await repo.findAllCompliance(orgId).catch(() => []);
  const record = allCompliance.find((cr: any) => cr.framework === framework) ?? null;
  const readiness = Number((record as any)?.readinessScore ?? 0);
  const gaps: string[] = (record as any)?.gaps ?? [];

  if (!isAIConfigured()) {
    const fallback: AiComplianceReadinessResult = {
      readiness,
      gaps,
      actions: ["Connect Gemini API to generate AI-powered gap analysis."],
      generatedAt: new Date(),
    };
    return fallback;
  }

  const gapText =
    gaps.length > 0 ? gaps.join("; ") : "No specific gaps identified.";

  const prompt = `You are the AI Compliance Analyst™ for AUDT. Analyze AI governance compliance for the "${framework}" framework.

Current readiness: ${readiness}%
Known gaps: ${gapText}

Provide an explanation and remediation plan. Respond in strict JSON (no markdown):
{
  "readiness": ${readiness},
  "gaps": ["<gap 1>", "<gap 2>", "<gap 3>"],
  "actions": ["<action 1>", "<action 2>", "<action 3>"],
  "generatedAt": "${new Date().toISOString()}"
}

Be specific to AI governance requirements within the ${framework} framework.`;

  const raw = await generateText(prompt);

  let result: AiComplianceReadinessResult;
  try {
    const parsed = JSON.parse(raw.trim());
    result = {
      readiness: parsed.readiness ?? readiness,
      gaps: parsed.gaps ?? gaps,
      actions: parsed.actions ?? [],
      generatedAt: new Date(),
    };
  } catch {
    result = {
      readiness,
      gaps,
      actions: [raw],
      generatedAt: new Date(),
    };
  }

  await saveCache(orgId, cacheKey, orgId, JSON.stringify(result));
  return result;
}

// ── Multi-turn NL Chat ────────────────────────────────────────────────────────

export async function chat(
  orgId: string,
  messages: { role: string; content: string }[]
): Promise<{ reply: string }> {
  if (!isAIConfigured()) {
    return {
      reply:
        "AI Governance Copilot™ requires Gemini API configuration. Connect your AI provider in Settings → Integrations to enable this feature.",
    };
  }

  const metrics = await repo.getDashboardMetrics(orgId).catch(() => ({}));

  const totalSystems = (metrics as any).totalSystems ?? 0;
  const approvedSystems = (metrics as any).approvedSystems ?? 0;
  const highRiskSystems = (metrics as any).highRiskSystems ?? 0;
  const openIncidents = (metrics as any).openIncidents ?? 0;
  const avgComplianceReadiness = (metrics as any).avgComplianceReadiness ?? 0;

  const systemContext = `You are the AI Governance Copilot™ for AUDT Governance OS. You help governance officers manage responsible AI practices.

Current AI governance context:
- Total AI systems: ${totalSystems}
- Approved systems: ${approvedSystems}
- High-risk systems: ${highRiskSystems}
- Open incidents: ${openIncidents}
- Avg compliance readiness: ${avgComplianceReadiness}%`;

  const history = messages
    .slice(-8)
    .map((m) => `${m.role === "user" ? "Governance Officer" : "Copilot"}: ${m.content}`)
    .join("\n");

  const lastMessage = messages[messages.length - 1]?.content ?? "";

  const prompt = `${systemContext}

Conversation:
${history}

Answer the governance officer's latest question: "${lastMessage}"

Be concise, specific, and reference the governance context where relevant. Limit response to 3-5 sentences unless a list is clearly appropriate.`;

  try {
    const reply = await generateText(prompt);
    return { reply };
  } catch {
    return { reply: "The AI advisor is temporarily unavailable — please try again in a moment." };
  }
}
