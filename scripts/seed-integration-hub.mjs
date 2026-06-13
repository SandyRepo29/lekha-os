/**
 * Seed Integration Hub™ demo data
 * Usage: node scripts/seed-integration-hub.mjs [orgId]
 *
 * Seeds 3 connected integrations with sync history and governance events.
 */

import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = postgres(DATABASE_URL, { ssl: "require" });

async function run() {
  const orgIdArg = process.argv[2];

  // Find org
  const orgs = orgIdArg
    ? await sql`SELECT id FROM organizations WHERE id = ${orgIdArg} LIMIT 1`
    : await sql`SELECT id FROM organizations ORDER BY created_at DESC LIMIT 1`;

  if (!orgs.length) { console.error("No organization found"); process.exit(1); }
  const orgId = orgs[0].id;
  console.log(`Seeding Integration Hub demo data for org: ${orgId}`);

  // Get connector registry IDs
  const connectors = await sql`
    SELECT id, slug, name FROM integration_registry
    WHERE slug IN ('microsoft-entra-id', 'aws', 'github', 'crowdstrike', 'slack')
  `;

  if (!connectors.length) {
    console.error("No connectors found — did you run the migration first?");
    process.exit(1);
  }

  const bySlug = Object.fromEntries(connectors.map((c) => [c.slug, c]));

  const demoInstances = [
    { slug: "microsoft-entra-id", totalSynced: 142, totalEvidence: 3, totalRisks: 1, totalEvents: 2 },
    { slug: "aws", totalSynced: 87, totalEvidence: 6, totalRisks: 2, totalEvents: 3 },
    { slug: "github", totalSynced: 63, totalEvidence: 5, totalRisks: 1, totalEvents: 2 },
    { slug: "crowdstrike", totalSynced: 204, totalEvidence: 2, totalRisks: 3, totalEvents: 4 },
    { slug: "slack", totalSynced: 45, totalEvidence: 0, totalRisks: 0, totalEvents: 1 },
  ];

  let instanceCount = 0;
  for (const demo of demoInstances) {
    const connector = bySlug[demo.slug];
    if (!connector) continue;

    // Check if already exists
    const existing = await sql`
      SELECT id FROM integration_instances WHERE organization_id = ${orgId} AND registry_id = ${connector.id} LIMIT 1
    `;
    if (existing.length) {
      console.log(`  Skipping ${connector.name} — already connected`);
      continue;
    }

    const [instance] = await sql`
      INSERT INTO integration_instances (organization_id, registry_id, name, status, sync_frequency, connected_at, total_synced, total_evidence, total_risks, total_events, last_sync_at)
      VALUES (${orgId}, ${connector.id}, ${connector.name}, 'connected', 'daily', NOW() - INTERVAL '7 days', ${demo.totalSynced}, ${demo.totalEvidence}, ${demo.totalRisks}, ${demo.totalEvents}, NOW() - INTERVAL '2 hours')
      RETURNING id
    `;

    // Seed a sync record
    await sql`
      INSERT INTO integration_syncs (instance_id, organization_id, status, sync_type, started_at, completed_at, records_fetched, records_created, records_updated, records_failed)
      VALUES (${instance.id}, ${orgId}, 'completed', 'incremental', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1.9 hours', ${demo.totalSynced}, ${Math.round(demo.totalSynced * 0.1)}, ${Math.round(demo.totalSynced * 0.9)}, 0)
    `;

    instanceCount++;
    console.log(`  ✓ Connected: ${connector.name}`);
  }

  // Seed some open governance events
  const instances = await sql`SELECT id, name FROM integration_instances WHERE organization_id = ${orgId} LIMIT 3`;

  if (instances.length > 0) {
    const sampleEvents = [
      { instanceIdx: 0, eventType: "risk_created", title: "14 inactive users detected", description: "14 user accounts have not signed in for >90 days and should be reviewed or disabled.", severity: "medium" },
      { instanceIdx: 0, eventType: "control_failed", title: "MFA not enforced for 14 users", description: "14 users (9.9%) do not have MFA enabled. This violates control CC-MFA-01.", severity: "high" },
      { instanceIdx: Math.min(1, instances.length - 1), eventType: "misconfiguration_detected", title: "5 S3 buckets missing encryption", description: "5 S3 buckets do not have server-side encryption enabled, violating data protection policy.", severity: "high" },
      { instanceIdx: Math.min(2, instances.length - 1), eventType: "risk_created", title: "5 repos missing branch protection", description: "5 GitHub repositories do not have branch protection rules enabled on main.", severity: "medium" },
    ];

    for (const ev of sampleEvents) {
      const inst = instances[ev.instanceIdx];
      if (!inst) continue;
      await sql`
        INSERT INTO integration_events (instance_id, organization_id, event_type, title, description, severity, resolved)
        VALUES (${inst.id}, ${orgId}, ${ev.eventType}, ${ev.title}, ${ev.description}, ${ev.severity}, false)
        ON CONFLICT DO NOTHING
      `.catch(() => {});
    }
    console.log(`  ✓ Seeded ${sampleEvents.length} governance events`);
  }

  console.log(`\nIntegration Hub seed complete — ${instanceCount} new integrations connected`);
  await sql.end();
}

run().catch((e) => { console.error(e); process.exit(1); });
