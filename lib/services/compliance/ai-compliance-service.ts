/**
 * AI Compliance Officer — Gemini-powered insights for the Compliance module.
 * All outputs cached in ai_compliance_insights (upsert on org+type+target).
 * Follows the same pattern as lib/services/ai-insights-service.ts.
 */
import { generateText, getAI, AI_MODEL, isAIConfigured } from "@/lib/providers/ai";
import * as aiComplianceRepo from "@/lib/repositories/ai-compliance-repo";
import * as frameworkRepo from "@/lib/repositories/framework-repo";
import * as controlRepo from "@/lib/repositories/control-repo";
import * as evidenceRepo from "@/lib/repositories/evidence-repo";
import * as gapRepo from "@/lib/repositories/gap-repo";
import * as policyRepo from "@/lib/repositories/policy-repo";
import * as readinessRepo from "@/lib/repositories/readiness-repo";

async function generate(prompt: string, maxTokens = 500): Promise<string> {
  return generateText(prompt, { maxTokens, temperature: 0.4 });
}

/* ============================================================
   1. Framework Summary
   ============================================================ */

export async function generateFrameworkSummary(
  orgId: string,
  frameworkId: string
): Promise<string> {
  if (!isAIConfigured()) throw new Error("Gemini not configured.");

  const [fw, score, statusCounts, gaps] = await Promise.all([
    frameworkRepo.findById(orgId, frameworkId),
    readinessRepo.findByFramework(orgId, frameworkId),
    controlRepo.countByStatus(orgId, frameworkId),
    gapRepo.findByFramework(orgId, frameworkId, false),
  ]);
  if (!fw) throw new Error("Framework not found.");

  const byStatus = new Map(statusCounts.map((c) => [c.status, c.n]));
  const implemented  = byStatus.get("implemented") ?? 0;
  const partial      = byStatus.get("partial") ?? 0;
  const notImpl      = byStatus.get("not_implemented") ?? 0;
  const total        = implemented + partial + notImpl + (byStatus.get("not_applicable") ?? 0);
  const criticalGaps = gaps.filter((g) => g.severity === "critical").length;

  const prompt = `You are a compliance analyst. Write a concise 3-4 sentence executive summary of this framework's compliance posture.

Framework: ${fw.name} ${fw.version ? `(${fw.version})` : ""}
Overall readiness score: ${score?.overallScore ?? 0}/100
Controls: ${total} total — ${implemented} implemented, ${partial} partial, ${notImpl} not implemented
Evidence coverage: ${score?.evidenceCoverage ?? 0}%
Policy coverage: ${score?.policyCoverage ?? 0}%
Open gaps: ${gaps.length} (${criticalGaps} critical)

Write in plain business English for a CXO/board audience. Be specific about what is strong and what needs attention. End with the single highest-priority action.`;

  const text = await generate(prompt, 300);
  await aiComplianceRepo.upsertInsight({
    organizationId: orgId,
    insightType: "framework_summary",
    targetId: frameworkId,
    content: text,
  });
  return text;
}

/* ============================================================
   2. Readiness Explanation
   ============================================================ */

export async function explainReadiness(
  orgId: string,
  frameworkId: string
): Promise<string> {
  if (!isAIConfigured()) throw new Error("Gemini not configured.");

  const [fw, score, statusCounts] = await Promise.all([
    frameworkRepo.findById(orgId, frameworkId),
    readinessRepo.findByFramework(orgId, frameworkId),
    controlRepo.countByStatus(orgId, frameworkId),
  ]);
  if (!fw || !score) throw new Error("Framework or score not found.");

  const byStatus = new Map(statusCounts.map((c) => [c.status, c.n]));

  const prompt = `You are a compliance analyst. Explain why this framework has the readiness score it does, and what specific actions would most improve it.

Framework: ${fw.name}
Overall score: ${score.overallScore}/100 (weighted: controls 50%, evidence 30%, policies 20%)
Control coverage: ${score.controlCoverage}% (${byStatus.get("implemented") ?? 0} implemented, ${byStatus.get("partial") ?? 0} partial)
Evidence coverage: ${score.evidenceCoverage}% (controls with approved evidence)
Policy coverage: ${score.policyCoverage}%

Write 3-4 sentences. Explain the score breakdown plainly. List the 2 most impactful improvements as bullet points at the end.`;

  const text = await generate(prompt, 350);
  await aiComplianceRepo.upsertInsight({
    organizationId: orgId,
    insightType: "readiness_explanation",
    targetId: frameworkId,
    content: text,
  });
  return text;
}

/* ============================================================
   3. Gap Narrative
   ============================================================ */

export async function generateGapNarrative(
  orgId: string,
  frameworkId: string
): Promise<string> {
  if (!isAIConfigured()) throw new Error("Gemini not configured.");

  const [fw, gaps] = await Promise.all([
    frameworkRepo.findById(orgId, frameworkId),
    gapRepo.findByFramework(orgId, frameworkId, false),
  ]);
  if (!fw) throw new Error("Framework not found.");

  if (gaps.length === 0) {
    const text = `No open gaps detected for ${fw.name}. All controls are implemented and evidenced. Consider running a fresh gap analysis to confirm.`;
    await aiComplianceRepo.upsertInsight({ organizationId: orgId, insightType: "gap_summary", targetId: frameworkId, content: text });
    return text;
  }

  const byType = gaps.reduce<Record<string, number>>((acc, g) => {
    acc[g.gapType] = (acc[g.gapType] ?? 0) + 1; return acc;
  }, {});
  const critical = gaps.filter((g) => g.severity === "critical").length;
  const high     = gaps.filter((g) => g.severity === "high").length;

  const sampleGaps = gaps
    .filter((g) => g.severity === "critical" || g.severity === "high")
    .slice(0, 5)
    .map((g) => `- [${g.severity.toUpperCase()}] ${g.description}`)
    .join("\n");

  const prompt = `You are a compliance analyst. Write a concise gap analysis narrative for this framework.

Framework: ${fw.name}
Total open gaps: ${gaps.length} (${critical} critical, ${high} high)
Gap types: ${Object.entries(byType).map(([t, n]) => `${t.replace(/_/g, " ")} (${n})`).join(", ")}
Top gaps:
${sampleGaps || "None critical/high"}

Write 2-3 sentences summarising the gap situation. Then give 3 prioritised remediation steps as a numbered list. Be specific and actionable.`;

  const text = await generate(prompt, 400);
  await aiComplianceRepo.upsertInsight({ organizationId: orgId, insightType: "gap_summary", targetId: frameworkId, content: text });
  return text;
}

/* ============================================================
   4. Executive Compliance Summary (org-wide)
   ============================================================ */

export async function generateExecutiveSummary(orgId: string): Promise<string> {
  if (!isAIConfigured()) throw new Error("Gemini not configured.");

  const [frameworks, scores, allGaps, policies] = await Promise.all([
    frameworkRepo.findByOrg(orgId),
    readinessRepo.findAllByOrg(orgId),
    gapRepo.findByOrg(orgId, false),
    policyRepo.findByOrg(orgId),
  ]);

  const scoreMap = new Map(scores.map((s) => [s.frameworkId, s.overallScore]));
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, s) => a + s.overallScore, 0) / scores.length)
    : 0;
  const criticalGaps = allGaps.filter((g) => g.severity === "critical").length;
  const approvedPolicies = policies.filter((p) => p.status === "approved").length;

  const fwLines = frameworks
    .map((fw) => `- ${fw.name}: ${scoreMap.get(fw.id) ?? 0}% readiness`)
    .join("\n");

  const prompt = `You are a Chief Compliance Officer preparing a board-level executive summary.

Organisation compliance posture:
Average readiness: ${avgScore}%
Frameworks (${frameworks.length}):
${fwLines || "None"}
Total open gaps: ${allGaps.length} (${criticalGaps} critical)
Policies: ${policies.length} total, ${approvedPolicies} approved

Write a 4-5 sentence board-level compliance summary. Cover: overall posture, key strengths, critical risks, and one strategic recommendation. Use confident, executive-appropriate language.`;

  const text = await generate(prompt, 400);
  await aiComplianceRepo.upsertInsight({
    organizationId: orgId,
    insightType: "executive_summary",
    targetId: orgId,
    content: text,
  });
  return text;
}

/* ============================================================
   5. Chat — contextual NL Q&A
   ============================================================ */

export type ChatMessage = { role: "user" | "model"; text: string };

export async function chat(
  orgId: string,
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  if (!isAIConfigured()) return "AI advisor is temporarily unavailable — configure GEMINI_API_KEY to enable.";

  const [frameworks, scores, allGaps, policies, evidence] = await Promise.all([
    frameworkRepo.findByOrg(orgId),
    readinessRepo.findAllByOrg(orgId),
    gapRepo.findByOrg(orgId, false),
    policyRepo.findByOrg(orgId),
    evidenceRepo.findByOrg(orgId),
  ]);

  const scoreMap = new Map(scores.map((s) => [s.frameworkId, s.overallScore]));
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, s) => a + s.overallScore, 0) / scores.length)
    : 0;

  const systemContext = `You are the AI Compliance Officer for this organisation. Answer questions about their compliance posture clearly and concisely. Use only the data provided — do not invent facts.

ORGANISATION COMPLIANCE DATA:
Average readiness: ${avgScore}%
Frameworks (${frameworks.length}): ${frameworks.map((f) => `${f.name} (${scoreMap.get(f.id) ?? 0}%)`).join(", ") || "None"}
Open gaps: ${allGaps.length} total — ${allGaps.filter((g) => g.severity === "critical").length} critical, ${allGaps.filter((g) => g.severity === "high").length} high
Policies: ${policies.length} total, ${policies.filter((p) => p.status === "approved").length} approved, ${policies.filter((p) => p.status === "expired").length} expired
Evidence items: ${evidence.length} total, ${evidence.filter((e) => e.status === "approved").length} approved

Answer in 2-4 sentences. Be specific and use the data above.`;

  // Build conversation history for Gemini
  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [
    { role: "user", parts: [{ text: systemContext + "\n\nUser question: " + message }] },
  ];

  // Prepend history if any (last 6 turns max)
  if (history.length > 0) {
    const recent = history.slice(-6);
    const historyContents = recent.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));
    // Insert history between system context and current message
    contents.splice(0, 1,
      { role: "user", parts: [{ text: systemContext }] },
      { role: "model", parts: [{ text: "Understood. I'm ready to answer questions about your compliance posture." }] },
      ...historyContents,
      { role: "user", parts: [{ text: message }] }
    );
  }

  try {
    const res = await getAI().models.generateContent({
      model: AI_MODEL,
      contents,
      config: { thinkingConfig: { thinkingBudget: 0 }, temperature: 0.5, maxOutputTokens: 400 },
    });
    return res.text?.trim() ?? "I couldn't generate a response. Please try again.";
  } catch {
    return "The AI advisor is temporarily unavailable — please try again in a moment.";
  }
}

/* ============================================================
   6. Load cached insights
   ============================================================ */

export async function getCachedInsight(
  orgId: string,
  insightType: string,
  targetId: string
): Promise<{ content: string; generatedAt: Date } | null> {
  const row = await aiComplianceRepo.findInsight(orgId, insightType, targetId);
  if (!row) return null;
  return { content: row.content, generatedAt: row.generatedAt };
}
