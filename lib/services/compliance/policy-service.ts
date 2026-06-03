import { db } from "@/lib/db";
import { DomainError } from "@/lib/services/errors";
import * as policyRepo from "@/lib/repositories/policy-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";
import type { Policy, PolicyVersion } from "@/lib/db/schema";

export type PolicyWithVersions = Policy & {
  versions: PolicyVersion[];
};

// ---- Queries -------------------------------------------------

export async function listPolicies(orgId: string): Promise<Policy[]> {
  return policyRepo.findByOrg(orgId);
}

export async function getPolicy(
  orgId: string,
  id: string
): Promise<PolicyWithVersions | null> {
  const policy = await policyRepo.findById(orgId, id);
  if (!policy) return null;
  const versions = await policyRepo.findVersionsByPolicy(id);
  return { ...policy, versions };
}

// ---- Mutations -----------------------------------------------

export async function createPolicy(params: {
  orgId: string;
  actorId: string;
  input: {
    name: string;
    policyType?: string | null;
    owner?: string | null;
    reviewDate?: string | null;
    storagePath?: string | null;
  };
}): Promise<{ id: string }> {
  const name = (params.input.name || "").trim();
  if (name.length < 2) throw new DomainError("Policy name is required.");

  let result!: { id: string };
  await db.transaction(async (tx) => {
    result = await policyRepo.insertPolicy(
      {
        organizationId: params.orgId,
        name,
        policyType: params.input.policyType?.trim() || null,
        version: "1.0",
        owner: params.input.owner?.trim() || null,
        status: "draft",
        reviewDate: params.input.reviewDate || null,
        storagePath: params.input.storagePath || null,
        createdBy: params.actorId,
      },
      tx
    );

    // Auto-create the initial version record if there's a file
    if (params.input.storagePath) {
      await policyRepo.insertVersion(
        {
          policyId: result.id,
          version: "1.0",
          storagePath: params.input.storagePath,
          notes: "Initial version",
          createdBy: params.actorId,
        },
        tx
      );
    }

    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "compliance.policy_created",
        entityType: "policy",
        entityId: result.id,
        metadata: { name },
      },
      tx
    );
  });
  return result;
}

export async function updatePolicy(params: {
  orgId: string;
  actorId: string;
  policyId: string;
  input: {
    name?: string;
    policyType?: string | null;
    owner?: string | null;
    status?: "draft" | "review" | "approved" | "archived" | "expired";
    reviewDate?: string | null;
    approvalDate?: string | null;
    approver?: string | null;
  };
}): Promise<void> {
  const policy = await policyRepo.findById(params.orgId, params.policyId);
  if (!policy) throw new DomainError("Policy not found.");

  if (params.input.name !== undefined) {
    const name = params.input.name.trim();
    if (name.length < 2) throw new DomainError("Policy name is required.");
  }

  await db.transaction(async (tx) => {
    await policyRepo.updatePolicy(
      params.policyId,
      {
        name: params.input.name?.trim(),
        policyType: params.input.policyType,
        owner: params.input.owner,
        status: params.input.status,
        reviewDate: params.input.reviewDate,
        approvalDate: params.input.approvalDate,
        approver: params.input.approver,
      },
      tx
    );
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "compliance.policy_updated",
        entityType: "policy",
        entityId: params.policyId,
        metadata: params.input,
      },
      tx
    );
  });
}

export async function uploadNewVersion(params: {
  orgId: string;
  actorId: string;
  policyId: string;
  version: string;
  storagePath: string;
  notes?: string | null;
}): Promise<{ versionId: string }> {
  const policy = await policyRepo.findById(params.orgId, params.policyId);
  if (!policy) throw new DomainError("Policy not found.");

  const version = params.version.trim();
  if (!version) throw new DomainError("Version number is required.");

  let versionId!: string;
  await db.transaction(async (tx) => {
    const row = await policyRepo.insertVersion(
      {
        policyId: params.policyId,
        version,
        storagePath: params.storagePath,
        notes: params.notes?.trim() || null,
        createdBy: params.actorId,
      },
      tx
    );
    versionId = row.id;
    // Bump the current version on the parent record
    await policyRepo.updatePolicy(params.policyId, { version }, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "compliance.policy_version_uploaded",
        entityType: "policy",
        entityId: params.policyId,
        metadata: { version },
      },
      tx
    );
  });
  return { versionId };
}

export async function deletePolicy(params: {
  orgId: string;
  actorId: string;
  policyId: string;
}): Promise<void> {
  const policy = await policyRepo.findById(params.orgId, params.policyId);
  if (!policy) throw new DomainError("Policy not found.");

  await db.transaction(async (tx) => {
    await policyRepo.deletePolicy(params.orgId, params.policyId, tx);
    await recordAudit(
      {
        organizationId: params.orgId,
        actorId: params.actorId,
        action: "compliance.policy_deleted",
        entityType: "policy",
        entityId: params.policyId,
        metadata: { name: policy.name },
      },
      tx
    );
  });
}
