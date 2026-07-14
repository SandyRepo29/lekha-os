"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import * as frameworkService from "@/backend/src/modules/compliance/framework-service";
import { FRAMEWORK_TEMPLATE_MAP } from "@/lib/constants/compliance-framework-templates";
import * as controlService from "@/backend/src/modules/compliance/control-service";
import * as evidenceService from "@/backend/src/modules/compliance/evidence-service";
import * as policyService from "@/backend/src/modules/compliance/policy-service";
import * as gapService from "@/backend/src/modules/compliance/gap-service";
import * as aiService from "@/backend/src/modules/compliance/ai-compliance-service";

export type ComplianceState = { error?: string; ok?: boolean } | undefined;

// ---- Frameworks ---------------------------------------------

export async function createFrameworkAction(
  _prev: ComplianceState,
  formData: FormData
): Promise<ComplianceState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const templateKey = String(formData.get("templateKey") || "");
    const template = FRAMEWORK_TEMPLATE_MAP.get(templateKey);

    const { id } = await frameworkService.createFramework({
      orgId: session.org.id,
      actorId: session.id,
      input: {
        name: String(formData.get("name") || ""),
        description: String(formData.get("description") || "") || null,
        version: String(formData.get("version") || "") || null,
        owner: String(formData.get("owner") || "") || null,
        reviewDate: String(formData.get("reviewDate") || "") || null,
      },
    });

    // Auto-seed controls if a built-in template was selected
    if (template) {
      await frameworkService.seedFrameworkControls(session.org.id, id, templateKey);
    }

    revalidatePath("/compliance");
    revalidatePath("/compliance/frameworks");
    redirect(`/compliance/frameworks/${id}`);
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    // redirect() throws — rethrow it
    throw err;
  }
}

export async function updateFrameworkStatusAction(
  frameworkId: string,
  status: "not_started" | "in_progress" | "ready" | "certified" | "expired"
): Promise<ComplianceState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available." };
  try {
    await frameworkService.updateFramework({
      orgId: session.org.id,
      actorId: session.id,
      frameworkId,
      input: { status },
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not update framework." };
  }
  revalidatePath("/compliance");
  revalidatePath(`/compliance/frameworks/${frameworkId}`);
  return { ok: true };
}

export async function deleteFrameworkAction(
  frameworkId: string
): Promise<ComplianceState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available." };
  try {
    await frameworkService.deleteFramework({
      orgId: session.org.id,
      actorId: session.id,
      frameworkId,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not delete framework." };
  }
  revalidatePath("/compliance");
  revalidatePath("/compliance/frameworks");
  redirect("/compliance/frameworks");
}

// ---- Controls -----------------------------------------------

export async function createControlAction(
  _prev: ComplianceState,
  formData: FormData
): Promise<ComplianceState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const frameworkId = String(formData.get("frameworkId") || "");
  try {
    await controlService.createControl({
      orgId: session.org.id,
      actorId: session.id,
      frameworkId,
      input: {
        controlRef: String(formData.get("controlRef") || ""),
        name: String(formData.get("name") || ""),
        description: String(formData.get("description") || "") || null,
        category: String(formData.get("category") || "") || null,
        owner: String(formData.get("owner") || "") || null,
        status: (formData.get("status") as "not_implemented") ?? "not_implemented",
        priority: (formData.get("priority") as "medium") ?? "medium",
        reviewDate: String(formData.get("reviewDate") || "") || null,
      },
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not create control." };
  }
  revalidatePath(`/compliance/frameworks/${frameworkId}`);
  redirect(`/compliance/frameworks/${frameworkId}`);
}

export async function updateControlStatusAction(
  controlId: string,
  frameworkId: string,
  status: "implemented" | "partial" | "not_implemented" | "not_applicable"
): Promise<ComplianceState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available." };
  try {
    await controlService.updateControlStatus({
      orgId: session.org.id,
      actorId: session.id,
      controlId,
      status,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not update control." };
  }
  revalidatePath(`/compliance/frameworks/${frameworkId}`);
  return { ok: true };
}

export async function deleteControlAction(
  controlId: string,
  frameworkId: string
): Promise<ComplianceState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available." };
  try {
    await controlService.deleteControl({
      orgId: session.org.id,
      actorId: session.id,
      controlId,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not delete control." };
  }
  revalidatePath(`/compliance/frameworks/${frameworkId}`);
  return { ok: true };
}

// ---- Evidence -----------------------------------------------

export async function createEvidenceAction(
  _prev: ComplianceState,
  formData: FormData
): Promise<ComplianceState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const { id } = await evidenceService.createEvidence({
      orgId: session.org.id,
      actorId: session.id,
      input: {
        title: String(formData.get("title") || ""),
        description: String(formData.get("description") || "") || null,
        source: (formData.get("source") as "manual") ?? "manual",
        owner: String(formData.get("owner") || "") || null,
        expiresOn: String(formData.get("expiresOn") || "") || null,
      },
    });
    revalidatePath("/compliance/evidence");
    redirect(`/compliance/evidence/${id}`);
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function updateEvidenceStatusAction(
  evidenceId: string,
  status: "draft" | "pending_review" | "approved" | "expired" | "archived"
): Promise<ComplianceState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available." };
  try {
    await evidenceService.updateEvidenceStatus({
      orgId: session.org.id,
      actorId: session.id,
      evidenceId,
      status,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not update evidence." };
  }
  revalidatePath("/compliance/evidence");
  revalidatePath(`/compliance/evidence/${evidenceId}`);
  return { ok: true };
}

export async function deleteEvidenceAction(
  evidenceId: string
): Promise<ComplianceState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available." };
  try {
    await evidenceService.deleteEvidence({
      orgId: session.org.id,
      actorId: session.id,
      evidenceId,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not delete evidence." };
  }
  revalidatePath("/compliance/evidence");
  redirect("/compliance/evidence");
}

export async function autoImportFromVendorsAction(): Promise<{
  imported?: number;
  error?: string;
}> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    const { imported } = await evidenceService.autoImportFromVendors({
      orgId: session.org.id,
      actorId: session.id,
    });
    revalidatePath("/compliance/evidence");
    revalidatePath("/compliance");
    return { imported };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Auto-import failed." };
  }
}

export async function mapEvidenceToControlAction(
  evidenceId: string,
  controlId: string
): Promise<ComplianceState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available." };
  try {
    await evidenceService.mapEvidenceToControl({
      orgId: session.org.id,
      actorId: session.id,
      evidenceId,
      controlId,
      mappingType: "manual",
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not map evidence." };
  }
  revalidatePath(`/compliance/evidence/${evidenceId}`);
  return { ok: true };
}

export async function unmapEvidenceFromControlAction(
  evidenceId: string,
  controlId: string
): Promise<ComplianceState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available." };
  try {
    await evidenceService.unmapEvidenceFromControl({
      orgId: session.org.id,
      actorId: session.id,
      evidenceId,
      controlId,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not unmap evidence." };
  }
  revalidatePath(`/compliance/evidence/${evidenceId}`);
  return { ok: true };
}

// ---- Policies -----------------------------------------------

export async function createPolicyAction(
  _prev: ComplianceState,
  formData: FormData
): Promise<ComplianceState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    const { id } = await policyService.createPolicy({
      orgId: session.org.id,
      actorId: session.id,
      input: {
        name: String(formData.get("name") || ""),
        policyType: String(formData.get("policyType") || "") || null,
        owner: String(formData.get("owner") || "") || null,
        reviewDate: String(formData.get("reviewDate") || "") || null,
      },
    });
    revalidatePath("/compliance/policies");
    redirect(`/compliance/policies/${id}`);
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function updatePolicyStatusAction(
  policyId: string,
  status: "draft" | "review" | "approved" | "archived" | "expired",
  approver?: string
): Promise<ComplianceState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available." };
  try {
    await policyService.updatePolicy({
      orgId: session.org.id,
      actorId: session.id,
      policyId,
      input: {
        status,
        approver: approver || null,
        approvalDate: status === "approved" ? new Date().toISOString().split("T")[0] : null,
      },
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not update policy." };
  }
  revalidatePath("/compliance/policies");
  revalidatePath(`/compliance/policies/${policyId}`);
  revalidatePath("/compliance");
  return { ok: true };
}

export async function deletePolicyAction(policyId: string): Promise<ComplianceState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available." };
  try {
    await policyService.deletePolicy({
      orgId: session.org.id,
      actorId: session.id,
      policyId,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not delete policy." };
  }
  revalidatePath("/compliance/policies");
  revalidatePath("/compliance");
  redirect("/compliance/policies");
}

// ---- Gaps ---------------------------------------------------

export async function resolveGapAction(gapId: string): Promise<ComplianceState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available." };
  try {
    await gapService.resolveGap({
      orgId: session.org.id,
      actorId: session.id,
      gapId,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not resolve gap." };
  }
  revalidatePath("/compliance/gaps");
  revalidatePath("/compliance");
  return { ok: true };
}

// ---- AI Compliance Officer ----------------------------------

export async function generateFrameworkSummaryAction(
  frameworkId: string
): Promise<{ content?: string; error?: string }> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    const content = await aiService.generateFrameworkSummary(session.org.id, frameworkId);
    revalidatePath(`/compliance/frameworks/${frameworkId}`);
    revalidatePath("/compliance/ai");
    return { content };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: (err as Error).message ?? "AI generation failed." };
  }
}

export async function generateReadinessExplanationAction(
  frameworkId: string
): Promise<{ content?: string; error?: string }> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    const content = await aiService.explainReadiness(session.org.id, frameworkId);
    revalidatePath(`/compliance/frameworks/${frameworkId}`);
    revalidatePath("/compliance/ai");
    return { content };
  } catch (err) {
    return { error: (err as Error).message ?? "AI generation failed." };
  }
}

export async function generateGapNarrativeAction(
  frameworkId: string
): Promise<{ content?: string; error?: string }> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    const content = await aiService.generateGapNarrative(session.org.id, frameworkId);
    revalidatePath("/compliance/ai");
    return { content };
  } catch (err) {
    return { error: (err as Error).message ?? "AI generation failed." };
  }
}

export async function generateExecutiveSummaryAction(): Promise<{
  content?: string;
  error?: string;
}> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    const content = await aiService.generateExecutiveSummary(session.org.id);
    revalidatePath("/compliance/ai");
    revalidatePath("/compliance");
    return { content };
  } catch (err) {
    return { error: (err as Error).message ?? "AI generation failed." };
  }
}

export async function complianceChatAction(
  message: string,
  history: { role: "user" | "model"; text: string }[]
): Promise<{ response?: string; error?: string }> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  if (!message.trim()) return { error: "Message is required." };
  try {
    const response = await aiService.chat(session.org.id, message, history);
    return { response };
  } catch (err) {
    return { error: (err as Error).message ?? "Chat failed." };
  }
}

// ---- Gap analysis -------------------------------------------

export async function runGapAnalysisAction(
  frameworkId: string
): Promise<{ detected?: number; error?: string }> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available." };
  try {
    const { detected } = await gapService.runGapAnalysis({
      orgId: session.org.id,
      actorId: session.id,
      frameworkId,
    });
    revalidatePath(`/compliance/frameworks/${frameworkId}`);
    revalidatePath("/compliance");
    return { detected };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Gap analysis failed." };
  }
}
