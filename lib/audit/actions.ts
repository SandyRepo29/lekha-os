"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import * as auditService from "@/lib/services/audit/audit-service";
import * as findingService from "@/lib/services/audit/finding-service";
import * as capaService from "@/lib/services/audit/capa-service";
import * as aiAuditService from "@/lib/services/audit/ai-audit-service";
import * as programRepo from "@/lib/repositories/audit-program-repo";

export type AuditState = { error?: string; ok?: boolean } | undefined;

// ---- Audit CRUD ----

export async function createAuditAction(
  _prev: AuditState,
  formData: FormData
): Promise<AuditState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const { id } = await auditService.createAudit({
      orgId: session.org.id,
      actorId: session.id,
      input: {
        name: String(formData.get("name") || ""),
        auditType: (formData.get("auditType") as any) || "internal",
        frameworkId: (formData.get("frameworkId") as string) || null,
        scope: (formData.get("scope") as string) || null,
        objective: (formData.get("objective") as string) || null,
        ownerId: (formData.get("ownerId") as string) || null,
        auditorName: (formData.get("auditorName") as string) || null,
        startDate: (formData.get("startDate") as string) || null,
        endDate: (formData.get("endDate") as string) || null,
      },
    });
    revalidatePath("/audits");
    redirect(`/audits/${id}`);
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function updateAuditAction(
  auditId: string,
  formData: FormData
): Promise<AuditState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await auditService.updateAudit({
      orgId: session.org.id,
      actorId: session.id,
      auditId,
      input: {
        name: String(formData.get("name") || ""),
        auditType: (formData.get("auditType") as any) || undefined,
        frameworkId: (formData.get("frameworkId") as string) || null,
        scope: (formData.get("scope") as string) || null,
        objective: (formData.get("objective") as string) || null,
        ownerId: (formData.get("ownerId") as string) || null,
        auditorName: (formData.get("auditorName") as string) || null,
        startDate: (formData.get("startDate") as string) || null,
        endDate: (formData.get("endDate") as string) || null,
      },
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not update audit." };
  }
  revalidatePath("/audits");
  revalidatePath(`/audits/${auditId}`);
  return { ok: true };
}

export async function updateAuditStatusAction(
  auditId: string,
  status: "planned" | "in_progress" | "completed" | "cancelled"
): Promise<AuditState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await auditService.updateAuditStatus({
      orgId: session.org.id,
      actorId: session.id,
      auditId,
      status,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not update status." };
  }
  revalidatePath("/audits");
  revalidatePath(`/audits/${auditId}`);
  return { ok: true };
}

export async function deleteAuditAction(auditId: string): Promise<AuditState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await auditService.deleteAudit({
      orgId: session.org.id,
      actorId: session.id,
      auditId,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not delete audit." };
  }
  revalidatePath("/audits");
  redirect("/audits/list");
}

export async function generateProgramAction(auditId: string, frameworkId: string): Promise<AuditState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await auditService.generateAuditProgram(session.org.id, auditId, frameworkId);
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not generate audit program." };
  }
  revalidatePath(`/audits/${auditId}`);
  return { ok: true };
}

// ---- Audit Program ----

export async function updateProgramItemAction(
  auditId: string,
  programId: string,
  status: "pending" | "reviewed" | "passed" | "failed"
): Promise<AuditState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await programRepo.updateProgram(programId, { status });
  } catch {
    return { error: "Could not update program item." };
  }
  revalidatePath(`/audits/${auditId}`);
  return { ok: true };
}

// ---- Findings ----

export async function createFindingAction(
  _prev: AuditState,
  formData: FormData
): Promise<AuditState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const auditId = String(formData.get("auditId") || "");
  try {
    const { id } = await findingService.createFinding({
      orgId: session.org.id,
      actorId: session.id,
      input: {
        auditId,
        title: String(formData.get("title") || ""),
        description: (formData.get("description") as string) || null,
        severity: (formData.get("severity") as any) || "medium",
        recommendation: (formData.get("recommendation") as string) || null,
        controlId: (formData.get("controlId") as string) || null,
      },
    });
    revalidatePath(`/audits/${auditId}/findings`);
    revalidatePath(`/audits/${auditId}`);
    redirect(`/audits/${auditId}/findings`);
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function updateFindingAction(
  findingId: string,
  auditId: string,
  formData: FormData
): Promise<AuditState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await findingService.updateFinding({
      orgId: session.org.id,
      actorId: session.id,
      findingId,
      input: {
        title: String(formData.get("title") || ""),
        description: (formData.get("description") as string) || null,
        severity: (formData.get("severity") as any) || undefined,
        recommendation: (formData.get("recommendation") as string) || null,
        status: (formData.get("status") as any) || undefined,
      },
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not update finding." };
  }
  revalidatePath(`/audits/${auditId}/findings`);
  revalidatePath(`/audits/${auditId}`);
  return { ok: true };
}

export async function closeFindingAction(
  findingId: string,
  auditId: string
): Promise<AuditState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await findingService.closeFinding({
      orgId: session.org.id,
      actorId: session.id,
      findingId,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not close finding." };
  }
  revalidatePath(`/audits/${auditId}/findings`);
  revalidatePath(`/audits/${auditId}`);
  return { ok: true };
}

// ---- CAPAs ----

export async function createCapaAction(
  _prev: AuditState,
  formData: FormData
): Promise<AuditState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const auditId = String(formData.get("auditId") || "");
  try {
    await capaService.createCapa({
      orgId: session.org.id,
      actorId: session.id,
      input: {
        findingId: String(formData.get("findingId") || ""),
        title: String(formData.get("title") || ""),
        description: (formData.get("description") as string) || null,
        ownerId: (formData.get("ownerId") as string) || null,
        dueDate: (formData.get("dueDate") as string) || null,
      },
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not create CAPA." };
  }
  revalidatePath(`/audits/${auditId}/capas`);
  revalidatePath(`/audits/${auditId}`);
  revalidatePath("/audits/capas");
  return { ok: true };
}

export async function updateCapaAction(
  capaId: string,
  auditId: string,
  formData: FormData
): Promise<AuditState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await capaService.updateCapa({
      orgId: session.org.id,
      actorId: session.id,
      capaId,
      input: {
        title: String(formData.get("title") || ""),
        description: (formData.get("description") as string) || null,
        ownerId: (formData.get("ownerId") as string) || null,
        dueDate: (formData.get("dueDate") as string) || null,
        status: (formData.get("status") as any) || undefined,
      },
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not update CAPA." };
  }
  revalidatePath(`/audits/${auditId}/capas`);
  revalidatePath("/audits/capas");
  return { ok: true };
}

export async function completeCapaAction(
  capaId: string,
  auditId: string,
  completionNotes?: string
): Promise<AuditState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await capaService.completeCorrectiveAction({
      orgId: session.org.id,
      actorId: session.id,
      capaId,
      completionNotes,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not complete CAPA." };
  }
  revalidatePath(`/audits/${auditId}/capas`);
  revalidatePath("/audits/capas");
  return { ok: true };
}

// ---- AI actions ----

export async function generateAuditSummaryAction(auditId: string): Promise<AuditState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await aiAuditService.generateAuditSummary(session.org.id, auditId);
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not generate AI summary." };
  }
  revalidatePath(`/audits/${auditId}`);
  return { ok: true };
}

export async function generateExecutiveReportAction(auditId: string): Promise<AuditState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await aiAuditService.generateExecutiveReport(session.org.id, auditId);
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not generate executive report." };
  }
  revalidatePath(`/audits/${auditId}`);
  return { ok: true };
}

export async function aiChatAction(
  orgId: string,
  message: string,
  history: { role: "user" | "model"; text: string }[]
): Promise<{ reply: string } | { error: string }> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const reply = await aiAuditService.chat(session.org.id, message, history);
    return { reply };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "AI unavailable." };
  }
}

export async function generateFindingFromObservationAction(
  observation: string
): Promise<
  | { title: string; severity: string; description: string; recommendation: string }
  | { error: string }
> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    return await aiAuditService.generateFindingFromObservation(observation);
  } catch {
    return { error: "AI unavailable." };
  }
}

export async function generateCapaSuggestionsAction(
  findingId: string
): Promise<{ suggestions: string[] } | { error: string }> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const suggestions = await aiAuditService.generateCapaSuggestions(
      session.org.id,
      findingId
    );
    return { suggestions };
  } catch {
    return { error: "AI unavailable." };
  }
}
