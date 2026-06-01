import { describe, it, expect } from "vitest";
import {
  scoreTextColor,
  scoreBarGradient,
  scoreLabel,
  scoreLabelColor,
  riskBadgeStyles,
  statusBadgeStyles,
} from "./colors";

// ─── Score functions ─────────────────────────────────────────────────────────

describe("scoreTextColor", () => {
  it("≥80 → emerald", () => expect(scoreTextColor(80)).toContain("emerald"));
  it("≥60 → blue",    () => expect(scoreTextColor(60)).toContain("blue"));
  it("≥40 → amber",   () => expect(scoreTextColor(40)).toContain("amber"));
  it("<40 → red",     () => expect(scoreTextColor(39)).toContain("red"));
  it("100 → emerald", () => expect(scoreTextColor(100)).toContain("emerald"));
  it("0 → red",       () => expect(scoreTextColor(0)).toContain("red"));
  it("boundaries: 79 → blue", () => expect(scoreTextColor(79)).toContain("blue"));
});

describe("scoreBarGradient", () => {
  it("returns a CSS gradient string", () => {
    expect(scoreBarGradient(90)).toContain("linear-gradient");
  });
  it("≥80 → green gradient", () => {
    expect(scoreBarGradient(80)).toContain("#10b981");
  });
  it("≥60 → indigo gradient", () => {
    expect(scoreBarGradient(60)).toContain("#6366f1");
  });
  it("≥40 → amber gradient", () => {
    expect(scoreBarGradient(40)).toContain("#f59e0b");
  });
  it("<40 → red gradient", () => {
    expect(scoreBarGradient(0)).toContain("#ef4444");
  });
});

describe("scoreLabel", () => {
  it("≥80 → Healthy",          () => expect(scoreLabel(80)).toBe("Healthy"));
  it("≥60 → Improving",        () => expect(scoreLabel(60)).toBe("Improving"));
  it("≥40 → Needs Attention",  () => expect(scoreLabel(40)).toBe("Needs Attention"));
  it("<40 → Critical",         () => expect(scoreLabel(0)).toBe("Critical"));
  it("100 → Healthy",          () => expect(scoreLabel(100)).toBe("Healthy"));
  it("79 → Improving",         () => expect(scoreLabel(79)).toBe("Improving"));
});

describe("scoreLabelColor", () => {
  it("produces the same colour family as scoreTextColor for same score", () => {
    [0, 40, 60, 80, 100].forEach((s) => {
      // Both functions use the same thresholds
      expect(scoreLabelColor(s)).toBe(scoreTextColor(s));
    });
  });
});

// ─── Risk & Status badge styles ──────────────────────────────────────────────

describe("riskBadgeStyles", () => {
  it("low → emerald class", () => {
    expect(riskBadgeStyles("low")).toContain("emerald");
  });
  it("medium → amber class", () => {
    expect(riskBadgeStyles("medium")).toContain("amber");
  });
  it("high → red class", () => {
    expect(riskBadgeStyles("high")).toContain("red");
  });
  it("critical → red class (deeper shade)", () => {
    expect(riskBadgeStyles("critical")).toContain("red");
  });
  it("unknown → neutral fallback", () => {
    expect(riskBadgeStyles("unknown")).toContain("ink-faint");
  });
  it("each risk level returns a non-empty string", () => {
    ["low", "medium", "high", "critical"].forEach((r) => {
      expect(riskBadgeStyles(r).length).toBeGreaterThan(0);
    });
  });
});

describe("statusBadgeStyles", () => {
  const statusTests: [string, string][] = [
    ["active",        "emerald"],
    ["pending",       "blue"],
    ["inactive",      "ink-faint"],
    ["approved",      "emerald"],
    ["rejected",      "red"],
    ["submitted",     "amber"],
    ["requested",     "blue"],
    ["expired",       "ink-faint"],
    ["needs_followup","amber"],
    ["valid",         "emerald"],
    ["expiring",      "amber"],
    ["missing",       "ink-faint"],
  ];

  statusTests.forEach(([status, expectedColor]) => {
    it(`"${status}" → contains "${expectedColor}"`, () => {
      expect(statusBadgeStyles(status)).toContain(expectedColor);
    });
  });

  it("unknown status → neutral fallback (does not throw)", () => {
    expect(() => statusBadgeStyles("totally-unknown")).not.toThrow();
    expect(statusBadgeStyles("totally-unknown").length).toBeGreaterThan(0);
  });
});
