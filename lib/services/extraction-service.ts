import { isGeminiConfigured, extractDocumentFields, EXTRACTABLE_TYPES } from "@/lib/ai/gemini";
import { downloadObject } from "@/lib/storage/server";
import * as documentRepo from "@/lib/repositories/document-repo";
import { computeDocStatus, recomputeVendorScore } from "./vendor-service";

/**
 * Extract structured fields from an uploaded document and update its row,
 * then recompute the vendor's compliance score.
 *
 * Runs inline after upload today. This is the unit that lifts out into an
 * async worker/queue later (it already has no Next.js coupling beyond the
 * storage adapter). Extraction failures never block the upload.
 */
export async function extractDocument(params: {
  orgId: string;
  vendorId: string;
  documentId: string;
  storagePath: string;
}): Promise<void> {
  if (isGeminiConfigured()) {
    try {
      const file = await downloadObject(params.storagePath);
      if (file && EXTRACTABLE_TYPES.has(file.mimeType)) {
        const ex = await extractDocumentFields({ bytes: file.bytes, mimeType: file.mimeType });

        const patch: Parameters<typeof documentRepo.updateExtraction>[1] = {
          issuedOn: ex.issuedOn,
          expiresOn: ex.expiresOn,
          status: computeDocStatus(ex.expiresOn),
          extracted: { issuer: ex.issuer, summary: ex.summary, source: "gemini" },
        };
        if (ex.documentType) patch.documentType = ex.documentType;

        await documentRepo.updateExtraction(params.documentId, patch);
      }
    } catch (err) {
      console.error("extractDocument failed:", err);
    }
  }

  await recomputeVendorScore(params.orgId, params.vendorId);
}
