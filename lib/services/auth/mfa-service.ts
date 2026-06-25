/**
 * MFA Service — Sprint B2.1
 * TOTP enrollment, verification, recovery codes, enforcement checks.
 * Uses otplib for RFC 6238 TOTP. Secrets encrypted with AES-256-GCM.
 */

import bcrypt from "bcryptjs";
import { DomainError } from "@/lib/services/errors";
import {
  getMfaStatusForUser,
  upsertUserMfaStatus,
  getMfaSettings,
} from "@/lib/repositories/security-command-center-repo";
import { encryptConfig, decryptConfig } from "@/lib/providers/crypto/config-cipher";

// ─── TOTP helpers ─────────────────────────────────────────────────────────────

async function getAuthenticator() {
  // otplib v12+ uses named export; v11 uses default. Handle both.
  const mod = await import("otplib");
  const auth = (mod as Record<string, unknown>).authenticator ?? (mod as Record<string, unknown>).default;
  if (!auth) throw new Error("otplib: authenticator not found");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (auth as any).options = { window: 1 }; // allow ±30-second drift
  return auth as {
    generateSecret: (bytes?: number) => string;
    keyuri: (user: string, service: string, secret: string) => string;
    verify: (opts: { token: string; secret: string }) => boolean;
  };
}

/** Encrypt a TOTP secret to a JSON string for TEXT column storage. */
function encryptSecret(secret: string): string {
  return JSON.stringify(encryptConfig({ totpSecret: secret }));
}

/** Decrypt a TOTP secret from the TEXT column. */
function decryptSecret(stored: string): string {
  const parsed = JSON.parse(stored) as Record<string, unknown>;
  const result = decryptConfig(parsed) as { totpSecret: string };
  return result.totpSecret;
}

// ─── Enrollment ───────────────────────────────────────────────────────────────

export async function startTotpEnrollment(
  userId: string,
  orgId: string,
  email: string,
  orgName: string
): Promise<{ otpAuthUrl: string; qrDataUrl: string }> {
  const auth = await getAuthenticator();
  const secret = auth.generateSecret(20);
  const otpAuthUrl = auth.keyuri(email, `AUDT - ${orgName}`, secret);

  const { toDataURL } = await import("qrcode");
  const qrDataUrl = await toDataURL(otpAuthUrl, { width: 200, margin: 1 });

  await upsertUserMfaStatus({
    userId,
    organizationId: orgId,
    totpSecret: encryptSecret(secret),
    enabled: false,
  });

  return { otpAuthUrl, qrDataUrl };
}

/** Verify the user's TOTP token and activate MFA. Returns recovery codes (plaintext, shown once). */
export async function confirmTotpEnrollment(
  userId: string,
  orgId: string,
  token: string
): Promise<string[]> {
  const status = await getMfaStatusForUser(userId, orgId);
  if (!status?.totpSecret) {
    throw new DomainError("MFA enrollment not started. Please scan the QR code first.");
  }

  const auth = await getAuthenticator();
  const secret = decryptSecret(status.totpSecret);
  const valid = auth.verify({ token, secret });
  if (!valid) {
    throw new DomainError("Invalid verification code. Please try again.");
  }

  const codes = generateRawRecoveryCodes();
  const hashed = await hashRecoveryCodes(codes);

  await upsertUserMfaStatus({
    userId,
    organizationId: orgId,
    enabled: true,
    method: "totp",
    recoveryCodes: hashed,
    enabledAt: new Date(),
    lastVerifiedAt: new Date(),
    recoveryCodesGeneratedAt: new Date(),
  });

  return codes;
}

/** Verify a TOTP code at login. */
export async function verifyTotpCode(
  userId: string,
  orgId: string,
  token: string
): Promise<boolean> {
  const status = await getMfaStatusForUser(userId, orgId);
  if (!status?.enabled || !status.totpSecret) return false;

  const auth = await getAuthenticator();
  const secret = decryptSecret(status.totpSecret);
  const valid = auth.verify({ token, secret });

  if (valid) {
    await upsertUserMfaStatus({ userId, organizationId: orgId, lastVerifiedAt: new Date() });
  }
  return valid;
}

/** Use a recovery code (consumes it on success). Returns true if valid. */
export async function useRecoveryCode(
  userId: string,
  orgId: string,
  code: string
): Promise<boolean> {
  const status = await getMfaStatusForUser(userId, orgId);
  if (!status?.enabled || !status.recoveryCodes?.length) return false;

  const normalised = code.replace(/\s/g, "").toUpperCase();
  let matchIndex = -1;
  for (let i = 0; i < status.recoveryCodes.length; i++) {
    const match = await bcrypt.compare(normalised, status.recoveryCodes[i]);
    if (match) { matchIndex = i; break; }
  }
  if (matchIndex === -1) return false;

  const remaining = [...status.recoveryCodes];
  remaining.splice(matchIndex, 1);

  await upsertUserMfaStatus({
    userId, organizationId: orgId,
    recoveryCodes: remaining,
    lastVerifiedAt: new Date(),
  });
  return true;
}

/** Regenerate all recovery codes. Previous codes are invalidated immediately. */
export async function regenerateRecoveryCodes(
  userId: string,
  orgId: string
): Promise<string[]> {
  const status = await getMfaStatusForUser(userId, orgId);
  if (!status?.enabled) throw new DomainError("MFA must be enabled before generating recovery codes.");

  const codes = generateRawRecoveryCodes();
  const hashed = await hashRecoveryCodes(codes);

  await upsertUserMfaStatus({
    userId, organizationId: orgId,
    recoveryCodes: hashed,
    recoveryCodesGeneratedAt: new Date(),
  });
  return codes;
}

/** Disable MFA. Respects org enforcement policy. */
export async function disableMfa(userId: string, orgId: string): Promise<void> {
  const settings = await getMfaSettings(orgId);
  if (settings?.enforcementMode === "required_all") {
    throw new DomainError("Your organization requires MFA for all users. Contact your administrator.");
  }

  await upsertUserMfaStatus({
    userId, organizationId: orgId,
    enabled: false,
    totpSecret: null,
    recoveryCodes: null,
    enabledAt: null,
    recoveryCodesGeneratedAt: null,
  });
}

// ─── Policy enforcement ───────────────────────────────────────────────────────

export type MfaRequirement = "none" | "optional" | "required";

export async function getMfaRequirement(
  orgId: string,
  userRole: string
): Promise<MfaRequirement> {
  const settings = await getMfaSettings(orgId);
  const mode = settings?.enforcementMode ?? "optional";
  if (mode === "optional") return "optional";
  if (mode === "required_all") return "required";
  if (mode === "required_admins") {
    const adminRoles = ["owner", "admin", "compliance_manager", "security_manager"];
    return adminRoles.includes(userRole) ? "required" : "optional";
  }
  return "none";
}

export async function isMfaEnrolled(userId: string, orgId: string): Promise<boolean> {
  const status = await getMfaStatusForUser(userId, orgId);
  return status?.enabled === true;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateRawRecoveryCodes(): string[] {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const part = (n: number) =>
      Array.from({ length: n }, () => charset[Math.floor(Math.random() * charset.length)]).join("");
    codes.push(`${part(5)}-${part(5)}`);
  }
  return codes;
}

async function hashRecoveryCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map(c => bcrypt.hash(c, 10)));
}
