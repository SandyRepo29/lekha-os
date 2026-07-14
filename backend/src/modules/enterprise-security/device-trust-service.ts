/**
 * Device Trust Service — Sprint B2.1
 * Device fingerprint management, trust/revoke.
 */

import {
  getTrustedDevice,
  listTrustedDevices,
  upsertTrustedDevice,
  revokeTrustedDevice,
  getMfaSettings,
  type TrustedDevice,
} from "@/backend/src/modules/security-command-center/security-command-center-repo";

export { type TrustedDevice };

/** Check if a device fingerprint is trusted for this user. */
export async function isDeviceTrusted(userId: string, fingerprint: string): Promise<boolean> {
  const device = await getTrustedDevice(userId, fingerprint);
  return device?.trusted === true;
}

/** Trust a device after successful MFA. */
export async function trustDevice(params: {
  userId: string;
  orgId: string;
  fingerprint: string;
  browser?: string;
  os?: string;
  deviceName?: string;
  ipAddress?: string;
}): Promise<void> {
  const settings = await getMfaSettings(params.orgId);
  const rememberDays = settings?.rememberDays ?? 30;
  const expiresAt = new Date(Date.now() + rememberDays * 86_400_000);

  await upsertTrustedDevice({
    userId: params.userId,
    organizationId: params.orgId,
    deviceFingerprint: params.fingerprint,
    browser: params.browser,
    os: params.os,
    deviceName: params.deviceName,
    ipAddress: params.ipAddress,
    expiresAt,
  });
}

/** List all trusted devices for a user. */
export async function getUserDevices(userId: string, orgId: string): Promise<TrustedDevice[]> {
  return listTrustedDevices(userId, orgId);
}

/** Revoke a specific trusted device by ID. */
export async function revokeDevice(userId: string, deviceId: string): Promise<void> {
  await revokeTrustedDevice(userId, deviceId);
}

/** Generate a device fingerprint from request headers (server-side). */
export function buildDeviceFingerprint(headers: {
  userAgent?: string | null;
  acceptLanguage?: string | null;
}): string {
  // Simple but stable fingerprint: hash of UA + accept-language
  const raw = `${headers.userAgent ?? ""}|${headers.acceptLanguage ?? ""}`;
  // djb2 hash (no crypto needed, not security-critical — just for stable identity)
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
