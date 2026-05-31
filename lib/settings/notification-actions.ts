"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import * as notifRepo from "@/lib/repositories/notification-repo";

export type NotifState = { error?: string; ok?: boolean } | undefined;

export async function updateNotificationPreferences(_prev: NotifState, formData: FormData): Promise<NotifState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const expiryAlertsEnabled = formData.get("expiryAlertsEnabled") === "1";
  const weeklyDigestEnabled = formData.get("weeklyDigestEnabled") === "1";
  const extraEmailsRaw = String(formData.get("recipientEmails") || "");
  const recipientEmails = extraEmailsRaw
    .split(/[\n,]+/)
    .map((e) => e.trim())
    .filter((e) => e.includes("@"))
    .slice(0, 10);

  const daysRaw = String(formData.get("alertDaysBefore") || "");
  const alertDaysBefore = daysRaw
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0 && n <= 365)
    .sort((a, b) => b - a)
    .slice(0, 10);

  await notifRepo.upsertPreferences(session.org.id, {
    expiryAlertsEnabled,
    weeklyDigestEnabled,
    recipientEmails: recipientEmails.length ? recipientEmails : [],
    alertDaysBefore: alertDaysBefore.length ? alertDaysBefore : [90, 60, 30, 15, 7],
  });

  revalidatePath("/settings/notifications");
  return { ok: true };
}

export async function sendTestEmail(): Promise<NotifState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const { isResendConfigured, getResend, FROM } = await import("@/lib/email/resend");
  const { expiryAlertHtml } = await import("@/lib/email/templates");
  if (!isResendConfigured()) return { error: "RESEND_API_KEY not configured." };

  const { subject, html } = expiryAlertHtml({
    orgName: session.orgName,
    vendorName: "Razorpay Software (Test)",
    documentType: "ISO/IEC 27001",
    expiresOn: new Date(Date.now() + 15 * 86_400_000).toISOString().slice(0, 10),
    daysLeft: 15,
    vendorUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/vendors`,
  });

  try {
    const resend = getResend();
    await resend.emails.send({ from: FROM, to: [session.email], subject: `[TEST] ${subject}`, html });
  } catch (err) {
    return { error: `Send failed: ${err instanceof Error ? err.message : String(err)}` };
  }

  return { ok: true };
}
