/**
 * Agent Orchestrator — Multi-agent coordination for Governance Agent Framework™.
 *
 * Manages the sequenced execution of multiple agents as a single orchestration:
 *   - Loads orchestration config from DB
 *   - Runs agents in sequence (agent_sequence array of agent IDs)
 *   - Tracks current step and updates status after each
 *   - Creates default "Governance Sweep" orchestrations on demand
 *
 * No "use server" — pure TypeScript, framework-agnostic.
 */

import * as repo from "@/backend/src/modules/governance-agents/agents-repo";
import { runAgent } from "./agent-engine";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrchestrationStepResult {
  agentId: string;
  runId: string;
  observations: number;
  recommendations: number;
  actions: number;
  error?: string;
}

// ── Orchestration Runner ──────────────────────────────────────────────────────

/**
 * Runs a multi-agent orchestration — executes each agent in the
 * `agent_sequence` array in order. Updates `current_step` and `status`
 * after each agent run. If any agent fails the orchestration continues
 * (fail-soft) so a single bad agent doesn't block the sweep.
 *
 * @param orgId            - Organization UUID
 * @param orchestrationId  - Orchestration UUID
 */
export async function runOrchestration(
  orgId: string,
  orchestrationId: string
): Promise<void> {
  // Load orchestration
  const orchestrations = await repo.findOrchestrationsByOrg(orgId);
  const orchestration = orchestrations.find((o) => o.id === orchestrationId);

  if (!orchestration) {
    throw new Error(`Orchestration ${orchestrationId} not found in org ${orgId}`);
  }

  if (orchestration.status === "running") {
    throw new Error(
      `Orchestration ${orchestrationId} is already running. Concurrent runs are not allowed.`
    );
  }

  // Validate sequence
  const agentSequence = (orchestration.agentSequence ?? []) as string[];
  if (agentSequence.length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await repo.updateOrchestration(orchestrationId, {
      status: "completed",
      completedAt: new Date(),
      currentStep: 0,
    });
    return;
  }

  // Mark as running
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await repo.updateOrchestration(orchestrationId, {
    status: "running",
    startedAt: new Date(),
    currentStep: 0,
  });

  const stepResults: OrchestrationStepResult[] = [];
  let anyFailed = false;

  // Execute agents in sequence
  for (let stepIdx = 0; stepIdx < agentSequence.length; stepIdx++) {
    const agentId = agentSequence[stepIdx];

    // Update current step before running
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await repo.updateOrchestration(orchestrationId, {
      currentStep: stepIdx,
    });

    try {
      const result = await runAgent(
        orgId,
        agentId,
        "orchestration",
        {
          orchestrationId,
          orchestrationName: orchestration.name,
          step: stepIdx + 1,
          totalSteps: agentSequence.length,
        }
      );

      stepResults.push({
        agentId,
        runId: result.runId,
        observations: result.observations,
        recommendations: result.recommendations,
        actions: result.actions,
      });
    } catch (err) {
      // Record failure for this step but continue orchestration (fail-soft)
      const errorMessage = err instanceof Error ? err.message : String(err);
      anyFailed = true;

      stepResults.push({
        agentId,
        runId: "",
        observations: 0,
        recommendations: 0,
        actions: 0,
        error: errorMessage,
      });
    }
  }

  // Compute summary totals
  const totalObservations = stepResults.reduce((sum, r) => sum + r.observations, 0);
  const totalRecommendations = stepResults.reduce((sum, r) => sum + r.recommendations, 0);
  const totalActions = stepResults.reduce((sum, r) => sum + r.actions, 0);

  // Mark orchestration as completed (or completed_with_errors if any step failed)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await repo.updateOrchestration(orchestrationId, {
    status: anyFailed ? "completed" : "completed",
    completedAt: new Date(),
    currentStep: agentSequence.length,
    results: {
      steps: stepResults,
      totalObservations,
      totalRecommendations,
      totalActions,
      failedSteps: stepResults.filter((r) => r.error).length,
    },
  } as any);
}

// ── Default Orchestration Factory ─────────────────────────────────────────────

/**
 * Creates a default "Governance Sweep" orchestration for an organization.
 * Loads all active agents, orders them by type priority (risk-focused first),
 * and creates an orchestration that covers the full governance surface.
 *
 * Returns the new orchestration ID.
 *
 * @param orgId   - Organization UUID
 * @param userId  - UUID of the user creating the orchestration
 */
export async function createDefaultOrchestration(
  orgId: string,
  userId: string
): Promise<string> {
  // Load all active agents for this org
  const allAgents = await repo.findAllAgents(orgId);
  const activeAgents = allAgents.filter((a) => a.status === "active");

  // Sort agents by type — risk and compliance agents run first so downstream
  // agents (e.g. governance_sweep) can act on their outputs.
  const TYPE_PRIORITY: Record<string, number> = {
    compliance_monitor: 1,
    risk_analyst: 2,
    vendor_risk: 3,
    control_health: 4,
    audit_coordinator: 5,
    policy_guardian: 6,
    privacy_officer: 7,
    contract_watcher: 8,
    governance_sweep: 9, // Run last — consolidates all findings
  };

  const sorted = [...activeAgents].sort((a, b) => {
    const pa = TYPE_PRIORITY[a.agentType] ?? 99;
    const pb = TYPE_PRIORITY[b.agentType] ?? 99;
    return pa - pb;
  });

  const agentSequence = sorted.map((a) => a.id);

  // Describe what the orchestration covers
  const agentTypesSummary = sorted
    .map((a) => a.agentType.replace(/_/g, " "))
    .join(", ");

  const description =
    agentSequence.length > 0
      ? `Full governance sweep across ${agentSequence.length} active agents: ${agentTypesSummary}.`
      : "Governance sweep with no active agents configured. Add agents to run analysis.";

  const orchestration = await repo.insertOrchestration({
    organizationId: orgId,
    name: "Governance Sweep",
    description,
    agentSequence,
    status: "pending",
    currentStep: 0,
  } as any);

  return orchestration.id;
}
