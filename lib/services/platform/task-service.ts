import {
  insertTask,
  updateTask as repoUpdateTask,
  deleteTask as repoDeleteTask,
  findOrgTasks,
  findEntityTasks,
  findMyTasks,
  countOrgTasks,
  markSlaBreached,
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
    eventType: "task_created",
    title: `Task created: ${params.title}`,
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
  const patch: Record<string, unknown> = { ...values };

  if (values.status === "completed") {
    patch.completedAt = new Date();
  }

  if (values.priority && SLA_HOURS[values.priority]) {
    patch.slaHours = SLA_HOURS[values.priority];
  }

  await repoUpdateTask(orgId, taskId, patch as Parameters<typeof repoUpdateTask>[2]);

  await publishActivity({
    orgId,
    eventType: "task_updated",
    title: `Task updated`,
    entityType: "task",
    entityId: taskId,
    metadata: { changes: Object.keys(values) },
  }).catch(() => {});
}

export async function completeTask(
  orgId: string,
  taskId: string,
  actorName?: string
): Promise<void> {
  await repoUpdateTask(orgId, taskId, {
    status: "completed",
    completedAt: new Date(),
  });

  await publishActivity({
    orgId,
    actorName,
    eventType: "task_completed",
    title: "Task completed",
    entityType: "task",
    entityId: taskId,
  }).catch(() => {});
}

export async function deleteTask(orgId: string, taskId: string): Promise<void> {
  await repoDeleteTask(orgId, taskId);

  await publishActivity({
    orgId,
    eventType: "task_deleted",
    title: "Task deleted",
    entityType: "task",
    entityId: taskId,
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
  return findOrgTasks(orgId, opts);
}

export async function getEntityTasks(
  orgId: string,
  entityType: string,
  entityId: string
) {
  return findEntityTasks(orgId, entityType, entityId);
}

export async function getMyTasks(orgId: string, userId: string) {
  return findMyTasks(orgId, userId);
}

export async function getTaskDashboard(orgId: string): Promise<{
  total: number;
  open: number;
  overdue: number;
  completedToday: number;
}> {
  return countOrgTasks(orgId);
}

export async function checkSlaBreaches(orgId: string): Promise<number> {
  const overdueTasks = await findOrgTasks(orgId, { overdue: true });
  if (!overdueTasks.length) return 0;

  const nonBreached = overdueTasks.filter((t) => !t.sla_breached);
  for (const task of nonBreached) {
    await markSlaBreached(task.id).catch(() => {});
  }
  return nonBreached.length;
}

export { DomainError };
