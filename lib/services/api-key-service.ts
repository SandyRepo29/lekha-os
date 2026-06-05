import crypto from "crypto";
import bcrypt from "bcryptjs";
import { DomainError } from "./errors";
import * as apiKeyRepo from "@/lib/repositories/api-key-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";
import type { SafeApiKey } from "@/lib/repositories/api-key-repo";

const KEY_PREFIX = "lk_live_";
const SALT_ROUNDS = 10;

function generateRawKey(): string {
  return KEY_PREFIX + crypto.randomBytes(24).toString("hex");
}

export async function listKeys(orgId: string): Promise<SafeApiKey[]> {
  return apiKeyRepo.list(orgId);
}

export async function createKey(params: {
  orgId: string;
  actorId: string;
  name: string;
  permissions: "read_only" | "read_write" | "admin";
}): Promise<{ id: string; plainKey: string }> {
  const name = params.name.trim();
  if (!name) throw new DomainError("Key name is required.");
  if (name.length > 60) throw new DomainError("Key name is too long.");

  const plainKey = generateRawKey();
  const keyHash = await bcrypt.hash(plainKey, SALT_ROUNDS);
  const keyPrefix = plainKey.slice(0, 16);

  const { id } = await apiKeyRepo.create({
    organizationId: params.orgId,
    createdBy: params.actorId,
    name,
    keyPrefix,
    keyHash,
    permissions: params.permissions,
  });

  await recordAudit({
    organizationId: params.orgId,
    actorId: params.actorId,
    action: "api_key.created",
    entityType: "api_key",
    entityId: id,
    metadata: { name, permissions: params.permissions },
  });

  return { id, plainKey };
}

export async function revokeKey(params: {
  orgId: string;
  actorId: string;
  keyId: string;
}): Promise<void> {
  const key = await apiKeyRepo.findById(params.keyId, params.orgId);
  if (!key) throw new DomainError("API key not found.");
  if (key.status === "revoked") throw new DomainError("Key is already revoked.");

  await apiKeyRepo.revoke(params.keyId, params.orgId);
  await recordAudit({
    organizationId: params.orgId,
    actorId: params.actorId,
    action: "api_key.revoked",
    entityType: "api_key",
    entityId: params.keyId,
    metadata: { name: key.name },
  });
}

export async function rotateKey(params: {
  orgId: string;
  actorId: string;
  keyId: string;
}): Promise<{ plainKey: string }> {
  const key = await apiKeyRepo.findById(params.keyId, params.orgId);
  if (!key) throw new DomainError("API key not found.");
  if (key.status === "revoked") throw new DomainError("Cannot rotate a revoked key.");

  const plainKey = generateRawKey();
  const keyHash = await bcrypt.hash(plainKey, SALT_ROUNDS);
  const keyPrefix = plainKey.slice(0, 16);

  await apiKeyRepo.updateKeyHash(params.keyId, params.orgId, keyPrefix, keyHash);
  await recordAudit({
    organizationId: params.orgId,
    actorId: params.actorId,
    action: "api_key.rotated",
    entityType: "api_key",
    entityId: params.keyId,
    metadata: { name: key.name },
  });

  return { plainKey };
}
