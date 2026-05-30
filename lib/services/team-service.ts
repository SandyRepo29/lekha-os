import { createClient as createAdminClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { DomainError } from "./errors";
import * as teamRepo from "@/lib/repositories/team-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";

export type { TeamMember } from "@/lib/repositories/team-repo";

const ROLES = ["owner", "admin", "member", "viewer"] as const;
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

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || serviceRoleKey === "placeholder-service-role-key" || !supabaseUrl) {
    throw new DomainError("Service role key not configured. Add SUPABASE_SERVICE_ROLE_KEY to env vars.");
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(params.email, { redirectTo });
  if (error) throw new DomainError(`Invite failed: ${error.message}`);

  const userId = data.user?.id;
  if (!userId) throw new DomainError("Could not get invited user ID.");

  // Ensure profile exists
  await admin.from("profiles").upsert({ id: userId, email: params.email }, { onConflict: "id" });

  // Add membership (upsert in case they were previously deactivated)
  const existing = await teamRepo.findMembership(params.orgId, userId);
  if (existing) {
    await db.transaction(async (tx) => {
      await teamRepo.updateMemberRole(existing.id, params.role, tx);
      await teamRepo.setMemberActive(existing.id, true, tx);
    });
  } else {
    const { memberships: mTable } = await import("@/lib/db/schema");
    await db.insert(mTable).values({ organizationId: params.orgId, userId, role: params.role, isActive: true });
  }

  await recordAudit({
    organizationId: params.orgId, actorId: params.actorId,
    action: "team.member_invited", entityType: "profile", entityId: userId,
    metadata: { email: params.email, role: params.role },
  });
}

export async function updateRole(params: {
  orgId: string; actorId: string; membershipId: string; role: Role;
}): Promise<void> {
  if (!ROLES.includes(params.role)) throw new DomainError("Invalid role.");
  await db.transaction(async (tx) => {
    await teamRepo.updateMemberRole(params.membershipId, params.role, tx);
    await recordAudit({ organizationId: params.orgId, actorId: params.actorId, action: "team.role_changed", entityType: "membership", entityId: params.membershipId, metadata: { role: params.role } }, tx);
  });
}

export async function deactivateMember(params: {
  orgId: string; actorId: string; membershipId: string; targetUserId: string;
}): Promise<void> {
  if (params.actorId === params.targetUserId) throw new DomainError("You cannot deactivate yourself.");
  await db.transaction(async (tx) => {
    await teamRepo.setMemberActive(params.membershipId, false, tx);
    await recordAudit({ organizationId: params.orgId, actorId: params.actorId, action: "team.member_deactivated", entityType: "membership", entityId: params.membershipId }, tx);
  });
}

export async function reactivateMember(params: {
  orgId: string; actorId: string; membershipId: string;
}): Promise<void> {
  await db.transaction(async (tx) => {
    await teamRepo.setMemberActive(params.membershipId, true, tx);
    await recordAudit({ organizationId: params.orgId, actorId: params.actorId, action: "team.member_reactivated", entityType: "membership", entityId: params.membershipId }, tx);
  });
}
