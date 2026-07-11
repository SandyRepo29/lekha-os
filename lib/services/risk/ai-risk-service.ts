import { generateText, getAI, AI_MODEL, isAIConfigured } from "@/lib/providers/ai";
import * as riskRepo from "@/lib/repositories/risk-repo";
import * as treatmentRepo from "@/lib/repositories/risk-treatment-repo";
import * as aiInsightRepo from "@/lib/repositories/ai-compliance-repo";
import { scoreToLevel, RISK_CATEGORY_LABELS } from "@/lib/services/risk-scoring";

async function generate(prompt: string, maxTokens = 500): Promise<string> {
  return generateText(prompt, { maxTokens, temperature: 0.4 });
}

export async function generateRiskNarrative(
  orgId: string,
  riskId: string
): Promise<string> {
  if (!isAIConfigured()) throw new Error("AI not configured.");

  const risk = await riskRepo.findById(orgId, riskId);
  if (!risk) throw new Error("Risk not found.");

  const level = scoreToLevel(risk.inherentScore);

  const prompt = `You are a risk management expert. Write a clear, professional risk narrative for this risk.
Risk: ${risk.title}
Category: ${RISK_CATEGORY_LABELS[risk.category] ?? risk.category}
Description: ${risk.description ?? "Not provided"}
Impact: ${risk.impact}/5 | Likelihood: ${risk.likelihood}/5 | Score: ${risk.inherentScore}/25 (${level})
Treatment Strategy: ${risk.treatmentStrategy ?? "Not set"}

Write 3-4 sentences covering: business impact, threat scenario, and likelihood rationale. Professional tone, no markdown.`;

  const text = await generate(prompt, 350);

  await riskRepo.updateRisk(riskId, { aiNarrative: text, aiNarrativeAt: new Date() } as any);
  await aiInsightRepo.upsertInsight({
    organizationId: orgId,
    insightType: "risk_narrative",
    targetId: riskId,
    content: text,
  });
  return text;
}

export async function generateRiskFromObservation(observation: string): Promise<{
  title: string;
  description: string;
  category: string;
  impact: number;
  likelihood: number;
  treatmentStrategy: string;
  priority: string;
}> {
  if (!isAIConfigured()) throw new Error("AI not configured.");

  const prompt = `You are a risk management expert. Based on this observation, generate a structured risk entry.
Observation: "${observation}"

Respond ONLY with valid JSON (no markdown):
{
  "title": "concise risk title (max 80 chars)",
  "description": "clear risk description (2-3 sentences)",
  "category": "one of: operational|cyber_security|compliance|vendor|privacy|financial|legal|strategic|technology|business_continuity|third_party|regulatory|custom",
  "impact": <integer 1-5>,
  "likelihood": <integer 1-5>,
  "treatmentStrategy": "one of: mitigate|accept|transfer|avoid|monitor",
  "priority": "one of: low|moderate|high|critical|severe"
}`;

  const raw = await generate(prompt, 400);
  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      title: observation.slice(0, 80),
      description: observation,
      category: "operational",
      impact: 3,
      likelihood: 3,
      treatmentStrategy: "mitigate",
      priority: "high",
    };
  }
}

export async function generateMitigationRecommendations(
  orgId: string,
  riskId: string
): Promise<{ action: string; effort: string; expectedImpact: string }[]> {
  if (!isAIConfigured()) throw new Error("AI not configured.");

  const risk = await riskRepo.findById(orgId, riskId);
  if (!risk) throw new Error("Risk not found.");

  const prompt = `You are a risk mitigation expert. Suggest 5 specific mitigation actions for this risk.
Risk: ${risk.title}
Category: ${RISK_CATEGORY_LABELS[risk.category] ?? risk.category}
Description: ${risk.description ?? "Not provided"}
Impact: ${risk.impact}/5 | Likelihood: ${risk.likelihood}/5

Respond ONLY with a JSON array of 5 objects (no markdown):
[
  { "action": "specific action", "effort": "low|medium|high", "expectedImpact": "brief expected outcome" }
]`;

  const raw = await generate(prompt, 600);
  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed.slice(0, 5);
  } catch {}
  return [
    { action: "Implement preventive controls and monitoring.", effort: "medium", expectedImpact: "Reduce likelihood by 40%." },
    { action: "Review and update risk response procedures.", effort: "low", expectedImpact: "Improve response time." },
    { action: "Conduct awareness training for stakeholders.", effort: "low", expectedImpact: "Reduce human-factor risk." },
    { action: "Establish escalation and incident response plan.", effort: "medium", expectedImpact: "Limit impact severity." },
    { action: "Schedule quarterly risk review cycles.", effort: "low", expectedImpact: "Early detection of risk changes." },
  ];
}

export async function generateExecutiveSummary(orgId: string): Promise<string> {
  if (!isAIConfigured()) throw new Error("AI not configured.");

  const [risks, statusCounts, categoryCounts] = await Promise.all([
    riskRepo.findByOrg(orgId),
    riskRepo.countByStatus(orgId),
    riskRepo.countByCategory(orgId),
  ]);

  const active = risks.filter((r) => !["closed", "archived"].includes(r.status));
  const critical = active.filter((r) => r.inherentScore >= 16);
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, count]) => `${RISK_CATEGORY_LABELS[cat] ?? cat} (${count})`)
    .join(", ");

  const prompt = `You are a Chief Risk Officer. Write an executive risk summary for board presentation.
Organisation risk posture:
- Total risks: ${risks.length} (${active.length} active)
- Critical/Severe risks: ${critical.length}
- Open: ${statusCounts["open"] ?? 0} | Mitigating: ${statusCounts["mitigating"] ?? 0} | Accepted: ${statusCounts["accepted"] ?? 0}
- Top categories: ${topCategories}
- Top 3 critical risks: ${critical.slice(0, 3).map((r) => r.title).join("; ")}

Write 4-6 paragraphs: overall posture, key risk areas, critical risks requiring attention, remediation progress, and recommendations. Board-ready language, no markdown headers.`;

  const text = await generate(prompt, 800);

  await aiInsightRepo.upsertInsight({
    organizationId: orgId,
    insightType: "risk_executive_summary",
    targetId: orgId,
    content: text,
  });
  return text;
}

export type ChatMessage = { role: "user" | "model"; text: string };

export async function chat(
  orgId: string,
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  if (!isAIConfigured()) return "AI advisor is temporarily unavailable — configure GEMINI_API_KEY to enable.";

  const [statusCounts, categoryCounts, overdueReviews] = await Promise.all([
    riskRepo.countByStatus(orgId),
    riskRepo.countByCategory(orgId),
    riskRepo.countOverdueReviews(orgId),
  ]);

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const topCats = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, count]) => `${RISK_CATEGORY_LABELS[cat] ?? cat}: ${count}`)
    .join(", ");

  const systemContext = `You are the AI Risk Officer for AUDT. Answer concisely about risk posture, mitigation, and compliance.
Organisation risk summary:
- Total risks: ${total} (open: ${statusCounts["open"] ?? 0}, mitigating: ${statusCounts["mitigating"] ?? 0}, accepted: ${statusCounts["accepted"] ?? 0}, closed: ${statusCounts["closed"] ?? 0})
- Top categories: ${topCats}
- Overdue reviews: ${overdueReviews}

Answer in 2-4 sentences. If asked for a list, use plain text with commas. Do not use markdown.`;

  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [
    { role: "user", parts: [{ text: systemContext + "\n\nUser: " + message }] },
  ];

  for (const h of history.slice(-6)) {
    contents.push({ role: h.role, parts: [{ text: h.text }] });
  }

  try {
    const res = await getAI().models.generateContent({
      model: AI_MODEL,
      contents,
      config: { thinkingConfig: { thinkingBudget: 0 }, temperature: 0.5, maxOutputTokens: 400 },
    });
    return res.text?.trim() ?? "Could not generate response.";
  } catch {
    return "The AI advisor is temporarily unavailable — please try again in a moment.";
  }
}

export async function getCachedNarrative(
  orgId: string,
  riskId: string
): Promise<{ content: string; generatedAt: Date } | null> {
  const row = await aiInsightRepo.findInsight(orgId, "risk_narrative", riskId);
  if (!row) return null;
  return { content: row.content, generatedAt: row.generatedAt };
}

export async function getCachedExecutiveSummary(
  orgId: string
): Promise<{ content: string; generatedAt: Date } | null> {
  const row = await aiInsightRepo.findInsight(orgId, "risk_executive_summary", orgId);
  if (!row) return null;
  return { content: row.content, generatedAt: row.generatedAt };
}
