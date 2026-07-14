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

export async function generateExecutiveSummary(
  orgId: string,
  metrics: {
    total: number;
    active: number;
    totalRuns: number;
    completedRuns: number;
    failedRuns: number;
    pendingApprovals: number;
    automationRate: number;
  }
) {
  const cached = await getCached(orgId, orgId, "workflow_executive_summary");
  if (cached) return cached;
  if (!isAIConfigured()) return null;

  const prompt = `You are a Chief Governance Officer. Write a 4-5 sentence executive summary for the board on governance automation posture.

Workflow Studio™ Metrics:
- Total Workflows: ${metrics.total} | Active: ${metrics.active}
- Total Runs: ${metrics.totalRuns} | Completed: ${metrics.completedRuns} | Failed: ${metrics.failedRuns}
- Pending Approvals: ${metrics.pendingApprovals} | Automation Rate: ${metrics.automationRate}%

Summarize: automation adoption, workflow health, approval bottlenecks, and top recommendation to increase governance automation.`;

  const result = await generateText(prompt, { maxTokens: 400 });
  await saveCache(orgId, orgId, "workflow_executive_summary", result);
  return result;
}

export async function generateWorkflowFromPrompt(description: string): Promise<{
  name: string;
  module: string;
  triggerType: string;
  description: string;
  nodes: Array<{ nodeType: string; label: string; description: string }>;
} | null> {
  if (!isAIConfigured()) return null;

  const prompt = `You are a governance workflow designer. Create a structured workflow definition from this description.

Description: "${description}"

Respond ONLY with valid JSON (no markdown):
{
  "name": "workflow name (max 60 chars)",
  "module": "vendor_hub|evidence_vault|audit_management|risk_lens|control_center|policy_governance|dpdp_privacy|contract_governance|issue_hub|trust_intelligence|custom",
  "triggerType": "record_created|record_updated|status_changed|date_reached|score_threshold|manual|scheduled",
  "description": "brief workflow description",
  "nodes": [
    { "nodeType": "start|task|approval|condition|notification|end", "label": "step label", "description": "what this step does" }
  ]
}
Include 3-7 nodes starting with "start" and ending with "end".`;

  const result = await generateText(prompt, { maxTokens: 600 });
  try {
    return JSON.parse(result.replace(/```json\n?|\n?```/g, ""));
  } catch {
    return null;
  }
}

export async function analyzeWorkflowBottlenecks(
  orgId: string,
  metrics: { failedRuns: number; pendingApprovals: number; totalRuns: number; automationRate: number }
): Promise<string | null> {
  if (!isAIConfigured()) return null;

  const prompt = `You are a process improvement expert analyzing governance workflow performance.

Metrics:
- Failed Runs: ${metrics.failedRuns} of ${metrics.totalRuns} total (${metrics.totalRuns > 0 ? Math.round((metrics.failedRuns / metrics.totalRuns) * 100) : 0}% failure rate)
- Pending Approvals: ${metrics.pendingApprovals}
- Automation Rate: ${metrics.automationRate}%

Identify the top 3 bottlenecks and provide specific recommendations to improve workflow throughput. Be concise — 3-4 sentences.`;

  return generateText(prompt, { maxTokens: 300 });
}

export async function chat(
  _orgId: string,
  message: string,
  context: { total: number; active: number; totalRuns: number; pendingApprovals: number; automationRate: number }
): Promise<string> {
  if (!isAIConfigured()) return "AI is not configured. Please set GEMINI_API_KEY.";

  const prompt = `You are the AUDT Workflow Studio™ AI Advisor. Answer governance automation questions concisely.

Workflow Posture:
- Total Workflows: ${context.total} | Active: ${context.active}
- Total Runs: ${context.totalRuns} | Pending Approvals: ${context.pendingApprovals} | Automation Rate: ${context.automationRate}%

User question: "${message}"

Answer in 2-4 sentences. Be specific and governance-focused.`;

  try {
    return await generateText(prompt, { maxTokens: 300 });
  } catch {
    return "The AI advisor is temporarily unavailable — please try again in a moment.";
  }
}
