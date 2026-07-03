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

// ── getAllUsers (cross-tenant) ────────────────────────────────────────────────

export async function getAllUsersAction(page = 1, search = "") {
  const limit = 25;
  const offset = (page - 1) * limit;
  try {
    const rows = await db.execute(sql`
      SELECT
        p.id,
        p.full_name,
        p.email,
        m.role,
        o.name as org_name,
        m.is_active,
        m.created_at
      FROM profiles p
      JOIN memberships m ON m.user_id = p.id
      JOIN organizations o ON o.id = m.organization_id
      WHERE (${search} = '' OR p.full_name ILIKE ${`%${search}%`} OR p.email ILIKE ${`%${search}%`})
      ORDER BY m.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as total
      FROM profiles p JOIN memberships m ON m.user_id = p.id
      WHERE (${search} = '' OR p.full_name ILIKE ${`%${search}%`} OR p.email ILIKE ${`%${search}%`})
    `);
    return {
      data: {
        users: rows as Array<Record<string, unknown>>,
        total: Number((countResult[0] as Record<string, unknown>)?.total ?? 0),
        page,
        totalPages: Math.ceil(Number((countResult[0] as Record<string, unknown>)?.total ?? 0) / limit),
      },
    };
  } catch { return { data: null }; }
}

// ── getSubscriptions ──────────────────────────────────────────────────────────

export async function getSubscriptionsAction() {
  try {
    const rows = await db.execute(sql`
      SELECT
        s.id, s.status, s.trial_ends_at, s.current_period_start, s.current_period_end,
        s.cancel_at_period_end, s.created_at,
        o.name as org_name, o.id as org_id,
        bp.name as plan_name, bp.price_inr_monthly
      FROM subscriptions s
      JOIN organizations o ON o.id = s.organization_id
      LEFT JOIN billing_plans bp ON bp.id = s.plan_id
      ORDER BY s.created_at DESC
      LIMIT 100
    `);
    const stats = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'trial')        as trials,
        COUNT(*) FILTER (WHERE status = 'active')       as active,
        COUNT(*) FILTER (WHERE status = 'grace_period') as grace,
        COUNT(*) FILTER (WHERE status = 'suspended')    as suspended,
        COUNT(*) FILTER (WHERE status = 'expired')      as expired
      FROM subscriptions
    `);
    return { data: { subscriptions: rows as Array<Record<string, unknown>>, stats: stats[0] as Record<string, unknown> } };
  } catch { return { data: null }; }
}

// ── getBillingOverview ────────────────────────────────────────────────────────

export async function getBillingOverviewAction() {
  try {
    const invoices = await db.execute(sql`
      SELECT
        i.id, i.invoice_number, i.status, i.amount_cents, i.currency,
        i.issued_at, i.due_at,
        o.name as org_name
      FROM invoices i
      JOIN organizations o ON o.id = i.organization_id
      ORDER BY i.issued_at DESC
      LIMIT 50
    `).catch(() => [] as Record<string, unknown>[]);

    const stats = await db.execute(sql`
      SELECT
        COUNT(*)                                           as total,
        COUNT(*) FILTER (WHERE status = 'paid')           as paid,
        COUNT(*) FILTER (WHERE status = 'pending')        as pending,
        COUNT(*) FILTER (WHERE status = 'overdue')        as overdue,
        COALESCE(SUM(amount_cents) FILTER (WHERE status = 'paid'), 0) as revenue_cents
      FROM invoices
    `).catch(() => [{ total: 0, paid: 0, pending: 0, overdue: 0, revenue_cents: 0 }] as Record<string, unknown>[]);

    return { data: { invoices: invoices as Array<Record<string, unknown>>, stats: stats[0] as Record<string, unknown> } };
  } catch { return { data: null }; }
}

// ── getSystemHealth ───────────────────────────────────────────────────────────

export async function getSystemHealthAction() {
  try {
    const start = Date.now();
    const [orgCount, userCount, vendorCount, evidenceCount] = await Promise.all([
      db.execute(sql`SELECT COUNT(*) as n FROM organizations`),
      db.execute(sql`SELECT COUNT(*) as n FROM profiles`),
      db.execute(sql`SELECT COUNT(*) as n FROM vendors WHERE deleted_at IS NULL`),
      db.execute(sql`SELECT COUNT(*) as n FROM evidence`),
    ]);
    const latency = Date.now() - start;

    const recentActivity = await db.execute(sql`
      SELECT action, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 5
    `).catch(() => []);

    return {
      data: {
        latencyMs: latency,
        orgs:     Number((orgCount[0] as Record<string, unknown>).n),
        users:    Number((userCount[0] as Record<string, unknown>).n),
        vendors:  Number((vendorCount[0] as Record<string, unknown>).n),
        evidence: Number((evidenceCount[0] as Record<string, unknown>).n),
        recentActivity: recentActivity as Array<Record<string, unknown>>,
        checkedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    return { data: null, error: String(err) };
  }
}

// ── getAiCenter ───────────────────────────────────────────────────────────────

export async function getAiCenterAction() {
  try {
    const [insightsCount, recentInsights] = await Promise.all([
      db.execute(sql`SELECT COUNT(*) as n FROM ai_compliance_insights`),
      db.execute(sql`
        SELECT insight_type, target_id, generated_at
        FROM ai_compliance_insights
        ORDER BY generated_at DESC
        LIMIT 10
      `),
    ]);

    const promptLogs = await db.execute(sql`
      SELECT sensitivity, is_blocked, created_at
      FROM ai_prompt_logs
      ORDER BY created_at DESC
      LIMIT 20
    `).catch(() => []);

    const promptStats = await db.execute(sql`
      SELECT
        COUNT(*)                                       as total,
        COUNT(*) FILTER (WHERE is_blocked)             as blocked,
        COUNT(*) FILTER (WHERE sensitivity = 'high')   as high_sensitivity,
        COUNT(*) FILTER (WHERE created_at > now() - INTERVAL '24 hours') as last_24h
      FROM ai_prompt_logs
    `).catch(() => [{ total: 0, blocked: 0, high_sensitivity: 0, last_24h: 0 }]);

    return {
      data: {
        totalCachedInsights: Number((insightsCount[0] as Record<string, unknown>).n),
        recentInsights: recentInsights as Array<Record<string, unknown>>,
        promptStats: promptStats[0] as Record<string, unknown>,
        recentPrompts: promptLogs as Array<Record<string, unknown>>,
      },
    };
  } catch { return { data: null }; }
}

// ── sendPlatformNotification ──────────────────────────────────────────────────

export async function sendNotificationAction(formData: FormData): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session) return { error: "Unauthorized." };

  const title = formData.get("title") as string;
  const body  = formData.get("body") as string;
  const severity = (formData.get("severity") as string) ?? "info";

  if (!title || !body) return { error: "Title and body are required." };

  try {
    await db.execute(sql`
      INSERT INTO platform_notifications (title, body, severity, sent_by)
      VALUES (${title}, ${body}, ${severity}, ${session.platformUserId})
    `);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_label)
      VALUES (${session.platformUserId}, ${session.email}, 'data_export', 'notification', ${title})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to send notification." }; }
}

export async function getNotificationsAction() {
  try {
    const rows = await db.execute(sql`
      SELECT n.id, n.title, n.body, n.severity, n.sent_at, pu.name as sent_by_name
      FROM platform_notifications n
      LEFT JOIN platform_users pu ON pu.id = n.sent_by
      ORDER BY n.sent_at DESC
      LIMIT 30
    `);
    return { data: rows as Array<Record<string, unknown>> };
  } catch { return { data: [] }; }
}

// ── getSupportTickets ─────────────────────────────────────────────────────────

export async function getSupportTicketsAction() {
  try {
    const rows = await db.execute(sql`
      SELECT
        t.id, t.title, t.status, t.priority, t.created_at, t.resolved_at,
        o.name as org_name,
        pu.name as assigned_to_name
      FROM platform_support_tickets t
      LEFT JOIN organizations o ON o.id = t.organization_id
      LEFT JOIN platform_users pu ON pu.id = t.assigned_to
      ORDER BY t.created_at DESC
    `);
    return { data: rows as Array<Record<string, unknown>> };
  } catch { return { data: [] }; }
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
