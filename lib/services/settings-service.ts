import { DomainError } from "./errors";
import * as profileRepo from "@/lib/repositories/profile-repo";
import * as orgSettingsRepo from "@/lib/repositories/organization-settings-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";

export async function updateProfile(params: {
  userId: string;
  fullName: string;
  jobTitle?: string;
  department?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  avatarUrl?: string;
}): Promise<void> {
  const name = params.fullName.trim();
  if (name.length < 1) throw new DomainError("Name cannot be empty.");
  if (name.length > 80) throw new DomainError("Name is too long.");
  await profileRepo.updateProfile(params.userId, {
    fullName: name,
    jobTitle: params.jobTitle?.trim() || null,
    department: params.department?.trim() || null,
    phone: params.phone?.trim() || null,
    timezone: params.timezone || null,
    language: params.language || null,
    avatarUrl: params.avatarUrl || undefined,
  });
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

export async function updateOrgProfile(params: {
  orgId: string;
  actorId: string;
  name: string;
  legalName?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  country?: string;
  state?: string;
  timezone?: string;
  logoUrl?: string;
}): Promise<void> {
  const name = params.name.trim();
  if (name.length < 2) throw new DomainError("Organization name must be at least 2 characters.");
  if (name.length > 80) throw new DomainError("Organization name is too long.");

  await profileRepo.updateOrganization(params.orgId, {
    name,
    legalName: params.legalName?.trim() || null,
    industry: params.industry || null,
    companySize: params.companySize || null,
    website: params.website?.trim() || null,
    country: params.country?.trim() || null,
    state: params.state?.trim() || null,
    timezone: params.timezone || null,
    logoUrl: params.logoUrl || null,
  });
  await recordAudit({
    organizationId: params.orgId,
    actorId: params.actorId,
    action: "organization.updated",
    entityType: "organization",
    entityId: params.orgId,
    metadata: { name },
  });
}

export async function updateOrgBranding(params: {
  orgId: string;
  actorId: string;
  primaryColor?: string;
  accentColor?: string;
  reportFooter?: string;
  emailSignature?: string;
}): Promise<void> {
  await orgSettingsRepo.upsert(params.orgId, {
    primaryColor: params.primaryColor,
    accentColor: params.accentColor,
    reportFooter: params.reportFooter?.trim() || null,
    emailSignature: params.emailSignature?.trim() || null,
  });
  await recordAudit({
    organizationId: params.orgId,
    actorId: params.actorId,
    action: "organization.branding_updated",
    entityType: "organization",
    entityId: params.orgId,
  });
}

export { getOrgWithMemberCount } from "@/lib/repositories/profile-repo";
export { findProfile } from "@/lib/repositories/profile-repo";
export { findByOrg as getOrgSettings } from "@/lib/repositories/organization-settings-repo";
