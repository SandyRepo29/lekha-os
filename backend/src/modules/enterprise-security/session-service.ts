/**
 * Session Service — Sprint B2.1
 * Session lifecycle, timeout enforcement, concurrent session limits, device detection.
 */

import type { UAParser } from "ua-parser-js";
import {
  createUserSession,
  updateSessionLastActive,
  getSessionById,
  countActiveSessions,
  revokeOldestSessions,
  getMfaSettings,
  getMfaStatusForUser,
} from "@/backend/src/modules/security-command-center/security-command-center-repo";

export type SessionInfo = {
  id: string;
  userId: string;
  organizationId: string;
  mfaVerified: boolean;
  lastActive: Date;
  createdAt: Date;
  expiresAt: Date | null;
  status: string;
};

// ─── Device detection ─────────────────────────────────────────────────────────

export async function parseUserAgent(ua: string): Promise<{ browser: string; os: string; device: string }> {
  const { UAParser } = await import("ua-parser-js") as { UAParser: new(ua: string) => UAParser };
  const parser = new UAParser(ua);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  return {
    browser: [browser.name, browser.version].filter(Boolean).join(" ") || "Unknown",
    os: [os.name, os.version].filter(Boolean).join(" ") || "Unknown",
    device: device.type || "desktop",
  };
}

// ─── Session creation ─────────────────────────────────────────────────────────

export async function createSession(params: {
  userId: string;
  orgId: string;
  ipAddress?: string;
  userAgent?: string;
  mfaVerified?: boolean;
}): Promise<{ sessionId: string; expiresAt: Date }> {
  const settings = await getMfaSettings(params.orgId);
  const absoluteHours = settings?.absoluteTimeoutHours ?? 8;
  const maxSessions = settings?.maxConcurrentSessions ?? 5;

  const expiresAt = new Date(Date.now() + absoluteHours * 3_600_000);

  // Parse user agent
  let browser: string | undefined;
  let os: string | undefined;
  let device: string | undefined;
  if (params.userAgent) {
    try {
      const parsed = await parseUserAgent(params.userAgent);
      browser = parsed.browser;
      os = parsed.os;
      device = parsed.device;
    } catch { /* non-fatal */ }
  }

  // Enforce concurrent session limit: revoke oldest before creating new
  const current = await countActiveSessions(params.userId, params.orgId);
  if (current >= maxSessions) {
    await revokeOldestSessions(params.userId, params.orgId, maxSessions - 1);
  }

  const session = await createUserSession({
    userId: params.userId,
    organizationId: params.orgId,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    browser,
    os,
    device,
    mfaVerified: params.mfaVerified ?? false,
    expiresAt,
  });

  return { sessionId: session.id, expiresAt };
}

// ─── Session validation ───────────────────────────────────────────────────────

export type SessionValidationResult =
  | { valid: true; session: SessionInfo; needsMfa: boolean }
  | { valid: false; reason: "not_found" | "revoked" | "idle_timeout" | "absolute_timeout" };

export async function validateSession(
  sessionId: string,
  orgId: string
): Promise<SessionValidationResult> {
  const session = await getSessionById(sessionId);
  if (!session) return { valid: false, reason: "not_found" };
  if (session.status !== "active") return { valid: false, reason: "revoked" };

  const settings = await getMfaSettings(orgId);
  const idleMinutes = settings?.idleTimeoutMinutes ?? 60;
  const absoluteHours = settings?.absoluteTimeoutHours ?? 8;

  // Check idle timeout
  const idleMs = idleMinutes * 60_000;
  if (Date.now() - session.lastActive.getTime() > idleMs) {
    return { valid: false, reason: "idle_timeout" };
  }

  // Check absolute timeout
  const absoluteMs = absoluteHours * 3_600_000;
  if (Date.now() - session.createdAt.getTime() > absoluteMs) {
    return { valid: false, reason: "absolute_timeout" };
  }

  // Check MFA requirement
  const mfaStatus = await getMfaStatusForUser(session.userId, orgId);
  const needsMfa = !session.mfaVerified && (mfaStatus?.enabled ?? false);

  return {
    valid: true,
    session: {
      id: session.id,
      userId: session.userId,
      organizationId: session.organizationId,
      mfaVerified: session.mfaVerified,
      lastActive: session.lastActive,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      status: session.status,
    },
    needsMfa,
  };
}

export async function touchSession(sessionId: string): Promise<void> {
  await updateSessionLastActive(sessionId);
}
