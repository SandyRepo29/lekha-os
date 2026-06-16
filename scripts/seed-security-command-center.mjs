// seed-security-command-center.mjs
// Seeds demo data for Module 32 — Security Command Center™
// Targets the most-active org (most memberships)

import postgres from "postgres";
import { randomBytes } from "crypto";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = postgres(DATABASE_URL, { ssl: "require", max: 1 });

async function main() {
  console.log("Seeding Security Command Center™...\n");

  // Pick the most-active org
  const [{ org_id: orgId }] = await sql`
    SELECT organization_id AS org_id FROM memberships
    GROUP BY organization_id ORDER BY count(*) DESC LIMIT 1
  `;
  console.log("Target org:", orgId);

  // Pick a user (owner)
  const [{ user_id: userId }] = await sql`
    SELECT user_id FROM memberships WHERE organization_id = ${orgId} AND role = 'owner' LIMIT 1
  `;

  // 1. MFA Settings
  await sql`
    INSERT INTO security_mfa_settings (organization_id, enforcement_mode, allow_remember_device, remember_days, require_on_new_device)
    VALUES (${orgId}, 'required_admins', TRUE, 30, TRUE)
    ON CONFLICT (organization_id) DO NOTHING
  `;
  console.log("✓ MFA settings seeded");

  // 2. Seed user MFA status for all active members
  const members = await sql`
    SELECT user_id FROM memberships WHERE organization_id = ${orgId} AND is_active = TRUE
  `;
  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const enabled = i < Math.floor(members.length * 0.7); // 70% enrolled
    await sql`
      INSERT INTO user_mfa_status (user_id, organization_id, enabled, enabled_at, last_verified_at)
      VALUES (${m.user_id}, ${orgId}, ${enabled},
        ${enabled ? new Date(Date.now() - Math.random() * 30 * 86400000) : null},
        ${enabled ? new Date(Date.now() - Math.random() * 7 * 86400000) : null})
      ON CONFLICT (user_id, organization_id) DO NOTHING
    `;
  }
  console.log(`✓ User MFA status seeded for ${members.length} members`);

  // 3. SSO Provider
  const [sso] = await sql`
    INSERT INTO sso_providers (organization_id, name, provider_type, enabled, oidc_client_id, oidc_issuer_url, jit_enabled, default_role, created_by)
    VALUES (${orgId}, 'Microsoft Entra ID', 'entra_id', TRUE, 'client_audt_demo_123', 'https://login.microsoftonline.com/tenant-id/v2.0', TRUE, 'member', ${userId})
    RETURNING id
  `;
  await sql`
    INSERT INTO sso_domains (organization_id, sso_provider_id, domain, verified)
    VALUES (${orgId}, ${sso.id}, 'yourcompany.com', TRUE)
    ON CONFLICT (organization_id, domain) DO NOTHING
  `;
  console.log("✓ SSO provider seeded (Entra ID)");

  // 4. Active Sessions (demo data)
  const BROWSERS = ["Chrome 120", "Firefox 121", "Safari 17", "Edge 119"];
  const DEVICES  = ["MacBook Pro", "Windows Laptop", "iPhone 15", "Android"];
  const COUNTRIES = ["India", "India", "India", "US"];
  const IPS = ["103.25.17.45", "122.167.88.12", "49.36.210.9", "74.125.68.100"];

  for (const m of members.slice(0, 5)) {
    await sql`
      INSERT INTO user_sessions (user_id, organization_id, ip_address, browser, device, os, country, status, mfa_verified, last_active, expires_at)
      VALUES (
        ${m.user_id}, ${orgId},
        ${IPS[Math.floor(Math.random() * IPS.length)]},
        ${BROWSERS[Math.floor(Math.random() * BROWSERS.length)]},
        ${DEVICES[Math.floor(Math.random() * DEVICES.length)]},
        'Various',
        ${COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)]},
        'active', TRUE,
        ${new Date(Date.now() - Math.random() * 3600000)},
        ${new Date(Date.now() + 86400000 * 7)}
      )
    `;
  }
  console.log("✓ Active sessions seeded");

  // 5. IP Allow Lists
  const ipRules = [
    { cidr: "192.168.1.0/24",    desc: "Office Network",          applies: "all" },
    { cidr: "10.0.0.0/8",        desc: "VPN Range",               applies: "all" },
    { cidr: "203.145.67.0/28",   desc: "SOC Team",                applies: "api" },
    { cidr: "49.36.210.0/24",    desc: "Mumbai Data Center",      applies: "all" },
  ];
  for (const r of ipRules) {
    await sql`
      INSERT INTO ip_allowlists (organization_id, cidr_range, description, applies_to, enabled, created_by)
      VALUES (${orgId}, ${r.cidr}, ${r.desc}, ${r.applies}, TRUE, ${userId})
    `;
  }
  console.log("✓ IP allow list rules seeded");

  // 6. Evidence Shares (demo)
  const shareData = [
    { email: "auditor@kpmg.com",    name: "KPMG Auditor",   access: "view_only",  days: 30 },
    { email: "security@client.com", name: "Security Team",  access: "view_only",  days: 7  },
    { email: "ciso@partner.com",    name: "CISO Review",    access: "download",   days: 14 },
  ];
  for (const s of shareData) {
    const token = randomBytes(32).toString("hex");
    await sql`
      INSERT INTO evidence_shares (organization_id, created_by, share_token, recipient_email, recipient_name, access_level, watermark, expires_at)
      VALUES (${orgId}, ${userId}, ${token}, ${s.email}, ${s.name}, ${s.access}, TRUE,
        ${new Date(Date.now() + s.days * 86400000)})
    `;
  }
  console.log("✓ Evidence shares seeded");

  // 7. AI Prompt Logs (30 days of demo data)
  const MODULES = ["compliance", "risk", "vendor", "controls", "agents", "audit"];
  const AGENTS = ["governance_copilot", "ai_risk_officer", "ai_compliance_officer", "ai_auditor"];
  const SENSTVTY = ["clean", "clean", "clean", "clean", "clean", "low", "medium", "high"];
  for (let i = 0; i < 45; i++) {
    const sens = SENSTVTY[Math.floor(Math.random() * SENSTVTY.length)];
    await sql`
      INSERT INTO ai_prompt_logs (organization_id, user_id, module, agent_type, prompt_preview, model, input_tokens, output_tokens, latency_ms, sensitivity, blocked, created_at)
      VALUES (
        ${orgId}, ${userId},
        ${MODULES[Math.floor(Math.random() * MODULES.length)]},
        ${AGENTS[Math.floor(Math.random() * AGENTS.length)]},
        'What is the current compliance posture for our ISO 27001 framework?',
        'gemini-2.5-flash',
        ${Math.floor(Math.random() * 800 + 100)},
        ${Math.floor(Math.random() * 400 + 50)},
        ${Math.floor(Math.random() * 3000 + 500)},
        ${sens},
        ${sens === "high" ? "TRUE" : "FALSE"},
        ${new Date(Date.now() - Math.random() * 30 * 86400000)}
      )
    `;
  }
  console.log("✓ AI prompt logs seeded (45 entries)");

  // 8. Vendor Monitoring Assets
  const vendors = await sql`SELECT id, name FROM vendors WHERE organization_id = ${orgId} LIMIT 5`;
  for (const v of vendors) {
    // infer domain from vendor name
    const domain = v.name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
    await sql`
      INSERT INTO vendor_monitoring_assets (organization_id, vendor_id, asset_type, asset_value, check_interval, enabled, created_by)
      VALUES (${orgId}, ${v.id}, 'domain', ${domain}, 'daily', TRUE, ${userId})
    `;
    await sql`
      INSERT INTO vendor_monitoring_assets (organization_id, vendor_id, asset_type, asset_value, check_interval, enabled, created_by)
      VALUES (${orgId}, ${v.id}, 'ssl', ${domain}, 'weekly', TRUE, ${userId})
    `;
  }
  console.log(`✓ Vendor monitoring assets seeded for ${vendors.length} vendors`);

  // 9. Vendor Monitoring Alerts
  const [assetRow] = await sql`SELECT id, vendor_id FROM vendor_monitoring_assets WHERE organization_id = ${orgId} LIMIT 1`;
  if (assetRow) {
    const alertData = [
      { title: "SSL certificate expiring in 14 days", desc: "The SSL certificate for this vendor will expire soon.", sev: "high" },
      { title: "Domain registration expires in 30 days", desc: "Domain expiry alert — contact vendor to renew.", sev: "medium" },
      { title: "Potential data breach detected", desc: "Vendor email domain found in public breach database.", sev: "critical" },
      { title: "DNS record change detected", desc: "MX record changed — verify with vendor.", sev: "low" },
    ];
    for (const a of alertData) {
      await sql`
        INSERT INTO vendor_monitoring_alerts (organization_id, vendor_id, asset_id, title, description, severity, status)
        VALUES (${orgId}, ${assetRow.vendor_id}, ${assetRow.id}, ${a.title}, ${a.desc}, ${a.sev}, 'open')
      `;
    }
    console.log("✓ Vendor monitoring alerts seeded");
  }

  // 10. Trust Center Config
  const [org] = await sql`SELECT legal_name, website FROM organizations WHERE id = ${orgId}`;
  await sql`
    INSERT INTO trust_center_config (organization_id, title, tagline, description, security_email, show_trust_score, show_certifications, show_documents, enabled)
    VALUES (${orgId},
      ${(org?.legal_name ?? "Our Organization") + " Security"},
      'Security and compliance you can verify.',
      'We are committed to enterprise-grade security, data privacy, and governance transparency.',
      'security@' + COALESCE(NULLIF(regexp_replace(${org?.website ?? ''}, 'https?://', ''), ''), 'yourcompany.com'),
      TRUE, TRUE, TRUE, FALSE)
    ON CONFLICT (organization_id) DO NOTHING
  `.catch(() =>
    sql`
      INSERT INTO trust_center_config (organization_id, title, tagline, description, security_email, show_trust_score, show_certifications, show_documents, enabled)
      VALUES (${orgId}, 'Security Trust Center', 'Security and compliance you can verify.',
        'We are committed to enterprise-grade security, data privacy, and governance transparency.',
        'security@yourcompany.com', TRUE, TRUE, TRUE, FALSE)
      ON CONFLICT (organization_id) DO NOTHING
    `
  );
  console.log("✓ Trust Center config seeded");

  console.log("\nSecurity Command Center™ seed complete!");
  console.log("Tables seeded: security_mfa_settings, user_mfa_status, sso_providers, sso_domains,");
  console.log("  user_sessions, ip_allowlists, evidence_shares, ai_prompt_logs,");
  console.log("  vendor_monitoring_assets, vendor_monitoring_alerts, trust_center_config");
}

main().catch(console.error).finally(() => sql.end());
