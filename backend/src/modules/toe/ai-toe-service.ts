import { generateText, isAIConfigured } from "@/lib/providers/ai";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import * as repo from "@/backend/src/modules/toe/toe-repo";

// ─── Cached advisory summary ──────────────────────────────────────────────────

const CACHE_KEY = "toe_advisory";

async function getCached(orgId: string): Promise<string | null> {
  const rows = await db.execute(sql`
    SELECT generated_content, generated_at FROM ai_compliance_insights
    WHERE organization_id = ${orgId} AND target_id = ${orgId} AND insight_type = ${CACHE_KEY}
    ORDER BY generated_at DESC LIMIT 1
  `);
  const row = (rows as unknown as Array<{ generated_content: string; generated_at: string }>)[0];
  if (!row) return null;
  const age = Date.now() - new Date(row.generated_at).getTime();
  if (age > 24 * 60 * 60 * 1000) return null;
  return row.generated_content;
}

async function saveCache(orgId: string, content: string) {
  await db.execute(sql`
    INSERT INTO ai_compliance_insights
      (organization_id, target_id, insight_type, generated_content)
    VALUES (${orgId}, ${orgId}, ${CACHE_KEY}, ${content})
    ON CONFLICT (organization_id, target_id, insight_type)
    DO UPDATE SET generated_content = EXCLUDED.generated_content, generated_at = now()
  `);
}

// ─── Operations Advisory Summary ─────────────────────────────────────────────

export async function generateOperationsAdvisory(orgId: string, force = false): Promise<string> {
  if (!isAIConfigured()) return "AI is not configured. Please add a GEMINI_API_KEY to enable AI features.";
  if (!force) {
    const cached = await getCached(orgId);
    if (cached) return cached;
  }

  const [metrics, pendingApprovals, openDecisions, recentEvents] = await Promise.all([
    repo.getDashboardMetrics(orgId),
    repo.findApprovals(orgId, { status: "pending", limit: 10 }),
    repo.findAiDecisions(orgId, { status: "pending", limit: 10 }),
    repo.findOrgEvents(orgId, { limit: 20 }),
  ]);

  const prompt = `You are the AUDT Trust Operations Engine AI Advisor.
Analyse the current operational state of this governance platform and provide a concise executive advisory.

Operational Metrics:
- Pending Approvals: ${metrics.pendingApprovals}
- Active Workflows: ${metrics.activeWorkflows}
- Events Today: ${metrics.eventsToday}
- Open AI Decisions: ${metrics.openDecisions}
- Automation Rules Active: ${metrics.automationRules}
- Completed Workflows: ${metrics.completedWorkflows}
- Failed Workflows: ${metrics.failedWorkflows}

Pending Approvals: ${pendingApprovals.map(a => `${a.title} (${a.request_type})`).join(", ") || "none"}
Open AI Decisions: ${openDecisions.map(d => `${d.title} [${d.priority}]`).join(", ") || "none"}
Recent Events: ${recentEvents.slice(0, 8).map(e => e.event_type).join(", ")}

Provide:
1. Operations Health (2-3 sentences) — overall posture
2. Top 3 Priorities — what needs immediate attention
3. Automation Opportunities — where automation could reduce manual work
4. Risk Signals — any concerning patterns in the event stream

Be direct, executive-level, action-oriented. Under 200 words total.`;

  const result = await generateText(prompt);
  await saveCache(orgId, result);
  return result;
}

// ─── AI Workflow Recommendations ─────────────────────────────────────────────

export async function generateWorkflowRecommendations(orgId: string): Promise<repo.ToeAiDecision[]> {
  if (!isAIConfigured()) return [];

  const [metrics, recentEvents, rules] = await Promise.all([
    repo.getDashboardMetrics(orgId),
    repo.findOrgEvents(orgId, { limit: 30 }),
    repo.findAutomationRules(orgId),
  ]);

  const prompt = `You are the AUDT Trust Operations AI. Analyse governance operations and generate actionable recommendations.

Context:
- Pending Approvals: ${metrics.pendingApprovals}
- Active Workflows: ${metrics.activeWorkflows}
- Events Today: ${recentEvents.length}
- Automation Rules: ${rules.length} (${rules.filter(r => r.active).length} active)
- Recent Event Types: ${[...new Set(recentEvents.map(e => e.event_type))].slice(0, 10).join(", ")}

Generate exactly 4 recommendations as JSON array:
[
  {
    "title": "Short action title",
    "recommendation": "What to do and why (1-2 sentences)",
    "confidence": 85,
    "priority": "high",
    "reasoning": "Evidence-based reasoning",
    "actions": ["Step 1", "Step 2", "Step 3"]
  }
]
priority must be one of: critical, high, medium, low
confidence must be 0-100
Return ONLY the JSON array, no markdown.`;

  try {
    const raw = await generateText(prompt);
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const items = JSON.parse(clean) as Array<{
      title: string; recommendation: string; confidence: number;
      priority: string; reasoning: string; actions: string[];
    }>;

    const results: repo.ToeAiDecision[] = [];
    for (const item of items.slice(0, 4)) {
      const saved = await repo.insertAiDecision({
        orgId,
        title: item.title,
        recommendation: item.recommendation,
        confidence: item.confidence,
        priority: item.priority,
        reasoning: item.reasoning,
        actions: item.actions,
      });
      results.push(saved);
    }
    return results;
  } catch {
    return [];
  }
}

// ─── AI Workflow Step Guidance ────────────────────────────────────────────────

export async function getWorkflowStepGuidance(stepName: string, stepType: string, context: Record<string, unknown>): Promise<string> {
  if (!isAIConfigured()) return "Configure AI to get intelligent step guidance.";

  const prompt = `You are the AUDT governance operations assistant.
A governance workflow is at step: "${stepName}" (type: ${stepType})
Context: ${JSON.stringify(context).slice(0, 300)}

Provide a brief 2-3 sentence guidance note for the user completing this step.
Focus on what matters, what to check, and what success looks like.`;

  return generateText(prompt);
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────

export async function chat(orgId: string, messages: Array<{ role: string; content: string }>): Promise<string> {
  if (!isAIConfigured()) return "AI is not configured.";

  const [metrics, pending] = await Promise.all([
    repo.getDashboardMetrics(orgId),
    repo.findApprovals(orgId, { status: "pending", limit: 5 }),
  ]);

  const context = `Trust Operations Engine context:
Pending Approvals: ${metrics.pendingApprovals}
Active Workflows: ${metrics.activeWorkflows}
Events Today: ${metrics.eventsToday}
Open AI Decisions: ${metrics.openDecisions}
Automation Rules: ${metrics.automationRules}
Pending items: ${pending.map(p => p.title).join(", ") || "none"}`;

  const history = messages.slice(-6).map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");

  const prompt = `You are the AUDT Trust Operations Engine AI. You help governance teams manage workflows, approvals, and automation.

${context}

Conversation:
${history}

Answer the last user message. Be concise, specific, and action-oriented.`;

  try {
    return await generateText(prompt);
  } catch {
    return "The AI advisor is temporarily unavailable — please try again in a moment.";
  }
}
