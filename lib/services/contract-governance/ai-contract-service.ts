import { getAI, AI_MODEL, isAIConfigured } from "@/lib/providers/ai";
import { db } from "@/lib/db";
import { aiComplianceInsights } from "@/lib/db/schema";
import { and, eq, gt } from "drizzle-orm";
import * as repo from "@/lib/repositories/contract-repo";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// ─── Extract Contract Data ───────────────────────────────────────────────────

export async function extractContractData(
  orgId: string,
  contractText: string
): Promise<{
  clauses: Array<{ title: string; category: string; content: string; riskLevel: string }>;
  obligations: Array<{ title: string; description: string; dueDate?: string; riskLevel: string }>;
  summary: string;
}> {
  if (!isAIConfigured()) {
    return { clauses: [], obligations: [], summary: "AI is not configured." };
  }

  const ai = getAI();
  const prompt = `You are a contract analysis AI. Analyse the following contract text and extract key information.

Contract text:
${contractText.slice(0, 8000)}

Extract and return ONLY a JSON object with this exact shape (no markdown, no explanation):
{
  "clauses": [
    {"title": "string", "category": "privacy|security|financial|operational|legal|compliance|termination|renewal|custom", "content": "string (max 300 chars)", "riskLevel": "low|medium|high|critical"}
  ],
  "obligations": [
    {"title": "string", "description": "string", "dueDate": "YYYY-MM-DD or null", "riskLevel": "low|medium|high|critical"}
  ],
  "summary": "2-3 sentence plain-English summary of what this contract covers"
}

Limit to 15 clauses and 10 obligations. Focus on the most important items.`;

  try {
    const result = await ai.models.generateContent({
      model: AI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return {
      clauses: Array.isArray(parsed.clauses) ? parsed.clauses : [],
      obligations: Array.isArray(parsed.obligations) ? parsed.obligations : [],
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
    };
  } catch {
    return { clauses: [], obligations: [], summary: "" };
  }
}

// ─── Analyse Clause ──────────────────────────────────────────────────────────

export async function analyzeClause(
  orgId: string,
  clauseContent: string
): Promise<{ purpose: string; risk: string; impact: string; recommendations: string[] }> {
  if (!isAIConfigured()) {
    return { purpose: "", risk: "unknown", impact: "", recommendations: [] };
  }

  const ai = getAI();
  const prompt = `You are a contract risk analyst. Analyse the following contract clause and return ONLY a JSON object (no markdown):

Clause:
${clauseContent.slice(0, 2000)}

Return:
{
  "purpose": "what this clause does in plain English",
  "risk": "low|medium|high|critical",
  "impact": "business impact if this clause is unfavourable",
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

  try {
    const result = await ai.models.generateContent({
      model: AI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return {
      purpose: parsed.purpose ?? "",
      risk: parsed.risk ?? "medium",
      impact: parsed.impact ?? "",
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch {
    return { purpose: "", risk: "medium", impact: "", recommendations: [] };
  }
}

// ─── Generate Obligations ────────────────────────────────────────────────────

export async function generateObligations(
  orgId: string,
  contractId: string
): Promise<Array<{ title: string; description: string; riskLevel: string }>> {
  if (!isAIConfigured()) return [];

  const contract = await repo.findContractById(orgId, contractId);
  if (!contract) return [];

  const ai = getAI();
  const clauseList = contract.clauses
    .map((c) => `- ${c.title} (${c.category}): ${c.content.slice(0, 200)}`)
    .join("\n");

  const prompt = `You are a contract obligations expert. Based on the following contract clauses, suggest key obligations the organisation must fulfil.

Contract: ${contract.title} (${contract.contractType})
Clauses:
${clauseList || "No clauses added yet."}

Suggest up to 8 concrete obligations. Return ONLY a JSON array (no markdown):
[
  {"title": "string", "description": "string", "riskLevel": "low|medium|high|critical"}
]`;

  try {
    const result = await ai.models.generateContent({
      model: AI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── Generate Risk Assessment ────────────────────────────────────────────────

export async function generateRiskAssessment(
  orgId: string,
  contractId: string
): Promise<{
  highRiskClauses: string[];
  missingProtections: string[];
  renewalRisks: string[];
  privacyGaps: string[];
}> {
  if (!isAIConfigured()) {
    return { highRiskClauses: [], missingProtections: [], renewalRisks: [], privacyGaps: [] };
  }

  const contract = await repo.findContractById(orgId, contractId);
  if (!contract) {
    return { highRiskClauses: [], missingProtections: [], renewalRisks: [], privacyGaps: [] };
  }

  const ai = getAI();
  const clauseList = contract.clauses
    .map((c) => `- [${c.riskLevel.toUpperCase()}] ${c.title} (${c.category})`)
    .join("\n");

  const today = new Date();
  const daysUntilExpiry = contract.expiryDate
    ? Math.floor((new Date(contract.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const prompt = `You are a contract risk assessor. Review this contract and identify risk areas.

Contract: ${contract.title}
Type: ${contract.contractType}
Status: ${contract.status}
Expiry: ${contract.expiryDate ?? "not set"} (${daysUntilExpiry !== null ? daysUntilExpiry + " days" : "unknown"})
Auto-renewal: ${contract.autoRenewal ? "Yes" : "No"}

Clauses present:
${clauseList || "No clauses added."}

Return ONLY a JSON object (no markdown):
{
  "highRiskClauses": ["clause name or area 1", "clause name 2"],
  "missingProtections": ["missing protection 1", "missing protection 2"],
  "renewalRisks": ["renewal risk 1"],
  "privacyGaps": ["privacy gap 1"]
}

Limit each array to 4 items.`;

  try {
    const result = await ai.models.generateContent({
      model: AI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return {
      highRiskClauses: Array.isArray(parsed.highRiskClauses) ? parsed.highRiskClauses : [],
      missingProtections: Array.isArray(parsed.missingProtections) ? parsed.missingProtections : [],
      renewalRisks: Array.isArray(parsed.renewalRisks) ? parsed.renewalRisks : [],
      privacyGaps: Array.isArray(parsed.privacyGaps) ? parsed.privacyGaps : [],
    };
  } catch {
    return { highRiskClauses: [], missingProtections: [], renewalRisks: [], privacyGaps: [] };
  }
}

// ─── Executive Summary ───────────────────────────────────────────────────────

export async function generateExecutiveSummary(orgId: string): Promise<string> {
  if (!isAIConfigured()) return "AI is not configured.";

  const cacheKey = "contract_executive_summary";
  const cached = await getCached(orgId, cacheKey, orgId);
  if (cached) return cached;

  const metrics = await repo.getDashboardMetrics(orgId);
  const ai = getAI();

  const prompt = `You are a Chief Legal Officer. Write a board-ready executive summary of the organisation's Contract Governance™ posture.

Contract Portfolio Metrics:
- Total Contracts: ${metrics.total}
- Active: ${metrics.active}
- Expiring within 90 days: ${metrics.expiring}
- Expired: ${metrics.expired}
- Renewals Due: ${metrics.renewalsDue}
- Total Portfolio Value: ${metrics.totalValue.toLocaleString("en-US", { style: "currency", currency: "USD" })}
- Active Portfolio Value: ${metrics.activeValue.toLocaleString("en-US", { style: "currency", currency: "USD" })}

Write 3–4 paragraphs covering: overall contract governance posture, key risks (especially expiring contracts), recommended actions, and renewal priorities. Use executive language suitable for a board report.`;

  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
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

  const systemContext = `You are a Contract Governance AI Advisor for an enterprise organisation.

Current Contract Portfolio:
- Total Contracts: ${metrics.total}
- Active: ${metrics.active}
- Expiring (90 days): ${metrics.expiring}
- Expired: ${metrics.expired}
- Renewals Due (30 days): ${metrics.renewalsDue}
- Total Value: $${metrics.totalValue.toLocaleString()}

You help legal and procurement teams manage contract risk, track obligations, and ensure timely renewals. Be concise, specific, and actionable.`;

  const contents = [
    { role: "user" as const, parts: [{ text: systemContext }] },
    { role: "model" as const, parts: [{ text: "Understood. I'm your Contract Governance Advisor. How can I help with your contract management today?" }] },
    ...messages.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
  ];

  const result = await ai.models.generateContent({ model: AI_MODEL, contents });
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
    .values({ organizationId: orgId, insightType: cacheKey, targetId, content })
    .onConflictDoNothing();
}
