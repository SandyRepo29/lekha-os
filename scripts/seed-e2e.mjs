/**
 * Seed a test user and workspace for E2E tests.
 * Run before Playwright tests: node scripts/seed-e2e.mjs
 *
 * Requires:
 *   TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, TEST_DATABASE_URL
 *   E2E_USER_EMAIL, E2E_USER_PASSWORD in .env.local
 *
 * This should use a SEPARATE Supabase project from the sandbox.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const url    = process.env.TEST_SUPABASE_URL   ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon   = process.env.TEST_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email  = process.env.E2E_USER_EMAIL ?? "e2e@lekhaos.test";
const pass   = process.env.E2E_USER_PASSWORD ?? "E2ETest123!";

if (!url || !anon) {
  console.error("TEST_SUPABASE_URL and TEST_SUPABASE_ANON_KEY (or NEXT_PUBLIC_*) are required.");
  process.exit(1);
}

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(url, anon);

// Try signup first, then sign in (idempotent)
const { data: signupData, error: signupErr } = await supabase.auth.signUp({ email, password: pass });
if (signupErr && !signupErr.message.includes("already")) {
  console.error("Signup failed:", signupErr.message);
}

const { data: signinData, error: signinErr } = await supabase.auth.signInWithPassword({ email, password: pass });
if (signinErr) {
  console.error("Sign-in failed:", signinErr.message);
  process.exit(1);
}

const userId = signinData.user?.id;
if (!userId) { console.error("No user ID after sign-in"); process.exit(1); }
console.log("E2E user ready:", email, "→ id:", userId);

// Ensure workspace exists via the DB
const dbUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (dbUrl) {
  const postgres = (await import("postgres")).default;
  const sql = postgres(dbUrl, { prepare: false, onnotice: () => {} });

  // Check for existing org membership
  const [existing] = await sql`
    select o.id from organizations o
    join memberships m on m.organization_id = o.id
    where m.user_id = ${userId} limit 1`;

  if (!existing) {
    const slug = `e2e-${Date.now()}`;
    const [org] = await sql`
      insert into organizations (name, slug) values ('E2E Workspace', ${slug}) returning id`;
    await sql`insert into memberships (organization_id, user_id, role) values (${org.id}, ${userId}, 'owner')`;
    console.log("Created E2E workspace:", org.id);
  } else {
    console.log("E2E workspace already exists:", existing.id);
  }
  await sql.end();
}

console.log("E2E seed complete.");
