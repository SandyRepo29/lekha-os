"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import * as svc from "@/backend/src/modules/privacy/privacy-service";
import * as aiSvc from "@/backend/src/modules/privacy/ai-privacy-service";

export type PrivacyState = { error?: string; ok?: boolean; data?: unknown } | undefined;

// ── Data Assets ──────────────────────────────────────────────────────────────

export async function createAssetAction(
  _prev: PrivacyState,
  formData: FormData
): Promise<PrivacyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const asset = await svc.createAsset(session.org.id, session.id, {
      name: String(formData.get("name") || ""),
      description: (formData.get("description") as string) || undefined,
      ownerId: (formData.get("ownerId") as string) || undefined,
      department: (formData.get("department") as string) || undefined,
      dataCategory: (formData.get("dataCategory") as string) || undefined,
      sensitivity: (formData.get("sensitivity") as string) || undefined,
      purpose: (formData.get("purpose") as string) || undefined,
      storageLocation: (formData.get("storageLocation") as string) || undefined,
      retentionPeriod: formData.get("retentionPeriod")
        ? Number(formData.get("retentionPeriod"))
        : undefined,
      crossBorder: formData.get("crossBorder") === "true",
    });
    revalidatePath("/dpdp-privacy");
    revalidatePath("/dpdp-privacy/inventory");
    redirect(`/dpdp-privacy/inventory/${asset.id}`);
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function updateAssetAction(
  _prev: PrivacyState,
  formData: FormData
): Promise<PrivacyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const id = String(formData.get("id") || "");
  try {
    await svc.updateAsset(session.org.id, session.id, id, {
      name: (formData.get("name") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      ownerId: (formData.get("ownerId") as string) || undefined,
      department: (formData.get("department") as string) || undefined,
      dataCategory: (formData.get("dataCategory") as string) || undefined,
      sensitivity: (formData.get("sensitivity") as string) || undefined,
      purpose: (formData.get("purpose") as string) || undefined,
      storageLocation: (formData.get("storageLocation") as string) || undefined,
      retentionPeriod: formData.get("retentionPeriod")
        ? Number(formData.get("retentionPeriod"))
        : undefined,
      crossBorder:
        formData.get("crossBorder") !== null
          ? formData.get("crossBorder") === "true"
          : undefined,
      status: (formData.get("status") as string) || undefined,
    });
    revalidatePath("/dpdp-privacy");
    revalidatePath("/dpdp-privacy/inventory");
    revalidatePath(`/dpdp-privacy/inventory/${id}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function deleteAssetAction(assetId: string): Promise<PrivacyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.deleteAsset(session.org.id, session.id, assetId);
    revalidatePath("/dpdp-privacy");
    revalidatePath("/dpdp-privacy/inventory");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Consent Records ──────────────────────────────────────────────────────────

export async function createConsentAction(
  _prev: PrivacyState,
  formData: FormData
): Promise<PrivacyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.createConsent(session.org.id, session.id, {
      subjectId: String(formData.get("subjectId") || ""),
      subjectName: (formData.get("subjectName") as string) || undefined,
      subjectEmail: (formData.get("subjectEmail") as string) || undefined,
      purpose: String(formData.get("purpose") || ""),
      consentStatus: (formData.get("consentStatus") as string) || undefined,
      dataAssetId: (formData.get("dataAssetId") as string) || undefined,
      obtainedAt: formData.get("obtainedAt")
        ? new Date(formData.get("obtainedAt") as string)
        : undefined,
      expiresAt: formData.get("expiresAt")
        ? new Date(formData.get("expiresAt") as string)
        : undefined,
      source: (formData.get("source") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });
    revalidatePath("/dpdp-privacy");
    revalidatePath("/dpdp-privacy/consents");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function updateConsentAction(
  id: string,
  status: string
): Promise<PrivacyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const withdrawnAt = status === "withdrawn" ? new Date() : undefined;
    await svc.updateConsent(session.org.id, session.id, id, {
      consentStatus: status,
      withdrawnAt,
    });
    revalidatePath("/dpdp-privacy/consents");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Privacy Requests (DSR) ───────────────────────────────────────────────────

export async function createRequestAction(
  _prev: PrivacyState,
  formData: FormData
): Promise<PrivacyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const request = await svc.createRequest(session.org.id, session.id, {
      requestType: String(formData.get("requestType") || "access"),
      subjectName: String(formData.get("subjectName") || ""),
      subjectEmail: String(formData.get("subjectEmail") || ""),
      description: (formData.get("description") as string) || undefined,
      ownerId: (formData.get("ownerId") as string) || undefined,
    });
    revalidatePath("/dpdp-privacy");
    revalidatePath("/dpdp-privacy/requests");
    redirect(`/dpdp-privacy/requests`);
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function updateRequestAction(
  id: string,
  status: string,
  notes?: string
): Promise<PrivacyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.updateRequestStatus(session.org.id, session.id, id, status, notes);
    revalidatePath("/dpdp-privacy");
    revalidatePath("/dpdp-privacy/requests");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Retention Policies ───────────────────────────────────────────────────────

export async function createRetentionPolicyAction(
  _prev: PrivacyState,
  formData: FormData
): Promise<PrivacyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.createRetentionPolicy(session.org.id, session.id, {
      name: String(formData.get("name") || ""),
      description: (formData.get("description") as string) || undefined,
      dataCategory: (formData.get("dataCategory") as string) || undefined,
      retentionDays: Number(formData.get("retentionDays") || 365),
      legalBasis: (formData.get("legalBasis") as string) || undefined,
      actionOnExpiry: (formData.get("actionOnExpiry") as string) || "delete",
    });
    revalidatePath("/dpdp-privacy/retention");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Privacy Assessments (PIA) ────────────────────────────────────────────────

export async function createAssessmentAction(
  _prev: PrivacyState,
  formData: FormData
): Promise<PrivacyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const assessment = await svc.createAssessment(session.org.id, session.id, {
      title: String(formData.get("title") || ""),
      scope: (formData.get("scope") as string) || undefined,
      ownerId: (formData.get("ownerId") as string) || undefined,
      riskLevel: (formData.get("riskLevel") as string) || undefined,
      purpose: (formData.get("purpose") as string) || undefined,
      dataTypes: (formData.get("dataTypes") as string) || undefined,
    });
    revalidatePath("/dpdp-privacy/assessments");
    redirect(`/dpdp-privacy/assessments/${assessment.id}`);
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function updateAssessmentAction(
  _prev: PrivacyState,
  formData: FormData
): Promise<PrivacyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const id = String(formData.get("id") || "");
  try {
    await svc.updateAssessment(session.org.id, session.id, id, {
      title: (formData.get("title") as string) || undefined,
      scope: (formData.get("scope") as string) || undefined,
      riskLevel: (formData.get("riskLevel") as string) || undefined,
      status: (formData.get("status") as string) || undefined,
      purpose: (formData.get("purpose") as string) || undefined,
      dataTypes: (formData.get("dataTypes") as string) || undefined,
      risks: (formData.get("risks") as string) || undefined,
      mitigations: (formData.get("mitigations") as string) || undefined,
      controls: (formData.get("controls") as string) || undefined,
      residualRisk: (formData.get("residualRisk") as string) || undefined,
    });
    revalidatePath(`/dpdp-privacy/assessments/${id}`);
    revalidatePath("/dpdp-privacy/assessments");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Data Transfers ───────────────────────────────────────────────────────────

export async function createTransferAction(
  _prev: PrivacyState,
  formData: FormData
): Promise<PrivacyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.createTransfer(session.org.id, session.id, {
      dataAssetId: (formData.get("dataAssetId") as string) || undefined,
      destinationCountry: String(formData.get("destinationCountry") || ""),
      recipientName: String(formData.get("recipientName") || ""),
      transferBasis: String(formData.get("transferBasis") || ""),
      riskNotes: (formData.get("riskNotes") as string) || undefined,
      reviewDate: formData.get("reviewDate")
        ? new Date(formData.get("reviewDate") as string)
        : undefined,
    });
    revalidatePath("/dpdp-privacy/transfers");
    revalidatePath("/dpdp-privacy");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

export async function approveTransferAction(transferId: string): Promise<PrivacyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await svc.approveTransfer(session.org.id, session.id, transferId);
    revalidatePath("/dpdp-privacy/transfers");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── Privacy Trust Score ──────────────────────────────────────────────────────

export async function computePrivacyScoreAction(): Promise<PrivacyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const breakdown = await svc.computeAndSavePrivacyScore(session.org.id);
    revalidatePath("/dpdp-privacy");
    return { ok: true, data: breakdown };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    throw err;
  }
}

// ── AI ───────────────────────────────────────────────────────────────────────

export async function generatePrivacySummaryAction(): Promise<PrivacyState> {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };

  try {
    const summary = await aiSvc.generatePrivacySummary(session.org.id);
    return { ok: true, data: summary };
  } catch {
    return { error: "Failed to generate privacy summary." };
  }
}

export async function generatePiaAction(
  _prev: PrivacyState,
  formData: FormData
): Promise<PrivacyState> {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };

  const scope = String(formData.get("scope") || "");
  const purpose = String(formData.get("purpose") || "");
  if (!scope || !purpose) return { error: "Scope and purpose are required." };

  try {
    const pia = await aiSvc.generatePiaFromScope(session.org.id, scope, purpose);
    return { ok: true, data: pia };
  } catch {
    return { error: "Failed to generate PIA." };
  }
}

export async function chatAction(
  messages: Array<{ role: "user" | "model"; content: string }>
): Promise<PrivacyState> {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };

  try {
    const reply = await aiSvc.chat(session.org.id, messages);
    return { ok: true, data: reply };
  } catch {
    return { error: "Failed to get AI response." };
  }
}
