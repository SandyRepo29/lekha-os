import { db } from "@/lib/db";
import { billingPlans, subscriptions } from "@/lib/db/schema";
import type { BillingPlan, Subscription } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function listActivePlans(): Promise<BillingPlan[]> {
  return db
    .select()
    .from(billingPlans)
    .where(eq(billingPlans.isActive, true));
}

export async function findPlanByName(name: string): Promise<BillingPlan | null> {
  const [row] = await db
    .select()
    .from(billingPlans)
    .where(eq(billingPlans.name, name))
    .limit(1);
  return row ?? null;
}

export async function insertPlan(values: {
  name: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  maxUsers: number;
  maxVendors: number;
  maxStorageGb: number;
}): Promise<{ id: string }> {
  const [row] = await db
    .insert(billingPlans)
    .values(values)
    .returning({ id: billingPlans.id });
  return row;
}

export async function getSubscription(
  orgId: string
): Promise<(Subscription & { plan: BillingPlan }) | null> {
  const [row] = await db
    .select({
      subscription: subscriptions,
      plan: billingPlans,
    })
    .from(subscriptions)
    .innerJoin(billingPlans, eq(subscriptions.planId, billingPlans.id))
    .where(eq(subscriptions.organizationId, orgId))
    .limit(1);
  if (!row) return null;
  return { ...row.subscription, plan: row.plan };
}

export async function upsertSubscription(
  orgId: string,
  planId: string,
  values: {
    status?: string;
    billingCycle?: string;
    currentPeriodEnd?: Date | null;
  } = {}
): Promise<void> {
  await db
    .insert(subscriptions)
    .values({
      organizationId: orgId,
      planId,
      status: values.status ?? "trial",
      billingCycle: values.billingCycle ?? "trial",
      currentPeriodStart: new Date(),
      currentPeriodEnd: values.currentPeriodEnd ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: subscriptions.organizationId,
      set: {
        planId,
        status: values.status ?? "trial",
        billingCycle: values.billingCycle ?? "trial",
        updatedAt: new Date(),
      },
    });
}
