import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

const orgs   = await sql`SELECT id, name FROM organizations ORDER BY created_at DESC LIMIT 3`;
const [v]    = await sql`SELECT count(*)::int n FROM vendors`;
const [d]    = await sql`SELECT count(*)::int n FROM vendor_documents`;
const [dg]   = await sql`SELECT count(*)::int n FROM vendor_documents WHERE file_size IS NOT NULL`;
const [a]    = await sql`SELECT count(*)::int n FROM assessments`;
const [r]    = await sql`SELECT count(*)::int n FROM vendor_reviews`;
const [al]   = await sql`SELECT count(*)::int n FROM audit_logs`;
const [lh]   = await sql`SELECT count(*)::int n FROM login_history`;
const [fw]   = await sql`SELECT count(*)::int n FROM frameworks`;
const [ctrl] = await sql`SELECT count(*)::int n FROM controls`;
const [ev]   = await sql`SELECT count(*)::int n FROM evidence`;
const [sp]   = await sql`SELECT name, type, is_active FROM storage_providers`;
const me     = await sql`SELECT id, email FROM profiles LIMIT 5`;

console.log("orgs:", JSON.stringify(orgs));
console.log(`vendors: ${v.n} | docs: ${d.n} (${dg.n} with file_size) | assessments: ${a.n} | reviews: ${r.n}`);
console.log(`audit_logs: ${al.n} | login_history: ${lh.n}`);
console.log(`frameworks: ${fw.n} | controls: ${ctrl.n} | evidence: ${ev.n}`);
console.log(`storage_providers:`, JSON.stringify(sp));
console.log("profiles:", JSON.stringify(me));
await sql.end();
