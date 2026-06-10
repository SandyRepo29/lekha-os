import { db } from "@/lib/db";
import {
  issues,
  issueTasks,
  issueComments,
  issueExceptions,
  issueEscalations,
  issueHistory,
  profiles,
  type Issue,
  type IssueTask,
  type IssueComment,
  type IssueException,
  type IssueEscalation,
} from "@/lib/db/schema";
import { and, eq, sql, desc, lt, gte } from "drizzle-orm";

export type IssueWithMeta = Issue & {
  ownerName: string | null;
  ownerEmail: string | null;
  assigneeName: string | null;
  taskCount: number;
};

export type IssueDashboardMetrics = {
  total: number;
  open: number;
  critical: number;
  overdue: number;
  blocked: number;
  resolvedThisMonth: number;
  avgResolutionDays: number;
  slaCompliance: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  topOpenIssues: IssueWithMeta[];
};

export type IssueDetail = Issue & {
  ownerName: string | null;
  ownerEmail: string | null;
  assigneeName: string | null;
  tasks: Array<IssueTask & { ownerName: string | null }>;
  comments: Array<IssueComment & { authorName: string | null }>;
  exceptions: Array<IssueException & { approverName: string | null }>;
  escalations: IssueEscalation[];
  history: Array<{
    id: string;
    fieldChanged: string;
    oldValue: string | null;
    newValue: string | null;
    changedByName: string | null;
    createdAt: Date;
  }>;
};

// Aliases for profile joins
const ownerProfile = profiles;
const assigneeProfile = {
  ...profiles,
  id: sql<string>`ap.id`,
  fullName: sql<string | null>`ap.full_name`,
};

export async function findIssuesByOrg(
  orgId: string,
  filters?: {
    status?: string;
    severity?: string;
    priority?: string;
    sourceModule?: string;
    issueType?: string;
    search?: string;
  }
): Promise<IssueWithMeta[]> {
  // Build WHERE conditions
  const conditions = [eq(issues.organizationId, orgId)];
  if (filters?.status) conditions.push(sql`${issues.status} = ${filters.status}::issue_status`);
  if (filters?.severity) conditions.push(sql`${issues.severity} = ${filters.severity}::issue_severity`);
  if (filters?.priority) conditions.push(sql`${issues.priority} = ${filters.priority}::issue_priority`);
  if (filters?.sourceModule) conditions.push(eq(issues.sourceModule, filters.sourceModule));
  if (filters?.issueType) conditions.push(sql`${issues.issueType} = ${filters.issueType}::issue_type`);
  if (filters?.search) conditions.push(sql`(${issues.title} ILIKE ${"%" + filters.search + "%"} OR ${issues.description} ILIKE ${"%" + filters.search + "%"})`);

  const rows = await db
    .select({
      id: issues.id,
      organizationId: issues.organizationId,
      title: issues.title,
      description: issues.description,
      issueType: issues.issueType,
      sourceModule: issues.sourceModule,
      sourceEntityId: issues.sourceEntityId,
      severity: issues.severity,
      priority: issues.priority,
      status: issues.status,
      ownerId: issues.ownerId,
      assigneeId: issues.assigneeId,
      dueDate: issues.dueDate,
      resolvedDate: issues.resolvedDate,
      resolutionNotes: issues.resolutionNotes,
      slaDays: issues.slaDays,
      slaBreached: issues.slaBreached,
      createdBy: issues.createdBy,
      createdAt: issues.createdAt,
      updatedAt: issues.updatedAt,
      ownerName: sql<string | null>`op.full_name`,
      ownerEmail: sql<string | null>`op.email`,
      assigneeName: sql<string | null>`ap.full_name`,
      taskCount: sql<number>`(SELECT COUNT(*) FROM issue_tasks it WHERE it.issue_id = ${issues.id})::int`,
    })
    .from(issues)
    .leftJoin(sql`profiles op`, sql`op.id = ${issues.ownerId}`)
    .leftJoin(sql`profiles ap`, sql`ap.id = ${issues.assigneeId}`)
    .where(and(...conditions))
    .orderBy(
      sql`CASE ${issues.severity} WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END`,
      sql`${issues.dueDate} ASC NULLS LAST`,
      desc(issues.createdAt)
    );

  return rows as IssueWithMeta[];
}

export async function findIssueById(orgId: string, issueId: string): Promise<IssueDetail | null> {
  const [base] = await db
    .select({
      id: issues.id,
      organizationId: issues.organizationId,
      title: issues.title,
      description: issues.description,
      issueType: issues.issueType,
      sourceModule: issues.sourceModule,
      sourceEntityId: issues.sourceEntityId,
      severity: issues.severity,
      priority: issues.priority,
      status: issues.status,
      ownerId: issues.ownerId,
      assigneeId: issues.assigneeId,
      dueDate: issues.dueDate,
      resolvedDate: issues.resolvedDate,
      resolutionNotes: issues.resolutionNotes,
      slaDays: issues.slaDays,
      slaBreached: issues.slaBreached,
      createdBy: issues.createdBy,
      createdAt: issues.createdAt,
      updatedAt: issues.updatedAt,
      ownerName: sql<string | null>`op.full_name`,
      ownerEmail: sql<string | null>`op.email`,
      assigneeName: sql<string | null>`ap.full_name`,
    })
    .from(issues)
    .leftJoin(sql`profiles op`, sql`op.id = ${issues.ownerId}`)
    .leftJoin(sql`profiles ap`, sql`ap.id = ${issues.assigneeId}`)
    .where(and(eq(issues.id, issueId), eq(issues.organizationId, orgId)));

  if (!base) return null;

  const tasks = await db
    .select({
      id: issueTasks.id,
      issueId: issueTasks.issueId,
      organizationId: issueTasks.organizationId,
      title: issueTasks.title,
      description: issueTasks.description,
      ownerId: issueTasks.ownerId,
      status: issueTasks.status,
      dueDate: issueTasks.dueDate,
      completedAt: issueTasks.completedAt,
      completionNotes: issueTasks.completionNotes,
      createdAt: issueTasks.createdAt,
      updatedAt: issueTasks.updatedAt,
      ownerName: sql<string | null>`tp.full_name`,
    })
    .from(issueTasks)
    .leftJoin(sql`profiles tp`, sql`tp.id = ${issueTasks.ownerId}`)
    .where(eq(issueTasks.issueId, issueId))
    .orderBy(issueTasks.createdAt);

  const comments = await db
    .select({
      id: issueComments.id,
      issueId: issueComments.issueId,
      organizationId: issueComments.organizationId,
      authorId: issueComments.authorId,
      content: issueComments.content,
      createdAt: issueComments.createdAt,
      updatedAt: issueComments.updatedAt,
      authorName: sql<string | null>`cp.full_name`,
    })
    .from(issueComments)
    .leftJoin(sql`profiles cp`, sql`cp.id = ${issueComments.authorId}`)
    .where(eq(issueComments.issueId, issueId))
    .orderBy(issueComments.createdAt);

  const exceptions = await db
    .select({
      id: issueExceptions.id,
      issueId: issueExceptions.issueId,
      organizationId: issueExceptions.organizationId,
      businessJustification: issueExceptions.businessJustification,
      approverId: issueExceptions.approverId,
      approvalDate: issueExceptions.approvalDate,
      expiryDate: issueExceptions.expiryDate,
      reviewDate: issueExceptions.reviewDate,
      status: issueExceptions.status,
      rejectionReason: issueExceptions.rejectionReason,
      createdBy: issueExceptions.createdBy,
      createdAt: issueExceptions.createdAt,
      updatedAt: issueExceptions.updatedAt,
      approverName: sql<string | null>`ep.full_name`,
    })
    .from(issueExceptions)
    .leftJoin(sql`profiles ep`, sql`ep.id = ${issueExceptions.approverId}`)
    .where(eq(issueExceptions.issueId, issueId))
    .orderBy(desc(issueExceptions.createdAt));

  const escalations = await db
    .select()
    .from(issueEscalations)
    .where(eq(issueEscalations.issueId, issueId))
    .orderBy(desc(issueEscalations.createdAt));

  const history = await db
    .select({
      id: issueHistory.id,
      issueId: issueHistory.issueId,
      organizationId: issueHistory.organizationId,
      changedBy: issueHistory.changedBy,
      fieldChanged: issueHistory.fieldChanged,
      oldValue: issueHistory.oldValue,
      newValue: issueHistory.newValue,
      createdAt: issueHistory.createdAt,
      changedByName: sql<string | null>`hp.full_name`,
    })
    .from(issueHistory)
    .leftJoin(sql`profiles hp`, sql`hp.id = ${issueHistory.changedBy}`)
    .where(eq(issueHistory.issueId, issueId))
    .orderBy(desc(issueHistory.createdAt))
    .limit(50);

  return {
    ...(base as unknown as Issue),
    ownerName: base.ownerName,
    ownerEmail: base.ownerEmail,
    assigneeName: base.assigneeName,
    tasks: tasks as Array<IssueTask & { ownerName: string | null }>,
    comments: comments as Array<IssueComment & { authorName: string | null }>,
    exceptions: exceptions as Array<IssueException & { approverName: string | null }>,
    escalations,
    history: history.map((h) => ({
      id: h.id,
      fieldChanged: h.fieldChanged,
      oldValue: h.oldValue,
      newValue: h.newValue,
      changedByName: h.changedByName,
      createdAt: h.createdAt,
    })),
  };
}

export async function getDashboardMetrics(orgId: string): Promise<IssueDashboardMetrics> {
  const now = new Date().toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const allIssues = await db
    .select({
      status: issues.status,
      severity: issues.severity,
      dueDate: issues.dueDate,
      resolvedDate: issues.resolvedDate,
      slaBreached: issues.slaBreached,
      createdAt: issues.createdAt,
      updatedAt: issues.updatedAt,
    })
    .from(issues)
    .where(eq(issues.organizationId, orgId));

  const CLOSED = new Set(["resolved", "closed", "accepted_risk", "deferred"]);
  const open = allIssues.filter((i) => !CLOSED.has(i.status));
  const total = allIssues.length;
  const openCount = open.length;
  const criticalCount = open.filter((i) => i.severity === "critical").length;
  const overdueCount = open.filter((i) => i.dueDate && i.dueDate < now).length;
  const blockedCount = open.filter((i) => i.status === "blocked").length;
  const resolvedThisMonth = allIssues.filter(
    (i) => i.resolvedDate && i.resolvedDate >= monthStart
  ).length;

  const resolved = allIssues.filter((i) => CLOSED.has(i.status));
  const avgResolutionDays = resolved.length
    ? Math.round(
        resolved.reduce((sum, i) => {
          const diff = (new Date(i.updatedAt).getTime() - new Date(i.createdAt).getTime()) / 86400000;
          return sum + diff;
        }, 0) / resolved.length
      )
    : 0;

  const slaCompliant = open.filter((i) => !i.slaBreached).length;
  const slaCompliance = openCount > 0 ? Math.round((slaCompliant / openCount) * 100) : 100;

  const byStatus: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  for (const i of open) {
    byStatus[i.status] = (byStatus[i.status] ?? 0) + 1;
    bySeverity[i.severity] = (bySeverity[i.severity] ?? 0) + 1;
  }

  const topOpenIssues = await findIssuesByOrg(orgId, {});
  return {
    total,
    open: openCount,
    critical: criticalCount,
    overdue: overdueCount,
    blocked: blockedCount,
    resolvedThisMonth,
    avgResolutionDays,
    slaCompliance,
    byStatus,
    bySeverity,
    topOpenIssues: topOpenIssues.filter((i) => !CLOSED.has(i.status)).slice(0, 10),
  };
}

export async function createIssue(data: {
  organizationId: string;
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
  slaDays?: number;
  createdBy?: string;
}) {
  const [row] = await db
    .insert(issues)
    .values({
      organizationId: data.organizationId,
      title: data.title,
      description: data.description,
      issueType: (data.issueType as Issue["issueType"]) ?? "custom",
      sourceModule: data.sourceModule,
      sourceEntityId: data.sourceEntityId,
      severity: (data.severity as Issue["severity"]) ?? "medium",
      priority: (data.priority as Issue["priority"]) ?? "p3",
      ownerId: data.ownerId,
      assigneeId: data.assigneeId,
      dueDate: data.dueDate,
      slaDays: data.slaDays ?? 30,
      createdBy: data.createdBy,
    })
    .returning();
  return row;
}

export async function updateIssue(
  orgId: string,
  issueId: string,
  data: Partial<{
    title: string;
    description: string;
    issueType: string;
    severity: string;
    priority: string;
    status: string;
    ownerId: string;
    assigneeId: string;
    dueDate: string;
    resolvedDate: string;
    resolutionNotes: string;
    slaDays: number;
    slaBreached: boolean;
  }>
) {
  const [row] = await db
    .update(issues)
    .set({ ...(data as Record<string, unknown>), updatedAt: new Date() } as Partial<typeof issues.$inferInsert>)
    .where(and(eq(issues.id, issueId), eq(issues.organizationId, orgId)))
    .returning();
  return row;
}

export async function deleteIssue(orgId: string, issueId: string) {
  await db.delete(issues).where(and(eq(issues.id, issueId), eq(issues.organizationId, orgId)));
}

// ── Tasks ────────────────────────────────────────────────────────────────────

export async function insertTask(data: {
  issueId: string;
  organizationId: string;
  title: string;
  description?: string;
  ownerId?: string;
  dueDate?: string;
}) {
  const [row] = await db.insert(issueTasks).values(data).returning();
  return row;
}

export async function updateTask(
  taskId: string,
  data: Partial<{
    title: string;
    status: string;
    ownerId: string;
    dueDate: string;
    completedAt: Date;
    completionNotes: string;
  }>
) {
  const [row] = await db
    .update(issueTasks)
    .set({ ...(data as Record<string, unknown>), updatedAt: new Date() } as Partial<typeof issueTasks.$inferInsert>)
    .where(eq(issueTasks.id, taskId))
    .returning();
  return row;
}

export async function deleteTask(taskId: string) {
  await db.delete(issueTasks).where(eq(issueTasks.id, taskId));
}

export async function findTasksByOrg(
  orgId: string
): Promise<Array<IssueTask & { ownerName: string | null; issueTitle: string }>> {
  const rows = await db
    .select({
      id: issueTasks.id,
      issueId: issueTasks.issueId,
      organizationId: issueTasks.organizationId,
      title: issueTasks.title,
      description: issueTasks.description,
      ownerId: issueTasks.ownerId,
      status: issueTasks.status,
      dueDate: issueTasks.dueDate,
      completedAt: issueTasks.completedAt,
      completionNotes: issueTasks.completionNotes,
      createdAt: issueTasks.createdAt,
      updatedAt: issueTasks.updatedAt,
      ownerName: sql<string | null>`tp.full_name`,
      issueTitle: sql<string>`i.title`,
    })
    .from(issueTasks)
    .leftJoin(sql`profiles tp`, sql`tp.id = ${issueTasks.ownerId}`)
    .leftJoin(sql`issues i`, sql`i.id = ${issueTasks.issueId}`)
    .where(eq(issueTasks.organizationId, orgId))
    .orderBy(sql`${issueTasks.dueDate} ASC NULLS LAST`, desc(issueTasks.createdAt));

  return rows as Array<IssueTask & { ownerName: string | null; issueTitle: string }>;
}

// ── Comments ─────────────────────────────────────────────────────────────────

export async function insertComment(data: {
  issueId: string;
  organizationId: string;
  authorId: string;
  content: string;
}) {
  const [row] = await db.insert(issueComments).values(data).returning();
  return row;
}

export async function deleteComment(commentId: string) {
  await db.delete(issueComments).where(eq(issueComments.id, commentId));
}

// ── Exceptions ────────────────────────────────────────────────────────────────

export async function insertException(data: {
  issueId: string;
  organizationId: string;
  businessJustification: string;
  expiryDate?: string;
  reviewDate?: string;
  createdBy: string;
}) {
  const [row] = await db.insert(issueExceptions).values(data).returning();
  return row;
}

export async function updateException(
  exceptionId: string,
  data: Partial<{
    status: string;
    approverId: string;
    approvalDate: string;
    rejectionReason: string;
  }>
) {
  const [row] = await db
    .update(issueExceptions)
    .set({ ...(data as Record<string, unknown>), updatedAt: new Date() } as Partial<typeof issueExceptions.$inferInsert>)
    .where(eq(issueExceptions.id, exceptionId))
    .returning();
  return row;
}

export async function findExceptionsByOrg(orgId: string) {
  const rows = await db
    .select({
      id: issueExceptions.id,
      issue_id: issueExceptions.issueId,
      organizationId: issueExceptions.organizationId,
      business_justification: issueExceptions.businessJustification,
      approverId: issueExceptions.approverId,
      approval_date: issueExceptions.approvalDate,
      expiry_date: issueExceptions.expiryDate,
      review_date: issueExceptions.reviewDate,
      status: issueExceptions.status,
      rejectionReason: issueExceptions.rejectionReason,
      createdBy: issueExceptions.createdBy,
      createdAt: issueExceptions.createdAt,
      updatedAt: issueExceptions.updatedAt,
      issue_title: sql<string>`i.title`,
      issue_severity: sql<string>`i.severity`,
      approver_name: sql<string | null>`ep.full_name`,
      created_by_name: sql<string | null>`cb.full_name`,
    })
    .from(issueExceptions)
    .leftJoin(sql`issues i`, sql`i.id = ${issueExceptions.issueId}`)
    .leftJoin(sql`profiles ep`, sql`ep.id = ${issueExceptions.approverId}`)
    .leftJoin(sql`profiles cb`, sql`cb.id = ${issueExceptions.createdBy}`)
    .where(eq(issueExceptions.organizationId, orgId))
    .orderBy(desc(issueExceptions.createdAt));
  return rows as Record<string, unknown>[];
}

// ── Escalations ───────────────────────────────────────────────────────────────

export async function insertEscalation(data: {
  issueId: string;
  organizationId: string;
  escalatedTo: string;
  reason: string;
  escalatedBy: string;
}) {
  const [row] = await db
    .insert(issueEscalations)
    .values(data as unknown as typeof issueEscalations.$inferInsert)
    .returning();
  return row;
}

// ── History ───────────────────────────────────────────────────────────────────

export async function insertHistory(data: {
  issueId: string;
  organizationId: string;
  changedBy: string;
  fieldChanged: string;
  oldValue?: string;
  newValue?: string;
}) {
  await db.insert(issueHistory).values(data).catch(() => {});
}

// ── SLA breach check ──────────────────────────────────────────────────────────

export async function markSlaBreaches(orgId: string) {
  const today = new Date().toISOString().split("T")[0];
  await db
    .update(issues)
    .set({ slaBreached: true, updatedAt: new Date() })
    .where(
      and(
        eq(issues.organizationId, orgId),
        sql`${issues.status} NOT IN ('resolved','closed','accepted_risk','deferred')`,
        sql`${issues.dueDate} IS NOT NULL`,
        sql`${issues.dueDate} < ${today}`,
        eq(issues.slaBreached, false)
      )
    );
}
