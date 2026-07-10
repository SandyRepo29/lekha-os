import { db } from "@/lib/db";
import { aiComplianceInsights } from "@/lib/db/schema";
import { getAI, AI_MODEL, isAIConfigured } from "@/lib/providers/ai";
import { eq, and, desc } from "drizzle-orm";

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

export async function generateTrustSummary(orgId: string, profileData: {
  displayName: string;
  trustScore?: number | null;
  totalDocuments: number;
  verifiedDocuments: number;
  activeBadges: number;
  completedQuestionnaires: number;
  isPublished: boolean;
  profileCompleteness: number;
}): Promise<string> {
  const cached = await getCached(orgId, "trust_exchange_summary");
  if (cached) return cached;
  if (!isAIConfigured()) return "";

  const ai = getAI();
  const prompt = `You are an AI Trust Analyst for AUDT, an AI-native Trust, Risk & Compliance platform.

Analyze this organization's Trust Exchange profile and provide a concise executive summary (3-4 sentences) suitable for a vendor profile page.

Organization: ${profileData.displayName}
Trust Score: ${profileData.trustScore ?? "Not yet computed"}
Profile Completeness: ${profileData.profileCompleteness}%
Published: ${profileData.isPublished ? "Yes" : "No — private profile"}
Documents Uploaded: ${profileData.totalDocuments} (${profileData.verifiedDocuments} verified)
Trust Badges: ${profileData.activeBadges}
Questionnaires Completed: ${profileData.completedQuestionnaires}

Provide a balanced, professional summary of this organization's trust posture and Exchange readiness. Mention strengths and any gaps. Do not use markdown formatting.`;

  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (content) await saveCache(orgId, "trust_exchange_summary", content);
  return content;
}

export async function analyzeDocument(orgId: string, doc: {
  title: string;
  docType: string;
  issuer?: string | null;
  issuedDate?: string | null;
  expiryDate?: string | null;
  description?: string | null;
}): Promise<{ risk: string; findings: string[]; recommendation: string }> {
  if (!isAIConfigured()) return { risk: "unknown", findings: [], recommendation: "" };

  const ai = getAI();
  const prompt = `You are an AI Evidence Validator for AUDT Trust Exchange.

Analyze this trust document and provide a JSON response.

Document: ${doc.title}
Type: ${doc.docType}
Issuer: ${doc.issuer ?? "Unknown"}
Issued: ${doc.issuedDate ?? "Unknown"}
Expires: ${doc.expiryDate ?? "Unknown"}
Description: ${doc.description ?? "None"}

Today's date: ${new Date().toISOString().split("T")[0]}

Respond ONLY with JSON in this exact format:
{
  "risk": "low|medium|high",
  "findings": ["finding 1", "finding 2"],
  "recommendation": "one sentence recommendation"
}`;

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
    return { risk: "unknown", findings: [], recommendation: "" };
  }
}

export async function generateQuestionnaireSuggestions(category: string, existingAnswers: Record<string, unknown>): Promise<Array<{ question: string; suggestedAnswer: string }>> {
  if (!isAIConfigured()) return [];

  const ai = getAI();
  const prompt = `You are an AI Questionnaire Assistant for AUDT Trust Exchange.

Generate 5 helpful question-answer suggestions for a ${category} security questionnaire.
Consider these existing answers for context: ${JSON.stringify(existingAnswers).slice(0, 500)}

Respond ONLY with a JSON array:
[{"question": "...", "suggestedAnswer": "..."}]`;

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

export async function chat(orgId: string, profileContext: Record<string, unknown>, messages: Array<{ role: "user" | "model"; text: string }>): Promise<string> {
  if (!isAIConfigured()) return "AI is not configured.";

  const ai = getAI();
  const systemPrompt = `You are the AI Trust Analyst for AUDT's Third-Party Risk Exchange™.

Organization context:
${JSON.stringify(profileContext, null, 2)}

You help users understand their trust posture, compare vendor profiles, identify gaps in their trust documentation, and improve their Trust Profile. Be concise and actionable.`;

  const contents = [
    { role: "user" as const, parts: [{ text: systemPrompt }] },
    { role: "model" as const, parts: [{ text: "Understood. I'm ready to help with your Trust Exchange analysis." }] },
    ...messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
  ];

  const result = await ai.models.generateContent({
    model: AI_MODEL,
    contents,
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });
  return result.candidates?.[0]?.content?.parts?.[0]?.text ?? "I couldn't generate a response.";
}
