import { db } from "@/lib/db";
import { loginHistory } from "@/lib/db/schema";
import type { LoginHistory } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export type NewLoginHistory = {
  organizationId: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  status?: string;
};

export async function insert(values: NewLoginHistory): Promise<void> {
  await db.insert(loginHistory).values(values);
}

export async function listByUser(userId: string, limit = 20): Promise<LoginHistory[]> {
  return db
    .select()
    .from(loginHistory)
    .where(eq(loginHistory.userId, userId))
    .orderBy(desc(loginHistory.createdAt))
    .limit(limit);
}

export async function listByOrg(orgId: string, limit = 50): Promise<LoginHistory[]> {
  return db
    .select()
    .from(loginHistory)
    .where(eq(loginHistory.organizationId, orgId))
    .orderBy(desc(loginHistory.createdAt))
    .limit(limit);
}
