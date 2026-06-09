/**
 * seed-control-tests.mjs — Control Center™ test records + health scores
 *
 * Seeds 40+ control test records across 20 controls with a realistic mix of
 * results (passed / partially_effective / failed / exception), then directly
 * updates health_score and effectiveness_score on those controls so the
 * Control Center™ dashboard shows meaningful data immediately.
 *
 * Profile distribution:
 *   Strong    (35%): 2-3 passing tests  → health 75-95
 *   Moderate  (25%): 1 pass + 1 partial → health 55-75
 *   Weak      (25%): partial + old fail → health 35-55
 *   Critical  (15%): recent fail/exception → health 15-40
 *
 * Idempotent — safe to re-run (skips by control_id + test_date + result).
 *
 * Prerequisites: seed-compliance-frameworks.mjs
 *
 * Usage: node scripts/seed-control-tests.mjs [orgId]
 */

import postgres from "postgres";
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

const log  = (msg) => console.log(`  ${msg}`);
const head = (msg) => console.log(`\n▶ ${msg}`);

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const rnd = (min, max) => Math.floor(min + Math.random() * (max - min));

// ── Org lookup ────────────────────────────────────────────────────────────────
const targetId = process.argv[2] ?? null;
const orgs = targetId
  ? await sql`select id, name from organizations where id = ${targetId}`
  : await sql`select id, name from organizations where name = 'admin corp' order by created_at limit 1`;

if (!orgs.length) {
  console.error("No org found. Run seed-demo.mjs first, or pass an orgId.");
  await sql.end(); process.exit(1);
}
const { id: orgId, name: orgName } = orgs[0];
const [owner] = await sql`
  select user_id from memberships where organization_id = ${orgId} and role = 'owner' limit 1`;
const ownerId = owner?.user_id ?? null;
log(`Org: ${orgName} (${orgId})`);

// ── Load controls — pick representative spread across frameworks ───────────────
// Fetch up to 6 controls per framework (varied status profiles)
const controls = await sql`
  with ranked as (
    select c.id, c.control_ref, c.name, f.name as framework_name,
           row_number() over (partition by f.id order by c.control_ref) as rn
    from controls c
    join frameworks f on f.id = c.framework_id
    where f.organization_id = ${orgId}
  )
  select id, control_ref, name, framework_name from ranked where rn <= 6
  order by framework_name, control_ref`;

if (!controls.length) {
  console.error("No controls found. Run seed-compliance-frameworks.mjs first.");
  await sql.end(); process.exit(1);
}
log(`Selected ${controls.length} controls for test seeding`);

// ── Test templates ────────────────────────────────────────────────────────────
const PASS_TESTS = [
  { tester_name: "DevSecOps Pipeline",      method: "automated", result: "passed",
    comments: "Automated CI/CD pipeline control verification — all assertions passed. No exceptions." },
  { tester_name: "IT Security Team",        method: "manual",    result: "passed",
    comments: "Manual walkthrough completed. Evidence reviewed and validated. Control operating effectively as designed." },
  { tester_name: "SOC Monitoring Platform", method: "automated", result: "passed",
    comments: "Continuous monitoring alert validated — control active and no exceptions detected in review period." },
  { tester_name: "Compliance Manager",      method: "manual",    result: "passed",
    comments: "Quarterly compliance review: control fully implemented. All required approvals and evidence present." },
];

const PARTIAL_TESTS = [
  { tester_name: "Internal Audit Team",     method: "manual", result: "partially_effective",
    comments: "Control in place but inconsistently enforced across 2 business units. Exceptions documented. Follow-up required." },
  { tester_name: "Compliance Manager",      method: "manual", result: "partially_effective",
    comments: "Procedures documented but not fully operationalised. Training gaps identified in 3 teams. Remediation in progress." },
];

const FAIL_TESTS = [
  { tester_name: "External Auditor — KPMG", method: "manual",    result: "failed",
    comments: "Control failed testing. Evidence missing for last quarter. Design gap identified — full remediation required before next assessment period." },
  { tester_name: "Vulnerability Scanner",   method: "automated", result: "failed",
    comments: "Automated scan detected control failure — patch not applied within the 30-day SLA window. Escalated to security team." },
];

const EXCEPTION_TESTS = [
  { tester_name: "IT Security Team",        method: "manual", result: "exception",
    comments: "Control test could not be completed — system maintenance window. Exception approved by CISO. Retest scheduled within 14 days." },
];

// ── Assign test records to controls ───────────────────────────────────────────
head("Seeding Control Tests");

let inserted = 0;
let skipped = 0;

for (let i = 0; i < controls.length; i++) {
  const ctrl = controls[i];
  const fraction = i / controls.length;

  // Determine test profile based on position
  let testsToInsert = [];

  if (fraction < 0.30) {
    // Strong: 2-3 passes (recent + historical)
    testsToInsert = [
      { ...PASS_TESTS[0], date: daysAgo(rnd(5, 20)) },
      { ...PASS_TESTS[1], date: daysAgo(rnd(90, 150)) },
    ];
    if (i % 3 === 0) testsToInsert.push({ ...PASS_TESTS[2], date: daysAgo(rnd(200, 280)) });
  } else if (fraction < 0.50) {
    // Moderate: 1 recent pass + 1 older partial
    testsToInsert = [
      { ...PASS_TESTS[3], date: daysAgo(rnd(30, 60)) },
      { ...PARTIAL_TESTS[0], date: daysAgo(rnd(150, 250)) },
    ];
  } else if (fraction < 0.70) {
    // Needs attention: recent partial + historical fail
    testsToInsert = [
      { ...PARTIAL_TESTS[1], date: daysAgo(rnd(20, 50)) },
      { ...FAIL_TESTS[0], date: daysAgo(rnd(200, 320)) },
    ];
  } else if (fraction < 0.85) {
    // Weak: recent fail
    testsToInsert = [
      { ...FAIL_TESTS[i % 2], date: daysAgo(rnd(10, 35)) },
    ];
  } else {
    // Exception / not run recently
    testsToInsert = [
      { ...EXCEPTION_TESTS[0], date: daysAgo(rnd(5, 20)) },
    ];
  }

  for (const t of testsToInsert) {
    const existing = await sql`
      select id from control_tests
      where control_id = ${ctrl.id}
        and test_date = ${t.date}
        and result = ${t.result}
      limit 1`;
    if (existing.length) { skipped++; continue; }

    await sql`
      insert into control_tests (
        id, organization_id, control_id, test_date,
        tester_name, method, result, comments, created_at
      ) values (
        ${randomUUID()}, ${orgId}, ${ctrl.id}, ${t.date},
        ${t.tester_name}, ${t.method}, ${t.result}, ${t.comments},
        now()
      )`;
    inserted++;
  }
}

log(`Inserted ${inserted} test records (${skipped} skipped — already exist)`);

// ── Update health and effectiveness scores ─────────────────────────────────────
head("Updating control health scores");

let healthUpdated = 0;

for (let i = 0; i < controls.length; i++) {
  const ctrl = controls[i];
  const fraction = i / controls.length;

  let healthScore, effectivenessScore, lastTested;

  if (fraction < 0.30) {
    // Strong
    healthScore        = rnd(78, 95);
    effectivenessScore = rnd(72, 92);
    lastTested         = daysAgo(rnd(5, 20));
  } else if (fraction < 0.50) {
    // Moderate
    healthScore        = rnd(58, 76);
    effectivenessScore = rnd(52, 72);
    lastTested         = daysAgo(rnd(30, 65));
  } else if (fraction < 0.70) {
    // Needs Attention
    healthScore        = rnd(40, 59);
    effectivenessScore = rnd(35, 56);
    lastTested         = daysAgo(rnd(45, 75));
  } else if (fraction < 0.85) {
    // Weak/Critical
    healthScore        = rnd(20, 42);
    effectivenessScore = rnd(15, 38);
    lastTested         = daysAgo(rnd(15, 40));
  } else {
    // Very low — exception state
    healthScore        = rnd(10, 28);
    effectivenessScore = rnd(8, 25);
    lastTested         = daysAgo(rnd(8, 20));
  }

  await sql`
    update controls
    set health_score       = ${healthScore},
        effectiveness_score = ${effectivenessScore},
        last_tested        = ${lastTested},
        updated_at         = now()
    where id = ${ctrl.id}`;
  healthUpdated++;
}

log(`Updated health scores for ${healthUpdated} controls`);

// ── Summary ───────────────────────────────────────────────────────────────────
const [counts] = await sql`
  select
    count(*)::int                              as total_tests,
    count(*) filter (where result = 'passed')::int              as passed,
    count(*) filter (where result = 'partially_effective')::int as partial,
    count(*) filter (where result = 'failed')::int              as failed,
    count(*) filter (where result = 'exception')::int           as exception
  from control_tests
  where organization_id = ${orgId}`;

const [healthCounts] = await sql`
  select
    count(*)                            filter (where c.health_score is not null)::int as with_health,
    count(*)                            filter (where c.health_score >= 80)::int        as healthy,
    count(*)                            filter (where c.health_score < 60)::int         as weak,
    round(avg(c.health_score), 1)                                                       as avg_health
  from controls c
  join frameworks f on f.id = c.framework_id
  where f.organization_id = ${orgId}`;

console.log(`\n✅ Done — ${orgName}`);
console.log(`   Test records: ${counts.total_tests} (passed: ${counts.passed}, partial: ${counts.partial}, failed: ${counts.failed}, exception: ${counts.exception})`);
console.log(`   Controls with health score: ${healthCounts.with_health} | Healthy (≥80): ${healthCounts.healthy} | Weak (<60): ${healthCounts.weak} | Avg: ${healthCounts.avg_health}`);

await sql.end();
