import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

const tables = [
  ["risks",                 "Risk Lens™"],
  ["risk_treatments",       "Risk Lens™"],
  ["risk_reviews",          "Risk Lens™"],
  ["audits",                "Audit Mgmt"],
  ["audit_findings",        "Audit Mgmt"],
  ["corrective_actions",    "Audit Mgmt"],
  ["control_tests",         "Control Center™"],
  ["vendor_trust_history",  "Trust Score™"],
  ["governance_snapshots",  "Trust Intelligence™"],
  ["governance_alerts",     "Monitoring™"],
  ["graph_nodes",           "Trust Graph™"],
  ["graph_edges",           "Trust Graph™"],
  ["policy_reviews",        "Policy Gov™"],
  ["policy_attestations",   "Policy Gov™"],
  ["data_assets",           "DPDP Privacy™"],
  ["consent_records",       "DPDP Privacy™"],
  ["privacy_requests",      "DPDP Privacy™"],
  ["contracts",             "Contract Gov™"],
  ["contract_obligations",  "Contract Gov™"],
  ["issues",                "Issue Hub™"],
  ["issue_tasks",           "Issue Hub™"],
  ["trust_profiles",        "Trust Exchange™"],
  ["trust_documents",       "Trust Exchange™"],
  ["trust_badges",          "Trust Exchange™"],
  ["trust_questionnaires",  "Trust Exchange™"],
  ["benchmark_snapshots",   "Benchmarking™"],
  ["benchmark_scores",      "Benchmarking™"],
  ["integration_instances", "Integration Hub™"],
  ["integration_syncs",     "Integration Hub™"],
  ["integration_events",    "Integration Hub™"],
  ["network_profile_views", "Trust Network™"],
  ["analytics_kpis",        "Exec Reporting™"],
  ["analytics_snapshots",   "Exec Reporting™"],
  ["analytics_reports",     "Exec Reporting™"],
  ["analytics_forecasts",   "Exec Reporting™"],
  ["ai_systems",            "AI Governance™"],
  ["ai_risks",              "AI Governance™"],
  ["ai_incidents",          "AI Governance™"],
  ["audit_rooms",           "Auditor Collab™"],
  ["evidence_requests",     "Auditor Collab™"],
  ["external_findings",     "Auditor Collab™"],
  ["external_users",        "Auditor Collab™"],
  ["tap_clients",           "Trust API™"],
  ["tap_api_keys",          "Trust API™"],
  ["tap_webhooks",          "Trust API™"],
  ["tap_usage",             "Trust API™"],
  ["verification_programs", "TVA™"],
  ["tva_verifications",     "TVA™"],
  ["verification_certificates", "TVA™"],
  ["verification_badges",   "TVA™"],
];

const results = await Promise.all(
  tables.map(([t, mod]) =>
    sql`SELECT count(*)::int n FROM ${sql(t)}`
      .then(([r]) => [mod, t, r.n])
      .catch(() => [mod, t, "ERR"])
  )
);

console.log("\nModule seed status:\n");
let lastMod = "";
for (const [mod, t, n] of results) {
  if (mod !== lastMod) { console.log(`  ${mod}`); lastMod = mod; }
  const flag = n === 0 ? "  ← EMPTY (needs seed)" : n === "ERR" ? "  ← ERROR" : "";
  console.log(`    ${t.padEnd(32)} ${String(n).padStart(4)}${flag}`);
}
await sql.end();
