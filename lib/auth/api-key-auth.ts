/**
 * API key authentication for the v1 REST API.
 *
 * Runs in Node.js route handlers (NOT Edge middleware) so it can use the
 * DB client and bcryptjs.
 *
 * Usage in any /api/v1/* route:
 *
 *   const ctx = await validateApiKey(request).catch(() => null);
 *   if (!ctx) return err("Unauthorized", 401);
 */

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export type ApiKeyContext = {
  orgId: string;
  keyId: string;
  permissions: "read_only" | "read_write" | "admin";
};

export class ApiAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiAuthError";
  }
}

/**
 * Validate a Bearer API key from the Authorization header.
 *
 * Algorithm:
 * 1. Extract "Authorization: Bearer lk_live_<hex>" header.
 * 2. Derive the 16-char prefix (fast DB lookup — avoids full-table scan).
 * 3. Find active keys with that prefix.
 * 4. bcrypt.compare() the plain key against each candidate's hash.
 * 5. On match: fire-and-forget lastUsedAt update, return ApiKeyContext.
 * 6. On no match: throw ApiAuthError.
 *
 * Security notes:
 * - The prefix alone is not a secret — it narrows the candidate list but
 *   bcrypt comparison is the real gate.
 * - bcrypt.compare() is intentionally slow (~100ms). Rate limiting sits
 *   above this function so brute-force is infeasible.
 */
export async function validateApiKey(request: Request): Promise<ApiKeyContext> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    throw new ApiAuthError("Missing Authorization: Bearer header.");
  }

  const plainKey = auth.slice(7).trim();
  if (!plainKey.startsWith("lk_live_")) {
    throw new ApiAuthError("Invalid API key format.");
  }

  // First 16 chars are the stored prefix for fast DB lookup
  const keyPrefix = plainKey.slice(0, 16);

  const candidates = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.keyPrefix, keyPrefix), eq(apiKeys.status, "active")));

  for (const candidate of candidates) {
    const match = await bcrypt.compare(plainKey, candidate.keyHash);
    if (match) {
      // Fire-and-forget — don't block the response on this write
      db.update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, candidate.id))
        .catch(() => {});

      return {
        orgId: candidate.organizationId,
        keyId: candidate.id,
        permissions: candidate.permissions,
      };
    }
  }

  throw new ApiAuthError("Invalid or expired API key.");
}
