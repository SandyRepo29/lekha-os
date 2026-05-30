// Verifies document delete + vendor delete (with document cascade) against
// the real workspace. Cleans up after itself.
import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

const [org] = await sql`
  select o.id, m.user_id from organizations o
  join memberships m on m.organization_id = o.id and m.role='owner'
  order by o.created_at desc limit 1`;

const [v] = await sql`
  insert into vendors (organization_id, name, risk_level, status, compliance_score, created_by)
  values (${org.id}, 'Polish Verify Vendor', 'medium', 'active', 60, ${org.user_id}) returning id`;
const [d1] = await sql`insert into vendor_documents (organization_id, vendor_id, document_type, storage_path, status)
  values (${org.id}, ${v.id}, 'Doc A', ${org.id + "/" + v.id + "/a.pdf"}, 'valid') returning id`;
await sql`insert into vendor_documents (organization_id, vendor_id, document_type, storage_path, status)
  values (${org.id}, ${v.id}, 'Doc B', ${org.id + "/" + v.id + "/b.pdf"}, 'valid')`;

const before = await sql`select count(*)::int n from vendor_documents where vendor_id=${v.id}`;
console.log("docs after 2 inserts:", before[0].n);

// delete one document
await sql`delete from vendor_documents where id=${d1.id}`;
const afterDel = await sql`select count(*)::int n from vendor_documents where vendor_id=${v.id}`;
console.log("docs after deleting one:", afterDel[0].n, "(expect 1)");

// delete vendor — documents should cascade
await sql`delete from vendors where id=${v.id}`;
const vendorGone = await sql`select count(*)::int n from vendors where id=${v.id}`;
const docsGone = await sql`select count(*)::int n from vendor_documents where vendor_id=${v.id}`;
console.log("vendor rows after delete:", vendorGone[0].n, "(expect 0)");
console.log("doc rows after vendor delete (cascade):", docsGone[0].n, "(expect 0)");

await sql.end();
