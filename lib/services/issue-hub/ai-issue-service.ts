import { generateText, isAIConfigured } from "@/lib/providers/ai";
import { db } from "@/lib/db";
import { aiComplianceInsights } from "@/lib/db/schema";
import { and, eq, gt } from "drizzle-orm";

async function getCached(orgId: string, targetId: string, type: string) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [row] = await db
    .select()
    .from(aiComplianceInsights)
    .where(
      and(
        eq(aiComplianceInsights.organizationId, orgId),
        eq(aiComplianceInsights.targetId, targetId),
        eq(aiComplianceInsights.insightType, type),
        gt(aiComplianceInsights.generatedAt, cutoff)
      )
    )
    .limit(1);
  return row?.content ?? null;
}

async function saveCache(orgId: string, targetId: string, type: string, content: string) {
  await db
    .insert(aiComplianceInsights)
    .values({ organizationId: orgId, targetId, insightType: type, content })
    .catch(() => {});
}

export async function generateIssueNarrative(
  orgId: string,
  issue: {
    id: string;
    title: string;
    description?: string | null;
    severity: string;
    status: string;
    issueType: string;
    sourceModule?: string | null;
    dueDate?: string | null;
  }
) {
  const cached = await getCached(orgId, issue.id, "issue_narrative");
  if (cached) return cached;
  if (!isAIConfigured()) return null;

  const prompt = `You are an expert governance analyst. Analyze this issue and provide a concise governance narrative (3-4 sentences).

Issue: ${issue.title}
Type: ${issue.issueType} | Severity: ${issue.severity} | Status: ${issue.status}
Source Module: ${issue.sourceModule ?? "Manual"}
${issue.description ? `Description: ${issue.description}` : ""}
${issue.dueDate ? `Due: ${issue.dueDate}` : ""}

Provide: root cause hypothesis, business impact, urgency assessment, and recommended next action.`;

  const result = await generateText(prompt, { maxTokens: 300 });
  await saveCache(orgId, issue.id, "issue_narrative", result);
  return result;
}

export async function generateExecutiveSummary(
  orgId: string,
  metrics: {
    total: number;
    open: number;
    critical: number;
    overdue: number;
    slaCompliance: number;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
  }
) {
  const cached = await getCached(orgId, orgId, "issue_executive_summary");
  if (cached) return cached;
  if (!isAIConfigured()) return null;

  const prompt = `You are a Chief Governance Officer. Write a 4-5 sentence executive governance summary for the board.

Issue Posture:
- Total Issues: ${metrics.total} | Open: ${metrics.open} | Critical: ${metrics.critical}
- Overdue: ${metrics.overdue} | SLA Compliance: ${metrics.slaCompliance}%
- By Severity: ${JSON.stringify(metrics.bySeverity)}
- By Status: ${JSON.stringify(metrics.byStatus)}

Summarize: overall governance execution health, key risk areas, resolution progress, and one priority recommendation for leadership.`;

  const result = await generateText(prompt, { maxTokens: 400 });
  await saveCache(orgId, orgId, "issue_executive_summary", result);
  return result;
}

export async function generateIssueFromObservation(observation: string): Promise<{
  title: string;
  severity: string;
  priority: string;
  issueType: string;
  description: string;
  recommendedActions: string[];
} | null> {
  if (!isAIConfigured()) return null;

  const prompt = `You are a governance expert. Convert this observation into a structured governance issue.

Observation: "${observation}"

Respond ONLY with valid JSON (no markdown):
{
  "title": "concise issue title (max 80 chars)",
  "severity": "critical|high|medium|low",
  "priority": "p1|p2|p3|p4",
  "issueType": "risk|audit_finding|control_failure|policy_gap|compliance_gap|security_incident|custom",
  "description": "clear description of the issue",
  "recommendedActions": ["action 1", "action 2", "action 3"]
}`;

  const result = await generateText(prompt, { maxTokens: 400 });
  try {
    return JSON.parse(result.replace(/```json\n?|\n?```/g, ""));
  } catch {
    return null;
  }
}

export async function generateRemediationPlan(issue: {
  title: string;
  severity: string;
  issueType: string;
  description?: string | null;
}): Promise<{
  tasks: Array<{ title: string; description: string; owner: string; daysToComplete: number }>;
} | null> {
  if (!isAIConfigured()) return null;

  const prompt = `You are a governance remediation expert. Generate a remediation plan for this governance issue.

Issue: ${issue.title}
Type: ${issue.issueType} | Severity: ${issue.severity}
${issue.description ? `Context: ${issue.description}` : ""}

Respond ONLY with valid JSON (no markdown):
{
  "tasks": [
    { "title": "task title", "description": "what to do", "owner": "role (e.g. Security Manager)", "daysToComplete": 7 }
  ]
}
Generate 3-5 tasks ordered by urgency.`;

  const result = await generateText(prompt, { maxTokens: 600 });
  try {
    return JSON.parse(result.replace(/```json\n?|\n?```/g, ""));
  } catch {
    return null;
  }
}

export async function chat(
  _orgId: string,
  message: string,
  context: { total: number; open: number; critical: number; overdue: number }
): Promise<string> {
  if (!isAIConfigured()) return "AI is not configured. Please set GEMINI_API_KEY.";

  const prompt = `You are the AUDT Issue & Remediation Hub™ AI Advisor. Answer governance questions concisely.

Organization Issue Posture:
- Total Issues: ${context.total} | Open: ${context.open} | Critical: ${context.critical} | Overdue: ${context.overdue}

User question: "${message}"

Answer in 2-4 sentences. Be specific, actionable, and governance-focused.`;

  try {
    return await generateText(prompt, { maxTokens: 300 });
  } catch {
    return "The AI advisor is temporarily unavailable — please try again in a moment.";
  }
}
