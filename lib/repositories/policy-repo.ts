import { and, eq, desc } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import { policies, policyVersions } from "@/lib/db/schema";
import type { Policy, PolicyVersion } from "@/lib/db/schema";

export type NewPolicy = {
  organizationId: string;
  name: string;
  policyType?: string | null;
  version?: string;
  owner?: string | null;
  status?: "draft" | "review" | "approved" | "archived" | "expired";
  reviewDate?: string | null;
  approvalDate?: string | null;
  approver?: string | null;
  storagePath?: string | null;
  createdBy?: string | null;
};

export type NewPolicyVersion = {
  policyId: string;
  version: string;
  storagePath?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  approvedAt?: Date | null;
};

export async function insertPolicy(
  values: NewPolicy,
  exec: Executor = db
): Promise<{ id: string }> {
  const [row] = await exec
    .insert(policies)
    .values(values)
    .returning({ id: policies.id });
  return row;
}

export async function findByOrg(orgId: string): Promise<Policy[]> {
  return db
    .select()
    .from(policies)
    .where(eq(policies.organizationId, orgId))
    .orderBy(desc(policies.createdAt));
}

export async function findById(orgId: string, id: string): Promise<Policy | null> {
  const [row] = await db
    .select()
    .from(policies)
    .where(and(eq(policies.organizationId, orgId), eq(policies.id, id)))
    .limit(1);
  return row ?? null;
}

export async function updatePolicy(
  id: string,
  values: Partial<{
    name: string;
    policyType: string | null;
    version: string;
    owner: string | null;
    status: "draft" | "review" | "approved" | "archived" | "expired";
    reviewDate: string | null;
    approvalDate: string | null;
    approver: string | null;
    storagePath: string | null;
  }>,
  exec: Executor = db
): Promise<void> {
  await exec
    .update(policies)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(policies.id, id));
}

export async function deletePolicy(
  orgId: string,
  id: string,
  exec: Executor = db
): Promise<void> {
  await exec
    .delete(policies)
    .where(and(eq(policies.organizationId, orgId), eq(policies.id, id)));
}

export async function insertVersion(
  values: NewPolicyVersion,
  exec: Executor = db
): Promise<{ id: string }> {
  const [row] = await exec
    .insert(policyVersions)
    .values(values)
    .returning({ id: policyVersions.id });
  return row;
}

export async function findVersionsByPolicy(policyId: string): Promise<PolicyVersion[]> {
  return db
    .select()
    .from(policyVersions)
    .where(eq(policyVersions.policyId, policyId))
    .orderBy(desc(policyVersions.createdAt));
}

/** Count of approved policies — used for readiness scoring. */
export async function countApproved(orgId: string): Promise<number> {
  const rows = await db
    .select({ id: policies.id })
    .from(policies)
    .where(and(eq(policies.organizationId, orgId), eq(policies.status, "approved")));
  return rows.length;
}
