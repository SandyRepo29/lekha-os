import {
  insertTask,
  updateTaskById,
  deleteTaskById,
  findTaskById,
  findTasksByOrg,
  findTasksByEntity,
  findTasksByAssignee,
  getDashboardCounts,
  markSlaBreached,
  findSlaBreachCandidates,
} from "@/lib/repositories/platform/task-repo";
import { publishActivity } from "@/lib/services/platform/activity-service";
import { DomainError } from "@/lib/services/errors";

const SLA_HOURS: Record<string, number> = {
  critical: 4,
  high: 24,
  medium: 72,
  low: 168,
};

export async function createTask(params: {
  orgId: string;
  title: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  priority?: "critical" | "high" | "medium" | "low";
  assignedTo?: string;
  assignedToName?: string;
  createdBy?: string;
  createdByName?: string;
  dueDate?: Date;
  tags?: string[];
}): Promise<{ id: string }> {
  const priority = params.priority ?? "medium";
  const slaHours = SLA_HOURS[priority];

  const result = await insertTask({
    orgId: params.orgId,
    title: params.title,
    description: params.description,
    entityType: params.entityType,
    entityId: params.entityId,
    entityName: params.entityName,
    priority,
    slaHours,
    assignedTo: params.assignedTo,
    assignedToName: params.assignedToName,
    createdBy: params.createdBy,
    createdByName: params.createdByName,
    dueDate: params.dueDate,
    tags: params.tags,
  });

  await publishActivity({
    orgId: params.orgId,
    actorId: params.createdBy,
    actorName: params.createdByName,
    verb: "created",
    entityType: "task",
    entityId: result.id,
    entityName: params.title,
    metadata: { priority, entityType: params.entityType, entityId: params.entityId },
  }).catch(() => {});

  return result;
}

export async function updateTask(
  orgId: string,
  taskId: string,
  values: Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
    assignedTo: string;
    assignedToName: string;
    dueDate: Date;
  }>
): Promise<void> {
  const task = await findTaskById(orgId, taskId);
  if (!task) throw new DomainError("Task not found");

  const patch: Record<string, unknown> = { ...values };

  if (values.status === "completed" && task.status !== "completed") {
    patch.completedAt = new Date();
  }

  if (values.priority && SLA_HOURS[values.priority]) {
    patch.slaHours = SLA_HOURS[values.priority];
  }

  await updateTaskById(orgId, taskId, patch);

  await publishActivity({
    orgId,
    verb: "updated",
    entityType: "task",
    entityId: taskId,
    entityName: task.title,
    metadata: { changes: Object.keys(values) },
  }).catch(() => {});
}

export async function completeTask(
  orgId: string,
  taskId: string,
  actorName?: string
): Promise<void> {
  const task = await findTaskById(orgId, taskId);
  if (!task) throw new DomainError("Task not found");
  if (task.status === "completed") throw new DomainError("Task is already completed");

  await updateTaskById(orgId, taskId, {
    status: "completed",
    completedAt: new Date(),
  });

  await publishActivity({
    orgId,
    actorName,
    verb: "completed",
    entityType: "task",
    entityId: taskId,
    entityName: task.title,
  }).catch(() => {});
}

export async function deleteTask(orgId: string, taskId: string): Promise<void> {
  const task = await findTaskById(orgId, taskId);
  if (!task) throw new DomainError("Task not found");

  await deleteTaskById(orgId, taskId);

  await publishActivity({
    orgId,
    verb: "deleted",
    entityType: "task",
    entityId: taskId,
    entityName: task.title,
  }).catch(() => {});
}

export async function getOrgTasks(
  orgId: string,
  opts?: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    entityType?: string;
    entityId?: string;
    overdue?: boolean;
  }
) {
  return findTasksByOrg(orgId, opts);
}

export async function getEntityTasks(
  orgId: string,
  entityType: string,
  entityId: string
) {
  return findTasksByEntity(orgId, entityType, entityId);
}

export async function getMyTasks(orgId: string, userId: string) {
  return findTasksByAssignee(orgId, userId);
}

export async function getTaskDashboard(orgId: string): Promise<{
  total: number;
  open: number;
  overdue: number;
  completedToday: number;
}> {
  return getDashboardCounts(orgId);
}

export async function checkSlaBreaches(orgId: string): Promise<number> {
  const now = new Date();
  const candidates = await findSlaBreachCandidates(orgId, now);
  if (!candidates.length) return 0;

  const ids = candidates.map((t: { id: string }) => t.id);
  await markSlaBreached(orgId, ids);
  return ids.length;
}
