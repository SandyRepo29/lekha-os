"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import * as portalRepo from "@/backend/src/modules/vendor-hub/portal-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";

export async function generatePortalLink(vendorId: string): Promise<{ url: string } | { error: string }> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const token = await portalRepo.createPortalToken({
    orgId: session.org.id, vendorId, createdBy: session.id, expiresInDays: 30,
  });
  await recordAudit({
    organizationId: session.org.id, actorId: session.id,
    action: "portal.link_generated", entityType: "vendor", entityId: vendorId,
    metadata: { expiresInDays: 30 },
  });
  revalidatePath(`/vendors/${vendorId}`);
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return { url: `${base}/portal/${token}` };
}
