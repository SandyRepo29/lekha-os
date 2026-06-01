import { describe, it, expect } from "vitest";
import { calculateScore, STANDARD_QUESTIONS, groupByCategory } from "./assessment-questions";

function allAnswers(answer: string): Map<string, string> {
  return new Map(STANDARD_QUESTIONS.map((q) => [q.key, answer]));
}

describe("STANDARD_QUESTIONS", () => {
  it("has 17 questions", () => {
    expect(STANDARD_QUESTIONS).toHaveLength(17);
  });

  it("each question has a unique key", () => {
    const keys = STANDARD_QUESTIONS.map((q) => q.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it("each question has a weight between 1 and 3", () => {
    STANDARD_QUESTIONS.forEach((q) => {
      expect(q.weight).toBeGreaterThanOrEqual(1);
      expect(q.weight).toBeLessThanOrEqual(3);
    });
  });

  it("groups into 6 categories", () => {
    const groups = groupByCategory(STANDARD_QUESTIONS);
    expect(groups.size).toBe(6);
  });
});

describe("calculateScore", () => {
  it("all 'yes' → 100", () => {
    expect(calculateScore(allAnswers("yes"))).toBe(100);
  });

  it("all 'no' → 0", () => {
    expect(calculateScore(allAnswers("no"))).toBe(0);
  });

  it("all 'partial' → 50", () => {
    expect(calculateScore(allAnswers("partial"))).toBe(50);
  });

  it("all 'na' → 0 (no applicable weight, avoids divide-by-zero)", () => {
    expect(calculateScore(allAnswers("na"))).toBe(0);
  });

  it("empty map (defaults to 'no' for all) → 0", () => {
    expect(calculateScore(new Map())).toBe(0);
  });

  it("result is always an integer", () => {
    const mixed = new Map([
      ["sec_mfa", "yes"],
      ["enc_transit", "partial"],
      ["ir_plan", "no"],
    ]);
    const score = calculateScore(mixed);
    expect(Number.isInteger(score)).toBe(true);
  });

  it("result is always between 0 and 100", () => {
    const mixed = new Map([
      ["sec_mfa", "yes"],
      ["enc_transit", "partial"],
    ]);
    const score = calculateScore(mixed);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("high-weight question 'yes' contributes more than low-weight 'yes'", () => {
    const highWeight = STANDARD_QUESTIONS.find((q) => q.weight === 3)!;
    const lowWeight  = STANDARD_QUESTIONS.find((q) => q.weight === 1);

    const highOnly = calculateScore(new Map([[highWeight.key, "yes"]]));

    if (lowWeight) {
      const lowOnly = calculateScore(new Map([[lowWeight.key, "yes"]]));
      expect(highOnly).toBeGreaterThan(lowOnly);
    } else {
      expect(highOnly).toBeGreaterThan(0);
    }
  });

  it("'na' answers are excluded from the denominator (does not lower score)", () => {
    // Mix: one yes + one na — score should equal just the yes contribution
    const firstQuestion = STANDARD_QUESTIONS[0];
    const secondQuestion = STANDARD_QUESTIONS[1];

    const yesOnly  = calculateScore(new Map([[firstQuestion.key, "yes"]]));
    const yesAndNa = calculateScore(new Map([[firstQuestion.key, "yes"], [secondQuestion.key, "na"]]));

    // 'na' shrinks the denominator → score is ≥ yesOnly (same earnedWeight / smaller totalWeight)
    expect(yesAndNa).toBeGreaterThanOrEqual(yesOnly);
  });

  it("missing key defaults to 'no' (does not throw)", () => {
    expect(() => calculateScore(new Map([["nonexistent_key", "yes"]]))).not.toThrow();
  });
});
