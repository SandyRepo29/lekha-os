"use server";

import { createClient } from "@/lib/supabase/server";

export type PasswordResetState = { ok?: boolean; error?: string } | undefined;

export async function sendPasswordResetAction(
  _prev: PasswordResetState,
  formData: FormData
): Promise<PasswordResetState> {
  const email = String(formData.get("email") || "").trim();

  if (!email) {
    return { error: "Please enter your email address." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const redirectTo = `${siteUrl}/auth/callback?next=/auth/reset-password`;

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  // Always return ok — never reveal whether the email exists
  return { ok: true };
}

export async function resetPasswordAction(
  _prev: PasswordResetState,
  formData: FormData
): Promise<PasswordResetState> {
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message };

  // Fire-and-forget audit — never block password reset on failure
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { findActiveOrgByUser } = await import("@/backend/src/modules/orgs/org-repo");
      const { audit, AuditEvent } = await import("@/lib/audit/audit-events");
      const activeOrg = await findActiveOrgByUser(user.id);
      if (activeOrg) {
        audit({
          organizationId: activeOrg.id,
          actorId: user.id,
          action: AuditEvent.AUTH_PASSWORD_RESET,
          entityType: "profile",
          entityId: user.id,
          metadata: {},
        });
      }
    }
  } catch {
    // audit failure must never block password reset
  }

  return { ok: true };
}
