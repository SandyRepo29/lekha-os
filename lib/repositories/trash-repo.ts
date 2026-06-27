/**
 * trash-repo.ts — Soft Delete Recovery
 *
 * Returns all soft-deleted entities (deleted_at IS NOT NULL) from the last 30 days,
 * grouped by entity type. Also handles permanent hard-delete for admin use.
 */

import { and, eq, isNotNull, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  vendors,
  risks,
  controls,
  evidence,
  policies,
  contracts,
  assessments,
  type Vendor,
  type Risk,
  type Control,
  type Evidence,
  type Policy,
  type Contract,
  type Assessment,
} from "@/lib/db/schema";

const THIRTY_DAYS_AGO = () => new Date(Date.now() - 30 * 86_400_000).toISOString();

export type OrgTrash = {
  vendors: Vendor[];
  risks: Risk[];
  controls: Control[];
  evidence: Evidence[];
  policies: Policy[];
  contracts: Contract[];
  assessments: Assessment[];
};

/**
 * Returns all soft-deleted entities from the last 30 days, grouped by type.
 * Used to render the Trash / Recovery UI.
 */
export async function getOrgTrash(orgId: string): Promise<OrgTrash> {
  const since = THIRTY_DAYS_AGO();

  const [
    deletedVendors,
    deletedRisks,
    deletedControls,
    deletedEvidence,
    deletedPolicies,
    deletedContracts,
    deletedAssessments,
  ] = await Promise.all([
    db
      .select()
      .from(vendors)
      .where(
        and(
          eq(vendors.organizationId, orgId),
          isNotNull(vendors.deletedAt),
          sql`${vendors.deletedAt} >= ${since}`
        )
      )
      .orderBy(desc(vendors.deletedAt)),

    db
      .select()
      .from(risks)
      .where(
        and(
          eq(risks.organizationId, orgId),
          isNotNull(risks.deletedAt),
          sql`${risks.deletedAt} >= ${since}`
        )
      )
      .orderBy(desc(risks.deletedAt)),

    db
      .select()
      .from(controls)
      .where(
        and(
          eq(controls.organizationId, orgId),
          isNotNull(controls.deletedAt),
          sql`${controls.deletedAt} >= ${since}`
        )
      )
      .orderBy(desc(controls.deletedAt)),

    db
      .select()
      .from(evidence)
      .where(
        and(
          eq(evidence.organizationId, orgId),
          isNotNull(evidence.deletedAt),
          sql`${evidence.deletedAt} >= ${since}`
        )
      )
      .orderBy(desc(evidence.deletedAt)),

    db
      .select()
      .from(policies)
      .where(
        and(
          eq(policies.organizationId, orgId),
          isNotNull(policies.deletedAt),
          sql`${policies.deletedAt} >= ${since}`
        )
      )
      .orderBy(desc(policies.deletedAt)),

    db
      .select()
      .from(contracts)
      .where(
        and(
          eq(contracts.organizationId, orgId),
          isNotNull(contracts.deletedAt),
          sql`${contracts.deletedAt} >= ${since}`
        )
      )
      .orderBy(desc(contracts.deletedAt)),

    db
      .select()
      .from(assessments)
      .where(
        and(
          eq(assessments.organizationId, orgId),
          isNotNull(assessments.deletedAt),
          sql`${assessments.deletedAt} >= ${since}`
        )
      )
      .orderBy(desc(assessments.deletedAt)),
  ]);

  return {
    vendors: deletedVendors,
    risks: deletedRisks,
    controls: deletedControls,
    evidence: deletedEvidence,
    policies: deletedPolicies,
    contracts: deletedContracts,
    assessments: deletedAssessments,
  };
}

/**
 * Permanently hard-deletes a soft-deleted entity. Admin-only.
 * Validates that the entity belongs to the org before deleting.
 */
export async function permanentDelete(
  entityType: "vendor" | "risk" | "control" | "evidence" | "policy" | "contract" | "assessment",
  id: string,
  orgId: string
): Promise<void> {
  switch (entityType) {
    case "vendor":
      await db
        .delete(vendors)
        .where(and(eq(vendors.id, id), eq(vendors.organizationId, orgId), isNotNull(vendors.deletedAt)));
      break;
    case "risk":
      await db
        .delete(risks)
        .where(and(eq(risks.id, id), eq(risks.organizationId, orgId), isNotNull(risks.deletedAt)));
      break;
    case "control":
      await db
        .delete(controls)
        .where(and(eq(controls.id, id), eq(controls.organizationId, orgId), isNotNull(controls.deletedAt)));
      break;
    case "evidence":
      await db
        .delete(evidence)
        .where(and(eq(evidence.id, id), eq(evidence.organizationId, orgId), isNotNull(evidence.deletedAt)));
      break;
    case "policy":
      await db
        .delete(policies)
        .where(and(eq(policies.id, id), eq(policies.organizationId, orgId), isNotNull(policies.deletedAt)));
      break;
    case "contract":
      await db
        .delete(contracts)
        .where(and(eq(contracts.id, id), eq(contracts.organizationId, orgId), isNotNull(contracts.deletedAt)));
      break;
    case "assessment":
      await db
        .delete(assessments)
        .where(and(eq(assessments.id, id), eq(assessments.organizationId, orgId), isNotNull(assessments.deletedAt)));
      break;
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}
