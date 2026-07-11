"use server";

import { getAI, AI_MODEL, isAIConfigured } from "@/lib/providers/ai";
import { db } from "@/lib/db";
import { aiComplianceInsights } from "@/lib/db/schema";
import { and, eq, gt } from "drizzle-orm";

const CACHE_HOURS = 24;

async function getCached(orgId: string, targetId: string, insightType: string): Promise<string | null> {
  const cutoff = new Date(Date.now() - CACHE_HOURS * 3600 * 1000);
  const rows = await db.select().from(aiComplianceInsights).where(
    and(eq(aiComplianceInsights.organizationId, orgId), eq(aiComplianceInsights.targetId, targetId), eq(aiComplianceInsights.insightType, insightType), gt(aiComplianceInsights.generatedAt, cutoff))
  ).limit(1);
  return rows[0]?.content ?? null;
}

async function saveCache(orgId: string, targetId: string, insightType: string, content: string) {
  await db.insert(aiComplianceInsights).values({ organizationId: orgId, targetId, insightType, content, generatedAt: new Date() })
    .onConflictDoUpdate({ target: [aiComplianceInsights.organizationId, aiComplianceInsights.targetId, aiComplianceInsights.insightType], set: { content, generatedAt: new Date() } });
}

// ── Verification Advisor™ — eligibility analysis ──────────────────────────────

export async function generateEligibilityAnalysis(orgId: string, context: {
  programName: string; minTrustScore: number; currentTrustScore: number;
  controlHealth: number; evidenceCoverage: number; openCriticalRisks: number;
  requirements: Array<{ id: string; label: string }>;
}): Promise<string> {
  if (!isAIConfigured()) return "AI analysis unavailable — configure GEMINI_API_KEY to enable.";
  const cached = await getCached(orgId, orgId, `verification_eligibility_${context.programName}`);
  if (cached) return cached;

  const ai = getAI();
  const prompt = `You are the AUDT Trust Verification Advisor™. AUDT is an enterprise Governance, Risk & Compliance (GRC) platform — verification programs certify organizational governance practices (trust score, controls, evidence, risk posture), not blockchain, cryptocurrency, smart contracts, or digital assets. Analyse the following organization's eligibility for the "${context.programName}" verification program.

Current metrics:
- Trust Score: ${context.currentTrustScore}/100 (minimum required: ${context.minTrustScore})
- Control Health: ${context.controlHealth}%
- Evidence Coverage: ${context.evidenceCoverage}%
- Open Critical Risks: ${context.openCriticalRisks}

Requirements: ${context.requirements.map(r => r.label).join(", ")}

Provide a concise 3-paragraph analysis:
1. Current eligibility status — are they ready, near-ready, or not ready? Give approval probability (0–100%).
2. Top 3 gaps preventing or risking approval — be specific with numbers.
3. Top 3 actionable steps to become eligible within 30 days.

Keep each paragraph to 3–4 sentences. Write in a professional, advisory tone.`;

  const result = await ai.models.generateContent({ model: AI_MODEL, contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: 0 } }, });
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "Analysis unavailable.";
  await saveCache(orgId, orgId, `verification_eligibility_${context.programName}`, content);
  return content;
}

// ── Platform Summary™ ─────────────────────────────────────────────────────────

export async function generatePlatformSummary(orgId: string, context: {
  totalVerifications: number; approved: number; pending: number;
  activeCerts: number; activeBadges: number; expiringSoon: number;
}): Promise<string> {
  if (!isAIConfigured()) return "AI summary unavailable — configure GEMINI_API_KEY to enable.";
  const cached = await getCached(orgId, orgId, "tva_platform_summary");
  if (cached) return cached;

  const ai = getAI();
  const prompt = `You are the AUDT Trust Verification Authority™ AI Advisor. Generate a brief executive summary of this organization's trust verification posture.

Verification Portfolio:
- Total applications: ${context.totalVerifications}
- Approved: ${context.approved}
- Pending: ${context.pending}
- Active certificates: ${context.activeCerts}
- Active badges: ${context.activeBadges}
- Expiring within 30 days: ${context.expiringSoon}

Write a 2-paragraph executive summary:
1. Overall trust verification status and what it signals to the market.
2. Key actions needed — renewals, pending reviews, improvement opportunities.

Keep it board-ready: crisp, confident, under 100 words per paragraph.`;

  const result = await ai.models.generateContent({ model: AI_MODEL, contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: 0 } }, });
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "Summary unavailable.";
  await saveCache(orgId, orgId, "tva_platform_summary", content);
  return content;
}

// ── AI Evidence Reviewer™ ─────────────────────────────────────────────────────

export async function analyzeEvidenceQuality(orgId: string, evidence: Array<{
  title: string; evidenceType: string; status: string; freshnessDays?: number;
}>): Promise<string> {
  if (!isAIConfigured()) return "AI analysis unavailable — configure GEMINI_API_KEY to enable.";

  const ai = getAI();
  const prompt = `You are the AUDT AI Evidence Reviewer™. AUDT is an enterprise Governance, Risk & Compliance (GRC) platform — this evidence review is about organizational governance documents (policies, audit reports, risk registers), not blockchain, cryptocurrency, or smart contracts. Analyze the following evidence submitted for a trust verification application.

Evidence items (${evidence.length} total):
${evidence.map(e => `- ${e.title} (${e.evidenceType}) — Status: ${e.status}${e.freshnessDays ? `, Age: ${e.freshnessDays} days` : ""}`).join("\n")}

Provide a structured review in 3 sections:
1. **Evidence Quality** — overall assessment of the evidence package
2. **Coverage Gaps** — what critical evidence types are missing or stale
3. **Recommendations** — top 3 actions to strengthen the evidence package

Keep it concise: 2–3 sentences per section.`;

  const result = await ai.models.generateContent({ model: AI_MODEL, contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: 0 } }, });
  return result.candidates?.[0]?.content?.parts?.[0]?.text ?? "Analysis unavailable.";
}

// ── AI Trust Assessor™ ────────────────────────────────────────────────────────

export async function generateVerificationAssessment(orgId: string, context: {
  programName: string; readinessScore: number; trustScore: number;
  controlHealth: number; complianceCoverage: number; openRisks: number;
  evidenceCount: number; acceptedEvidence: number;
}): Promise<string> {
  if (!isAIConfigured()) return "Assessment unavailable — configure GEMINI_API_KEY to enable.";

  const ai = getAI();
  const prompt = `You are the AUDT AI Trust Assessor™. Generate a formal verification assessment for the "${context.programName}" program.

Organization metrics:
- Verification Readiness Score: ${context.readinessScore}/100
- Trust Score: ${context.trustScore}/100
- Control Health: ${context.controlHealth}%
- Compliance Coverage: ${context.complianceCoverage}%
- Open Risks: ${context.openRisks}
- Evidence Submitted: ${context.evidenceCount} (${context.acceptedEvidence} accepted)

Generate a formal assessment with:
1. **Governance Assessment** — overall governance posture (2–3 sentences)
2. **Risk Summary** — risk exposure and management quality (2–3 sentences)
3. **Approval Recommendation** — clear recommendation (Approve / Conditionally Approve / Reject) with primary justification

Format with markdown headers. Be decisive and specific.`;

  const result = await ai.models.generateContent({ model: AI_MODEL, contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: 0 } }, });
  return result.candidates?.[0]?.content?.parts?.[0]?.text ?? "Assessment unavailable.";
}

// ── NL Chat ───────────────────────────────────────────────────────────────────

export async function chat(orgId: string, messages: Array<{ role: "user" | "model"; content: string }>, context: {
  totalVerifications: number; approved: number; activeCerts: number; activeBadges: number;
}): Promise<string> {
  if (!isAIConfigured()) return "AI chat unavailable — configure GEMINI_API_KEY to enable.";

  const ai = getAI();
  const system = `You are the AUDT Trust Verification Authority™ AI Advisor. AUDT is an enterprise Governance, Risk & Compliance (GRC) platform — verification here means certifying organizational governance practices (trust score, controls, evidence, risk posture), not blockchain, cryptocurrency, smart contracts, or digital assets. Help the user understand their verification status, certificates, and how to achieve or maintain trust verification.

Current context:
- Total applications: ${context.totalVerifications}
- Approved: ${context.approved}
- Active certificates: ${context.activeCerts}
- Active badges: ${context.activeBadges}

Answer in 2–4 sentences. Be specific, helpful, and action-oriented.`;

  const contents = [
    { role: "user" as const, parts: [{ text: system }] },
    { role: "model" as const, parts: [{ text: "Understood. I'm your Trust Verification Advisor — I can help with eligibility, evidence requirements, certificate status, and renewal planning. What do you need?" }] },
    ...messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
  ];

  try {
    const result = await ai.models.generateContent({
      model: AI_MODEL,
      contents,
      config: { thinkingConfig: { thinkingBudget: 0 } },
    });
    return result.candidates?.[0]?.content?.parts?.[0]?.text ?? "Unable to respond at this time.";
  } catch {
    return "The AI advisor is temporarily unavailable — please try again in a moment.";
  }
}
