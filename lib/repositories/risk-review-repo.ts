import { and, eq, desc } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { riskReviews } from "@/lib/db/schema";
import type { RiskReview } from "@/lib/db/schema";

export type NewRiskReview = {
  organizationId: string;
  riskId: string;
  reviewerId?: string | null;
  reviewDate: string;
  outcome: string;
  notes?: string | null;
  previousStatus?: RiskReview["previousStatus"];
  newStatus?: RiskReview["newStatus"];
  previousScore?: number | null;
  newScore?: number | null;
};

export async function insertReview(
  values: NewRiskReview,
  exec: Executor = db
): Promise<{ id: string }> {
  const [row] = await exec.insert(riskReviews).values(values).returning({ id: riskReviews.id });
  return row;
}

export async function findByRisk(riskId: string): Promise<RiskReview[]> {
  return db
    .select()
    .from(riskReviews)
    .where(eq(riskReviews.riskId, riskId))
    .orderBy(desc(riskReviews.reviewDate));
}

export async function findByOrg(orgId: string): Promise<RiskReview[]> {
  return db
    .select()
    .from(riskReviews)
    .where(eq(riskReviews.organizationId, orgId))
    .orderBy(desc(riskReviews.createdAt));
}
