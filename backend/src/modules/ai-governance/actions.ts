"use server";

import { requireUser } from "@/lib/auth/session";
import * as svc from "@/backend/src/modules/ai-governance/ai-governance-service";
import * as aiCopilot from "@/backend/src/modules/ai-governance/ai-copilot-service";
import { revalidatePath } from "next/cache";

function getOrgId(session: Awaited<ReturnType<typeof requireUser>>) {
  return session.org?.id ?? "";
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardDataAction() {
  try {
    const session = await requireUser();
    const data = await svc.getDashboardData(getOrgId(session));
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load dashboard" };
  }
}

// ── AI Systems ────────────────────────────────────────────────────────────────

export async function createAiSystemAction(data: FormData | Record<string, unknown>) {
  try {
    const session = await requireUser();
    const payload =
      data instanceof FormData ? Object.fromEntries(data.entries()) : data;
    const result = await svc.createAiSystem(getOrgId(session), session.id, payload as any);
    revalidatePath("/ai-governance");
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create AI system" };
  }
}

export async function updateAiSystemAction(
  id: string,
  data: Record<string, unknown>
) {
  try {
    const session = await requireUser();
    const result = await svc.updateAiSystem(getOrgId(session), session.id, id, data as any);
    revalidatePath("/ai-governance");
    revalidatePath(`/ai-governance/systems/${id}`);
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update AI system" };
  }
}

export async function deleteAiSystemAction(id: string) {
  try {
    const session = await requireUser();
    await svc.deleteAiSystem(getOrgId(session), session.id, id);
    revalidatePath("/ai-governance");
    return { data: { id } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete AI system" };
  }
}

// ── AI Vendors ────────────────────────────────────────────────────────────────

export async function createAiVendorAction(data: Record<string, unknown>) {
  try {
    const session = await requireUser();
    const result = await svc.createAiVendor(getOrgId(session), session.id, data as any);
    revalidatePath("/ai-governance/vendors");
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create AI vendor" };
  }
}

export async function updateAiVendorAction(
  id: string,
  data: Record<string, unknown>
) {
  try {
    const session = await requireUser();
    const result = await svc.updateAiVendor(getOrgId(session), session.id, id, data as any);
    revalidatePath("/ai-governance/vendors");
    revalidatePath(`/ai-governance/vendors/${id}`);
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update AI vendor" };
  }
}

// ── AI Risks ──────────────────────────────────────────────────────────────────

export async function createAiRiskAction(data: Record<string, unknown>) {
  try {
    const session = await requireUser();
    const result = await svc.createAiRisk(getOrgId(session), session.id, data as any);
    revalidatePath("/ai-governance/risks");
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create AI risk" };
  }
}

export async function updateAiRiskAction(
  id: string,
  data: Record<string, unknown>
) {
  try {
    const session = await requireUser();
    const result = await svc.updateAiRisk(getOrgId(session), session.id, id, data as any);
    revalidatePath("/ai-governance/risks");
    revalidatePath(`/ai-governance/risks/${id}`);
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update AI risk" };
  }
}

// ── AI Controls ───────────────────────────────────────────────────────────────

export async function createAiControlAction(data: Record<string, unknown>) {
  try {
    const session = await requireUser();
    const result = await svc.createAiControl(getOrgId(session), session.id, data as any);
    revalidatePath("/ai-governance/controls");
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create AI control" };
  }
}

// ── AI Policies ───────────────────────────────────────────────────────────────

export async function createAiPolicyAction(data: Record<string, unknown>) {
  try {
    const session = await requireUser();
    const result = await svc.createAiPolicy(getOrgId(session), session.id, data as any);
    revalidatePath("/ai-governance/policies");
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create AI policy" };
  }
}

// ── AI Incidents ──────────────────────────────────────────────────────────────

export async function createAiIncidentAction(data: Record<string, unknown>) {
  try {
    const session = await requireUser();
    const result = await svc.createAiIncident(getOrgId(session), session.id, data as any);
    revalidatePath("/ai-governance/incidents");
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create AI incident" };
  }
}

export async function updateAiIncidentAction(
  id: string,
  data: Record<string, unknown>
) {
  try {
    const session = await requireUser();
    const result = await svc.updateAiIncident(getOrgId(session), session.id, id, data as any);
    revalidatePath("/ai-governance/incidents");
    revalidatePath(`/ai-governance/incidents/${id}`);
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update AI incident" };
  }
}

// ── Trust Score ───────────────────────────────────────────────────────────────

export async function computeAiTrustScoreAction(systemId: string) {
  try {
    const session = await requireUser();
    const result = await svc.computeAiTrustScore(getOrgId(session), systemId);
    revalidatePath("/ai-governance");
    revalidatePath(`/ai-governance/systems/${systemId}`);
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to compute AI trust score" };
  }
}

// ── AI Copilot ────────────────────────────────────────────────────────────────

export async function generateGovernanceSummaryAction() {
  try {
    const session = await requireUser();
    const data = await aiCopilot.generateAiGovernanceSummary(getOrgId(session));
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to generate governance summary" };
  }
}

export async function chatAction(
  messages: { role: string; content: string }[]
) {
  try {
    const session = await requireUser();
    const data = await aiCopilot.chat(getOrgId(session), messages);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to process chat" };
  }
}
