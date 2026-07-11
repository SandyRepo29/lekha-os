import { generateText, isAIConfigured } from "@/lib/providers/ai";
import * as aiRepo from "@/lib/repositories/ai-compliance-repo";
import { getTrustIntelligenceOverview, generateRecommendations } from "./trust-intelligence-service";
import { ORG_TRUST_LEVEL_LABELS } from "@/lib/services/org-trust-score";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function generate(prompt: string, maxTokens = 600): Promise<string> {
  return generateText(prompt, { maxTokens, temperature: 0.4 });
}

/** AI Executive Governance Summary — cached 24h per org. */
export async function generateExecutiveSummary(orgId: string): Promise<string> {
  if (!isAIConfigured()) throw new Error("AI not configured.");

  const cached = await aiRepo.findInsight(orgId, "trust_intelligence_summary", orgId);
  if (cached && Date.now() - cached.generatedAt.getTime() < CACHE_TTL_MS) {
    return cached.content;
  }

  const overview = await getTrustIntelligenceOverview(orgId);
  const recs = await generateRecommendations(orgId);
  const { orgTrustScore: score } = overview;

  const prompt = `You are a Chief Governance Officer preparing a board-level governance summary.

Organizational Trust Score™: ${score.overall}/100 (${ORG_TRUST_LEVEL_LABELS[score.level]})

Component Scores:
- Vendor Trust: ${score.vendorTrust}/100
- Risk Posture: ${score.riskPosture}/100
- Control Health: ${score.controlHealth}/100
- Audit Readiness: ${score.auditReadiness}/100
- Compliance Coverage: ${score.complianceCoverage}/100

Key Metrics:
- Active vendors: ${overview.vendors.total} (${overview.vendors.scoredCount} scored, avg trust ${overview.vendors.avgScore})
- Active risks: ${overview.risks.activeCount} total, ${overview.risks.criticalCount} critical
- Controls: ${overview.controls.totalCount} total, ${overview.controls.weakCount} weak (<60 health)
- Audit findings: ${overview.audits.totalOpenFindings} open (${overview.audits.openCriticalFindings} critical)
- Compliance frameworks: ${overview.compliance.frameworkCount}, avg readiness ${overview.compliance.avgReadiness}%

Top Trust Drivers: ${score.drivers.slice(0, 3).join("; ") || "None identified"}
Top Trust Detractors: ${score.detractors.slice(0, 3).join("; ") || "None identified"}

Top Recommendations:
${recs.slice(0, 5).map((r, i) => `${i + 1}. [${r.priority.toUpperCase()}] ${r.title}`).join("\n")}

Write a 4-5 sentence executive governance summary covering:
1. Overall governance posture and trust level
2. Key strengths and risk exposure
3. Control and compliance status
4. Top priority actions for leadership

Professional board-ready tone. No markdown formatting. No bullet points.`;

  const text = await generate(prompt, 600);

  await aiRepo.upsertInsight({
    organizationId: orgId,
    insightType: "trust_intelligence_summary",
    targetId: orgId,
    content: text,
  });

  return text;
}

/** AI Governance Copilot™ — contextual NL chat. */
export async function chat(orgId: string, question: string, history: Array<{ role: "user" | "assistant"; content: string }> = []): Promise<string> {
  if (!isAIConfigured()) return "AI advisor is temporarily unavailable — configure GEMINI_API_KEY to enable.";

  const overview = await getTrustIntelligenceOverview(orgId);
  const { orgTrustScore: score } = overview;

  const context = `Governance context:
Organizational Trust Score™: ${score.overall}/100 (${ORG_TRUST_LEVEL_LABELS[score.level]})
Vendor Trust: ${score.vendorTrust}/100 | Risk Posture: ${score.riskPosture}/100 | Control Health: ${score.controlHealth}/100 | Audit Readiness: ${score.auditReadiness}/100 | Compliance: ${score.complianceCoverage}/100
Active risks: ${overview.risks.activeCount} (${overview.risks.criticalCount} critical) | Weak controls: ${overview.controls.weakCount} | Open critical findings: ${overview.audits.openCriticalFindings} | Frameworks: ${overview.compliance.frameworkCount} (avg ${overview.compliance.avgReadiness}% ready)
Drivers: ${score.drivers.join(", ") || "none"} | Detractors: ${score.detractors.join(", ") || "none"}`;

  const historyText = history
    .slice(-6)
    .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
    .join("\n");

  const prompt = `You are the AUDT Governance Copilot™ — an executive AI assistant for governance, risk and compliance.

${context}

${historyText ? `Conversation so far:\n${historyText}\n\n` : ""}User question: ${question}

Answer concisely (2-4 sentences) with actionable insight. Reference specific scores and metrics where relevant. No markdown.`;

  try {
    return await generate(prompt, 400);
  } catch {
    return "The AI advisor is temporarily unavailable — please try again in a moment.";
  }
}

/** Return cached executive summary without regenerating. */
export async function getCachedSummary(orgId: string): Promise<string | null> {
  const cached = await aiRepo.findInsight(orgId, "trust_intelligence_summary", orgId);
  if (!cached) return null;
  if (Date.now() - cached.generatedAt.getTime() > CACHE_TTL_MS) return null;
  return cached.content;
}
