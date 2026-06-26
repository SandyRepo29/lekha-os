import { db } from "@/lib/db";
import { DomainError } from "@/lib/services/errors";
import * as approvalRepo from "@/lib/repositories/approval-repo";
import * as timelineRepo from "@/lib/repositories/vendor-timeline-repo";
import type { ApprovalType, ApprovalWorkflowType, ApprovalDecisionType } from "@/lib/repositories/approval-repo";

export type { ApprovalType, ApprovalWorkflowType, ApprovalDecisionType };

export const APPROVAL_TYPE_LABELS: Record<ApprovalType, string> = {
  procurement: "Procurement Approval",
  security:    "Security Approval",
  compliance:  "Compliance Approval",
  legal:       "Legal Approval",
  privacy:     "Privacy Approval",
  finance:     "Finance Approval",
  executive:   "Executive Approval",
};

/** Start a new approval workflow for a vendor */
export async function startApproval(params: {
  orgId: string;
  vendorId: string;
  vendorName: string;
  approvalType: ApprovalType;
  workflowType: ApprovalWorkflowType;
  title: string;
  initiatedBy: string;
  initiatedByName?: string;
  steps: Array<{
    name: string;
    approverRole?: string;
    approverUserId?: string;
    timeoutHours?: number;
  }>;
  templateId?: string;
  notes?: string;
}): Promise<{ instanceId: string }> {
  const dueAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h default SLA

  const { id: instanceId } = await approvalRepo.insertInstance({
    orgId:        params.orgId,
    templateId:   params.templateId,
    entityType:   "vendor",
    entityId:     params.vendorId,
    title:        params.title,
    approvalType: params.approvalType,
    workflowType: params.workflowType,
    totalSteps:   params.steps.length,
    initiatedBy:  params.initiatedBy,
    dueAt,
    notes:        params.notes,
    metadata:     { vendorName: params.vendorName },
  });

  // Record timeline event
  await timelineRepo.insertTimelineEvent({
    orgId:      params.orgId,
    vendorId:   params.vendorId,
    eventType:  "approval_started",
    title:      `${APPROVAL_TYPE_LABELS[params.approvalType]} started`,
    description: params.title,
    actorId:    params.initiatedBy,
    actorName:  params.initiatedByName,
    entityType: "approval",
    entityId:   instanceId,
    severity:   "info",
  });

  return { instanceId };
}

/** Record an approver's decision on the current step */
export async function recordDecision(params: {
  orgId: string;
  instanceId: string;
  vendorId: string;
  stepNumber: number;
  stepName?: string;
  approverId: string;
  approverName?: string;
  decision: ApprovalDecisionType;
  comments?: string;
  delegatedToId?: string;
}): Promise<{ finalStatus: "approved" | "rejected" | "in_progress" }> {
  const instance = await approvalRepo.findActiveInstanceByVendor(params.orgId, params.vendorId);
  if (!instance) throw new DomainError("No active approval workflow found for this vendor.");
  if (instance.id !== params.instanceId) throw new DomainError("Approval instance mismatch.");

  await approvalRepo.insertDecision({
    instanceId:    params.instanceId,
    orgId:         params.orgId,
    stepNumber:    params.stepNumber,
    stepName:      params.stepName,
    approverId:    params.approverId,
    approverName:  params.approverName,
    decision:      params.decision,
    comments:      params.comments,
    delegatedToId: params.delegatedToId,
  });

  // Determine overall outcome
  if (params.decision === "rejected") {
    await approvalRepo.updateInstanceStatus(params.orgId, params.instanceId, "rejected");
    await timelineRepo.insertTimelineEvent({
      orgId:      params.orgId,
      vendorId:   params.vendorId,
      eventType:  "approval_rejected",
      title:      "Approval rejected",
      description: params.comments,
      actorId:    params.approverId,
      actorName:  params.approverName,
      entityType: "approval",
      entityId:   params.instanceId,
      severity:   "danger",
    });
    return { finalStatus: "rejected" };
  }

  if (params.decision === "approved" && params.stepNumber >= instance.total_steps) {
    await approvalRepo.updateInstanceStatus(params.orgId, params.instanceId, "approved");
    await timelineRepo.insertTimelineEvent({
      orgId:      params.orgId,
      vendorId:   params.vendorId,
      eventType:  "approval_approved",
      title:      "Approval completed — all steps approved",
      description: params.comments,
      actorId:    params.approverId,
      actorName:  params.approverName,
      entityType: "approval",
      entityId:   params.instanceId,
      severity:   "success",
    });
    return { finalStatus: "approved" };
  }

  // Advance to next step (sequential)
  await db.execute(
    // raw sql is fine here — no ORM table for this
    require("drizzle-orm").sql`
      UPDATE approval_instances SET current_step = current_step + 1
      WHERE id = ${params.instanceId} AND organization_id = ${params.orgId}`
  );

  return { finalStatus: "in_progress" };
}

export async function cancelApproval(params: {
  orgId: string;
  instanceId: string;
  vendorId: string;
  actorId: string;
  reason?: string;
}): Promise<void> {
  await approvalRepo.updateInstanceStatus(params.orgId, params.instanceId, "cancelled");
  await timelineRepo.insertTimelineEvent({
    orgId:      params.orgId,
    vendorId:   params.vendorId,
    eventType:  "approval_rejected",
    title:      "Approval cancelled",
    description: params.reason,
    actorId:    params.actorId,
    severity:   "warn",
  });
}

export async function getApprovalHistory(orgId: string, vendorId: string) {
  return approvalRepo.findInstancesByVendor(orgId, vendorId);
}

export async function getTemplates(orgId: string) {
  return approvalRepo.findTemplatesByOrg(orgId);
}

export async function createTemplate(params: {
  orgId: string;
  name: string;
  description?: string;
  approvalType: ApprovalType;
  workflowType: ApprovalWorkflowType;
  triggerOn?: string;
  autoApproveDays?: number;
  createdBy: string;
  steps: Array<{
    name: string;
    description?: string;
    approverRole?: string;
    approverUserId?: string;
    timeoutHours?: number;
    isRequired?: boolean;
  }>;
}): Promise<{ id: string }> {
  const { id } = await approvalRepo.insertTemplate({
    orgId:           params.orgId,
    name:            params.name,
    description:     params.description,
    approvalType:    params.approvalType,
    workflowType:    params.workflowType,
    triggerOn:       params.triggerOn,
    autoApproveDays: params.autoApproveDays,
    createdBy:       params.createdBy,
  });

  for (let i = 0; i < params.steps.length; i++) {
    const s = params.steps[i]!;
    await approvalRepo.insertStep({
      templateId:        id,
      orgId:             params.orgId,
      stepOrder:         i + 1,
      name:              s.name,
      description:       s.description,
      approverRole:      s.approverRole,
      approverUserId:    s.approverUserId,
      timeoutHours:      s.timeoutHours,
      isRequired:        s.isRequired,
    });
  }

  return { id };
}
