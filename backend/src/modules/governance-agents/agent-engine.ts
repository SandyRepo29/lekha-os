/**
 * Agent Engine — Core execution engine for Governance Agent Framework™.
 *
 * Orchestrates a single agent run:
 *   1. Load agent from DB
 *   2. Create agent_run record (status: running)
 *   3. Build context prompt from agent type + AUDT data hints
 *   4. Call Gemini with agent prompt + AGENT_TOOLS (function calling)
 *   5. Parse function call responses → observations + recommendations + actions
 *   6. Route by execution mode: advisory / approval_required / autonomous
 *   7. Persist results and update run status
 *   8. Increment agent run counters
 *
 * No "use server" — pure TypeScript, framework-agnostic.
 */

import { getAI, AI_MODEL, isAIConfigured } from "@/lib/providers/ai";
import { AGENT_TOOLS, type AgentToolCall } from "./agent-tools";
import * as repo from "@/backend/src/modules/governance-agents/agents-repo";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AgentRunSummary {
  runId: string;
  observations: number;
  recommendations: number;
  actions: number;
}

interface ParsedAgentOutput {
  observations: Array<{
    title: string;
    description: string;
    severity: string;
    category: string;
    entityType?: string;
    entityId?: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: string;
    category: string;
    estimatedImpact?: string;
    toolCall?: AgentToolCall;
  }>;
}

// ── Context Builder ───────────────────────────────────────────────────────────

/**
 * Returns a text summary of relevant AUDT governance data for the given
 * agent type. In production this will pull live data from AUDT services;
 * for Phase 1 these are representative prompts that guide Gemini toward
 * meaningful governance observations.
 */
export async function buildAgentContext(
  orgId: string,
  agentType: string
): Promise<string> {
  // Phase 1: structured prompt hints per agent type.
  // In production: wire up to real query results from trust-intelligence-repo,
  // risk-repo, control-center-repo, etc.
  const contextByType: Record<string, string> = {
    vendor_risk: `
You are analyzing vendor governance data for an AUDT organization.
Context signals to evaluate:
- Vendors with Trust Score™ below 60 (High Concern level) need immediate attention.
- Vendors missing required documents (ISO certs, SOC 2, DPAs) represent compliance gaps.
- Vendors with no security assessment in the last 90 days need re-assessment scheduling.
- Vendors in the "critical" tier with open high/critical risks need escalation.
- Vendors whose documents expire within 30 days need evidence requests.
Identify the top 3–5 vendor risk concerns and recommend specific actions using the available tools.
    `.trim(),

    compliance_monitor: `
You are analyzing compliance posture data for an AUDT organization.
Context signals to evaluate:
- Frameworks with readiness below 70% have critical gaps requiring immediate control work.
- Controls in "not_implemented" or "partially_implemented" status with no recent test are at risk.
- Open critical/high gaps older than 14 days without an owner need assignment.
- Evidence items expiring within 30 days need renewal requests.
- Policies not attested in the last 12 months need attestation campaigns.
Identify the top 3–5 compliance concerns and recommend specific actions using the available tools.
    `.trim(),

    risk_analyst: `
You are analyzing risk register data for an AUDT organization.
Context signals to evaluate:
- Open critical risks (score >= 20) with no active treatment plan need immediate attention.
- Risks with overdue review dates (next_review_date in the past) need scheduling.
- Mitigating risks where treatment progress is below 20% after 30 days are stalled.
- Risks linked to critical vendors with no control coverage need control assignment.
- New risks identified in the last 7 days need owner assignment and treatment planning.
Identify the top 3–5 risk concerns and recommend specific actions using the available tools.
    `.trim(),

    control_health: `
You are analyzing control effectiveness data for an AUDT organization.
Context signals to evaluate:
- Controls with health score below 60 (Critical level) are failing governance requirements.
- Controls not tested in the last 90 days need test scheduling.
- Controls linked to critical frameworks (ISO 27001, SOC 2) with poor health need priority remediation.
- Automated controls showing failures need engineering review.
- Controls with no owner assigned represent a governance accountability gap.
Identify the top 3–5 control health concerns and recommend specific actions using the available tools.
    `.trim(),

    audit_coordinator: `
You are analyzing audit management data for an AUDT organization.
Context signals to evaluate:
- Open critical findings older than 30 days with no CAPA need immediate action.
- CAPAs with overdue completion dates need escalation.
- Planned audits with no program items created need setup.
- Audits approaching end date with findings still open need completion risk flagging.
- Recurring findings across multiple audits indicate systemic control failures.
Identify the top 3–5 audit concerns and recommend specific actions using the available tools.
    `.trim(),

    policy_guardian: `
You are analyzing policy governance data for an AUDT organization.
Context signals to evaluate:
- Policies in "draft" status for more than 30 days need approval workflow activation.
- Policies due for annual review (last reviewed > 12 months ago) need scheduling.
- Policy attestation campaigns with completion below 80% need follow-up.
- Policies not linked to any controls represent unenforceable governance intent.
- Deprecated policies still linked to active controls need replacement.
Identify the top 3–5 policy governance concerns and recommend specific actions using the available tools.
    `.trim(),

    privacy_officer: `
You are analyzing privacy and data protection governance for an AUDT organization.
Context signals to evaluate:
- Open privacy requests (DSRs) approaching the 30-day statutory deadline need priority action.
- Data assets with no data classification or owner assigned represent privacy risk.
- Consent records for high-risk processing activities that are expired need renewal.
- Cross-border data transfers without a valid transfer mechanism are regulatory violations.
- Privacy Impact Assessments not completed for new data assets need scheduling.
Identify the top 3–5 privacy governance concerns and recommend specific actions using the available tools.
    `.trim(),

    contract_watcher: `
You are analyzing contract governance data for an AUDT organization.
Context signals to evaluate:
- Contracts expiring within 60 days without renewal initiation need immediate action.
- Overdue contractual obligations need owner notification and escalation.
- Contracts with score below 50 have clause or obligation coverage gaps.
- Vendor contracts with no DPA clause and personal data processing are privacy risks.
- Auto-renewing contracts approaching renewal dates need review triggers.
Identify the top 3–5 contract governance concerns and recommend specific actions using the available tools.
    `.trim(),

    governance_sweep: `
You are performing a comprehensive governance health sweep across all modules in an AUDT organization.
Evaluate the overall governance posture and identify the most critical cross-module concerns:
- Are there any critical/high severity issues open for more than 14 days?
- Are there vendors, risks, or controls without owners assigned?
- Are there SLA breaches on open issues?
- Are there compliance frameworks below 70% readiness?
- Are there any pending approvals stalled for more than 7 days?
Identify the top 5 governance concerns spanning all modules and recommend specific actions using the available tools.
    `.trim(),
  };

  return (
    contextByType[agentType] ??
    contextByType["governance_sweep"]
  );
}

// ── Gemini Call ───────────────────────────────────────────────────────────────

async function callGeminiWithTools(
  agentName: string,
  agentType: string,
  agentPrompt: string | null,
  contextSummary: string,
  externalContext: Record<string, unknown>
): Promise<ParsedAgentOutput> {
  const ai = getAI();

  const systemInstruction =
    `You are the ${agentName} (type: ${agentType}) for AUDT Governance OS — ` +
    `the AI-Native Trust, Risk & Compliance Platform. ` +
    `Your role is to analyze governance data, identify issues and risks, and recommend ` +
    `specific actions. Always respond with concrete, actionable observations and recommendations. ` +
    `Use the available tools to specify actions that should be taken.`;

  const userPrompt = [
    agentPrompt ? `Agent Instructions:\n${agentPrompt}\n` : "",
    `Governance Context:\n${contextSummary}`,
    Object.keys(externalContext).length > 0
      ? `\nAdditional Trigger Context:\n${JSON.stringify(externalContext, null, 2)}`
      : "",
    `\nBased on this context, identify the top governance concerns and recommend actions. ` +
      `For each concern, call the appropriate tool to create the recommended action. ` +
      `Also provide a JSON summary of your observations in this format:\n` +
      `{\n` +
      `  "observations": [{ "title": "", "description": "", "severity": "critical|high|medium|low", "category": "" }],\n` +
      `  "recommendations": [{ "title": "", "description": "", "priority": "urgent|high|medium|low", "category": "", "estimatedImpact": "" }]\n` +
      `}`,
  ]
    .filter(Boolean)
    .join("\n");

  // Convert AGENT_TOOLS to Gemini FunctionDeclaration format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools = [{ functionDeclarations: AGENT_TOOLS as unknown as any[] }];

  const response = await ai.models.generateContent({
    model: AI_MODEL,
    contents: [
      { role: "user", parts: [{ text: `${systemInstruction}

${userPrompt}` }] },
    ],
    config: { thinkingConfig: { thinkingBudget: 0 },
      temperature: 0.3,
      maxOutputTokens: 4096,
    },
  });

  // Parse the response — extract both function calls and text observations
  const output: ParsedAgentOutput = { observations: [], recommendations: [] };

  const parts = response.candidates?.[0]?.content?.parts ?? [];

  // Extract function calls for action items
  const toolCalls: AgentToolCall[] = [];
  for (const part of parts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fc = (part as any).functionCall;
    if (fc?.name) {
      toolCalls.push({ name: fc.name, args: fc.args ?? {} });
    }
  }

  // Extract text content for observations/recommendations
  const textParts = parts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((p: any) => p.text)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => p.text as string)
    .join("\n");

  // Try to parse the JSON summary block from text output
  try {
    const jsonMatch = textParts.match(/\{[\s\S]*"observations"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Partial<ParsedAgentOutput>;
      if (Array.isArray(parsed.observations)) {
        output.observations = parsed.observations.map((o) => ({
          title: String(o.title ?? "Untitled observation"),
          description: String(o.description ?? ""),
          severity: String(o.severity ?? "medium"),
          category: String(o.category ?? agentType),
          entityType: o.entityType,
          entityId: o.entityId,
        }));
      }
      if (Array.isArray(parsed.recommendations)) {
        output.recommendations = parsed.recommendations.map((r, idx) => ({
          title: String(r.title ?? "Untitled recommendation"),
          description: String(r.description ?? ""),
          priority: String(r.priority ?? "medium"),
          category: String(r.category ?? agentType),
          estimatedImpact: r.estimatedImpact ? String(r.estimatedImpact) : undefined,
          // Associate tool calls with recommendations in order
          toolCall: toolCalls[idx],
        }));
      }
    }
  } catch {
    // If JSON parsing fails, create synthetic observations from tool calls
    if (toolCalls.length > 0) {
      output.recommendations = toolCalls.map((tc) => ({
        title: `Agent action: ${tc.name.replace(/_/g, " ")}`,
        description: JSON.stringify(tc.args),
        priority: "medium",
        category: agentType,
        toolCall: tc,
      }));
    }
  }

  // If Gemini returned no structured output, create a fallback observation
  if (output.observations.length === 0 && output.recommendations.length === 0) {
    output.observations = [
      {
        title: "Agent analysis completed — no critical findings",
        description:
          textParts.slice(0, 500) ||
          "The agent completed its governance sweep with no critical findings at this time.",
        severity: "low",
        category: agentType,
      },
    ];
  }

  return output;
}

// ── Main Engine ───────────────────────────────────────────────────────────────

/**
 * Runs a single agent: loads it, executes Gemini analysis, persists results.
 *
 * @param orgId        - Organization UUID
 * @param agentId      - Agent UUID
 * @param triggerType  - How this run was triggered: 'manual'|'schedule'|'event'|'orchestration'
 * @param context      - Optional trigger context (event payload, parent orchestration data, etc.)
 * @param triggeredBy  - UUID of the user who triggered the run (if manual)
 */
export async function runAgent(
  orgId: string,
  agentId: string,
  triggerType: string,
  context: Record<string, unknown> = {},
  triggeredBy?: string
): Promise<AgentRunSummary> {
  // 1. Load agent
  const agent = await repo.findAgentById(orgId, agentId);
  if (!agent) {
    throw new Error(`Agent ${agentId} not found in org ${orgId}`);
  }
  if (agent.status !== "active") {
    throw new Error(`Agent ${agentId} is not active (status: ${agent.status})`);
  }

  // 2. Create run record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const run = await repo.insertRun({
    organizationId: orgId,
    agentId,
    status: "running",
    triggerType,
    triggeredBy: triggeredBy ?? null,
    context,
    startedAt: new Date(),
  } as any);

  const runId = run.id;
  let observationsCreated = 0;
  let recommendationsCreated = 0;
  let actionsCreated = 0;

  try {
    // 3. Build context prompt
    const contextSummary = await buildAgentContext(orgId, agent.agentType);

    // 4. Call Gemini (skip if AI not configured — still record the run)
    let parsed: ParsedAgentOutput = { observations: [], recommendations: [] };

    if (isAIConfigured()) {
      parsed = await callGeminiWithTools(
        agent.name,
        agent.agentType,
        agent.prompt ?? null,
        contextSummary,
        context
      );
    } else {
      parsed.observations = [
        {
          title: "AI not configured — agent run skipped",
          description:
            "GEMINI_API_KEY is not set. Configure it to enable autonomous governance analysis.",
          severity: "low",
          category: agent.agentType,
        },
      ];
    }

    // 5. Persist observations
    for (const obs of parsed.observations) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await repo.insertObservation({
        organizationId: orgId,
        agentId,
        runId,
        title: obs.title,
        description: obs.description,
        severity: obs.severity,
        category: obs.category,
        entityType: obs.entityType ?? null,
        entityId: obs.entityId ?? null,
        status: "new",
      } as any);
      observationsCreated++;
    }

    // 6 + 7. Persist recommendations and actions based on execution mode
    const executionMode = agent.executionMode ?? "advisory";

    for (const rec of parsed.recommendations) {
      // Always create the recommendation record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await repo.insertRecommendation({
        organizationId: orgId,
        agentId,
        runId,
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        category: rec.category,
        estimatedImpact: rec.estimatedImpact ?? null,
        toolCall: rec.toolCall ?? null,
        status: "pending",
      } as any);
      recommendationsCreated++;

      // Create action record based on execution mode
      if (rec.toolCall) {
        const actionStatus =
          executionMode === "autonomous"
            ? "approved" // Will be executed immediately
            : executionMode === "approval_required"
            ? "pending_approval"
            : "pending"; // advisory: action is noted but not executed

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const action = await repo.insertAction({
          organizationId: orgId,
          agentId,
          runId,
          actionType: rec.toolCall.name,
          actionParams: rec.toolCall.args,
          status: actionStatus,
          executionMode,
        } as any);
        actionsCreated++;

        // For autonomous mode: mark as executing immediately
        // The actual execution (calling AUDT services) happens in the action executor
        // which is triggered by a separate process reading 'approved' actions.
        if (executionMode === "autonomous") {
          await repo.updateActionStatus(action.id, "executing");
        }

        // For approval_required: create an approval record
        if (executionMode === "approval_required") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await repo.insertApproval({
            organizationId: orgId,
            agentId,
            actionId: action.id,
            runId,
            status: "pending",
            requestedAt: new Date(),
          } as any);
        }
      }
    }

    // 8. Update run with success status and counts
    await repo.updateRun(runId, {
      status: "completed",
      completedAt: new Date(),
      observationsCount: observationsCreated,
      recommendationsCount: recommendationsCreated,
      actionsCount: actionsCreated,
    });

    // 9. Increment agent run counters
    await repo.incrementAgentRuns(agentId, true);

    // 10. Update daily metrics
    await repo.upsertDailyMetrics(orgId, agentId, {
      totalRuns: 1,
      successRuns: 1,
      failedRuns: 0,
      observationsGenerated: observationsCreated,
      recommendationsGenerated: recommendationsCreated,
      actionsExecuted: executionMode === "autonomous" ? actionsCreated : 0,
    });

    return { runId, observations: observationsCreated, recommendations: recommendationsCreated, actions: actionsCreated };
  } catch (err) {
    // Record failure
    const errorMessage = err instanceof Error ? err.message : String(err);

    await repo.updateRun(runId, {
      status: "failed",
      completedAt: new Date(),
      errorMessage,
      observationsCount: observationsCreated,
      recommendationsCount: recommendationsCreated,
      actionsCount: actionsCreated,
    });

    await repo.incrementAgentRuns(agentId, false);

    await repo.upsertDailyMetrics(orgId, agentId, {
      totalRuns: 1,
      successRuns: 0,
      failedRuns: 1,
    });

    throw err;
  }
}
