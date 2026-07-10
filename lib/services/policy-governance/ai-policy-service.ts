import { getAI, AI_MODEL, isAIConfigured } from "@/lib/providers/ai";
import { db } from "@/lib/db";
import { aiComplianceInsights, policies } from "@/lib/db/schema";
import { and, eq, gt } from "drizzle-orm";
import * as repo from "@/lib/repositories/policy-governance-repo";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// ─── AI Policy Draft™ ────────────────────────────────────────────────────────

export async function draftPolicy(
  orgId: string,
  topic: string,
  context?: string
): Promise<string> {
  if (!isAIConfigured()) return "AI is not configured. Please add your GEMINI_API_KEY.";

  const ai = getAI();
  const prompt = `You are a GRC expert and policy writer. Draft a comprehensive organisational policy document.

Topic: ${topic}
${context ? `Additional context: ${context}` : ""}

Write a complete, professional policy document in Markdown format. Include:
1. Policy Statement
2. Purpose & Scope
3. Policy Requirements (bulleted sections)
4. Roles & Responsibilities
5. Compliance & Enforcement
6. Review Schedule

Use clear, authoritative language appropriate for an enterprise governance policy. Be specific and actionable.`;

  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });
  return result.candidates?.[0]?.content?.parts?.[0]?.text ?? "Unable to generate policy draft.";
}

// ─── AI Gap Analysis™ ────────────────────────────────────────────────────────

export async function generateGapAnalysis(orgId: string): Promise<{
  missing: string[];
  weak: string[];
  outdated: string[];
  unmapped: string[];
}> {
  if (!isAIConfigured()) {
    return { missing: [], weak: [], outdated: [], unmapped: [] };
  }

  const policies = await repo.findPoliciesByOrg(orgId);
  const ai = getAI();

  const policyList = policies
    .map((p) => `- ${p.name} (Type: ${p.policyType ?? "N/A"}, Status: ${p.status}, Version: ${p.version}, Controls: ${p.controlCount}, Frameworks: ${p.frameworkCount})`)
    .join("\n");

  const prompt = `You are a GRC policy auditor. Analyse this organisation's policy library and identify gaps.

Current Policies:
${policyList || "No policies found."}

Based on common enterprise governance requirements (ISO 27001, SOC 2, DPDP, HIPAA, etc.), identify:
1. MISSING policies — important policy types not present
2. WEAK policies — policies with low control/framework linkage or problematic status
3. OUTDATED policies — policies likely needing review (check for common outdated types)
4. UNMAPPED policies — policies not linked to frameworks or controls

Return ONLY a JSON object with this exact shape (no markdown, no explanation):
{
  "missing": ["policy name / type 1", "policy name 2"],
  "weak": ["policy name 1", "policy name 2"],
  "outdated": ["policy name 1"],
  "unmapped": ["policy name 1", "policy name 2"]
}

Limit each array to 5 items maximum. Be specific and actionable.`;

  try {
    const result = await ai.models.generateContent({
      model: AI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { thinkingConfig: { thinkingBudget: 0 } },
    });
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return {
      missing: Array.isArray(parsed.missing) ? parsed.missing : [],
      weak: Array.isArray(parsed.weak) ? parsed.weak : [],
      outdated: Array.isArray(parsed.outdated) ? parsed.outdated : [],
      unmapped: Array.isArray(parsed.unmapped) ? parsed.unmapped : [],
    };
  } catch {
    return { missing: [], weak: [], outdated: [], unmapped: [] };
  }
}

// ─── Executive Summary ───────────────────────────────────────────────────────

export async function generateExecutiveSummary(orgId: string): Promise<string> {
  if (!isAIConfigured()) return "AI is not configured.";

  const cacheKey = "policy_executive_summary";
  const cached = await getCached(orgId, cacheKey, orgId);
  if (cached) return cached;

  const metrics = await repo.getDashboardMetrics(orgId);
  const ai = getAI();

  const prompt = `You are a Chief Compliance Officer. Write a board-ready executive summary of the organisation's Policy Governance™ posture.

Policy Metrics:
- Total Policies: ${metrics.total}
- Published/Approved: ${metrics.published + metrics.approved}
- Under Review: ${metrics.review}
- Draft: ${metrics.draft}
- Expired: ${metrics.expired}
- Policies Due for Review (30 days): ${metrics.dueSoon}
- Overdue Reviews: ${metrics.overdue}
- Average Policy Health Score: ${metrics.avgHealth}/100
- Organisation Attestation Rate: ${metrics.attestationRate}%

Write 3–4 paragraphs covering: overall policy governance posture, key strengths, critical gaps, and recommended priorities. Use executive language suitable for a board report.`;

  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  await saveCache(orgId, cacheKey, orgId, text);
  return text;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export async function chat(
  orgId: string,
  messages: Array<{ role: "user" | "model"; content: string }>
): Promise<string> {
  if (!isAIConfigured()) return "AI is not configured.";

  const metrics = await repo.getDashboardMetrics(orgId);
  const ai = getAI();

  const systemContext = `You are a Policy Governance AI Advisor for an enterprise organisation.

Current Policy Posture:
- Total Policies: ${metrics.total}
- Published: ${metrics.published}, Approved: ${metrics.approved}, Draft: ${metrics.draft}
- Expired: ${metrics.expired}, Overdue Reviews: ${metrics.overdue}
- Average Health Score: ${metrics.avgHealth}/100
- Attestation Rate: ${metrics.attestationRate}%

You help governance, risk, and compliance teams manage their policy library. Answer questions about policy gaps, review schedules, attestation status, and compliance mapping. Be concise, specific, and actionable.`;

  const contents = [
    { role: "user" as const, parts: [{ text: systemContext }] },
    { role: "model" as const, parts: [{ text: "Understood. I'm your Policy Governance Advisor. How can I help with your policy management today?" }] },
    ...messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
  ];

  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents,
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });
  return result.candidates?.[0]?.content?.parts?.[0]?.text ?? "Unable to generate response.";
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

async function getCached(orgId: string, cacheKey: string, targetId: string): Promise<string | null> {
  const cutoff = new Date(Date.now() - CACHE_TTL_MS);
  const rows = await db
    .select({ content: aiComplianceInsights.content })
    .from(aiComplianceInsights)
    .where(
      and(
        eq(aiComplianceInsights.organizationId, orgId),
        eq(aiComplianceInsights.insightType, cacheKey),
        eq(aiComplianceInsights.targetId, targetId),
        gt(aiComplianceInsights.generatedAt, cutoff)
      )
    )
    .limit(1);
  return rows[0]?.content ?? null;
}

async function saveCache(orgId: string, cacheKey: string, targetId: string, content: string): Promise<void> {
  await db
    .insert(aiComplianceInsights)
    .values({
      organizationId: orgId,
      insightType: cacheKey,
      targetId,
      content,
    })
    .onConflictDoNothing();
}
