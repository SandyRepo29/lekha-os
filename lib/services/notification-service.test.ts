import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock external dependencies ───────────────────────────────────────────────

const mockSend = vi.fn().mockResolvedValue({ data: { id: "resend-123" }, error: null });

vi.mock("@/lib/email/resend", () => ({
  isResendConfigured: vi.fn(() => true),
  getResend: vi.fn(() => ({ emails: { send: mockSend } })),
  FROM: "Lekha OS <notifications@resend.dev>",
}));

vi.mock("@/lib/repositories/notification-repo", () => ({
  getPreferences: vi.fn().mockResolvedValue(null), // default: no prefs (uses defaults)
  alreadySent:    vi.fn().mockResolvedValue(false),  // default: not yet sent
  recordSent:     vi.fn().mockResolvedValue(undefined),
}));

// Build a Drizzle-style query chain where every method returns 'this'
// and the object is thenable (resolves to the given value when awaited).
function makeChain(resolveWith: unknown[] = []) {
  const chain: Record<string, unknown> = {};
  const methods = ["from","where","innerJoin","leftJoin","limit","orderBy","selectDistinct"];
  methods.forEach((m) => { chain[m] = vi.fn(() => chain); });
  // Make it awaitable — resolves to resolveWith
  chain["then"] = (resolve: (v: unknown[]) => void) => Promise.resolve(resolveWith).then(resolve);
  return chain;
}

vi.mock("@/lib/db", () => ({
  db: {
    selectDistinct: vi.fn(() => makeChain([{ id: "org-test-id" }])),
    select:         vi.fn(() => makeChain([])),
    where:          vi.fn(() => makeChain([])),
  },
}));

import * as notifRepo from "@/lib/repositories/notification-repo";
import { isResendConfigured } from "@/lib/email/resend";
import { runExpiryAlerts, runWeeklyDigest } from "./notification-service";

const mockAlreadySent = vi.mocked(notifRepo.alreadySent);
const mockRecordSent  = vi.mocked(notifRepo.recordSent);
const mockGetPrefs    = vi.mocked(notifRepo.getPreferences);
const mockConfigured  = vi.mocked(isResendConfigured);

beforeEach(() => vi.clearAllMocks());

describe("runExpiryAlerts", () => {
  it("returns zero sent when Resend is not configured", async () => {
    mockConfigured.mockReturnValue(false);
    const result = await runExpiryAlerts();
    expect(result).toEqual({ sent: 0, skipped: 0, errors: 0 });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns structured { sent, skipped, errors } object", async () => {
    mockConfigured.mockReturnValue(true);
    const result = await runExpiryAlerts();
    expect(result).toMatchObject({
      sent: expect.any(Number),
      skipped: expect.any(Number),
      errors: expect.any(Number),
    });
  });

  it("skips when expiry alerts preference is disabled", async () => {
    mockConfigured.mockReturnValue(true);
    mockGetPrefs.mockResolvedValue({ expiryAlertsEnabled: false, weeklyDigestEnabled: true } as any);
    const result = await runExpiryAlerts();
    expect(result.sent).toBe(0);
  });
});

describe("runWeeklyDigest", () => {
  it("returns zero sent when Resend is not configured", async () => {
    mockConfigured.mockReturnValue(false);
    const result = await runWeeklyDigest();
    expect(result).toEqual({ sent: 0, skipped: 0, errors: 0 });
  });

  it("returns structured { sent, skipped, errors } object", async () => {
    mockConfigured.mockReturnValue(true);
    const result = await runWeeklyDigest();
    expect(result).toMatchObject({
      sent: expect.any(Number),
      skipped: expect.any(Number),
      errors: expect.any(Number),
    });
  });

  it("skips when weekly digest preference is disabled", async () => {
    mockConfigured.mockReturnValue(true);
    mockGetPrefs.mockResolvedValue({ expiryAlertsEnabled: true, weeklyDigestEnabled: false } as any);
    mockAlreadySent.mockResolvedValue(false);
    const result = await runWeeklyDigest();
    expect(result.sent).toBe(0);
  });

  it("skips when digest was already sent within 6 days (dedup)", async () => {
    mockConfigured.mockReturnValue(true);
    mockGetPrefs.mockResolvedValue(null);
    mockAlreadySent.mockResolvedValue(true); // already sent
    const result = await runWeeklyDigest();
    expect(mockSend).not.toHaveBeenCalled();
    expect(result.sent).toBe(0);
  });
});
