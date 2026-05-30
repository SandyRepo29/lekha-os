// Verifies the onboarding write path: a transaction (over the 6543
// transaction pooler, mirroring runtime) creating org + owner membership +
// audit entry, then resolving the active org. Cleans up after itself.
import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

const [user] = await sql`select id, email from public.profiles order by created_at desc limit 1`;
if (!user) {
  console.log("No profile to test with."); await sql.end(); process.exit(0);
}
console.log("test user:", user.email);

let orgId;
await sql.begin(async (sql) => {
  const [org] = await sql`
    insert into organizations (name, slug)
    values ('Verify Org', ${"verify-" + Date.now()})
    returning id`;
  orgId = org.id;
  await sql`insert into memberships (organization_id, user_id, role)
            values (${org.id}, ${user.id}, 'owner')`;
  await sql`insert into audit_logs (organization_id, actor_id, action, entity_type, entity_id, metadata)
            values (${org.id}, ${user.id}, 'organization.created', 'organization', ${org.id}, ${sql.json({ name: "Verify Org" })})`;
});
console.log("transaction committed (org + membership + audit)");

const active = await sql`
  select o.name, o.slug, m.role
  from memberships m
  join organizations o on o.id = m.organization_id
  where m.user_id = ${user.id}
  limit 1`;
console.log("active org resolved:", active[0]);

const audit = await sql`select action, entity_type from audit_logs where organization_id = ${orgId}`;
console.log("audit entry:", audit[0]);

await sql`delete from organizations where id = ${orgId}`;
const [{ n }] = await sql`select count(*)::int n from organizations`;
console.log("cleaned up — orgs remaining:", n);

await sql.end();
