import * as integrationRepo from "@/lib/repositories/integration-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";
import { DomainError } from "./errors";
import type { Integration } from "@/lib/db/schema";

export async function getIntegrations(orgId: string): Promise<Integration[]> {
  await integrationRepo.initProviders(orgId);
  return integrationRepo.listByOrg(orgId);
}

export async function connectIntegration(params: {
  orgId: string;
  actorId: string;
  provider: Integration["provider"];
  config: Record<string, unknown>;
}): Promise<void> {
  if (!params.provider) throw new DomainError("Provider is required.");

  await integrationRepo.upsert(params.orgId, params.provider, {
    config: params.config,
    status: "connected",
    connectedAt: new Date(),
  });

  await recordAudit({
    organizationId: params.orgId,
    actorId: params.actorId,
    action: "integration.connected",
    entityType: "integration",
    metadata: { provider: params.provider },
  });
}

export async function disconnectIntegration(params: {
  orgId: string;
  actorId: string;
  provider: Integration["provider"];
}): Promise<void> {
  await integrationRepo.upsert(params.orgId, params.provider, {
    config: {},
    status: "disconnected",
    connectedAt: null,
  });

  await recordAudit({
    organizationId: params.orgId,
    actorId: params.actorId,
    action: "integration.disconnected",
    entityType: "integration",
    metadata: { provider: params.provider },
  });
}
