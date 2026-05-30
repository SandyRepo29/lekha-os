// Verifies the live vendor path against the real workspace: insert a vendor
// (+ audit) like the action does, run the dashboard metric queries, then
// clean up the test row.
import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

const [org] = await sql`
  select o.id, o.name, m.user_id
  from organizations o
  join memberships m on m.organization_id = o.id and m.role = 'owner'
  order by o.created_at desc limit 1`;

if (!org) { console.log("No org found — create a workspace first."); await sql.end(); process.exit(0); }
console.log("workspace:", org.name);

const [v] = await sql`
  insert into vendors (organization_id, name, category, contact_email, risk_level, status, compliance_score, created_by)
  values (${org.id}, 'Verify Vendor', 'Payments', 'sec@verify.com', 'low', 'active', 88, ${org.user_id})
  returning id`;
await sql`insert into audit_logs (organization_id, actor_id, action, entity_type, entity_id, metadata)
          values (${org.id}, ${org.user_id}, 'vendor.created', 'vendor', ${v.id}, ${sql.json({ name: "Verify Vendor" })})`;
console.log("vendor inserted + audit logged");

// Mirror getVendorMetrics
const vs = await sql`select risk_level, compliance_score from vendors where organization_id = ${org.id}`;
const totalVendors = vs.length;
const highRisk = vs.filter((x) => ["high", "critical"].includes(x.risk_level)).length;
const score = totalVendors ? Math.round(vs.reduce((s, x) => s + x.compliance_score, 0) / totalVendors) : 0;
console.log("metrics:", { totalVendors, highRisk, complianceScore: score });

// Mirror listVendors
const list = await sql`select name, status, risk_level, compliance_score from vendors where organization_id = ${org.id} order by created_at desc`;
console.log("listVendors returns:", list.map((x) => x.name));

await sql`delete from vendors where id = ${v.id}`;
const [{ n }] = await sql`select count(*)::int n from vendors where organization_id = ${org.id}`;
console.log("cleaned up — vendors remaining in your org:", n);

await sql.end();
