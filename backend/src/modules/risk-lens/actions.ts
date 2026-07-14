"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import * as riskService from "@/backend/src/modules/risk-lens/risk-service";
import * as aiRiskService from "@/backend/src/modules/risk-lens/ai-risk-service";
import type { Risk } from "@/lib/db/schema";

export type RiskState = { error?: string; ok?: boolean; data?: unknown } | undefined;

// ---- Risk CRUD ----

export async function createRiskAction(
  _prev: RiskState,
  formData: FormData
): Promise<RiskState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const impact = parseInt(String(formData.get("impact") || "3"), 10);
    const likelihood = parseInt(String(formData.get("likelihood") || "3"), 10);

    const { id } = await riskService.createRisk({
      orgId: session.org.id,
      actorId: session.id,
      input: {
        title: String(formData.get("title") || ""),
        description: (formData.get("description") as string) || null,
        category: (formData.get("category") as Risk["category"]) || "operational",
        status: (formData.get("status") as Risk["status"]) || "identified",
        ownerId: (formData.get("ownerId") as string) || null,
        source: (formData.get("source") as Risk["source"]) || "manual",
        impact,
        likelihood,
        treatmentStrategy: (formData.get("treatmentStrategy") as Risk["treatmentStrategy"]) || "mitigate",
        targetDate: (formData.get("targetDate") as string) || null,
        identifiedDate: (formData.get("identifiedDate") as string) || null,
        nextReviewDate: (formData.get("nextReviewDate") as string) || null,
        sourceVendorId: (formData.get("sourceVendorId") as string) || null,
        sourceFindingId: (formData.get("sourceFindingId") as string) || null,
      },
    });
    revalidatePath("/risks");
    redirect(`/risks/${id}`);
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function updateRiskAction(
  riskId: string,
  formData: FormData
): Promise<RiskState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const impact = parseInt(String(formData.get("impact") || "3"), 10);
    const likelihood = parseInt(String(formData.get("likelihood") || "3"), 10);

    await riskService.updateRisk({
      orgId: session.org.id,
      actorId: session.id,
      riskId,
      input: {
        title: String(formData.get("title") || ""),
        description: (formData.get("description") as string) || null,
        category: (formData.get("category") as Risk["category"]) || undefined,
        status: (formData.get("status") as Risk["status"]) || undefined,
        ownerId: (formData.get("ownerId") as string) || null,
        impact,
        likelihood,
        treatmentStrategy: (formData.get("treatmentStrategy") as Risk["treatmentStrategy"]) || undefined,
        targetDate: (formData.get("targetDate") as string) || null,
        nextReviewDate: (formData.get("nextReviewDate") as string) || null,
      },
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not update risk." };
  }
  revalidatePath("/risks");
  revalidatePath(`/risks/${riskId}`);
  return { ok: true };
}

export async function updateRiskStatusAction(
  riskId: string,
  status: Risk["status"]
): Promise<RiskState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await riskService.updateRiskStatus({
      orgId: session.org.id,
      actorId: session.id,
      riskId,
      status,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not update status." };
  }
  revalidatePath("/risks");
  revalidatePath(`/risks/${riskId}`);
  return { ok: true };
}

export async function deleteRiskAction(riskId: string): Promise<RiskState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await riskService.deleteRisk({
      orgId: session.org.id,
      actorId: session.id,
      riskId,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not delete risk." };
  }
  revalidatePath("/risks");
  redirect("/risks/list");
}

// ---- Reviews ----

export async function addReviewAction(
  riskId: string,
  formData: FormData
): Promise<RiskState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await riskService.addReview({
      orgId: session.org.id,
      actorId: session.id,
      riskId,
      input: {
        reviewDate: String(formData.get("reviewDate") || new Date().toISOString().slice(0, 10)),
        outcome: String(formData.get("outcome") || "no_change"),
        notes: (formData.get("notes") as string) || null,
        newStatus: (formData.get("newStatus") as Risk["status"]) || null,
      },
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not add review." };
  }
  revalidatePath(`/risks/${riskId}`);
  return { ok: true };
}

// ---- Treatments ----

export async function addTreatmentAction(
  riskId: string,
  formData: FormData
): Promise<RiskState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await riskService.addTreatment({
      orgId: session.org.id,
      actorId: session.id,
      riskId,
      input: {
        action: String(formData.get("action") || ""),
        description: (formData.get("description") as string) || null,
        ownerId: (formData.get("ownerId") as string) || null,
        targetDate: (formData.get("targetDate") as string) || null,
      },
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not add treatment." };
  }
  revalidatePath(`/risks/${riskId}`);
  return { ok: true };
}

export async function completeTreatmentAction(
  riskId: string,
  treatmentId: string
): Promise<RiskState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await riskService.completeTreatment({
      orgId: session.org.id,
      actorId: session.id,
      riskId,
      treatmentId,
    });
  } catch (err) {
    return { error: "Could not complete treatment." };
  }
  revalidatePath(`/risks/${riskId}`);
  return { ok: true };
}

// ---- AI ----

export async function generateRiskNarrativeAction(riskId: string): Promise<RiskState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const content = await aiRiskService.generateRiskNarrative(session.org.id, riskId);
    revalidatePath(`/risks/${riskId}`);
    return { ok: true, data: content };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "AI generation failed." };
  }
}

export async function generateRiskFromObservationAction(
  observation: string
): Promise<RiskState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const data = await aiRiskService.generateRiskFromObservation(observation);
    return { ok: true, data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "AI generation failed." };
  }
}

export async function generateMitigationsAction(riskId: string): Promise<RiskState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const data = await aiRiskService.generateMitigationRecommendations(session.org.id, riskId);
    return { ok: true, data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "AI generation failed." };
  }
}

export async function generateExecutiveSummaryAction(): Promise<RiskState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const content = await aiRiskService.generateExecutiveSummary(session.org.id);
    return { ok: true, data: content };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "AI generation failed." };
  }
}

export async function riskAiChatAction(
  message: string,
  history: { role: "user" | "model"; text: string }[]
): Promise<{ reply: string; error?: string }> {
  const session = await requireUser();
  if (session.demo || !session.org) return { reply: "", error: "Not available in demo mode." };

  try {
    const reply = await aiRiskService.chat(session.org.id, message, history);
    return { reply };
  } catch (err) {
    return { reply: "", error: err instanceof Error ? err.message : "Chat failed." };
  }
}
