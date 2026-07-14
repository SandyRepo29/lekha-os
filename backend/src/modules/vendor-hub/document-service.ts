import { db } from "@/lib/db";
import type { VendorDocument } from "@/lib/db/schema";
import { DomainError } from "@/lib/services/errors";
import * as documentRepo from "@/backend/src/modules/vendor-hub/document-repo";
import * as vendorRepo from "@/backend/src/modules/vendor-hub/vendor-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";
import { removeObjects } from "@/lib/storage/server";
import { recomputeVendorScore, computeDocStatus } from "./vendor-service";
import { extractDocument } from "./extraction-service";

/**
 * Records a document whose file the client has already uploaded to Storage.
 * Inserts the row + audit atomically, then runs AI extraction (which also
 * recomputes the vendor's score).
 */
export async function registerDocument(params: {
  orgId: string;
  actorId: string;
  vendorId: string;
  documentType: string;
  storagePath: string;
  fileName: string;
}): Promise<{ id: string }> {
  const vendor = await vendorRepo.findById(params.orgId, params.vendorId);
  if (!vendor) throw new DomainError("Vendor not found.");

  const doc = await db.transaction(async (tx) => {
    const d = await documentRepo.insertDocument(
      {
        organizationId: params.orgId,
        vendorId: params.vendorId,
        documentType: params.documentType,
        storagePath: params.storagePath,
        status: "valid",
      },
      tx
    );
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "document.uploaded",
        entityType: "vendor_document",
        entityId: d.id,
        metadata: {
          vendorId: params.vendorId,
          documentType: params.documentType,
          fileName: params.fileName,
        },
      },
      tx
    );
    return d;
  });

  await extractDocument({
    orgId: params.orgId,
    vendorId: params.vendorId,
    documentId: doc.id,
    storagePath: params.storagePath,
  });

  return doc;
}

export async function listForVendor(orgId: string, vendorId: string): Promise<VendorDocument[]> {
  return documentRepo.listByVendor(orgId, vendorId);
}

export async function updateDocumentFields(params: {
  orgId: string; actorId: string; documentId: string;
  documentType: string; issuedOn: string | null; expiresOn: string | null;
}): Promise<{ vendorId: string }> {
  const doc = await documentRepo.getById(params.orgId, params.documentId);
  if (!doc) throw new DomainError("Document not found.");

  const status = computeDocStatus(params.expiresOn);
  await documentRepo.updateDocumentFields(
    params.orgId, params.documentId,
    { documentType: params.documentType.trim() || doc.documentType, issuedOn: params.issuedOn, expiresOn: params.expiresOn, status }
  );
  await recomputeVendorScore(params.orgId, doc.vendorId);
  return { vendorId: doc.vendorId };
}

/** Re-run AI extraction for an existing document. */
export async function reextractDocument(
  orgId: string,
  documentId: string
): Promise<{ vendorId: string }> {
  const doc = await documentRepo.getById(orgId, documentId);
  if (!doc) throw new DomainError("Document not found.");
  if (!doc.storagePath) throw new DomainError("No file to extract.");

  await extractDocument({
    orgId,
    vendorId: doc.vendorId,
    documentId: doc.id,
    storagePath: doc.storagePath,
  });
  return { vendorId: doc.vendorId };
}

/** Delete a document: remove the stored file, the row + audit, then rescoring. */
export async function deleteDocument(params: {
  orgId: string;
  actorId: string;
  documentId: string;
}): Promise<{ vendorId: string }> {
  const doc = await documentRepo.getById(params.orgId, params.documentId);
  if (!doc) throw new DomainError("Document not found.");

  if (doc.storagePath) await removeObjects([doc.storagePath]);

  await db.transaction(async (tx) => {
    await documentRepo.deleteById(params.orgId, params.documentId, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "document.deleted",
        entityType: "vendor_document",
        entityId: params.documentId,
        metadata: { vendorId: doc.vendorId, documentType: doc.documentType },
      },
      tx
    );
  });

  await recomputeVendorScore(params.orgId, doc.vendorId);
  return { vendorId: doc.vendorId };
}

/** Remove all stored files for a vendor (called before deleting the vendor). */
export async function purgeVendorStorage(orgId: string, vendorId: string): Promise<void> {
  const docs = await documentRepo.listByVendor(orgId, vendorId);
  const paths = docs.map((d) => d.storagePath).filter((p): p is string => !!p);
  await removeObjects(paths);
}
