export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { db } from "@/lib/db";
import { trustProfiles, trustBadges, trustDocuments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { recordUsage } from "@/lib/repositories/trust-api-repo";

export async function GET(request: NextRequest) {
  const start = Date.now();
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  try {
    const [profile, badges, docs] = await Promise.all([
      db.select({
        displayName: trustProfiles.displayName, tagline: trustProfiles.tagline,
        industry: trustProfiles.industry, country: trustProfiles.country,
        visibility: trustProfiles.visibility, profileCompleteness: trustProfiles.profileCompleteness,
        isPublished: trustProfiles.isPublished, trustScore: trustProfiles.trustScore,
      }).from(trustProfiles).where(eq(trustProfiles.organizationId, ctx.orgId)).limit(1).catch(() => []),
      db.select({ badgeType: trustBadges.badgeType, isActive: trustBadges.isActive }).from(trustBadges).where(eq(trustBadges.organizationId, ctx.orgId)).catch(() => []),
      db.select({ docType: trustDocuments.docType, visibility: trustDocuments.visibility, isVerified: trustDocuments.isVerified }).from(trustDocuments).where(eq(trustDocuments.organizationId, ctx.orgId)).catch(() => []),
    ]);

    await recordUsage(ctx.orgId, {
      endpoint: "/api/v1/public/trust-network",
      method: "GET",
      statusCode: 200,
      latencyMs: Date.now() - start,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return ok({
      data: { profile: profile[0] ?? null, badges, documents: docs },
      meta: { generated_at: new Date().toISOString() },
    });
  } catch {
    return err("Failed to retrieve trust network data", 500);
  }
}
