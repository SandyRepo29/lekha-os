/**
 * seed-orgs-demo.mjs
 *
 * Seeds 10 realistic tenant organizations with users, subscriptions,
 * and invoices into AUDT for platform-admin demo/dev purposes.
 *
 * Safe to re-run — idempotent (ON CONFLICT DO NOTHING / IF NOT EXISTS).
 *
 * Usage: node scripts/seed-orgs-demo.mjs
 */

import { createRequire } from "module";
import { pathToFileURL } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const dotenv  = require("dotenv");
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const postgres = require("postgres");
const bcrypt   = require("bcryptjs");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = postgres(DATABASE_URL, { ssl: "require", max: 1 });

// ─── helpers ──────────────────────────────────────────────────────────────────
function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function centsToRupees(cents) {
  return `₹${(cents / 100).toLocaleString("en-IN")}`;
}

// ─── load billing plan IDs ────────────────────────────────────────────────────
const planRows = await sql`SELECT id, name FROM billing_plans WHERE name IN ('Growth', 'Business', 'Enterprise') ORDER BY price_monthly`;
const PLAN = Object.fromEntries(planRows.map((r) => [r.name, r.id]));

if (!PLAN.Growth) {
  console.error("Billing plans not found — run: node scripts/seed-billing-plans.mjs first");
  await sql.end();
  process.exit(1);
}

// ─── demo org definitions ─────────────────────────────────────────────────────

const ORGS = [
  {
    name: "Nexus Fintech Pvt Ltd",
    slug: "nexus-fintech",
    industry: "fintech",
    company_size: "201_500",
    website: "https://nexusfintech.in",
    plan: "Business",
    subStatus: "active",
    trialEndsAt: null,
    periodStart: daysAgo(25),
    periodEnd: daysFromNow(5),
    invoices: [
      { num: "INV-2026-000101", amount: 69900, status: "paid",    issuedDaysAgo: 55, dueDaysAgo: 25 },
      { num: "INV-2026-000102", amount: 69900, status: "pending", issuedDaysAgo: 25, dueDaysAgo: -5 },
    ],
    users: [
      { name: "Rajan Mehta",    email: "rajan.mehta@nexusfintech.in",    role: "owner",               dept: "Leadership" },
      { name: "Priya Kapoor",   email: "priya.kapoor@nexusfintech.in",   role: "compliance_manager",  dept: "Compliance" },
      { name: "Arjun Sharma",   email: "arjun.sharma@nexusfintech.in",   role: "security_manager",    dept: "IT Security" },
      { name: "Divya Nair",     email: "divya.nair@nexusfintech.in",     role: "member",              dept: "Risk" },
    ],
  },
  {
    name: "Healthbridge Systems Ltd",
    slug: "healthbridge-systems",
    industry: "healthcare",
    company_size: "51_200",
    website: "https://healthbridge.in",
    plan: "Growth",
    subStatus: "trial",
    trialEndsAt: daysFromNow(9),
    periodStart: daysAgo(5),
    periodEnd: daysFromNow(9),
    invoices: [],
    users: [
      { name: "Sneha Pillai",   email: "sneha.pillai@healthbridge.in",   role: "owner",               dept: "Executive" },
      { name: "Rahul Desai",    email: "rahul.desai@healthbridge.in",    role: "admin",               dept: "IT" },
      { name: "Anita Verma",    email: "anita.verma@healthbridge.in",    role: "compliance_manager",  dept: "Compliance" },
    ],
  },
  {
    name: "CloudMind Technologies",
    slug: "cloudmind-tech",
    industry: "saas",
    company_size: "11_50",
    website: "https://cloudmind.io",
    plan: "Growth",
    subStatus: "grace_period",
    trialEndsAt: null,
    periodStart: daysAgo(33),
    periodEnd: daysAgo(3),
    invoices: [
      { num: "INV-2026-000201", amount: 30000, status: "paid",    issuedDaysAgo: 65, dueDaysAgo: 35 },
      { num: "INV-2026-000202", amount: 30000, status: "overdue", issuedDaysAgo: 33, dueDaysAgo: 3  },
    ],
    users: [
      { name: "Vivek Joshi",    email: "vivek.joshi@cloudmind.io",       role: "owner",               dept: "Engineering" },
      { name: "Meena Rao",      email: "meena.rao@cloudmind.io",         role: "admin",               dept: "Operations" },
    ],
  },
  {
    name: "Sigma Manufacturing Co",
    slug: "sigma-manufacturing",
    industry: "manufacturing",
    company_size: "501_1000",
    website: "https://sigmamfg.co.in",
    plan: "Business",
    subStatus: "active",
    trialEndsAt: null,
    periodStart: daysAgo(15),
    periodEnd: daysFromNow(15),
    invoices: [
      { num: "INV-2026-000301", amount: 69900, status: "paid",    issuedDaysAgo: 45, dueDaysAgo: 15 },
      { num: "INV-2026-000302", amount: 69900, status: "paid",    issuedDaysAgo: 15, dueDaysAgo: -15},
    ],
    users: [
      { name: "Suresh Patel",   email: "suresh.patel@sigmamfg.co.in",   role: "owner",               dept: "Management" },
      { name: "Kavitha Menon",  email: "kavitha.menon@sigmamfg.co.in",  role: "compliance_manager",  dept: "EHS & Compliance" },
      { name: "Nikhil Kumar",   email: "nikhil.kumar@sigmamfg.co.in",   role: "procurement_manager", dept: "Procurement" },
      { name: "Swati Singh",    email: "swati.singh@sigmamfg.co.in",    role: "viewer",              dept: "Audit" },
    ],
  },
  {
    name: "LegalEdge Consultants",
    slug: "legaledge-consultants",
    industry: "it_services",
    company_size: "11_50",
    website: "https://legaledge.in",
    plan: "Growth",
    subStatus: "trial",
    trialEndsAt: daysFromNow(4),
    periodStart: daysAgo(10),
    periodEnd: daysFromNow(4),
    invoices: [],
    users: [
      { name: "Aditi Chandra",  email: "aditi.chandra@legaledge.in",    role: "owner",               dept: "Founding Team" },
      { name: "Harish Bhat",    email: "harish.bhat@legaledge.in",      role: "member",              dept: "Legal" },
    ],
  },
  {
    name: "PayVault Solutions",
    slug: "payvault-solutions",
    industry: "fintech",
    company_size: "51_200",
    website: "https://payvault.in",
    plan: "Growth",
    subStatus: "suspended",
    trialEndsAt: null,
    periodStart: daysAgo(60),
    periodEnd: daysAgo(30),
    invoices: [
      { num: "INV-2026-000401", amount: 30000, status: "paid",    issuedDaysAgo: 90, dueDaysAgo: 60 },
      { num: "INV-2026-000402", amount: 30000, status: "overdue", issuedDaysAgo: 60, dueDaysAgo: 30 },
    ],
    users: [
      { name: "Mohan Krishnan", email: "mohan.k@payvault.in",           role: "owner",               dept: "Founders" },
      { name: "Nisha Iyer",     email: "nisha.iyer@payvault.in",        role: "admin",               dept: "Ops" },
    ],
  },
  {
    name: "EduLeap Platforms",
    slug: "eduleap-platforms",
    industry: "other",
    company_size: "201_500",
    website: "https://eduleap.in",
    plan: "Growth",
    subStatus: "active",
    trialEndsAt: null,
    periodStart: daysAgo(10),
    periodEnd: daysFromNow(20),
    invoices: [
      { num: "INV-2026-000501", amount: 30000, status: "paid",    issuedDaysAgo: 40, dueDaysAgo: 10 },
      { num: "INV-2026-000502", amount: 30000, status: "pending", issuedDaysAgo: 10, dueDaysAgo: -20},
    ],
    users: [
      { name: "Rohit Agarwal",  email: "rohit.agarwal@eduleap.in",      role: "owner",               dept: "Executive" },
      { name: "Tanvi Sood",     email: "tanvi.sood@eduleap.in",         role: "compliance_manager",  dept: "Compliance" },
      { name: "Deepak Roy",     email: "deepak.roy@eduleap.in",         role: "member",              dept: "Engineering" },
    ],
  },
  {
    name: "RetailPulse India",
    slug: "retailpulse-india",
    industry: "other",
    company_size: "51_200",
    website: "https://retailpulse.in",
    plan: "Growth",
    subStatus: "cancelled",
    trialEndsAt: null,
    periodStart: daysAgo(90),
    periodEnd: daysAgo(60),
    invoices: [
      { num: "INV-2026-000601", amount: 30000, status: "paid",    issuedDaysAgo: 120, dueDaysAgo: 90 },
      { num: "INV-2026-000602", amount: 30000, status: "void",    issuedDaysAgo: 90,  dueDaysAgo: 60 },
    ],
    users: [
      { name: "Sanjay Malhotra",email: "sanjay.m@retailpulse.in",       role: "owner",               dept: "Management" },
    ],
  },
  {
    name: "GreenGrid Energy",
    slug: "greengrid-energy",
    industry: "other",
    company_size: "51_200",
    website: "https://greengrid.energy",
    plan: "Growth",
    subStatus: "trial",
    trialEndsAt: daysFromNow(12),
    periodStart: daysAgo(2),
    periodEnd: daysFromNow(12),
    invoices: [],
    users: [
      { name: "Pavan Reddy",    email: "pavan.reddy@greengrid.energy",  role: "owner",               dept: "Founders" },
      { name: "Lakshmi Das",    email: "lakshmi.das@greengrid.energy",  role: "admin",               dept: "Compliance" },
    ],
  },
  {
    name: "DataSphere Analytics",
    slug: "datasphere-analytics",
    industry: "saas",
    company_size: "11_50",
    website: "https://datasphere.ai",
    plan: "Enterprise",
    subStatus: "active",
    trialEndsAt: null,
    periodStart: daysAgo(5),
    periodEnd: daysFromNow(25),
    invoices: [
      { num: "INV-2026-000701", amount: 120000, status: "paid",    issuedDaysAgo: 35, dueDaysAgo: 5  },
      { num: "INV-2026-000702", amount: 120000, status: "pending", issuedDaysAgo: 5,  dueDaysAgo: -25},
    ],
    users: [
      { name: "Anand Krishnan", email: "anand.k@datasphere.ai",         role: "owner",               dept: "Executive" },
      { name: "Ritu Sharma",    email: "ritu.sharma@datasphere.ai",     role: "security_manager",    dept: "Security" },
      { name: "Faisal Ahmed",   email: "faisal.ahmed@datasphere.ai",    role: "compliance_manager",  dept: "Compliance" },
      { name: "Geeta Nair",     email: "geeta.nair@datasphere.ai",      role: "member",              dept: "Product" },
    ],
  },
];

// ─── seed ─────────────────────────────────────────────────────────────────────
console.log(`\nSeeding ${ORGS.length} demo organizations...\n`);

let orgCount = 0, userCount = 0, subCount = 0, invCount = 0;

for (const org of ORGS) {
  // ── 1. check if org already exists ──────────────────────────────────────────
  const existing = await sql`SELECT id FROM organizations WHERE slug = ${org.slug} LIMIT 1`;
  let orgId;

  if (existing.length > 0) {
    orgId = existing[0].id;
    console.log(`  ⏭  ${org.name} — exists (${orgId.slice(0, 8)}…)`);
  } else {
    const [o] = await sql`
      INSERT INTO organizations (name, slug, industry, company_size, website)
      VALUES (${org.name}, ${org.slug}, ${org.industry}, ${org.company_size}, ${org.website})
      RETURNING id
    `;
    orgId = o.id;
    orgCount++;
    console.log(`  ✓  ${org.name} — created (${orgId.slice(0, 8)}…)`);
  }

  // ── 2. create auth users + profiles + memberships ────────────────────────────
  for (const u of org.users) {
    // Check if profile already exists (by email via auth.users)
    const existingAuth = await sql`
      SELECT id FROM auth.users WHERE email = ${u.email} LIMIT 1
    `.catch(() => []);

    let userId;

    if (existingAuth.length > 0) {
      userId = existingAuth[0].id;
    } else {
      // Create auth user (demo — no real password needed, but set a hash so login works)
      const hash = await bcrypt.hash("AudtDemo2026!", 10);
      const [authUser] = await sql`
        INSERT INTO auth.users
          (id, instance_id, aud, role, email, encrypted_password,
           email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
           is_super_admin, created_at, updated_at)
        VALUES
          (gen_random_uuid(),
           '00000000-0000-0000-0000-000000000000',
           'authenticated', 'authenticated',
           ${u.email}, ${hash},
           now(),
           '{"provider":"email","providers":["email"]}'::jsonb,
           ${JSON.stringify({ full_name: u.name })}::jsonb,
           false, now(), now())
        RETURNING id
      `;
      userId = authUser.id;
      userCount++;
    }

    // Upsert profile
    await sql`
      INSERT INTO profiles (id, email, full_name)
      VALUES (${userId}, ${u.email}, ${u.name})
      ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email
    `.catch(() => {}); // profile may auto-exist from trigger

    // Upsert membership
    await sql`
      INSERT INTO memberships (organization_id, user_id, role, department, is_active)
      VALUES (${orgId}, ${userId}, ${u.role}, ${u.dept ?? null}, true)
      ON CONFLICT (organization_id, user_id) DO UPDATE
        SET role = EXCLUDED.role, department = EXCLUDED.department
    `;
  }

  // ── 3. subscription ──────────────────────────────────────────────────────────
  const existingSub = await sql`SELECT id FROM subscriptions WHERE organization_id = ${orgId} LIMIT 1`;

  if (existingSub.length === 0) {
    const planId = PLAN[org.plan] ?? PLAN.Growth;
    await sql`
      INSERT INTO subscriptions
        (organization_id, plan_id, status,
         current_period_start, current_period_end, cancel_at_period_end, created_at)
      VALUES
        (${orgId}, ${planId}, ${org.subStatus},
         ${org.periodStart}, ${org.periodEnd},
         ${org.subStatus === "cancelled"}, now())
    `;
    subCount++;
  }

  // ── 4. invoices ──────────────────────────────────────────────────────────────
  for (const inv of org.invoices) {
    const existingInv = await sql`SELECT id FROM invoices WHERE invoice_number = ${inv.num} LIMIT 1`;
    if (existingInv.length > 0) continue;

    const issuedAt = new Date();
    issuedAt.setDate(issuedAt.getDate() - inv.issuedDaysAgo);
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() - inv.dueDaysAgo);

    await sql`
      INSERT INTO invoices
        (organization_id, invoice_number, status, amount_cents, currency, due_at, created_at)
      VALUES
        (${orgId}, ${inv.num}, ${inv.status}, ${inv.amount}, 'INR',
         ${dueAt.toISOString()}, ${issuedAt.toISOString()})
    `.catch((e) => {
      console.warn(`    ⚠  invoice ${inv.num}: ${e.message.slice(0, 80)}`);
    });
    invCount++;
  }
}

// ─── summary ─────────────────────────────────────────────────────────────────
console.log("\n─────────────────────────────────────────────────────────────────");
console.log(`  Organizations created : ${orgCount}`);
console.log(`  Auth users created    : ${userCount}`);
console.log(`  Subscriptions created : ${subCount}`);
console.log(`  Invoices created      : ${invCount}`);
console.log("─────────────────────────────────────────────────────────────────");
console.log("\nAll demo users can log in to the AUDT tenant app with:");
console.log("  Password: AudtDemo2026!");
console.log("\nView in platform-admin: /platform-admin/orgs");
console.log("\nDone.");

await sql.end();
