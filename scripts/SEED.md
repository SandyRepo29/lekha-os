# AUDT — Seed Script Reference

Complete inventory of all demo seed scripts, in the correct run order for a fresh database.

---

## Full Setup — Fresh Database

Run these commands in order after `npm run db:migrate`:

```bash
# 1. Infrastructure
node scripts/apply-sql.mjs supabase/rls.sql
node scripts/apply-sql.mjs supabase/storage.sql
node scripts/apply-sql.mjs supabase/rls-risk-lens.sql
node scripts/apply-sql.mjs supabase/migrations/0010_trust_score.sql
node scripts/apply-sql.mjs supabase/migrations/0011_control_center.sql
node scripts/apply-sql.mjs supabase/migrations/0012_trust_intelligence.sql
node scripts/apply-sql.mjs supabase/migrations/0013_governance_trends.sql
node scripts/apply-sql.mjs supabase/migrations/0014_trust_graph.sql
node scripts/apply-sql.mjs supabase/migrations/0015_policy_governance.sql
node scripts/apply-sql.mjs supabase/migrations/0016_dpdp_privacy.sql
node scripts/apply-sql.mjs supabase/migrations/0017_contract_governance.sql
node scripts/apply-sql.mjs supabase/migrations/0020_trust_exchange.sql
node scripts/apply-sql.mjs supabase/migrations/0021_benchmarking.sql
node scripts/apply-sql.mjs supabase/migrations/0022_integration_hub.sql
node scripts/apply-sql.mjs supabase/migrations/0023_trust_network.sql

# 2. Platform baseline
node scripts/seed-templates.mjs          # 7 vendor type templates
node scripts/seed-billing-plans.mjs --assign-all  # Starter/Growth/Enterprise plans

# 3. Core vendor data
node scripts/seed-demo.mjs               # 15 realistic Indian vendors + 67 docs

# 4. Compliance
node scripts/seed-compliance-frameworks.mjs   # 5 frameworks + 174 controls
node scripts/seed-compliance-demo.mjs         # statuses, evidence, mappings, policies, gaps

# 5. Settings & governance history
node scripts/seed-data-governance.mjs    # backfills doc metadata, org_settings, login_history

# 6. Risk, Audits, Controls
node scripts/seed-risk-lens.mjs          # 20 risks, 25 treatments, 8 reviews
node scripts/seed-audits.mjs             # sample audits, findings, CAPAs
node scripts/seed-control-tests.mjs      # control test records

# 7. Trust & scores
node scripts/seed-trust-scores.mjs       # Trust Score™ for all active vendors
node scripts/seed-governance-snapshots.mjs  # governance trend history snapshots

# 8. Advanced modules
node scripts/seed-policy-governance.mjs  # policy reviews + attestations
node scripts/seed-dpdp-privacy.mjs       # data assets, consent, retention, DSR
node scripts/seed-contracts.mjs          # contracts, clauses, obligations
node scripts/seed-issues.mjs             # issues, tasks, exceptions, escalations
node scripts/seed-workflows.mjs          # workflow templates + runs
node scripts/seed-vendor-extras.mjs      # vendor portal tokens, extra metadata

# 9. Trust Layer
node scripts/seed-trust-exchange.mjs     # trust profile, docs, badges, questionnaire
node scripts/seed-benchmarking.mjs       # governance benchmark snapshot + scores
node scripts/seed-integration-hub.mjs    # 5 connected integrations + sync history
node scripts/seed-trust-network.mjs      # profile views, network activity, followers

# 10. Advanced Modules
node scripts/seed-executive-reporting.mjs   # 10 KPIs, 5 snapshots, 3 reports, 2 schedules, 9 forecasts
node scripts/seed-ai-governance.mjs         # 8 AI systems, 5 vendors, 10 risks, 6 controls, 4 incidents
node scripts/seed-auditor-collaboration.mjs # 3 auditor orgs, 8 external users, 4 audit rooms, 12 evidence requests, 8 findings

# 11. Trust API Platform™
node scripts/apply-sql.mjs supabase/migrations/0027_trust_api_platform.sql
node scripts/seed-trust-api-platform.mjs    # 3 API clients, 3 tap_ API keys (bcrypt), subscriptions, 3 webhooks, 30-day usage

# 12. Optional: E2E test user
node scripts/seed-e2e.mjs               # E2E test user + workspace
```

---

## Script Reference

### Infrastructure

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-templates.mjs` | 7 default vendor type templates (SOC 2, ISO 27001, HIPAA, PCI DSS, DPDP, SOX, Custom) | ✅ |
| `seed-billing-plans.mjs` | Starter / Growth / Enterprise plan definitions; `--assign-all` assigns Growth to all orgs | ✅ |

### Vendor Governance (Module 1)

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-demo.mjs` | 15 realistic Indian B2B vendors (Infosys, Razorpay, HDFC, etc.) + 67 documents + assessments + reviews | ✅ |
| `seed-vendor-extras.mjs` | Additional vendor metadata, portal tokens for magic-link access | ✅ |
| `seed-portal-tokens.mjs` | Vendor self-service portal access tokens | ✅ |

### Compliance (Module 2)

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-compliance-frameworks.mjs` | 5 compliance frameworks + 174 controls (ISO 27001 × 93, SOC 2 × 33, DPDP × 18, PCI DSS × 12, HIPAA × 18) | ✅ |
| `seed-compliance-demo.mjs` | Control statuses, 104 evidence mappings, 8 policies, 107 open gaps, readiness scores | ✅ |

### Settings (Module 3)

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-data-governance.mjs` | Backfills doc storage metadata, `org_settings`, `login_history` events, 25 audit log entries | ✅ |

### Audit Management (Module 4)

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-audits.mjs` | Sample audits (ISO 27001, SOC 2, DPDP), program checklist items, findings by severity, CAPAs | ✅ |

### Risk Lens™ (Module 5)

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-risk-lens.mjs` | 20 risks across all 13 categories, 25 treatment actions, 8 review records, vendor/control/framework links | ✅ |

### Control Center™ (Module 6)

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-control-tests.mjs` | Test records for existing controls (pass/fail/partial), health score updates | ✅ |

### Trust Intelligence™ (Module 7)

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-governance-snapshots.mjs` | 90-day governance snapshot history for Trends sparklines + Org Trust Score™ timeline | ✅ |

### Trust Score™

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-trust-scores.mjs` | Trust Score™ computed + stored for all 15 active vendors (19 scored, HDFC 95 → Yotta 44) | ✅ |

### Policy Governance™ (Module 10)

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-policy-governance.mjs` | Policy review cycles, attestations by team members, policy-control mappings | ✅ |

### DPDP Privacy™ (Module 11)

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-dpdp-privacy.mjs` | Data assets inventory, consent records, DSR requests, retention policies, privacy assessments | ✅ |

### Contract Governance™ (Module 12)

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-contracts.mjs` | 8 sample contracts (MSA, SaaS, NDA, DPA), clauses, obligations, renewal dates | ✅ |

### Issue & Remediation Hub™ (Module 13)

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-issues.mjs` | 12 issues across severities, tasks, comments, exceptions, escalations, SLA tracking | ✅ |

### Workflow Studio™ (Module 14)

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-workflows.mjs` | Workflow templates (vendor onboarding, evidence review, risk escalation) + sample runs | ✅ |

### Third-Party Risk Exchange™ (Module 15)

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-trust-exchange.mjs` | 1 published trust profile · 5 documents (ISO, SOC 2, pentest, DPDP, cyber insurance) · 4 trust badges · 1 global questionnaire + answers | ✅ |

### Governance Benchmarking™ (Module 16)

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-benchmarking.mjs` | Benchmark snapshot + 10 category scores + 6-month trends. Requires prior module seeds for accurate scores. | ✅ |

### Integration Hub™ (Module 17A)

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-integration-hub.mjs` | 5 connected integrations (Entra ID, AWS, GitHub, CrowdStrike, Slack) · sync history · governance events · webhooks | ✅ |

### Trust Network™ (Module 18)

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-trust-network.mjs` | 47 anonymous profile views (30-day window) · 12 Trust Network™ activity milestones · 1 network follower (if 2nd org exists) · ensures profile is published with score 92 | ✅ |

### Executive Reporting & Analytics™ (Module 19)

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-executive-reporting.mjs` | 10 KPIs + 5 governance snapshots + 3 board reports + 2 schedules + 9 forecasts (3 metrics × 3 horizons) | ✅ |

### AI Governance™ (Module 20)

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-ai-governance.mjs` | 8 AI systems · 5 AI vendors · 10 AI risks · 6 controls · 4 policies · 4 incidents · 6 compliance records | ✅ |

### Auditor Collaboration™ (Module 21)

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-auditor-collaboration.mjs` | 3 auditor organisations (Deloitte, KPMG, Nishith Desai) · 8 external users (ISO, SOC 2, DPDP, AI Governance auditors) · 4 audit rooms (ISO 27001, SOC 2 Type II, DPDP, AI Governance) · 12 evidence requests · 8 external findings · 4 assessment projects · 5 audit reviews · 7 room documents · 20 room activities | ✅ |

### Trust API Platform™ (Module 22)

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-trust-api-platform.mjs` | 3 API clients (Procurement Portal, SAP Ariba Integration, Vendor Risk Dashboard) · 3 `tap_` API keys (bcrypt-hashed, plan-specific) · subscriptions to first 3 API products · 3 webhooks (Procurement Sync, Risk Alerts, Compliance Monitor) · ~700 usage records (30-day spread across 5 endpoints) · 5 tap_audit_events | ✅ |

### Testing

| Script | What it seeds | Idempotent |
|---|---|---|
| `seed-e2e.mjs` | E2E test user (`e2e@lekhaos.test` / `E2ETest123!`) + isolated E2E workspace | ✅ |

---

## Quick Demo Reset

To reseed just the Trust Layer modules (no DB wipe):

```bash
node scripts/seed-trust-exchange.mjs
node scripts/seed-benchmarking.mjs
node scripts/seed-integration-hub.mjs
node scripts/seed-trust-network.mjs
```

---

## Data Volumes (after full seed)

| Entity | Count |
|---|---|
| Vendors | 15 active + 0 inactive |
| Vendor documents | ~67 |
| Compliance frameworks | 5 |
| Compliance controls | 174 |
| Evidence items | ~50 |
| Open gaps | ~107 |
| Policies | 8 |
| Audit records | ~5 |
| Risks | 20 |
| Risk treatments | 25 |
| Contracts | 8 |
| Issues | 12 |
| Trust documents | 5 |
| Trust badges | 4 |
| Profile views (30d) | 47 |
| Trust activity events | ~15 |
| Benchmark snapshots | 1 (+ 6-month trends) |
| Connected integrations | 5 |
| Governance snapshots | 90 |
| AI systems | 8 |
| AI risks | 10 |
| AI incidents | 4 |
| Auditor organisations | 3 |
| External users | 8 |
| Audit rooms | 4 |
| Evidence requests | 12 |
| External findings | 8 |
| Assessment projects | 4 |
