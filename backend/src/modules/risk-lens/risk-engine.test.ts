import { describe, it, expect } from "vitest";
import { computeRiskScore } from "./risk-engine";
import { makeVendor } from "@/tests/fixtures/vendors";
import type { DocCounts } from "@/backend/src/modules/vendor-hub/scoring";

const zeroDocs: DocCounts = { total: 0, valid: 0, expiring: 0, expired: 0 };
const goodDocs: DocCounts = { total: 6, valid: 6, expiring: 0, expired: 0 };

describe("computeRiskScore", () => {
  it("score increases with higher risk level (all else equal)", () => {
    const low      = computeRiskScore(makeVendor({ riskLevel: "low" }),      zeroDocs, null);
    const medium   = computeRiskScore(makeVendor({ riskLevel: "medium" }),   zeroDocs, null);
    const high     = computeRiskScore(makeVendor({ riskLevel: "high" }),     zeroDocs, null);
    const critical = computeRiskScore(makeVendor({ riskLevel: "critical" }), zeroDocs, null);
    expect(low.score).toBeLessThan(medium.score);
    expect(medium.score).toBeLessThan(high.score);
    expect(high.score).toBeLessThan(critical.score);
  });

  it("no-docs flag adds a danger factor", () => {
    const { factors } = computeRiskScore(makeVendor(), zeroDocs, null);
    const noDocs = factors.find((f) => f.label === "No documents on file");
    expect(noDocs).toBeDefined();
    expect(noDocs?.impact).toBe("danger");
  });

  it("good doc coverage reduces score vs no docs", () => {
    const withDocs    = computeRiskScore(makeVendor(), goodDocs, null);
    const withoutDocs = computeRiskScore(makeVendor(), zeroDocs, null);
    expect(withDocs.score).toBeLessThan(withoutDocs.score);
  });

  it("good doc coverage adds a positive factor", () => {
    const { factors } = computeRiskScore(makeVendor(), goodDocs, null);
    expect(factors.some((f) => f.impact === "positive")).toBe(true);
  });

  it("expired documents add a danger factor", () => {
    const expiredDocs: DocCounts = { total: 1, valid: 0, expiring: 0, expired: 1 };
    const { factors } = computeRiskScore(makeVendor(), expiredDocs, null);
    expect(factors.some((f) => f.label.includes("expired") && f.impact === "danger")).toBe(true);
  });

  it("expiring documents add a warn factor", () => {
    const expiringDocs: DocCounts = { total: 1, valid: 0, expiring: 1, expired: 0 };
    const { factors } = computeRiskScore(makeVendor(), expiringDocs, null);
    expect(factors.some((f) => f.label.includes("expiring") && f.impact === "warn")).toBe(true);
  });

  it("high assessment score lowers risk", () => {
    const withAssessment    = computeRiskScore(makeVendor(), goodDocs, 80);
    const withoutAssessment = computeRiskScore(makeVendor(), goodDocs, null);
    expect(withAssessment.score).toBeLessThan(withoutAssessment.score);
  });

  it("poor assessment score adds a danger factor", () => {
    const { factors } = computeRiskScore(makeVendor(), goodDocs, 40);
    expect(factors.some((f) => f.label === "Poor assessment score")).toBe(true);
  });

  it("no security assessment adds a warn factor", () => {
    const { factors } = computeRiskScore(makeVendor(), goodDocs, null);
    expect(factors.some((f) => f.label === "No security assessment" && f.impact === "warn")).toBe(true);
  });

  it("no owner assigned adds a warn factor", () => {
    const { factors } = computeRiskScore(makeVendor({ ownerName: null }), goodDocs, 80);
    expect(factors.some((f) => f.label === "No owner assigned" && f.impact === "warn")).toBe(true);
  });

  it("owner assigned does NOT add the no-owner warn factor", () => {
    const { factors } = computeRiskScore(makeVendor({ ownerName: "Alice" }), goodDocs, 80);
    expect(factors.some((f) => f.label === "No owner assigned")).toBe(false);
  });

  it("score is clamped to 0–100", () => {
    const low  = computeRiskScore(makeVendor({ riskLevel: "low",      complianceScore: 99 }), goodDocs, 95);
    const high = computeRiskScore(makeVendor({ riskLevel: "critical", complianceScore: 10 }), { total: 5, valid: 0, expiring: 0, expired: 5 }, 10);
    expect(low.score).toBeGreaterThanOrEqual(0);
    expect(low.score).toBeLessThanOrEqual(100);
    expect(high.score).toBeGreaterThanOrEqual(0);
    expect(high.score).toBeLessThanOrEqual(100);
  });

  it("derived level is consistent with numeric score", () => {
    const { level, score } = computeRiskScore(makeVendor({ riskLevel: "low", complianceScore: 95 }), goodDocs, 90);
    // Low risk + strong docs + good assessment = low risk level
    expect(score).toBeLessThan(55);
    expect(level).toBe("low");
  });

  it("returns a factors array with at least one entry", () => {
    const { factors } = computeRiskScore(makeVendor(), zeroDocs, null);
    expect(factors.length).toBeGreaterThan(0);
  });
});
