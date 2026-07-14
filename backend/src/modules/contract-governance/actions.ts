"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import * as svc from "@/backend/src/modules/contract-governance/contract-service";
import * as aiSvc from "@/backend/src/modules/contract-governance/ai-contract-service";

export type ContractState = { error?: string; ok?: boolean; data?: unknown } | undefined;

// ── Create ───────────────────────────────────────────────────────────────────

export async function createContractAction(
  _prev: ContractState,
  formData: FormData
): Promise<ContractState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const contract = await svc.createContract(session.org.id, session.id, {
      title: String(formData.get("title") || ""),
      contractType: (formData.get("contractType") as string) || undefined,
      vendorId: (formData.get("vendorId") as string) || undefined,
      ownerId: (formData.get("ownerId") as string) || undefined,
      effectiveDate: (formData.get("effectiveDate") as string) || undefined,
      expiryDate: (formData.get("expiryDate") as string) || undefined,
      renewalDate: (formData.get("renewalDate") as string) || undefined,
      noticePeriodDays: formData.get("noticePeriodDays") ? Number(formData.get("noticePeriodDays")) : undefined,
      autoRenewal: formData.get("autoRenewal") === "true",
      value: formData.get("value") ? Number(formData.get("value")) : undefined,
      currency: (formData.get("currency") as string) || "USD",
    });
    revalidatePath("/contract-governance");
    redirect(`/contract-governance/${contract.id}`);
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Update ───────────────────────────────────────────────────────────────────

export async function updateContractAction(
  _prev: ContractState,
  formData: FormData
): Promise<ContractState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const id = String(formData.get("id") || "");
  try {
    await svc.updateContract(session.org.id, session.id, id, {
      title: (formData.get("title") as string) || undefined,
      contractType: (formData.get("contractType") as string) || undefined,
      status: (formData.get("status") as string) || undefined,
      vendorId: (formData.get("vendorId") as string) || undefined,
      ownerId: (formData.get("ownerId") as string) || undefined,
      effectiveDate: (formData.get("effectiveDate") as string) || undefined,
      expiryDate: (formData.get("expiryDate") as string) || undefined,
      renewalDate: (formData.get("renewalDate") as string) || undefined,
      noticePeriodDays: formData.get("noticePeriodDays") ? Number(formData.get("noticePeriodDays")) : undefined,
      autoRenewal: formData.get("autoRenewal") === "true",
      value: formData.get("value") ? Number(formData.get("value")) : undefined,
      currency: (formData.get("currency") as string) || undefined,
    });
    revalidatePath("/contract-governance");
    revalidatePath(`/contract-governance/${id}`);
    revalidatePath(`/contract-governance/${id}/edit`);
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
  redirect(`/contract-governance/${id}`);
}

// ── Delete ───────────────────────────────────────────────────────────────────

export async function deleteContractAction(contractId: string): Promise<ContractState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.deleteContract(session.org.id, session.id, contractId);
    revalidatePath("/contract-governance");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Score ────────────────────────────────────────────────────────────────────

export async function computeScoreAction(contractId: string): Promise<ContractState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const breakdown = await svc.computeAndSaveScore(session.org.id, contractId);
    revalidatePath(`/contract-governance/${contractId}`);
    revalidatePath("/contract-governance");
    return { ok: true, data: breakdown };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Clauses ──────────────────────────────────────────────────────────────────

export async function addClauseAction(
  _prev: ContractState,
  formData: FormData
): Promise<ContractState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const contractId = String(formData.get("contractId") || "");
  try {
    const clause = await svc.addClause(session.org.id, contractId, {
      title: String(formData.get("title") || ""),
      category: String(formData.get("category") || "legal"),
      content: String(formData.get("content") || ""),
      riskLevel: (formData.get("riskLevel") as string) || "low",
    });
    revalidatePath(`/contract-governance/${contractId}`);
    return { ok: true, data: clause };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function removeClauseAction(clauseId: string, contractId: string): Promise<ContractState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.removeClause(clauseId);
    revalidatePath(`/contract-governance/${contractId}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Obligations ──────────────────────────────────────────────────────────────

export async function addObligationAction(
  _prev: ContractState,
  formData: FormData
): Promise<ContractState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const contractId = String(formData.get("contractId") || "");
  try {
    const obligation = await svc.addObligation(session.org.id, contractId, {
      title: String(formData.get("title") || ""),
      description: (formData.get("description") as string) || undefined,
      ownerId: (formData.get("ownerId") as string) || undefined,
      dueDate: (formData.get("dueDate") as string) || undefined,
      riskLevel: (formData.get("riskLevel") as string) || "low",
    });
    revalidatePath(`/contract-governance/${contractId}`);
    revalidatePath("/contract-governance/obligations");
    return { ok: true, data: obligation };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function updateObligationAction(
  _prev: ContractState,
  formData: FormData
): Promise<ContractState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const id = String(formData.get("id") || "");
  const contractId = String(formData.get("contractId") || "");
  try {
    await svc.updateObligationStatus(id, {
      title: (formData.get("title") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      dueDate: (formData.get("dueDate") as string) || undefined,
      status: (formData.get("status") as string) || undefined,
      riskLevel: (formData.get("riskLevel") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });
    revalidatePath(`/contract-governance/${contractId}`);
    revalidatePath("/contract-governance/obligations");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function deleteObligationAction(obligationId: string, contractId: string): Promise<ContractState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.deleteObligation(obligationId);
    revalidatePath(`/contract-governance/${contractId}`);
    revalidatePath("/contract-governance/obligations");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function completeObligationAction(obligationId: string, contractId: string): Promise<ContractState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.completeObligation(obligationId);
    revalidatePath(`/contract-governance/${contractId}`);
    revalidatePath("/contract-governance/obligations");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Junctions ────────────────────────────────────────────────────────────────

export async function linkRiskAction(contractId: string, riskId: string): Promise<ContractState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    await svc.linkRisk(session.org.id, contractId, riskId);
    revalidatePath(`/contract-governance/${contractId}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function unlinkRiskAction(contractId: string, riskId: string): Promise<ContractState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    await svc.unlinkRisk(contractId, riskId);
    revalidatePath(`/contract-governance/${contractId}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function linkControlAction(contractId: string, controlId: string): Promise<ContractState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    await svc.linkControl(session.org.id, contractId, controlId);
    revalidatePath(`/contract-governance/${contractId}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function unlinkControlAction(contractId: string, controlId: string): Promise<ContractState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    await svc.unlinkControl(contractId, controlId);
    revalidatePath(`/contract-governance/${contractId}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function linkPolicyAction(contractId: string, policyId: string): Promise<ContractState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    await svc.linkPolicy(session.org.id, contractId, policyId);
    revalidatePath(`/contract-governance/${contractId}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function unlinkPolicyAction(contractId: string, policyId: string): Promise<ContractState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    await svc.unlinkPolicy(contractId, policyId);
    revalidatePath(`/contract-governance/${contractId}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── AI ───────────────────────────────────────────────────────────────────────

export async function extractContractDataAction(
  _prev: ContractState,
  formData: FormData
): Promise<ContractState> {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };

  const text = String(formData.get("contractText") || "");
  if (!text.trim()) return { error: "Contract text is required." };

  try {
    const result = await aiSvc.extractContractData(session.org.id, text);
    return { ok: true, data: result };
  } catch {
    return { error: "Failed to extract contract data." };
  }
}

export async function analyzeClauseAction(
  _prev: ContractState,
  formData: FormData
): Promise<ContractState> {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };

  const content = String(formData.get("clauseContent") || "");
  if (!content.trim()) return { error: "Clause content is required." };

  try {
    const analysis = await aiSvc.analyzeClause(session.org.id, content);
    return { ok: true, data: analysis };
  } catch {
    return { error: "Failed to analyse clause." };
  }
}

export async function generateObligationsAction(contractId: string): Promise<ContractState> {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };

  try {
    const obligations = await aiSvc.generateObligations(session.org.id, contractId);
    return { ok: true, data: obligations };
  } catch {
    return { error: "Failed to generate obligations." };
  }
}

export async function generateRiskAssessmentAction(contractId: string): Promise<ContractState> {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };

  try {
    const assessment = await aiSvc.generateRiskAssessment(session.org.id, contractId);
    return { ok: true, data: assessment };
  } catch {
    return { error: "Failed to generate risk assessment." };
  }
}

export async function generateExecutiveSummaryAction(): Promise<ContractState> {
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
): Promise<ContractState> {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };

  try {
    const reply = await aiSvc.chat(session.org.id, messages);
    return { ok: true, data: reply };
  } catch {
    return { error: "Failed to get AI response." };
  }
}
