import * as billingRepo from "@/lib/repositories/billing-repo";
import * as vendorRepo from "@/lib/repositories/vendor-repo";
import * as teamRepo from "@/lib/repositories/team-repo";
import type { BillingPlan, Subscription } from "@/lib/db/schema";

export type BillingOverview = {
  subscription: (Subscription & { plan: BillingPlan }) | null;
  usage: {
    users: number;
    vendors: number;
  };
};

export async function getBillingOverview(orgId: string): Promise<BillingOverview> {
  const [subscription, members, vendorCount] = await Promise.all([
    billingRepo.getSubscription(orgId),
    teamRepo.listMembers(orgId),
    vendorRepo.countByOrg(orgId),
  ]);

  return {
    subscription,
    usage: {
      users: members.length,
      vendors: vendorCount,
    },
  };
}

/** Ensure a Starter subscription exists for the org. Called on org creation. */
export async function ensureStarterSubscription(orgId: string): Promise<void> {
  const existing = await billingRepo.getSubscription(orgId);
  if (existing) return;

  let starter = await billingRepo.findPlanByName("Starter");
  if (!starter) {
    await seedDefaultPlans();
    starter = await billingRepo.findPlanByName("Starter");
  }
  if (!starter) return;

  await billingRepo.upsertSubscription(orgId, starter.id, {
    status: "trial",
    billingCycle: "trial",
  });
}

export async function seedDefaultPlans(): Promise<void> {
  const plans = [
    {
      name: "Starter",
      description: "For small teams getting started with vendor governance",
      priceMonthly: 0,
      priceYearly: 0,
      features: ["Up to 5 users", "Up to 10 vendors", "1 GB storage", "Basic reports", "Email alerts"],
      maxUsers: 5,
      maxVendors: 10,
      maxStorageGb: 1,
    },
    {
      name: "Growth",
      description: "For growing teams managing compliance at scale",
      priceMonthly: 4999,
      priceYearly: 49999,
      features: ["Up to 25 users", "Up to 100 vendors", "10 GB storage", "All reports", "AI features", "Compliance module", "API access"],
      maxUsers: 25,
      maxVendors: 100,
      maxStorageGb: 10,
    },
    {
      name: "Enterprise",
      description: "Unlimited scale with dedicated support and custom integrations",
      priceMonthly: 0,
      priceYearly: 0,
      features: ["Unlimited users", "Unlimited vendors", "100 GB storage", "All modules", "Custom integrations", "SSO/SAML", "Dedicated support", "SLA"],
      maxUsers: 9999,
      maxVendors: 9999,
      maxStorageGb: 100,
    },
  ];

  for (const plan of plans) {
    const existing = await billingRepo.findPlanByName(plan.name);
    if (!existing) {
      await billingRepo.insertPlan(plan);
    }
  }
}
