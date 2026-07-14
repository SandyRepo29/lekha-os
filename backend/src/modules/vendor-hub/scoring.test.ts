import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { computeScore, computeDocStatus, type DocCounts, type Risk } from "./scoring";

const zeroDocs: DocCounts = { total: 0, valid: 0, expiring: 0, expired: 0 };

// ─── computeScore ────────────────────────────────────────────────────────────

describe("computeScore", () => {
  it("returns the base score for each risk level with zero documents", () => {
    expect(computeScore("low",      zeroDocs)).toBe(70);
    expect(computeScore("medium",   zeroDocs)).toBe(60);
    expect(computeScore("high",     zeroDocs)).toBe(45);
    expect(computeScore("critical", zeroDocs)).toBe(30);
  });

  it("adds 5 points per valid document", () => {
    const base = computeScore("medium", zeroDocs);                               // 60
    const one  = computeScore("medium", { ...zeroDocs, total: 1, valid: 1 });   // 65
    expect(one - base).toBe(5);
  });

  it("caps valid-doc bonus at +40 (8 docs)", () => {
    const eight = computeScore("low", { total: 8,  valid: 8,  expiring: 0, expired: 0 });
    const ten   = computeScore("low", { total: 10, valid: 10, expiring: 0, expired: 0 });
    expect(eight).toBe(100); // 70 + 40 = 110 → capped at 100
    expect(ten).toBe(100);
  });

  it("deducts 10 points per expiring document", () => {
    const base = computeScore("medium", zeroDocs);                                         // 60
    const two  = computeScore("medium", { total: 2, valid: 0, expiring: 2, expired: 0 }); // 40
    expect(two).toBe(base - 20);
  });

  it("deducts 20 points per expired document", () => {
    const base = computeScore("medium", zeroDocs);                                        // 60
    const one  = computeScore("medium", { total: 1, valid: 0, expiring: 0, expired: 1 }); // 40
    expect(one).toBe(base - 20);
  });

  it("clamps to 0 when penalties exceed base", () => {
    // critical(30) − 3 expired(60) = −30 → clamp to 0
    expect(computeScore("critical", { total: 3, valid: 0, expiring: 0, expired: 3 })).toBe(0);
  });

  it("clamps to 100 (never exceeds maximum)", () => {
    expect(computeScore("low", { total: 20, valid: 20, expiring: 0, expired: 0 })).toBe(100);
  });

  it("combines bonuses and penalties correctly", () => {
    // medium(60) + 3 valid(15) - 1 expiring(10) = 65
    const score = computeScore("medium", { total: 4, valid: 3, expiring: 1, expired: 0 });
    expect(score).toBe(65);
  });

  it("returns an integer (Math.round applied)", () => {
    const score = computeScore("high", { total: 3, valid: 3, expiring: 0, expired: 0 });
    expect(Number.isInteger(score)).toBe(true);
  });
});

// ─── computeDocStatus ────────────────────────────────────────────────────────

describe("computeDocStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-01T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("returns 'valid' for null expiry (no expiry date)", () => {
    expect(computeDocStatus(null)).toBe("valid");
  });

  it("returns 'expired' for a past date", () => {
    expect(computeDocStatus("2025-05-01")).toBe("expired");
  });

  it("returns 'expired' for yesterday", () => {
    expect(computeDocStatus("2025-05-31")).toBe("expired");
  });

  it("returns 'expiring' for a date within 30 days", () => {
    expect(computeDocStatus("2025-06-15")).toBe("expiring");
    expect(computeDocStatus("2025-06-30")).toBe("expiring");
  });

  it("returns 'valid' for a date more than 30 days away", () => {
    expect(computeDocStatus("2025-08-01")).toBe("valid");
    expect(computeDocStatus("2026-01-01")).toBe("valid");
  });

  it("handles today's date as expired (today < today is false, so expiry of today = expiring if within 30d)", () => {
    // Exactly today: exp = new Date("2025-06-01") is NOT < today (same ms), and IS < today+30d
    expect(computeDocStatus("2025-06-01")).toBe("expired"); // midnight < noon → expired
  });

  it("handles the exact 30-day boundary (within)", () => {
    // today + 30d = 2025-07-01 at 12:00 UTC. Expiry of 2025-07-01 (midnight) < 2025-07-01 12:00 → expiring
    expect(computeDocStatus("2025-07-01")).toBe("expiring");
  });
});
