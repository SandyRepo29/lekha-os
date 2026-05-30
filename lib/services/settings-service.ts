import { DomainError } from "./errors";
import * as profileRepo from "@/lib/repositories/profile-repo";
import * as orgRepo from "@/lib/repositories/org-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";

export async function updateProfile(params: {
  userId: string;
  fullName: string;
}): Promise<void> {
  const name = params.fullName.trim();
  if (name.length < 1) throw new DomainError("Name cannot be empty.");
  if (name.length > 80) throw new DomainError("Name is too long.");
  await profileRepo.updateProfile(params.userId, { fullName: name });
}

export async function updateOrgName(params: {
  orgId: string;
  actorId: string;
  name: string;
}): Promise<void> {
  const name = params.name.trim();
  if (name.length < 2) throw new DomainError("Organization name must be at least 2 characters.");
  if (name.length > 80) throw new DomainError("Organization name is too long.");

  await profileRepo.updateOrganization(params.orgId, { name });
  await recordAudit({
    organizationId: params.orgId,
    actorId: params.actorId,
    action: "organization.renamed",
    entityType: "organization",
    entityId: params.orgId,
    metadata: { name },
  });
}

export { getOrgWithMemberCount } from "@/lib/repositories/profile-repo";
export { findProfile } from "@/lib/repositories/profile-repo";
