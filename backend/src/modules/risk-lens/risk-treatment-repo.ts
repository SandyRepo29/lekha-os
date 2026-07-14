import { and, eq, desc, count } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { riskTreatments } from "@/lib/db/schema";
import type { RiskTreatment } from "@/lib/db/schema";

export type NewRiskTreatment = {
  organizationId: string;
  riskId: string;
  action: string;
  description?: string | null;
  ownerId?: string | null;
  targetDate?: string | null;
  status?: RiskTreatment["status"];
  progressPercent?: number;
  evidence?: string | null;
  createdBy?: string | null;
};

export async function insertTreatment(
  values: NewRiskTreatment,
  exec: Executor = db
): Promise<{ id: string }> {
  const [row] = await exec
    .insert(riskTreatments)
    .values(values)
    .returning({ id: riskTreatments.id });
  return row;
}

export async function findByRisk(riskId: string): Promise<RiskTreatment[]> {
  return db
    .select()
    .from(riskTreatments)
    .where(eq(riskTreatments.riskId, riskId))
    .orderBy(desc(riskTreatments.createdAt));
}

export async function findByOrg(
  orgId: string,
  filters?: { riskId?: string; status?: string }
): Promise<RiskTreatment[]> {
  return db
    .select()
    .from(riskTreatments)
    .where(
      and(
        eq(riskTreatments.organizationId, orgId),
        filters?.riskId ? eq(riskTreatments.riskId, filters.riskId) : undefined,
        filters?.status ? eq(riskTreatments.status, filters.status as RiskTreatment["status"]) : undefined
      )
    )
    .orderBy(desc(riskTreatments.createdAt));
}

export async function updateTreatment(
  id: string,
  values: Partial<{
    action: string;
    description: string | null;
    ownerId: string | null;
    targetDate: string | null;
    status: RiskTreatment["status"];
    progressPercent: number;
    evidence: string | null;
    completedAt: Date | null;
  }>,
  exec: Executor = db
): Promise<void> {
  await exec
    .update(riskTreatments)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(riskTreatments.id, id));
}

export async function deleteTreatment(
  orgId: string,
  id: string,
  exec: Executor = db
): Promise<void> {
  await exec
    .delete(riskTreatments)
    .where(and(eq(riskTreatments.organizationId, orgId), eq(riskTreatments.id, id)));
}
