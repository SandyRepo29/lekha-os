import { db } from "@/lib/db";
import {
  controls,
  controlTests,
  controlFrameworks,
  controlVendors,
  controlEvidenceMappings,
  evidence,
  risks,
  riskControls,
  auditFindings,
  policies,
  profiles,
  frameworks,
  vendors,
  type Control,
  type ControlTest,
} from "@/lib/db/schema";
import { and, eq, sql, desc, count, inArray, isNull, isNotNull } from "drizzle-orm";

export type ControlWithMeta = Control & {
  ownerName: string | null;
  ownerEmail: string | null;
  evidenceCount: number;
  testCount: number;
  riskCount: number;
  frameworkName: string | null;
};

export type ControlHealthInputsRaw = {
  approvedEvidenceCount: number;
  totalEvidenceCount: number;
  passedTests: number;
  totalTests: number;
  openFindings: number;
  closedFindings: number;
  approvedPolicies: number;
  totalPolicies: number;
  daysSinceReview: number | null;
  mitigatedRisks: number;
  totalRisks: number;
};

/** All controls for an org — for Control Library. */
export async function findAllControls(orgId: string): Promise<ControlWithMeta[]> {
  const rows = await db
    .select({
      control: controls,
      ownerName: profiles.fullName,
      ownerEmail: profiles.email,
      frameworkName: frameworks.name,
    })
    .from(controls)
    .leftJoin(profiles, eq(controls.ownerId, profiles.id))
    .leftJoin(frameworks, eq(controls.frameworkId, frameworks.id))
    .where(and(eq(controls.organizationId, orgId), isNull(controls.deletedAt)))
    .orderBy(controls.controlRef);

  // Batch evidence + test + risk counts
  const ids = rows.map((r) => r.control.id);
  if (ids.length === 0) return [];

  const [evCounts, testCounts, riskCounts] = await Promise.all([
    db
      .select({ controlId: controlEvidenceMappings.controlId, n: count() })
      .from(controlEvidenceMappings)
      .where(inArray(controlEvidenceMappings.controlId, ids))
      .groupBy(controlEvidenceMappings.controlId),
    db
      .select({ controlId: controlTests.controlId, n: count() })
      .from(controlTests)
      .where(inArray(controlTests.controlId, ids))
      .groupBy(controlTests.controlId),
    db
      .select({ controlId: riskControls.controlId, n: count() })
      .from(riskControls)
      .where(inArray(riskControls.controlId, ids))
      .groupBy(riskControls.controlId),
  ]);

  const evMap = Object.fromEntries(evCounts.map((r) => [r.controlId, Number(r.n)]));
  const testMap = Object.fromEntries(testCounts.map((r) => [r.controlId, Number(r.n)]));
  const riskMap = Object.fromEntries(riskCounts.map((r) => [r.controlId, Number(r.n)]));

  return rows.map(({ control, ownerName, ownerEmail, frameworkName }) => ({
    ...control,
    ownerName: ownerName ?? null,
    ownerEmail: ownerEmail ?? null,
    frameworkName: frameworkName ?? null,
    evidenceCount: evMap[control.id] ?? 0,
    testCount: testMap[control.id] ?? 0,
    riskCount: riskMap[control.id] ?? 0,
  }));
}

/** Single control with owner join. */
export async function findControlById(
  orgId: string,
  id: string
): Promise<ControlWithMeta | null> {
  const [row] = await db
    .select({
      control: controls,
      ownerName: profiles.fullName,
      ownerEmail: profiles.email,
      frameworkName: frameworks.name,
    })
    .from(controls)
    .leftJoin(profiles, eq(controls.ownerId, profiles.id))
    .leftJoin(frameworks, eq(controls.frameworkId, frameworks.id))
    .where(and(eq(controls.id, id), eq(controls.organizationId, orgId), isNull(controls.deletedAt)));

  if (!row) return null;

  const [evCount, testCount, riskCount] = await Promise.all([
    db.select({ n: count() }).from(controlEvidenceMappings).where(eq(controlEvidenceMappings.controlId, id)),
    db.select({ n: count() }).from(controlTests).where(eq(controlTests.controlId, id)),
    db.select({ n: count() }).from(riskControls).where(eq(riskControls.controlId, id)),
  ]);

  return {
    ...row.control,
    ownerName: row.ownerName ?? null,
    ownerEmail: row.ownerEmail ?? null,
    frameworkName: row.frameworkName ?? null,
    evidenceCount: Number(evCount[0]?.n ?? 0),
    testCount: Number(testCount[0]?.n ?? 0),
    riskCount: Number(riskCount[0]?.n ?? 0),
  };
}

/** Gather all inputs needed to compute Control Health™. */
export async function getHealthInputs(
  orgId: string,
  controlId: string
): Promise<ControlHealthInputsRaw> {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  const [evRows, testRows, findingRows, policyRows, riskRows, ctrl] = await Promise.all([
    // Evidence: count approved vs total
    db
      .select({
        status: evidence.status,
        n: count(),
      })
      .from(controlEvidenceMappings)
      .innerJoin(evidence, eq(controlEvidenceMappings.evidenceId, evidence.id))
      .where(eq(controlEvidenceMappings.controlId, controlId))
      .groupBy(evidence.status),

    // Tests in last 12 months
    db
      .select({ result: controlTests.result, n: count() })
      .from(controlTests)
      .where(
        and(
          eq(controlTests.controlId, controlId),
          sql`${controlTests.testDate} >= ${twelveMonthsAgo.toISOString().slice(0, 10)}`
        )
      )
      .groupBy(controlTests.result),

    // Audit findings linked to this control
    db
      .select({ status: auditFindings.status, n: count() })
      .from(auditFindings)
      .where(
        and(
          eq(auditFindings.controlId, controlId),
          eq(auditFindings.organizationId, orgId)
        )
      )
      .groupBy(auditFindings.status),

    // Policies — via risk_policies? No direct link. We use policies linked via control→framework→policy (approximate)
    // For now: count org policies that are approved (proxy for policy support)
    db
      .select({ status: policies.status, n: count() })
      .from(policies)
      .where(eq(policies.organizationId, orgId))
      .groupBy(policies.status),

    // Risks linked to this control
    db
      .select({ status: risks.status, n: count() })
      .from(riskControls)
      .innerJoin(risks, eq(riskControls.riskId, risks.id))
      .where(eq(riskControls.controlId, controlId))
      .groupBy(risks.status),

    // Control itself for review date
    db
      .select({ reviewDate: controls.reviewDate })
      .from(controls)
      .where(and(eq(controls.id, controlId), eq(controls.organizationId, orgId))),
  ]);

  const approvedEv = evRows.filter((r) => r.status === "approved").reduce((s, r) => s + Number(r.n), 0);
  const totalEv = evRows.reduce((s, r) => s + Number(r.n), 0);

  const passedTests = testRows.filter((r) => r.result === "passed").reduce((s, r) => s + Number(r.n), 0);
  const totalTests = testRows.reduce((s, r) => s + Number(r.n), 0);

  const openStatuses = ["open", "remediating"];
  const openFindings = findingRows.filter((r) => openStatuses.includes(r.status)).reduce((s, r) => s + Number(r.n), 0);
  const closedFindings = findingRows.filter((r) => r.status === "closed" || r.status === "accepted").reduce((s, r) => s + Number(r.n), 0);

  const approvedPolicies = policyRows.filter((r) => r.status === "approved").reduce((s, r) => s + Number(r.n), 0);
  const totalPolicies = policyRows.reduce((s, r) => s + Number(r.n), 0);

  let daysSinceReview: number | null = null;
  if (ctrl[0]?.reviewDate) {
    const d = new Date(ctrl[0].reviewDate);
    daysSinceReview = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  }

  const mitigatedStatuses = ["mitigating", "accepted", "closed", "transferred"];
  const mitigatedRisks = riskRows.filter((r) => mitigatedStatuses.includes(r.status)).reduce((s, r) => s + Number(r.n), 0);
  const totalRisks = riskRows.reduce((s, r) => s + Number(r.n), 0);

  return {
    approvedEvidenceCount: approvedEv,
    totalEvidenceCount: totalEv,
    passedTests,
    totalTests,
    openFindings,
    closedFindings,
    approvedPolicies,
    totalPolicies,
    daysSinceReview,
    mitigatedRisks,
    totalRisks,
  };
}

/** Dashboard metrics for Control Center™. */
export async function getDashboardMetrics(orgId: string) {
  const rows = await db
    .select({ health: controls.healthScore, effectiveness: controls.effectivenessScore, status: controls.status })
    .from(controls)
    .where(and(eq(controls.organizationId, orgId), isNull(controls.deletedAt)));

  const total = rows.length;
  const healthy = rows.filter((r) => (r.health ?? 0) >= 80).length;
  const weak = rows.filter((r) => r.health !== null && (r.health ?? 0) < 60).length;
  const implemented = rows.filter((r) => r.status === "implemented").length;
  const avgHealth = total === 0 ? 0 : Math.round(rows.reduce((s, r) => s + (r.health ?? 0), 0) / total);
  const avgEffectiveness = total === 0 ? 0 : Math.round(rows.filter((r) => r.effectiveness !== null).reduce((s, r) => s + (r.effectiveness ?? 0), 0) / Math.max(1, rows.filter((r) => r.effectiveness !== null).length));

  // Overdue tests: next_test_date < today
  const [overdueTests] = await db
    .select({ n: count() })
    .from(controls)
    .where(
      and(
        eq(controls.organizationId, orgId),
        isNull(controls.deletedAt),
        sql`${controls.nextTestDate} < CURRENT_DATE`
      )
    );

  return {
    total,
    healthy,
    weak,
    implemented,
    avgHealth,
    avgEffectiveness,
    overdueTests: Number(overdueTests?.n ?? 0),
    coverage: total === 0 ? 0 : Math.round((implemented / total) * 100),
  };
}

/** CRUD — update control (Control Center™ extended fields). */
export async function updateControlFull(
  orgId: string,
  id: string,
  values: Partial<Omit<Control, "id" | "organizationId" | "createdAt">>
) {
  await db
    .update(controls)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(controls.id, id), eq(controls.organizationId, orgId)));
}

/** Persist computed health + effectiveness scores back to the control row. */
export async function saveHealthScores(
  orgId: string,
  controlId: string,
  healthScore: number,
  effectivenessScore: number
) {
  await db
    .update(controls)
    .set({ healthScore, effectivenessScore, updatedAt: new Date() })
    .where(and(eq(controls.id, controlId), eq(controls.organizationId, orgId)));
}

// ─── Control Tests ──────────────────────────────────────────────────────────

export async function insertControlTest(data: {
  orgId: string;
  controlId: string;
  testDate: string;
  testerId?: string;
  testerName?: string;
  method?: string;
  result: string;
  evidenceRef?: string;
  comments?: string;
}) {
  const [row] = await db
    .insert(controlTests)
    .values({
      organizationId: data.orgId,
      controlId: data.controlId,
      testDate: data.testDate,
      testerId: data.testerId,
      testerName: data.testerName,
      method: data.method,
      result: data.result as ControlTest["result"],
      evidenceRef: data.evidenceRef,
      comments: data.comments,
    })
    .returning({ id: controlTests.id });
  return row;
}

export async function findTestsByControl(controlId: string): Promise<(ControlTest & { testerFullName: string | null })[]> {
  const rows = await db
    .select({ test: controlTests, testerFullName: profiles.fullName })
    .from(controlTests)
    .leftJoin(profiles, eq(controlTests.testerId, profiles.id))
    .where(eq(controlTests.controlId, controlId))
    .orderBy(desc(controlTests.testDate));

  return rows.map(({ test, testerFullName }) => ({ ...test, testerFullName: testerFullName ?? null }));
}

export async function findAllTests(orgId: string) {
  const rows = await db
    .select({ test: controlTests, testerFullName: profiles.fullName, controlName: controls.name, controlRef: controls.controlRef })
    .from(controlTests)
    .leftJoin(profiles, eq(controlTests.testerId, profiles.id))
    .leftJoin(controls, eq(controlTests.controlId, controls.id))
    .where(eq(controlTests.organizationId, orgId))
    .orderBy(desc(controlTests.testDate));

  return rows.map(({ test, testerFullName, controlName, controlRef }) => ({
    ...test,
    testerFullName: testerFullName ?? null,
    controlName: controlName ?? "",
    controlRef: controlRef ?? "",
  }));
}

export async function deleteControlTest(orgId: string, id: string) {
  await db
    .delete(controlTests)
    .where(and(eq(controlTests.id, id), eq(controlTests.organizationId, orgId)));
}

// ─── Relationships ──────────────────────────────────────────────────────────

export async function linkControlVendor(controlId: string, vendorId: string) {
  await db
    .insert(controlVendors)
    .values({ controlId, vendorId })
    .onConflictDoNothing();
}

export async function unlinkControlVendor(controlId: string, vendorId: string) {
  await db
    .delete(controlVendors)
    .where(and(eq(controlVendors.controlId, controlId), eq(controlVendors.vendorId, vendorId)));
}

export async function getLinkedVendors(controlId: string) {
  return db
    .select({ vendor: vendors })
    .from(controlVendors)
    .innerJoin(vendors, eq(controlVendors.vendorId, vendors.id))
    .where(eq(controlVendors.controlId, controlId));
}

export async function linkControlFramework(controlId: string, frameworkId: string) {
  await db
    .insert(controlFrameworks)
    .values({ controlId, frameworkId })
    .onConflictDoNothing();
}

export async function unlinkControlFramework(controlId: string, frameworkId: string) {
  await db
    .delete(controlFrameworks)
    .where(
      and(eq(controlFrameworks.controlId, controlId), eq(controlFrameworks.frameworkId, frameworkId))
    );
}

export async function getLinkedFrameworks(controlId: string) {
  return db
    .select({ framework: frameworks })
    .from(controlFrameworks)
    .innerJoin(frameworks, eq(controlFrameworks.frameworkId, frameworks.id))
    .where(eq(controlFrameworks.controlId, controlId));
}

export async function softDeleteControl(id: string, orgId: string): Promise<void> {
  await db
    .update(controls)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(controls.id, id), eq(controls.organizationId, orgId)));
}

export async function restoreControl(id: string, orgId: string): Promise<void> {
  await db
    .update(controls)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(and(eq(controls.id, id), eq(controls.organizationId, orgId)));
}

export async function findDeletedControls(orgId: string): Promise<Control[]> {
  const since = new Date(Date.now() - 30 * 86_400_000);
  return db
    .select()
    .from(controls)
    .where(
      and(
        eq(controls.organizationId, orgId),
        isNotNull(controls.deletedAt),
        sql`${controls.deletedAt} >= ${since.toISOString()}`
      )
    )
    .orderBy(desc(controls.deletedAt));
}
