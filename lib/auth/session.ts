import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import * as orgService from "@/backend/src/modules/orgs/org-service";
import type { ActiveOrg } from "@/backend/src/modules/orgs/org-service";

export type AuthUser = { id: string; email: string; demo: boolean };
export type Session = AuthUser & { org: ActiveOrg | null; orgName: string };

const DEMO_SESSION: Session = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "demo@lekhaos.in",
  demo: true,
  org: { id: "demo", name: "Acme Technologies (Demo)", slug: "acme", role: "owner" },
  orgName: "Acme Technologies (Demo)",
};

/**
 * Returns the authenticated user, redirecting to /login if there is none.
 * Does NOT resolve the org (so it's safe to call from the onboarding page).
 * Before Supabase is connected, returns a demo identity.
 */
export async function requireAuthUser(): Promise<AuthUser> {
  if (!isSupabaseConfigured()) {
    return { id: DEMO_SESSION.id, email: DEMO_SESSION.email, demo: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return { id: user.id, email: user.email ?? "", demo: false };
}

/** The user's active organization (first membership), or null if none yet. */
export function getActiveOrg(userId: string): Promise<ActiveOrg | null> {
  return orgService.getActiveOrg(userId);
}

/**
 * Resolves the full session for authenticated app routes. Redirects to
 * /login if signed out, or to /onboarding if the user has no organization.
 */
export async function requireUser(): Promise<Session> {
  const user = await requireAuthUser();
  if (user.demo) return DEMO_SESSION;

  const org = await orgService.getActiveOrg(user.id);
  if (!org) redirect("/onboarding");

  return { ...user, org, orgName: org.name };
}
