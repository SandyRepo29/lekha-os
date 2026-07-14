"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import * as svc from "@/backend/src/modules/workflow-studio/workflow-service";

function handle(e: unknown): { error: string } {
  if (e instanceof DomainError) return { error: e.message };
  console.error(e);
  return { error: "An unexpected error occurred." };
}

export async function createWorkflowAction(formData: FormData) {
  try {
    const session = await requireUser();
    if (!session.org) return { error: "No organization." };
    const wf = await svc.createWorkflow(session.org.id, session.id, {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      module: (formData.get("module") as string) || undefined,
      triggerType: (formData.get("triggerType") as string) || undefined,
    });
    revalidatePath("/workflow-studio");
    revalidatePath("/workflow-studio/library");
    return { id: wf.id };
  } catch (e) {
    return handle(e);
  }
}

export async function updateWorkflowAction(id: string, formData: FormData) {
  try {
    const session = await requireUser();
    if (!session.org) return { error: "No organization." };
    await svc.updateWorkflow(session.org.id, session.id, id, {
      name: (formData.get("name") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      module: (formData.get("module") as string) || undefined,
      triggerType: (formData.get("triggerType") as string) || undefined,
    });
    revalidatePath("/workflow-studio");
    revalidatePath(`/workflow-studio/${id}`);
    return { ok: true };
  } catch (e) {
    return handle(e);
  }
}

export async function publishWorkflowAction(id: string) {
  try {
    const session = await requireUser();
    if (!session.org) return { error: "No organization." };
    await svc.publishWorkflow(session.org.id, session.id, id);
    revalidatePath("/workflow-studio");
    revalidatePath(`/workflow-studio/${id}`);
    revalidatePath("/workflow-studio/library");
    return { ok: true };
  } catch (e) {
    return handle(e);
  }
}

export async function deleteWorkflowAction(id: string) {
  try {
    const session = await requireUser();
    if (!session.org) return { error: "No organization." };
    await svc.deleteWorkflow(session.org.id, session.id, id);
    revalidatePath("/workflow-studio");
    revalidatePath("/workflow-studio/library");
    return { ok: true };
  } catch (e) {
    return handle(e);
  }
}

export async function startWorkflowAction(workflowId: string) {
  try {
    const session = await requireUser();
    if (!session.org) return { error: "No organization." };
    const run = await svc.startWorkflow(session.org.id, session.id, workflowId);
    revalidatePath("/workflow-studio/runs");
    revalidatePath(`/workflow-studio/${workflowId}`);
    return { runId: run.id };
  } catch (e) {
    return handle(e);
  }
}

export async function decideApprovalAction(approvalId: string, approve: boolean, notes?: string) {
  try {
    const session = await requireUser();
    if (!session.org) return { error: "No organization." };
    await svc.decideApproval(session.org.id, session.id, approvalId, approve, notes);
    revalidatePath("/workflow-studio/approvals");
    return { ok: true };
  } catch (e) {
    return handle(e);
  }
}
