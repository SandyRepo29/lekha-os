"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import * as svc from "@/backend/src/modules/policy-governance/policy-governance-service";
import * as aiSvc from "@/backend/src/modules/policy-governance/ai-policy-service";

export type PolicyState = { error?: string; ok?: boolean; data?: unknown } | undefined;

// ── Create ──────────────────────────────────────────────────────────────────

export async function createPolicyAction(
  _prev: PolicyState,
  formData: FormData
): Promise<PolicyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const policy = await svc.createPolicy(session.org.id, session.id, {
      name: String(formData.get("name") || ""),
      description: (formData.get("description") as string) || undefined,
      policyType: (formData.get("policyType") as string) || undefined,
      version: (formData.get("version") as string) || "1.0",
      owner: (formData.get("owner") as string) || undefined,
      ownerId: (formData.get("ownerId") as string) || undefined,
      effectiveDate: (formData.get("effectiveDate") as string) || undefined,
      nextReviewDate: (formData.get("nextReviewDate") as string) || undefined,
      attestationRequired: formData.get("attestationRequired") === "true",
      audience: (formData.get("audience") as string) || "everyone",
    });
    revalidatePath("/policy-governance");
    redirect(`/policy-governance/${policy.id}`);
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Update ──────────────────────────────────────────────────────────────────

export async function updatePolicyAction(
  _prev: PolicyState,
  formData: FormData
): Promise<PolicyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const id = String(formData.get("id") || "");
  try {
    await svc.updatePolicy(session.org.id, session.id, id, {
      name: (formData.get("name") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      policyType: (formData.get("policyType") as string) || undefined,
      version: (formData.get("version") as string) || undefined,
      owner: (formData.get("owner") as string) || undefined,
      ownerId: (formData.get("ownerId") as string) || undefined,
      effectiveDate: (formData.get("effectiveDate") as string) || undefined,
      nextReviewDate: (formData.get("nextReviewDate") as string) || undefined,
      reviewDate: (formData.get("reviewDate") as string) || undefined,
      attestationRequired: formData.get("attestationRequired") === "true",
      audience: (formData.get("audience") as string) || undefined,
      changeSummary: (formData.get("changeSummary") as string) || undefined,
    });
    revalidatePath("/policy-governance");
    revalidatePath(`/policy-governance/${id}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Delete ──────────────────────────────────────────────────────────────────

export async function deletePolicyAction(policyId: string): Promise<PolicyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.deletePolicy(session.org.id, session.id, policyId);
    revalidatePath("/policy-governance");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Review ──────────────────────────────────────────────────────────────────

export async function addReviewAction(
  _prev: PolicyState,
  formData: FormData
): Promise<PolicyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const policyId = String(formData.get("policyId") || "");
  try {
    await svc.addReview(session.org.id, session.id, policyId, {
      outcome: String(formData.get("outcome") || "approved"),
      notes: (formData.get("notes") as string) || undefined,
      nextReviewDate: (formData.get("nextReviewDate") as string) || undefined,
    });
    revalidatePath(`/policy-governance/${policyId}`);
    revalidatePath("/policy-governance/reviews");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Status Transitions ──────────────────────────────────────────────────────

export async function publishPolicyAction(policyId: string): Promise<PolicyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.publishPolicy(session.org.id, session.id, policyId);
    revalidatePath("/policy-governance");
    revalidatePath(`/policy-governance/${policyId}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function retirePolicyAction(policyId: string): Promise<PolicyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.retirePolicy(session.org.id, session.id, policyId);
    revalidatePath("/policy-governance");
    revalidatePath(`/policy-governance/${policyId}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Health ──────────────────────────────────────────────────────────────────

export async function computeHealthAction(policyId: string): Promise<PolicyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const breakdown = await svc.computeAndSaveHealth(session.org.id, policyId);
    revalidatePath(`/policy-governance/${policyId}`);
    revalidatePath("/policy-governance");
    return { ok: true, data: breakdown };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Attestations ────────────────────────────────────────────────────────────

export async function assignAttestationsAction(
  _prev: PolicyState,
  formData: FormData
): Promise<PolicyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const policyId = String(formData.get("policyId") || "");
  const userIds = String(formData.get("userIds") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const dueDate = String(formData.get("dueDate") || "");

  try {
    await svc.assignAttestations(session.org.id, policyId, userIds, new Date(dueDate));
    revalidatePath(`/policy-governance/${policyId}`);
    revalidatePath("/policy-governance/attestations");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function acknowledgeAttestationAction(policyId: string): Promise<PolicyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.acknowledgeAttestation(session.org.id, session.id, policyId);
    revalidatePath(`/policy-governance/${policyId}`);
    revalidatePath("/policy-governance/attestations");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function rejectAttestationAction(policyId: string): Promise<PolicyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.rejectAttestation(session.org.id, session.id, policyId);
    revalidatePath(`/policy-governance/${policyId}`);
    revalidatePath("/policy-governance/attestations");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Junctions ───────────────────────────────────────────────────────────────

export async function linkControlAction(policyId: string, controlId: string): Promise<PolicyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.linkControl(session.org.id, policyId, controlId);
    revalidatePath(`/policy-governance/${policyId}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function unlinkControlAction(policyId: string, controlId: string): Promise<PolicyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.unlinkControl(session.org.id, policyId, controlId);
    revalidatePath(`/policy-governance/${policyId}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function linkFrameworkAction(policyId: string, frameworkId: string): Promise<PolicyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.linkFramework(session.org.id, policyId, frameworkId);
    revalidatePath(`/policy-governance/${policyId}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function unlinkFrameworkAction(policyId: string, frameworkId: string): Promise<PolicyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.unlinkFramework(session.org.id, policyId, frameworkId);
    revalidatePath(`/policy-governance/${policyId}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── AI ───────────────────────────────────────────────────────────────────────

export async function draftPolicyAction(
  _prev: PolicyState,
  formData: FormData
): Promise<PolicyState> {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };

  const topic = String(formData.get("topic") || "");
  const context = (formData.get("context") as string) || undefined;
  if (!topic) return { error: "Topic is required." };

  try {
    const draft = await aiSvc.draftPolicy(session.org.id, topic, context);
    return { ok: true, data: draft };
  } catch {
    return { error: "Failed to generate policy draft." };
  }
}

export async function generateGapAnalysisAction(): Promise<PolicyState> {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };

  try {
    const gaps = await aiSvc.generateGapAnalysis(session.org.id);
    return { ok: true, data: gaps };
  } catch {
    return { error: "Failed to run gap analysis." };
  }
}

export async function generateExecutiveSummaryAction(): Promise<PolicyState> {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };

  try {
    const summary = await aiSvc.generateExecutiveSummary(session.org.id);
    return { ok: true, data: summary };
  } catch {
    return { error: "Failed to generate executive summary." };
  }
}

export async function chatAction(
  messages: Array<{ role: "user" | "model"; content: string }>
): Promise<PolicyState> {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };

  try {
    const reply = await aiSvc.chat(session.org.id, messages);
    return { ok: true, data: reply };
  } catch {
    return { error: "Failed to get AI response." };
  }
}
