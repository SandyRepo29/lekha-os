import { db } from "@/lib/db";
import { integrations } from "@/lib/db/schema";
import type { Integration } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const ALL_PROVIDERS: Array<{
  provider: Integration["provider"];
  displayName: string;
}> = [
  { provider: "resend",           displayName: "Resend" },
  { provider: "smtp",             displayName: "SMTP" },
  { provider: "google_workspace", displayName: "Google Workspace" },
  { provider: "microsoft_365",    displayName: "Microsoft 365" },
  { provider: "slack",            displayName: "Slack" },
  { provider: "teams",            displayName: "Microsoft Teams" },
  { provider: "whatsapp",         displayName: "WhatsApp" },
  { provider: "google_drive",     displayName: "Google Drive" },
  { provider: "onedrive",         displayName: "OneDrive" },
  { provider: "sharepoint",       displayName: "SharePoint" },
];

export async function listByOrg(orgId: string): Promise<Integration[]> {
  return db
    .select()
    .from(integrations)
    .where(eq(integrations.organizationId, orgId))
    .orderBy(integrations.provider);
}

/** Ensure all provider rows exist for the org (disconnected by default). */
export async function initProviders(orgId: string): Promise<void> {
  await db
    .insert(integrations)
    .values(
      ALL_PROVIDERS.map((p) => ({
        organizationId: orgId,
        provider: p.provider,
        displayName: p.displayName,
        status: "disconnected" as const,
      }))
    )
    .onConflictDoNothing();
}

export async function upsert(
  orgId: string,
  provider: Integration["provider"],
  values: {
    config?: Record<string, unknown>;
    status: Integration["status"];
    connectedAt?: Date | null;
  }
): Promise<void> {
  await db
    .insert(integrations)
    .values({
      organizationId: orgId,
      provider,
      displayName: ALL_PROVIDERS.find((p) => p.provider === provider)?.displayName ?? provider,
      config: values.config ?? {},
      status: values.status,
      connectedAt: values.connectedAt ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [integrations.organizationId, integrations.provider],
      set: {
        config: values.config ?? {},
        status: values.status,
        connectedAt: values.connectedAt ?? null,
        updatedAt: new Date(),
      },
    });
}

export async function findByProvider(
  orgId: string,
  provider: Integration["provider"]
): Promise<Integration | null> {
  const [row] = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.organizationId, orgId), eq(integrations.provider, provider)))
    .limit(1);
  return row ?? null;
}
