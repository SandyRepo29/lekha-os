"use server";

import { requireUser } from "@/lib/auth/session";
import * as service from "@/lib/services/issue-hub/issue-service";
import { DomainError } from "@/lib/services/errors";
import { revalidatePath } from "next/cache";

function handle(e: unknown) {
  if (e instanceof DomainError) return { error: e.message };
  console.error(e);
  return { error: "An unexpected error occurred." };
}

export async function createIssueAction(formData: FormData) {
  try {
    const session = await requireUser();
    if (session.demo || !session.org) return { error: "Not available in demo mode." };
    const issue = await service.createIssue(session.org.id, session.id, {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      issueType: (formData.get("issueType") as string) || undefined,
      sourceModule: (formData.get("sourceModule") as string) || undefined,
      severity: (formData.get("severity") as string) || undefined,
      priority: (formData.get("priority") as string) || undefined,
      ownerId: (formData.get("ownerId") as string) || undefined,
      assigneeId: (formData.get("assigneeId") as string) || undefined,
      dueDate: (formData.get("dueDate") as string) || undefined,
    });
    revalidatePath("/issue-hub");
    return { issue };
  } catch (e) {
    return handle(e);
  }
}

export async function updateIssueAction(issueId: string, formData: FormData) {
  try {
    const session = await requireUser();
    if (session.demo || !session.org) return { error: "Not available in demo mode." };
    const updated = await service.updateIssue(session.org.id, session.id, issueId, {
      title: (formData.get("title") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      severity: (formData.get("severity") as string) || undefined,
      priority: (formData.get("priority") as string) || undefined,
      ownerId: (formData.get("ownerId") as string) || undefined,
      assigneeId: (formData.get("assigneeId") as string) || undefined,
      dueDate: (formData.get("dueDate") as string) || undefined,
    } as Parameters<typeof service.updateIssue>[3]);
    revalidatePath("/issue-hub");
    revalidatePath(`/issue-hub/${issueId}`);
    return { updated };
  } catch (e) {
    return handle(e);
  }
}

export async function updateIssueStatusAction(
  issueId: string,
  status: string,
  resolutionNotes?: string
) {
  try {
    const session = await requireUser();
    if (session.demo || !session.org) return { error: "Not available in demo mode." };
    await service.updateIssueStatus(session.org.id, session.id, issueId, status, resolutionNotes);
    revalidatePath("/issue-hub");
    revalidatePath(`/issue-hub/${issueId}`);
    return { ok: true };
  } catch (e) {
    return handle(e);
  }
}

export async function deleteIssueAction(issueId: string) {
  try {
    const session = await requireUser();
    if (session.demo || !session.org) return { error: "Not available in demo mode." };
    await service.deleteIssue(session.org.id, session.id, issueId);
    revalidatePath("/issue-hub");
    return { ok: true };
  } catch (e) {
    return handle(e);
  }
}

export async function addTaskAction(issueId: string, formData: FormData) {
  try {
    const session = await requireUser();
    if (session.demo || !session.org) return { error: "Not available in demo mode." };
    const task = await service.addTask(session.org.id, issueId, {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      ownerId: (formData.get("ownerId") as string) || undefined,
      dueDate: (formData.get("dueDate") as string) || undefined,
    });
    revalidatePath(`/issue-hub/${issueId}`);
    revalidatePath("/issue-hub/tasks");
    return { task };
  } catch (e) {
    return handle(e);
  }
}

export async function completeTaskAction(taskId: string, issueId: string, notes?: string) {
  try {
    await requireUser();
    await service.completeTask(taskId, notes);
    revalidatePath(`/issue-hub/${issueId}`);
    revalidatePath("/issue-hub/tasks");
    return { ok: true };
  } catch (e) {
    return handle(e);
  }
}

export async function deleteTaskAction(taskId: string, issueId: string) {
  try {
    await requireUser();
    await service.deleteTask(taskId);
    revalidatePath(`/issue-hub/${issueId}`);
    revalidatePath("/issue-hub/tasks");
    return { ok: true };
  } catch (e) {
    return handle(e);
  }
}

export async function addCommentAction(issueId: string, content: string) {
  try {
    const session = await requireUser();
    if (session.demo || !session.org) return { error: "Not available in demo mode." };
    await service.addComment(session.org.id, issueId, session.id, content);
    revalidatePath(`/issue-hub/${issueId}`);
    return { ok: true };
  } catch (e) {
    return handle(e);
  }
}

export async function requestExceptionAction(issueId: string, formData: FormData) {
  try {
    const session = await requireUser();
    if (session.demo || !session.org) return { error: "Not available in demo mode." };
    const exc = await service.requestException(session.org.id, issueId, session.id, {
      businessJustification: formData.get("businessJustification") as string,
      expiryDate: (formData.get("expiryDate") as string) || undefined,
      reviewDate: (formData.get("reviewDate") as string) || undefined,
    });
    revalidatePath(`/issue-hub/${issueId}`);
    revalidatePath("/issue-hub/exceptions");
    return { exception: exc };
  } catch (e) {
    return handle(e);
  }
}

export async function approveExceptionAction(
  exceptionId: string,
  issueId: string,
  approve: boolean,
  rejectionReason?: string
) {
  try {
    const session = await requireUser();
    if (session.demo || !session.org) return { error: "Not available in demo mode." };
    await service.approveException(session.org.id, exceptionId, session.id, approve, rejectionReason);
    revalidatePath(`/issue-hub/${issueId}`);
    revalidatePath("/issue-hub/exceptions");
    return { ok: true };
  } catch (e) {
    return handle(e);
  }
}

export async function escalateIssueAction(issueId: string, formData: FormData) {
  try {
    const session = await requireUser();
    if (session.demo || !session.org) return { error: "Not available in demo mode." };
    await service.escalateIssue(
      session.org.id,
      issueId,
      session.id,
      formData.get("escalatedTo") as string,
      formData.get("reason") as string
    );
    revalidatePath(`/issue-hub/${issueId}`);
    return { ok: true };
  } catch (e) {
    return handle(e);
  }
}
