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

/** Ensure a Growth (trial) subscription exists for the org. Called on org creation. */
export async function ensureStarterSubscription(orgId: string): Promise<void> {
  const existing = await billingRepo.getSubscription(orgId);
  if (existing) return;

  let growth = await billingRepo.findPlanByName("Growth");
  if (!growth) {
    await seedDefaultPlans();
    growth = await billingRepo.findPlanByName("Growth");
  }
  if (!growth) return;

  await billingRepo.upsertSubscription(orgId, growth.id, {
    status: "trial",
    billingCycle: "trial",
  });
}

export async function seedDefaultPlans(): Promise<void> {
  const plans = [
    {
      name: "Growth",
      description: "The complete governance foundation for fast-growing companies getting compliance-ready",
      priceMonthly: 250,   // $2,999/yr ÷ 12 ≈ $250/mo
      priceYearly: 2999,
      features: [
        "Up to 10 users",
        "All Core GRC modules",
        "DPDP Privacy™ & Contract Governance™",
        "Trust Intelligence™ & Trust Score™",
        "5 compliance frameworks",
        "Governance Copilot™ AI",
        "Email support",
      ],
      maxUsers: 10,
      maxVendors: 100,
      maxStorageGb: 10,
    },
    {
      name: "Business",
      description: "The full Governance OS for organizations scaling their trust program",
      priceMonthly: 583,   // $6,999/yr ÷ 12 ≈ $583/mo
      priceYearly: 6999,
      features: [
        "Up to 50 users",
        "All 32 modules",
        "Governance Agent Framework™",
        "Continuous Compliance™ (21 checks)",
        "Security Command Center™",
        "Integration Hub™ (35+ connectors)",
        "Trust Verification Authority™",
        "Auditor Collaboration™",
        "Priority support & onboarding",
      ],
      maxUsers: 50,
      maxVendors: 9999,
      maxStorageGb: 100,
    },
    {
      name: "Enterprise",
      description: "Tailored deployment for large, regulated organizations with complex governance requirements",
      priceMonthly: 0,
      priceYearly: 0,
      features: [
        "Unlimited users & organizations",
        "Customer Managed Encryption (AWS KMS, Azure, GCP)",
        "Custom SAML/OIDC SSO",
        "Dedicated Governance Agent™ configurations",
        "Custom compliance frameworks & controls",
        "SLA guarantees & dedicated success manager",
        "On-premise or private cloud deployment",
        "Custom API rate limits & webhooks",
      ],
      maxUsers: 9999,
      maxVendors: 9999,
      maxStorageGb: 9999,
    },
  ];

  for (const plan of plans) {
    const existing = await billingRepo.findPlanByName(plan.name);
    if (!existing) {
      await billingRepo.insertPlan(plan);
    }
  }
}
