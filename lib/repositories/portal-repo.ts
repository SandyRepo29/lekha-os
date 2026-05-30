import { eq, and, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { vendorPortalTokens } from "@/lib/db/schema";
import type { VendorPortalToken } from "@/lib/db/schema";
import crypto from "node:crypto";

export type PortalSession = {
  orgId: string;
  vendorId: string;
  tokenId: string;
};

export async function createPortalToken(params: {
  orgId: string;
  vendorId: string;
  createdBy: string;
  expiresInDays?: number;
}): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + (params.expiresInDays ?? 30) * 86_400_000);
  await db.insert(vendorPortalTokens).values({
    organizationId: params.orgId,
    vendorId: params.vendorId,
    token,
    expiresAt,
    createdBy: params.createdBy,
  });
  return token;
}

export async function resolveToken(token: string): Promise<PortalSession | null> {
  const now = new Date();
  const [row] = await db.select()
    .from(vendorPortalTokens)
    .where(and(eq(vendorPortalTokens.token, token), gt(vendorPortalTokens.expiresAt, now)))
    .limit(1);
  if (!row) return null;
  return { orgId: row.organizationId, vendorId: row.vendorId, tokenId: row.id };
}

export async function markTokenUsed(id: string): Promise<void> {
  await db.update(vendorPortalTokens).set({ usedAt: new Date() }).where(eq(vendorPortalTokens.id, id));
}

export async function listActiveTokens(orgId: string, vendorId: string): Promise<VendorPortalToken[]> {
  const now = new Date();
  return db.select().from(vendorPortalTokens)
    .where(and(
      eq(vendorPortalTokens.organizationId, orgId),
      eq(vendorPortalTokens.vendorId, vendorId),
      gt(vendorPortalTokens.expiresAt, now)
    ));
}
