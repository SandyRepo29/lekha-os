"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { audit, AuditEvent } from "@/lib/audit/audit-events";

export type AuthState = { error?: string } | undefined;

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const redirectTo = String(formData.get("redirect") || "/dashboard");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  // Fire-and-forget audit — never block login on audit failure
  try {
    const userId = data.user?.id;
    if (userId) {
      const { findActiveOrgByUser } = await import("@/lib/repositories/org-repo");
      const activeOrg = await findActiveOrgByUser(userId);
      if (activeOrg) {
        audit({
          organizationId: activeOrg.id,
          actorId: userId,
          action: AuditEvent.AUTH_LOGIN,
          entityType: "profile",
          entityId: userId,
          metadata: { email },
        });
      }
    }
  } catch {
    // audit failure must never block login
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("fullName") || "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  // Fire-and-forget audit for signup
  try {
    const userId = data.user?.id;
    if (userId) {
      const { findActiveOrgByUser } = await import("@/lib/repositories/org-repo");
      const activeOrg = await findActiveOrgByUser(userId);
      // orgId may be null on first signup (org not yet created) — skip if so
      if (activeOrg) {
        audit({
          organizationId: activeOrg.id,
          actorId: userId,
          action: AuditEvent.AUTH_SIGNUP,
          entityType: "profile",
          entityId: userId,
          metadata: { email },
        });
      }
    }
  } catch {
    // audit failure must never block signup
  }

  // If Supabase "Confirm email" is ON, the session is null after signup.
  // Redirect to a confirmation page instead of onboarding (which requires a session).
  if (!data.session) {
    redirect("/signup/confirm");
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  // Capture user before sign out for audit
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { findActiveOrgByUser } = await import("@/lib/repositories/org-repo");
      const activeOrg = await findActiveOrgByUser(user.id);
      if (activeOrg) {
        audit({
          organizationId: activeOrg.id,
          actorId: user.id,
          action: AuditEvent.AUTH_LOGOUT,
          entityType: "profile",
          entityId: user.id,
          metadata: { email: user.email },
        });
      }
    }
  } catch {
    // audit failure must never block logout
  }
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
