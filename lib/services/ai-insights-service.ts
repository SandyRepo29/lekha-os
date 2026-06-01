import { GoogleGenAI, Type } from "@google/genai";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import * as vendorRepo from "@/lib/repositories/vendor-repo";
import * as documentRepo from "@/lib/repositories/document-repo";
import * as assessmentRepo from "@/lib/repositories/assessment-repo";
import { STANDARD_QUESTIONS } from "@/lib/constants/assessment-questions";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const TEMP = 0.4;

function gemini() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

/** Plain-text generation shortcut. */
async function generateText(prompt: string, maxTokens = 400): Promise<string> {
  const res = await gemini().models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { temperature: TEMP, maxOutputTokens: maxTokens },
  });
  return res.text?.trim() ?? "";
}

/* ============================================================
   1. AI Score Explanation
   ============================================================ */

export async function generateScoreExplanation(orgId: string, vendorId: string): Promise<string> {
  if (!isGeminiConfigured()) throw new Error("Gemini not configured.");
  const vendor = await vendorRepo.findById(orgId, vendorId);
  if (!vendor) throw new Error("Vendor not found.");
  const docs = await documentRepo.listByVendor(orgId, vendorId);

  const valid    = docs.filter((d) => d.status === "valid").length;
  const expiring = docs.filter((d) => d.status === "expiring").length;
  const expired  = docs.filter((d) => d.status === "expired").length;
  const base: Record<string, number> = { low: 70, medium: 60, high: 45, critical: 30 };
  const riskBase = base[vendor.riskLevel] ?? 60;
  const docBonus = Math.min(valid * 5, 40);
  const expiryPenalty = expiring * 10;
  const expiredPenalty = expired * 20;
  const maxScore = riskBase + 40;

  const prompt = `You are a compliance analyst explaining a vendor compliance score to a business manager.

Vendor: ${vendor.name}
Risk level: ${vendor.riskLevel}
Current score: ${vendor.complianceScore}/100
Score formula: Base (${riskBase}) + Valid docs bonus (${docBonus}) - Expiring docs (${expiryPenalty}) - Expired docs (${expiredPenalty})
Documents: ${valid} valid, ${expiring} expiring soon, ${expired} expired
Max achievable score: ${maxScore}/100

Write 2-3 clear, concise sentences explaining exactly why the score is ${vendor.complianceScore}. Be specific about what is contributing to or reducing the score. Use plain business English — no jargon. End with what the single most impactful action to improve the score would be.`;

  const text = await generateText(prompt, 200);
  await vendorRepo.updateVendor(vendorId, {
    aiScoreExplanation: text,
    aiScoreExplainedAt: new Date(),
  });
  return text;
}

/* ============================================================
   2. AI Risk Explanation
   ============================================================ */

export async function generateRiskExplanation(
  orgId: string,
  vendorId: string,
  riskFactors: { label: string; impact: string; detail: string }[]
): Promise<string> {
  if (!isGeminiConfigured()) throw new Error("Gemini not configured.");
  const vendor = await vendorRepo.findById(orgId, vendorId);
  if (!vendor) throw new Error("Vendor not found.");

  const factorLines = riskFactors
    .map((f) => `- [${f.impact.toUpperCase()}] ${f.label}: ${f.detail}`)
    .join("\n");

  const prompt = `You are a risk analyst explaining a vendor risk assessment to a compliance manager.

Vendor: ${vendor.name}
Category: ${vendor.category ?? "Unknown"}
Declared risk level: ${vendor.riskLevel}
Computed risk score: high/medium/low based on the factors below

Risk factors identified:
${factorLines}

Write 3-4 sentences in plain English that:
1. Summarise the overall risk picture for this vendor
2. Call out the most serious risk factors and why they matter
3. State what the vendor's team should address first to reduce risk

Be direct and actionable. No jargon. Write for a compliance manager who needs to brief their team.`;

  const text = await generateText(prompt, 250);
  await vendorRepo.updateVendor(vendorId, {
    aiRiskExplanation: text,
    aiRiskExplainedAt: new Date(),
  });
  return text;
}

/* ============================================================
   3. AI Recommended Actions
   ============================================================ */

export type RecommendedAction = {
  priority: "critical" | "high" | "medium" | "low";
  action: string;
  reason: string;
  impact: string; // e.g. "+15 compliance pts" or "Reduces risk level"
};

export async function generateRecommendedActions(
  orgId: string,
  vendorId: string
): Promise<RecommendedAction[]> {
  if (!isGeminiConfigured()) throw new Error("Gemini not configured.");
  const vendor = await vendorRepo.findById(orgId, vendorId);
  if (!vendor) throw new Error("Vendor not found.");
  const docs = await documentRepo.listByVendor(orgId, vendorId);

  const valid    = docs.filter((d) => d.status === "valid").length;
  const expiring = docs.filter((d) => d.status === "expiring").length;
  const expired  = docs.filter((d) => d.status === "expired").length;
  const docTypes = docs.map((d) => d.documentType).join(", ") || "none";
  const hasOwner = !!vendor.ownerName;

  const prompt = `You are a compliance advisor generating a prioritised action plan for a vendor.

Vendor: ${vendor.name}
Risk level: ${vendor.riskLevel}
Compliance score: ${vendor.complianceScore}/100
Documents uploaded: ${valid} valid, ${expiring} expiring, ${expired} expired
Document types on file: ${docTypes}
Internal owner assigned: ${hasOwner ? "Yes (" + vendor.ownerName + ")" : "No"}
Notes: ${vendor.notes ?? "None"}

Generate a prioritised list of 3-5 specific, actionable recommendations to improve this vendor's compliance posture and reduce risk. Each action should be concrete and specific to THIS vendor's situation — no generic advice.

Return ONLY valid JSON as an array of objects with these exact fields:
- priority: "critical" | "high" | "medium" | "low"
- action: short imperative action title (max 10 words)
- reason: one sentence explaining why this matters
- impact: specific expected improvement (e.g. "+10 compliance pts", "Eliminates critical risk factor")

Return only the JSON array, no other text.`;

  const res = await gemini().models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            priority: { type: Type.STRING },
            action:   { type: Type.STRING },
            reason:   { type: Type.STRING },
            impact:   { type: Type.STRING },
          },
          required: ["priority", "action", "reason", "impact"],
        },
      },
      temperature: TEMP,
    },
  });

  const actions: RecommendedAction[] = JSON.parse(res.text ?? "[]");
  await vendorRepo.updateVendor(vendorId, {
    aiRecommendedActions: actions as any,
    aiActionsGeneratedAt: new Date(),
  });
  return actions;
}

/* ============================================================
   4. AI Assessment Summary
   ============================================================ */

export async function generateAssessmentSummary(
  orgId: string,
  assessmentId: string
): Promise<string> {
  if (!isGeminiConfigured()) throw new Error("Gemini not configured.");
  const result = await assessmentRepo.getWithResponses(orgId, assessmentId);
  if (!result) throw new Error("Assessment not found.");
  const { assessment, responses } = result;

  if (!assessment.completedAt) throw new Error("Assessment is not yet completed.");

  const responseMap = new Map(responses.map((r) => [r.questionKey, r.answer ?? "no"]));
  const ANSWER_LABELS: Record<string, string> = { yes: "✓ Yes", partial: "~ Partial", no: "✗ No", na: "— N/A" };

  const questionLines = STANDARD_QUESTIONS.map((q) => {
    const answer = responseMap.get(q.key) ?? "no";
    return `[${ANSWER_LABELS[answer] ?? answer}] ${q.category}: ${q.question}`;
  }).join("\n");

  const prompt = `You are a security assessor writing a plain-English summary of a vendor security assessment for a compliance manager.

Assessment: ${assessment.title}
Final score: ${assessment.score ?? 0}/100
Completed: ${assessment.completedAt?.toLocaleDateString("en-IN") ?? "recently"}

Question responses:
${questionLines}

Write a 3-4 paragraph assessment summary that:
1. Opens with an overall verdict (strong/adequate/weak security posture) with the score
2. Identifies the 2-3 strongest areas (where the vendor answered Yes to critical questions)
3. Identifies the 2-3 most significant gaps (No or Partial answers on high-weight questions)
4. Closes with the top priority action the vendor should take

Write in professional but plain English. Be specific about which control areas are strong or weak. No jargon.`;

  const text = await generateText(prompt, 500);

  // Store on the assessment
  const { eq } = await import("drizzle-orm");
  const { db } = await import("@/lib/db");
  const { assessments } = await import("@/lib/db/schema");
  await db.update(assessments)
    .set({ aiSummary: text, aiSummaryAt: new Date(), updatedAt: new Date() })
    .where(eq(assessments.id, assessmentId));

  return text;
}
