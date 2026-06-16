import { db } from "@/lib/db";
import { DomainError } from "./errors";
import { getAuthProvider } from "@/lib/providers/auth";
import * as teamRepo from "@/lib/repositories/team-repo";
import * as profileRepo from "@/lib/repositories/profile-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";
import { checkPlanLimit } from "./billing-service";

export type { TeamMember } from "@/lib/repositories/team-repo";

const ROLES = [
  "owner", "admin", "member", "viewer",
  "compliance_manager", "security_manager", "procurement_manager",
] as const;
type Role = typeof ROLES[number];

export async function listTeam(orgId: string) {
  return teamRepo.listMembers(orgId);
}

export async function inviteMember(params: {
  orgId: string;
  actorId: string;
  email: string;
  role: Role;
}): Promise<void> {
  if (!ROLES.includes(params.role)) throw new DomainError("Invalid role.");

  await checkPlanLimit(params.orgId, "users");

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
  const { userId } = await getAuthProvider().inviteUser(params.email, redirectTo);

  // Ensure profile row exists (repo handles on-conflict)
  await profileRepo.upsertProfile(userId, params.email);

  // Add membership (upsert in case they were previously deactivated)
  const existing = await teamRepo.findMembership(params.orgId, userId);
  if (existing) {
    await db.transaction(async (tx) => {
      await teamRepo.updateMemberRole(existing.id, params.role, tx);
      await teamRepo.setMemberActive(existing.id, true, tx);
    });
  } else {
    const { memberships: mTable } = await import("@/lib/db/schema");
    await db.insert(mTable).values({
      organizationId: params.orgId,
      userId,
      role: params.role,
      isActive: true,
    });
  }

  await recordAudit({
    organizationId: params.orgId,
    actorId: params.actorId,
    action: "team.member_invited",
    entityType: "profile",
    entityId: userId,
    metadata: { email: params.email, role: params.role },
  });
}

export async function updateRole(params: {
  orgId: string; actorId: string; membershipId: string; role: Role;
}): Promise<void> {
  if (!ROLES.includes(params.role)) throw new DomainError("Invalid role.");
  await db.transaction(async (tx) => {
    await teamRepo.updateMemberRole(params.membershipId, params.role, tx);
    await recordAudit({
      organizationId: params.orgId, actorId: params.actorId,
      action: "team.role_changed", entityType: "membership",
      entityId: params.membershipId, metadata: { role: params.role },
    }, tx);
  });
}

export async function deactivateMember(params: {
  orgId: string; actorId: string; membershipId: string; targetUserId: string;
}): Promise<void> {
  if (params.actorId === params.targetUserId) throw new DomainError("You cannot deactivate yourself.");
  await db.transaction(async (tx) => {
    await teamRepo.setMemberActive(params.membershipId, false, tx);
    await recordAudit({
      organizationId: params.orgId, actorId: params.actorId,
      action: "team.member_deactivated", entityType: "membership",
      entityId: params.membershipId,
    }, tx);
  });
}

export async function reactivateMember(params: {
  orgId: string; actorId: string; membershipId: string;
}): Promise<void> {
  await db.transaction(async (tx) => {
    await teamRepo.setMemberActive(params.membershipId, true, tx);
    await recordAudit({
      organizationId: params.orgId, actorId: params.actorId,
      action: "team.member_reactivated", entityType: "membership",
      entityId: params.membershipId,
    }, tx);
  });
}

export async function transferOwnership(params: {
  orgId: string;
  actorId: string;
  targetMembershipId: string;
  actorMembershipId: string;
}): Promise<void> {
  await db.transaction(async (tx) => {
    await teamRepo.updateMemberRole(params.actorMembershipId, "admin", tx);
    await teamRepo.updateMemberRole(params.targetMembershipId, "owner", tx);
    await recordAudit({
      organizationId: params.orgId,
      actorId: params.actorId,
      action: "team.ownership_transferred",
      entityType: "membership",
      entityId: params.targetMembershipId,
    }, tx);
  });
}

export async function resendInvite(params: {
  orgId: string;
  actorId: string;
  email: string;
}): Promise<void> {
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
  await getAuthProvider().inviteUser(params.email, redirectTo);

  await recordAudit({
    organizationId: params.orgId,
    actorId: params.actorId,
    action: "team.invite_resent",
    entityType: "profile",
    metadata: { email: params.email },
  });
}
