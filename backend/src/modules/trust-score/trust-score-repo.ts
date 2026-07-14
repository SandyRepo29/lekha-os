import { eq, and, desc, avg, asc } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { vendors, vendorTrustHistory } from "@/lib/db/schema";
import type { VendorTrustHistory } from "@/lib/db/schema";

export type TrustHistoryInsert = {
  organizationId: string;
  vendorId: string;
  overallScore: number;
  evidenceScore: number;
  complianceScore: number;
  riskScore: number;
  assessmentScore: number;
  operationalScore: number;
  freshnessScore: number;
  triggerEvent?: string;
};

/** Save a new trust score snapshot and update the vendor's cached score. */
export async function saveTrustScore(values: TrustHistoryInsert, exec: Executor = db): Promise<void> {
  await exec.transaction(async (tx) => {
    await tx.insert(vendorTrustHistory).values(values);
    await tx
      .update(vendors)
      .set({ trustScore: values.overallScore, trustScoreAt: new Date(), updatedAt: new Date() })
      .where(eq(vendors.id, values.vendorId));
  });
}

/** Return recent trust history snapshots for a vendor (newest first). */
export async function getTrustHistory(
  orgId: string,
  vendorId: string,
  limit = 30
): Promise<VendorTrustHistory[]> {
  return db
    .select()
    .from(vendorTrustHistory)
    .where(and(eq(vendorTrustHistory.organizationId, orgId), eq(vendorTrustHistory.vendorId, vendorId)))
    .orderBy(desc(vendorTrustHistory.snapshotAt))
    .limit(limit);
}

/** Aggregate trust score stats across all vendors in an org. */
export async function getOrgTrustMetrics(orgId: string): Promise<{
  avgScore: number;
  topVendors: Array<{ id: string; name: string; trustScore: number }>;
  lowVendors: Array<{ id: string; name: string; trustScore: number }>;
}> {
  const rows = await db
    .select({ id: vendors.id, name: vendors.name, trustScore: vendors.trustScore })
    .from(vendors)
    .where(and(eq(vendors.organizationId, orgId), eq(vendors.status, "active")));

  const scored = rows.filter((v) => v.trustScore !== null) as Array<{ id: string; name: string; trustScore: number }>;
  if (scored.length === 0) return { avgScore: 0, topVendors: [], lowVendors: [] };

  const avg = Math.round(scored.reduce((s, v) => s + v.trustScore, 0) / scored.length);
  const sorted = [...scored].sort((a, b) => b.trustScore - a.trustScore);

  return {
    avgScore: avg,
    topVendors: sorted.slice(0, 5),
    lowVendors: sorted.slice(-5).reverse(),
  };
}
