import { isGeminiConfigured, extractDocumentFields, EXTRACTABLE_TYPES } from "@/lib/ai/gemini";
import { downloadObject } from "@/lib/storage/server";
import * as documentRepo from "@/backend/src/modules/vendor-hub/document-repo";
import { computeDocStatus, recomputeVendorScore } from "./vendor-service";

/**
 * Extract structured fields from an uploaded document (v2) and update its row,
 * then recompute the vendor's compliance score.
 *
 * New in v2: category classification + richer metadata (certificationNumber,
 * standardVersion, certificationScope, certificationBody, applicableRegions).
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
          // Store all rich metadata in the extracted JSONB
          extracted: {
            issuer:              ex.issuer,
            summary:             ex.summary,
            source:              "gemini-v2",
            certificationNumber: ex.certificationNumber,
            standardVersion:     ex.standardVersion,
            certificationScope:  ex.certificationScope,
            certificationBody:   ex.certificationBody,
            applicableRegions:   ex.applicableRegions,
          },
        };

        if (ex.documentType) patch.documentType = ex.documentType;
        if (ex.category)     patch.category = ex.category;

        await documentRepo.updateExtraction(params.documentId, patch);
      }
    } catch (err) {
      console.error("extractDocument failed:", err);
    }
  }

  await recomputeVendorScore(params.orgId, params.vendorId);
}
