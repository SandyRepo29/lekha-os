import { describe, it, expect, vi, beforeEach } from "vitest";
import { DomainError } from "./errors";

// ─── Mocks must come before the import under test ────────────────────────────

vi.mock("@/lib/repositories/vendor-repo", () => ({
  findById:              vi.fn(),
  insertVendor:          vi.fn(),
  updateVendor:          vi.fn(),
  deleteById:            vi.fn(),
  findVendorsByOrg:      vi.fn(),
  findVendorsByOrgPaged: vi.fn(),
  countByOrg:            vi.fn(),
  countDocuments:        vi.fn(),
  countExpiringDocuments: vi.fn(),
  updateScore:           vi.fn(),
}));

vi.mock("@/lib/repositories/document-repo", () => ({
  listByVendor:           vi.fn().mockResolvedValue([]),
  statusCountsByVendor:   vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/repositories/audit-repo", () => ({
  recordAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db", () => ({
  db: {
    transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn({})),
  },
}));

import * as vendorRepo from "@/lib/repositories/vendor-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";
import {
  createVendor,
  updateVendorStatus,
  deriveInsights,
  type VendorMetrics,
} from "./vendor-service";
import { makeVendor } from "../../tests/fixtures/vendors";

const mockInsertVendor = vi.mocked(vendorRepo.insertVendor);
const mockFindById     = vi.mocked(vendorRepo.findById);
const mockUpdateVendor = vi.mocked(vendorRepo.updateVendor);
const mockAudit        = vi.mocked(recordAudit);

beforeEach(() => vi.clearAllMocks());

// ─── createVendor ─────────────────────────────────────────────────────────────

describe("createVendor", () => {
  it("throws DomainError when name is less than 2 characters", async () => {
    await expect(
      createVendor({ orgId: "org1", actorId: "u1", input: { name: "X" } })
    ).rejects.toThrow(DomainError);
    expect(mockInsertVendor).not.toHaveBeenCalled();
  });

  it("throws DomainError when name is empty", async () => {
    await expect(
      createVendor({ orgId: "org1", actorId: "u1", input: { name: "" } })
    ).rejects.toThrow(DomainError);
  });

  it("succeeds with a valid name", async () => {
    mockInsertVendor.mockResolvedValue({ id: "v1" });
    await expect(
      createVendor({ orgId: "org1", actorId: "u1", input: { name: "Acme Corp" } })
    ).resolves.toEqual({ id: "v1" });
  });

  it("normalises unknown risk to 'medium'", async () => {
    mockInsertVendor.mockResolvedValue({ id: "v1" });
    await createVendor({ orgId: "org1", actorId: "u1", input: { name: "Acme", risk: "extreme" } });
    expect(mockInsertVendor).toHaveBeenCalledWith(
      expect.objectContaining({ riskLevel: "medium" }),
      expect.anything()
    );
  });

  it("sets starting score from risk level (high → 45)", async () => {
    mockInsertVendor.mockResolvedValue({ id: "v1" });
    await createVendor({ orgId: "org1", actorId: "u1", input: { name: "Acme", risk: "high" } });
    expect(mockInsertVendor).toHaveBeenCalledWith(
      expect.objectContaining({ complianceScore: 45 }),
      expect.anything()
    );
  });

  it("sets starting score from risk level (low → 70)", async () => {
    mockInsertVendor.mockResolvedValue({ id: "v1" });
    await createVendor({ orgId: "org1", actorId: "u1", input: { name: "Acme", risk: "low" } });
    expect(mockInsertVendor).toHaveBeenCalledWith(
      expect.objectContaining({ complianceScore: 70 }),
      expect.anything()
    );
  });

  it("passes owner fields to the repo", async () => {
    mockInsertVendor.mockResolvedValue({ id: "v1" });
    await createVendor({
      orgId: "org1", actorId: "u1",
      input: { name: "Acme", ownerName: "Alice", ownerEmail: "alice@co.com", ownerDepartment: "IT" },
    });
    expect(mockInsertVendor).toHaveBeenCalledWith(
      expect.objectContaining({ ownerName: "Alice", ownerEmail: "alice@co.com", ownerDepartment: "IT" }),
      expect.anything()
    );
  });

  it("records an audit entry", async () => {
    mockInsertVendor.mockResolvedValue({ id: "v1" });
    await createVendor({ orgId: "org1", actorId: "u1", input: { name: "Acme" } });
    expect(mockAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "vendor.created" }),
      expect.anything()
    );
  });

  it("sets status to 'active'", async () => {
    mockInsertVendor.mockResolvedValue({ id: "v1" });
    await createVendor({ orgId: "org1", actorId: "u1", input: { name: "Acme" } });
    expect(mockInsertVendor).toHaveBeenCalledWith(
      expect.objectContaining({ status: "active" }),
      expect.anything()
    );
  });
});

// ─── updateVendorStatus ───────────────────────────────────────────────────────

describe("updateVendorStatus", () => {
  it("throws DomainError when vendor not found", async () => {
    mockFindById.mockResolvedValue(null);
    await expect(
      updateVendorStatus({ orgId: "org1", actorId: "u1", vendorId: "v1", status: "inactive" })
    ).rejects.toThrow(DomainError);
  });

  it("calls updateVendor with the new status", async () => {
    mockFindById.mockResolvedValue(makeVendor({ status: "active" }));
    mockUpdateVendor.mockResolvedValue(undefined);
    await updateVendorStatus({ orgId: "org1", actorId: "u1", vendorId: "v1", status: "inactive" });
    expect(mockUpdateVendor).toHaveBeenCalledWith(
      "v1",
      expect.objectContaining({ status: "inactive" }),
      expect.anything()
    );
  });

  it("records audit with from→to metadata", async () => {
    mockFindById.mockResolvedValue(makeVendor({ status: "active" }));
    mockUpdateVendor.mockResolvedValue(undefined);
    await updateVendorStatus({ orgId: "org1", actorId: "u1", vendorId: "v1", status: "pending" });
    expect(mockAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "vendor.status_changed",
        metadata: expect.objectContaining({ from: "active", to: "pending" }),
      }),
      expect.anything()
    );
  });
});

// ─── deriveInsights (pure — no mocking needed) ────────────────────────────────

describe("deriveInsights", () => {
  it("returns a single info insight when there are no vendors", () => {
    const insights = deriveInsights({
      totalVendors: 0, totalDocuments: 0, expiringSoon: 0, highRisk: 0, complianceScore: 0,
    });
    expect(insights).toHaveLength(1);
    expect(insights[0].tone).toBe("info");
  });

  it("emits a danger insight when highRisk > 0", () => {
    const m: VendorMetrics = { totalVendors: 5, totalDocuments: 10, expiringSoon: 0, highRisk: 2, complianceScore: 65 };
    const insights = deriveInsights(m);
    expect(insights.some((i) => i.tone === "danger")).toBe(true);
  });

  it("emits a warn insight when expiringSoon > 0", () => {
    const m: VendorMetrics = { totalVendors: 3, totalDocuments: 9, expiringSoon: 2, highRisk: 0, complianceScore: 70 };
    const insights = deriveInsights(m);
    expect(insights.some((i) => i.tone === "warn")).toBe(true);
  });

  it("emits a live insight when complianceScore ≥ 80", () => {
    const m: VendorMetrics = { totalVendors: 3, totalDocuments: 9, expiringSoon: 0, highRisk: 0, complianceScore: 85 };
    const insights = deriveInsights(m);
    expect(insights.some((i) => i.tone === "live")).toBe(true);
  });

  it("emits an info insight when no issues and score < 80", () => {
    const m: VendorMetrics = { totalVendors: 2, totalDocuments: 5, expiringSoon: 0, highRisk: 0, complianceScore: 65 };
    const insights = deriveInsights(m);
    expect(insights.some((i) => i.tone === "info")).toBe(true);
  });

  it("can emit multiple insights for multiple issues", () => {
    const m: VendorMetrics = { totalVendors: 5, totalDocuments: 10, expiringSoon: 3, highRisk: 1, complianceScore: 50 };
    const insights = deriveInsights(m);
    expect(insights.length).toBeGreaterThan(1);
  });
});
