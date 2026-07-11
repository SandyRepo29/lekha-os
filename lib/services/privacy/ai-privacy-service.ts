import { getAI, AI_MODEL, isAIConfigured } from "@/lib/providers/ai";
import { db } from "@/lib/db";
import { aiComplianceInsights } from "@/lib/db/schema";
import { and, eq, gt } from "drizzle-orm";
import * as repo from "@/lib/repositories/privacy-repo";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// ─── Executive Privacy Summary ────────────────────────────────────────────────

export async function generatePrivacySummary(orgId: string): Promise<string> {
  if (!isAIConfigured()) return "AI is not configured. Please add your GEMINI_API_KEY.";

  const cacheKey = "privacy_executive_summary";
  const cached = await getCached(orgId, cacheKey, orgId);
  if (cached) return cached;

  const [assetMetrics, consentMetrics, dsrMetrics, latestScore] = await Promise.all([
    repo.getDataAssetDashboardMetrics(orgId),
    repo.getConsentMetrics(orgId),
    repo.getDsrMetrics(orgId),
    repo.getLatestPrivacyScore(orgId),
  ]);

  const ai = getAI();

  const prompt = `You are a Data Protection Officer (DPO) for an Indian enterprise. Write a board-ready executive summary of the organisation's DPDP Privacy posture.

Data Inventory:
- Total Data Assets: ${assetMetrics.total}
- Sensitive Assets (high/critical): ${assetMetrics.sensitive}
- Cross-Border Assets: ${assetMetrics.crossBorder}
- Unclassified Assets: ${assetMetrics.unclassified}

Consent Management:
- Active Consents: ${consentMetrics.active}
- Expired Consents: ${consentMetrics.expired}
- Withdrawn: ${consentMetrics.withdrawn}
- Pending: ${consentMetrics.pending}

Data Subject Requests (DSR):
- Total: ${dsrMetrics.total}
- Open: ${dsrMetrics.open}
- Overdue (past 30-day DPDP SLA): ${dsrMetrics.overdue}
- Avg Resolution Days: ${dsrMetrics.avgResolutionDays}

Privacy Trust Score™: ${latestScore?.score ?? "Not computed"}/100

Write 3–4 paragraphs covering: overall DPDP compliance posture, key strengths, critical gaps, and recommended priorities for the board. Reference DPDP Act 2023 obligations where relevant.`;

  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  await saveCache(orgId, cacheKey, orgId, text);
  return text;
}

// ─── PIA Generation ──────────────────────────────────────────────────────────

export async function generatePiaFromScope(
  orgId: string,
  scope: string,
  purpose: string
): Promise<{
  risks: string;
  mitigations: string;
  controls: string;
  residualRisk: string;
  dataTypes: string;
  riskLevel: string;
}> {
  if (!isAIConfigured()) {
    return {
      risks: "AI not configured.",
      mitigations: "",
      controls: "",
      residualRisk: "",
      dataTypes: "",
      riskLevel: "medium",
    };
  }

  const ai = getAI();

  const prompt = `You are a privacy expert conducting a Privacy Impact Assessment (PIA) under India's DPDP Act 2023.

Processing Activity Scope: ${scope}
Purpose of Processing: ${purpose}

Generate a structured PIA assessment. Return ONLY a JSON object with this exact shape (no markdown, no explanation):
{
  "dataTypes": "comma-separated list of personal data types involved",
  "risks": "3-5 bullet points of privacy risks identified",
  "mitigations": "3-5 bullet points of proposed mitigations",
  "controls": "list of technical and organizational controls required",
  "residualRisk": "description of remaining risk after mitigations",
  "riskLevel": "low|medium|high|critical"
}

Be specific and reference DPDP Act requirements (consent, purpose limitation, data minimisation, storage limitation, cross-border transfer restrictions).`;

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
      risks: typeof parsed.risks === "string" ? parsed.risks : "",
      mitigations: typeof parsed.mitigations === "string" ? parsed.mitigations : "",
      controls: typeof parsed.controls === "string" ? parsed.controls : "",
      residualRisk: typeof parsed.residualRisk === "string" ? parsed.residualRisk : "",
      dataTypes: typeof parsed.dataTypes === "string" ? parsed.dataTypes : "",
      riskLevel: typeof parsed.riskLevel === "string" ? parsed.riskLevel : "medium",
    };
  } catch {
    return {
      risks: "Unable to generate assessment.",
      mitigations: "",
      controls: "",
      residualRisk: "",
      dataTypes: "",
      riskLevel: "medium",
    };
  }
}

// ─── Consent Analysis ────────────────────────────────────────────────────────

export async function generateConsentAnalysis(
  orgId: string
): Promise<Array<{ issue: string; severity: "low" | "medium" | "high" | "critical" }>> {
  if (!isAIConfigured()) return [];

  const metrics = await repo.getConsentMetrics(orgId);
  const totalConsents = Object.values(metrics).reduce((a, b) => a + b, 0);
  const ai = getAI();

  const prompt = `You are a DPDP compliance specialist. Analyse this consent management posture and identify issues.

Consent Records:
- Active (Granted): ${metrics.active}
- Expired: ${metrics.expired}
- Withdrawn: ${metrics.withdrawn}
- Pending: ${metrics.pending}
- Total: ${totalConsents}

Identify up to 5 consent management issues relevant to DPDP Act 2023 compliance. Return ONLY a JSON array:
[
  {"issue": "description of issue", "severity": "low|medium|high|critical"},
  ...
]

Focus on DPDP Act requirements: freely given consent, right to withdraw, consent notice, granular consent.`;

  try {
    const result = await ai.models.generateContent({
      model: AI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { thinkingConfig: { thinkingBudget: 0 } },
    });
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export async function chat(
  orgId: string,
  messages: Array<{ role: "user" | "model"; content: string }>
): Promise<string> {
  if (!isAIConfigured()) return "AI is not configured.";

  const [assetMetrics, consentMetrics, dsrMetrics, latestScore] = await Promise.all([
    repo.getDataAssetDashboardMetrics(orgId),
    repo.getConsentMetrics(orgId),
    repo.getDsrMetrics(orgId),
    repo.getLatestPrivacyScore(orgId),
  ]);

  const ai = getAI();

  const systemContext = `You are an AI Privacy Officer specialising in India's Digital Personal Data Protection (DPDP) Act 2023.

Current Privacy Posture:
- Data Assets: ${assetMetrics.total} total (${assetMetrics.sensitive} sensitive, ${assetMetrics.crossBorder} cross-border, ${assetMetrics.unclassified} unclassified)
- Consents: ${consentMetrics.active} active, ${consentMetrics.expired} expired, ${consentMetrics.withdrawn} withdrawn
- DSR Requests: ${dsrMetrics.total} total, ${dsrMetrics.open} open, ${dsrMetrics.overdue} overdue (30-day DPDP SLA)
- Privacy Trust Score™: ${latestScore?.score ?? "Not computed"}/100

You help Data Protection Officers, compliance teams, and privacy professionals manage DPDP obligations. Answer questions about consent management, data subject rights, cross-border transfers, retention policies, PIAs, and DPDP Act compliance. Be concise, specific, and actionable. Reference specific DPDP Act 2023 provisions when relevant.`;

  const contents = [
    { role: "user" as const, parts: [{ text: systemContext }] },
    {
      role: "model" as const,
      parts: [
        {
          text: "Understood. I'm your AI Privacy Officer. How can I help with your DPDP compliance today?",
        },
      ],
    },
    ...messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
  ];

  try {
    const result = await ai.models.generateContent({
      model: AI_MODEL,
      contents,
      config: { thinkingConfig: { thinkingBudget: 0 } },
    });
    return (
      result.candidates?.[0]?.content?.parts?.[0]?.text ?? "Unable to generate response."
    );
  } catch {
    return "The AI advisor is temporarily unavailable — please try again in a moment.";
  }
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

async function getCached(
  orgId: string,
  cacheKey: string,
  targetId: string
): Promise<string | null> {
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

async function saveCache(
  orgId: string,
  cacheKey: string,
  targetId: string,
  content: string
): Promise<void> {
  await db
    .insert(aiComplianceInsights)
    .values({ organizationId: orgId, insightType: cacheKey, targetId, content })
    .onConflictDoNothing();
}
