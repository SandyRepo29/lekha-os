/** Shared date helpers for Contract Governance™ pages. */

/** Format an ISO date string as e.g. "5 Jul 2026"; returns "—" when empty. */
export function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Whole days from now until `d` (negative = past). Returns null when empty. */
export function daysUntil(d: string | null | undefined): number | null {
  if (!d) return null;
  return Math.floor((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
