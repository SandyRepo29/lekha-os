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
        s.status as subscription_status,
        bp.name as plan_name,
        bp.price_monthly
      FROM organizations o
      LEFT JOIN memberships m ON m.organization_id = o.id
      LEFT JOIN vendors v ON v.organization_id = o.id AND v.deleted_at IS NULL
      LEFT JOIN subscriptions s ON s.organization_id = o.id
      LEFT JOIN billing_plans bp ON bp.id = s.plan_id
      WHERE (${search} = '' OR o.name ILIKE ${`%${search}%`})
      GROUP BY o.id, o.name, o.industry, o.created_at, s.status, bp.name, bp.price_monthly
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
        o.id as org_id,
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
        bp.name as plan_name, bp.price_monthly
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
        t.assigned_to,
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

// ── suspendOrg / activateOrg ──────────────────────────────────────────────────

export async function suspendOrgAction(orgId: string): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role === "platform_support") return { error: "Insufficient permissions." };
  try {
    await db.execute(sql`
      UPDATE subscriptions SET status = 'suspended' WHERE organization_id = ${orgId}
    `);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_id)
      VALUES (${session.platformUserId}, ${session.email}, 'org_suspend', 'organization', ${orgId})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to suspend organization." }; }
}

export async function activateOrgAction(orgId: string): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role === "platform_support") return { error: "Insufficient permissions." };
  try {
    await db.execute(sql`
      UPDATE subscriptions SET status = 'active' WHERE organization_id = ${orgId}
    `);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_id)
      VALUES (${session.platformUserId}, ${session.email}, 'org_activate', 'organization', ${orgId})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to activate organization." }; }
}

// ── addOrgNote ────────────────────────────────────────────────────────────────

export async function addOrgNoteAction(formData: FormData): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session) return { error: "Unauthorized." };
  const orgId = formData.get("orgId") as string;
  const note = (formData.get("note") as string)?.trim();
  if (!orgId || !note) return { error: "Note is required." };
  try {
    await db.execute(sql`
      INSERT INTO platform_org_notes (organization_id, note, created_by)
      VALUES (${orgId}, ${note}, ${session.platformUserId})
    `);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_id)
      VALUES (${session.platformUserId}, ${session.email}, 'org_edit', 'org_note', ${orgId})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to add note." }; }
}

export async function getOrgNotesAction(orgId: string) {
  try {
    const rows = await db.execute(sql`
      SELECT n.id, n.note, n.created_at, pu.name as created_by_name
      FROM platform_org_notes n
      LEFT JOIN platform_users pu ON pu.id = n.created_by
      WHERE n.organization_id = ${orgId}
      ORDER BY n.created_at DESC
    `);
    return { data: rows as Array<Record<string, unknown>> };
  } catch { return { data: [] }; }
}

// ── extendTrial / changePlan ──────────────────────────────────────────────────

export async function extendTrialAction(orgId: string, days: number): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role === "platform_support") return { error: "Insufficient permissions." };
  try {
    await db.execute(sql`
      UPDATE subscriptions
      SET trial_ends_at = GREATEST(COALESCE(trial_ends_at, now()), now()) + (${String(days)} || ' days')::INTERVAL
      WHERE organization_id = ${orgId}
    `);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_id, target_label)
      VALUES (${session.platformUserId}, ${session.email}, 'org_edit', 'subscription', ${orgId}, ${`Extend trial +${days}d`})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to extend trial." }; }
}

export async function getPlansAction() {
  try {
    const rows = await db.execute(sql`SELECT id, name FROM billing_plans ORDER BY name`);
    return { data: rows as Array<Record<string, unknown>> };
  } catch { return { data: [] }; }
}

export async function changePlanAction(orgId: string, planId: string): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role === "platform_support") return { error: "Insufficient permissions." };
  try {
    await db.execute(sql`
      UPDATE subscriptions SET plan_id = ${planId}, status = 'active' WHERE organization_id = ${orgId}
    `);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_id)
      VALUES (${session.platformUserId}, ${session.email}, 'org_edit', 'subscription', ${orgId})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to change plan." }; }
}

// ── deactivate / activate tenant membership ───────────────────────────────────

export async function deactivateMemberAction(userId: string, orgId: string): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role === "platform_support") return { error: "Insufficient permissions." };
  try {
    await db.execute(sql`
      UPDATE memberships SET is_active = false WHERE user_id = ${userId} AND organization_id = ${orgId}
    `);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_id)
      VALUES (${session.platformUserId}, ${session.email}, 'user_deactivate', 'membership', ${userId})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to deactivate member." }; }
}

export async function activateMemberAction(userId: string, orgId: string): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role === "platform_support") return { error: "Insufficient permissions." };
  try {
    await db.execute(sql`
      UPDATE memberships SET is_active = true WHERE user_id = ${userId} AND organization_id = ${orgId}
    `);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_id)
      VALUES (${session.platformUserId}, ${session.email}, 'user_update', 'membership', ${userId})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to activate member." }; }
}

// ── deactivate / activate platform staff user ─────────────────────────────────

export async function deactivatePlatformUserAction(userId: string): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role !== "platform_owner") return { error: "Only Platform Owners can deactivate staff." };
  if (userId === session.platformUserId) return { error: "Cannot deactivate yourself." };
  try {
    await db.execute(sql`UPDATE platform_users SET is_active = false, updated_at = now() WHERE id = ${userId}`);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_id)
      VALUES (${session.platformUserId}, ${session.email}, 'user_deactivate', 'platform_user', ${userId})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to deactivate user." }; }
}

export async function activatePlatformUserAction(userId: string): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role !== "platform_owner") return { error: "Only Platform Owners can activate staff." };
  try {
    await db.execute(sql`UPDATE platform_users SET is_active = true, updated_at = now() WHERE id = ${userId}`);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_id)
      VALUES (${session.platformUserId}, ${session.email}, 'user_update', 'platform_user', ${userId})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to activate user." }; }
}

export async function updatePlatformUserRoleAction(userId: string, role: string): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role !== "platform_owner") return { error: "Only Platform Owners can change roles." };
  if (userId === session.platformUserId) return { error: "Cannot change your own role." };
  try {
    await db.execute(sql`
      UPDATE platform_users SET role = ${role as "platform_owner" | "platform_admin" | "platform_support"}, updated_at = now() WHERE id = ${userId}
    `);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_id, target_label)
      VALUES (${session.platformUserId}, ${session.email}, 'user_update', 'platform_user', ${userId}, ${`role -> ${role}`})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to update role." }; }
}

// ── mark invoice paid ─────────────────────────────────────────────────────────

export async function markInvoicePaidAction(invoiceId: string): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role === "platform_support") return { error: "Insufficient permissions." };
  try {
    await db.execute(sql`UPDATE invoices SET status = 'paid' WHERE id = ${invoiceId}`);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_id)
      VALUES (${session.platformUserId}, ${session.email}, 'system_config_update', 'invoice', ${invoiceId})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to mark invoice paid." }; }
}

// ── support tickets: create / update status / assign ─────────────────────────

export async function createTicketAction(formData: FormData): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session) return { error: "Unauthorized." };
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const priority = (formData.get("priority") as string) ?? "medium";
  const orgId = formData.get("orgId") as string | null;
  if (!title) return { error: "Title is required." };
  try {
    await db.execute(sql`
      INSERT INTO platform_support_tickets (title, description, priority, created_by, organization_id)
      VALUES (${title}, ${description || null}, ${priority}, ${session.platformUserId}, ${orgId || null})
    `);
    return {};
  } catch { return { error: "Failed to create ticket." }; }
}

export async function updateTicketStatusAction(ticketId: string, status: string): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session) return { error: "Unauthorized." };
  try {
    await db.execute(sql`
      UPDATE platform_support_tickets
      SET status = ${status},
          resolved_at = CASE WHEN ${status} = 'resolved' THEN now() ELSE resolved_at END,
          updated_at = now()
      WHERE id = ${ticketId}
    `);
    return {};
  } catch { return { error: "Failed to update ticket." }; }
}

export async function assignTicketAction(ticketId: string, assigneeId: string): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session) return { error: "Unauthorized." };
  try {
    await db.execute(sql`
      UPDATE platform_support_tickets SET assigned_to = ${assigneeId}, updated_at = now() WHERE id = ${ticketId}
    `);
    return {};
  } catch { return { error: "Failed to assign ticket." }; }
}

// ── createOrg / updateOrg / getOrgDetail ─────────────────────────────────────

export async function createOrgAction(formData: FormData): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role === "platform_support") return { error: "Insufficient permissions." };
  const name = (formData.get("name") as string)?.trim();
  const industry = (formData.get("industry") as string) || null;
  const companySize = (formData.get("company_size") as string) || null;
  if (!name) return { error: "Organization name is required." };
  try {
    await db.execute(sql`
      INSERT INTO organizations (name, industry, company_size)
      VALUES (${name}, ${industry}, ${companySize})
    `);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_label)
      VALUES (${session.platformUserId}, ${session.email}, 'system_config_update', 'organization', ${name})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to create organization. Name may already exist." }; }
}

export async function updateOrgAction(orgId: string, formData: FormData): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role === "platform_support") return { error: "Insufficient permissions." };
  const name = (formData.get("name") as string)?.trim();
  const industry = (formData.get("industry") as string) || null;
  const website = (formData.get("website") as string) || null;
  const companySize = (formData.get("company_size") as string) || null;
  if (!name) return { error: "Name is required." };
  try {
    await db.execute(sql`
      UPDATE organizations
      SET name = ${name}, industry = ${industry}, website = ${website}, company_size = ${companySize}, updated_at = now()
      WHERE id = ${orgId}
    `);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_id, target_label)
      VALUES (${session.platformUserId}, ${session.email}, 'org_edit', 'organization', ${orgId}, ${name})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to update organization." }; }
}

export async function getOrgDetailAction(orgId: string) {
  try {
    const [orgRows, memberRows, noteRows, auditRows] = await Promise.all([
      db.execute(sql`
        SELECT o.id, o.name, o.industry, o.company_size, o.website, o.created_at,
               s.status as subscription_status, bp.name as plan_name
        FROM organizations o
        LEFT JOIN subscriptions s ON s.organization_id = o.id
        LEFT JOIN billing_plans bp ON bp.id = s.plan_id
        WHERE o.id = ${orgId}
        LIMIT 1
      `),
      db.execute(sql`
        SELECT p.id, p.full_name, p.email, m.role, m.is_active, m.created_at
        FROM memberships m
        JOIN profiles p ON p.id = m.user_id
        WHERE m.organization_id = ${orgId}
        ORDER BY m.created_at ASC
      `),
      db.execute(sql`
        SELECT n.id, n.note, n.created_at, pu.name as created_by_name
        FROM platform_org_notes n
        LEFT JOIN platform_users pu ON pu.id = n.created_by
        WHERE n.organization_id = ${orgId}
        ORDER BY n.created_at DESC
        LIMIT 20
      `),
      db.execute(sql`
        SELECT action, target_type, target_label, created_at, platform_user_email
        FROM platform_audit_logs
        WHERE target_id = ${orgId}
        ORDER BY created_at DESC
        LIMIT 20
      `),
    ]);
    return {
      data: {
        org: (orgRows[0] as Record<string, unknown>) ?? null,
        members: memberRows as Array<Record<string, unknown>>,
        notes: noteRows as Array<Record<string, unknown>>,
        auditLogs: auditRows as Array<Record<string, unknown>>,
      },
    };
  } catch { return { data: null }; }
}

// ── feature flag CRUD + per-org overrides ─────────────────────────────────────

export async function createFeatureFlagAction(formData: FormData): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role !== "platform_owner") return { error: "Only Platform Owners can create flags." };
  const key = (formData.get("key") as string)?.trim().toLowerCase().replace(/\s+/g, "_");
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string) || null;
  const scope = (formData.get("scope") as string) || "global";
  if (!key || !name) return { error: "Key and name are required." };
  try {
    await db.execute(sql`
      INSERT INTO feature_flags (key, name, description, scope, enabled, rollout_pct)
      VALUES (${key}, ${name}, ${description}, ${scope}, false, 100)
    `);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_label)
      VALUES (${session.platformUserId}, ${session.email}, 'flag_update', 'feature_flag', ${key})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to create flag. Key may already exist." }; }
}

export async function deleteFeatureFlagAction(key: string): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role !== "platform_owner") return { error: "Only Platform Owners can delete flags." };
  try {
    await db.execute(sql`DELETE FROM feature_flags WHERE key = ${key}`);
    db.execute(sql`DELETE FROM tenant_feature_overrides WHERE flag_key = ${key}`).catch(() => {});
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_label)
      VALUES (${session.platformUserId}, ${session.email}, 'flag_update', 'feature_flag', ${`DELETE:${key}`})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to delete flag." }; }
}

export async function getOrgFlagOverridesAction(flagKey: string) {
  try {
    const rows = await db.execute(sql`
      SELECT tfo.id, tfo.organization_id, tfo.enabled, tfo.reason, tfo.updated_at,
             o.name as org_name
      FROM tenant_feature_overrides tfo
      JOIN organizations o ON o.id = tfo.organization_id
      WHERE tfo.flag_key = ${flagKey}
      ORDER BY o.name
    `);
    return { data: rows as Array<Record<string, unknown>> };
  } catch { return { data: [] }; }
}

export async function setOrgFlagOverrideAction(orgId: string, flagKey: string, enabled: boolean, reason?: string): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role === "platform_support") return { error: "Insufficient permissions." };
  try {
    await db.execute(sql`
      INSERT INTO tenant_feature_overrides (organization_id, flag_key, enabled, reason, updated_by)
      VALUES (${orgId}, ${flagKey}, ${enabled}, ${reason ?? null}, ${session.platformUserId})
      ON CONFLICT (organization_id, flag_key) DO UPDATE
        SET enabled = ${enabled}, reason = ${reason ?? null}, updated_by = ${session.platformUserId}, updated_at = now()
    `);
    return {};
  } catch { return { error: "Failed to set override." }; }
}

export async function removeOrgFlagOverrideAction(orgId: string, flagKey: string): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role === "platform_support") return { error: "Insufficient permissions." };
  try {
    await db.execute(sql`
      DELETE FROM tenant_feature_overrides WHERE organization_id = ${orgId} AND flag_key = ${flagKey}
    `);
    return {};
  } catch { return { error: "Failed to remove override." }; }
}

export async function getOrgsForSelectAction() {
  try {
    const rows = await db.execute(sql`SELECT id, name FROM organizations ORDER BY name LIMIT 200`);
    return { data: rows as unknown as Array<{ id: string; name: string }> };
  } catch { return { data: [] }; }
}

// ── subscription create / cancel ──────────────────────────────────────────────

export async function createSubscriptionAction(formData: FormData): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role === "platform_support") return { error: "Insufficient permissions." };
  const orgId = formData.get("org_id") as string;
  const planId = formData.get("plan_id") as string;
  const status = (formData.get("status") as string) || "trial";
  if (!orgId || !planId) return { error: "Organization and plan are required." };
  try {
    await db.execute(sql`
      INSERT INTO subscriptions (organization_id, plan_id, status, trial_ends_at)
      VALUES (${orgId}, ${planId}, ${status},
        CASE WHEN ${status} = 'trial' THEN now() + INTERVAL '14 days' ELSE NULL END)
      ON CONFLICT (organization_id) DO UPDATE
        SET plan_id = ${planId}, status = ${status}, updated_at = now()
    `);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_id)
      VALUES (${session.platformUserId}, ${session.email}, 'org_edit', 'subscription', ${orgId})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to create subscription." }; }
}

export async function cancelSubscriptionAction(orgId: string): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role === "platform_support") return { error: "Insufficient permissions." };
  try {
    await db.execute(sql`
      UPDATE subscriptions SET status = 'cancelled', cancel_at_period_end = true, updated_at = now()
      WHERE organization_id = ${orgId}
    `);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_id)
      VALUES (${session.platformUserId}, ${session.email}, 'org_edit', 'subscription_cancel', ${orgId})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to cancel subscription." }; }
}

export async function getOrgsWithoutSubscriptionAction() {
  try {
    const rows = await db.execute(sql`
      SELECT id, name FROM organizations
      WHERE id NOT IN (SELECT organization_id FROM subscriptions)
      ORDER BY name
    `);
    return { data: rows as unknown as Array<{ id: string; name: string }> };
  } catch { return { data: [] }; }
}

// ── module registry per-org overrides ────────────────────────────────────────

export async function getModuleOverridesAction() {
  try {
    const rows = await db.execute(sql`
      SELECT tfo.flag_key, tfo.organization_id, tfo.enabled, o.name as org_name
      FROM tenant_feature_overrides tfo
      JOIN organizations o ON o.id = tfo.organization_id
      ORDER BY tfo.flag_key, o.name
    `);
    return { data: rows as Array<Record<string, unknown>> };
  } catch { return { data: [] }; }
}

export async function setModuleOrgOverrideAction(orgId: string, moduleKey: string, enabled: boolean): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role === "platform_support") return { error: "Insufficient permissions." };
  try {
    await db.execute(sql`
      INSERT INTO tenant_feature_overrides (organization_id, flag_key, enabled, updated_by)
      VALUES (${orgId}, ${moduleKey}, ${enabled}, ${session.platformUserId})
      ON CONFLICT (organization_id, flag_key) DO UPDATE
        SET enabled = ${enabled}, updated_by = ${session.platformUserId}, updated_at = now()
    `);
    return {};
  } catch { return { error: "Failed to set module override." }; }
}

// ── vendor type template CRUD ─────────────────────────────────────────────────

export async function createVendorTypeAction(formData: FormData): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role === "platform_support") return { error: "Insufficient permissions." };
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string) || null;
  if (!name) return { error: "Name is required." };
  try {
    await db.execute(sql`
      INSERT INTO vendor_types (name, description, is_custom)
      VALUES (${name}, ${description}, false)
    `);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_label)
      VALUES (${session.platformUserId}, ${session.email}, 'system_config_update', 'vendor_type', ${name})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to create template." }; }
}

export async function updateVendorTypeAction(id: string, name: string, description: string): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role === "platform_support") return { error: "Insufficient permissions." };
  if (!name?.trim()) return { error: "Name is required." };
  try {
    await db.execute(sql`
      UPDATE vendor_types SET name = ${name.trim()}, description = ${description || null}
      WHERE id = ${id}
    `);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_id, target_label)
      VALUES (${session.platformUserId}, ${session.email}, 'system_config_update', 'vendor_type', ${id}, ${name})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to update template." }; }
}

// ── update platform user name/email ──────────────────────────────────────────

export async function updatePlatformUserProfileAction(userId: string, name: string, email: string): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role !== "platform_owner") return { error: "Only Platform Owners can edit staff profiles." };
  if (!name?.trim() || !email?.trim()) return { error: "Name and email are required." };
  try {
    await db.execute(sql`
      UPDATE platform_users SET name = ${name.trim()}, email = ${email.trim().toLowerCase()}, updated_at = now()
      WHERE id = ${userId}
    `);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_id, target_label)
      VALUES (${session.platformUserId}, ${session.email}, 'user_update', 'platform_user', ${userId}, ${name})
    `).catch(() => {});
    return {};
  } catch { return { error: "Failed to update user. Email may already exist." }; }
}

// ── org detail — subscription + billing + member management ──────────────────

export async function getOrgSubscriptionDetailAction(orgId: string) {
  try {
    const [subRows, planRows, vendorCount, userCount] = await Promise.all([
      db.execute(sql`
        SELECT s.id, s.status, s.current_period_start, s.current_period_end,
               s.cancel_at_period_end, s.grace_period_ends_at, s.created_at, s.plan_id,
               bp.name as plan_name, bp.price_monthly, bp.max_users, bp.max_vendors
        FROM subscriptions s
        LEFT JOIN billing_plans bp ON bp.id = s.plan_id
        WHERE s.organization_id = ${orgId}
        LIMIT 1
      `),
      db.execute(sql`SELECT id, name, price_monthly FROM billing_plans ORDER BY price_monthly NULLS FIRST`),
      db.execute(sql`SELECT COUNT(*) as count FROM vendors WHERE organization_id = ${orgId}`),
      db.execute(sql`SELECT COUNT(*) as count FROM memberships WHERE organization_id = ${orgId} AND is_active = true`),
    ]);
    return {
      data: {
        subscription: (subRows[0] as Record<string, unknown>) ?? null,
        plans: planRows as unknown as Array<Record<string, unknown>>,
        vendorCount: Number((vendorCount[0] as Record<string, unknown>)?.count ?? 0),
        userCount: Number((userCount[0] as Record<string, unknown>)?.count ?? 0),
      },
    };
  } catch { return { data: { subscription: null, plans: [], vendorCount: 0, userCount: 0 } }; }
}

export async function getOrgInvoicesAction(orgId: string) {
  try {
    const rows = await db.execute(sql`
      SELECT id, invoice_number, status, amount_cents, currency, due_at, created_at
      FROM invoices
      WHERE organization_id = ${orgId}
      ORDER BY created_at DESC
      LIMIT 50
    `);
    return { data: rows as unknown as Array<Record<string, unknown>> };
  } catch { return { data: [] as Array<Record<string, unknown>> }; }
}

export async function removeOrgMemberAction(userId: string, orgId: string): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role === "platform_support") return { error: "Insufficient permissions." };
  try {
    await db.execute(sql`
      DELETE FROM memberships WHERE user_id = ${userId} AND organization_id = ${orgId} AND role != 'owner'
    `);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_id, target_label)
      VALUES (${session.platformUserId}, ${session.email}, 'member_removed', 'organization', ${orgId}, ${userId})
    `).catch(() => {});
    return {};
  } catch (e) { return { error: String(e) }; }
}

export async function changeOrgMemberRoleAction(userId: string, orgId: string, role: string): Promise<{ error?: string }> {
  const session = await getPlatformSession();
  if (!session || session.role === "platform_support") return { error: "Insufficient permissions." };
  try {
    await db.execute(sql`UPDATE memberships SET role = ${role} WHERE user_id = ${userId} AND organization_id = ${orgId}`);
    db.execute(sql`
      INSERT INTO platform_audit_logs (platform_user_id, platform_user_email, action, target_type, target_id, target_label)
      VALUES (${session.platformUserId}, ${session.email}, 'role_changed', 'organization', ${orgId}, ${role})
    `).catch(() => {});
    return {};
  } catch (e) { return { error: String(e) }; }
}
