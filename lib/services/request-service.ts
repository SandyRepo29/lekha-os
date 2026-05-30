import { db } from "@/lib/db";
import { DomainError } from "./errors";
import * as requestRepo from "@/lib/repositories/request-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";
import type { DocumentRequest } from "@/lib/db/schema";

export type { DocumentRequest };

const VALID_STATUSES = ["requested", "submitted", "approved", "rejected", "expired"] as const;
type Status = typeof VALID_STATUSES[number];

export async function createRequest(params: {
  orgId: string;
  actorId: string;
  vendorId: string;
  documentType: string;
  message?: string | null;
  dueDate?: string | null;
  priority?: string;
}): Promise<{ id: string }> {
  if (!params.documentType?.trim()) throw new DomainError("Document type is required.");

  return db.transaction(async (tx) => {
    const req = await requestRepo.insertRequest({
      organizationId: params.orgId,
      vendorId: params.vendorId,
      documentType: params.documentType.trim(),
      message: params.message?.trim() || null,
      dueDate: params.dueDate || null,
      priority: params.priority || "medium",
      requestedBy: params.actorId,
    }, tx);

    await recordAudit({
      organizationId: params.orgId, actorId: params.actorId,
      action: "document_request.created", entityType: "document_request", entityId: req.id,
      metadata: { vendorId: params.vendorId, documentType: params.documentType },
    }, tx);

    return req;
  });
}

export async function updateRequestStatus(params: {
  orgId: string; actorId: string; requestId: string; status: string;
}): Promise<void> {
  if (!VALID_STATUSES.includes(params.status as Status)) throw new DomainError("Invalid status.");
  const req = await requestRepo.getById(params.orgId, params.requestId);
  if (!req) throw new DomainError("Request not found.");

  await db.transaction(async (tx) => {
    await requestRepo.updateStatus(params.requestId, params.status as Status, tx);
    await recordAudit({
      organizationId: params.orgId, actorId: params.actorId,
      action: "document_request.status_changed", entityType: "document_request", entityId: params.requestId,
      metadata: { from: req.status, to: params.status },
    }, tx);
  });
}

export async function listRequests(orgId: string, vendorId: string): Promise<DocumentRequest[]> {
  return requestRepo.listByVendor(orgId, vendorId);
}
