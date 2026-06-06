import { db } from "@/lib/db";
import { DomainError } from "@/lib/services/errors";
import { recordAudit } from "@/lib/repositories/audit-repo";
import * as findingRepo from "@/lib/repositories/audit-finding-repo";
import * as auditRepo from "@/lib/repositories/audit-management-repo";
import type { AuditFinding } from "@/lib/db/schema";

export type FindingWithAuditName = AuditFinding & { auditName?: string };

export async function listFindings(
  orgId: string,
  filters: { auditId?: string; severity?: string; status?: string } = {}
): Promise<AuditFinding[]> {
  if (filters.auditId) {
    return findingRepo.findByAudit(orgId, filters.auditId);
  }
  return findingRepo.findByOrg(orgId, {
    severity: filters.severity,
    status: filters.status,
  });
}

export async function getFinding(
  orgId: string,
  findingId: string
): Promise<AuditFinding | null> {
  return findingRepo.findById(orgId, findingId);
}

export async function createFinding(params: {
  orgId: string;
  actorId: string;
  input: {
    auditId: string;
    title: string;
    description?: string | null;
    severity?: "critical" | "high" | "medium" | "low";
    recommendation?: string | null;
    controlId?: string | null;
    evidenceId?: string | null;
  };
}): Promise<{ id: string }> {
  const title = (params.input.title || "").trim();
  if (title.length < 3) throw new DomainError("Finding title must be at least 3 characters.");

  const audit = await auditRepo.findById(params.orgId, params.input.auditId);
  if (!audit) throw new DomainError("Audit not found.");

  let result!: { id: string };
  await db.transaction(async (tx) => {
    result = await findingRepo.insertFinding(
      {
        organizationId: params.orgId,
        auditId: params.input.auditId,
        title,
        description: params.input.description?.trim() ?? null,
        severity: params.input.severity ?? "medium",
        recommendation: params.input.recommendation?.trim() ?? null,
        controlId: params.input.controlId ?? null,
        evidenceId: params.input.evidenceId ?? null,
        createdBy: params.actorId,
      },
      tx
    );
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "audit.finding_created",
        entityType: "audit_finding",
        entityId: result.id,
        metadata: { title, severity: params.input.severity ?? "medium", auditId: params.input.auditId },
      },
      tx
    );
  });
  return result;
}

export async function updateFinding(params: {
  orgId: string;
  actorId: string;
  findingId: string;
  input: Partial<{
    title: string;
    description: string | null;
    severity: "critical" | "high" | "medium" | "low";
    recommendation: string | null;
    status: "open" | "accepted" | "remediating" | "closed";
  }>;
}): Promise<void> {
  const existing = await findingRepo.findById(params.orgId, params.findingId);
  if (!existing) throw new DomainError("Finding not found.");

  await db.transaction(async (tx) => {
    await findingRepo.updateFinding(params.findingId, params.input, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "audit.finding_updated",
        entityType: "audit_finding",
        entityId: params.findingId,
        metadata: params.input,
      },
      tx
    );
  });
}

export async function closeFinding(params: {
  orgId: string;
  actorId: string;
  findingId: string;
}): Promise<void> {
  const existing = await findingRepo.findById(params.orgId, params.findingId);
  if (!existing) throw new DomainError("Finding not found.");
  if (existing.status === "closed") throw new DomainError("Finding is already closed.");

  await db.transaction(async (tx) => {
    await findingRepo.updateFinding(params.findingId, { status: "closed" }, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "audit.finding_closed",
        entityType: "audit_finding",
        entityId: params.findingId,
        metadata: { previousStatus: existing.status },
      },
      tx
    );
  });
}
