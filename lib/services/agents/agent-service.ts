"use server";

import * as repo from "@/lib/repositories/agents-repo";
import { runAgent } from "./agent-engine";
import { generateAgentInsight } from "./ai-agent-service";

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export async function getDashboardData(orgId: string) {
  const [metrics, agents, runs, observations, pendingActions] = await Promise.all([
    repo.getDashboardMetrics(orgId),
    repo.findAllAgents(orgId),
    repo.findRunsByOrg(orgId, { limit: 10 }),
    repo.findObservationsByOrg(orgId, { limit: 20 }),
    repo.findPendingActions(orgId),
  ]);

  return { metrics, agents, runs, observations, pendingActions };
}

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------
export async function getAgents(orgId: string) {
  return repo.findAllAgents(orgId);
}

export async function createAgent(
  orgId: string,
  userId: string,
  data: {
    name: string;
    description?: string;
    agentType: string;
    executionMode?: string;
    triggerType?: string;
    prompt?: string;
    approvalMode?: string;
    schedule?: string;
  }
) {
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return repo.insertAgent({
    organizationId: orgId,
    createdBy: userId,
    slug,
    status: "draft",
    name: data.name,
    description: data.description,
    agentType: data.agentType,
    executionMode: data.executionMode ?? "advisory",
    triggerType: data.triggerType ?? "manual",
    prompt: data.prompt,
    approvalMode: data.approvalMode ?? "manual",
    schedule: data.schedule,
  } as any);
}

export async function updateAgent(
  orgId: string,
  id: string,
  data: Partial<{
    name: string;
    description: string;
    agentType: string;
    executionMode: string;
    triggerType: string;
    prompt: string;
    approvalMode: string;
    schedule: string;
    status: string;
  }>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return repo.updateAgent(orgId, id, data as any);
}

export async function deleteAgent(orgId: string, id: string) {
  return repo.deleteAgent(orgId, id);
}

export async function activateAgent(orgId: string, id: string) {
  return repo.updateAgent(orgId, id, { status: "active" });
}

export async function pauseAgent(orgId: string, id: string) {
  return repo.updateAgent(orgId, id, { status: "paused" });
}

export async function triggerAgent(orgId: string, agentId: string, userId: string) {
  return runAgent(orgId, agentId, userId);
}

// ---------------------------------------------------------------------------
// Observations
// ---------------------------------------------------------------------------
export async function getObservations(
  orgId: string,
  filters?: {
    severity?: string;
    observationType?: string;
    acknowledged?: boolean;
    agentId?: string;
    limit?: number;
  }
) {
  return repo.findObservationsByOrg(orgId, filters);
}

export async function acknowledgeObservation(_orgId: string, id: string) {
  return repo.updateObservationStatus(id, "acknowledged");
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------
export async function getRecommendations(
  orgId: string,
  filters?: {
    priority?: string;
    status?: string;
    agentId?: string;
    limit?: number;
  }
) {
  return repo.findRecommendationsByOrg(orgId, filters);
}

export async function acceptRecommendation(_orgId: string, id: string, userId: string) {
  return repo.updateRecommendationStatus(id, "accepted", userId);
}

export async function rejectRecommendation(_orgId: string, id: string, userId: string) {
  return repo.updateRecommendationStatus(id, "rejected", userId);
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
export async function getPendingActions(orgId: string) {
  return repo.findPendingActions(orgId);
}

export async function approveAction(
  orgId: string,
  actionId: string,
  userId: string,
  notes?: string
) {
  return repo.updateActionStatus(actionId, "approved", { approvedBy: userId });
}

export async function rejectAction(
  orgId: string,
  actionId: string,
  userId: string,
  notes?: string
) {
  return repo.updateActionStatus(actionId, "rejected", { approvedBy: userId });
}

// ---------------------------------------------------------------------------
// Runs
// ---------------------------------------------------------------------------
export async function getRuns(orgId: string, limit?: number) {
  return repo.findRunsByOrg(orgId, { limit: limit ?? 50 });
}

// ---------------------------------------------------------------------------
// Metrics history
// ---------------------------------------------------------------------------
export async function getMetricsHistory(orgId: string, days?: number) {
  return repo.getMetricsHistory(orgId, days ?? 30);
}

export async function getDashboardMetrics(orgId: string) {
  return repo.getDashboardMetrics(orgId);
}
