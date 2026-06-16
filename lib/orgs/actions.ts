"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DomainError } from "@/lib/services/errors";
import * as orgService from "@/lib/services/org-service";

export type OrgState = { error?: string } | undefined;

/**
 * Transport adapter: authenticate, delegate to the org service, then handle
 * navigation. No business logic lives here.
 */
export async function createOrganization(
  _prev: OrgState,
  formData: FormData
): Promise<OrgState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Already onboarded — nothing to do.
  if (await orgService.getActiveOrg(user.id)) redirect("/dashboard");

  try {
    await orgService.createOrganization({
      actorId: user.id,
      name: String(formData.get("name") || ""),
      industry: String(formData.get("industry") || "") || undefined,
      companySize: String(formData.get("companySize") || "") || undefined,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("createOrganization failed:", err);
    return { error: "Could not create your workspace. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
