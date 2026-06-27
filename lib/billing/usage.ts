import { getBillingOverview } from "@/lib/services/billing-service";

export type UsageWarning = {
  resource: string;
  current: number;
  limit: number;
  pct: number;
  level: "warn" | "critical";
};

export async function getUsageWarnings(orgId: string): Promise<UsageWarning[]> {
  try {
    const overview = await getBillingOverview(orgId);
    if (!overview.subscription) return [];
    const plan = overview.subscription.plan;
    const warnings: UsageWarning[] = [];

    function check(resource: string, current: number, limit: number) {
      if (limit >= 9999) return; // unlimited
      const pct = Math.round((current / limit) * 100);
      if (pct >= 90) {
        warnings.push({ resource, current, limit, pct, level: "critical" });
      } else if (pct >= 80) {
        warnings.push({ resource, current, limit, pct, level: "warn" });
      }
    }

    check("Vendors", overview.usage.vendors, plan.maxVendors);
    check("Team Members", overview.usage.users, plan.maxUsers);
    return warnings;
  } catch {
    return [];
  }
}
