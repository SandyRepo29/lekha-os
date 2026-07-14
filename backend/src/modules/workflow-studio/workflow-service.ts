import { DomainError } from "@/lib/services/errors";
import * as repo from "@/backend/src/modules/workflow-studio/workflow-repo";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export async function listWorkflows(orgId: string, filters?: { status?: string; module?: string; search?: string }) {
  return repo.findWorkflowsByOrg(orgId, filters);
}

export async function getWorkflowDetail(orgId: string, id: string) {
  const wf = await repo.findWorkflowWithNodes(orgId, id);
  if (!wf) throw new DomainError("Workflow not found.");
  return wf;
}

export async function getDashboardMetrics(orgId: string) {
  return repo.getDashboardMetrics(orgId);
}

export async function createWorkflow(
  orgId: string,
  userId: string | null,
  data: {
    name: string;
    description?: string;
    module?: string;
    triggerType?: string;
  }
) {
  if (!data.name?.trim()) throw new DomainError("Workflow name is required.");
  const wf = await repo.insertWorkflow({
    organizationId: orgId,
    createdBy: userId ?? undefined,
    ...data,
  });
  if (userId) {
    await db.insert(auditLogs).values({
      organizationId: orgId,
      actorId: userId,
      action: "workflow.created",
      entityType: "workflow",
      entityId: wf.id,
      metadata: { name: wf.name },
    }).catch(() => {});
  }
  return wf;
}

export async function updateWorkflow(
  orgId: string,
  userId: string | null,
  id: string,
  data: Partial<{ name: string; description: string; module: string; status: string; triggerType: string }>
) {
  const existing = await repo.findWorkflowById(orgId, id);
  if (!existing) throw new DomainError("Workflow not found.");
  const wf = await repo.updateWorkflow(orgId, id, data);
  if (userId) {
    await db.insert(auditLogs).values({
      organizationId: orgId,
      actorId: userId,
      action: "workflow.updated",
      entityType: "workflow",
      entityId: id,
      metadata: { name: wf.name },
    }).catch(() => {});
  }
  return wf;
}

export async function publishWorkflow(orgId: string, userId: string, id: string) {
  const existing = await repo.findWorkflowById(orgId, id);
  if (!existing) throw new DomainError("Workflow not found.");
  if (existing.status === "active") throw new DomainError("Workflow is already published.");
  const wf = await repo.publishWorkflow(orgId, id);
  await db.insert(auditLogs).values({
    organizationId: orgId,
    actorId: userId,
    action: "workflow.published",
    entityType: "workflow",
    entityId: id,
    metadata: { name: wf.name },
  }).catch(() => {});
  return wf;
}

export async function deleteWorkflow(orgId: string, userId: string | null, id: string) {
  const existing = await repo.findWorkflowById(orgId, id);
  if (!existing) throw new DomainError("Workflow not found.");
  await repo.deleteWorkflow(orgId, id);
  if (userId) {
    await db.insert(auditLogs).values({
      organizationId: orgId,
      actorId: userId,
      action: "workflow.deleted",
      entityType: "workflow",
      entityId: id,
      metadata: { name: existing.name },
    }).catch(() => {});
  }
}

export async function startWorkflow(
  orgId: string,
  userId: string,
  workflowId: string,
  data?: { triggerEntityId?: string; triggerEntityType?: string; contextData?: unknown }
) {
  const wf = await repo.findWorkflowById(orgId, workflowId);
  if (!wf) throw new DomainError("Workflow not found.");
  if (wf.status !== "active") throw new DomainError("Only published workflows can be started.");
  const run = await repo.insertRun({
    workflowId,
    organizationId: orgId,
    triggerType: "manual",
    startedBy: userId,
    ...data,
  });
  await db.insert(auditLogs).values({
    organizationId: orgId,
    actorId: userId,
    action: "workflow.executed",
    entityType: "workflow_run",
    entityId: run.id,
    metadata: { workflowId, workflowName: wf.name },
  }).catch(() => {});
  return run;
}

export async function listRuns(orgId: string, filters?: { status?: string; workflowId?: string }) {
  return repo.findRunsByOrg(orgId, filters);
}

export async function listApprovals(orgId: string, filters?: { status?: string }) {
  return repo.findApprovalsByOrg(orgId, filters);
}

export async function decideApproval(
  orgId: string,
  userId: string,
  approvalId: string,
  approve: boolean,
  notes?: string
) {
  const status = approve ? "approved" : "rejected";
  const approval = await repo.updateApproval(approvalId, orgId, { status, decisionNotes: notes });
  await db.insert(auditLogs).values({
    organizationId: orgId,
    actorId: userId,
    action: approve ? "workflow.approved" : "workflow.rejected",
    entityType: "workflow_approval",
    entityId: approvalId,
    metadata: { notes },
  }).catch(() => {});
  return approval;
}
