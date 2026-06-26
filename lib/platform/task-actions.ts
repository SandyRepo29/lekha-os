"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import * as taskService from "@/lib/services/platform/task-service";

export type TaskActionState = { error?: string; ok?: boolean };

function entityPath(entityType?: string | null, entityId?: string | null): string | null {
  if (!entityType || !entityId) return null;
  const map: Record<string, string> = {
    vendor: `/vendors/${entityId}`,
    risk: `/risks/${entityId}`,
    audit: `/audits/${entityId}`,
    finding: `/audits/findings`,
    capa: `/audits/capas`,
    control: `/controls/${entityId}`,
    issue: `/issue-hub/${entityId}`,
    contract: `/contract-governance/${entityId}`,
    policy: `/compliance/policies/${entityId}`,
    evidence: `/compliance/evidence/${entityId}`,
    framework: `/compliance/frameworks/${entityId}`,
    regulation: `/regulatory-intelligence/obligations`,
    asset: `/asset-intelligence/registry`,
    ai_system: `/ai-governance/inventory`,
  };
  return map[entityType] ?? null;
}

export async function createTaskAction(
  _prev: TaskActionState | undefined,
  formData: FormData
): Promise<TaskActionState> {
  let session: Awaited<ReturnType<typeof requireUser>>;
  try {
    session = await requireUser();
  } catch {
    return { error: "Not authenticated" };
  }

  const orgId = session.org?.id;
  if (!orgId) return { error: "No active organisation" };

  const title = (formData.get("title") as string | null)?.trim();
  if (!title) return { error: "Title is required" };

  const description = (formData.get("description") as string | null)?.trim() || undefined;
  const entityType = (formData.get("entityType") as string | null) || undefined;
  const entityId = (formData.get("entityId") as string | null) || undefined;
  const priority = (formData.get("priority") as string | null) as
    | "critical"
    | "high"
    | "medium"
    | "low"
    | undefined;
  const assignedTo = (formData.get("assignedTo") as string | null) || undefined;
  const assignedToName = (formData.get("assignedToName") as string | null) || undefined;
  const dueDateRaw = (formData.get("dueDate") as string | null) || undefined;
  const dueDate = dueDateRaw ? new Date(dueDateRaw) : undefined;

  try {
    await taskService.createTask({
      orgId,
      title,
      description,
      entityType,
      entityId,
      priority,
      assignedTo,
      assignedToName,
      createdBy: session.id,
      dueDate,
    });

    revalidatePath("/platform/tasks");
    const ep = entityPath(entityType, entityId);
    if (ep) revalidatePath(ep);

    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Failed to create task" };
  }
}

export async function updateTaskAction(
  _prev: TaskActionState | undefined,
  formData: FormData
): Promise<TaskActionState> {
  let session: Awaited<ReturnType<typeof requireUser>>;
  try {
    session = await requireUser();
  } catch {
    return { error: "Not authenticated" };
  }

  const orgId = session.org?.id;
  if (!orgId) return { error: "No active organisation" };

  const taskId = (formData.get("taskId") as string | null)?.trim();
  if (!taskId) return { error: "taskId is required" };

  const values: Parameters<typeof taskService.updateTask>[2] = {};

  const title = (formData.get("title") as string | null)?.trim();
  if (title) values.title = title;

  const description = (formData.get("description") as string | null)?.trim();
  if (description !== null && description !== undefined) values.description = description;

  const status = (formData.get("status") as string | null)?.trim();
  if (status) values.status = status;

  const priority = (formData.get("priority") as string | null)?.trim();
  if (priority) values.priority = priority;

  const assignedTo = (formData.get("assignedTo") as string | null)?.trim();
  if (assignedTo) values.assignedTo = assignedTo;

  const assignedToName = (formData.get("assignedToName") as string | null)?.trim();
  if (assignedToName) values.assignedToName = assignedToName;

  const dueDateRaw = (formData.get("dueDate") as string | null)?.trim();
  if (dueDateRaw) values.dueDate = new Date(dueDateRaw);

  const entityType = (formData.get("entityType") as string | null) || undefined;
  const entityId = (formData.get("entityId") as string | null) || undefined;

  try {
    await taskService.updateTask(orgId, taskId, values);

    revalidatePath("/platform/tasks");
    const ep = entityPath(entityType, entityId);
    if (ep) revalidatePath(ep);

    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Failed to update task" };
  }
}

export async function completeTaskAction(taskId: string): Promise<{ error?: string }> {
  let session: Awaited<ReturnType<typeof requireUser>>;
  try {
    session = await requireUser();
  } catch {
    return { error: "Not authenticated" };
  }

  const orgId = session.org?.id;
  if (!orgId) return { error: "No active organisation" };

  try {
    await taskService.completeTask(orgId, taskId);

    revalidatePath("/platform/tasks");

    return {};
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Failed to complete task" };
  }
}

export async function deleteTaskAction(taskId: string): Promise<{ error?: string }> {
  let session: Awaited<ReturnType<typeof requireUser>>;
  try {
    session = await requireUser();
  } catch {
    return { error: "Not authenticated" };
  }

  const orgId = session.org?.id;
  if (!orgId) return { error: "No active organisation" };

  try {
    await taskService.deleteTask(orgId, taskId);

    revalidatePath("/platform/tasks");

    return {};
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Failed to delete task" };
  }
}

export async function getMyTasksAction(): Promise<{ tasks?: any[]; error?: string }> {
  let session: Awaited<ReturnType<typeof requireUser>>;
  try {
    session = await requireUser();
  } catch {
    return { error: "Not authenticated" };
  }

  const orgId = session.org?.id;
  if (!orgId) return { error: "No active organisation" };

  try {
    const tasks = await taskService.getMyTasks(orgId, session.id);
    return { tasks };
  } catch {
    return { error: "Failed to fetch tasks" };
  }
}
