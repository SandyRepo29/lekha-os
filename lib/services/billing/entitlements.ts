/**
 * Feature Entitlements — plan-level feature gating.
 * Pure module: no Next.js imports. All checks are server-side.
 *
 * Usage:
 *   const ent = await getEntitlements(orgId);
 *   if (!ent.can("governance_agents")) redirect("/settings/billing");
 *
 *   // or throw-style gate:
 *   await requireFeature(orgId, "api_access");
 */

import * as billingRepo from "@/lib/repositories/billing-repo";
import { DomainError } from "@/lib/services/errors";

// ─── Feature key registry ────────────────────────────────────────────────────

export type FeatureKey =
  | "core_grc"                // Vendor Hub, Compliance, Audits, Risks, Controls, Settings
  | "trust_intelligence"      // Trust Intelligence™ (all 9 tabs)
  | "trust_score"             // Trust Score™ per vendor
  | "contract_governance"     // Contract Governance™
  | "issue_hub"               // Issue & Remediation Hub™
  | "dpdp_privacy"            // DPDP Privacy™
  | "policy_governance"       // Policy Governance™
  | "workflow_studio"         // Workflow Studio™
  | "trust_exchange"          // Third-Party Risk Exchange™ (basic)
  | "ai_governance"           // AI Governance™ module
  | "governance_agents"       // Governance Agent Framework™
  | "executive_reporting"     // Executive Reporting & Analytics™
  | "benchmarking"            // Governance Benchmarking™
  | "api_access"              // Trust API Platform™
  | "integration_hub"         // Integration Hub™ (35+ connectors)
  | "security_command_center" // Security Command Center™
  | "continuous_compliance"   // Continuous Compliance™ (21 automated checks)
  | "auditor_collaboration"   // Auditor Collaboration™
  | "trust_verification"      // Trust Verification Authority™
  | "trust_network"           // Trust Network™
  | "regulatory_intelligence" // Regulatory Intelligence™
  | "asset_intelligence"      // Asset Intelligence™
  | "trust_graph"             // Trust Graph™
  | "governance_trends"       // Governance Trends™ + Monitoring
  | "unlimited_vendors"       // No vendor count cap
  | "unlimited_users"         // No user count cap
  | "priority_support"        // Priority SLA
  | "custom_frameworks"       // Unlimited custom compliance frameworks
  | "cmk"                     // Customer Managed Encryption (Enterprise)
  | "sso"                     // SSO / SAML (Sprint B2)
  | "scim"                    // SCIM provisioning (Sprint B2)
  | "dedicated_success";      // Dedicated CSM (Enterprise)

// ─── Plan → feature map ───────────────────────────────────────────────────────

const GROWTH_FEATURES = new Set<FeatureKey>([
  "core_grc",
  "trust_intelligence",
  "trust_score",
  "contract_governance",
  "issue_hub",
  "dpdp_privacy",
  "policy_governance",
  "workflow_studio",
  "trust_exchange",
  "trust_graph",
  "governance_trends",
  "custom_frameworks",
]);

const BUSINESS_FEATURES = new Set<FeatureKey>([
  ...GROWTH_FEATURES,
  "ai_governance",
  "governance_agents",
  "executive_reporting",
  "benchmarking",
  "api_access",
  "integration_hub",
  "security_command_center",
  "continuous_compliance",
  "auditor_collaboration",
  "trust_verification",
  "trust_network",
  "regulatory_intelligence",
  "asset_intelligence",
  "unlimited_vendors",
  "unlimited_users",
  "priority_support",
]);

const ENTERPRISE_FEATURES = new Set<FeatureKey>([
  ...BUSINESS_FEATURES,
  "cmk",
  "sso",
  "scim",
  "dedicated_success",
]);

const PLAN_FEATURES: Record<string, Set<FeatureKey>> = {
  Starter:    GROWTH_FEATURES,    // Starter = Growth feature set, lower limits
  Growth:     GROWTH_FEATURES,
  Business:   BUSINESS_FEATURES,
  Enterprise: ENTERPRISE_FEATURES,
};

// All features available during trial to maximise conversion
const TRIAL_FEATURES: Set<FeatureKey> = ENTERPRISE_FEATURES;

// ─── Public API ───────────────────────────────────────────────────────────────

export type Entitlements = {
  plan: string;
  status: string;
  isTrial: boolean;
  can: (key: FeatureKey) => boolean;
  /** All feature keys available to this org */
  features: Set<FeatureKey>;
};

export async function getEntitlements(orgId: string): Promise<Entitlements> {
  const sub = await billingRepo.getSubscription(orgId);

  // No subscription yet — grant full access (prevents blocking new orgs)
  if (!sub) {
    return {
      plan: "Trial",
      status: "trial",
      isTrial: true,
      can: () => true,
      features: TRIAL_FEATURES,
    };
  }

  const isTrial = sub.status === "trial";
  const planName = sub.plan?.name ?? "Growth";
  const features = isTrial ? TRIAL_FEATURES : (PLAN_FEATURES[planName] ?? GROWTH_FEATURES);

  return {
    plan: planName,
    status: sub.status,
    isTrial,
    can: (key) => features.has(key),
    features,
  };
}

/** Throw DomainError when org cannot access the requested feature. */
export async function requireFeature(orgId: string, key: FeatureKey): Promise<void> {
  const ent = await getEntitlements(orgId);
  if (!ent.can(key)) {
    const upgradeTarget = ent.plan === "Growth" || ent.plan === "Starter" ? "Business" : "Enterprise";
    throw new DomainError(
      `This feature requires the ${upgradeTarget} plan. Upgrade at /settings/billing.`
    );
  }
}

/** Quick check — true if org can use the feature. Does not throw. */
export async function canUseFeature(orgId: string, key: FeatureKey): Promise<boolean> {
  const ent = await getEntitlements(orgId);
  return ent.can(key);
}

/** Return which plan unlocks a given feature key (for UI "upgrade to unlock" messages). */
export function featureRequiresPlan(key: FeatureKey): string {
  if (ENTERPRISE_FEATURES.has(key) && !BUSINESS_FEATURES.has(key)) return "Enterprise";
  if (BUSINESS_FEATURES.has(key) && !GROWTH_FEATURES.has(key)) return "Business";
  return "Growth";
}

/** Human-readable labels for feature keys. */
export const FEATURE_LABELS: Record<FeatureKey, string> = {
  core_grc:                "Core GRC (Vendors, Compliance, Audits, Risks, Controls)",
  trust_intelligence:      "Trust Intelligence™",
  trust_score:             "Trust Score™",
  contract_governance:     "Contract Governance™",
  issue_hub:               "Issue & Remediation Hub™",
  dpdp_privacy:            "DPDP Privacy™",
  policy_governance:       "Policy Governance™",
  workflow_studio:         "Workflow Studio™",
  trust_exchange:          "Third-Party Risk Exchange™",
  ai_governance:           "AI Governance™",
  governance_agents:       "Governance Agent Framework™",
  executive_reporting:     "Executive Reporting & Analytics™",
  benchmarking:            "Governance Benchmarking™",
  api_access:              "Trust API Platform™",
  integration_hub:         "Integration Hub™",
  security_command_center: "Security Command Center™",
  continuous_compliance:   "Continuous Compliance™",
  auditor_collaboration:   "Auditor Collaboration™",
  trust_verification:      "Trust Verification Authority™",
  trust_network:           "Trust Network™",
  regulatory_intelligence: "Regulatory Intelligence™",
  asset_intelligence:      "Asset Intelligence™",
  trust_graph:             "Trust Graph™",
  governance_trends:       "Governance Trends™",
  unlimited_vendors:       "Unlimited Vendors",
  unlimited_users:         "Unlimited Users",
  priority_support:        "Priority Support",
  custom_frameworks:       "Custom Compliance Frameworks",
  cmk:                     "Customer Managed Encryption",
  sso:                     "SSO / SAML",
  scim:                    "SCIM Provisioning",
  dedicated_success:       "Dedicated Success Manager",
};
