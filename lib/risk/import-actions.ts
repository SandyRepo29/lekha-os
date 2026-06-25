"use server";

import { requireUser } from "@/lib/auth/session";
import { createRisk } from "@/lib/services/risk/risk-service";

const VALID_CATEGORIES = [
  "operational", "cyber_security", "compliance", "vendor", "privacy", "financial",
  "legal", "strategic", "technology", "business_continuity", "third_party", "regulatory", "custom",
] as const;

const VALID_STATUSES = [
  "identified", "under_assessment", "open", "mitigating", "accepted", "transferred", "closed", "archived",
] as const;

const VALID_TREATMENT_STRATEGIES = ["mitigate", "accept", "transfer", "avoid", "monitor"] as const;

export async function importRisksAction(
  rows: Record<string, string>[]
): Promise<{ success: number; errors: string[] }> {
  const session = await requireUser();
  if (!session.org) return { success: 0, errors: ["Not authenticated."] };

  const orgId = session.org.id;
  const actorId = session.id;

  let success = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    const title = (row["title"] ?? "").trim();
    const category = (row["category"] ?? "").trim().toLowerCase();
    const status = (row["status"] ?? "").trim().toLowerCase();
    const impactRaw = (row["impact"] ?? "").trim();
    const likelihoodRaw = (row["likelihood"] ?? "").trim();
    const description = (row["description"] ?? "").trim() || null;
    const treatmentStrategy = (row["treatmentStrategy"] ?? "mitigate").trim().toLowerCase();
    const owner = (row["owner"] ?? "").trim() || null;

    if (!title || title.length < 2) {
      errors.push(`Row ${rowNum}: title is required (min 2 characters).`);
      continue;
    }

    if (!VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
      errors.push(`Row ${rowNum}: category "${category}" is not valid. Use one of: ${VALID_CATEGORIES.join(", ")}.`);
      continue;
    }

    if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      errors.push(`Row ${rowNum}: status "${status}" is not valid. Use one of: ${VALID_STATUSES.join(", ")}.`);
      continue;
    }

    const impact = parseInt(impactRaw, 10);
    if (isNaN(impact) || impact < 1 || impact > 5) {
      errors.push(`Row ${rowNum}: impact must be a number from 1 to 5.`);
      continue;
    }

    const likelihood = parseInt(likelihoodRaw, 10);
    if (isNaN(likelihood) || likelihood < 1 || likelihood > 5) {
      errors.push(`Row ${rowNum}: likelihood must be a number from 1 to 5.`);
      continue;
    }

    const resolvedStrategy = VALID_TREATMENT_STRATEGIES.includes(
      treatmentStrategy as typeof VALID_TREATMENT_STRATEGIES[number]
    )
      ? (treatmentStrategy as typeof VALID_TREATMENT_STRATEGIES[number])
      : "mitigate";

    try {
      await createRisk({
        orgId,
        actorId,
        input: {
          title,
          description,
          category: category as typeof VALID_CATEGORIES[number],
          status: status as typeof VALID_STATUSES[number],
          impact,
          likelihood,
          treatmentStrategy: resolvedStrategy,
          source: "manual",
        },
      });
      success++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`Row ${rowNum} ("${title}"): ${msg}`);
    }
  }

  return { success, errors };
}
