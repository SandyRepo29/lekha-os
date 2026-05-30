// Verifies the documents path: storage bucket + policies exist, and a
// vendor_documents insert + per-status grouping + score math work. Cleans up.
import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

const [bucket] = await sql`select id, public from storage.buckets where id = 'vendor-documents'`;
console.log("bucket:", bucket ?? "MISSING ✗");

const pol = await sql`select policyname from pg_policies where schemaname='storage' and policyname like '%vendor docs%'`;
console.log("storage policies:", pol.map((p) => p.policyname));

const [org] = await sql`
  select o.id, m.user_id from organizations o
  join memberships m on m.organization_id = o.id and m.role='owner'
  order by o.created_at desc limit 1`;
console.log("workspace org:", org.id);

const [v] = await sql`
  insert into vendors (organization_id, name, risk_level, status, compliance_score, created_by)
  values (${org.id}, 'Doc Verify Vendor', 'high', 'active', 45, ${org.user_id}) returning id`;
await sql`insert into vendor_documents (organization_id, vendor_id, document_type, storage_path, status)
          values (${org.id}, ${v.id}, 'ISO 27001', ${org.id + "/" + v.id + "/iso.pdf"}, 'valid')`;
await sql`insert into vendor_documents (organization_id, vendor_id, document_type, storage_path, status, expires_on)
          values (${org.id}, ${v.id}, 'SOC 2', ${org.id + "/" + v.id + "/soc2.pdf"}, 'expired', '2024-01-01')`;

const counts = await sql`
  select status, count(*)::int n from vendor_documents
  where vendor_id = ${v.id} group by status`;
console.log("doc status counts:", Object.fromEntries(counts.map((c) => [c.status, c.n])));

// mirror computeScore(high, {valid:1, expiring:0, expired:1}) = 45 + 5 - 20 = 30
const valid = counts.find((c) => c.status === "valid")?.n ?? 0;
const expired = counts.find((c) => c.status === "expired")?.n ?? 0;
const expiring = counts.find((c) => c.status === "expiring")?.n ?? 0;
const score = Math.max(0, Math.min(100, 45 + Math.min(valid * 5, 40) - expiring * 10 - expired * 20));
console.log("recomputed score (expect 30):", score);

await sql`delete from vendors where id = ${v.id}`;
console.log("cleaned up");
await sql.end();
