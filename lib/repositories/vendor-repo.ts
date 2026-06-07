import { and, eq, gte, lte, desc, count } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { vendors, vendorDocuments } from "@/lib/db/schema";
import type { Vendor } from "@/lib/db/schema";

type Risk = "low" | "medium" | "high" | "critical";

export type NewVendor = {
  organizationId: string;
  name: string;
  category: string | null;
  contactEmail: string | null;
  riskLevel: "low" | "medium" | "high" | "critical";
  status: "active" | "pending" | "inactive";
  complianceScore: number;
  createdBy: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerDepartment?: string | null;
};

export async function insertVendor(
  values: NewVendor,
  exec: Executor = db
): Promise<{ id: string }> {
  const [vendor] = await exec.insert(vendors).values(values).returning({ id: vendors.id });
  return vendor;
}

export async function findById(orgId: string, id: string): Promise<Vendor | null> {
  const [vendor] = await db
    .select()
    .from(vendors)
    .where(and(eq(vendors.organizationId, orgId), eq(vendors.id, id)))
    .limit(1);
  return vendor ?? null;
}

export async function updateScore(
  id: string,
  score: number,
  exec: Executor = db
): Promise<void> {
  await exec
    .update(vendors)
    .set({ complianceScore: score, updatedAt: new Date() })
    .where(eq(vendors.id, id));
}

export async function updateVendor(
  id: string,
  values: {
    name?: string; category?: string | null; contactEmail?: string | null;
    riskLevel?: Risk; status?: "active" | "pending" | "inactive";
    notes?: string | null; ownerName?: string | null; ownerEmail?: string | null;
    ownerDepartment?: string | null; aiSummary?: string | null; aiSummaryAt?: Date | null;
    aiScoreExplanation?: string | null; aiScoreExplainedAt?: Date | null;
    aiRiskExplanation?: string | null; aiRiskExplainedAt?: Date | null;
    aiRecommendedActions?: unknown; aiActionsGeneratedAt?: Date | null;
    checklistScore?: number; vendorTypeId?: string | null;
    aiTrustNarrative?: string | null; aiTrustNarrativeAt?: Date | null;
  },
  exec: Executor = db
): Promise<void> {
  await exec.update(vendors).set({ ...values, updatedAt: new Date() }).where(eq(vendors.id, id));
}

export async function countByOrg(orgId: string): Promise<number> {
  const [row] = await db.select({ n: count() }).from(vendors).where(eq(vendors.organizationId, orgId));
  return Number(row?.n ?? 0);
}

export async function findVendorsByOrgPaged(orgId: string, limit: number, offset: number): Promise<Vendor[]> {
  return db.select().from(vendors).where(eq(vendors.organizationId, orgId))
    .orderBy(desc(vendors.createdAt)).limit(limit).offset(offset);
}

export async function deleteById(orgId: string, id: string, exec: Executor = db): Promise<void> {
  await exec
    .delete(vendors)
    .where(and(eq(vendors.organizationId, orgId), eq(vendors.id, id)));
}

export async function findVendorsByOrg(orgId: string): Promise<Vendor[]> {
  return db
    .select()
    .from(vendors)
    .where(eq(vendors.organizationId, orgId))
    .orderBy(desc(vendors.createdAt));
}

export async function countDocuments(orgId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(vendorDocuments)
    .where(eq(vendorDocuments.organizationId, orgId));
  return Number(row?.n ?? 0);
}

export async function countExpiringDocuments(orgId: string, withinDays: number): Promise<number> {
  const today = new Date();
  const until = new Date(Date.now() + withinDays * 86_400_000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const [row] = await db
    .select({ n: count() })
    .from(vendorDocuments)
    .where(
      and(
        eq(vendorDocuments.organizationId, orgId),
        gte(vendorDocuments.expiresOn, fmt(today)),
        lte(vendorDocuments.expiresOn, fmt(until))
      )
    );
  return Number(row?.n ?? 0);
}
