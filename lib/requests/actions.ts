"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import * as requestService from "@/lib/services/request-service";

export type RequestState = { error?: string; ok?: boolean } | undefined;

export async function createDocumentRequest(_prev: RequestState, formData: FormData): Promise<RequestState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const vendorId = String(formData.get("vendorId") || "");
  if (!vendorId) return { error: "Missing vendor." };

  try {
    await requestService.createRequest({
      orgId: session.org.id, actorId: session.id, vendorId,
      documentType: String(formData.get("documentType") || ""),
      message: String(formData.get("message") || ""),
      dueDate: String(formData.get("dueDate") || "") || null,
      priority: String(formData.get("priority") || "medium"),
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not create request." };
  }

  revalidatePath(`/vendors/${vendorId}`);
  return { ok: true };
}

export async function updateRequestStatus(requestId: string, vendorId: string, status: string): Promise<RequestState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available." };

  try {
    await requestService.updateRequestStatus({ orgId: session.org.id, actorId: session.id, requestId, status });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not update status." };
  }

  revalidatePath(`/vendors/${vendorId}`);
  return { ok: true };
}
