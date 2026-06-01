import { describe, it, expect, vi, beforeEach } from "vitest";
import { DomainError } from "./errors";

vi.mock("@/lib/repositories/vendor-repo", () => ({
  findById: vi.fn(),
  updateScore: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/repositories/document-repo", () => ({
  insertDocument:       vi.fn(),
  listByVendor:         vi.fn().mockResolvedValue([]),
  getById:              vi.fn(),
  deleteById:           vi.fn().mockResolvedValue(undefined),
  updateDocumentFields: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/repositories/audit-repo", () => ({
  recordAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/storage/server", () => ({
  removeObjects:   vi.fn().mockResolvedValue(undefined),
  downloadObject:  vi.fn().mockResolvedValue(null),
  createSignedUrl: vi.fn().mockResolvedValue("https://signed.url"),
}));

vi.mock("./extraction-service", () => ({
  extractDocument: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db", () => ({
  db: {
    transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn({})),
  },
}));

import * as vendorRepo  from "@/lib/repositories/vendor-repo";
import * as documentRepo from "@/lib/repositories/document-repo";
import { removeObjects }  from "@/lib/storage/server";
import { recordAudit }    from "@/lib/repositories/audit-repo";
import { registerDocument, deleteDocument, updateDocumentFields } from "./document-service";
import { makeVendor }    from "../../tests/fixtures/vendors";
import { makeDocument }  from "../../tests/fixtures/documents";

const mockFindVendor   = vi.mocked(vendorRepo.findById);
const mockInsertDoc    = vi.mocked(documentRepo.insertDocument);
const mockGetDoc       = vi.mocked(documentRepo.getById);
const mockDeleteDoc    = vi.mocked(documentRepo.deleteById);
const mockUpdateFields = vi.mocked(documentRepo.updateDocumentFields);
const mockRemoveObj    = vi.mocked(removeObjects);
const mockAudit        = vi.mocked(recordAudit);

beforeEach(() => vi.clearAllMocks());

// ─── registerDocument ─────────────────────────────────────────────────────────

describe("registerDocument", () => {
  it("throws DomainError when vendor not found", async () => {
    mockFindVendor.mockResolvedValue(null);
    await expect(
      registerDocument({ orgId: "o1", actorId: "u1", vendorId: "v1", documentType: "ISO 27001", storagePath: "path", fileName: "iso.pdf" })
    ).rejects.toThrow(DomainError);
    expect(mockInsertDoc).not.toHaveBeenCalled();
  });

  it("inserts the document when vendor exists", async () => {
    mockFindVendor.mockResolvedValue(makeVendor());
    mockInsertDoc.mockResolvedValue({ id: "doc1" });
    await registerDocument({ orgId: "o1", actorId: "u1", vendorId: "v1", documentType: "ISO 27001", storagePath: "path", fileName: "iso.pdf" });
    expect(mockInsertDoc).toHaveBeenCalledWith(
      expect.objectContaining({ documentType: "ISO 27001", status: "valid" }),
      expect.anything()
    );
  });

  it("records an audit entry", async () => {
    mockFindVendor.mockResolvedValue(makeVendor());
    mockInsertDoc.mockResolvedValue({ id: "doc1" });
    await registerDocument({ orgId: "o1", actorId: "u1", vendorId: "v1", documentType: "ISO 27001", storagePath: "path", fileName: "iso.pdf" });
    expect(mockAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "document.uploaded" }),
      expect.anything()
    );
  });

  it("returns the new document id", async () => {
    mockFindVendor.mockResolvedValue(makeVendor());
    mockInsertDoc.mockResolvedValue({ id: "doc-abc" });
    const result = await registerDocument({ orgId: "o1", actorId: "u1", vendorId: "v1", documentType: "SOC 2", storagePath: "p", fileName: "f" });
    expect(result).toEqual({ id: "doc-abc" });
  });
});

// ─── deleteDocument ───────────────────────────────────────────────────────────

describe("deleteDocument", () => {
  it("throws DomainError when document not found", async () => {
    mockGetDoc.mockResolvedValue(null);
    await expect(
      deleteDocument({ orgId: "o1", actorId: "u1", documentId: "d1" })
    ).rejects.toThrow(DomainError);
  });

  it("removes the stored file from storage", async () => {
    const doc = makeDocument({ storagePath: "org/vendor/file.pdf" });
    mockGetDoc.mockResolvedValue(doc);
    mockFindVendor.mockResolvedValue(makeVendor());
    await deleteDocument({ orgId: "o1", actorId: "u1", documentId: "d1" });
    expect(mockRemoveObj).toHaveBeenCalledWith(["org/vendor/file.pdf"]);
  });

  it("skips storage removal when storagePath is null", async () => {
    const doc = makeDocument({ storagePath: undefined });
    mockGetDoc.mockResolvedValue(doc);
    mockFindVendor.mockResolvedValue(makeVendor());
    await deleteDocument({ orgId: "o1", actorId: "u1", documentId: "d1" });
    expect(mockRemoveObj).not.toHaveBeenCalled();
  });

  it("deletes the DB row", async () => {
    mockGetDoc.mockResolvedValue(makeDocument());
    mockFindVendor.mockResolvedValue(makeVendor());
    await deleteDocument({ orgId: "o1", actorId: "u1", documentId: "d1" });
    expect(mockDeleteDoc).toHaveBeenCalled();
  });

  it("records an audit entry", async () => {
    mockGetDoc.mockResolvedValue(makeDocument());
    mockFindVendor.mockResolvedValue(makeVendor());
    await deleteDocument({ orgId: "o1", actorId: "u1", documentId: "d1" });
    expect(mockAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "document.deleted" }),
      expect.anything()
    );
  });

  it("returns the vendorId", async () => {
    mockGetDoc.mockResolvedValue(makeDocument({ vendorId: "v-xyz" }));
    mockFindVendor.mockResolvedValue(makeVendor());
    const result = await deleteDocument({ orgId: "o1", actorId: "u1", documentId: "d1" });
    expect(result).toEqual({ vendorId: "v-xyz" });
  });
});

// ─── updateDocumentFields ────────────────────────────────────────────────────

describe("updateDocumentFields", () => {
  it("throws DomainError when document not found", async () => {
    mockGetDoc.mockResolvedValue(null);
    await expect(
      updateDocumentFields({ orgId: "o1", actorId: "u1", documentId: "d1", documentType: "ISO 27001", issuedOn: null, expiresOn: null })
    ).rejects.toThrow(DomainError);
  });

  it("calls updateDocumentFields on repo with recomputed status", async () => {
    mockGetDoc.mockResolvedValue(makeDocument());
    mockFindVendor.mockResolvedValue(makeVendor());
    await updateDocumentFields({ orgId: "o1", actorId: "u1", documentId: "d1", documentType: "ISO 27001", issuedOn: "2024-01-01", expiresOn: "2027-01-01" });
    expect(mockUpdateFields).toHaveBeenCalledWith(
      "o1", "d1",
      expect.objectContaining({ status: "valid" }) // 2027 is far in future
    );
  });

  it("sets status to 'expired' when expiresOn is in the past", async () => {
    mockGetDoc.mockResolvedValue(makeDocument());
    mockFindVendor.mockResolvedValue(makeVendor());
    await updateDocumentFields({ orgId: "o1", actorId: "u1", documentId: "d1", documentType: "ISO 27001", issuedOn: null, expiresOn: "2020-01-01" });
    expect(mockUpdateFields).toHaveBeenCalledWith(
      "o1", "d1",
      expect.objectContaining({ status: "expired" })
    );
  });
});
