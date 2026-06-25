/**
 * subscription-engine.ts
 *
 * Pure TypeScript subscription lifecycle service for AUDT billing.
 * No Next.js imports. Framework-agnostic - safe to call from cron jobs,
 * server actions, REST handlers, or CLI scripts.
 *
 * Column mapping (existing schema has no trialEndsAt / gracePeriodEndsAt /
 * suspendedAt columns - we map them to available fields):
 *
 *   trialEndsAt        - currentPeriodEnd  (when status = 'trial')
 *   gracePeriodEndsAt  - currentPeriodEnd  (when status = 'grace_period')
 *   suspendedAt        - cancelledAt       (when status = 'suspended')
 *   paymentProviderSlug / enterpriseContract - stored in cancelReason as JSON
 *                         metadata prefix "__meta__:{...}" so it round-trips
 *                         without a schema migration.
 *
 * Active statuses: trial | active | grace_period | enterprise
 * Terminal statuses: suspended | expired | cancelled
 */

import { db } from "@/lib/db";
import { subscriptions, billingPlans } from "@/lib/db/schema";
import { eq, and, lt, inArray, sql } from "drizzle-orm";

// --- Types --------------------------------------------------------------------

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "grace_period"
  | "suspended"
  | "expired"
  | "cancelled"
  | "enterprise";

export const ACTIVE_STATUSES: SubscriptionStatus[] = [
  "trial",
  "active",
  "grace_period",
  "enterprise",
];

/** Metadata stored as a prefixed JSON string inside cancelReason. */
interface SubMeta {
  paymentProviderSlug?: string;
  enterpriseContract?: boolean;
  suspendedReason?: string;
  suspendedAt?: string; // ISO string
}

const META_PREFIX = "__meta__:";

function encodeMeta(meta: SubMeta): string {
  return META_PREFIX + JSON.stringify(meta);
}

function decodeMeta(cancelReason: string | null | undefined): SubMeta {
  if (!cancelReason?.startsWith(META_PREFIX)) return {};
  try {
    return JSON.parse(cancelReason.slice(META_PREFIX.length)) as SubMeta;
  } catch {
    return {};
  }
}

function mergeMetaIntoReason(
  existing: string | null | undefined,
  patch: Partial<SubMeta>
): string {
  const current = decodeMeta(existing);
  return encodeMeta({ ...current, ...patch });
}

// --- Internal helpers ---------------------------------------------------------

async function findPlanBySlug(slug: string) {
  // slug is the lowercase plan name used as a stable identifier.
  // billingPlans.name values are "Growth" / "Business" / "Enterprise".
  // Accept either exact match or case-insensitive match.
  const rows = await db
    .select()
    .from(billingPlans)
    .where(eq(billingPlans.isActive, true));

  const match = rows.find(
    (p) => p.name.toLowerCase() === slug.toLowerCase() || p.name === slug
  );
  return match ?? null;
}

async function findSubscriptionById(id: string) {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, id))
    .limit(1);
  return row ?? null;
}

async function findSubscriptionByOrg(orgId: string) {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, orgId))
    .limit(1);
  return row ?? null;
}

/** Attempt a best-effort finance_actions insert. Silently swallows errors if
 *  the table does not yet exist (pre-migration environments). */
async function tryRecordFinanceAction(params: {
  organizationId: string;
  subscriptionId: string;
  action: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.execute(
      sql`
        INSERT INTO finance_actions
          (organization_id, subscription_id, action, metadata, created_at)
        VALUES
          (
            ${params.organizationId}::uuid,
            ${params.subscriptionId}::uuid,
            ${params.action},
            ${JSON.stringify(params.metadata ?? {})}::jsonb,
            NOW()
          )
      `
    );
  } catch {
    // Table may not exist yet - non-fatal.
  }
}

// --- 1. createSubscription ----------------------------------------------------

/**
 * Create a new subscription for an org.
 *
 * - If trialDays > 0  - status = 'trial', currentPeriodEnd = now + trialDays
 * - Otherwise         - status = 'active', currentPeriodEnd = now + 12 months
 * - Stores paymentProviderSlug and enterpriseContract in cancelReason metadata.
 * - Records a 'subscription_created' finance_action (best-effort).
 */
export async function createSubscription(
  orgId: string,
  planSlug: string,
  options?: {
    trialDays?: number;
    enterpriseContract?: boolean;
    netDays?: number;
    paymentProviderSlug?: string;
  }
): Promise<{ subscriptionId: string }> {
  const plan = await findPlanBySlug(planSlug);
  if (!plan) {
    throw new Error(
      `Plan "${planSlug}" not found. Available slugs: growth, business, enterprise.`
    );
  }

  const trialDays = options?.trialDays ?? 0;
  const paymentProviderSlug = options?.paymentProviderSlug ?? "bank_transfer";
  const enterpriseContract = options?.enterpriseContract ?? false;

  const now = new Date();
  let status: SubscriptionStatus;
  let currentPeriodEnd: Date;

  if (trialDays > 0) {
    status = "trial";
    currentPeriodEnd = new Date(now.getTime() + trialDays * 86_400_000);
  } else {
    status = "active";
    const end = new Date(now);
    end.setMonth(end.getMonth() + 12);
    currentPeriodEnd = end;
  }

  const meta = encodeMeta({ paymentProviderSlug, enterpriseContract });

  const [inserted] = await db
    .insert(subscriptions)
    .values({
      organizationId: orgId,
      planId: plan.id,
      status,
      billingCycle: trialDays > 0 ? "trial" : "yearly",
      currentPeriodStart: now,
      currentPeriodEnd,
      cancelReason: meta,
      cancelAtPeriodEnd: false,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: subscriptions.organizationId,
      set: {
        planId: plan.id,
        status,
        billingCycle: trialDays > 0 ? "trial" : "yearly",
        currentPeriodStart: now,
        currentPeriodEnd,
        cancelReason: meta,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        updatedAt: now,
      },
    })
    .returning({ id: subscriptions.id, organizationId: subscriptions.organizationId });

  const subscriptionId = inserted.id;

  await tryRecordFinanceAction({
    organizationId: orgId,
    subscriptionId,
    action: "subscription_created",
    metadata: { planSlug, trialDays, paymentProviderSlug, enterpriseContract },
  });

  return { subscriptionId };
}

// --- 2. activateSubscription --------------------------------------------------

/**
 * Transition a subscription to 'active'.
 *
 * Sets currentPeriodStart = NOW(), currentPeriodEnd = NOW() + periodMonths.
 * Clears gracePeriodEndsAt (currentPeriodEnd overwrite) and suspendedAt
 * (cancelledAt cleared). Preserves existing metadata.
 */
export async function activateSubscription(
  subscriptionId: string,
  periodMonths = 12
): Promise<void> {
  const sub = await findSubscriptionById(subscriptionId);
  if (!sub) throw new Error(`Subscription ${subscriptionId} not found.`);

  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + periodMonths);

  // Preserve non-suspension metadata; clear suspended markers.
  const existingMeta = decodeMeta(sub.cancelReason);
  delete existingMeta.suspendedReason;
  delete existingMeta.suspendedAt;
  const newMeta = encodeMeta(existingMeta);

  await db
    .update(subscriptions)
    .set({
      status: "active",
      billingCycle: periodMonths === 1 ? "monthly" : "yearly",
      currentPeriodStart: now,
      currentPeriodEnd: end,
      cancelledAt: null,       // clears suspendedAt
      cancelReason: newMeta,   // clears gracePeriodEndsAt metadata
      cancelAtPeriodEnd: false,
      updatedAt: now,
    })
    .where(eq(subscriptions.id, subscriptionId));
}

// --- 3. enterGracePeriod ------------------------------------------------------

/**
 * Transition a subscription to 'grace_period'.
 *
 * Sets currentPeriodEnd = NOW() + graceDays (this acts as gracePeriodEndsAt).
 * The status column is set to 'grace_period'.
 */
export async function enterGracePeriod(
  subscriptionId: string,
  graceDays = 7
): Promise<void> {
  const sub = await findSubscriptionById(subscriptionId);
  if (!sub) throw new Error(`Subscription ${subscriptionId} not found.`);

  const now = new Date();
  const gracePeriodEndsAt = new Date(now.getTime() + graceDays * 86_400_000);

  // Preserve metadata but clear any suspension markers.
  const existingMeta = decodeMeta(sub.cancelReason);
  delete existingMeta.suspendedReason;
  delete existingMeta.suspendedAt;

  await db
    .update(subscriptions)
    .set({
      status: "grace_period",
      currentPeriodEnd: gracePeriodEndsAt,  // gracePeriodEndsAt mapped here
      cancelledAt: null,
      cancelReason: encodeMeta(existingMeta),
      updatedAt: now,
    })
    .where(eq(subscriptions.id, subscriptionId));
}

// --- 4. suspendSubscription ---------------------------------------------------

/**
 * Transition a subscription to 'suspended'.
 *
 * Records suspendedAt and reason in the cancelReason metadata field.
 * Also sets cancelledAt = NOW() as a DB-queryable suspended timestamp.
 */
export async function suspendSubscription(
  subscriptionId: string,
  reason?: string
): Promise<void> {
  const sub = await findSubscriptionById(subscriptionId);
  if (!sub) throw new Error(`Subscription ${subscriptionId} not found.`);

  const now = new Date();
  const meta = mergeMetaIntoReason(sub.cancelReason, {
    suspendedAt: now.toISOString(),
    suspendedReason: reason,
  });

  await db
    .update(subscriptions)
    .set({
      status: "suspended",
      cancelledAt: now,   // acts as suspendedAt for DB queries
      cancelReason: meta,
      updatedAt: now,
    })
    .where(eq(subscriptions.id, subscriptionId));
}

// --- 5. expireSubscription ----------------------------------------------------

/**
 * Transition a subscription to 'expired'.
 */
export async function expireSubscription(
  subscriptionId: string
): Promise<void> {
  const sub = await findSubscriptionById(subscriptionId);
  if (!sub) throw new Error(`Subscription ${subscriptionId} not found.`);

  await db
    .update(subscriptions)
    .set({
      status: "expired",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId));
}

// --- 6. cancelSubscription ---------------------------------------------------

/**
 * Cancel a subscription.
 *
 * - immediate = true  - status = 'cancelled', cancelledAt = NOW()
 * - immediate = false - cancelAtPeriodEnd = true (cron handles final cancel)
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediate = false
): Promise<void> {
  const sub = await findSubscriptionById(subscriptionId);
  if (!sub) throw new Error(`Subscription ${subscriptionId} not found.`);

  const now = new Date();

  if (immediate) {
    await db
      .update(subscriptions)
      .set({
        status: "cancelled",
        cancelledAt: now,
        cancelAtPeriodEnd: false,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, subscriptionId));
  } else {
    await db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, subscriptionId));
  }
}

// --- 7. checkAndExpireTrials --------------------------------------------------

/**
 * Find all trial subscriptions where currentPeriodEnd (trialEndsAt) < NOW()
 * and move them into grace_period with a 7-day window.
 *
 * Returns the count of subscriptions transitioned.
 */
export async function checkAndExpireTrials(): Promise<{ expired: number }> {
  const now = new Date();

  // Find expired trials.
  const expiredTrials = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, "trial"),
        lt(subscriptions.currentPeriodEnd, now)
      )
    );

  for (const { id } of expiredTrials) {
    try {
      await enterGracePeriod(id, 7);
    } catch {
      // Continue processing remaining trials even if one fails.
    }
  }

  return { expired: expiredTrials.length };
}

// --- 8. checkAndExpireGracePeriods -------------------------------------------

/**
 * Find all grace_period subscriptions where currentPeriodEnd (gracePeriodEndsAt)
 * < NOW() and suspend them.
 *
 * Returns the count of subscriptions suspended.
 */
export async function checkAndExpireGracePeriods(): Promise<{
  suspended: number;
}> {
  const now = new Date();

  const expired = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, "grace_period"),
        lt(subscriptions.currentPeriodEnd, now)
      )
    );

  for (const { id } of expired) {
    try {
      await suspendSubscription(id, "Grace period elapsed");
    } catch {
      // Continue processing remaining subscriptions.
    }
  }

  return { suspended: expired.length };
}

// --- 9. getSubscriptionStatus -------------------------------------------------

export type SubscriptionStatusResult = {
  subscription: typeof subscriptions.$inferSelect | null;
  daysUntilExpiry: number | null;
  isActive: boolean;
};

/**
 * Fetch the subscription for an org and compute derived fields:
 *
 *   daysUntilExpiry - days until currentPeriodEnd or trialEndsAt (same column),
 *                     null if no subscription or no end date.
 *   isActive        - true when status is trial | active | grace_period | enterprise.
 */
export async function getSubscriptionStatus(
  orgId: string
): Promise<SubscriptionStatusResult> {
  const sub = await findSubscriptionByOrg(orgId);

  if (!sub) {
    return { subscription: null, daysUntilExpiry: null, isActive: false };
  }

  const status = sub.status as SubscriptionStatus;
  const isActive = (ACTIVE_STATUSES as string[]).includes(status);

  let daysUntilExpiry: number | null = null;

  if (sub.currentPeriodEnd) {
    const msLeft = sub.currentPeriodEnd.getTime() - Date.now();
    daysUntilExpiry = Math.ceil(msLeft / 86_400_000);
  }

  return { subscription: sub, daysUntilExpiry, isActive };
}
