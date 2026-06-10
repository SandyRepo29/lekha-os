import { db } from "@/lib/db";
import {
  workflows,
  workflowNodes,
  workflowTransitions,
  workflowRuns,
  workflowRunSteps,
  workflowApprovals,
  profiles,
  type Workflow,
  type WorkflowNode,
  type WorkflowRun,
  type WorkflowApproval,
} from "@/lib/db/schema";
import { and, eq, sql, desc, count } from "drizzle-orm";

export type WorkflowWithMeta = Workflow & {
  createdByName: string | null;
  runCount: number;
  activeRunCount: number;
};

export type WorkflowRunWithMeta = WorkflowRun & {
  workflowName: string;
  startedByName: string | null;
};

export type WorkflowDashboardMetrics = {
  total: number;
  active: number;
  draft: number;
  totalRuns: number;
  activeRuns: number;
  completedRuns: number;
  failedRuns: number;
  pendingApprovals: number;
  automationRate: number;
  recentRuns: WorkflowRunWithMeta[];
};

// ---- Workflows ----

export async function findWorkflowsByOrg(
  orgId: string,
  filters?: { status?: string; module?: string; isTemplate?: boolean; search?: string }
): Promise<WorkflowWithMeta[]> {
  const conditions = [eq(workflows.organizationId, orgId)];
  if (filters?.status) conditions.push(sql`${workflows.status} = ${filters.status}::workflow_status`);
  if (filters?.module) conditions.push(sql`${workflows.module} = ${filters.module}::workflow_module`);
  if (filters?.isTemplate !== undefined) conditions.push(eq(workflows.isTemplate, filters.isTemplate));
  if (filters?.search) conditions.push(sql`(${workflows.name} ILIKE ${"%" + filters.search + "%"})`);

  const rows = await db
    .select({
      id: workflows.id,
      organizationId: workflows.organizationId,
      name: workflows.name,
      description: workflows.description,
      module: workflows.module,
      status: workflows.status,
      version: workflows.version,
      isTemplate: workflows.isTemplate,
      templateCategory: workflows.templateCategory,
      triggerType: workflows.triggerType,
      triggerConfig: workflows.triggerConfig,
      createdBy: workflows.createdBy,
      publishedAt: workflows.publishedAt,
      createdAt: workflows.createdAt,
      updatedAt: workflows.updatedAt,
      createdByName: profiles.fullName,
      runCount: sql<number>`(SELECT COUNT(*) FROM workflow_runs wr WHERE wr.workflow_id = ${workflows.id})`,
      activeRunCount: sql<number>`(SELECT COUNT(*) FROM workflow_runs wr WHERE wr.workflow_id = ${workflows.id} AND wr.status = 'running')`,
    })
    .from(workflows)
    .leftJoin(profiles, eq(workflows.createdBy, profiles.id))
    .where(and(...conditions))
    .orderBy(desc(workflows.updatedAt));

  return rows as WorkflowWithMeta[];
}

export async function findWorkflowById(orgId: string, id: string) {
  const [row] = await db
    .select()
    .from(workflows)
    .where(and(eq(workflows.id, id), eq(workflows.organizationId, orgId)))
    .limit(1);
  return row ?? null;
}

export async function findWorkflowWithNodes(orgId: string, id: string) {
  const wf = await findWorkflowById(orgId, id);
  if (!wf) return null;
  const nodes = await db
    .select()
    .from(workflowNodes)
    .where(eq(workflowNodes.workflowId, id))
    .orderBy(workflowNodes.createdAt);
  const transitions = await db
    .select()
    .from(workflowTransitions)
    .where(eq(workflowTransitions.workflowId, id));
  return { ...wf, nodes, transitions };
}

export async function insertWorkflow(data: {
  organizationId: string;
  name: string;
  description?: string;
  module?: string;
  triggerType?: string;
  isTemplate?: boolean;
  templateCategory?: string;
  createdBy?: string;
}) {
  const [row] = await db
    .insert(workflows)
    .values({
      organizationId: data.organizationId,
      name: data.name,
      description: data.description,
      module: (data.module ?? "custom") as typeof workflows.$inferInsert["module"],
      triggerType: (data.triggerType ?? "manual") as typeof workflows.$inferInsert["triggerType"],
      isTemplate: data.isTemplate ?? false,
      templateCategory: data.templateCategory,
      createdBy: data.createdBy,
    })
    .returning();
  return row;
}

export async function updateWorkflow(
  orgId: string,
  id: string,
  data: Partial<{
    name: string;
    description: string;
    module: string;
    status: string;
    triggerType: string;
    triggerConfig: unknown;
  }>
) {
  const [row] = await db
    .update(workflows)
    .set({ ...data as Record<string, unknown>, updatedAt: new Date() })
    .where(and(eq(workflows.id, id), eq(workflows.organizationId, orgId)))
    .returning();
  return row;
}

export async function publishWorkflow(orgId: string, id: string) {
  const [row] = await db
    .update(workflows)
    .set({ status: "active", publishedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(workflows.id, id), eq(workflows.organizationId, orgId)))
    .returning();
  return row;
}

export async function deleteWorkflow(orgId: string, id: string) {
  await db.delete(workflows).where(and(eq(workflows.id, id), eq(workflows.organizationId, orgId)));
}

// ---- Nodes ----

export async function insertNode(data: {
  workflowId: string;
  organizationId: string;
  nodeType: string;
  label: string;
  description?: string;
  positionX?: number;
  positionY?: number;
  config?: unknown;
}) {
  const [row] = await db
    .insert(workflowNodes)
    .values({
      workflowId: data.workflowId,
      organizationId: data.organizationId,
      nodeType: data.nodeType as typeof workflowNodes.$inferInsert["nodeType"],
      label: data.label,
      description: data.description,
      positionX: data.positionX ?? 0,
      positionY: data.positionY ?? 0,
      config: data.config ?? null,
    })
    .returning();
  return row;
}

export async function deleteNode(id: string) {
  await db.delete(workflowNodes).where(eq(workflowNodes.id, id));
}

// ---- Runs ----

export async function findRunsByOrg(
  orgId: string,
  filters?: { status?: string; workflowId?: string }
): Promise<WorkflowRunWithMeta[]> {
  const conditions = [eq(workflowRuns.organizationId, orgId)];
  if (filters?.status) conditions.push(sql`${workflowRuns.status} = ${filters.status}::workflow_run_status`);
  if (filters?.workflowId) conditions.push(eq(workflowRuns.workflowId, filters.workflowId));

  const rows = await db
    .select({
      id: workflowRuns.id,
      workflowId: workflowRuns.workflowId,
      organizationId: workflowRuns.organizationId,
      status: workflowRuns.status,
      triggerType: workflowRuns.triggerType,
      triggerEntityId: workflowRuns.triggerEntityId,
      triggerEntityType: workflowRuns.triggerEntityType,
      currentNodeId: workflowRuns.currentNodeId,
      startedBy: workflowRuns.startedBy,
      startedAt: workflowRuns.startedAt,
      completedAt: workflowRuns.completedAt,
      failedReason: workflowRuns.failedReason,
      contextData: workflowRuns.contextData,
      createdAt: workflowRuns.createdAt,
      updatedAt: workflowRuns.updatedAt,
      workflowName: workflows.name,
      startedByName: profiles.fullName,
    })
    .from(workflowRuns)
    .leftJoin(workflows, eq(workflowRuns.workflowId, workflows.id))
    .leftJoin(profiles, eq(workflowRuns.startedBy, profiles.id))
    .where(and(...conditions))
    .orderBy(desc(workflowRuns.startedAt));

  return rows as WorkflowRunWithMeta[];
}

export async function insertRun(data: {
  workflowId: string;
  organizationId: string;
  triggerType?: string;
  triggerEntityId?: string;
  triggerEntityType?: string;
  startedBy?: string;
  contextData?: unknown;
}) {
  const [row] = await db
    .insert(workflowRuns)
    .values({
      workflowId: data.workflowId,
      organizationId: data.organizationId,
      triggerType: (data.triggerType ?? "manual") as typeof workflowRuns.$inferInsert["triggerType"],
      triggerEntityId: data.triggerEntityId,
      triggerEntityType: data.triggerEntityType,
      startedBy: data.startedBy,
      contextData: data.contextData ?? null,
    })
    .returning();
  return row;
}

export async function updateRunStatus(id: string, status: string, failedReason?: string) {
  const [row] = await db
    .update(workflowRuns)
    .set({
      status: status as typeof workflowRuns.$inferInsert["status"],
      completedAt: ["completed", "failed", "cancelled", "rejected"].includes(status) ? new Date() : undefined,
      failedReason: failedReason,
      updatedAt: new Date(),
    })
    .where(eq(workflowRuns.id, id))
    .returning();
  return row;
}

// ---- Approvals ----

export async function findApprovalsByOrg(
  orgId: string,
  filters?: { status?: string; approverId?: string }
): Promise<Array<WorkflowApproval & { workflowName: string; approverName: string | null }>> {
  const conditions = [eq(workflowApprovals.organizationId, orgId)];
  if (filters?.status) conditions.push(sql`${workflowApprovals.status} = ${filters.status}::workflow_approval_status`);
  if (filters?.approverId) conditions.push(eq(workflowApprovals.approverId, filters.approverId));

  const rows = await db
    .select({
      id: workflowApprovals.id,
      runId: workflowApprovals.runId,
      nodeId: workflowApprovals.nodeId,
      organizationId: workflowApprovals.organizationId,
      approverId: workflowApprovals.approverId,
      status: workflowApprovals.status,
      decisionNotes: workflowApprovals.decisionNotes,
      delegatedTo: workflowApprovals.delegatedTo,
      decidedAt: workflowApprovals.decidedAt,
      dueDate: workflowApprovals.dueDate,
      createdAt: workflowApprovals.createdAt,
      updatedAt: workflowApprovals.updatedAt,
      workflowName: workflows.name,
      approverName: profiles.fullName,
    })
    .from(workflowApprovals)
    .leftJoin(workflowRuns, eq(workflowApprovals.runId, workflowRuns.id))
    .leftJoin(workflows, eq(workflowRuns.workflowId, workflows.id))
    .leftJoin(profiles, eq(workflowApprovals.approverId, profiles.id))
    .where(and(...conditions))
    .orderBy(desc(workflowApprovals.createdAt));

  return rows as Array<WorkflowApproval & { workflowName: string; approverName: string | null }>;
}

export async function insertApproval(data: {
  runId: string;
  nodeId: string;
  organizationId: string;
  approverId?: string;
  dueDate?: string;
}) {
  const [row] = await db.insert(workflowApprovals).values(data).returning();
  return row;
}

export async function updateApproval(
  id: string,
  orgId: string,
  data: { status: string; decisionNotes?: string }
) {
  const [row] = await db
    .update(workflowApprovals)
    .set({
      status: data.status as typeof workflowApprovals.$inferInsert["status"],
      decisionNotes: data.decisionNotes,
      decidedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(workflowApprovals.id, id), eq(workflowApprovals.organizationId, orgId)))
    .returning();
  return row;
}

// ---- Dashboard ----

export async function getDashboardMetrics(orgId: string): Promise<WorkflowDashboardMetrics> {
  const [counts] = await db
    .select({
      total: sql<number>`COUNT(*)`,
      active: sql<number>`COUNT(*) FILTER (WHERE status = 'active')`,
      draft: sql<number>`COUNT(*) FILTER (WHERE status = 'draft')`,
    })
    .from(workflows)
    .where(and(eq(workflows.organizationId, orgId), eq(workflows.isTemplate, false)));

  const [runCounts] = await db
    .select({
      totalRuns: sql<number>`COUNT(*)`,
      activeRuns: sql<number>`COUNT(*) FILTER (WHERE status = 'running' OR status = 'waiting')`,
      completedRuns: sql<number>`COUNT(*) FILTER (WHERE status = 'completed')`,
      failedRuns: sql<number>`COUNT(*) FILTER (WHERE status = 'failed')`,
    })
    .from(workflowRuns)
    .where(eq(workflowRuns.organizationId, orgId));

  const [approvalCount] = await db
    .select({ pending: sql<number>`COUNT(*)` })
    .from(workflowApprovals)
    .where(
      and(
        eq(workflowApprovals.organizationId, orgId),
        sql`${workflowApprovals.status} = 'pending'::workflow_approval_status`
      )
    );

  const recentRuns = await findRunsByOrg(orgId);
  const total = Number(counts?.total ?? 0);
  const completedRuns = Number(runCounts?.completedRuns ?? 0);
  const totalRuns = Number(runCounts?.totalRuns ?? 0);
  const automationRate = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;

  return {
    total,
    active: Number(counts?.active ?? 0),
    draft: Number(counts?.draft ?? 0),
    totalRuns,
    activeRuns: Number(runCounts?.activeRuns ?? 0),
    completedRuns,
    failedRuns: Number(runCounts?.failedRuns ?? 0),
    pendingApprovals: Number(approvalCount?.pending ?? 0),
    automationRate,
    recentRuns: recentRuns.slice(0, 10),
  };
}
