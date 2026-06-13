/**
 * Seed script — Trust Network™ (Module 18)
 * Seeds profile views, trust activity milestones, and ensures a strong
 * published Trust Profile for the Trust Network reputation demo.
 *
 * Depends on: seed-trust-exchange.mjs (trust_profiles must exist)
 *
 * Usage: node scripts/seed-trust-network.mjs [orgId]
 *        node scripts/seed-trust-network.mjs --list
 */

import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = postgres(DATABASE_URL, { ssl: "require", max: 1 });

async function listOrgs() {
  const rows = await sql`SELECT id, name FROM organizations ORDER BY created_at LIMIT 20`;
  console.log("Organizations:");
  rows.forEach((r) => console.log(`  ${r.id}  ${r.name}`));
}

async function seed(orgId) {
  console.log(`Seeding Trust Network™ for org: ${orgId}`);

  // ── 1. Ensure trust profile is published ──────────────────────────────────
  const [org] = await sql`SELECT id, name, industry, company_size, country, website FROM organizations WHERE id = ${orgId}`;
  if (!org) { console.error("Org not found"); process.exit(1); }

  const [existingProfile] = await sql`SELECT id FROM trust_profiles WHERE organization_id = ${orgId} LIMIT 1`;

  let profileId;
  if (existingProfile) {
    await sql`
      UPDATE trust_profiles
      SET is_published = true, visibility = 'public', trust_score = 92, privacy_score = 88,
          risk_level = 'low', profile_completeness = 100,
          certifications = '["ISO 27001","SOC 2","DPDP Ready"]'::jsonb,
          updated_at = NOW()
      WHERE organization_id = ${orgId}
    `;
    profileId = existingProfile.id;
    console.log(`  ✓ Trust Profile updated (published, score 92)`);
  } else {
    const [profile] = await sql`
      INSERT INTO trust_profiles (organization_id, display_name, tagline, description, industry, company_size, country, website, is_published, visibility, trust_score, privacy_score, risk_level, profile_completeness, certifications)
      VALUES (${orgId}, ${org.name}, 'AI-Native Governance Platform', 'AUDT is a leading AI-native Trust, Risk & Compliance platform trusted by enterprises across India.', ${org.industry ?? 'saas'}, ${org.company_size ?? '51_200'}, ${org.country ?? 'India'}, ${org.website ?? 'https://audt.tech'}, true, 'public', 92, 88, 'low', 100, '["ISO 27001","SOC 2","DPDP Ready"]'::jsonb)
      ON CONFLICT (organization_id) DO UPDATE SET is_published = true, updated_at = NOW()
      RETURNING id
    `;
    profileId = profile.id;
    console.log(`  ✓ Trust Profile created (published)`);
  }

  // ── 2. Seed anonymous profile views (last 30 days) ────────────────────────
  // Simulate 47 profile views spread across the last 30 days
  const viewDates = [
    0, 0, 1, 1, 2, 3, 3, 4, 5, 5,
    6, 7, 7, 8, 9, 10, 10, 11, 12, 13,
    14, 14, 15, 16, 17, 17, 18, 19, 20, 21,
    21, 22, 23, 23, 24, 25, 25, 26, 27, 27,
    28, 28, 29, 29, 29, 30, 30,
  ];

  for (const daysAgo of viewDates) {
    const viewedAt = new Date(Date.now() - daysAgo * 86400_000 - Math.random() * 3600_000 * 8);
    await sql`
      INSERT INTO network_profile_views (viewed_org_id, viewer_org_id, viewed_at)
      VALUES (${orgId}, null, ${viewedAt})
    `;
  }
  console.log(`  ✓ ${viewDates.length} profile views seeded (30-day window)`);

  // ── 3. Trust Network activity milestones ──────────────────────────────────
  const now = new Date();
  const daysAgo = (d) => new Date(now - d * 86400_000);

  const networkActivity = [
    { type: "profile_created",        desc: "Trust Profile published to Trust Network™",                      ago: 25 },
    { type: "document_verified",      desc: "ISO 27001:2022 certificate verified by auditor",                  ago: 22 },
    { type: "badge_issued",           desc: "AUDT Verified™ badge earned — identity confirmed by platform",    ago: 20 },
    { type: "badge_issued",           desc: "ISO Verified™ badge issued — ISO 27001 certificate confirmed",    ago: 18 },
    { type: "document_verified",      desc: "SOC 2 Type II report verified by peer organization",              ago: 15 },
    { type: "questionnaire_answered", desc: "AUDT Vendor Security Assessment completed (75%)",                 ago: 12 },
    { type: "relationship_created",   desc: "Trust relationship established with partner organization",        ago: 10 },
    { type: "badge_issued",           desc: "DPDP Ready™ badge issued — DPDP Act 2023 compliance confirmed",  ago: 8  },
    { type: "document_verified",      desc: "DPDP Compliance Certificate verified",                           ago: 6  },
    { type: "profile_updated",        desc: "Trust Profile updated — automation transparency section added",   ago: 4  },
    { type: "badge_issued",           desc: "Low Risk Vendor™ badge issued — risk score consistently < 30",   ago: 2  },
    { type: "document_verified",      desc: "Penetration Test Report Q1 2024 verified",                       ago: 1  },
  ];

  for (const a of networkActivity) {
    await sql`
      INSERT INTO trust_activity (organization_id, activity_type, entity_id, entity_type, description, created_at)
      VALUES (${orgId}, ${a.type}, ${profileId}, 'trust_profile', ${a.desc}, ${daysAgo(a.ago)})
    `;
  }
  console.log(`  ✓ ${networkActivity.length} Trust Network activity events seeded`);

  // ── 4. Seed a second org as a "follower" if possible ─────────────────────
  const [secondOrg] = await sql`
    SELECT id FROM organizations WHERE id != ${orgId} ORDER BY created_at LIMIT 1
  `;
  if (secondOrg) {
    await sql`
      INSERT INTO network_followers (follower_org_id, following_org_id)
      VALUES (${secondOrg.id}, ${orgId})
      ON CONFLICT DO NOTHING
    `;
    console.log(`  ✓ 1 network follower seeded (org ${secondOrg.id.slice(0,8)}…)`);
  } else {
    console.log(`  ℹ  Only one org — skipping follower seed (needs 2+ orgs)`);
  }

  // ── 5. Summary ────────────────────────────────────────────────────────────
  const [viewCount] = await sql`SELECT COUNT(*) AS cnt FROM network_profile_views WHERE viewed_org_id = ${orgId}`;
  const [followerCount] = await sql`SELECT COUNT(*) AS cnt FROM network_followers WHERE following_org_id = ${orgId}`;
  const [activityCount] = await sql`SELECT COUNT(*) AS cnt FROM trust_activity WHERE organization_id = ${orgId}`;

  console.log("\n✅ Trust Network™ seed complete.");
  console.log(`   Profile views (total): ${viewCount.cnt}`);
  console.log(`   Network followers:     ${followerCount.cnt}`);
  console.log(`   Activity events:       ${activityCount.cnt}`);
  console.log(`   Expected reputation:   ~85+ (Highly Trusted)`);
  console.log(`   Dashboard:  /trust-network`);
  console.log(`   Profile:    /trust-network/profile`);
  console.log(`   AI Advisor: /trust-network/ai`);
}

const args = process.argv.slice(2);
if (args[0] === "--list") {
  await listOrgs();
} else if (args[0]) {
  await seed(args[0]);
} else {
  const [first] = await sql`SELECT id FROM organizations ORDER BY created_at LIMIT 1`;
  if (first) {
    await seed(first.id);
  } else {
    console.error("No organizations found. Pass an org ID as argument.");
    await listOrgs();
  }
}

await sql.end();
