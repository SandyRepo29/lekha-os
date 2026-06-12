/**
 * Seed script — Executive Reporting & Analytics™ (Module 19)
 * Seeds: 5 KPI snapshots, 3 reports, 2 schedules, 3 forecasts, 6 KPIs
 *
 * Usage: node scripts/seed-executive-reporting.mjs [orgId]
 *        node scripts/seed-executive-reporting.mjs --list
 */

import postgres from "postgres";
import { randomUUID } from "crypto";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = postgres(DATABASE_URL, { ssl: "require", max: 1 });

async function listOrgs() {
  const rows = await sql`SELECT id, name FROM organizations ORDER BY created_at LIMIT 20`;
  console.log("Organizations:");
  rows.forEach((r) => console.log(`  ${r.id}  ${r.name}`));
}

async function seed(orgId) {
  console.log(`Seeding Executive Reporting & Analytics™ for org: ${orgId}`);

  // Get org + a profile for generated_by
  const [org] = await sql`SELECT id, name FROM organizations WHERE id = ${orgId}`;
  if (!org) { console.error("Org not found"); process.exit(1); }

  const profiles = await sql`SELECT id FROM profiles WHERE id IN (SELECT user_id FROM memberships WHERE organization_id = ${orgId} AND role = 'owner') LIMIT 1`;
  const actorId = profiles[0]?.id ?? null;

  // ── 1. KPIs ──────────────────────────────────────────────────────────────

  const kpis = [
    { kpiKey: "org_trust_score",      kpiName: "Org Trust Score™",       currentValue: "78.00", previousValue: "72.00", targetValue: "85.00", unit: "/100", trend: "up",     period: "current" },
    { kpiKey: "active_vendors",        kpiName: "Active Vendors",          currentValue: "15.00", previousValue: "13.00", targetValue: null,    unit: "vendors", trend: "up",  period: "current" },
    { kpiKey: "open_risks",            kpiName: "Open Risks",              currentValue: "8.00",  previousValue: "12.00", targetValue: "5.00",  unit: "risks", trend: "down",  period: "current" },
    { kpiKey: "control_health",        kpiName: "Control Health™",         currentValue: "74.00", previousValue: "68.00", targetValue: "80.00", unit: "%", trend: "up",        period: "current" },
    { kpiKey: "open_findings",         kpiName: "Open Findings",           currentValue: "14.00", previousValue: "20.00", targetValue: "5.00",  unit: "findings", trend: "down", period: "current" },
    { kpiKey: "open_capas",            kpiName: "Open CAPAs",              currentValue: "9.00",  previousValue: "11.00", targetValue: "3.00",  unit: "CAPAs", trend: "down",  period: "current" },
    { kpiKey: "compliance_frameworks", kpiName: "Compliance Frameworks",   currentValue: "5.00",  previousValue: "5.00",  targetValue: null,    unit: "frameworks", trend: "stable", period: "current" },
    { kpiKey: "monitoring_alerts",     kpiName: "Monitoring Alerts",       currentValue: "3.00",  previousValue: "7.00",  targetValue: "0.00",  unit: "alerts", trend: "down", period: "current" },
    { kpiKey: "open_issues",           kpiName: "Open Issues",             currentValue: "6.00",  previousValue: "9.00",  targetValue: "3.00",  unit: "issues", trend: "down", period: "current" },
    { kpiKey: "contracts",             kpiName: "Active Contracts",        currentValue: "7.00",  previousValue: "5.00",  targetValue: null,    unit: "contracts", trend: "up", period: "current" },
  ];

  for (const kpi of kpis) {
    await sql`
      INSERT INTO analytics_kpis (org_id, kpi_key, kpi_name, current_value, previous_value, target_value, unit, trend, period, computed_at)
      VALUES (${orgId}, ${kpi.kpiKey}, ${kpi.kpiName}, ${kpi.currentValue}, ${kpi.previousValue}, ${kpi.targetValue}, ${kpi.unit}, ${kpi.trend}, ${kpi.period}, NOW())
      ON CONFLICT (org_id, kpi_key) DO UPDATE SET
        current_value = EXCLUDED.current_value,
        previous_value = EXCLUDED.previous_value,
        trend = EXCLUDED.trend,
        computed_at = NOW()
    `;
  }
  console.log(`  ✓ Seeded ${kpis.length} KPIs`);

  // ── 2. KPI Snapshots (last 5 days) ──────────────────────────────────────

  const baseKpiData = { org_trust_score: 75, active_vendors: 14, open_risks: 10, control_health: 70, open_findings: 16, open_capas: 11, compliance_frameworks: 5, monitoring_alerts: 5, open_issues: 8, contracts: 6 };
  for (let i = 4; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const noise = (k) => Math.round((baseKpiData[k] + (4 - i) * (k === "org_trust_score" || k === "control_health" ? 0.8 : -0.4) + (Math.random() - 0.5)) * 10) / 10;
    const kpiData = Object.fromEntries(Object.keys(baseKpiData).map((k) => [k, noise(k)]));
    await sql`
      INSERT INTO analytics_snapshots (org_id, snapshot_date, kpi_data, trend_data, benchmark_data, forecast_data)
      VALUES (${orgId}, ${dateStr}, ${JSON.stringify(kpiData)}, '{}', '{}', '{}')
      ON CONFLICT (org_id, snapshot_date) DO UPDATE SET kpi_data = EXCLUDED.kpi_data
    `;
  }
  console.log(`  ✓ Seeded 5 KPI snapshots`);

  // ── 3. Reports ────────────────────────────────────────────────────────────

  const reports = [
    { name: "Board Governance Report — Q2 2026", reportType: "board_governance", format: "pdf", status: "ready" },
    { name: "Risk Committee Report — June 2026",  reportType: "risk_committee",   format: "pdf", status: "ready" },
    { name: "Executive Governance Report",        reportType: "executive_governance", format: "pdf", status: "ready" },
  ];

  for (const r of reports) {
    const existing = await sql`SELECT id FROM analytics_reports WHERE org_id = ${orgId} AND name = ${r.name} LIMIT 1`;
    if (existing.length === 0) {
      await sql`
        INSERT INTO analytics_reports (org_id, name, report_type, status, format, content_snapshot, generated_by, generated_at)
        VALUES (${orgId}, ${r.name}, ${r.reportType}, ${r.status}, ${r.format}, ${JSON.stringify({ kpis: Object.fromEntries(kpis.map((k) => [k.kpiKey, k.currentValue])) })}, ${actorId}, NOW())
      `;
    }
  }
  console.log(`  ✓ Seeded ${reports.length} reports`);

  // ── 4. Schedules ──────────────────────────────────────────────────────────

  const schedules = [
    { name: "Monthly Board Pack",      reportType: "board_governance",    frequency: "monthly",   deliveryMethod: "email", recipients: ["board@audt.tech"] },
    { name: "Weekly Risk Briefing",    reportType: "risk_committee",      frequency: "weekly",    deliveryMethod: "email", recipients: ["cro@audt.tech"] },
  ];

  for (const s of schedules) {
    const existing = await sql`SELECT id FROM analytics_schedules WHERE org_id = ${orgId} AND name = ${s.name} LIMIT 1`;
    if (existing.length === 0) {
      await sql`
        INSERT INTO analytics_schedules (org_id, name, report_type, frequency, delivery_method, recipients, is_active, created_by)
        VALUES (${orgId}, ${s.name}, ${s.reportType}, ${s.frequency}, ${s.deliveryMethod}, ${JSON.stringify(s.recipients)}, true, ${actorId})
      `;
    }
  }
  console.log(`  ✓ Seeded ${schedules.length} schedules`);

  // ── 5. Forecasts ──────────────────────────────────────────────────────────

  const forecastMetrics = [
    { metricName: "org_trust_score", current: 78.0 },
    { metricName: "control_health",  current: 74.0 },
    { metricName: "open_risks",      current: 8.0  },
  ];
  const horizons = [30, 90, 180];

  for (const m of forecastMetrics) {
    for (const h of horizons) {
      const trend = m.metricName === "open_risks" ? -1 : 1;
      const forecastValue = Math.round((m.current + trend * h * 0.04 + (Math.random() - 0.5)) * 10) / 10;
      const expires = new Date();
      expires.setDate(expires.getDate() + 1);
      await sql`
        INSERT INTO analytics_forecasts (org_id, metric_name, horizon_days, current_value, forecast_value, confidence_score, forecast_data, generated_at, expires_at)
        VALUES (${orgId}, ${m.metricName}, ${h}, ${m.current}, ${forecastValue}, ${(0.65 + Math.random() * 0.25).toFixed(2)}, '[]', NOW(), ${expires.toISOString()})
        ON CONFLICT DO NOTHING
      `;
    }
  }
  console.log(`  ✓ Seeded ${forecastMetrics.length * horizons.length} forecasts`);

  await sql.end();
  console.log("\n✅ Executive Reporting & Analytics™ seed complete");
  console.log("   Visit: /executive-reporting");
}

// ── Entry point ───────────────────────────────────────────────────────────────

const arg = process.argv[2];
if (arg === "--list") {
  await listOrgs();
  await sql.end();
} else if (arg) {
  await seed(arg);
} else {
  // Auto-detect the first org
  const [org] = await sql`SELECT id, name FROM organizations ORDER BY created_at LIMIT 1`;
  if (!org) { console.error("No organizations found. Run seed-demo.mjs first."); process.exit(1); }
  console.log(`Auto-detected org: ${org.name} (${org.id})`);
  await seed(org.id);
}
