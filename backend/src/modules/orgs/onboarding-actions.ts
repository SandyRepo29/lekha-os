"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DomainError } from "@/lib/services/errors";
import * as teamService from "@/backend/src/modules/team/team-service";

const ALLOWED_ROLES = ["admin", "compliance_manager", "security_manager", "viewer"] as const;
type InviteRole = (typeof ALLOWED_ROLES)[number];

export interface OnboardingInvite {
  name: string;
  email: string;
  role: InviteRole;
}

export type InviteOnboardingState = { error?: string; ok?: boolean } | undefined;

/**
 * Sends team invites during onboarding. Called after the org has already been
 * created. Silently skips rows with blank email.
 */
export async function inviteTeamMembersOnboarding(
  invites: OnboardingInvite[]
): Promise<InviteOnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // We need the org the user just created.
  const { findActiveOrgByUser } = await import("@/backend/src/modules/orgs/org-repo");
  const org = await findActiveOrgByUser(user.id);
  if (!org) return { error: "No organization found." };

  const validInvites = invites.filter(
    (i) => i.email.trim().length > 0 && ALLOWED_ROLES.includes(i.role)
  );

  const errors: string[] = [];
  for (const invite of validInvites) {
    try {
      await teamService.inviteMember({
        orgId: org.id,
        actorId: user.id,
        email: invite.email.trim(),
        role: invite.role,
      });
    } catch (err) {
      if (err instanceof DomainError) {
        errors.push(`${invite.email}: ${err.message}`);
      } else {
        console.error("onboarding invite failed:", err);
        errors.push(`${invite.email}: Could not send invite.`);
      }
    }
  }

  if (errors.length > 0) {
    return { error: errors.join(" | ") };
  }
  return { ok: true };
}
