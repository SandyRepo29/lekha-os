"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import * as svc from "@/lib/services/control-center/control-center-service";
import * as aiSvc from "@/lib/services/control-center/ai-control-service";
import * as repo from "@/lib/repositories/control-center-repo";
import { computeControlHealth } from "@/lib/services/control-health";

export type ControlState = { error?: string; ok?: boolean; data?: unknown } | undefined;

// ── Create ──────────────────────────────────────────────────────────────────

export async function createControlAction(
  _prev: ControlState,
  formData: FormData
): Promise<ControlState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const { id } = await svc.createControl({
      orgId: session.org.id,
      actorId: session.id,
      controlRef: String(formData.get("controlRef") || ""),
      name: String(formData.get("name") || ""),
      description: (formData.get("description") as string) || undefined,
      objective: (formData.get("objective") as string) || undefined,
      category: (formData.get("category") as string) || undefined,
      owner: (formData.get("owner") as string) || undefined,
      ownerId: (formData.get("ownerId") as string) || undefined,
      controlType: (formData.get("controlType") as string) || undefined,
      frequency: (formData.get("frequency") as string) || undefined,
      automationLevel: (formData.get("automationLevel") as string) || undefined,
      priority: (formData.get("priority") as string) || undefined,
      status: (formData.get("status") as string) || undefined,
      frameworkId: (formData.get("frameworkId") as string) || undefined,
      nextReviewDate: (formData.get("nextReviewDate") as string) || undefined,
      nextTestDate: (formData.get("nextTestDate") as string) || undefined,
    });
    revalidatePath("/controls");
    redirect(`/controls/${id}`);
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Update ──────────────────────────────────────────────────────────────────

export async function updateControlAction(
  _prev: ControlState,
  formData: FormData
): Promise<ControlState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const id = String(formData.get("id") || "");
  try {
    await svc.updateControl({
      orgId: session.org.id,
      actorId: session.id,
      id,
      controlRef: (formData.get("controlRef") as string) || undefined,
      name: (formData.get("name") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      objective: (formData.get("objective") as string) || undefined,
      category: (formData.get("category") as string) || undefined,
      owner: (formData.get("owner") as string) || undefined,
      ownerId: (formData.get("ownerId") as string) || undefined,
      controlType: (formData.get("controlType") as string) || undefined,
      frequency: (formData.get("frequency") as string) || undefined,
      automationLevel: (formData.get("automationLevel") as string) || undefined,
      priority: (formData.get("priority") as string) || undefined,
      status: (formData.get("status") as string) || undefined,
      nextReviewDate: (formData.get("nextReviewDate") as string) || undefined,
      nextTestDate: (formData.get("nextTestDate") as string) || undefined,
      reviewDate: (formData.get("reviewDate") as string) || undefined,
    });
    revalidatePath("/controls");
    revalidatePath(`/controls/${id}`);
    redirect(`/controls/${id}`);
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Delete ──────────────────────────────────────────────────────────────────

export async function deleteControlAction(id: string): Promise<ControlState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.deleteControl(session.org.id, session.id, id);
    revalidatePath("/controls");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Compute Health ──────────────────────────────────────────────────────────

export async function computeHealthAction(controlId: string): Promise<ControlState> {
  const session = await requireUser();
  if (!session.org) return { error: "No org." };

  try {
    const inputs = await repo.getHealthInputs(session.org.id, controlId);
    const breakdown = computeControlHealth(inputs);
    await repo.saveHealthScores(session.org.id, controlId, breakdown.overall, breakdown.overall);
    revalidatePath(`/controls/${controlId}`);
    revalidatePath("/controls");
    return { ok: true, data: breakdown };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

export async function addTestAction(
  _prev: ControlState,
  formData: FormData
): Promise<ControlState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const controlId = String(formData.get("controlId") || "");
  try {
    await svc.addTest({
      orgId: session.org.id,
      actorId: session.id,
      controlId,
      testDate: String(formData.get("testDate") || new Date().toISOString().slice(0, 10)),
      result: String(formData.get("result") || "not_tested"),
      testerName: (formData.get("testerName") as string) || undefined,
      method: (formData.get("method") as string) || undefined,
      evidenceRef: (formData.get("evidenceRef") as string) || undefined,
      comments: (formData.get("comments") as string) || undefined,
    });
    revalidatePath(`/controls/${controlId}`);
    revalidatePath("/controls/testing");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function deleteTestAction(testId: string, controlId: string): Promise<ControlState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.removeTest(session.org.id, session.id, testId);
    revalidatePath(`/controls/${controlId}`);
    revalidatePath("/controls/testing");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── AI ───────────────────────────────────────────────────────────────────────

export async function generateNarrativeAction(controlId: string): Promise<ControlState> {
  const session = await requireUser();
  if (!session.org) return { error: "No org." };

  try {
    const control = await repo.findControlById(session.org.id, controlId);
    if (!control) return { error: "Control not found." };
    const inputs = await repo.getHealthInputs(session.org.id, controlId);
    const health = computeControlHealth(inputs);
    const narrative = await aiSvc.generateControlNarrative(session.org.id, control, health);
    return { ok: true, data: narrative };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function generateExecutiveSummaryAction(): Promise<ControlState> {
  const session = await requireUser();
  if (!session.org) return { error: "No org." };

  try {
    const metrics = await repo.getDashboardMetrics(session.org.id);
    const text = await aiSvc.generateExecutiveSummary(session.org.id, metrics);
    return { ok: true, data: text };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function chatAction(
  messages: { role: "user" | "model"; text: string }[]
): Promise<ControlState> {
  const session = await requireUser();
  if (!session.org) return { error: "No org." };

  try {
    const controls = await repo.findAllControls(session.org.id);
    const reply = await aiSvc.chat(session.org.id, messages, controls);
    return { ok: true, data: reply };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}
