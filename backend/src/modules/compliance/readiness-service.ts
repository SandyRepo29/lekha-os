/**
 * Pure compliance readiness scoring — no DB imports.
 * Can be used from both server and client components.
 * Mirrors the pattern of lib/services/scoring.ts for the Compliance module.
 */

export type ControlStatus =
  | "implemented"
  | "partial"
  | "not_implemented"
  | "not_applicable";

export type ControlInput = {
  id: string;
  status: ControlStatus;
  priority: "low" | "medium" | "high" | "critical";
};

export type ReadinessBreakdown = {
  /** 0–100 weighted overall score. */
  overallScore: number;
  /** % of applicable controls that are Implemented or Partial. */
  controlCoverage: number;
  /** % of applicable controls with at least one approved evidence item. */
  evidenceCoverage: number;
  /** % of policies that are Approved (out of total policies for the org). */
  policyCoverage: number;
};

/**
 * Compute framework readiness from its current state.
 *
 * Weighting:
 *   - Control coverage  50%   (implemented=1.0, partial=0.5, n/a excluded)
 *   - Evidence coverage 30%   (applicable controls with approved evidence / total applicable)
 *   - Policy coverage   20%   (org-wide approved policies / total policies)
 *
 * @param controls            All controls for the framework.
 * @param coveredControlIds   Set of controlIds that have ≥1 approved evidence item.
 * @param totalPolicies       Total policy count for the org (0 → 100% to avoid penalising new orgs).
 * @param approvedPolicies    Approved policy count for the org.
 */
export function computeReadiness(
  controls: ControlInput[],
  coveredControlIds: Set<string>,
  totalPolicies: number,
  approvedPolicies: number
): ReadinessBreakdown {
  // Exclude not_applicable from all calculations
  const applicable = controls.filter((c) => c.status !== "not_applicable");
  const total = applicable.length;

  // --- Control coverage ----------------------------------------
  let controlPoints = 0;
  for (const c of applicable) {
    if (c.status === "implemented") controlPoints += 1;
    else if (c.status === "partial") controlPoints += 0.5;
  }
  const controlCoverage =
    total > 0 ? Math.round((controlPoints / total) * 100) : 0;

  // --- Evidence coverage ---------------------------------------
  const coveredCount = applicable.filter((c) =>
    coveredControlIds.has(c.id)
  ).length;
  const evidenceCoverage =
    total > 0 ? Math.round((coveredCount / total) * 100) : 0;

  // --- Policy coverage -----------------------------------------
  // If no policies exist yet, treat as 100% so new orgs aren't penalised.
  const policyCoverage =
    totalPolicies > 0
      ? Math.round((approvedPolicies / totalPolicies) * 100)
      : 100;

  // --- Overall weighted score ----------------------------------
  const overallScore = Math.round(
    controlCoverage * 0.5 + evidenceCoverage * 0.3 + policyCoverage * 0.2
  );

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    controlCoverage: Math.max(0, Math.min(100, controlCoverage)),
    evidenceCoverage: Math.max(0, Math.min(100, evidenceCoverage)),
    policyCoverage: Math.max(0, Math.min(100, policyCoverage)),
  };
}

/** Human-readable label for a readiness score (mirrors scoreLabel() in ui/colors.ts). */
export function readinessLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 50) return "Moderate";
  if (score >= 25) return "Needs Work";
  return "Critical";
}

/** Colour token for a readiness score. */
export function readinessColor(score: number): string {
  if (score >= 75) return "var(--color-green, #22c55e)";
  if (score >= 50) return "var(--color-yellow, #eab308)";
  return "var(--color-red, #ef4444)";
}
