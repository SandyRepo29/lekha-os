"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import * as svc from "@/backend/src/modules/toe/toe-service";
import * as ai from "@/backend/src/modules/toe/ai-toe-service";

function orgId(s: Awaited<ReturnType<typeof requireUser>>) {
  return s.org?.id ?? "";
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardDataAction() {
  try {
    const s = await requireUser();
    return { data: await svc.getDashboardData(orgId(s)) };
  } catch (e) { return { error: String(e) }; }
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getEventTypesAction() {
  try {
    await requireUser();
    return { data: await svc.getEventTypes() };
  } catch (e) { return { error: String(e) }; }
}

export async function getOrgEventsAction(filters?: { eventType?: string; limit?: number; offset?: number }) {
  try {
    const s = await requireUser();
    return { data: await svc.getOrgEvents(orgId(s), filters) };
  } catch (e) { return { error: String(e) }; }
}

// ─── Workflows ────────────────────────────────────────────────────────────────

export async function getWorkflowsAction() {
  try {
    const s = await requireUser();
    return { data: await svc.getWorkflows(orgId(s)) };
  } catch (e) { return { error: String(e) }; }
}

export async function getWorkflowByIdAction(id: string) {
  try {
    const s = await requireUser();
    const _ = orgId(s); // auth check
    return { data: await svc.getWorkflowById(id) };
  } catch (e) { return { error: String(e) }; }
}

export async function createWorkflowAction(_: unknown, formData: FormData) {
  try {
    const s = await requireUser();
    const data = await svc.createWorkflow(orgId(s), s.id, {
      name: String(formData.get("name") ?? ""),
      description: formData.get("description") as string | undefined,
      triggerEvent: formData.get("triggerEvent") as string | undefined,
    });
    revalidatePath("/operations/workflows");
    return { data };
  } catch (e) { return { error: String(e) }; }
}

export async function deleteWorkflowAction(id: string) {
  try {
    const s = await requireUser();
    await svc.deleteWorkflow(id, orgId(s));
    revalidatePath("/operations/workflows");
    return { ok: true };
  } catch (e) { return { error: String(e) }; }
}

export async function startWorkflowAction(workflowId: string) {
  try {
    const s = await requireUser();
    const instance = await svc.startWorkflow(orgId(s), s.id, workflowId);
    revalidatePath("/operations/workflows");
    return { data: instance };
  } catch (e) { return { error: String(e) }; }
}

export async function getWorkflowInstancesAction(filters?: { status?: string; workflowId?: string; limit?: number }) {
  try {
    const s = await requireUser();
    return { data: await svc.getWorkflowInstances(orgId(s), filters) };
  } catch (e) { return { error: String(e) }; }
}

export async function getWorkflowInstanceByIdAction(id: string) {
  try {
    const s = await requireUser();
    return { data: await svc.getWorkflowInstanceById(id, orgId(s)) };
  } catch (e) { return { error: String(e) }; }
}

export async function completeStepAction(instanceId: string, stepIndex: number) {
  try {
    const s = await requireUser();
    await svc.completeWorkflowStep(instanceId, orgId(s), stepIndex);
    revalidatePath("/operations/workflows");
    return { ok: true };
  } catch (e) { return { error: String(e) }; }
}

export async function cancelWorkflowInstanceAction(instanceId: string) {
  try {
    const s = await requireUser();
    await svc.cancelWorkflowInstance(instanceId, orgId(s));
    revalidatePath("/operations/workflows");
    return { ok: true };
  } catch (e) { return { error: String(e) }; }
}

// ─── Approvals ────────────────────────────────────────────────────────────────

export async function getApprovalsAction(filters?: { status?: string }) {
  try {
    const s = await requireUser();
    return { data: await svc.getApprovals(orgId(s), filters) };
  } catch (e) { return { error: String(e) }; }
}

export async function createApprovalAction(_: unknown, formData: FormData) {
  try {
    const s = await requireUser();
    const data = await svc.createApproval(orgId(s), s.id, {
      requestType: String(formData.get("requestType") ?? ""),
      title: String(formData.get("title") ?? ""),
      description: formData.get("description") as string | undefined,
      assigneeId: formData.get("assigneeId") as string | undefined,
    });
    revalidatePath("/operations/approvals");
    return { data };
  } catch (e) { return { error: String(e) }; }
}

export async function resolveApprovalAction(id: string, status: "approved" | "rejected", notes?: string) {
  try {
    const s = await requireUser();
    await svc.resolveApproval(id, orgId(s), s.id, status, notes);
    revalidatePath("/operations/approvals");
    return { ok: true };
  } catch (e) { return { error: String(e) }; }
}

// ─── Automation ───────────────────────────────────────────────────────────────

export async function getAutomationRulesAction() {
  try {
    const s = await requireUser();
    return { data: await svc.getAutomationRules(orgId(s)) };
  } catch (e) { return { error: String(e) }; }
}

export async function createAutomationRuleAction(_: unknown, formData: FormData) {
  try {
    const s = await requireUser();
    const data = await svc.createAutomationRule(orgId(s), s.id, {
      name: String(formData.get("name") ?? ""),
      description: formData.get("description") as string | undefined,
      triggerEvent: String(formData.get("triggerEvent") ?? ""),
      actionType: String(formData.get("actionType") ?? "create_task"),
    });
    revalidatePath("/operations/automation");
    return { data };
  } catch (e) { return { error: String(e) }; }
}

export async function toggleAutomationRuleAction(id: string, active: boolean) {
  try {
    const s = await requireUser();
    await svc.toggleAutomationRule(id, orgId(s), active);
    revalidatePath("/operations/automation");
    return { ok: true };
  } catch (e) { return { error: String(e) }; }
}

export async function deleteAutomationRuleAction(id: string) {
  try {
    const s = await requireUser();
    await svc.deleteAutomationRule(id, orgId(s));
    revalidatePath("/operations/automation");
    return { ok: true };
  } catch (e) { return { error: String(e) }; }
}

// ─── AI Decisions ─────────────────────────────────────────────────────────────

export async function getAiDecisionsAction(filters?: { status?: string; priority?: string }) {
  try {
    const s = await requireUser();
    return { data: await svc.getAiDecisions(orgId(s), filters) };
  } catch (e) { return { error: String(e) }; }
}

export async function resolveAiDecisionAction(id: string, status: "accepted" | "dismissed") {
  try {
    const s = await requireUser();
    await svc.resolveAiDecision(id, orgId(s), status);
    revalidatePath("/operations/ai");
    return { ok: true };
  } catch (e) { return { error: String(e) }; }
}

export async function generateRecommendationsAction() {
  try {
    const s = await requireUser();
    const data = await ai.generateWorkflowRecommendations(orgId(s));
    revalidatePath("/operations/ai");
    return { data };
  } catch (e) { return { error: String(e) }; }
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export async function generateAdvisoryAction() {
  try {
    const s = await requireUser();
    const data = await ai.generateOperationsAdvisory(orgId(s), true);
    return { data };
  } catch (e) { return { error: String(e) }; }
}

export async function chatAction(messages: Array<{ role: string; content: string }>) {
  try {
    const s = await requireUser();
    const data = await ai.chat(orgId(s), messages);
    return { data };
  } catch (e) { return { error: String(e) }; }
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getWorkflowAnalyticsAction() {
  try {
    const s = await requireUser();
    return { data: await svc.getWorkflowAnalytics(orgId(s)) };
  } catch (e) { return { error: String(e) }; }
}
