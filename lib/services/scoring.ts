/**
 * Pure scoring functions — no DB imports.
 * Can be used from both server and client components.
 */

export type Risk = "low" | "medium" | "high" | "critical";
export type DocCounts = { total: number; valid: number; expiring: number; expired: number };

/** Document status derived from its expiry date. */
export function computeDocStatus(expiresOn: string | null): "valid" | "expiring" | "expired" {
  if (!expiresOn) return "valid";
  const exp = new Date(expiresOn);
  if (exp < new Date()) return "expired";
  if (exp < new Date(Date.now() + 30 * 86_400_000)) return "expiring";
  return "valid";
}

/** Compliance score: risk base + valid docs (×5, max+40) − expiring (×10) − expired (×20). */
export function computeScore(risk: Risk, c: DocCounts): number {
  const base: Record<Risk, number> = { low: 70, medium: 60, high: 45, critical: 30 };
  let score = base[risk];
  score += Math.min(c.valid * 5, 40);
  score -= c.expiring * 10;
  score -= c.expired * 20;
  return Math.max(0, Math.min(100, Math.round(score)));
}
