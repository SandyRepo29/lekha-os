import { db } from "@/lib/db";
import { DomainError } from "@/lib/services/errors";
import { recordAudit } from "@/lib/repositories/audit-repo";
import * as auditRepo from "@/lib/repositories/audit-management-repo";
import * as programRepo from "@/lib/repositories/audit-program-repo";
import * as findingRepo from "@/lib/repositories/audit-finding-repo";
import * as capaRepo from "@/lib/repositories/corrective-action-repo";
import * as controlRepo from "@/lib/repositories/control-repo";
import type { Audit } from "@/lib/db/schema";

export type AuditWithCounts = Audit & {
  openFindings: number;
  totalFindings: number;
  programCount: number;
  pendingCapas: number;
};

export type AuditDetail = AuditWithCounts & {
  isOverdue: boolean;
};

export async function listAudits(orgId: string): Promise<AuditWithCounts[]> {
  const all = await auditRepo.findByOrg(orgId);
  return Promise.all(
    all.map(async (a) => {
      const [findings, programs, capas] = await Promise.all([
        findingRepo.findByAudit(orgId, a.id),
        programRepo.findByAudit(orgId, a.id),
        capaRepo.findByOrg(orgId),
      ]);
      const auditCapas = capas.filter((c) => {
        const findingIds = findings.map((f) => f.id);
        return findingIds.includes(c.findingId);
      });
      return {
        ...a,
        openFindings: findings.filter((f) => f.status === "open").length,
        totalFindings: findings.length,
        programCount: programs.length,
        pendingCapas: auditCapas.filter((c) => c.status === "open" || c.status === "in_progress").length,
      };
    })
  );
}

export async function getAudit(
  orgId: string,
  auditId: string
): Promise<AuditDetail | null> {
  const audit = await auditRepo.findById(orgId, auditId);
  if (!audit) return null;
  const [findings, programs, capas] = await Promise.all([
    findingRepo.findByAudit(orgId, auditId),
    programRepo.findByAudit(orgId, auditId),
    capaRepo.findByOrg(orgId),
  ]);
  const auditCapas = capas.filter((c) =>
    findings.map((f) => f.id).includes(c.findingId)
  );
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue =
    !!audit.endDate &&
    audit.endDate < today &&
    (audit.status === "planned" || audit.status === "in_progress");
  return {
    ...audit,
    openFindings: findings.filter((f) => f.status === "open").length,
    totalFindings: findings.length,
    programCount: programs.length,
    pendingCapas: auditCapas.filter((c) => c.status === "open" || c.status === "in_progress").length,
    isOverdue,
  };
}

export async function createAudit(params: {
  orgId: string;
  actorId: string;
  input: {
    name: string;
    auditType?: "internal" | "external" | "vendor" | "security" | "compliance" | "regulatory";
    frameworkId?: string | null;
    scope?: string | null;
    objective?: string | null;
    ownerId?: string | null;
    auditorName?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  };
}): Promise<{ id: string }> {
  const name = (params.input.name || "").trim();
  if (name.length < 2) throw new DomainError("Audit name must be at least 2 characters.");

  let result!: { id: string };
  await db.transaction(async (tx) => {
    result = await auditRepo.insertAudit(
      {
        organizationId: params.orgId,
        name,
        auditType: params.input.auditType ?? "internal",
        frameworkId: params.input.frameworkId ?? null,
        scope: params.input.scope?.trim() ?? null,
        objective: params.input.objective?.trim() ?? null,
        ownerId: params.input.ownerId ?? null,
        auditorName: params.input.auditorName?.trim() ?? null,
        startDate: params.input.startDate ?? null,
        endDate: params.input.endDate ?? null,
        createdBy: params.actorId,
      },
      tx
    );
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "audit.created",
        entityType: "audit",
        entityId: result.id,
        metadata: { name, auditType: params.input.auditType ?? "internal" },
      },
      tx
    );
  });

  // Auto-generate program from framework controls if frameworkId provided
  if (params.input.frameworkId) {
    generateAuditProgram(params.orgId, result.id, params.input.frameworkId).catch(() => {});
  }

  return result;
}

export async function updateAudit(params: {
  orgId: string;
  actorId: string;
  auditId: string;
  input: Partial<{
    name: string;
    auditType: "internal" | "external" | "vendor" | "security" | "compliance" | "regulatory";
    frameworkId: string | null;
    scope: string | null;
    objective: string | null;
    ownerId: string | null;
    auditorName: string | null;
    startDate: string | null;
    endDate: string | null;
    status: "planned" | "in_progress" | "completed" | "cancelled";
  }>;
}): Promise<void> {
  const existing = await auditRepo.findById(params.orgId, params.auditId);
  if (!existing) throw new DomainError("Audit not found.");

  await db.transaction(async (tx) => {
    await auditRepo.updateAudit(params.auditId, params.input, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "audit.updated",
        entityType: "audit",
        entityId: params.auditId,
        metadata: params.input,
      },
      tx
    );
  });
}

export async function updateAuditStatus(params: {
  orgId: string;
  actorId: string;
  auditId: string;
  status: "planned" | "in_progress" | "completed" | "cancelled";
}): Promise<void> {
  const existing = await auditRepo.findById(params.orgId, params.auditId);
  if (!existing) throw new DomainError("Audit not found.");

  const action =
    params.status === "completed"
      ? "audit.completed"
      : params.status === "cancelled"
      ? "audit.cancelled"
      : "audit.updated";

  await db.transaction(async (tx) => {
    await auditRepo.updateAudit(params.auditId, { status: params.status }, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action,
        entityType: "audit",
        entityId: params.auditId,
        metadata: { status: params.status },
      },
      tx
    );
  });
}

export async function deleteAudit(params: {
  orgId: string;
  actorId: string;
  auditId: string;
}): Promise<void> {
  const existing = await auditRepo.findById(params.orgId, params.auditId);
  if (!existing) throw new DomainError("Audit not found.");

  await db.transaction(async (tx) => {
    await auditRepo.deleteAudit(params.orgId, params.auditId, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "audit.deleted",
        entityType: "audit",
        entityId: params.auditId,
        metadata: { name: existing.name },
      },
      tx
    );
  });
}

export async function generateAuditProgram(
  orgId: string,
  auditId: string,
  frameworkId: string
): Promise<void> {
  const controls = await controlRepo.findByFramework(orgId, frameworkId);
  if (controls.length === 0) return;

  const programs = controls.map((c) => ({
    organizationId: orgId,
    auditId,
    title: `[${c.controlRef}] ${c.name}`,
    description: c.description ?? null,
    controlId: c.id,
    expectedEvidence: null,
    status: "pending" as const,
  }));
  await programRepo.insertPrograms(programs);
}

export async function getDashboardMetrics(orgId: string) {
  const [statusCounts, overdueCount, openFindings, severityCounts, capasDueSoon] =
    await Promise.all([
      auditRepo.countByStatus(orgId),
      auditRepo.countOverdue(orgId),
      findingRepo.countOpenByOrg(orgId),
      findingRepo.countBySeverity(orgId),
      capaRepo.countDueSoon(orgId, 30),
    ]);

  return {
    total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
    planned: statusCounts["planned"] ?? 0,
    inProgress: statusCounts["in_progress"] ?? 0,
    completed: statusCounts["completed"] ?? 0,
    cancelled: statusCounts["cancelled"] ?? 0,
    overdue: overdueCount,
    openFindings,
    criticalFindings: severityCounts["critical"] ?? 0,
    highFindings: severityCounts["high"] ?? 0,
    capasDueSoon,
  };
}
