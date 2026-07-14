import { eq, and, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { notificationPreferences, notificationHistory } from "@/lib/db/schema";
import type { NotificationPreferences } from "@/lib/db/schema";

export async function getPreferences(orgId: string): Promise<NotificationPreferences | null> {
  const [row] = await db.select().from(notificationPreferences)
    .where(eq(notificationPreferences.organizationId, orgId)).limit(1);
  return row ?? null;
}

export async function upsertPreferences(
  orgId: string,
  values: Partial<Pick<NotificationPreferences, "expiryAlertsEnabled" | "weeklyDigestEnabled" | "recipientEmails" | "alertDaysBefore">>
): Promise<void> {
  await db.insert(notificationPreferences)
    .values({ organizationId: orgId, ...values, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: notificationPreferences.organizationId,
      set: { ...values, updatedAt: new Date() },
    });
}

/** True if we've already sent this notification type for this entity recently. */
export async function alreadySent(
  orgId: string,
  type: string,
  entityId: string | null,
  withinHours = 20
): Promise<boolean> {
  const since = new Date(Date.now() - withinHours * 3_600_000);
  const conditions = entityId
    ? and(eq(notificationHistory.organizationId, orgId), eq(notificationHistory.notificationType, type), eq(notificationHistory.entityId, entityId as any), gte(notificationHistory.sentAt, since))
    : and(eq(notificationHistory.organizationId, orgId), eq(notificationHistory.notificationType, type), gte(notificationHistory.sentAt, since));

  const [row] = await db.select({ id: notificationHistory.id }).from(notificationHistory).where(conditions!).limit(1);
  return !!row;
}

export async function recordSent(values: {
  orgId: string; notificationType: string; entityId?: string | null; sentTo: string[]; resendId?: string | null;
}): Promise<void> {
  await db.insert(notificationHistory).values({
    organizationId: values.orgId,
    notificationType: values.notificationType,
    entityId: values.entityId ?? null,
    sentTo: values.sentTo,
    resendId: values.resendId ?? null,
  });
}
