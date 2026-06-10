import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import * as repo from "@/lib/repositories/issue-repo";
import { DomainError } from "@/lib/services/errors";

// SLA days by severity
const SLA_BY_SEVERITY: Record<string, number> = {
  critical: 7,
  high: 14,
  medium: 30,
  low: 90,
  informational: 90,
};

async function logAudit(orgId: string, userId: string, action: string, entityId: string, meta?: Record<string, unknown>) {
  await db.insert(auditLogs).values({
    organizationId: orgId,
    actorId: userId,
    action,
    entityId,
    entityType: "issue",
    metadata: meta ?? {},
  }).catch(() => {});
}

export async function listIssues(
  orgId: string,
  filters?: Parameters<typeof repo.findIssuesByOrg>[1]
) {
  return repo.findIssuesByOrg(orgId, filters);
}

export async function getIssueDetail(orgId: string, issueId: string) {
  return repo.findIssueById(orgId, issueId);
}

export async function getDashboardMetrics(orgId: string) {
  await repo.markSlaBreaches(orgId);
  return repo.getDashboardMetrics(orgId);
}

export async function createIssue(
  orgId: string,
  userId: string,
  data: {
    title: string;
    description?: string;
    issueType?: string;
    sourceModule?: string;
    sourceEntityId?: string;
    severity?: string;
    priority?: string;
    ownerId?: string;
    assigneeId?: string;
    dueDate?: string;
  }
) {
  if (!data.title?.trim()) throw new DomainError("Issue title is required.");
  const slaDays = SLA_BY_SEVERITY[data.severity ?? "medium"] ?? 30;
  const dueDate =
    data.dueDate ??
    (() => {
      const d = new Date();
      d.setDate(d.getDate() + slaDays);
      return d.toISOString().split("T")[0];
    })();
  const issue = await repo.createIssue({
    organizationId: orgId,
    title: data.title.trim(),
    description: data.description,
    issueType: data.issueType,
    sourceModule: data.sourceModule,
    sourceEntityId: data.sourceEntityId,
    severity: data.severity,
    priority: data.priority,
    ownerId: data.ownerId,
    assigneeId: data.assigneeId,
    dueDate,
    slaDays,
    createdBy: userId,
  });
  await logAudit(orgId, userId, "issue.created", issue.id, { title: issue.title, severity: issue.severity });
  return issue;
}

export async function updateIssue(
  orgId: string,
  userId: string,
  issueId: string,
  data: Parameters<typeof repo.updateIssue>[2] & { title?: string }
) {
  const existing = await repo.findIssueById(orgId, issueId);
  if (!existing) throw new DomainError("Issue not found.");

  const updated = await repo.updateIssue(orgId, issueId, data);

  // Track history for key fields
  const tracked: Array<[string, string | null | undefined]> = [
    ["status", existing.status],
    ["severity", existing.severity],
    ["priority", existing.priority],
    ["assigneeId", existing.assigneeId],
  ];
  for (const [field, oldVal] of tracked) {
    const newVal = (data as Record<string, unknown>)[field] as string | undefined;
    if (newVal !== undefined && newVal !== oldVal) {
      await repo.insertHistory({
        issueId,
        organizationId: orgId,
        changedBy: userId,
        fieldChanged: field,
        oldValue: oldVal ?? undefined,
        newValue: newVal,
      });
    }
  }

  await logAudit(orgId, userId, "issue.updated", issueId, data as Record<string, unknown>);
  return updated;
}

export async function deleteIssue(orgId: string, userId: string, issueId: string) {
  const existing = await repo.findIssueById(orgId, issueId);
  if (!existing) throw new DomainError("Issue not found.");
  await repo.deleteIssue(orgId, issueId);
  await logAudit(orgId, userId, "issue.deleted", issueId, { title: existing.title });
}

export async function updateIssueStatus(
  orgId: string,
  userId: string,
  issueId: string,
  newStatus: string,
  resolutionNotes?: string
) {
  const existing = await repo.findIssueById(orgId, issueId);
  if (!existing) throw new DomainError("Issue not found.");
  const resolved = ["resolved", "closed"].includes(newStatus);
  await repo.updateIssue(orgId, issueId, {
    status: newStatus as typeof existing.status,
    resolvedDate: resolved ? new Date().toISOString().split("T")[0] : undefined,
    resolutionNotes: resolutionNotes,
  } as Parameters<typeof repo.updateIssue>[2]);
  await repo.insertHistory({
    issueId,
    organizationId: orgId,
    changedBy: userId,
    fieldChanged: "status",
    oldValue: existing.status,
    newValue: newStatus,
  });
  await logAudit(orgId, userId, newStatus === "closed" ? "issue.closed" : "issue.status_updated", issueId, { newStatus });
}

// ── Tasks ────────────────────────────────────────────────────────────────────

export async function addTask(
  orgId: string,
  issueId: string,
  data: { title: string; description?: string; ownerId?: string; dueDate?: string }
) {
  if (!data.title?.trim()) throw new DomainError("Task title is required.");
  return repo.insertTask({
    issueId,
    organizationId: orgId,
    title: data.title.trim(),
    description: data.description,
    ownerId: data.ownerId,
    dueDate: data.dueDate,
  });
}

export async function completeTask(taskId: string, notes?: string) {
  return repo.updateTask(taskId, {
    status: "completed",
    completedAt: new Date(),
    completionNotes: notes,
  });
}

export async function deleteTask(taskId: string) {
  return repo.deleteTask(taskId);
}

export async function listTasksByOrg(orgId: string) {
  return repo.findTasksByOrg(orgId);
}

// ── Comments ─────────────────────────────────────────────────────────────────

export async function addComment(
  orgId: string,
  issueId: string,
  userId: string,
  content: string
) {
  if (!content?.trim()) throw new DomainError("Comment cannot be empty.");
  return repo.insertComment({
    issueId,
    organizationId: orgId,
    authorId: userId,
    content: content.trim(),
  });
}

export async function deleteComment(commentId: string) {
  return repo.deleteComment(commentId);
}

// ── Exceptions ────────────────────────────────────────────────────────────────

export async function requestException(
  orgId: string,
  issueId: string,
  userId: string,
  data: { businessJustification: string; expiryDate?: string; reviewDate?: string }
) {
  if (!data.businessJustification?.trim())
    throw new DomainError("Business justification is required.");
  const exc = await repo.insertException({
    issueId,
    organizationId: orgId,
    businessJustification: data.businessJustification.trim(),
    expiryDate: data.expiryDate,
    reviewDate: data.reviewDate,
    createdBy: userId,
  });
  await logAudit(orgId, userId, "issue.exception_requested", issueId, { exceptionId: exc.id });
  return exc;
}

export async function approveException(
  orgId: string,
  exceptionId: string,
  userId: string,
  approve: boolean,
  rejectionReason?: string
) {
  const status = approve ? "approved" : "rejected";
  const updated = await repo.updateException(exceptionId, {
    status,
    approverId: userId,
    approvalDate: approve ? new Date().toISOString().split("T")[0] : undefined,
    rejectionReason: !approve ? rejectionReason : undefined,
  });
  await logAudit(orgId, userId, approve ? "issue.exception_approved" : "issue.exception_rejected", exceptionId, { status });
  return updated;
}

export async function listExceptions(orgId: string) {
  return repo.findExceptionsByOrg(orgId);
}

// ── Escalations ───────────────────────────────────────────────────────────────

export async function escalateIssue(
  orgId: string,
  issueId: string,
  userId: string,
  escalatedTo: string,
  reason: string
) {
  if (!reason?.trim()) throw new DomainError("Escalation reason is required.");
  const esc = await repo.insertEscalation({
    issueId,
    organizationId: orgId,
    escalatedTo,
    reason: reason.trim(),
    escalatedBy: userId,
  });
  await repo.updateIssue(orgId, issueId, { status: "in_progress" as const });
  await logAudit(orgId, userId, "issue.escalated", issueId, { escalatedTo, reason });
  return esc;
}
