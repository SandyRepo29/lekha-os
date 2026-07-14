import { db } from "@/lib/db";
import { controls, auditLogs } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import * as repo from "@/backend/src/modules/control-center/control-center-repo";
import { computeControlHealth } from "@/backend/src/modules/control-center/control-health";
import { DomainError } from "@/lib/services/errors";

// ─── List / Get ──────────────────────────────────────────────────────────────

export async function listControls(orgId: string) {
  return repo.findAllControls(orgId);
}

export async function getControl(orgId: string, id: string) {
  return repo.findControlById(orgId, id);
}

export async function getDashboardMetrics(orgId: string) {
  return repo.getDashboardMetrics(orgId);
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createControl(params: {
  orgId: string;
  actorId: string;
  controlRef: string;
  name: string;
  description?: string;
  objective?: string;
  category?: string;
  owner?: string;
  ownerId?: string;
  controlType?: string;
  frequency?: string;
  automationLevel?: string;
  priority?: string;
  status?: string;
  frameworkId?: string;
  nextReviewDate?: string;
  nextTestDate?: string;
}) {
  if (!params.controlRef?.trim()) throw new DomainError("Control ID is required.");
  if (!params.name?.trim()) throw new DomainError("Control name is required.");

  const [ctrl] = await db
    .insert(controls)
    .values({
      organizationId: params.orgId,
      frameworkId: params.frameworkId ?? null,
      controlRef: params.controlRef.trim(),
      name: params.name.trim(),
      description: params.description,
      objective: params.objective,
      category: params.category,
      owner: params.owner,
      ownerId: params.ownerId,
      controlType: (params.controlType as never) ?? null,
      frequency: (params.frequency as never) ?? null,
      automationLevel: (params.automationLevel as never) ?? "manual",
      priority: (params.priority as never) ?? "medium",
      status: (params.status as never) ?? "not_implemented",
      nextReviewDate: params.nextReviewDate ?? null,
      nextTestDate: params.nextTestDate ?? null,
    })
    .returning({ id: controls.id });

  await logAction(params.orgId, params.actorId, "control_center.control_created", ctrl.id, {
    ref: params.controlRef,
    name: params.name,
  });

  return ctrl;
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateControl(params: {
  orgId: string;
  actorId: string;
  id: string;
  controlRef?: string;
  name?: string;
  description?: string;
  objective?: string;
  category?: string;
  owner?: string;
  ownerId?: string;
  controlType?: string;
  frequency?: string;
  automationLevel?: string;
  priority?: string;
  status?: string;
  frameworkId?: string;
  nextReviewDate?: string;
  nextTestDate?: string;
  reviewDate?: string;
}) {
  const { orgId, actorId, id, ...rest } = params;
  await repo.updateControlFull(orgId, id, rest as never);
  await logAction(orgId, actorId, "control_center.control_updated", id, { id });
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteControl(orgId: string, actorId: string, id: string) {
  await repo.softDeleteControl(id, orgId);
  await logAction(orgId, actorId, "control_center.control_deleted", id, { id });
}

// ─── Health Computation ──────────────────────────────────────────────────────

export async function computeAndSaveHealth(orgId: string, controlId: string) {
  const inputs = await repo.getHealthInputs(orgId, controlId);
  const breakdown = computeControlHealth(inputs);
  await repo.saveHealthScores(orgId, controlId, breakdown.overall, breakdown.overall);
  return breakdown;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

export async function addTest(params: {
  orgId: string;
  actorId: string;
  controlId: string;
  testDate: string;
  result: string;
  testerName?: string;
  method?: string;
  evidenceRef?: string;
  comments?: string;
}) {
  const test = await repo.insertControlTest({
    orgId: params.orgId,
    controlId: params.controlId,
    testDate: params.testDate,
    testerId: params.actorId,
    testerName: params.testerName,
    method: params.method,
    result: params.result,
    evidenceRef: params.evidenceRef,
    comments: params.comments,
  });

  // Update lastTested on control
  await repo.updateControlFull(params.orgId, params.controlId, {
    lastTested: params.testDate,
    updatedAt: new Date(),
  });

  await logAction(params.orgId, params.actorId, "control_center.control_tested", params.controlId, {
    result: params.result,
    testDate: params.testDate,
  });

  // Recompute health async
  computeAndSaveHealth(params.orgId, params.controlId).catch(() => {});

  return test;
}

export async function removeTest(orgId: string, actorId: string, testId: string) {
  await repo.deleteControlTest(orgId, testId);
  await logAction(orgId, actorId, "control_center.test_deleted", testId, {});
}

export async function listTests(orgId: string) {
  return repo.findAllTests(orgId);
}

export async function listTestsByControl(controlId: string) {
  return repo.findTestsByControl(controlId);
}

// ─── Audit log helper ────────────────────────────────────────────────────────

async function logAction(
  orgId: string,
  actorId: string,
  action: string,
  entityId: string,
  metadata: Record<string, unknown>
) {
  await db.insert(auditLogs).values({
    organizationId: orgId,
    actorId,
    action,
    entityType: "control",
    entityId,
    metadata,
  });
}
