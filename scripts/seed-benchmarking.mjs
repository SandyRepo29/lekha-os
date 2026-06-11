/**
 * Seed script — Governance Benchmarking™ (Module 16)
 * Runs a benchmark computation for the target org using seeded module data.
 *
 * Usage: node scripts/seed-benchmarking.mjs [orgId]
 *        node scripts/seed-benchmarking.mjs --list
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

/** Simple percentile calculation matching the pure engine in benchmarking-score.ts */
function normalCDF(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422820 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))));
  return z > 0 ? 1 - p : p;
}
function computePercentile(score, avg, stdDev) {
  if (stdDev <= 0) return score >= avg ? 75 : 40;
  const z = (score - avg) / stdDev;
  return Math.round(normalCDF(z) * 100);
}
function getRankingLabel(pct) {
  if (pct >= 99) return "top_1_percent";
  if (pct >= 95) return "top_5_percent";
  if (pct >= 90) return "top_10_percent";
  if (pct >= 75) return "top_quartile";
  if (pct >= 60) return "above_average";
  if (pct >= 40) return "average";
  if (pct >= 25) return "below_average";
  return "at_risk";
}
function getMaturityLevel(pct) {
  if (pct >= 99) return "trust_leader";
  if (pct >= 90) return "optimized";
  if (pct >= 75) return "measured";
  if (pct >= 60) return "defined";
  if (pct >= 40) return "managed";
  return "reactive";
}

// Simulated scores for demo data (matching typical trust exchange demo seed)
const DEMO_SCORES = {
  organizational_trust: 84,
  vendor_trust:         88,
  risk_posture:         72,
  control_health:       78,
  audit_readiness:      76,
  compliance_coverage:  80,
  privacy_trust:        79,
  contract_trust:       74,
  issue_resolution:     70,
  workflow_automation:  68,
};

async function seed(orgId) {
  console.log(`Seeding Governance Benchmarking™ for org: ${orgId}`);

  // 1. Get org info
  const [org] = await sql`SELECT id, name, industry, company_size FROM organizations WHERE id = ${orgId}`;
  if (!org) { console.error("Org not found"); process.exit(1); }

  const industryMap = { saas: "technology", fintech: "financial_services", healthcare: "healthcare", manufacturing: "manufacturing" };
  const industry = industryMap[org.industry] ?? "technology";

  // 2. Load baselines
  const baselines = await sql`
    SELECT category, avg_score, median_score, top_quartile, top_decile, bottom_quartile, std_dev, sample_size
    FROM benchmark_industries
    WHERE industry = ${industry} AND company_size = 'all'
  `;
  if (!baselines.length) {
    console.log("  ⚠ No baselines found for industry, using 'all'");
  }
  const blMap = {};
  for (const b of baselines) blMap[b.category] = b;

  // fallback to 'all'
  const allBaselines = await sql`SELECT * FROM benchmark_industries WHERE industry = 'all' AND company_size = 'all'`;
  for (const b of allBaselines) if (!blMap[b.category]) blMap[b.category] = b;

  // 3. Compute percentiles
  const today = new Date().toISOString().slice(0, 10);
  const categoryResults = [];
  let sumPct = 0, countPct = 0;

  for (const [cat, orgScore] of Object.entries(DEMO_SCORES)) {
    const bl = blMap[cat];
    if (!bl) continue;
    const pct = computePercentile(orgScore, bl.avg_score, bl.std_dev);
    const rankLabel = getRankingLabel(pct);
    categoryResults.push({
      category: cat, orgScore, industryAvg: bl.avg_score, peerAvg: bl.median_score,
      topQuartile: bl.top_quartile, percentile: pct, rankingLabel: rankLabel,
      deltaVsIndustry: orgScore - bl.avg_score,
    });
    sumPct += pct; countPct++;
  }

  const overallPct = countPct ? Math.round(sumPct / countPct) : 50;
  const overallScore = Math.round(Object.values(DEMO_SCORES).reduce((s, v) => s + v, 0) / Object.keys(DEMO_SCORES).length);
  const maturityLevel = getMaturityLevel(overallPct);
  const overallRanking = getRankingLabel(overallPct);

  // 4. Insert snapshot
  const [snapshot] = await sql`
    INSERT INTO benchmark_snapshots (organization_id, snapshot_date, industry, company_size, overall_score, overall_percentile, maturity_level, overall_ranking, peer_count)
    VALUES (${orgId}, ${today}, ${industry}, 'all', ${overallScore}, ${overallPct}, ${maturityLevel}, ${overallRanking}, ${allBaselines[0]?.sample_size ?? 500})
    RETURNING id
  `;
  console.log(`  ✓ Snapshot created: ${snapshot.id}`);
  console.log(`    Overall score: ${overallScore} · Percentile: ${overallPct}th · Maturity: ${maturityLevel}`);

  // 5. Insert category scores
  for (const r of categoryResults) {
    await sql`
      INSERT INTO benchmark_scores (snapshot_id, organization_id, category, org_score, industry_avg, peer_avg, top_quartile, percentile, ranking_label, delta_vs_industry)
      VALUES (${snapshot.id}, ${orgId}, ${r.category}, ${r.orgScore}, ${r.industryAvg}, ${r.peerAvg}, ${r.topQuartile}, ${r.percentile}, ${r.rankingLabel}, ${r.deltaVsIndustry})
    `;
  }
  console.log(`  ✓ ${categoryResults.length} category scores inserted`);

  // 6. Upsert monthly trends (last 6 months)
  for (let m = 0; m < 6; m++) {
    const d = new Date();
    d.setMonth(d.getMonth() - m);
    const periodMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    for (const r of categoryResults) {
      // Add slight variance for older months to simulate trend
      const variance = m === 0 ? 0 : Math.round((Math.random() - 0.5) * 6);
      const historicScore = Math.max(0, Math.min(100, r.orgScore + variance));
      const bl = blMap[r.category];
      const historicPct = bl ? computePercentile(historicScore, bl.avg_score, bl.std_dev) : r.percentile;
      await sql`
        INSERT INTO benchmark_trends (organization_id, category, period_month, score, percentile, ranking_label, industry_avg)
        VALUES (${orgId}, ${r.category}, ${periodMonth}, ${historicScore}, ${historicPct}, ${getRankingLabel(historicPct)}, ${r.industryAvg})
        ON CONFLICT (organization_id, category, period_month) DO UPDATE
          SET score = ${historicScore}, percentile = ${historicPct}
      `;
    }
  }
  console.log(`  ✓ 6-month trend data seeded`);

  console.log("\n✅ Governance Benchmarking™ seed complete.");
  console.log(`   Dashboard: /benchmarking`);
  console.log(`   Rankings:  /benchmarking/rankings`);
  console.log(`   AI Analyst: /benchmarking/ai`);
}

const args = process.argv.slice(2);
if (args[0] === "--list") {
  await listOrgs();
} else if (args[0]) {
  await seed(args[0]);
} else {
  const [first] = await sql`SELECT id FROM organizations ORDER BY created_at LIMIT 1`;
  if (first) {
    await seed(first.id);
  } else {
    console.error("No organizations found.");
    await listOrgs();
  }
}

await sql.end();
