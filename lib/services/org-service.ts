import { db } from "@/lib/db";
import { DomainError } from "./errors";
import * as orgRepo from "@/lib/repositories/org-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";

export type { ActiveOrg } from "@/lib/repositories/org-repo";

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "org"
  );
}

/**
 * Creates an organization and makes the actor its owner. The org, owner
 * membership and audit entry are written atomically.
 */
export async function createOrganization(params: {
  actorId: string;
  name: string;
  industry?: string;
  companySize?: string;
}): Promise<{ id: string; slug: string }> {
  const name = params.name.trim();
  if (name.length < 2) {
    throw new DomainError("Please enter an organization name.");
  }
  const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`;

  return db.transaction(async (tx) => {
    const org = await orgRepo.insertOrganization(
      { name, slug, industry: params.industry, companySize: params.companySize },
      tx
    );
    await orgRepo.insertMembership(
      { organizationId: org.id, userId: params.actorId, role: "owner" },
      tx
    );
    await recordAudit(
      {
        organizationId: org.id,
        actorId: params.actorId,
        action: "organization.created",
        entityType: "organization",
        entityId: org.id,
        metadata: { name },
      },
      tx
    );
    return { id: org.id, slug };
  });
}

export function getActiveOrg(userId: string) {
  return orgRepo.findActiveOrgByUser(userId);
}
