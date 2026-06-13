"use server";

import { requireUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import * as svc from "@/lib/services/agents/agent-service";
import {
  generateCopilotResponse,
  generateAgentSummary,
} from "@/lib/services/agents/ai-agent-service";

function getOrgId(s: Awaited<ReturnType<typeof requireUser>>) {
  return s.org?.id ?? "";
}
function getUserId(s: Awaited<ReturnType<typeof requireUser>>) {
  return s.id;
}

export async function getDashboardDataAction() {
  try {
    const session = await requireUser();
    const data = await svc.getDashboardData(getOrgId(session));
    return { data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to load dashboard data" };
  }
}

export async function getAgentsAction() {
  try {
    const session = await requireUser();
    const data = await svc.getAgents(getOrgId(session));
    return { data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to load agents" };
  }
}

export async function createAgentAction(formData: FormData) {
  try {
    const session = await requireUser();
    const data = await svc.createAgent(getOrgId(session), getUserId(session), {
      name: formData.get("name") as string,
      agentType: formData.get("agentType") as string,
      description: (formData.get("description") as string) ?? undefined,
      executionMode: (formData.get("executionMode") as string) ?? undefined,
      triggerType: (formData.get("triggerType") as string) ?? undefined,
      prompt: (formData.get("prompt") as string) ?? undefined,
      approvalMode: (formData.get("approvalMode") as string) ?? undefined,
    });
    revalidatePath("/agents");
    return { data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to create agent" };
  }
}

export async function updateAgentAction(id: string, formData: FormData) {
  try {
    const session = await requireUser();
    const data = await svc.updateAgent(getOrgId(session), id, {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) ?? undefined,
      executionMode: (formData.get("executionMode") as string) ?? undefined,
      triggerType: (formData.get("triggerType") as string) ?? undefined,
      prompt: (formData.get("prompt") as string) ?? undefined,
      approvalMode: (formData.get("approvalMode") as string) ?? undefined,
    });
    revalidatePath("/agents");
    return { data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to update agent" };
  }
}

export async function deleteAgentAction(id: string) {
  try {
    const session = await requireUser();
    await svc.deleteAgent(getOrgId(session), id);
    revalidatePath("/agents");
    return { data: { success: true } };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to delete agent" };
  }
}

export async function activateAgentAction(id: string) {
  try {
    const session = await requireUser();
    const data = await svc.activateAgent(getOrgId(session), id);
    revalidatePath("/agents");
    return { data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to activate agent" };
  }
}

export async function pauseAgentAction(id: string) {
  try {
    const session = await requireUser();
    const data = await svc.pauseAgent(getOrgId(session), id);
    revalidatePath("/agents");
    return { data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to pause agent" };
  }
}

export async function triggerAgentAction(id: string) {
  try {
    const session = await requireUser();
    const data = await svc.triggerAgent(getOrgId(session), id, getUserId(session));
    revalidatePath("/agents");
    return { data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to trigger agent" };
  }
}

export async function getObservationsAction(filters?: {
  severity?: string;
  status?: string;
  agentId?: string;
}) {
  try {
    const session = await requireUser();
    const data = await svc.getObservations(getOrgId(session), filters);
    return { data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to load observations" };
  }
}

export async function acknowledgeObservationAction(id: string) {
  try {
    const session = await requireUser();
    const data = await svc.acknowledgeObservation(getOrgId(session), id);
    revalidatePath("/agents");
    return { data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to acknowledge observation" };
  }
}

export async function getRecommendationsAction(filters?: {
  priority?: string;
  status?: string;
}) {
  try {
    const session = await requireUser();
    const data = await svc.getRecommendations(getOrgId(session), filters);
    return { data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to load recommendations" };
  }
}

export async function acceptRecommendationAction(id: string) {
  try {
    const session = await requireUser();
    const data = await svc.acceptRecommendation(getOrgId(session), id, getUserId(session));
    revalidatePath("/agents");
    return { data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to accept recommendation" };
  }
}

export async function rejectRecommendationAction(id: string) {
  try {
    const session = await requireUser();
    const data = await svc.rejectRecommendation(getOrgId(session), id, getUserId(session));
    revalidatePath("/agents");
    return { data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to reject recommendation" };
  }
}

export async function getPendingActionsAction() {
  try {
    const session = await requireUser();
    const data = await svc.getPendingActions(getOrgId(session));
    return { data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to load pending actions" };
  }
}

export async function approveActionAction(actionId: string, notes?: string) {
  try {
    const session = await requireUser();
    const data = await svc.approveAction(getOrgId(session), actionId, getUserId(session), notes);
    revalidatePath("/agents");
    return { data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to approve action" };
  }
}

export async function rejectActionAction(actionId: string, notes?: string) {
  try {
    const session = await requireUser();
    const data = await svc.rejectAction(getOrgId(session), actionId, getUserId(session), notes);
    revalidatePath("/agents");
    return { data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to reject action" };
  }
}

export async function getRunsAction(limit?: number) {
  try {
    const session = await requireUser();
    const data = await svc.getRuns(getOrgId(session), limit);
    return { data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to load agent runs" };
  }
}

export async function generateAgentSummaryAction() {
  try {
    const session = await requireUser();
    const metrics = await svc.getDashboardMetrics(getOrgId(session));
    const data = await generateAgentSummary(getOrgId(session), metrics);
    return { data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to generate agent summary" };
  }
}

export async function copilotChatAction(
  message: string,
  history: Array<{ role: string; content: string }>,
  agentId?: string,
) {
  try {
    const session = await requireUser();
    const data = await generateCopilotResponse(getOrgId(session), getUserId(session), message, history);
    return { data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to get copilot response" };
  }
}
