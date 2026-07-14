import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import type { ApiKey } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export type SafeApiKey = Omit<ApiKey, "keyHash">;

export type NewApiKey = {
  organizationId: string;
  createdBy: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  permissions: "read_only" | "read_write" | "admin";
};

export async function create(values: NewApiKey): Promise<{ id: string }> {
  const [row] = await db
    .insert(apiKeys)
    .values(values)
    .returning({ id: apiKeys.id });
  return row;
}

export async function list(orgId: string): Promise<SafeApiKey[]> {
  const rows = await db
    .select({
      id: apiKeys.id,
      organizationId: apiKeys.organizationId,
      createdBy: apiKeys.createdBy,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      permissions: apiKeys.permissions,
      lastUsedAt: apiKeys.lastUsedAt,
      status: apiKeys.status,
      revokedAt: apiKeys.revokedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.organizationId, orgId))
    .orderBy(apiKeys.createdAt);
  return rows;
}

export async function findById(id: string, orgId: string): Promise<ApiKey | null> {
  const [row] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.organizationId, orgId)))
    .limit(1);
  return row ?? null;
}

export async function revoke(id: string, orgId: string): Promise<void> {
  await db
    .update(apiKeys)
    .set({ status: "revoked", revokedAt: new Date() })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.organizationId, orgId)));
}

export async function updateKeyHash(
  id: string,
  orgId: string,
  keyPrefix: string,
  keyHash: string
): Promise<void> {
  await db
    .update(apiKeys)
    .set({ keyPrefix, keyHash, status: "active", revokedAt: null, lastUsedAt: null })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.organizationId, orgId)));
}
