"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import * as documentService from "@/backend/src/modules/vendor-hub/document-service";

export type DocState = { error?: string; ok?: boolean } | undefined;

/**
 * Transport adapter: the client has already uploaded the file to Storage
 * (under RLS). This records the metadata, audits, and rescoring the vendor.
 */
export async function registerDocument(
  _prev: DocState,
  formData: FormData
): Promise<DocState> {
  const session = await requireUser();
  if (session.demo) return { error: "Connect Supabase to upload documents." };
  if (!session.org) return { error: "No active organization." };

  const vendorId = String(formData.get("vendorId") || "");
  const storagePath = String(formData.get("storagePath") || "");
  const fileName = String(formData.get("fileName") || "");
  const documentType = String(formData.get("documentType") || "").trim() || "Document";

  if (!vendorId || !storagePath) return { error: "Missing upload data." };

  try {
    await documentService.registerDocument({
      orgId: session.org.id,
      actorId: session.id,
      vendorId,
      documentType,
      storagePath,
      fileName,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("registerDocument failed:", err);
    return { error: "Could not save the document. Please try again." };
  }

  revalidatePath(`/vendors/${vendorId}`);
  revalidatePath("/vendors");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function reextractDocument(documentId: string): Promise<DocState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const { vendorId } = await documentService.reextractDocument(session.org.id, documentId);
    revalidatePath(`/vendors/${vendorId}`);
    revalidatePath("/vendors");
    revalidatePath("/dashboard");
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("reextractDocument failed:", err);
    return { error: "Could not re-run extraction." };
  }
  return { ok: true };
}

export async function updateDocument(
  _prev: DocState,
  formData: FormData
): Promise<DocState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const documentId = String(formData.get("documentId") || "");
  const documentType = String(formData.get("documentType") || "");
  const issuedOn = String(formData.get("issuedOn") || "") || null;
  const expiresOn = String(formData.get("expiresOn") || "") || null;

  try {
    const { vendorId } = await documentService.updateDocumentFields({
      orgId: session.org.id, actorId: session.id, documentId, documentType, issuedOn, expiresOn,
    });
    revalidatePath(`/vendors/${vendorId}`);
    revalidatePath("/vendors");
    revalidatePath("/dashboard");
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not update document." };
  }
  return { ok: true };
}

export async function deleteDocument(documentId: string): Promise<DocState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const { vendorId } = await documentService.deleteDocument({
      orgId: session.org.id,
      actorId: session.id,
      documentId,
    });
    revalidatePath(`/vendors/${vendorId}`);
    revalidatePath("/vendors");
    revalidatePath("/dashboard");
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("deleteDocument failed:", err);
    return { error: "Could not delete the document." };
  }
  return { ok: true };
}
