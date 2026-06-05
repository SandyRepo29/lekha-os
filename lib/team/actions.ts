"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import * as teamService from "@/lib/services/team-service";

export type TeamState = { error?: string; ok?: boolean } | undefined;

function requireAdmin(role: string) {
  if (role !== "owner" && role !== "admin") throw new DomainError("Only owners and admins can manage team members.");
}

export async function inviteMember(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    requireAdmin(session.org.role);
    await teamService.inviteMember({
      orgId: session.org.id,
      actorId: session.id,
      email: String(formData.get("email") || ""),
      role: String(formData.get("role") || "member") as Parameters<typeof teamService.inviteMember>[0]["role"],
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("inviteMember failed:", err);
    return { error: "Could not send invite. Please try again." };
  }
  revalidatePath("/settings/team");
  return { ok: true };
}

export async function updateRole(membershipId: string, role: string): Promise<TeamState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    requireAdmin(session.org.role);
    await teamService.updateRole({
      orgId: session.org.id,
      actorId: session.id,
      membershipId,
      role: role as Parameters<typeof teamService.updateRole>[0]["role"],
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not update role." };
  }
  revalidatePath("/settings/team");
  return { ok: true };
}

export async function deactivateMember(membershipId: string, targetUserId: string): Promise<TeamState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    requireAdmin(session.org.role);
    await teamService.deactivateMember({ orgId: session.org.id, actorId: session.id, membershipId, targetUserId });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not deactivate member." };
  }
  revalidatePath("/settings/team");
  return { ok: true };
}

export async function reactivateMember(membershipId: string): Promise<TeamState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    requireAdmin(session.org.role);
    await teamService.reactivateMember({ orgId: session.org.id, actorId: session.id, membershipId });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not reactivate member." };
  }
  revalidatePath("/settings/team");
  return { ok: true };
}

export async function transferOwnership(
  targetMembershipId: string,
  actorMembershipId: string
): Promise<TeamState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  if (session.org.role !== "owner") return { error: "Only the owner can transfer ownership." };
  try {
    await teamService.transferOwnership({
      orgId: session.org.id,
      actorId: session.id,
      targetMembershipId,
      actorMembershipId,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not transfer ownership." };
  }
  revalidatePath("/settings/team");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function resendInvite(email: string): Promise<TeamState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    requireAdmin(session.org.role);
    await teamService.resendInvite({ orgId: session.org.id, actorId: session.id, email });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not resend invite." };
  }
  return { ok: true };
}
