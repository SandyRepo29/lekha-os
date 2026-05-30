// End-to-end check: sign up a user, confirm the profile trigger fired,
// and verify RLS is enabled on tenant tables.
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local" });

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const email = `lekha.verify.${Date.now()}@gmail.com`;
const { data, error } = await supa.auth.signUp({
  email,
  password: "TestPass123!",
  options: { data: { full_name: "Test User" } },
});

console.log("signUp:", error ? `ERROR ${error.message}` : "ok");
console.log("  user id:", data?.user?.id);
console.log("  session:", data?.session ? "yes (email confirm OFF)" : "no (email confirm ON)");

const sql = postgres(process.env.DATABASE_URL_DIRECT, { max: 1, prepare: false, onnotice: () => {} });
await new Promise((r) => setTimeout(r, 1500));

if (data?.user?.id) {
  const profile = await sql`select id, email, full_name from public.profiles where id = ${data.user.id}`;
  console.log("profile row created by trigger:", profile.length ? profile[0] : "NONE ✗");
}

const rls = await sql`
  select relname, relrowsecurity
  from pg_class
  where relname in ('organizations','profiles','memberships','vendors','vendor_documents','audit_logs')
  order by relname`;
console.log("RLS enabled:", Object.fromEntries(rls.map((r) => [r.relname, r.relrowsecurity])));

const policies = await sql`select count(*)::int as n from pg_policies where schemaname='public'`;
console.log("policy count:", policies[0].n);

const trig = await sql`select tgname from pg_trigger where tgname = 'on_auth_user_created'`;
console.log("signup trigger:", trig.length ? "present" : "MISSING ✗");

await sql.end();
