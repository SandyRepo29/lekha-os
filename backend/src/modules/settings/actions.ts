"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import * as settingsService from "@/backend/src/modules/settings/settings-service";
import * as apiKeyService from "@/backend/src/modules/settings/api-key-service";
import * as integrationService from "@/backend/src/modules/settings/integration-service";
import { createClient } from "@/lib/supabase/server";
import type { Integration } from "@/lib/db/schema";

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
      jobTitle: String(formData.get("jobTitle") || ""),
      department: String(formData.get("department") || ""),
      phone: String(formData.get("phone") || ""),
      timezone: String(formData.get("timezone") || ""),
      language: String(formData.get("language") || ""),
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

export async function updateOrgProfile(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const session = await requireUser();
  if (session.demo) return { error: "Not available in demo mode." };
  if (!session.org) return { error: "No active organization." };
  if (session.org.role !== "owner" && session.org.role !== "admin") {
    return { error: "Only owners and admins can update the organization." };
  }

  try {
    await settingsService.updateOrgProfile({
      orgId: session.org.id,
      actorId: session.id,
      name: String(formData.get("name") || ""),
      legalName: String(formData.get("legalName") || ""),
      industry: String(formData.get("industry") || ""),
      companySize: String(formData.get("companySize") || ""),
      website: String(formData.get("website") || ""),
      country: String(formData.get("country") || ""),
      state: String(formData.get("state") || ""),
      timezone: String(formData.get("timezone") || ""),
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not update organization." };
  }

  revalidatePath("/settings/organization");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateOrgBranding(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const session = await requireUser();
  if (session.demo) return { error: "Not available in demo mode." };
  if (!session.org) return { error: "No active organization." };
  if (session.org.role !== "owner" && session.org.role !== "admin") {
    return { error: "Only owners and admins can update branding." };
  }

  try {
    await settingsService.updateOrgBranding({
      orgId: session.org.id,
      actorId: session.id,
      primaryColor: String(formData.get("primaryColor") || ""),
      accentColor: String(formData.get("accentColor") || ""),
      reportFooter: String(formData.get("reportFooter") || ""),
      emailSignature: String(formData.get("emailSignature") || ""),
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not update branding." };
  }

  revalidatePath("/settings/organization");
  return { ok: true };
}

// ---- Password ----

export async function changePassword(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const session = await requireUser();
  if (session.demo) return { error: "Not available in demo mode." };

  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");
  if (password !== confirm) return { error: "Passwords do not match." };

  // Validate against org password policy (throws DomainError on violation)
  if (session.org) {
    try {
      const { validateNewPassword, recordPasswordChange } = await import(
        "@/backend/src/modules/enterprise-security/password-policy-service"
      );
      await validateNewPassword(session.org.id, session.id, password);
      const supabase = await createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { error: error.message };
      await recordPasswordChange(session.org.id, session.id, password);
      return { ok: true };
    } catch (err) {
      if (err instanceof DomainError) return { error: err.message };
      console.error("changePassword failed:", err);
      return { error: "Could not update password." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { ok: true };
}

// ---- API Keys ----

export type ApiKeyState = { error?: string; ok?: boolean; plainKey?: string } | undefined;

export async function createApiKey(
  _prev: ApiKeyState,
  formData: FormData
): Promise<ApiKeyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  if (session.org.role !== "owner" && session.org.role !== "admin") {
    return { error: "Only owners and admins can manage API keys." };
  }

  try {
    const result = await apiKeyService.createKey({
      orgId: session.org.id,
      actorId: session.id,
      name: String(formData.get("name") || ""),
      permissions: String(formData.get("permissions") || "read_only") as "read_only" | "read_write" | "admin",
    });
    revalidatePath("/settings/api-keys");
    return { ok: true, plainKey: result.plainKey };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not create API key." };
  }
}

export async function revokeApiKey(keyId: string): Promise<ApiKeyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await apiKeyService.revokeKey({ orgId: session.org.id, actorId: session.id, keyId });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not revoke key." };
  }

  revalidatePath("/settings/api-keys");
  return { ok: true };
}

export async function rotateApiKey(keyId: string): Promise<ApiKeyState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    const result = await apiKeyService.rotateKey({ orgId: session.org.id, actorId: session.id, keyId });
    revalidatePath("/settings/api-keys");
    return { ok: true, plainKey: result.plainKey };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not rotate key." };
  }
}

// ---- Integrations ----

export type IntegrationState = { error?: string; ok?: boolean } | undefined;

export async function connectIntegration(
  _prev: IntegrationState,
  formData: FormData
): Promise<IntegrationState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  if (session.org.role !== "owner" && session.org.role !== "admin") {
    return { error: "Only owners and admins can manage integrations." };
  }

  const provider = String(formData.get("provider") || "") as Integration["provider"];
  const config: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    if (key !== "provider") config[key] = String(value);
  });

  try {
    await integrationService.connectIntegration({
      orgId: session.org.id,
      actorId: session.id,
      provider,
      config,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not connect integration." };
  }

  revalidatePath("/settings/integrations");
  return { ok: true };
}

export async function disconnectIntegration(provider: Integration["provider"]): Promise<IntegrationState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await integrationService.disconnectIntegration({
      orgId: session.org.id,
      actorId: session.id,
      provider,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not disconnect integration." };
  }

  revalidatePath("/settings/integrations");
  return { ok: true };
}
