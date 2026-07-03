import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PlatformRole = "platform_owner" | "platform_admin" | "platform_support";

export interface PlatformSession {
  id: string;
  platformUserId: string;
  email: string;
  name: string;
  role: PlatformRole;
  mfaVerified: boolean;
  impersonatingOrgId: string | null;
  impersonationReason: string | null;
  expiresAt: Date;
}

// ── Cookie name ───────────────────────────────────────────────────────────────

export const PLATFORM_SID_COOKIE = "audt-platform-sid";

// ── requirePlatformUser ───────────────────────────────────────────────────────

export async function requirePlatformUser(): Promise<PlatformSession> {
  const session = await getPlatformSession();
  if (!session) {
    // Throw a redirect-style error that the layout catches
    const { redirect } = await import("next/navigation");
    redirect("/platform-admin/login");
  }
  return session;
}

// ── getPlatformSession ────────────────────────────────────────────────────────

export async function getPlatformSession(): Promise<PlatformSession | null> {
  try {
    const cookieStore = await cookies();
    const sid = cookieStore.get(PLATFORM_SID_COOKIE)?.value;
    if (!sid) return null;

    const rows = await db.execute(sql`
      SELECT
        ps.id,
        ps.platform_user_id,
        ps.mfa_verified,
        ps.impersonating_org_id,
        ps.impersonation_reason,
        ps.expires_at,
        pu.email,
        pu.name,
        pu.role,
        pu.is_active
      FROM platform_sessions ps
      JOIN platform_users pu ON pu.id = ps.platform_user_id
      WHERE ps.id = ${sid}
        AND ps.status = 'active'
        AND ps.expires_at > now()
        AND pu.is_active = true
      LIMIT 1
    `);

    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;

    // Update last_active (fire-and-forget)
    db.execute(sql`
      UPDATE platform_sessions SET last_active = now() WHERE id = ${sid}
    `).catch(() => {});

    return {
      id: row.id as string,
      platformUserId: row.platform_user_id as string,
      email: row.email as string,
      name: row.name as string,
      role: row.role as PlatformRole,
      mfaVerified: row.mfa_verified as boolean,
      impersonatingOrgId: (row.impersonating_org_id as string) ?? null,
      impersonationReason: (row.impersonation_reason as string) ?? null,
      expiresAt: new Date(row.expires_at as string),
    };
  } catch {
    return null;
  }
}

// ── requireRole ───────────────────────────────────────────────────────────────

export function requireRole(session: PlatformSession, ...roles: PlatformRole[]): void {
  if (!roles.includes(session.role)) {
    const { redirect } = require("next/navigation");
    redirect("/platform-admin?error=forbidden");
  }
}

// ── isOwner / isAdmin ─────────────────────────────────────────────────────────

export const isOwner = (s: PlatformSession) => s.role === "platform_owner";
export const isAdmin = (s: PlatformSession) => s.role === "platform_owner" || s.role === "platform_admin";
