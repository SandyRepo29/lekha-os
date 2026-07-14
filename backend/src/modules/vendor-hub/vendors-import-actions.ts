"use server";

import { requireUser } from "@/lib/auth/session";
import { createVendor } from "@/backend/src/modules/vendor-hub/vendor-service";
import { db } from "@/lib/db";
import { vendors } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const VALID_RISK_LEVELS = ["low", "medium", "high", "critical"] as const;

export async function importVendorsAction(
  rows: Record<string, string>[]
): Promise<{ success: number; errors: string[] }> {
  const session = await requireUser();
  if (!session.org) return { success: 0, errors: ["Not authenticated."] };

  const orgId = session.org.id;
  const actorId = session.id;

  let success = 0;
  const errors: string[] = [];

  const existingVendors = await db
    .select({ name: vendors.name })
    .from(vendors)
    .where(eq(vendors.organizationId, orgId));

  const existingNames = new Set(existingVendors.map((v) => v.name.toLowerCase().trim()));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    const name = (row["name"] ?? "").trim();
    const category = (row["category"] ?? "").trim() || null;
    const riskLevel = (row["riskLevel"] ?? "medium").trim().toLowerCase();
    const contactEmail = (row["contactEmail"] ?? "").trim() || null;
    const contactName = (row["contactName"] ?? "").trim() || null;
    const website = (row["website"] ?? "").trim() || null;
    const country = (row["country"] ?? "").trim() || null;
    const description = (row["description"] ?? "").trim() || null;
    const complianceScoreRaw = (row["complianceScore"] ?? "").trim();

    if (!name || name.length < 2) {
      errors.push(`Row ${rowNum}: name is required (min 2 characters).`);
      continue;
    }

    if (!VALID_RISK_LEVELS.includes(riskLevel as typeof VALID_RISK_LEVELS[number])) {
      errors.push(`Row ${rowNum}: riskLevel must be one of low, medium, high, critical.`);
      continue;
    }

    if (existingNames.has(name.toLowerCase())) {
      errors.push(`Row ${rowNum}: vendor "${name}" already exists — skipped.`);
      continue;
    }

    try {
      await createVendor({
        orgId,
        actorId,
        input: {
          name,
          category,
          contactEmail,
          risk: riskLevel,
          ownerName: contactName,
          ownerEmail: null,
          ownerDepartment: null,
        },
      });
      existingNames.add(name.toLowerCase());
      success++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`Row ${rowNum} ("${name}"): ${msg}`);
    }
  }

  return { success, errors };
}
