"use server";

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PLATFORM_SID_COOKIE, getPlatformSession } from "./auth";

// ── login ─────────────────────────────────────────────────────────────────────

export async function loginAction(formData: FormData): Promise<{ error?: string }> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required." };

  try {
    const rows = await db.execute(sql`
      SELECT id, email, name, role, password_hash, is_active
      FROM platform_users
      WHERE email = ${email}
      LIMIT 1
    `);
    const user = rows[0] as Record<string, unknown> | undefined;
    if (!user || !user.is_active) return { error: "Invalid credentials." };

    const { compare } = await import("bcryptjs");
    const valid = await compare(password, user.password_hash as string);
    if (!valid) return { error: "Invalid credentials." };

    // Create session (8h)
    const sessionRows = await db.execute(sql`
      INSERT INTO platform_sessions (platform_user_id, expires_at)
      VALUES (${user.id as string}, now() + INTERVAL '8 hours')
      RETURNING id
    `);
    const sessionId = (sessionRows[0] as Record<string, unknown>).id as string;

    // Update last_login_at
    db.execute(sql`
      UPDATE platform_users SET last_login_at = now() WHERE id = ${user.id as string}
    `).catch(() => {});

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(PLATFORM_SID_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 3600,
      path: "/platform-admin",
    });

    // Audit log
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, session_id)
      VALUES (${user.id as string}, ${email}, 'login', ${sessionId})
    `).catch(() => {});
  } catch (err) {
    console.error("Platform login error:", err);
    return { error: "Login failed. Please try again." };
  }

  redirect("/platform-admin");
}

// ── logout ────────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const sid = cookieStore.get(PLATFORM_SID_COOKIE)?.value;
  if (sid) {
    db.execute(sql`
      UPDATE platform_sessions SET status = 'revoked' WHERE id = ${sid}
    `).catch(() => {});
  }
  cookieStore.delete(PLATFORM_SID_COOKIE);
  redirect("/platform-admin/login");
}

// ── getDashboardData ──────────────────────────────────────────────────────────

export async function getPlatformDashboardData() {
  try {
    const [orgsResult, usersResult, vendorsResult, auditResult] = await Promise.all([
      db.execute(sql`SELECT COUNT(*) as total FROM organizations`),
      db.execute(sql`SELECT COUNT(*) as total FROM profiles`),
      db.execute(sql`SELECT COUNT(*) as total FROM vendors WHERE deleted_at IS NULL`),
      db.execute(sql`
        SELECT platform_user_email, action, target_label, created_at
        FROM platform_audit_logs
        ORDER BY created_at DESC
        LIMIT 10
      `),
    ]);

    const recentSignups = await db.execute(sql`
      SELECT id, name, industry, created_at
      FROM organizations
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const activeOrgs = await db.execute(sql`
      SELECT COUNT(DISTINCT organization_id) as total
      FROM memberships
      WHERE created_at > now() - INTERVAL '30 days'
    `);

    return {
      data: {
        totalOrgs: Number((orgsResult[0] as Record<string, unknown>)?.total ?? 0),
        totalUsers: Number((usersResult[0] as Record<string, unknown>)?.total ?? 0),
        totalVendors: Number((vendorsResult[0] as Record<string, unknown>)?.total ?? 0),
        activeOrgs30d: Number((activeOrgs[0] as Record<string, unknown>)?.total ?? 0),
        recentSignups: recentSignups as Array<Record<string, unknown>>,
        recentAuditLogs: auditResult as Array<Record<string, unknown>>,
      },
    };
  } catch (err) {
    console.error("Platform dashboard error:", err);
    return { data: null };
  }
}

// ── getOrganizations ──────────────────────────────────────────────────────────

export async function getOrganizationsAction(page = 1, search = "") {
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const rows = await db.execute(sql`
      SELECT
        o.id,
        o.name,
        o.industry,
        o.created_at,
        COUNT(DISTINCT m.user_id) as member_count,
        COUNT(DISTINCT v.id) as vendor_count,
        s.status as subscription_status
      FROM organizations o
      LEFT JOIN memberships m ON m.organization_id = o.id
      LEFT JOIN vendors v ON v.organization_id = o.id AND v.deleted_at IS NULL
      LEFT JOIN subscriptions s ON s.organization_id = o.id
      WHERE (${search} = '' OR o.name ILIKE ${`%${search}%`})
      GROUP BY o.id, o.name, o.industry, o.created_at, s.status
      ORDER BY o.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const countResult = await db.execute(sql`
      SELECT COUNT(*) as total FROM organizations
      WHERE (${search} = '' OR name ILIKE ${`%${search}%`})
    `);

    return {
      data: {
        orgs: rows as Array<Record<string, unknown>>,
        total: Number((countResult[0] as Record<string, unknown>)?.total ?? 0),
        page,
        totalPages: Math.ceil(Number((countResult[0] as Record<string, unknown>)?.total ?? 0) / limit),
      },
    };
  } catch (err) {
    console.error("getOrganizations error:", err);
    return { data: null };
  }
}

// ── getFeatureFlags ───────────────────────────────────────────────────────────

export async function getFeatureFlagsAction() {
  try {
    const rows = await db.execute(sql`
      SELECT id, key, name, description, enabled, scope, rollout_pct, created_at, updated_at
      FROM feature_flags
      ORDER BY name ASC
    `);
    return { data: rows as Array<Record<string, unknown>> };
  } catch (err) {
    console.error("getFeatureFlags error:", err);
    return { data: [] };
  }
}

// ── toggleFeatureFlag ─────────────────────────────────────────────────────────

export async function toggleFeatureFlagAction(key: string, enabled: boolean): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session) return { error: "Unauthorized." };

  try {
    await db.execute(sql`
      UPDATE feature_flags SET enabled = ${enabled}, updated_at = now() WHERE key = ${key}
    `);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_id, target_label)
      VALUES (${session.platformUserId}, ${session.email}, 'flag_update', 'feature_flag', ${key}, ${key})
    `).catch(() => {});
    return {};
  } catch {
    return { error: "Failed to update flag." };
  }
}

// ── getPlatformUsers ──────────────────────────────────────────────────────────

export async function getPlatformUsersAction() {
  try {
    const rows = await db.execute(sql`
      SELECT id, email, name, role, is_active, totp_enabled, last_login_at, created_at
      FROM platform_users
      ORDER BY created_at DESC
    `);
    return { data: rows as Array<Record<string, unknown>> };
  } catch (err) {
    console.error("getPlatformUsers error:", err);
    return { data: [] };
  }
}

// ── createPlatformUser ────────────────────────────────────────────────────────

export async function createPlatformUserAction(formData: FormData): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role !== "platform_owner") return { error: "Only Platform Owners can create users." };

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const name = formData.get("name") as string;
  const role = formData.get("role") as string;
  const password = formData.get("password") as string;

  if (!email || !name || !role || !password) return { error: "All fields are required." };
  if (password.length < 12) return { error: "Password must be at least 12 characters." };

  try {
    const { hash } = await import("bcryptjs");
    const passwordHash = await hash(password, 12);

    await db.execute(sql`
      INSERT INTO platform_users (email, name, role, password_hash)
      VALUES (${email}, ${name}, ${role as "platform_owner" | "platform_admin" | "platform_support"}, ${passwordHash})
    `);

    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_label)
      VALUES (${session.platformUserId}, ${session.email}, 'user_create', 'platform_user', ${email})
    `).catch(() => {});

    return {};
  } catch {
    return { error: "Failed to create user. Email may already exist." };
  }
}

// ── getAuditLogs ─────────────────────────────────────────────────────────────

export async function getPlatformAuditLogsAction(page = 1) {
  const limit = 30;
  const offset = (page - 1) * limit;

  try {
    const rows = await db.execute(sql`
      SELECT platform_user_email, action, target_type, target_label, ip_address, impersonating_org_id, created_at
      FROM platform_audit_logs
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);
    const countResult = await db.execute(sql`SELECT COUNT(*) as total FROM platform_audit_logs`);
    return {
      data: {
        logs: rows as Array<Record<string, unknown>>,
        total: Number((countResult[0] as Record<string, unknown>)?.total ?? 0),
      },
    };
  } catch {
    return { data: { logs: [], total: 0 } };
  }
}
