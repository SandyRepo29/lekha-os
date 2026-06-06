import { db } from "@/lib/db";
import { DomainError } from "@/lib/services/errors";
import { recordAudit } from "@/lib/repositories/audit-repo";
import * as capaRepo from "@/lib/repositories/corrective-action-repo";
import * as findingRepo from "@/lib/repositories/audit-finding-repo";
import type { CorrectiveAction } from "@/lib/db/schema";

export type CapaWithFindingTitle = CorrectiveAction & { findingTitle?: string };

export async function listCapas(
  orgId: string,
  filters: { findingId?: string; status?: string } = {}
): Promise<CorrectiveAction[]> {
  if (filters.findingId) {
    return capaRepo.findByFinding(orgId, filters.findingId);
  }
  return capaRepo.findByOrg(orgId, { status: filters.status });
}

export async function getCapa(
  orgId: string,
  capaId: string
): Promise<CorrectiveAction | null> {
  return capaRepo.findById(orgId, capaId);
}

export async function createCapa(params: {
  orgId: string;
  actorId: string;
  input: {
    findingId: string;
    title: string;
    description?: string | null;
    ownerId?: string | null;
    dueDate?: string | null;
  };
}): Promise<{ id: string }> {
  const title = (params.input.title || "").trim();
  if (title.length < 3) throw new DomainError("CAPA title must be at least 3 characters.");

  const finding = await findingRepo.findById(params.orgId, params.input.findingId);
  if (!finding) throw new DomainError("Finding not found.");

  let result!: { id: string };
  await db.transaction(async (tx) => {
    result = await capaRepo.insertCapa(
      {
        organizationId: params.orgId,
        findingId: params.input.findingId,
        title,
        description: params.input.description?.trim() ?? null,
        ownerId: params.input.ownerId ?? null,
        dueDate: params.input.dueDate ?? null,
        status: "open",
      },
      tx
    );
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "audit.capa_created",
        entityType: "corrective_action",
        entityId: result.id,
        metadata: { title, findingId: params.input.findingId },
      },
      tx
    );
  });

  // Move finding to remediating if it was open
  if (finding.status === "open") {
    findingRepo
      .updateFinding(finding.id, { status: "remediating" })
      .catch(() => {});
  }

  return result;
}

export async function updateCapa(params: {
  orgId: string;
  actorId: string;
  capaId: string;
  input: Partial<{
    title: string;
    description: string | null;
    ownerId: string | null;
    dueDate: string | null;
    status: "open" | "in_progress" | "completed" | "overdue";
    completionNotes: string | null;
  }>;
}): Promise<void> {
  const existing = await capaRepo.findById(params.orgId, params.capaId);
  if (!existing) throw new DomainError("CAPA not found.");

  await db.transaction(async (tx) => {
    await capaRepo.updateCapa(params.capaId, params.input, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "audit.capa_updated",
        entityType: "corrective_action",
        entityId: params.capaId,
        metadata: params.input,
      },
      tx
    );
  });
}

export async function completeCorrectiveAction(params: {
  orgId: string;
  actorId: string;
  capaId: string;
  completionNotes?: string;
}): Promise<void> {
  const existing = await capaRepo.findById(params.orgId, params.capaId);
  if (!existing) throw new DomainError("CAPA not found.");
  if (existing.status === "completed") throw new DomainError("CAPA is already completed.");

  await db.transaction(async (tx) => {
    await capaRepo.updateCapa(
      params.capaId,
      {
        status: "completed",
        completedAt: new Date(),
        completionNotes: params.completionNotes?.trim() ?? null,
      },
      tx
    );
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "audit.capa_completed",
        entityType: "corrective_action",
        entityId: params.capaId,
        metadata: { completionNotes: params.completionNotes ?? null },
      },
      tx
    );
  });
}
