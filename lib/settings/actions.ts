"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import * as settingsService from "@/lib/services/settings-service";

export type SettingsState = { error?: string; ok?: boolean } | undefined;

export async function updateProfile(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const session = await requireUser();
  if (session.demo) return { error: "Not available in demo mode." };

  try {
    await settingsService.updateProfile({
      userId: session.id,
      fullName: String(formData.get("fullName") || ""),
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("updateProfile failed:", err);
    return { error: "Could not update your profile." };
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateOrgName(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const session = await requireUser();
  if (session.demo) return { error: "Not available in demo mode." };
  if (!session.org) return { error: "No active organization." };
  if (session.org.role !== "owner" && session.org.role !== "admin") {
    return { error: "Only owners and admins can rename the organization." };
  }

  try {
    await settingsService.updateOrgName({
      orgId: session.org.id,
      actorId: session.id,
      name: String(formData.get("name") || ""),
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("updateOrgName failed:", err);
    return { error: "Could not update the organization name." };
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}
