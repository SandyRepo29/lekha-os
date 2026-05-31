import { eq, and, lte, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { vendors, vendorDocuments, memberships, profiles } from "@/lib/db/schema";
import * as notifRepo from "@/lib/repositories/notification-repo";
import { getResend, FROM, isResendConfigured } from "@/lib/email/resend";
import { expiryAlertHtml, weeklyDigestHtml } from "@/lib/email/templates";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lekha-os.vercel.app";

/** Get admin/owner email addresses for an org (capped at 5). */
async function getOrgAdminEmails(orgId: string): Promise<string[]> {
  const rows = await db
    .select({ email: profiles.email })
    .from(memberships)
    .innerJoin(profiles, eq(memberships.userId, profiles.id))
    .where(and(
      eq(memberships.organizationId, orgId),
      eq(memberships.isActive, true),
    ))
    .limit(5);
  return rows.map((r) => r.email);
}

/** Build the final recipient list: prefs extras + org admins, deduped. */
async function buildRecipients(orgId: string, prefs: Awaited<ReturnType<typeof notifRepo.getPreferences>>): Promise<string[]> {
  const extras = (prefs?.recipientEmails as string[] | null) ?? [];
  const admins = await getOrgAdminEmails(orgId);
  return [...new Set([...extras, ...admins])].filter(Boolean).slice(0, 10);
}

/* ============================================================
   Expiry alert engine
   ============================================================ */

export async function runExpiryAlerts(): Promise<{ sent: number; skipped: number; errors: number }> {
  if (!isResendConfigured()) return { sent: 0, skipped: 0, errors: 0 };

  let sent = 0, skipped = 0, errors = 0;

  // Find all orgs that have expiry alerts enabled
  const orgs = await db.selectDistinct({ id: vendors.organizationId }).from(vendors);

  for (const { id: orgId } of orgs) {
    const prefs = await notifRepo.getPreferences(orgId);
    if (prefs && !prefs.expiryAlertsEnabled) { skipped++; continue; }

    const daysBefore: number[] = (prefs?.alertDaysBefore as number[] | null) ?? [90, 60, 30, 15, 7];
    const today = new Date();

    for (const days of daysBefore) {
      // Documents expiring exactly `days` days from today (±12h window)
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + days);
      const dateStr = targetDate.toISOString().slice(0, 10);

      const expiringDocs = await db
        .select({
          docId: vendorDocuments.id,
          documentType: vendorDocuments.documentType,
          expiresOn: vendorDocuments.expiresOn,
          vendorId: vendorDocuments.vendorId,
          vendorName: vendors.name,
        })
        .from(vendorDocuments)
        .innerJoin(vendors, eq(vendorDocuments.vendorId, vendors.id))
        .where(and(
          eq(vendorDocuments.organizationId, orgId),
          eq(vendorDocuments.expiresOn, dateStr),
        ));

      for (const doc of expiringDocs) {
        const notifType = `expiry_alert_${days}d`;
        const alreadyDone = await notifRepo.alreadySent(orgId, notifType, doc.docId);
        if (alreadyDone) { skipped++; continue; }

        const recipients = await buildRecipients(orgId, prefs);
        if (recipients.length === 0) { skipped++; continue; }

        const vendorUrl = `${SITE_URL}/vendors/${doc.vendorId}`;
        const { subject, html } = expiryAlertHtml({
          orgName: orgId, // we'll look up org name below
          vendorName: doc.vendorName,
          documentType: doc.documentType,
          expiresOn: doc.expiresOn ?? dateStr,
          daysLeft: days,
          vendorUrl,
        });

        try {
          const resend = getResend();
          const { data } = await resend.emails.send({ from: FROM, to: recipients, subject, html });
          await notifRepo.recordSent({ orgId, notificationType: notifType, entityId: doc.docId, sentTo: recipients, resendId: data?.id });
          sent++;
        } catch (err) {
          console.error(`Expiry alert failed for doc ${doc.docId}:`, err);
          errors++;
        }
      }
    }

    // Also alert for already-expired docs (once per day)
    const expiredDocs = await db
      .select({ docId: vendorDocuments.id, documentType: vendorDocuments.documentType, expiresOn: vendorDocuments.expiresOn, vendorId: vendorDocuments.vendorId, vendorName: vendors.name })
      .from(vendorDocuments)
      .innerJoin(vendors, eq(vendorDocuments.vendorId, vendors.id))
      .where(and(eq(vendorDocuments.organizationId, orgId), eq(vendorDocuments.status, "expired")));

    for (const doc of expiredDocs) {
      const alreadyDone = await notifRepo.alreadySent(orgId, "expiry_alert_expired", doc.docId, 20);
      if (alreadyDone) { skipped++; continue; }
      const recipients = await buildRecipients(orgId, prefs);
      if (!recipients.length) { skipped++; continue; }
      const { subject, html } = expiryAlertHtml({ orgName: orgId, vendorName: doc.vendorName, documentType: doc.documentType, expiresOn: doc.expiresOn ?? "—", daysLeft: -1, vendorUrl: `${SITE_URL}/vendors/${doc.vendorId}` });
      try {
        const resend = getResend();
        const { data } = await resend.emails.send({ from: FROM, to: recipients, subject, html });
        await notifRepo.recordSent({ orgId, notificationType: "expiry_alert_expired", entityId: doc.docId, sentTo: recipients, resendId: data?.id });
        sent++;
      } catch (err) {
        console.error("Expired doc alert failed:", err);
        errors++;
      }
    }
  }

  return { sent, skipped, errors };
}

/* ============================================================
   Weekly digest engine
   ============================================================ */

export async function runWeeklyDigest(): Promise<{ sent: number; skipped: number; errors: number }> {
  if (!isResendConfigured()) return { sent: 0, skipped: 0, errors: 0 };

  let sent = 0, skipped = 0, errors = 0;
  const orgs = await db.selectDistinct({ id: vendors.organizationId }).from(vendors);
  const in30 = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  for (const { id: orgId } of orgs) {
    const prefs = await notifRepo.getPreferences(orgId);
    if (prefs && !prefs.weeklyDigestEnabled) { skipped++; continue; }

    const alreadyDone = await notifRepo.alreadySent(orgId, "weekly_digest", null, 144); // 6 days
    if (alreadyDone) { skipped++; continue; }

    const [allVendors, expiringDocs] = await Promise.all([
      db.select({ id: vendors.id, name: vendors.name, riskLevel: vendors.riskLevel, complianceScore: vendors.complianceScore })
        .from(vendors).where(eq(vendors.organizationId, orgId)),
      db.select({ vendorName: vendors.name, documentType: vendorDocuments.documentType, expiresOn: vendorDocuments.expiresOn })
        .from(vendorDocuments)
        .innerJoin(vendors, eq(vendorDocuments.vendorId, vendors.id))
        .where(and(eq(vendorDocuments.organizationId, orgId), lte(vendorDocuments.expiresOn, in30), gte(vendorDocuments.expiresOn, today))),
    ]);

    const highRisk = allVendors.filter((v) => v.riskLevel === "high" || v.riskLevel === "critical");
    const avgScore = allVendors.length ? Math.round(allVendors.reduce((s, v) => s + v.complianceScore, 0) / allVendors.length) : 0;

    const recipients = await buildRecipients(orgId, prefs);
    if (!recipients.length) { skipped++; continue; }

    const { subject, html } = weeklyDigestHtml({
      orgName: orgId,
      expiringSoon: expiringDocs.map((d) => ({
        vendorName: d.vendorName,
        documentType: d.documentType,
        expiresOn: d.expiresOn ?? "—",
        daysLeft: d.expiresOn ? Math.round((new Date(d.expiresOn).getTime() - Date.now()) / 86_400_000) : 0,
      })),
      highRisk: highRisk.map((v) => ({ vendorName: v.name, riskLevel: v.riskLevel, score: v.complianceScore })),
      missingRequired: [],
      totalVendors: allVendors.length,
      avgScore,
      dashboardUrl: `${SITE_URL}/dashboard`,
    });

    try {
      const resend = getResend();
      const { data } = await resend.emails.send({ from: FROM, to: recipients, subject, html });
      await notifRepo.recordSent({ orgId, notificationType: "weekly_digest", entityId: null, sentTo: recipients, resendId: data?.id });
      sent++;
    } catch (err) {
      console.error(`Weekly digest failed for org ${orgId}:`, err);
      errors++;
    }
  }

  return { sent, skipped, errors };
}
