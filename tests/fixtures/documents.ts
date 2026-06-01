import type { VendorDocument } from "@/lib/db/schema";

export function makeDocument(overrides: Partial<VendorDocument> = {}): VendorDocument {
  return {
    id:             "doc-test-id",
    organizationId: "org-test-id",
    vendorId:       "vendor-test-id",
    documentType:   "ISO/IEC 27001",
    storagePath:    "org-test-id/vendor-test-id/123-iso27001.pdf",
    status:         "valid",
    issuedOn:       "2024-01-01",
    expiresOn:      "2027-01-01",
    extracted:      { issuer: "BSI Group", summary: "ISO 27001 certification." },
    createdAt:      new Date("2025-01-01T00:00:00Z"),
    updatedAt:      new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  } as VendorDocument;
}
