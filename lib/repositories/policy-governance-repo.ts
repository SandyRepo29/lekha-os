import { db } from "@/lib/db";
import {
  policies,
  policyVersions,
  policyReviews,
  policyAttestations,
  policyControls,
  policyFrameworks,
  riskPolicies,
  controls,
  frameworks,
  profiles,
  auditFindings,
  type Policy,
  type PolicyReview,
  type PolicyAttestation,
} from "@/lib/db/schema";
import { and, eq, sql, desc, count, lt, lte } from "drizzle-orm";

export type PolicyWithMeta = Policy & {
  ownerName: string | null;
  ownerEmail: string | null;
  controlCount: number;
  frameworkCount: number;
};

export type PolicyDetail = Policy & {
  ownerName: string | null;
  ownerEmail: string | null;
  versions: Array<typeof policyVersions.$inferSelect & { creatorName: string | null }>;
  reviews: Array<PolicyReview & { reviewerName: string | null }>;
  attestations: Array<PolicyAttestation & { userName: string | null; userEmail: string | null }>;
  linkedControls: Array<{ id: string; controlRef: string; name: string; status: string }>;
  linkedFrameworks: Array<{ id: string; name: string; status: string }>;
  linkedRisks: Array<{ id: string; title: string; status: string }>;
  controlCount: number;
  frameworkCount: number;
};

export type PolicyDashboardMetrics = {
  total: number;
  draft: number;
  review: number;
  approved: number;
  published: number;
  expired: number;
  retired: number;
  archived: number;
  dueSoon: number;
  overdue: number;
  avgHealth: number;
  attestationRate: number;
  weakPolicies: PolicyWithMeta[];
};

export type PolicyHealthInputsRaw = {
  lastReviewDays: number | null;
  status: string;
  controlCount: number;
  attestationRate: number;
  frameworkCount: number;
  openFindingCount: number;
};

/** All policies for an org. */
export async function findPoliciesByOrg(
  orgId: string,
  filters?: { status?: string; policyType?: string; search?: string }
): Promise<PolicyWithMeta[]> {
  const rows = await db
    .select({
      policy: policies,
      ownerName: profiles.fullName,
      ownerEmail: profiles.email,
    })
    .from(policies)
    .leftJoin(profiles, eq(policies.ownerId, profiles.id))
    .where(
      and(
        eq(policies.organizationId, orgId),
        filters?.status ? sql`${policies.status} = ${filters.status}` : undefined,
        filters?.policyType ? eq(policies.policyType, filters.policyType) : undefined,
        filters?.search ? sql`${policies.name} ILIKE ${"%" + filters.search + "%"}` : undefined
      )
    )
    .orderBy(desc(policies.updatedAt));

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.policy.id);

  const [ctrlCounts, fwCounts] = await Promise.all([
    db
      .select({ policyId: policyControls.policyId, n: count() })
      .from(policyControls)
      .where(sql`${policyControls.policyId} = ANY(${sql`ARRAY[${sql.join(ids.map(id => sql`${id}::uuid`), sql`, `)}]`})`)
      .groupBy(policyControls.policyId),
    db
      .select({ policyId: policyFrameworks.policyId, n: count() })
      .from(policyFrameworks)
      .where(sql`${policyFrameworks.policyId} = ANY(${sql`ARRAY[${sql.join(ids.map(id => sql`${id}::uuid`), sql`, `)}]`})`)
      .groupBy(policyFrameworks.policyId),
  ]);

  const ctrlMap: Record<string, number> = {};
  const fwMap: Record<string, number> = {};
  for (const r of ctrlCounts) if (r.policyId) ctrlMap[r.policyId] = Number(r.n);
  for (const r of fwCounts) if (r.policyId) fwMap[r.policyId] = Number(r.n);

  return rows.map(({ policy, ownerName, ownerEmail }) => ({
    ...policy,
    ownerName: ownerName ?? null,
    ownerEmail: ownerEmail ?? null,
    controlCount: ctrlMap[policy.id] ?? 0,
    frameworkCount: fwMap[policy.id] ?? 0,
  }));
}

/** Single policy — full detail with all sub-entities. */
export async function findPolicyById(orgId: string, policyId: string): Promise<PolicyDetail | null> {
  const rows = await db
    .select({
      policy: policies,
      ownerName: profiles.fullName,
      ownerEmail: profiles.email,
    })
    .from(policies)
    .leftJoin(profiles, eq(policies.ownerId, profiles.id))
    .where(and(eq(policies.id, policyId), eq(policies.organizationId, orgId)));

  if (rows.length === 0) return null;
  const { policy, ownerName, ownerEmail } = rows[0];

  const [
    versionsRaw,
    reviewsRaw,
    attestationsRaw,
    linkedControlsRaw,
    linkedFrameworksRaw,
    linkedRisksRaw,
  ] = await Promise.all([
    db
      .select({ v: policyVersions, creatorName: profiles.fullName })
      .from(policyVersions)
      .leftJoin(profiles, eq(policyVersions.createdBy, profiles.id))
      .where(eq(policyVersions.policyId, policyId))
      .orderBy(desc(policyVersions.createdAt)),
    db
      .select({ r: policyReviews, reviewerName: profiles.fullName })
      .from(policyReviews)
      .leftJoin(profiles, eq(policyReviews.reviewerId, profiles.id))
      .where(eq(policyReviews.policyId, policyId))
      .orderBy(desc(policyReviews.createdAt)),
    db
      .select({ a: policyAttestations, userName: profiles.fullName, userEmail: profiles.email })
      .from(policyAttestations)
      .leftJoin(profiles, eq(policyAttestations.userId, profiles.id))
      .where(eq(policyAttestations.policyId, policyId))
      .orderBy(desc(policyAttestations.createdAt)),
    db
      .select({ id: controls.id, controlRef: controls.controlRef, name: controls.name, status: controls.status })
      .from(policyControls)
      .innerJoin(controls, eq(policyControls.controlId, controls.id))
      .where(eq(policyControls.policyId, policyId)),
    db
      .select({ id: frameworks.id, name: frameworks.name, status: frameworks.status })
      .from(policyFrameworks)
      .innerJoin(frameworks, eq(policyFrameworks.frameworkId, frameworks.id))
      .where(eq(policyFrameworks.policyId, policyId)),
    db
      .select({ id: sql<string>`r.id`, title: sql<string>`r.title`, status: sql<string>`r.status` })
      .from(riskPolicies)
      .innerJoin(sql`risks r`, sql`r.id = ${riskPolicies.riskId}`)
      .where(eq(riskPolicies.policyId, policyId)),
  ]);

  return {
    ...policy,
    ownerName: ownerName ?? null,
    ownerEmail: ownerEmail ?? null,
    controlCount: linkedControlsRaw.length,
    frameworkCount: linkedFrameworksRaw.length,
    versions: versionsRaw.map(({ v, creatorName }) => ({ ...v, creatorName: creatorName ?? null })),
    reviews: reviewsRaw.map(({ r, reviewerName }) => ({ ...r, reviewerName: reviewerName ?? null })),
    attestations: attestationsRaw.map(({ a, userName, userEmail }) => ({
      ...a,
      userName: userName ?? null,
      userEmail: userEmail ?? null,
    })),
    linkedControls: linkedControlsRaw.map((c) => ({
      id: c.id,
      controlRef: c.controlRef,
      name: c.name,
      status: c.status,
    })),
    linkedFrameworks: linkedFrameworksRaw.map((f) => ({
      id: f.id,
      name: f.name,
      status: f.status,
    })),
    linkedRisks: linkedRisksRaw.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
    })),
  };
}

/** Insert a new policy. */
export async function createPolicy(data: {
  organizationId: string;
  name: string;
  description?: string;
  policyType?: string;
  version?: string;
  owner?: string;
  ownerId?: string;
  status?: string;
  reviewDate?: string;
  nextReviewDate?: string;
  effectiveDate?: string;
  approvalDate?: string;
  approver?: string;
  storagePath?: string;
  attestationRequired?: boolean;
  audience?: string;
  changeSummary?: string;
  createdBy?: string;
}): Promise<Policy> {
  const [row] = await db
    .insert(policies)
    .values({
      organizationId: data.organizationId,
      name: data.name,
      description: data.description,
      policyType: data.policyType,
      version: data.version ?? "1.0",
      owner: data.owner,
      ownerId: data.ownerId ?? null,
      status: (data.status as never) ?? "draft",
      reviewDate: data.reviewDate ?? null,
      nextReviewDate: data.nextReviewDate ?? null,
      effectiveDate: data.effectiveDate ?? null,
      approvalDate: data.approvalDate ?? null,
      approver: data.approver,
      storagePath: data.storagePath,
      attestationRequired: data.attestationRequired ?? false,
      audience: data.audience ?? "everyone",
      changeSummary: data.changeSummary,
      createdBy: data.createdBy ?? null,
    })
    .returning();
  return row;
}

/** Update a policy. */
export async function updatePolicy(
  policyId: string,
  data: Partial<{
    name: string;
    description: string;
    policyType: string;
    version: string;
    owner: string;
    ownerId: string;
    status: string;
    reviewDate: string;
    nextReviewDate: string;
    effectiveDate: string;
    approvalDate: string;
    approver: string;
    storagePath: string;
    healthScore: number;
    attestationRequired: boolean;
    audience: string;
    changeSummary: string;
  }>
): Promise<Policy> {
  const [row] = await db
    .update(policies)
    .set({ ...data, status: data.status as never, updatedAt: new Date() })
    .where(eq(policies.id, policyId))
    .returning();
  return row;
}

/** Delete a policy. */
export async function deletePolicy(policyId: string, orgId: string): Promise<void> {
  await db
    .delete(policies)
    .where(and(eq(policies.id, policyId), eq(policies.organizationId, orgId)));
}

/** Gather health computation inputs. */
export async function getHealthInputs(orgId: string, policyId: string): Promise<PolicyHealthInputsRaw> {
  const [policyRow] = await db
    .select({ status: policies.status, reviewDate: policies.reviewDate })
    .from(policies)
    .where(and(eq(policies.id, policyId), eq(policies.organizationId, orgId)));

  if (!policyRow) {
    return { lastReviewDays: null, status: "draft", controlCount: 0, attestationRate: 0, frameworkCount: 0, openFindingCount: 0 };
  }

  const today = new Date();
  let lastReviewDays: number | null = null;
  if (policyRow.reviewDate) {
    const reviewDate = new Date(policyRow.reviewDate);
    lastReviewDays = Math.floor((today.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  const [ctrlCount, fwCount, attestationsRaw, findingCount] = await Promise.all([
    db
      .select({ n: count() })
      .from(policyControls)
      .where(eq(policyControls.policyId, policyId))
      .then((r) => Number(r[0]?.n ?? 0)),
    db
      .select({ n: count() })
      .from(policyFrameworks)
      .where(eq(policyFrameworks.policyId, policyId))
      .then((r) => Number(r[0]?.n ?? 0)),
    db
      .select({ status: policyAttestations.status })
      .from(policyAttestations)
      .where(and(eq(policyAttestations.policyId, policyId), eq(policyAttestations.organizationId, orgId))),
    db
      .select({ n: count() })
      .from(auditFindings)
      .where(
        and(
          eq(auditFindings.organizationId, orgId),
          sql`${auditFindings.status} NOT IN ('closed', 'accepted')`
        )
      )
      .then((r) => Number(r[0]?.n ?? 0)),
  ]);

  const totalAttestations = attestationsRaw.length;
  const acknowledgedAttestations = attestationsRaw.filter((a) => a.status === "acknowledged").length;
  const attestationRate = totalAttestations > 0 ? acknowledgedAttestations / totalAttestations : 0;

  return {
    lastReviewDays,
    status: policyRow.status,
    controlCount: ctrlCount,
    attestationRate,
    frameworkCount: fwCount,
    openFindingCount: findingCount,
  };
}

/** Persist health score. */
export async function saveHealthScore(policyId: string, score: number): Promise<void> {
  await db
    .update(policies)
    .set({ healthScore: score, updatedAt: new Date() })
    .where(eq(policies.id, policyId));
}

/** Insert a policy review. */
export async function addReview(data: {
  policyId: string;
  organizationId: string;
  reviewerId?: string;
  reviewDate: string;
  outcome: string;
  notes?: string;
  nextReviewDate?: string;
}): Promise<PolicyReview> {
  const [row] = await db
    .insert(policyReviews)
    .values({
      policyId: data.policyId,
      organizationId: data.organizationId,
      reviewerId: data.reviewerId ?? null,
      reviewDate: data.reviewDate,
      outcome: data.outcome,
      notes: data.notes,
      nextReviewDate: data.nextReviewDate ?? null,
    })
    .returning();
  return row;
}

/** Reviews for a policy, newest first. */
export async function findReviewsByPolicy(policyId: string) {
  return db
    .select({ review: policyReviews, reviewerName: profiles.fullName })
    .from(policyReviews)
    .leftJoin(profiles, eq(policyReviews.reviewerId, profiles.id))
    .where(eq(policyReviews.policyId, policyId))
    .orderBy(desc(policyReviews.createdAt));
}

/** Insert an attestation record. */
export async function addAttestation(data: {
  policyId: string;
  organizationId: string;
  userId: string;
  policyVersion?: string;
  dueDate?: string;
}): Promise<PolicyAttestation> {
  const [row] = await db
    .insert(policyAttestations)
    .values({
      policyId: data.policyId,
      organizationId: data.organizationId,
      userId: data.userId,
      policyVersion: data.policyVersion,
      dueDate: data.dueDate ?? null,
      status: "pending",
    })
    .returning();
  return row;
}

/** Attestations for a policy with user profile. */
export async function findAttestationsByPolicy(policyId: string) {
  return db
    .select({ attestation: policyAttestations, userName: profiles.fullName, userEmail: profiles.email })
    .from(policyAttestations)
    .leftJoin(profiles, eq(policyAttestations.userId, profiles.id))
    .where(eq(policyAttestations.policyId, policyId))
    .orderBy(desc(policyAttestations.createdAt));
}

/** Org-wide attestation tracker. */
export async function findAttestationsByOrg(
  orgId: string,
  filters?: { status?: string; policyId?: string }
) {
  return db
    .select({
      attestation: policyAttestations,
      userName: profiles.fullName,
      userEmail: profiles.email,
      policyName: policies.name,
    })
    .from(policyAttestations)
    .leftJoin(profiles, eq(policyAttestations.userId, profiles.id))
    .leftJoin(policies, eq(policyAttestations.policyId, policies.id))
    .where(
      and(
        eq(policyAttestations.organizationId, orgId),
        filters?.status ? sql`${policyAttestations.status} = ${filters.status}` : undefined,
        filters?.policyId ? eq(policyAttestations.policyId, filters.policyId) : undefined
      )
    )
    .orderBy(desc(policyAttestations.createdAt));
}

/** Update attestation status. */
export async function updateAttestationStatus(
  id: string,
  status: string,
  timestamp: Date
): Promise<void> {
  const update: Record<string, unknown> = { status, updatedAt: new Date() };
  if (status === "acknowledged") update.acknowledgedAt = timestamp;
  if (status === "rejected") update.rejectedAt = timestamp;
  await db.update(policyAttestations).set(update as never).where(eq(policyAttestations.id, id));
}

/** Link a control to a policy. */
export async function linkControl(policyId: string, controlId: string, orgId: string): Promise<void> {
  await db
    .insert(policyControls)
    .values({ policyId, controlId, organizationId: orgId })
    .onConflictDoNothing();
}

/** Unlink a control from a policy. */
export async function unlinkControl(policyId: string, controlId: string): Promise<void> {
  await db
    .delete(policyControls)
    .where(and(eq(policyControls.policyId, policyId), eq(policyControls.controlId, controlId)));
}

/** Get linked controls for a policy. */
export async function getLinkedControls(policyId: string) {
  return db
    .select({ id: controls.id, controlRef: controls.controlRef, name: controls.name, status: controls.status })
    .from(policyControls)
    .innerJoin(controls, eq(policyControls.controlId, controls.id))
    .where(eq(policyControls.policyId, policyId));
}

/** Link a framework to a policy. */
export async function linkFramework(policyId: string, frameworkId: string, orgId: string): Promise<void> {
  await db
    .insert(policyFrameworks)
    .values({ policyId, frameworkId, organizationId: orgId })
    .onConflictDoNothing();
}

/** Unlink a framework from a policy. */
export async function unlinkFramework(policyId: string, frameworkId: string): Promise<void> {
  await db
    .delete(policyFrameworks)
    .where(
      and(eq(policyFrameworks.policyId, policyId), eq(policyFrameworks.frameworkId, frameworkId))
    );
}

/** Get linked frameworks for a policy. */
export async function getLinkedFrameworks(policyId: string) {
  return db
    .select({ id: frameworks.id, name: frameworks.name, status: frameworks.status })
    .from(policyFrameworks)
    .innerJoin(frameworks, eq(policyFrameworks.frameworkId, frameworks.id))
    .where(eq(policyFrameworks.policyId, policyId));
}

/** Dashboard metrics for an org. */
export async function getDashboardMetrics(orgId: string): Promise<PolicyDashboardMetrics> {
  const today = new Date().toISOString().split("T")[0];
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const allPolicies = await db
    .select({
      policy: policies,
      ownerName: profiles.fullName,
      ownerEmail: profiles.email,
    })
    .from(policies)
    .leftJoin(profiles, eq(policies.ownerId, profiles.id))
    .where(eq(policies.organizationId, orgId));

  const total = allPolicies.length;
  const countByStatus = (s: string) => allPolicies.filter((p) => p.policy.status === s).length;

  const draft = countByStatus("draft");
  const review = countByStatus("review");
  const approved = countByStatus("approved");
  const published = countByStatus("published");
  const expired = countByStatus("expired");
  const retired = countByStatus("retired");
  const archived = countByStatus("archived");

  const dueSoon = allPolicies.filter((p) => {
    const d = p.policy.nextReviewDate;
    return d && d >= today && d <= in30Days;
  }).length;

  const overdue = allPolicies.filter((p) => {
    const d = p.policy.nextReviewDate;
    return d && d < today && !["retired", "archived"].includes(p.policy.status);
  }).length;

  const scoredPolicies = allPolicies.filter((p) => p.policy.healthScore !== null && p.policy.healthScore! > 0);
  const avgHealth =
    scoredPolicies.length > 0
      ? Math.round(scoredPolicies.reduce((s, p) => s + (p.policy.healthScore ?? 0), 0) / scoredPolicies.length)
      : 0;

  // Attestation rate across org
  const attestations = await db
    .select({ status: policyAttestations.status })
    .from(policyAttestations)
    .where(eq(policyAttestations.organizationId, orgId));

  const totalAtt = attestations.length;
  const ackAtt = attestations.filter((a) => a.status === "acknowledged").length;
  const attestationRate = totalAtt > 0 ? Math.round((ackAtt / totalAtt) * 100) : 0;

  // Weak policies (health < 60)
  const policyIds = allPolicies.map((p) => p.policy.id);
  let ctrlCounts: Record<string, number> = {};
  let fwCounts: Record<string, number> = {};

  if (policyIds.length > 0) {
    const [cRows, fRows] = await Promise.all([
      db
        .select({ policyId: policyControls.policyId, n: count() })
        .from(policyControls)
        .where(sql`${policyControls.policyId} = ANY(${sql`ARRAY[${sql.join(policyIds.map((id) => sql`${id}::uuid`), sql`, `)}]`})`)
        .groupBy(policyControls.policyId),
      db
        .select({ policyId: policyFrameworks.policyId, n: count() })
        .from(policyFrameworks)
        .where(sql`${policyFrameworks.policyId} = ANY(${sql`ARRAY[${sql.join(policyIds.map((id) => sql`${id}::uuid`), sql`, `)}]`})`)
        .groupBy(policyFrameworks.policyId),
    ]);
    for (const r of cRows) if (r.policyId) ctrlCounts[r.policyId] = Number(r.n);
    for (const r of fRows) if (r.policyId) fwCounts[r.policyId] = Number(r.n);
  }

  const weakPolicies: PolicyWithMeta[] = allPolicies
    .filter((p) => (p.policy.healthScore ?? 0) < 60 && !["retired", "archived"].includes(p.policy.status))
    .sort((a, b) => (a.policy.healthScore ?? 0) - (b.policy.healthScore ?? 0))
    .slice(0, 5)
    .map(({ policy, ownerName, ownerEmail }) => ({
      ...policy,
      ownerName: ownerName ?? null,
      ownerEmail: ownerEmail ?? null,
      controlCount: ctrlCounts[policy.id] ?? 0,
      frameworkCount: fwCounts[policy.id] ?? 0,
    }));

  return {
    total,
    draft,
    review,
    approved,
    published,
    expired,
    retired,
    archived,
    dueSoon,
    overdue,
    avgHealth,
    attestationRate,
    weakPolicies,
  };
}
