/**
 * Password Policy Service — Sprint B2.1
 * Server-side validation, history checking, expiry, lockout.
 */

import bcrypt from "bcryptjs";
import { DomainError } from "@/lib/services/errors";
import {
  getPasswordPolicy,
  getPasswordHistory,
  addPasswordHistory,
  getLockout,
  recordFailedAttempt,
  lockAccount,
  clearLockout,
  type PasswordPolicy,
} from "@/lib/repositories/security-command-center-repo";

export type PasswordValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

// ─── Validation ───────────────────────────────────────────────────────────────

export function validatePasswordStrength(
  password: string,
  policy: Pick<PasswordPolicy, "minLength"|"requireUppercase"|"requireLowercase"|"requireNumber"|"requireSpecial">
): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters.`);
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter.");
  }
  if (policy.requireNumber && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number.");
  }
  if (policy.requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character.");
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

/** Full validation: strength + history check. Throws DomainError on failure. */
export async function validateNewPassword(
  orgId: string,
  userId: string,
  newPassword: string
): Promise<void> {
  const policy = await getPasswordPolicy(orgId);

  // Default policy when none configured
  const effective: PasswordPolicy = policy ?? {
    id: "", organizationId: orgId,
    minLength: 8,
    requireUppercase: true, requireLowercase: true, requireNumber: true, requireSpecial: false,
    historyCount: 5, maxAgeDays: null,
    lockoutAttempts: 10, lockoutDurationMinutes: 30,
    createdAt: new Date(), updatedAt: new Date(),
  };

  const result = validatePasswordStrength(newPassword, effective);
  if (!result.valid) {
    throw new DomainError(result.errors.join(" "));
  }

  // Check password history
  if (effective.historyCount > 0) {
    const history = await getPasswordHistory(userId, effective.historyCount);
    for (const hash of history) {
      const reused = await bcrypt.compare(newPassword, hash);
      if (reused) {
        throw new DomainError(
          `You cannot reuse your last ${effective.historyCount} passwords. Please choose a different password.`
        );
      }
    }
  }
}

/** Record a new password hash in history. Call after successful Supabase updateUser. */
export async function recordPasswordChange(
  orgId: string,
  userId: string,
  newPassword: string
): Promise<void> {
  const hash = await bcrypt.hash(newPassword, 12);
  await addPasswordHistory(userId, orgId, hash);
}

// ─── Lockout ──────────────────────────────────────────────────────────────────

export async function checkLockout(email: string): Promise<void> {
  const lockout = await getLockout(email);
  if (!lockout) return;

  if (lockout.lockedUntil && lockout.lockedUntil > new Date()) {
    const remaining = Math.ceil((lockout.lockedUntil.getTime() - Date.now()) / 60_000);
    throw new DomainError(
      `Account temporarily locked due to multiple failed attempts. Try again in ${remaining} minute${remaining === 1 ? "" : "s"}.`
    );
  }
}

export async function recordFailedLogin(
  email: string,
  orgId: string | null,
  ipAddress?: string
): Promise<void> {
  const policy = orgId ? await getPasswordPolicy(orgId) : null;
  const maxAttempts = policy?.lockoutAttempts ?? 10;
  const durationMinutes = policy?.lockoutDurationMinutes ?? 30;

  if (maxAttempts === 0) return; // lockout disabled

  const lockout = await recordFailedAttempt(email, ipAddress);
  if (lockout.attemptCount >= maxAttempts) {
    await lockAccount(email, durationMinutes);
  }
}

export async function clearFailedAttempts(email: string): Promise<void> {
  await clearLockout(email);
}

// ─── Password expiry ──────────────────────────────────────────────────────────

export async function isPasswordExpired(
  orgId: string,
  passwordChangedAt: Date | null | undefined
): Promise<boolean> {
  const policy = await getPasswordPolicy(orgId);
  if (!policy?.maxAgeDays) return false;
  if (!passwordChangedAt) return true; // never changed = expired

  const expiryMs = policy.maxAgeDays * 86_400_000;
  return Date.now() - passwordChangedAt.getTime() > expiryMs;
}

// ─── Default policy ───────────────────────────────────────────────────────────

export async function getOrgPasswordPolicy(orgId: string): Promise<PasswordPolicy> {
  const policy = await getPasswordPolicy(orgId);
  return policy ?? {
    id: "", organizationId: orgId,
    minLength: 8,
    requireUppercase: true, requireLowercase: true, requireNumber: true, requireSpecial: false,
    historyCount: 5, maxAgeDays: null,
    lockoutAttempts: 10, lockoutDurationMinutes: 30,
    createdAt: new Date(), updatedAt: new Date(),
  };
}
