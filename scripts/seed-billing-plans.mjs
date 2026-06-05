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
    name: "Starter",
    description: "For small teams getting started with vendor governance",
    price_monthly: 0,
    price_yearly: 0,
    features: JSON.stringify(["Up to 5 users", "Up to 10 vendors", "1 GB storage", "Basic reports", "Email alerts"]),
    max_users: 5,
    max_vendors: 10,
    max_storage_gb: 1,
    is_active: true,
  },
  {
    name: "Growth",
    description: "For growing teams managing compliance at scale",
    price_monthly: 4999,
    price_yearly: 49999,
    features: JSON.stringify(["Up to 25 users", "Up to 100 vendors", "10 GB storage", "All reports", "AI features", "Compliance module", "API access"]),
    max_users: 25,
    max_vendors: 100,
    max_storage_gb: 10,
    is_active: true,
  },
  {
    name: "Enterprise",
    description: "Unlimited scale with dedicated support and custom integrations",
    price_monthly: 0,
    price_yearly: 0,
    features: JSON.stringify(["Unlimited users", "Unlimited vendors", "100 GB storage", "All modules", "Custom integrations", "SSO/SAML", "Dedicated support", "SLA"]),
    max_users: 9999,
    max_vendors: 9999,
    max_storage_gb: 100,
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
    console.log("\nAssigning Starter subscription to orgs without one…");
    const starter = await sql`SELECT id FROM billing_plans WHERE name = 'Starter' LIMIT 1`;
    if (!starter.length) { console.error("Starter plan not found"); process.exit(1); }
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
