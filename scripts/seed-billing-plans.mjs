/**
 * Seed billing plans (Starter, Growth, Enterprise) and optionally assign
 * a Starter subscription to all orgs that don't have one.
 *
 * Usage: node scripts/seed-billing-plans.mjs [--assign-all]
 */

import { createRequire } from "module";
import { pathToFileURL } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const postgres = require("postgres");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set in .env.local");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: "require", max: 1 });

const PLANS = [
  {
    name: "Growth",
    description: "The complete governance foundation for fast-growing companies getting compliance-ready",
    price_monthly: 250,
    price_yearly: 2999,
    features: JSON.stringify([
      "Up to 10 users",
      "All Core GRC modules",
      "DPDP Privacy™ & Contract Governance™",
      "Trust Intelligence™ & Trust Score™",
      "5 compliance frameworks",
      "Governance Copilot™ AI",
      "Email support",
    ]),
    max_users: 10,
    max_vendors: 100,
    max_storage_gb: 10,
    is_active: true,
  },
  {
    name: "Business",
    description: "The full Governance OS for organizations scaling their trust program",
    price_monthly: 583,
    price_yearly: 6999,
    features: JSON.stringify([
      "Up to 50 users",
      "All 32 modules",
      "Governance Agent Framework™",
      "Continuous Compliance™ (21 checks)",
      "Security Command Center™",
      "Integration Hub™ (35+ connectors)",
      "Trust Verification Authority™",
      "Auditor Collaboration™",
      "Priority support & onboarding",
    ]),
    max_users: 50,
    max_vendors: 9999,
    max_storage_gb: 100,
    is_active: true,
  },
  {
    name: "Enterprise",
    description: "Tailored deployment for large, regulated organizations with complex governance requirements",
    price_monthly: 0,
    price_yearly: 0,
    features: JSON.stringify([
      "Unlimited users & organizations",
      "Customer Managed Encryption (AWS KMS, Azure, GCP)",
      "Custom SAML/OIDC SSO",
      "Dedicated Governance Agent™ configurations",
      "Custom compliance frameworks & controls",
      "SLA guarantees & dedicated success manager",
      "On-premise or private cloud deployment",
      "Custom API rate limits & webhooks",
    ]),
    max_users: 9999,
    max_vendors: 9999,
    max_storage_gb: 9999,
    is_active: true,
  },
];

async function main() {
  const assignAll = process.argv.includes("--assign-all");

  console.log("Seeding billing plans…");
  for (const plan of PLANS) {
    const existing = await sql`SELECT id FROM billing_plans WHERE name = ${plan.name} LIMIT 1`;
    if (existing.length > 0) {
      console.log(`  ✓ ${plan.name} — already exists`);
    } else {
      await sql`
        INSERT INTO billing_plans (name, description, price_monthly, price_yearly, features, max_users, max_vendors, max_storage_gb, is_active)
        VALUES (${plan.name}, ${plan.description}, ${plan.price_monthly}, ${plan.price_yearly}, ${plan.features}::jsonb, ${plan.max_users}, ${plan.max_vendors}, ${plan.max_storage_gb}, ${plan.is_active})
      `;
      console.log(`  + Created ${plan.name}`);
    }
  }

  if (assignAll) {
    console.log("\nAssigning Growth (trial) subscription to orgs without one…");
    const starter = await sql`SELECT id FROM billing_plans WHERE name = 'Growth' LIMIT 1`;
    if (!starter.length) { console.error("Growth plan not found"); process.exit(1); }
    const starterPlanId = starter[0].id;

    const orgs = await sql`
      SELECT o.id FROM organizations o
      LEFT JOIN subscriptions s ON s.organization_id = o.id
      WHERE s.id IS NULL
    `;
    for (const org of orgs) {
      await sql`
        INSERT INTO subscriptions (organization_id, plan_id, status, billing_cycle, current_period_start)
        VALUES (${org.id}, ${starterPlanId}, 'trial', 'trial', NOW())
        ON CONFLICT (organization_id) DO NOTHING
      `;
      console.log(`  + Assigned Starter to org ${org.id}`);
    }
    if (!orgs.length) console.log("  All orgs already have subscriptions.");
  }

  await sql.end();
  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
