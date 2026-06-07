import { and, eq, desc, count, sql, inArray } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { risks, profiles } from "@/lib/db/schema";
import type { Risk } from "@/lib/db/schema";

export type NewRisk = {
  organizationId: string;
  title: string;
  description?: string | null;
  category?: Risk["category"];
  status?: Risk["status"];
  ownerId?: string | null;
  source?: Risk["source"];
  impact?: number;
  likelihood?: number;
  inherentScore?: number;
  residualScore?: number | null;
  treatmentStrategy?: Risk["treatmentStrategy"];
  targetDate?: string | null;
  identifiedDate?: string | null;
  nextReviewDate?: string | null;
  sourceVendorId?: string | null;
  sourceFindingId?: string | null;
  sourceGapId?: string | null;
  createdBy?: string | null;
};

export type RiskWithOwner = Risk & { ownerName: string | null; ownerEmail: string | null };

export async function insertRisk(
  values: NewRisk,
  exec: Executor = db
): Promise<{ id: string }> {
  const [row] = await exec.insert(risks).values(values).returning({ id: risks.id });
  return row;
}

export async function findByOrg(
  orgId: string,
  filters?: { status?: string; category?: string }
): Promise<RiskWithOwner[]> {
  const rows = await db
    .select({
      risk: risks,
      ownerName: profiles.fullName,
      ownerEmail: profiles.email,
    })
    .from(risks)
    .leftJoin(profiles, eq(risks.ownerId, profiles.id))
    .where(
      and(
        eq(risks.organizationId, orgId),
        filters?.status ? eq(risks.status, filters.status as Risk["status"]) : undefined,
        filters?.category ? eq(risks.category, filters.category as Risk["category"]) : undefined
      )
    )
    .orderBy(desc(risks.inherentScore), desc(risks.createdAt));

  return rows.map((r) => ({
    ...r.risk,
    ownerName: r.ownerName ?? null,
    ownerEmail: r.ownerEmail ?? null,
  }));
}

export async function findById(
  orgId: string,
  id: string
): Promise<RiskWithOwner | null> {
  const [row] = await db
    .select({
      risk: risks,
      ownerName: profiles.fullName,
      ownerEmail: profiles.email,
    })
    .from(risks)
    .leftJoin(profiles, eq(risks.ownerId, profiles.id))
    .where(and(eq(risks.organizationId, orgId), eq(risks.id, id)))
    .limit(1);
  if (!row) return null;
  return { ...row.risk, ownerName: row.ownerName ?? null, ownerEmail: row.ownerEmail ?? null };
}

export async function updateRisk(
  id: string,
  values: Partial<Omit<NewRisk, "organizationId" | "createdBy"> & {
    status: Risk["status"];
    aiNarrative: string | null;
    aiNarrativeAt: Date | null;
    lastReviewedDate: string | null;
  }>,
  exec: Executor = db
): Promise<void> {
  await exec.update(risks).set({ ...values, updatedAt: new Date() }).where(eq(risks.id, id));
}

export async function deleteRisk(
  orgId: string,
  id: string,
  exec: Executor = db
): Promise<void> {
  await exec.delete(risks).where(and(eq(risks.organizationId, orgId), eq(risks.id, id)));
}

export async function countByStatus(orgId: string): Promise<Record<string, number>> {
  const rows = await db
    .select({ status: risks.status, count: count() })
    .from(risks)
    .where(eq(risks.organizationId, orgId))
    .groupBy(risks.status);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.status] = r.count;
  return out;
}

export async function countByCategory(orgId: string): Promise<Record<string, number>> {
  const rows = await db
    .select({ category: risks.category, count: count() })
    .from(risks)
    .where(eq(risks.organizationId, orgId))
    .groupBy(risks.category);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.category] = r.count;
  return out;
}

export async function countOverdueReviews(orgId: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const [row] = await db
    .select({ count: count() })
    .from(risks)
    .where(
      and(
        eq(risks.organizationId, orgId),
        sql`${risks.nextReviewDate} < ${today}`,
        sql`${risks.status} NOT IN ('closed','archived')`
      )
    );
  return row?.count ?? 0;
}

export async function findActiveByVendor(orgId: string, vendorId: string): Promise<Risk[]> {
  return db
    .select()
    .from(risks)
    .where(
      and(
        eq(risks.organizationId, orgId),
        eq(risks.sourceVendorId, vendorId),
        sql`${risks.status} NOT IN ('closed','archived')`
      )
    )
    .orderBy(desc(risks.inherentScore));
}
