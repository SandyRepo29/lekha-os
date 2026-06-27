import * as repo from "@/lib/repositories/toe-repo";

// ─── Events ───────────────────────────────────────────────────────────────────

export async function publishEvent(orgId: string, eventType: string, opts?: {
  entityType?: string; entityId?: string; actorId?: string; payload?: Record<string, unknown>;
}) {
  return repo.insertEvent({ orgId, eventType, ...opts });
}

export async function getEventTypes() {
  return repo.findEventTypes();
}

export async function getOrgEvents(orgId: string, filters?: {
  eventType?: string; limit?: number; offset?: number;
}) {
  return repo.findOrgEvents(orgId, filters);
}

// ─── Workflows ────────────────────────────────────────────────────────────────

export async function getWorkflows(orgId: string) {
  return repo.findWorkflows(orgId);
}

export async function getWorkflowTemplates() {
  return repo.findWorkflowTemplates();
}

export async function getWorkflowById(id: string) {
  return repo.findWorkflowById(id);
}

export async function createWorkflow(orgId: string, userId: string, data: {
  name: string; description?: string; triggerEvent?: string; steps?: unknown[];
}) {
  return repo.insertWorkflow({ orgId, createdBy: userId, ...data });
}

export async function updateWorkflow(id: string, orgId: string, data: {
  name?: string; description?: string; triggerEvent?: string; steps?: unknown[]; status?: string;
}) {
  return repo.updateWorkflow(id, orgId, data);
}

export async function deleteWorkflow(id: string, orgId: string) {
  return repo.deleteWorkflow(id, orgId);
}

export async function startWorkflow(orgId: string, userId: string, workflowId: string, opts?: {
  triggerEventId?: string; context?: Record<string, unknown>;
}) {
  const workflow = await repo.findWorkflowById(workflowId);
  if (!workflow) throw new Error("Workflow not found");
  const steps = (workflow.steps as unknown[]) ?? [];
  const instance = await repo.insertInstance({
    orgId,
    workflowId,
    workflowName: workflow.name,
    triggerEventId: opts?.triggerEventId,
    totalSteps: steps.length,
    context: opts?.context ?? {},
    createdBy: userId,
  });
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i] as Record<string, unknown>;
    await repo.insertInstanceStep({
      instanceId: instance.id,
      stepIndex: i,
      stepName: String(step.name ?? `Step ${i + 1}`),
      stepType: String(step.type ?? "action"),
      input: step.config ?? {},
    });
  }
  await repo.updateInstanceStatus(instance.id, orgId, "running", { currentStep: 0 });
  await publishEvent(orgId, "workflow.started", {
    entityId: instance.id as unknown as string,
    entityType: "workflow_instance",
    actorId: userId,
    payload: { workflowName: workflow.name },
  });
  return instance;
}

export async function getWorkflowInstances(orgId: string, filters?: {
  status?: string; workflowId?: string; limit?: number;
}) {
  return repo.findInstances(orgId, filters);
}

export async function getWorkflowInstanceById(id: string, orgId: string) {
  const [instance, steps] = await Promise.all([
    repo.findInstanceById(id, orgId),
    repo.findInstanceSteps(id),
  ]);
  return instance ? { ...instance, steps } : null;
}

export async function completeWorkflowStep(instanceId: string, orgId: string, stepIndex: number) {
  const instance = await repo.findInstanceById(instanceId, orgId);
  if (!instance) throw new Error("Instance not found");
  const nextStep = stepIndex + 1;
  if (nextStep >= instance.total_steps) {
    await repo.updateInstanceStatus(instanceId, orgId, "completed", {
      currentStep: nextStep,
      completedAt: new Date(),
    });
    await publishEvent(orgId, "workflow.completed", {
      entityId: instanceId,
      entityType: "workflow_instance",
    });
  } else {
    await repo.updateInstanceStatus(instanceId, orgId, "running", { currentStep: nextStep });
  }
}

export async function cancelWorkflowInstance(instanceId: string, orgId: string) {
  await repo.updateInstanceStatus(instanceId, orgId, "cancelled", { completedAt: new Date() });
}

// ─── Approvals ────────────────────────────────────────────────────────────────

export async function getApprovals(orgId: string, filters?: {
  status?: string; assigneeId?: string; limit?: number;
}) {
  return repo.findApprovals(orgId, filters);
}

export async function createApproval(orgId: string, userId: string, data: {
  entityType?: string; entityId?: string; requestType: string; title: string;
  description?: string; assigneeId?: string; context?: Record<string, unknown>;
  instanceId?: string; dueDays?: number;
}) {
  const dueAt = data.dueDays
    ? new Date(Date.now() + data.dueDays * 86400000)
    : undefined;
  await publishEvent(orgId, "approval.requested", {
    actorId: userId,
    payload: { title: data.title, requestType: data.requestType },
  });
  return repo.insertApproval({ orgId, requesterId: userId, dueAt, ...data });
}

export async function resolveApproval(id: string, orgId: string, userId: string, status: "approved" | "rejected", notes?: string) {
  await repo.resolveApproval(id, orgId, status, notes);
}

// ─── Automation ───────────────────────────────────────────────────────────────

export async function getAutomationRules(orgId: string) {
  return repo.findAutomationRules(orgId);
}

export async function createAutomationRule(orgId: string, userId: string, data: {
  name: string; description?: string; triggerEvent: string;
  conditions?: Record<string, unknown>; actionType: string; actionConfig?: Record<string, unknown>;
}) {
  return repo.insertAutomationRule({ orgId, createdBy: userId, ...data });
}

export async function toggleAutomationRule(id: string, orgId: string, active: boolean) {
  return repo.toggleAutomationRule(id, orgId, active);
}

export async function deleteAutomationRule(id: string, orgId: string) {
  return repo.deleteAutomationRule(id, orgId);
}

// ─── AI Decisions ─────────────────────────────────────────────────────────────

export async function getAiDecisions(orgId: string, filters?: {
  status?: string; priority?: string; limit?: number;
}) {
  return repo.findAiDecisions(orgId, filters);
}

export async function resolveAiDecision(id: string, orgId: string, status: "accepted" | "dismissed") {
  return repo.resolveAiDecision(id, orgId, status);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardData(orgId: string) {
  const [metrics, recentEvents, pendingApprovals, activeInstances, openDecisions, templates] = await Promise.all([
    repo.getDashboardMetrics(orgId),
    repo.findOrgEvents(orgId, { limit: 10 }),
    repo.findApprovals(orgId, { status: "pending", limit: 5 }),
    repo.findInstances(orgId, { status: "running", limit: 5 }),
    repo.findAiDecisions(orgId, { status: "pending", limit: 5 }),
    repo.findWorkflowTemplates(),
  ]);
  return { metrics, recentEvents, pendingApprovals, activeInstances, openDecisions, templates };
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getWorkflowAnalytics(orgId: string) {
  const [analytics, instanceCounts] = await Promise.all([
    repo.findWorkflowAnalytics(orgId),
    repo.countInstancesByStatus(orgId),
  ]);
  return { analytics, instanceCounts };
}
