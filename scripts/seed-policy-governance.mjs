import postgres from "postgres";
import { config } from "dotenv";
import { randomUUID } from "crypto";
config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });
const log  = (msg) => console.log(`  ${msg}`);
const head = (msg) => console.log(`\n▶ ${msg}`);

const targetId = process.argv[2] ?? null;
const orgs = targetId
  ? await sql`select id, name from organizations where id = ${targetId}`
  : await sql`select id, name from organizations where name = 'admin corp' order by created_at limit 1`;
if (!orgs.length) { console.error("No org found."); await sql.end(); process.exit(1); }
const { id: orgId, name: orgName } = orgs[0];
log(`Org: ${orgName} (${orgId})`);

const [owner] = await sql`select user_id from memberships where organization_id = ${orgId} and role = 'owner' limit 1`;
const ownerId = owner?.user_id ?? null;
log(`Owner: ${ownerId ?? "none"}`);

// Gather up to 5 member user IDs for variety in attestations
const members = await sql`select user_id from memberships where organization_id = ${orgId} limit 5`;
const memberIds = members.map((m) => m.user_id);
if (!memberIds.length) { console.error("No members found."); await sql.end(); process.exit(1); }

// ── Load existing policies ────────────────────────────────────────────────────
head("Loading policies");
const policies = await sql`
  select id, name
  from policies
  where organization_id = ${orgId}
  order by created_at
`;
if (!policies.length) {
  console.warn("  No policies found — run seed-compliance-demo.mjs first.");
  await sql.end();
  process.exit(0);
}
log(`Found ${policies.length} policies`);

// ── Load controls ─────────────────────────────────────────────────────────────
head("Loading controls");
const controls = await sql`
  select id from controls
  where organization_id = ${orgId}
     or framework_id in (select id from frameworks where organization_id = ${orgId})
  limit 20
`;
log(`Found ${controls.length} controls`);

// ── Load frameworks ───────────────────────────────────────────────────────────
head("Loading frameworks");
const frameworks = await sql`
  select id from frameworks where organization_id = ${orgId}
`;
log(`Found ${frameworks.length} frameworks`);

// ── Helper: past date ─────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── 1. Policy Reviews ─────────────────────────────────────────────────────────
head("Seeding policy_reviews");
const reviewOutcomes = ["no_change", "minor_update", "major_revision", "no_change", "minor_update"];
const reviewNotes = [
  "Annual review completed — no changes required.",
  "Minor wording updates to reflect current tooling.",
  "Scope expanded to cover cloud-hosted assets.",
  "Policy confirmed aligned with latest ISO 27001 controls.",
  "Updated owner and next review cycle.",
  "Reviewed following internal audit findings — no action needed.",
];
let reviewsInserted = 0;

for (const policy of policies) {
  // Check how many reviews already exist for this policy
  const [{ count }] = await sql`
    select count(*)::int as count from policy_reviews where policy_id = ${policy.id}
  `;
  if (count >= 4) {
    log(`  skip ${policy.name} — already has ${count} reviews`);
    continue;
  }
  const toInsert = 4 - count;
  for (let i = 0; i < toInsert; i++) {
    const reviewDate   = daysAgo(30 * (i + 1) + Math.floor(Math.random() * 10));
    const nextReview   = daysFromNow(90 * (i + 1));
    const outcome      = reviewOutcomes[i % reviewOutcomes.length];
    const notes        = reviewNotes[(i + policies.indexOf(policy)) % reviewNotes.length];
    const reviewerId   = memberIds[i % memberIds.length];

    await sql`
      insert into policy_reviews
        (id, policy_id, organization_id, reviewer_id, review_date, outcome, notes, next_review_date, created_at)
      values
        (${randomUUID()}, ${policy.id}, ${orgId}, ${reviewerId}, ${reviewDate}, ${outcome}, ${notes}, ${nextReview}, now())
    `;
    reviewsInserted++;
  }
}
log(`Inserted ${reviewsInserted} policy reviews`);

// ── 2. Policy Attestations ────────────────────────────────────────────────────
head("Seeding policy_attestations");
const attestationStatuses = ["acknowledged", "acknowledged", "acknowledged", "pending", "pending"];
let attestationsInserted = 0;

for (const policy of policies) {
  for (let i = 0; i < memberIds.length; i++) {
    const userId = memberIds[i];
    // Skip if already attested by this user for this policy
    const [{ count }] = await sql`
      select count(*)::int as count
      from policy_attestations
      where policy_id = ${policy.id} and user_id = ${userId}
    `;
    if (count > 0) continue;

    const status        = attestationStatuses[i % attestationStatuses.length];
    const acknowledgedAt = status === "acknowledged"
      ? new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const dueDate       = daysFromNow(30 + i * 7);
    const policyVersion = "1.0";

    await sql`
      insert into policy_attestations
        (id, policy_id, organization_id, user_id, policy_version, acknowledged_at, due_date, status, created_at, updated_at)
      values
        (${randomUUID()}, ${policy.id}, ${orgId}, ${userId}, ${policyVersion},
         ${acknowledgedAt}, ${dueDate}, ${status}, now(), now())
    `;
    attestationsInserted++;
  }
}
log(`Inserted ${attestationsInserted} policy attestations`);

// ── 3. Policy Controls ────────────────────────────────────────────────────────
head("Seeding policy_controls");
let policyControlsInserted = 0;

if (controls.length > 0) {
  for (let pi = 0; pi < policies.length; pi++) {
    const policy = policies[pi];
    // Pick 2-3 controls per policy (offset by policy index for variety)
    const count = 2 + (pi % 2); // alternates 2 or 3
    const slice = controls.slice((pi * 3) % controls.length);
    const picked = [...slice, ...controls].slice(0, count);

    for (const ctrl of picked) {
      try {
        await sql`
          insert into policy_controls (id, policy_id, control_id, organization_id, created_at)
          values (${randomUUID()}, ${policy.id}, ${ctrl.id}, ${orgId}, now())
          on conflict (policy_id, control_id) do nothing
        `;
        policyControlsInserted++;
      } catch (e) {
        // skip duplicate / FK violation silently
      }
    }
  }
}
log(`Inserted ${policyControlsInserted} policy_controls links`);

// ── 4. Policy Frameworks ──────────────────────────────────────────────────────
head("Seeding policy_frameworks");
let policyFrameworksInserted = 0;

if (frameworks.length > 0) {
  for (let pi = 0; pi < policies.length; pi++) {
    const policy = policies[pi];

    // Pick framework by index
    const primaryFrameworkId = frameworks[pi % frameworks.length].id;

    // Always link the primary framework
    const toLink = [primaryFrameworkId];

    // Also link a second framework for every other policy for variety
    if (pi % 2 === 0 && frameworks.length > 1) {
      const alt = frameworks[(pi + 1) % frameworks.length].id;
      if (alt !== primaryFrameworkId) toLink.push(alt);
    }

    for (const fwId of toLink) {
      try {
        await sql`
          insert into policy_frameworks (id, policy_id, framework_id, organization_id, created_at)
          values (${randomUUID()}, ${policy.id}, ${fwId}, ${orgId}, now())
          on conflict (policy_id, framework_id) do nothing
        `;
        policyFrameworksInserted++;
      } catch (e) {
        // skip duplicate / FK violation silently
      }
    }
  }
}
log(`Inserted ${policyFrameworksInserted} policy_frameworks links`);

// ── Summary ───────────────────────────────────────────────────────────────────
head("Summary");
const [{ reviews }]       = await sql`select count(*)::int as reviews      from policy_reviews      where organization_id = ${orgId}`;
const [{ attestations }]  = await sql`select count(*)::int as attestations from policy_attestations where organization_id = ${orgId}`;
const [{ pc }]            = await sql`select count(*)::int as pc           from policy_controls     where organization_id = ${orgId}`;
const [{ pf }]            = await sql`select count(*)::int as pf           from policy_frameworks   where organization_id = ${orgId}`;

log(`policy_reviews      : ${reviews}`);
log(`policy_attestations : ${attestations}`);
log(`policy_controls     : ${pc}`);
log(`policy_frameworks   : ${pf}`);

await sql.end();
console.log("\n✅ Done.");
