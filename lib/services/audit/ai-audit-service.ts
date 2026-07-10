import { generateText, getAI, AI_MODEL, isAIConfigured } from "@/lib/providers/ai";
import * as auditRepo from "@/lib/repositories/audit-management-repo";
import * as findingRepo from "@/lib/repositories/audit-finding-repo";
import * as capaRepo from "@/lib/repositories/corrective-action-repo";
import * as aiInsightRepo from "@/lib/repositories/ai-compliance-repo";

async function generate(prompt: string, maxTokens = 500): Promise<string> {
  return generateText(prompt, { maxTokens, temperature: 0.4 });
}

export async function generateAuditSummary(
  orgId: string,
  auditId: string
): Promise<string> {
  if (!isAIConfigured()) throw new Error("AI not configured.");

  const [audit, findings] = await Promise.all([
    auditRepo.findById(orgId, auditId),
    findingRepo.findByAudit(orgId, auditId),
  ]);
  if (!audit) throw new Error("Audit not found.");

  const severityCounts = findings.reduce(
    (acc, f) => {
      acc[f.severity] = (acc[f.severity] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const openCount = findings.filter((f) => f.status === "open").length;

  const prompt = `You are an audit analyst. Write a concise 3-4 sentence executive summary of this audit.
Audit name: ${audit.name}
Type: ${audit.auditType}
Status: ${audit.status}
Scope: ${audit.scope ?? "Not specified"}
Total findings: ${findings.length} (${openCount} open)
Severity breakdown: critical=${severityCounts["critical"] ?? 0}, high=${severityCounts["high"] ?? 0}, medium=${severityCounts["medium"] ?? 0}, low=${severityCounts["low"] ?? 0}
Focus on key risks and overall posture. Do not use markdown.`;

  const text = await generate(prompt, 300);

  await aiInsightRepo.upsertInsight({
    organizationId: orgId,
    insightType: "audit_summary",
    targetId: auditId,
    content: text,
  });
  return text;
}

export async function generateFindingFromObservation(
  observation: string
): Promise<{
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  recommendation: string;
}> {
  if (!isAIConfigured()) throw new Error("AI not configured.");

  const prompt = `You are an audit expert. Based on the following observation, generate a structured finding.
Observation: "${observation}"

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "title": "short finding title (max 80 chars)",
  "severity": "critical|high|medium|low",
  "description": "clear description of the issue (2-3 sentences)",
  "recommendation": "specific remediation recommendation (1-2 sentences)"
}`;

  const raw = await generate(prompt, 400);
  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      title: observation.slice(0, 80),
      severity: "medium",
      description: observation,
      recommendation: "Review and remediate the identified issue.",
    };
  }
}

export async function generateCapaSuggestions(
  orgId: string,
  findingId: string
): Promise<string[]> {
  if (!isAIConfigured()) throw new Error("AI not configured.");

  const finding = await findingRepo.findById(orgId, findingId);
  if (!finding) throw new Error("Finding not found.");

  const prompt = `You are an audit remediation expert. Suggest 3 specific corrective actions for this audit finding.
Finding: ${finding.title}
Description: ${finding.description ?? "No description"}
Severity: ${finding.severity}
Recommendation: ${finding.recommendation ?? "None"}

Respond ONLY with a JSON array of 3 short action strings (no markdown, no explanation):
["action 1", "action 2", "action 3"]`;

  const raw = await generate(prompt, 300);
  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed.slice(0, 3);
  } catch {}
  return [
    "Review and remediate the identified control gap.",
    "Update relevant policies and procedures.",
    "Schedule follow-up review within 30 days.",
  ];
}

export async function generateExecutiveReport(
  orgId: string,
  auditId: string
): Promise<string> {
  if (!isAIConfigured()) throw new Error("AI not configured.");

  const [audit, findings, capas] = await Promise.all([
    auditRepo.findById(orgId, auditId),
    findingRepo.findByAudit(orgId, auditId),
    capaRepo.findByOrg(orgId),
  ]);
  if (!audit) throw new Error("Audit not found.");

  const auditCapas = capas.filter((c) =>
    findings.map((f) => f.id).includes(c.findingId)
  );
  const criticalFindings = findings.filter((f) => f.severity === "critical");
  const highFindings = findings.filter((f) => f.severity === "high");
  const openCapas = auditCapas.filter((c) => c.status !== "completed");

  const prompt = `You are a chief audit executive. Write an executive summary for the following audit. Use professional language suitable for board presentation. 4-6 paragraphs covering: overall assessment, key risk areas, critical findings, remediation status, and recommendations. Do not use markdown headers.

Audit: ${audit.name}
Type: ${audit.auditType}
Scope: ${audit.scope ?? "Enterprise-wide"}
Objective: ${audit.objective ?? "Assess compliance posture"}
Status: ${audit.status}
Total findings: ${findings.length}
Critical: ${criticalFindings.length}, High: ${highFindings.length}
Open CAPAs: ${openCapas.length} of ${auditCapas.length}
Top critical findings: ${criticalFindings
    .slice(0, 3)
    .map((f) => f.title)
    .join("; ")}`;

  const text = await generate(prompt, 800);

  await aiInsightRepo.upsertInsight({
    organizationId: orgId,
    insightType: "audit_executive_report",
    targetId: auditId,
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
  if (!isAIConfigured()) throw new Error("AI not configured.");

  const [statusCounts, openFindings, severityCounts, capasDue] = await Promise.all([
    auditRepo.countByStatus(orgId),
    findingRepo.countOpenByOrg(orgId),
    findingRepo.countBySeverity(orgId),
    capaRepo.countDueSoon(orgId, 30),
  ]);

  const totalAudits = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  const systemContext = `You are the AI Audit Assistant for Lekha OS. Answer concisely about audit status, findings, and remediation.
Organisation audit summary:
- Total audits: ${totalAudits} (planned: ${statusCounts["planned"] ?? 0}, active: ${statusCounts["in_progress"] ?? 0}, completed: ${statusCounts["completed"] ?? 0})
- Open findings: ${openFindings} (critical: ${severityCounts["critical"] ?? 0}, high: ${severityCounts["high"] ?? 0})
- CAPAs due in 30 days: ${capasDue}

Answer in 2-4 sentences. If asked for a list, use plain text with commas. Do not use markdown.`;

  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [
    {
      role: "user",
      parts: [{ text: systemContext + "\n\nUser: " + message }],
    },
  ];

  for (const h of history.slice(-6)) {
    contents.push({ role: h.role, parts: [{ text: h.text }] });
  }

  const res = await getAI().models.generateContent({
    model: AI_MODEL,
    contents,
    config: { thinkingConfig: { thinkingBudget: 0 }, temperature: 0.5, maxOutputTokens: 400 },
  });
  return res.text?.trim() ?? "Could not generate response.";
}

export async function getCachedSummary(
  orgId: string,
  auditId: string
): Promise<{ content: string; generatedAt: Date } | null> {
  const row = await aiInsightRepo.findInsight(orgId, "audit_summary", auditId);
  if (!row) return null;
  return { content: row.content, generatedAt: row.generatedAt };
}

export async function getCachedExecutiveReport(
  orgId: string,
  auditId: string
): Promise<{ content: string; generatedAt: Date } | null> {
  const row = await aiInsightRepo.findInsight(orgId, "audit_executive_report", auditId);
  if (!row) return null;
  return { content: row.content, generatedAt: row.generatedAt };
}
