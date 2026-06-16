# AUDT — Claude Code Reference

> **End-to-end project brief for any AI session. Read this first.**
> Rebranded from Lekha OS → AUDT on 2026-06-07. Domain: audt.tech.

---

## 1. Product Brief

**AUDT** is the AI-Native Trust, Risk & Compliance Platform — the Governance OS for modern organizations.
Replaces spreadsheets and disconnected tools with a single AI-native platform for vendor governance, compliance, audits, risk and board governance.

- **Brand:** AUDT
- **Tagline:** Governance Built on Proof.
- **Category:** AI-Native Trust, Risk & Compliance Platform (Governance OS)
- **Positioning:** Category-defining OS — not a point solution
- **Modules shipped:** Vendor Hub™ · Evidence Vault™ (Compliance) · Settings & Org Management · Data Governance (Phase 1) · Audit Management · Risk Lens™ · Trust Score™ · Control Center™ · Trust Intelligence™ · Governance Trends™ · Continuous Monitoring™ · Trust Graph™ · Policy Governance™ · DPDP Privacy™ · Contract Governance™ · Issue & Remediation Hub™ · Workflow Studio™ · Third-Party Risk Exchange™ · Governance Benchmarking™ · Integration Hub™ · Trust Network™ · Executive Reporting & Analytics™ · AI Governance™ · Auditor Collaboration™ · Trust API Platform™ · Trust Verification Authority™ · Continuous Compliance™ · Governance Agent Framework™ · Regulatory Intelligence™ · Asset Intelligence™ · **Security Command Center™**
- **Total tables:** 259 (238 previous + 21 Security Command Center™ tables from migration 0033)
- **Target customers:** SaaS, Fintech, Healthcare, Manufacturing, IT Services
- **Live:** https://audt.tech (DNS propagating) + https://lekha-os.vercel.app (always works)
- **GitHub:** https://github.com/SandyRepo29/lekha-os (private)
- **Local:** `C:\Users\sandy\OneDrive\Desktop\LekhaOS`

### Product Naming (AUDT brand)
| Generic | AUDT Name |
|---|---|
| Vendor Management | Vendor Hub™ |
| Evidence Repository | Evidence Vault™ |
| Risk Engine | Risk Lens™ |
| AI Assistant | Governance Copilot™ |
| Controls | Control Center™ |
| Vendor Rating | Trust Score™ |
| Governance Graph | Trust Graph™ |
| Intelligence Layer | Trust Intelligence™ |

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Hosting | Vercel (Mumbai `bom1`) + Supabase (`ap-south-1`) — full India data residency |
| Database | Supabase Postgres + Row-Level Security |
| ORM | Drizzle — lazy init via Proxy in `lib/db/index.ts` |
| Auth | Supabase Auth + org-based RBAC (7 roles) |
| Storage | Supabase Storage — `vendor-documents` (legacy) + `compliance-documents` (new) buckets, org-scoped RLS, tenant-prefixed paths |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| Email | Resend — expiry alerts + weekly digests (AI-written) |
| PDF | `@react-pdf/renderer` |
| Security | AES-256-GCM (Node.js `crypto`) · bcryptjs |
| Testing | Vitest 4 + RTL 16 + Playwright 1.60 |
| UI | Tailwind v4 · dark glassmorphism · deep indigo/purple/electric-blue |

---

## 3. Architecture — Layered Modular Monolith

```
Browser / API client
        │
   app/                     ← TRANSPORT: pages, server actions, REST handlers
        │
   lib/auth/                ← AUTH: requireUser() session | validateApiKey() Bearer
        │
   lib/services/            ← BUSINESS LOGIC: domain rules, DomainError, audit logging
        │              │
   lib/repositories/  lib/providers/   ← DATA ACCESS (Drizzle) | INFRASTRUCTURE ADAPTERS
        │                    │
   lib/db/ (Postgres)    Supabase / Gemini / Crypto / Storage / Rate limit
```

### Architecture rules that must not be broken

- Business logic lives ONLY in `lib/services/*` — never in server actions or components
- Services have zero `next/*` imports — they are framework-agnostic TypeScript
- Services throw `DomainError` for validation failures; actions catch and return `{ error }`
- Repositories accept an optional `Executor` so they compose inside `db.transaction()`
- `export const dynamic = "force-dynamic"` required on all authenticated pages
- `lib/db/index.ts` uses a Proxy for lazy init — **do not revert to top-level postgres() call**
- PDF route handlers: use `await import("@react-pdf/renderer")` (dynamic ESM, NOT require); wrap buffer as `new Uint8Array(buffer)`
- **Provider rule:** External SDKs (`@supabase/supabase-js`, `@google/genai`) are imported ONLY inside `lib/providers/`. Services import provider interfaces, never SDKs directly.
- **Encryption rule:** Integration configs (third-party API keys, webhooks, passwords) must always pass through `encryptConfig()`/`decryptConfig()` in `integration-repo.ts`. Never store plaintext credentials.

---

## 4. Supabase Sandbox

| Setting | Value |
|---|---|
| Project ref | `gacmazsbzxtwhwsgkuco` |
| Region | ap-south-1 (Mumbai) ✓ |
| Anon key | `sb_publishable_WKP94LJaUHL36tNJexFzRQ_LJPyLvKj` |
| DB password | `@&uR?9u+uz5h#sZ` (URL-encode: `@=%40 &=%26 ?=%3F +=%2B #=%23`) |
| DATABASE_URL | `postgresql://postgres.gacmazsbzxtwhwsgkuco:%40%26uR%3F9u%2Buz5h%23sZ@aws-1-ap-south-1.pooler.supabase.com:6543/postgres` |
| Pooler note | Use `aws-1-ap-south-1.pooler.supabase.com` — direct `db.<ref>.supabase.co` is IPv6-only and fails locally |

**SUPABASE_SERVICE_ROLE_KEY** is still a placeholder — required for team invite functionality.

---

## 5. Database Schema

**218 tables** across 32 migration files (0000–0031 — all applied).

### Vendor Governance tables (15)

| Table | Purpose |
|---|---|
| `organizations` | Tenant boundary (extended: legalName, industry, companySize, website, country, state, timezone, logoUrl) |
| `profiles` | Mirrors auth.users (extended: jobTitle, department, phone, timezone, language) |
| `memberships` | User↔org join with role + department + `is_active` |
| `vendors` | Core vendor registry (25 cols incl. owner, AI fields, checklist score) |
| `vendor_documents` | Documents with AI-extracted fields + `category` enum + storage metadata (filename, content_type, file_size, storage_bucket, storage_provider, uploaded_by, checksum) |
| `vendor_types` | Compliance templates (7 defaults seeded, custom org-specific allowed) |
| `vendor_type_documents` | Required/optional doc types per template |
| `document_requests` | Request workflow (requested→submitted→approved/rejected/expired) |
| `assessments` | Security assessments per vendor, score 0–100, `ai_summary` |
| `assessment_responses` | Per-question answers: yes/no/partial/na |
| `vendor_reviews` | Periodic governance reviews |
| `vendor_portal_tokens` | Magic-link tokens for vendor self-service |
| `notification_preferences` | Per-org notification settings |
| `notification_history` | Email deduplication + audit |
| `audit_logs` | Every meaningful action recorded (with actor profile join for UI) + `ip_address` |

### Data Governance tables (1) — migration 0007

| Table | Purpose |
|---|---|
| `storage_providers` | Registry of storage backends — name, type (platform/customer), isActive, configJson. Phase 1: "supabase/platform" seeded. Future: customer S3, Azure Blob, SharePoint, OneDrive, Google Drive |

### Settings Module tables (6) — migration 0006

| Table | Purpose |
|---|---|
| `organization_settings` | Branding: primaryColor, accentColor, reportFooter, emailSignature |
| `login_history` | Per-user auth events: IP, user agent, location, status |
| `billing_plans` | Plan definitions (Starter/Growth/Enterprise — seeded) |
| `subscriptions` | Active subscription per org (one row, UNIQUE orgId) |
| `api_keys` | API keys: keyPrefix (display), keyHash (bcrypt), permissions, status |
| `integrations` | External provider connections: config stored AES-256-GCM encrypted |

### Compliance Module tables (10) — migration 0005

| Table | Purpose |
|---|---|
| `frameworks` | Compliance frameworks per org (ISO 27001, SOC 2, DPDP, PCI DSS, HIPAA, custom) |
| `controls` | Individual controls within a framework |
| `evidence` | Evidence items — from vendor docs/assessments/reviews or manual |
| `control_evidence_mappings` | Many-to-many: evidence satisfies control |
| `policies` | Org compliance policies with version tracking |
| `policy_versions` | Immutable version snapshots |
| `readiness_scores` | Materialised per-framework score — upserted on change |
| `gap_analysis` | Detected compliance gaps (rule-based + AI) with severity |
| `compliance_reports` | Generated PDF reports + AI narrative payload |
| `ai_compliance_insights` | Cached Gemini outputs |

### Audit Management tables (5) — migration 0008

| Table | Purpose |
|---|---|
| `audits` | Audit registry — name, type, framework_id (nullable), scope, objective, auditor_name, start/end dates, status, ai_summary, created_by |
| `audit_programs` | Per-audit checklist items linked to controls — status: pending/reviewed/passed/failed |
| `audit_findings` | Findings per audit — finding_severity (critical/high/medium/low), finding_status (open/remediating/closed/accepted), linked to control + evidence |
| `corrective_actions` | CAPAs per finding — owner, due_date, status (open/in_progress/completed/overdue), completion_notes, completed_at |
| `audit_reports` | Immutable report generation log — storage_path, generated_by, generated_at |

### Risk Lens™ tables (9) — migration 0009

| Table | Purpose |
|---|---|
| `risks` | Risk registry — title, description, category (13 types), status (8 states), source (8 types), impact/likelihood/inherent_score/residual_score, treatment_strategy, owner_id, target_date, next_review_date, source_finding_id, source_gap_id |
| `risk_reviews` | Periodic review records per risk — review_date, outcome (no_change/score_updated/status_changed/closed), notes, reviewer_id, previous/new score+status |
| `risk_treatments` | Treatment action items per risk — action, target_date, status (open/in_progress/completed/cancelled), progress_percent, description, owner_id, completed_at |
| `risk_vendors` | Junction: risk ↔ vendor |
| `risk_controls` | Junction: risk ↔ compliance control |
| `risk_findings` | Junction: risk ↔ audit finding |
| `risk_policies` | Junction: risk ↔ compliance policy |
| `risk_frameworks` | Junction: risk ↔ compliance framework |
| `risk_evidence` | Junction: risk ↔ evidence item |

**Membership roles (7):** `owner` · `admin` · `member` · `viewer` · `compliance_manager` · `security_manager` · `procurement_manager`

**Settings enums:** `industry_type` · `company_size_range` · `api_key_status` · `api_key_permission` · `integration_provider` · `integration_status`

**Compliance enums:** `framework_status` · `control_status` · `control_priority` · `evidence_status` · `evidence_source` · `policy_status`

**Audit enums:** `audit_type` · `audit_status` · `audit_program_status` · `finding_severity` · `finding_status` · `corrective_action_status`

**Risk Lens enums:** `riskCategory` · `riskStatus` · `riskTreatmentStrategy` · `riskSource` · `riskTreatmentStatus`
- `riskCategory`: operational · cyber_security · compliance · vendor · privacy · financial · legal · strategic · technology · business_continuity · third_party · regulatory · custom
- `riskStatus`: identified · under_assessment · open · mitigating · accepted · transferred · closed · archived
- `riskTreatmentStrategy`: mitigate · accept · transfer · avoid · monitor
- `riskSource`: manual · vendor · audit_finding · compliance_gap · control_failure · policy_exception · ai_generated · api
- `riskTreatmentStatus`: open · in_progress · completed · cancelled

### Control Center™ tables (3) — migration 0011

| Table | Purpose |
|---|---|
| `control_tests` | Test records per control — test_date, tester, method, result (passed/failed/partially_effective/exception/not_tested), evidence_ref, comments |
| `control_frameworks` | M2M junction: control ↔ framework (for cross-framework mapping beyond the primary frameworkId FK) |
| `control_vendors` | M2M junction: control ↔ vendor (controls linked to applicable vendors) |

**Control Center™ enums (4):** `control_type` · `control_frequency` · `automation_level` · `control_test_result`
- `control_type`: preventive · detective · corrective · compensating · administrative · technical · physical · hybrid
- `control_frequency`: continuous · daily · weekly · monthly · quarterly · semi_annual · annual · ad_hoc
- `automation_level`: manual · semi_automated · automated · ai_assisted
- `control_test_result`: passed · failed · partially_effective · exception · not_tested

**Controls table extended columns (migration 0011):** `objective` · `control_type` · `owner_id` · `frequency` · `automation_level` · `health_score` · `effectiveness_score` · `last_tested` · `next_test_date` · `next_review_date`

**CRITICAL — `controls.framework_id` is now nullable** (migration 0011 drops NOT NULL). Existing 174 compliance controls retain their frameworkId. New standalone controls created via Control Center™ can have `frameworkId = null`. All compliance service code that calls `recomputeReadiness()` is guarded with `if (control.frameworkId)`.

**CRITICAL — Drizzle column naming for risk tables:** Use `columnEnum("status")` pattern (same as compliance module), NOT `columnEnum("risk_treatment_status")`. The DB column name IS the first argument. Mismatch causes silent query failures.

### Regulatory Intelligence™ tables (14) — migration 0031

| Table | Purpose |
|---|---|
| `regulations` | Regulation registry — name, jurisdiction, category, status, effectiveDate, deadlineDate. `organization_id = NULL` for 18 built-in global regulations (returned to all orgs) |
| `regulation_versions` | Version history per regulation — versionNumber, summary, changedAt |
| `regulatory_changes` | Amendments to regulations — title, description, severity (critical/high/medium/low), status workflow (new→under_review→assessed→actioned→closed), impactedAreas |
| `obligations` | Compliance obligations extracted from regulations — priority (critical/high/medium/low), status (not_started→in_progress→implemented→validated), owner, dueDate, implementationNotes |
| `obligation_mappings` | Junction: obligation ↔ control (maps obligations to AUDT controls) |
| `regulatory_assessments` | Per-change impact assessments — title, impactLevel, summary, assessedBy, assessedAt |
| `regulatory_impacts` | Detailed impact records per assessment — category, description, affectedAreas |
| `regulatory_reviews` | Periodic regulation review log — reviewer, outcome, notes, nextReviewDate |
| `regulatory_alerts` | Auto-generated alerts for high/critical changes — severity, status (open/acknowledged/resolved), dueDate |
| `regulatory_watchlists` | Org-specific regulation watchlists — name, description, linked regulations |
| `regulatory_sources` | Registry of regulatory bodies — name, type (regulator/standards_body/government/international), region, url. 6 built-in sources seeded |
| `regulatory_agents` | Agent configuration per regulation (Drizzle export: `regulatoryAgentConfig`) — enabled, schedule, rules JSON |
| `regulatory_tasks` | Action tasks arising from regulatory obligations — title, priority, status, assignedTo, dueDate |
| `regulatory_updates` | Feed of regulatory news/updates — title, summary, source, publishedAt, regulationId |

**RLS:** All 218 tables enabled. Helpers: `is_org_member()`, `has_org_role()`. Risk junction tables validate org via `EXISTS (SELECT 1 FROM risks WHERE id = risk_id AND is_org_member(organization_id))`. Control junction tables validate org via `EXISTS (SELECT 1 FROM controls c JOIN memberships m ON m.organization_id = c.organization_id WHERE c.id = control_id AND m.user_id = auth.uid())`.

**First-time setup on a fresh DB:**
```bash
npm run db:migrate
node scripts/apply-sql.mjs supabase/rls.sql
node scripts/apply-sql.mjs supabase/storage.sql
node scripts/apply-sql.mjs supabase/rls-risk-lens.sql
node scripts/apply-sql.mjs supabase/migrations/0010_trust_score.sql
node scripts/apply-sql.mjs supabase/migrations/0011_control_center.sql
node scripts/apply-sql.mjs supabase/migrations/0012_trust_intelligence.sql
node scripts/seed-templates.mjs
node scripts/seed-billing-plans.mjs --assign-all
node scripts/seed-demo.mjs                          # 19 realistic vendors + 67 docs
node scripts/seed-compliance-frameworks.mjs         # 5 frameworks + 174 controls
node scripts/seed-compliance-demo.mjs               # evidence, policies, gaps, readiness scores
node scripts/seed-risk-lens.mjs                     # 20 risks + 25 treatments + 8 reviews
node scripts/seed-trust-scores.mjs                  # Trust Score™ for all active vendors
node scripts/seed-audits.mjs                        # 5 audits · 15 findings · 9 CAPAs
node scripts/seed-control-tests.mjs                 # 54 test records · health scores for 30 controls
node scripts/seed-governance-snapshots.mjs          # 14-day Org Trust Score history (upward trend)
node scripts/seed-policy-governance.mjs             # policy reviews · attestations · control links
node scripts/seed-dpdp-privacy.mjs                  # data assets · consent records · privacy requests
node scripts/seed-contracts.mjs                     # contracts · clauses · obligations
node scripts/seed-issues.mjs                        # issues · tasks · escalations · SLAs
node scripts/seed-workflows.mjs                     # workflow definitions + runs
node scripts/seed-vendor-extras.mjs                 # extra assessments · reviews · doc requests
node scripts/seed-trust-exchange.mjs                # trust profile · documents · badges · questionnaires
node scripts/seed-trust-network.mjs                 # network profile views · followers · activity feed
node scripts/seed-benchmarking.mjs                  # benchmark snapshot · 10 category scores · 6-month trends
node scripts/seed-integration-hub.mjs               # 5 connected integrations · sync history · events
node scripts/seed-executive-reporting.mjs           # 10 KPIs · 5 snapshots · 3 reports · 2 schedules · 9 forecasts
node scripts/seed-ai-governance.mjs                 # 8 AI systems · 5 vendors · 10 risks · 6 controls · 4 incidents
node scripts/seed-auditor-collaboration.mjs         # 3 auditor orgs · 8 external users · 4 audit rooms · 12 evidence requests
node scripts/seed-trust-api-platform.mjs            # 3 clients · 3 API keys · 3 webhooks · 30-day usage data
node scripts/seed-trust-verification.mjs            # AUDT Verified™ (cert+badge) · Privacy Ready™ · Enterprise Ready™ (pending)
node scripts/seed-continuous-compliance.mjs         # 3 access reviews · 3 attestations · 3 training campaigns · 5 signals · 1 health score · 5 readiness snapshots · 3 automation rules
node scripts/seed-governance-agents.mjs             # 5 agents · runs · observations · recommendations · actions · metrics
node scripts/seed-regulatory-intelligence.mjs       # 8 changes · 12 obligations · 3 assessments · 5 alerts · 5 watchlists · 8 tasks · 4 updates
node scripts/seed-asset-intelligence.mjs            # 30 assets · 4 alerts · 6 relationships (targets most-active org)
node scripts/seed-security-command-center.mjs       # MFA settings · SSO provider · 5 sessions · 4 IP rules · 3 shares · 45 prompt logs · monitoring assets + alerts · trust center config
node scripts/check-all-modules.mjs                  # verify all module table counts
```

---

## 6. Features Implemented

### Module 9 — Trust Graph™ ✅ Complete (2026-06-09)

Governance knowledge graph. 2 new tables: `graph_nodes` + `graph_edges`. New tab in Trust Intelligence™ sub-nav.

| Feature | Detail |
|---|---|
| **Graph Explorer** | Force-directed SVG visualization · filter by entity type · zoom/pan · node click |
| **Root Cause Analysis™** | Trace upstream causes for any node |
| **Impact Analysis™** | Trace downstream effects from any node |
| **Governance Reasoner™** | AI NL chat — graph-aware reasoning about dependencies and trust paths |
| **REST API** | 6 endpoints: graph overview, nodes, edges, entity detail, root-cause, impact-analysis |

- Services: `lib/services/trust-graph/` (graph-builder, graph-service, ai-graph-service)
- Repo: `lib/repositories/trust-graph-repo.ts`
- Actions: `lib/trust-graph/actions.ts`
- Migration: `supabase/migrations/0014_trust_graph.sql`
- Graph is built on demand via "Rebuild Graph" button (`buildGraph(orgId)`)
- Entity types: vendor · evidence · control · risk · audit · finding · policy · framework
- 15 relationship types tracked

### Module 8 — Governance Trends™ + Continuous Monitoring™ ✅ Complete (2026-06-09)

2 new tabs added to Trust Intelligence™ sub-nav: **Trends** + **Monitoring**.

| Tab | Features |
|---|---|
| **Trends** | 90-day sparkline grid for 6 metrics · change % vs period start · 30-row score history table |
| **Monitoring** | Alert counts strip (open/critical/high/resolved) · Open alert list with resolve buttons · Recently resolved alerts · Run Monitoring™ button |

**Monitoring Engine™** — 7 automated rules: expired evidence · expiring evidence · critical control health · open critical risks · unresolved critical findings · overdue CAPAs · vendor trust critical

- Services: `lib/services/governance-trends/` (trends-service, monitoring-service, ai-trends-service)
- Repo: `lib/repositories/governance-alerts-repo.ts`
- Cron: `GET /api/cron/governance-snapshot`
- REST API: `GET /api/v1/trends/overview` · `GET /api/v1/monitoring/alerts`
- Migration: `supabase/migrations/0013_governance_trends.sql` ✅ APPLIED
- New tables: `governance_alerts` + `evidence_coverage_score` column on `governance_snapshots`

### Module 7 — Trust Intelligence™ ✅ Complete (2026-06-07)

7-tab sub-nav at `/trust-intelligence/*`. Executive governance command center — aggregates all modules into Organizational Trust Score™.

| Tab | Features |
|---|---|
| **Overview** | Org Trust Score™ ring + component bars · Metrics grid · Trust Drivers™ · Trust Detractors™ · Governance Timeline |
| **Vendor Trust** | Avg trust · Top 10 / Bottom 10 trusted vendors · Full scored list |
| **Risk Insights** | Active/critical/high/medium counts · Top critical risks · Category distribution |
| **Control Health** | Avg health · Healthy/Weak counts · Weakest controls list |
| **Compliance** | Framework readiness bars · Avg readiness |
| **Recommendations** | Prioritized actions (high/medium/low) · Impact + effort · Deep-links to source module |
| **Executive View** | Org Trust ring · AI Governance Summary (cached 24h) · Drivers/Detractors · Open actions · Governance Copilot™ chat |

**Organizational Trust Score™** — 5-component pure engine: Vendor Trust (25%) · Risk Posture (25%) · Control Health (20%) · Audit Readiness (15%) · Compliance Coverage (15%)

- Pure engine: `lib/services/org-trust-score.ts`
- Service: `lib/services/trust-intelligence/trust-intelligence-service.ts`
- AI service: `lib/services/trust-intelligence/ai-trust-intelligence-service.ts`
- Repo: `lib/repositories/trust-intelligence-repo.ts`
- Actions: `lib/trust-intelligence/actions.ts`
- Migration: `supabase/migrations/0012_trust_intelligence.sql`
- REST API: `GET /api/v1/trust-intelligence/overview` · `GET|POST /api/v1/trust-intelligence/org-score` · `GET /api/v1/trust-intelligence/recommendations`

### Module 6 — Control Center™ ✅ Complete (2026-06-07)

5-tab sub-nav at `/controls/*`. Central governance layer with Control Health™ scoring.

| Tab | Features |
|---|---|
| **Dashboard** | Metrics: total / healthy (≥80) / weak (<60) / overdue tests · avg health · implementation coverage · weakest controls list · category breakdown |
| **Control Library** | Filterable list (search + status + category); create control; detail page with Health™ breakdown bars, strengths/concerns, test history |
| **Testing** | Org-wide test log — all test records with pass/fail stats; per-control add test inline form |
| **Reports** | Control library CSV · Tests CSV download links |
| **AI Advisor** | AI Executive Summary (board narrative, cached); AI Gap Detection (top 5 gaps with actions); live NL chat |

**Control Health™** — 6-component pure scoring engine:

| Component | Weight | Source |
|---|---|---|
| **Evidence** | 30% | Approved evidence linked to control |
| **Testing** | 25% | Pass rate of tests in last 12 months |
| **Audit** | 15% | Open vs closed findings per control |
| **Policy** | 10% | Approved org policies (proxy) |
| **Freshness** | 10% | Days since last review (100 if ≤30d → 10 if >365d) |
| **Risk Reduction** | 10% | Mitigating/accepted/closed linked risks ratio |

- Pure engine: `lib/services/control-health.ts` — `computeControlHealth(inputs)` → ControlHealthBreakdown
- Service: `lib/services/control-center/control-center-service.ts` — CRUD + computeAndSaveHealth()
- AI service: `lib/services/control-center/ai-control-service.ts` — narrative, executive summary, gap detection, chat
- Repo: `lib/repositories/control-center-repo.ts` — all queries, getHealthInputs(), test CRUD, junction helpers
- Actions: `lib/control-center/actions.ts` — all server actions
- Migration: `supabase/migrations/0011_control_center.sql`
- Health levels: Exceptional (95–100) · Healthy (90–94) · Strong (80–89) · Moderate (70–79) · Needs Attention (60–69) · Critical (0–59)

### Trust Score™ ✅ Complete (2026-06-07)

6-component governance signal scored 0–100 per vendor. Displayed on vendor detail, computed on page load, recalculable on demand.

| Component | Weight | Source |
|---|---|---|
| **Evidence** | 25% | Doc counts, expiry, required missing |
| **Compliance** | 20% | `vendor.complianceScore` |
| **Risk** | 20% | Risk Lens™ linked risks (active/critical/high) |
| **Assessment** | 15% | Latest security assessment score |
| **Operational** | 10% | Reviews + document request turnaround |
| **Freshness** | 10% | Days since last review + assessment age |

- Pure engine: `lib/services/trust-score.ts` — `computeTrustScore(inputs)` → breakdown + level + strengths/concerns/recommendations
- Service: `lib/services/trust-score-service.ts` — gathers inputs, computes, persists, generates AI narrative via Gemini
- Repo: `lib/repositories/trust-score-repo.ts` — `saveTrustScore()`, `getTrustHistory()`, `getOrgTrustMetrics()`
- History table: `vendor_trust_history` — daily snapshots with all 6 component scores + trigger_event
- UI: `TrustScoreWidget` (full breakdown, strengths/concerns, AI narrative) — rendered inside the **Compliance tab** on vendor detail (not above the tabs); `TrustScoreBadge` (inline level chip in header badges row)
- API: `GET /api/v1/vendors/[id]/trust-score` — score, components, history, narrative
- Seed: `node scripts/seed-trust-scores.mjs` — scores all active vendors
- Migration: `supabase/migrations/0010_trust_score.sql`
- Trust levels: Exceptional (95–100) · Trusted (90–94) · Strong (80–89) · Moderate (70–79) · Needs Attention (60–69) · High Concern (0–59)

### Module 5 — Risk Lens™ ✅ Complete (2026-06-07)

5-tab sub-nav at `/risks/*`. Full risk lifecycle: identify → assess → treat → review → AI.

| Tab | Features |
|---|---|
| **Dashboard** | Metrics: total / open / mitigating / accepted · critical risks · overdue reviews · 5×5 heat map · category breakdown · top 5 risks by score |
| **Risk Register** | Filterable list (status + category); create risk; detail page with treatments + reviews + AI narrative; status transitions; delete |
| **Treatments** | Org-wide treatment tracker with due-date highlighting (overdue/due-soon); per-risk inline add; mark complete |
| **Reports** | Risks CSV · Treatments CSV download links |
| **AI Risk Officer** | AI Executive Report (board narrative, cached); live NL chat ("Which risks are critical?", "Summarise our risk posture") |

### Module 4 — Audit Management ✅ Complete (2026-06-06)

6-tab sub-nav at `/audits/*`. Full audit lifecycle: plan → execute → findings → CAPAs → reports → AI.

| Tab | Features |
|---|---|
| **Dashboard** | Metrics: total / planned / active / completed / overdue audits · open findings · critical findings · CAPAs due soon |
| **Audits** | Filterable list (status + type); create audit form; detail page with program checklist + AI summary panel; Start/Complete/Cancel actions |
| **Findings** | Org-wide findings (filter by severity + status); per-audit findings list; close finding; AI Finding Generator (observation → structured finding) |
| **CAPAs** | Org-wide CAPA tracker with due-date highlighting; per-audit CAPA list; complete CAPA; AI CAPA Suggestions (3 per finding) |
| **Reports** | Per-audit: Full Report PDF · Findings PDF · CAPAs PDF · Findings CSV · CAPAs CSV |
| **AI Auditor** | AI Executive Report (board narrative, cached); live NL chat ("Which CAPAs are overdue?", "Summarize my audit posture") |

**UI polish (2026-06-13):** Dashboard heading "Audit Management™"; AuditStat upgraded with border-l-2 accent bar + tinted background; dashboard metric strip rebuilt using AuditStat components (was raw Card blocks); AI Summary panel surfaced above program checklist on audit detail page; 4 dead icon imports removed.

### Module 3 — Settings & Organization Management ✅ Complete

8-tab settings layout at `/settings/*` mirroring the compliance sub-nav pattern.

| Tab | Route | Features |
|---|---|---|
| **Profile** | `/settings` | Full name, job title, department, phone, timezone, language; notification preferences merged inline |
| **Organization** | `/settings/organization` | Legal name, industry, company size, website, country, state, timezone; branding (colors, report footer, email signature) |
| **Team** | `/settings/team` | Analytics strip; invite; 7 roles in selector; department per member; Transfer Ownership; Resend Invite |
| **Security** | `/settings/security` | Password change with strength indicator; MFA panel (UI ready — awaits Supabase MFA enable); login history table |
| **Audit Logs** | `/settings/audit-logs` | Filterable table (user/module/date/search); severity badges; pagination; CSV export |
| **Billing** | `/settings/billing` | Plan card; usage meters (users/vendors/storage vs plan limits); upgrade CTA; invoice history placeholder |
| **API Keys** | `/settings/api-keys` | Create/rotate/revoke; key shown once in modal with copy/reveal; bcrypt hash stored |
| **Integrations** | `/settings/integrations` | 10 providers grouped (Email/Communication/Storage); connect modal with per-provider fields; config encrypted at rest |
| **Data Governance** | `/settings/data-governance` | Stats dashboard; data residency (Mumbai/DPDP badge); retention policy; AI transparency (no-training guarantee); security checklist; Export Tenant Data (ZIP of CSVs); Request Data Deletion workflow |

### Module 2 — Compliance Management ✅ Complete (All 8 Phases)

All 7 sub-nav tabs live: Dashboard · Frameworks · Evidence · Policies · Gaps · Reports · AI Officer

- **DB:** 10 tables, 6 enums, RLS, live in Supabase Mumbai
- **Data layer:** 7 repos, 7 services, pure `computeReadiness()` scoring
- **Evidence bridge:** vendor docs/assessments/reviews auto-import as compliance evidence
- **AI Officer:** Gemini framework summaries, readiness explanations, gap narratives, executive summary, live NL chat
- **Reports:** 2 PDFs (framework + executive AI-narrated) + 3 CSVs (controls, evidence, gaps)
- **174 standard controls:** ISO 27001 (93) · SOC 2 (33) · DPDP (18) · PCI DSS (12) · HIPAA (18)
- **Demo data:** 107 open gaps · 104 evidence mappings · 8 policies · realistic readiness scores

**UI polish (2026-06-13):** Dashboard heading "Evidence Vault™"; ComplianceStat upgraded with border-l-2 left accent bar + tinted background (danger/warn/good); Frameworks page: new 4-card stat strip (Total / Certified / In Progress / Avg Readiness); layout sub-nav border-b separator added; Reports page hardcoded `text-indigo-400` replaced with `var(--color-blue)`.

### Module 1 — Vendor Governance ✅ Complete (Launch-Ready)

25 features including: vendor registry, document management (AI extraction v2 — 10 fields), risk engine, security assessments, NL search (Gemini), executive PDFs, vendor portal (magic link), team RBAC, email cron jobs (expiry alerts + AI weekly digest).

**UI polish (2026-06-13):** Page heading "Vendor Hub™"; export buttons grouped in compact pill strip; MiniStat cards with border-l-2 accent bar; TrustScoreBadge inline in header badges row (redundant standalone score box removed); TrustScoreWidget moved into Compliance tab on vendor detail (was between header and tabs); vendor-filters.tsx now uses shared `lib/ui/colors` + `lib/ui-maps` (4 duplicate local helper functions removed); emoji toggle buttons replaced with icon components.

---

## 7. App Routes

```
/                                            Marketing landing page
/login  /signup  /onboarding                Auth flow
/dashboard                                   Main dashboard

--- Vendor Governance ---
/vendors                                     List (?q=, ?nlq=, ?risk=, ?expiring=1, ?page=N)
/vendors/new                                 Add vendor
/vendors/[id]                                Detail (4-tab: Documents/Compliance/Risk/Reviews)
/vendors/[id]/edit
/vendors/[id]/assessment
/vendors/[id]/audit-package
/vendors/[id]/executive-report
/vendors/export
/reports/compliance  /reports/expiry

--- Compliance Module ---
/compliance                                  Dashboard
/compliance/frameworks                       Framework list
/compliance/frameworks/new
/compliance/frameworks/[id]                  Detail — readiness, AI panels, controls, gaps
/compliance/frameworks/[id]/controls/new
/compliance/evidence  /compliance/evidence/new  /compliance/evidence/[id]
/compliance/policies  /compliance/policies/new  /compliance/policies/[id]
/compliance/gaps
/compliance/reports
/compliance/ai                               AI Compliance Officer
/reports/compliance/framework/[id]           Per-framework PDF
/reports/compliance/executive                Executive compliance PDF
/reports/compliance/controls|evidence|gaps   CSV exports

--- Settings (9-tab sub-nav) ---
/settings                                    Profile + notifications
/settings/organization                       Org profile + branding
/settings/team                               Team management
/settings/security                           Password + MFA + login history
/settings/audit-logs                         Filterable org-wide audit log + CSV export
/settings/billing                            Plan overview + usage meters
/settings/api-keys                           API key management
/settings/integrations                       Integration provider cards
/settings/data-governance                    Data governance dashboard (Phase 1)
/settings/notifications                      (redirected to /settings — notifications merged into Profile tab)

--- Audit Management ---
/audits                                      Dashboard (metrics)
/audits/list                                 Filterable audit list
/audits/new                                  Create audit
/audits/[id]                                 Audit detail (program checklist, AI summary, findings)
/audits/[id]/edit
/audits/[id]/findings                        Findings per audit
/audits/[id]/findings/new                    Add finding (with AI generator)
/audits/[id]/capas                           CAPAs per audit
/audits/findings                             Org-wide findings (filter by severity/status)
/audits/capas                                Org-wide CAPA tracker
/audits/reports                              Reports listing + download buttons
/audits/ai                                   AI Auditor Assistant (executive report + chat)
/reports/audits/[id]                         Full audit PDF
/reports/audits/[id]/findings                Findings PDF
/reports/audits/[id]/capas                   CAPAs PDF
/reports/audits/[id]/findings/csv            Findings CSV
/reports/audits/[id]/capas/csv               CAPAs CSV

--- Risk Lens™ ---
/risks                                       Dashboard (metrics + heat map)
/risks/list                                  Filterable risk register
/risks/new                                   Create risk
/risks/[id]                                  Risk detail (treatments, reviews, AI narrative)
/risks/[id]/edit                             Edit risk
/risks/treatments                            Org-wide treatment tracker
/risks/reports                               CSV export links
/risks/ai                                    AI Risk Officer (executive report + chat)
/reports/risks/csv                           Risks CSV export
/reports/risks/treatments/csv               Treatments CSV export

--- Control Center™ ---
/controls                                    Dashboard (metrics + weakest controls)
/controls/library                            Filterable control library
/controls/new                                Create control
/controls/[id]                               Control detail (Health™ breakdown, test history)
/controls/[id]/edit                          Edit control
/controls/testing                            Org-wide test log + pass/fail stats
/controls/reports                            CSV export links
/controls/ai                                 AI Control Advisor (executive summary + gap detection + chat)
/api/v1/controls/export/csv                  Control library CSV (session auth)
/api/v1/controls/tests/export/csv            Tests CSV (session auth)

--- Trust Intelligence™ ---
/trust-intelligence                          Overview (Org Trust Score™ ring + metrics + drivers/detractors)
/trust-intelligence/vendors                  Vendor Trust view (avg trust · top 10 / bottom 10 · full list)
/trust-intelligence/risks                    Risk Insights view (counts · critical list · category chart)
/trust-intelligence/controls                 Control Health view (avg health · healthy/weak · weakest list)
/trust-intelligence/compliance               Compliance coverage (per-framework readiness bars)
/trust-intelligence/recommendations          Recommendations Engine™ (prioritized actions + deep-links)
/trust-intelligence/executive               Executive View (AI summary · Governance Copilot™ chat)
/trust-intelligence/trends                  Governance Trends™ (sparklines · change % · score history table)
/trust-intelligence/monitoring              Continuous Monitoring™ (alerts list · resolve · Run Monitoring button)
/trust-intelligence/trust-graph            Trust Graph™ (force-directed SVG graph · root cause · impact analysis · AI chat)

--- Contract Governance™ ---
/contract-governance                        Dashboard (metrics strip + expiring + open obligations)
/contract-governance/library               Filterable contract list + create
/contract-governance/new                   Create contract
/contract-governance/[id]                  Contract detail (dates, score, clauses, obligations, linked entities)
/contract-governance/[id]/edit             Edit contract
/contract-governance/obligations           Org-wide obligation tracker
/contract-governance/renewals              Renewals dashboard sorted by expiry
/contract-governance/ai                    AI Contract Advisor (executive summary + NL chat)
/contract-governance/reports               CSV export links

--- Issue & Remediation Hub™ ---
/issue-hub                                  Dashboard (metrics strip + top open issues)
/issue-hub/list                             Filterable issue registry + create
/issue-hub/new                              Create issue
/issue-hub/[id]                             Issue detail (overview, tasks, comments, exceptions, escalations, history, AI)
/issue-hub/tasks                            Org-wide task tracker
/issue-hub/exceptions                       Exception management (approve/reject)
/issue-hub/reports                          CSV export links
/issue-hub/ai                               AI Advisor™ (executive summary + issue generator + remediation planner + chat)

--- Third-Party Risk Exchange™ ---
/trust-exchange                             Dashboard (metrics strip + activity feed + getting-started checklist)
/trust-exchange/my-profile                 Trust Profile™ editor (display name, industry, visibility, AI summary)
/trust-exchange/documents                  Trust Evidence™ list (add, verify, delete documents)
/trust-exchange/badges                     Trust Badges™ (issue, revoke badges)
/trust-exchange/questionnaires             Questionnaire Exchange™ (answer, track completion)
/trust-exchange/questionnaires/[id]        Single questionnaire answer form
/trust-exchange/directory                  Vendor Trust Directory™ (browse published profiles, filter)
/trust-exchange/ai                         AI Trust Analyst™ (trust summary + document analysis + questionnaire suggestions + chat)

--- Governance Benchmarking™ ---
/benchmarking                             Dashboard (overall score, percentile, maturity level, 10 category scorecards)
/benchmarking/vendors                     Vendor Trust benchmark deep-dive
/benchmarking/risks                       Risk & Controls benchmark (risk posture, control health, audit readiness, issue resolution)
/benchmarking/compliance                  Compliance benchmark (coverage, privacy, contract, workflow automation)
/benchmarking/rankings                    Governance Rankings™ (full ranking table + maturity progress bar)
/benchmarking/ai                          AI Benchmark Analyst™ (executive report + industry insights + improvement planner + chat)
GET /api/v1/benchmarking                  Full benchmark dashboard — snapshot + all category scores + trends
GET /api/v1/benchmarking/trust            Org trust + vendor trust benchmark comparison
GET /api/v1/benchmarking/vendors          Vendor governance benchmark breakdown
POST /api/v1/benchmarking/vendors         Trigger a new benchmark computation (read_write)
GET /api/v1/benchmarking/rankings         Full rankings across all categories + maturity level

--- Integration Hub™ ---
/integration-hub                          Dashboard (metrics strip + connected systems + open events)
/integration-hub/marketplace              Connector Marketplace™ (35+ connectors grouped by category)
/integration-hub/connections              Integration Manager™ (per-connection health, events, sync controls)
/integration-hub/syncs                    Sync Engine™ history (all runs, records, duration, status)
/integration-hub/webhooks                 Webhook Engine™ (inbound + outbound webhook management)
/integration-hub/ai                       AI Integration Advisor™ (health summary + recommendations + chat)
GET /api/v1/integrations                  Connected integrations list (?view=marketplace|dashboard)
GET /api/v1/integrations/syncs            Sync history
GET /api/v1/integrations/health           Connection Health™ metrics

--- REST API (Bearer token) ---
GET /api/v1/vendors                          Paginated vendor list
GET /api/v1/vendors/[id]                     Single vendor
GET /api/v1/vendors/[id]/trust-score         Trust Score™: score, components, history (30 days), narrative
GET /api/v1/compliance/frameworks            All frameworks with readiness
GET /api/v1/compliance/gaps                  Open gaps (?severity=, ?resolved=)
GET /api/v1/audit-logs                       Event stream (?module=, ?from=, ?to=, ?userId=)
GET /api/v1/audits                           Paginated audit list (?status=, ?type=)
POST /api/v1/audits                          Create audit (read_write key)
GET /api/v1/audits/[id]                      Single audit with findings
PUT /api/v1/audits/[id]                      Update audit (read_write key)
DELETE /api/v1/audits/[id]                   Delete audit (read_write key)
GET /api/v1/findings                         Org-wide findings (?severity=, ?status=, ?auditId=)
POST /api/v1/findings                        Create finding (read_write key)
GET /api/v1/capas                            Org-wide CAPAs (?status=, ?findingId=)
POST /api/v1/capas                           Create CAPA (read_write key)
GET /api/v1/risks                            Paginated risk list (?status=, ?category=)
POST /api/v1/risks                           Create risk (read_write key)
GET /api/v1/risks/[id]                       Single risk with treatments + reviews
PUT /api/v1/risks/[id]                       Update risk (read_write key)
DELETE /api/v1/risks/[id]                    Delete risk (read_write key)
GET /api/v1/risk-treatments                  Org-wide treatments (?riskId=, ?status=)
POST /api/v1/risk-treatments                 Create treatment (read_write key)
GET /api/v1/risk-reviews                     Org-wide reviews (?riskId=)
POST /api/v1/risk-reviews                    Create review (read_write key)
GET /api/v1/trust-intelligence/overview      Full dashboard data — all 5 components + metrics
GET /api/v1/trust-intelligence/org-score     Org Trust Score™ + component breakdown
POST /api/v1/trust-intelligence/org-score    Snapshot current score to governance_snapshots
GET /api/v1/trust-intelligence/recommendations  Prioritized governance action list
GET /api/v1/trends/overview                  Governance trend history (?days=30|90|180|365)
GET /api/v1/monitoring/alerts                Governance alerts (?status=open|resolved, ?severity=)
GET /api/v1/trust-graph                     Full graph data + metrics (nodes, edges, most-connected, entity counts)
GET /api/v1/trust-graph/nodes               Node list
GET /api/v1/trust-graph/edges               Edge list
GET /api/v1/trust-graph/entity/:id          Single node + neighbours
GET /api/v1/trust-graph/root-cause          Upstream cause analysis (?nodeId=)
GET /api/v1/trust-graph/impact-analysis     Downstream impact analysis (?nodeId=)
GET /api/v1/contracts                       Paginated contract list (?status=, ?contractType=, ?search=)
POST /api/v1/contracts                      Create contract (read_write key)
GET /api/v1/contracts/[id]                  Single contract with clauses + obligations
PUT /api/v1/contracts/[id]                  Update contract (read_write key)
DELETE /api/v1/contracts/[id]               Delete contract (read_write key)
GET /api/v1/contracts/obligations           Org-wide obligations (?contractId=, ?status=)
GET /api/v1/issues                          Paginated issue list (?status=, ?severity=, ?priority=, ?sourceModule=, ?search=)
POST /api/v1/issues                         Create issue (read_write key)
GET /api/v1/issues/[id]                     Single issue with tasks/comments/exceptions/escalations/history
PUT /api/v1/issues/[id]                     Update issue (read_write key)
DELETE /api/v1/issues/[id]                  Delete issue (read_write key)
GET /api/v1/issues/export/csv               Issues CSV export (session auth)
GET /api/v1/trust-exchange                  Trust profile + documents + badges + questionnaire count
GET /api/v1/trust-exchange/documents        Trust document list (?visibility=)
POST /api/v1/trust-exchange/documents       Add trust document (read_write key)
GET /api/v1/trust-exchange/directory        Public vendor trust directory (?industry=, ?country=, ?minScore=, ?riskLevel=)
GET /api/v1/trust-network                   Network dashboard (?view=directory|relationships)

--- Executive Reporting & Analytics™ ---
/executive-reporting                        Hub (KPI strip + 6 dashboard cards + module nav + recent reports)
/executive-reporting/dashboard/[type]       Role dashboard: ceo | cro | ciso | compliance | board | custom
/executive-reporting/analytics              Analytics Hub™ (cross-module KPI grid + snapshot history)
/executive-reporting/board-reports          Board Reports™ (8 report types + generated reports history)
/executive-reporting/scheduled              Scheduled Reports™ (schedule list + create)
/executive-reporting/forecasts              Predictive Analytics™ (30/90/180-day forecasts per metric)
/executive-reporting/scorecards             Executive Scorecards™ (6 domain scorecards with status)
/executive-reporting/ai                     AI Executive Analyst™ (summary + board report + trend analysis + chat)
GET /api/v1/analytics                       KPIs + snapshots + forecasts + schedules (?view=kpis|snapshots|forecasts)

--- AI Governance™ ---
/ai-governance                              Hub (KPI strip + module nav grid + recent systems + incidents)
/ai-governance/inventory                    AI System Inventory™ (filterable registry with type/risk/status/trust badges)
/ai-governance/risks                        AI Risk Register™ (risk list with category labels and level badges)
/ai-governance/controls                     AI Controls™ (controls table with category and effectiveness)
/ai-governance/vendors                      AI Vendor Cards™ (vendor cards with privacy/security posture)
/ai-governance/compliance                   AI Compliance™ (framework cards with readiness progress bars)
/ai-governance/incidents                    AI Incidents™ (incident list with severity/status badges)
/ai-governance/ai                           AI Governance Copilot™ (summary + risk advisory + compliance readiness + NL chat)
GET /api/v1/ai/systems                      AI system list (?status=, ?riskLevel=, ?systemType=)
POST /api/v1/ai/systems                     Create AI system (read_write key)
GET /api/v1/ai/risks                        AI risk list (?status=, ?riskLevel=, ?systemId=)
POST /api/v1/ai/risks                       Create AI risk (read_write key)
GET /api/v1/ai/compliance                   AI compliance records (?framework=)

--- Auditor Collaboration™ ---
/auditor-collaboration                      Hub (KPI strip + module nav + recent rooms + findings)
/auditor-collaboration/rooms                Audit Room list (filter by status, type, framework)
/auditor-collaboration/rooms/new            Create audit room
/auditor-collaboration/rooms/[id]           Room detail (evidence requests, findings, assessments, activity, documents)
/auditor-collaboration/evidence             Org-wide evidence requests (Accept/Reject actions)
/auditor-collaboration/findings             Org-wide external findings (status update inline)
/auditor-collaboration/users                External user registry (invite, revoke)
/auditor-collaboration/assessments          Assessment project progress cards
/auditor-collaboration/ai                   AI Audit Advisor™ (readiness summary + evidence gap analysis + NL chat)
GET /api/v1/audit-rooms                     Audit room list (?status=, ?framework=, ?type=)
POST /api/v1/audit-rooms                    Create audit room (read_write key)
GET /api/v1/evidence-requests               Evidence requests (?status=, ?roomId=)
POST /api/v1/evidence-requests              Create evidence request (read_write key)
GET /api/v1/external-findings               External findings (?status=, ?severity=, ?roomId=)
POST /api/v1/external-findings              Create finding (read_write key)
GET /api/v1/external-users                  External user list (?status=)
POST /api/v1/external-users                 Invite external user (read_write key)

--- Trust Verification Authority™ ---
/trust-verification                         Hub (KPI strip + module nav + recent applications + event feed)
/trust-verification/programs               Verification Programs™ (10 built-in + custom)
/trust-verification/applications           Applications list (status, readiness progress)
/trust-verification/applications/new       Apply for verification (program selector + workflow explainer)
/trust-verification/applications/[id]      Application detail (readiness, evidence, reviews, decision)
/trust-verification/certificates           Trust Certificates™ (cert number, hash, verify link)
/trust-verification/badges                 Trust Badges™ (badge grid + lifecycle legend)
/trust-verification/registry               Verification Registry™ (public, searchable)
/trust-verification/passports              Trust Passport™ (aggregated certs + badges)
/trust-verification/monitoring             Monitoring (health, suspension rules, event feed)
/trust-verification/renewals               Renewal Management™ (due dates, Start Renewal)
/trust-verification/ai                     AI Verification Advisor™ (summary + eligibility + chat)
/verify/[id]                               Public certificate verify page (no auth) — Valid/Revoked/Expired
GET /api/v1/verifications                  Verification list (?status=)
POST /api/v1/verifications                 Apply for verification (read_write key)
GET /api/v1/verifications/[id]             Single verification detail
GET /api/v1/certificates                   Certificate list
GET /api/v1/registry                       Public registry (no auth)
GET /api/v1/trust-passports                Org trust passport
GET /api/v1/verification-programs         All verification programs (no auth)

--- Trust API Platform™ ---
/trust-api                                  Hub (KPI strip + module nav + recent clients + webhook events)
/trust-api/catalog                          API Catalog™ (8 products + plan comparison)
/trust-api/portal                           Developer Portal™ (quickstart, cURL + SDK samples, partner integrations)
/trust-api/keys                             API Key Manager™ (clients + keys + reveal-once)
/trust-api/webhooks                         Webhook Engine™ (create, pause, delete, event picker)
/trust-api/usage                            API Analytics™ (daily bar chart, top endpoints, health)
/trust-api/ai                               AI API Builder™ + Integration Advisor™ + NL chat
GET /api/v1/public/trust-score              Real-time org trust score + component breakdown (Bearer auth)
GET /api/v1/public/vendor-trust             Per-vendor trust scores (?minScore=) (Bearer auth)
GET /api/v1/public/verification             Proof-of-governance bundle — profile, verified docs, badges (Bearer auth)
GET /api/v1/public/benchmarking             Industry benchmark snapshot + category scores (Bearer auth)
GET /api/v1/public/ai-trust                 AI system count + avg trust score + system breakdown (Bearer auth)
GET /api/v1/public/trust-network            Trust profile + documents + badges (Bearer auth)
POST /api/v1/webhooks                       Trigger a trust event → deliver to matching active webhooks
GET /api/v1/webhooks                        List org webhooks
GET /api/v1/developer/usage                 Usage analytics (?days=30, max 365)

--- Governance Agent Framework™ ---
/agents                                      Hub (KPI strip + recent runs + recent observations + module nav)
/agents/registry                             Agent Registry™ (all agents with type, mode, status, metrics)
/agents/studio                               Agent Studio™ (create/configure custom agents)
/agents/runs                                 Agent Runs™ (full execution history with duration, obs counts)
/agents/observations                         Observations™ (governance signals with severity + module attribution)
/agents/recommendations                      Recommendations™ (prioritized actions with confidence rings)
/agents/actions                              Agent Actions™ (approval queue + all actions history)
/agents/orchestration                        Orchestration™ (multi-agent governance pipelines)
/agents/analytics                            Analytics™ (agent performance + automation coverage metrics)
/agents/copilot                              Governance Copilot™ (NL multi-turn chat)
GET /api/v1/agents                           Agent list
POST /api/v1/agents                          Create agent (read_write key)
GET /api/v1/agents/[id]                      Single agent detail
PUT /api/v1/agents/[id]                      Update agent (read_write key)
DELETE /api/v1/agents/[id]                   Delete agent (read_write key)
GET /api/v1/agent-runs                       Agent run history (?agentId=, ?status=)
GET /api/v1/agent-observations               Observations (?agentId=, ?severity=, ?status=)
GET /api/v1/agent-recommendations            Recommendations (?priority=, ?status=)
GET /api/v1/agent-actions                    Agent action queue (?status=)
POST /api/v1/agent-actions/[id]/approve      Approve agent action (read_write key)
POST /api/v1/agent-actions/[id]/reject       Reject agent action (read_write key)

--- Regulatory Intelligence™ ---
/regulatory-intelligence                     Hub (KPI strip + recent changes + open alerts + compliance horizon + module nav)
/regulatory-intelligence/library            Regulation Library™ (filterable list of 18 built-in + org regulations)
/regulatory-intelligence/changes            Change Monitor™ (filterable changes list + status advancement)
/regulatory-intelligence/obligations        Obligations™ (obligation registry + status tracker + obligation actions)
/regulatory-intelligence/assessments        Impact Assessments™ (assessment list + create)
/regulatory-intelligence/watchlists         Watchlists™ (create watchlists for regulations + suggested starters)
/regulatory-intelligence/horizon            Compliance Horizon™ (4-panel AI forecast: emerging risks · deadlines · trends · recommendations)
/regulatory-intelligence/ai                 AI Regulatory Advisor™ (cached summary + suggested questions + NL chat)
GET /api/v1/regulations                     Paginated regulation list (?category=, ?page=, ?pageSize=)
GET /api/v1/obligations                     Obligation list (?status=, ?regulationId=, ?priority=, ?page=)
POST /api/v1/obligations                    Create obligation (read_write key)
GET /api/v1/regulatory-changes              Regulatory change list (?status=, ?severity=)
GET /api/v1/regulatory-assessments          Assessment list (?status=, ?page=)
POST /api/v1/regulatory-assessments         Create assessment (read_write key)
GET /api/v1/regulatory-readiness            Readiness score + metrics

--- Asset Intelligence™ ---
/asset-intelligence                          Hub (KPI strip: total/active/critical/PII/alerts · recent assets · by-type chart · open alerts · module nav)
/asset-intelligence/registry                Asset Registry™ (filterable list by type/criticality/status/environment + create)
/asset-intelligence/registry/new           Add asset form (all fields: name, type, criticality, env, data class, PII flags, stack, cloud, notes)
/asset-intelligence/data-assets            Data Asset Catalog™ (PII assets warning panel + data asset registry + DPDP link)
/asset-intelligence/relationships          Asset Relationships™ (dependency table with relationship type labels + Trust Graph link)
/asset-intelligence/alerts                 Asset Alerts™ (open/resolved with ResolveAlertButton + severity badges)
/asset-intelligence/ai                     AI Asset Advisor™ (advisory summary + suggested questions + AssetAiChat NL chat)
GET /api/v1/assets                          Asset list (?type=, ?criticality=, ?status=, ?environment=)
POST /api/v1/assets                         Create asset (read_write key)

--- Help & Docs ---
/help                                        Documentation center — all 32 modules, search, grouped left nav (authenticated)

--- Platform ---
/portal/[token]                              Vendor self-service portal (no auth)
/api/cron/expiry  /api/cron/digest           Scheduled cron routes (CRON_SECRET)
/api/cron/governance-snapshot               Daily org snapshot + monitoring rules (CRON_SECRET)
/api/export/audit-logs                       CSV export (session auth)
/api/export/tenant-data                      ZIP export: vendors + docs + assessments + team + audit (session auth)
/auth/callback                               Supabase auth redirect
```

---

## 8. Key File Map

```
lib/
  db/
    schema.ts                   52-table Drizzle schema — all enums + tables + inferred types (incl. Risk Lens 9 tables + 5 enums + governance_snapshots)
    index.ts                    Lazy DB Proxy — ssl:"require", pool config — CRITICAL, do not change

  providers/                    ← INFRASTRUCTURE ADAPTERS (only place SDKs are imported)
    ai/index.ts                 Lazy GoogleGenAI singleton · generateText() · getAI() · AI_MODEL · isAIConfigured()
    auth/index.ts               AuthProvider interface + factory (getAuthProvider())
    auth/supabase.ts            Supabase Admin SDK implementation (inviteUser)
    storage/index.ts            StorageProvider interface — uploadFile, downloadFile, deleteFile, generateSignedUrl, exists
    storage/supabase.ts         Supabase Storage implementation (all 5 methods, 15-min signed URL TTL)
    crypto/config-cipher.ts     AES-256-GCM encryptConfig() / decryptConfig() — reads ENCRYPTION_KEY
    rate-limit/index.ts         In-memory sliding window · checkRateLimit(keyId, permissions)

  auth/
    session.ts                  requireUser() — session-based auth for pages + server actions
    api-key-auth.ts             validateApiKey() — Bearer token auth for /api/v1/* routes

  api/
    response.ts                 ok(), err(), withRateLimitHeaders(), buildMeta() — REST response helpers

  --- Vendor Governance services ---
  services/
    scoring.ts                  Pure: computeScore(), computeDocStatus()
    risk-engine.ts              Pure: computeRiskScore() → {level, score, factors[]}
    vendor-service.ts           Vendor business logic
    document-service.ts         Document lifecycle
    extraction-service.ts       Gemini extraction pipeline (v2 — 10 fields)
    notification-service.ts     Resend engine + AI weekly brief
    template-service.ts         Checklist calculation
    assessment-service.ts       Security assessment scoring
    team-service.ts             Invite (via AuthProvider) + RBAC + ownership transfer
    settings-service.ts         Profile, org profile, org branding updates
    billing-service.ts          Plan overview, usage meters, plan seeding
    api-key-service.ts          Key generation (bcrypt), rotate, revoke
    integration-service.ts      Connect/disconnect integrations
    ai-insights-service.ts      Gemini: explain score, risk, actions, assessment summary, executive report
    ai-summary-service.ts       Gemini: vendor brief (cached)
    nl-search-service.ts        Natural language → structured filters (Gemini)
    data-governance-service.ts  Stats (docs, storage, vendors, assessments, users) + recent audit events

  --- Compliance Module services ---
  services/compliance/
    readiness-service.ts        Pure: computeReadiness() — no DB, client-safe
    framework-service.ts        Framework CRUD + recomputeReadiness() + seedFrameworkControls()
    control-service.ts          Control CRUD + inline status
    evidence-service.ts         Evidence CRUD + map/unmap + autoImportFromVendors()
    policy-service.ts           Policy CRUD + version history
    gap-service.ts              runGapAnalysis() — 5 rule-based gap types
    ai-compliance-service.ts    Gemini: framework summary, readiness explanation,
                                gap narrative, executive summary, contextual NL chat

  --- Audit Management services ---
  services/audit/
    audit-service.ts            Audit CRUD + getDashboardMetrics() + generateAuditProgram() from framework controls
    finding-service.ts          Finding CRUD + closeFinding() (validates status transition)
    capa-service.ts             CAPA CRUD + completeCorrectiveAction() + auto-moves finding to "remediating" on create
    ai-audit-service.ts         Gemini: audit summary (cached), finding from observation (JSON),
                                CAPA suggestions, executive report (cached), contextual NL chat

  --- Risk Lens™ services ---
  services/trust-score.ts       Pure, client-safe: computeTrustScore(inputs) → TrustScoreBreakdown
                                getTrustLevel(), TRUST_LEVEL_LABELS, TRUST_LEVEL_COLORS, TRUST_LEVEL_BG,
                                TRUST_COMPONENT_WEIGHTS, TRUST_COMPONENT_LABELS
  services/trust-score-service.ts  computeAndSaveTrustScore(orgId, vendorId, triggerEvent)
                                   generateTrustNarrative(orgId, vendorId) — Gemini cached (<24h)
                                   getTrustHistory(), getOrgTrustMetrics()
  services/risk-scoring.ts      Pure, client-safe: computeRiskScore(impact, likelihood) → {score, level, color, priority}
                                scoreToLevel(), RISK_CATEGORY_LABELS, RISK_STATUS_LABELS,
                                RISK_SOURCE_LABELS, TREATMENT_STRATEGY_LABELS
  services/risk/
    risk-service.ts             Risk CRUD + updateRiskStatus() + addReview() + addTreatment() + completeTreatment()
                                getDashboardMetrics() → {total, open, mitigating, accepted, closed, critical,
                                overdueReviews, byCategory, topRisks, heatMapData}
    ai-risk-service.ts          Gemini: generateRiskNarrative() (cached), generateRiskFromObservation() (JSON),
                                generateMitigationRecommendations() (5 items), generateExecutiveSummary() (cached),
                                chat() (multi-turn NL), getCachedNarrative(), getCachedExecutiveSummary()

  repositories/                 Data access only (Drizzle + optional Executor for transactions)
    --- Vendor Governance ---
    vendor-repo, document-repo, assessment-repo, review-repo, request-repo
    portal-repo, template-repo, notification-repo, audit-repo, activity-repo
    org-repo, profile-repo, team-repo
    --- Settings ---
    organization-settings-repo  Branding settings (upsert by orgId)
    login-history-repo          Auth event records
    billing-repo                Plans + subscriptions
    api-key-repo                Key CRUD (never returns keyHash to caller)
    integration-repo            Transparent encrypt-on-write, decrypt-on-read via config-cipher
    --- Compliance ---
    framework-repo, control-repo, evidence-repo, policy-repo, gap-repo
    readiness-repo, ai-compliance-repo
    --- Audit Management ---
    audit-management-repo       Audit CRUD + countByStatus + countOverdue
    audit-program-repo          Program item CRUD (bulk insert from framework controls)
    audit-finding-repo          Finding CRUD + findByOrg with filters + countBySeverity
    corrective-action-repo      CAPA CRUD + findByOrg with status filter + countDueSoon
    --- Trust Score™ ---
    trust-score-repo            saveTrustScore(), getTrustHistory(), getOrgTrustMetrics()
    --- Risk Lens™ ---
    risk-repo                   Risk CRUD + findByOrg(filters) + countByStatus + countByCategory + countOverdueReviews
                                + findActiveByVendor — LEFT JOINs profiles for owner name/email
    risk-treatment-repo         insertTreatment, findByRisk, findByOrg, updateTreatment, deleteTreatment
    risk-review-repo            insertReview, findByRisk, findByOrg
    risk-relationship-repo      link/unlink for all 6 junction tables (vendors/controls/findings/policies/frameworks/evidence)

  --- Control Center™ services ---
  services/control-health.ts   Pure, client-safe: computeControlHealth(inputs) → ControlHealthBreakdown
                               getHealthLevel(), HEALTH_COMPONENT_WEIGHTS, HEALTH_COMPONENT_LABELS
                               Health levels: exceptional/healthy/strong/moderate/needs_attention/critical
  services/control-center/
    control-center-service.ts  Control CRUD + computeAndSaveHealth() + addTest()
    ai-control-service.ts      Gemini: generateControlNarrative() (cached), generateExecutiveSummary() (cached),
                               detectControlGaps() (top 5), chat() (multi-turn NL)

  --- Control Center™ repository ---
  repositories/
    control-center-repo.ts     findAllControls(), getHealthInputs(), getDashboardMetrics(),
                               updateControlFull(), saveHealthScores(),
                               insertControlTest(), findTestsByControl(), findAllTests(), deleteControlTest(),
                               linkControlVendor/Framework(), getLinkedVendors/Frameworks()

  --- Trust Intelligence™ services ---
  services/org-trust-score.ts  Pure, client-safe: computeOrgTrustScore(inputs) → OrgTrustBreakdown
                               getOrgTrustLevel(), ORG_TRUST_COMPONENT_WEIGHTS
  services/trust-intelligence/
    trust-intelligence-service.ts  getOverviewData(), getVendorTrustData(), getRiskInsightsData(),
                                   getControlHealthData(), getComplianceData(), getRecommendations(),
                                   getExecutiveData(), snapshotGovernance()
    ai-trust-intelligence-service.ts  generateGovernanceSummary() (cached 24h), chat() (NL)

  --- Trust Intelligence™ repository ---
  repositories/
    trust-intelligence-repo.ts  getOrgTrustScore(), saveGovernanceSnapshot(), getGovernanceHistory(),
                                getRecommendations(), getVendorTrustMetrics(), getRiskMetrics(),
                                getControlMetrics(), getComplianceMetrics()

  --- Server actions (thin transport — auth + service call + revalidatePath) ---
  control-center/actions.ts    createControlAction, updateControlAction, deleteControlAction,
                               computeHealthAction, addTestAction, deleteTestAction,
                               generateNarrativeAction, generateExecutiveSummaryAction, chatAction
  trust-intelligence/actions.ts  getOverviewAction, generateGovernanceSummaryAction, chatAction,
                                 snapshotGovernanceAction
  vendors/actions.ts
  documents/actions.ts
  assessments/actions.ts
  reviews/actions.ts
  compliance/actions.ts         All compliance actions (frameworks, controls, evidence, policies, gaps, AI)
  settings/actions.ts           Profile, org, branding, password, API keys, integrations
  team/actions.ts               Invite, role, deactivate, reactivate, transfer ownership, resend invite
  audit/actions.ts              All audit actions: audit CRUD + status + program + findings + CAPAs + all AI
  risk/actions.ts               All risk actions: risk CRUD + status + treatment + review + all AI
  executive-reporting/actions.ts  getDashboardDataAction, computeKpisAction, generateReportAction (void),
                                  createScheduleAction, toggleScheduleAction (void), generateForecastsAction,
                                  takeSnapshotAction (void), generateExecutiveSummaryAction, chatAction

  --- Executive Reporting & Analytics™ services ---
  services/executive-reporting/
    executive-reporting-service.ts  computeKpis() (10 KPIs via parallel queries), getDashboardData(orgId, dashboardType),
                                    generateReport(), getReports(), createSchedule(), toggleSchedule(),
                                    generateForecasts(), takeSnapshot(), getAnalyticsOverview()
    ai-executive-reporting-service.ts  generateExecutiveSummary() (cached 24h), generateBoardReport(),
                                       generateTrendAnalysis(), chat() (multi-turn NL)

  --- Executive Reporting™ repository ---
  repositories/
    executive-reporting-repo.ts  upsertKpi(), getKpis(), upsertSnapshot(), getLatestSnapshot(),
                                 getSnapshotHistory(), createReport(), getReports(),
                                 createSchedule(), getSchedules(), toggleSchedule(),
                                 upsertForecast(), getForecasts()
    NOTE: analytics tables use `org_id` column (not `organization_id` like most AUDT tables)

  --- Trust API Platform™ services ---
  services/trust-api/
    trust-api-service.ts     issueApiKey(), revokeApiKey(), createClient(), deleteClient(), createWebhook(),
                             deleteWebhook(), pauseWebhook(), resumeWebhook(), triggerWebhookEvent(),
                             getTrustScoreData(), getVerificationData(), getUsageAnalytics(),
                             getDashboardMetrics(), getApiProducts(), getApiClients(), getApiKeys(), getWebhooks()
    ai-trust-api-service.ts  generateApiPlatformSummary() (cached 24h), generateApiDocs(productSlug),
                             chat() (multi-turn NL)

  --- Trust API Platform™ repository ---
  repositories/
    trust-api-repo.ts  getDashboardMetrics(), findAllProducts(), findAllClients(), findAllApiKeys(),
                       insertClient(), insertApiKey(), updateKeyLastUsed(), updateKeyStatus(),
                       insertWebhook(), updateWebhookStatus(), findActiveWebhooks(), recordWebhookDelivery(),
                       recordUsage(), getUsageSummary() (includes dailyCounts by day_trunc)

  trust-api/actions.ts  createClientAction, deleteClientAction, issueApiKeyAction, revokeApiKeyAction,
                        createWebhookAction, deleteWebhookAction, pauseWebhookAction, resumeWebhookAction,
                        generatePlatformSummaryAction, generateApiDocsAction, chatAction

  --- Regulatory Intelligence™ services ---
  services/regulatory-intelligence/
    regulatory-service.ts   getDashboardData(), getRegulations(), getChanges(), getObligations(), getAssessments(),
                            getAlerts(), getWatchlists(), getTasks(), getUpdates(), getReadiness(),
                            createChange() (auto-inserts alert for high/critical), createObligation(), createAssessment()
    ai-regulatory-service.ts  generateRegulatoryAdvisorySummary() (cached 24h), analyzeRegulatoryChange() (cached per change),
                              extractObligations(), suggestControlMappings(), generateComplianceHorizon() (cached 24h), chat()

  --- Regulatory Intelligence™ repository ---
  repositories/
    regulatory-intelligence-repo.ts  findAllRegulations(), findAllChanges(), findAllObligations(), findAllAssessments(),
                                     findAllAlerts(), findAllWatchlists(), findAllTasks(), findAllUpdates(),
                                     getDashboardMetrics() (8 parallel counts), getReadinessData()
                                     Uses or(isNull(org_id), eq(org_id, orgId)) for built-in global rows

  regulatory-intelligence/actions.ts  All server actions: createChangeAction, updateChangeStatusAction,
                                       createObligationAction, updateObligationStatusAction,
                                       createAssessmentAction, deleteWatchlistAction,
                                       generateAdvisorySummaryAction, analyzeChangeAction,
                                       generateHorizonAction, chatAction

  components/regulatory-intelligence/
    reg-ui.tsx              RegSubNav (8-item pill nav) · RegStat (border-l-2 accent card, 5 accent types)
                            SeverityBadge · ChangeStatusBadge · ObligationStatusBadge · PriorityBadge
                            CategoryBadge · AlertIcon · ReadinessBar · ReadinessLabel
    change-actions.tsx      UpdateChangeStatusButton (new→under_review→assessed→actioned→closed)
    obligation-actions.tsx  UpdateObligationStatusButton (not_started→in_progress→implemented→validated)
    watchlist-actions.tsx   DeleteWatchlistButton (confirm dialog + delete)
    reg-ai-chat.tsx         NL chat with suggested question click handler ([data-question] attribute delegation)

  --- Asset Intelligence™ services ---
  services/asset-intelligence/
    asset-service.ts        getDashboardData(), getAssets(filters), getAsset(id), createAsset(), updateAsset(), deleteAsset(),
                            getRelationships(), createRelationship(), addReview(),
                            computeAndSaveAssetScore(), takeSnapshot(), getAlerts(), resolveAlert()
    ai-asset-service.ts     generateAdvisorySummary() (cached 24h), analyzeImpact(), analyzeDependencyChain(), chat()
                            Uses aiComplianceInsights table with generatedAt column (not createdAt)

  --- Asset Intelligence™ repository ---
  repositories/
    asset-intelligence-repo.ts  findAllAssets(orgId, filters), findAssetById(), insertAsset(), updateAsset(), deleteAsset(),
                                getDashboardMetrics(), getAssetCountsByType(), getAssetCountsByCriticality(),
                                linkAssetRisk/Control/Vendor/Contract/Regulation/AiSystem(),
                                findAssetRisks/Controls/Vendors/Contracts/Regulations/AiSystems(),
                                saveAssetScore(), insertAlert(), resolveAlert(), saveSnapshot()

  asset-intelligence/actions.ts  createAssetAction, updateAssetAction, deleteAssetAction,
                                  createRelationshipAction, resolveAlertAction,
                                  generateAdvisorySummaryAction, chatAction

  components/asset-intelligence/
    asset-ui.tsx            AssetSubNav (6-item pill nav: Dashboard/Registry/Data Assets/Relationships/Alerts/AI Advisor)
                            AssetStat (border-l-2 accent card) · CriticalityBadge · AssetStatusBadge
                            AssetTypeBadge · AssetTrustBadge · AlertSeverityBadge
    new-asset-form.tsx      Create asset — useActionState<any, FormData>(createAssetAction as any, undefined)
    alert-actions.tsx       ResolveAlertButton (useTransition + router.refresh())
    asset-ai-chat.tsx       NL chat with [data-question] suggested question delegation

  agents/
    utils.ts            Plain TS (no "use client") — fmtDate(), fmtDuration() used by agents server pages.
                        Extracted from agent-ui.tsx to avoid Next.js server/client boundary error.

  storage/
    server.ts                   Bucket-aware delegator — uploadFile, downloadObject, removeObjects,
                                createSignedUrl, objectExists. Auto-routes by path prefix (tenant_=compliance-documents)
    paths.ts                    COMPLIANCE_DOCS_BUCKET, buildDocPath(), buildVendorDocPath(), bucketForPath()

  ai/
    gemini.ts                   extractDocumentFields() v2 (complex structured output stays here)
                                isGeminiConfigured() (re-exported from providers/ai)

  email/
    resend.ts                   Resend client + isResendConfigured()
    templates.ts                HTML email templates — expiryAlertHtml(), weeklyDigestHtml()

  supabase/
    server.ts                   createClient() — session Supabase client for pages/actions
    client.ts                   Browser Supabase client
    middleware.ts               updateSession() — called by proxy.ts
    config.ts                   isSupabaseConfigured()

  ui/colors.ts                  scoreBarGradient(), scoreTextColor(), scoreLabel(), statusBadgeStyles(), riskBadgeStyles()
  constants/
    vendor-options.ts           Categories, risk levels, doc types (25+)
    vendor-templates.ts         7 default template definitions
    assessment-questions.ts     17 standard questions + calculateScore() + groupByCategory()
    compliance-framework-templates.ts  174 controls across ISO 27001/SOC 2/DPDP/PCI DSS/HIPAA

  reports/                      react-pdf templates: vendor-compliance, expiry, audit-package,
                                executive-summary, compliance-framework-pdf, compliance-executive-pdf

app/
  (app)/                        Authenticated Next.js App Router pages
    dashboard/, vendors/, compliance/, audits/, settings/   (see Section 7 for full route list)
  api/
    v1/                         REST API — Bearer auth + rate limiting (see Section 7)
    cron/                       Scheduled cron jobs
    export/                     File download endpoints

components/
  ui/                           Button, Card, Badge, StatusBadge, Input, Select, Tabs,
                                SectionHeading, EmptyState, ScoreRing
  ai/                           AiInsightPanel (collapsible), AiRecommendedActions
  app-shell/                    Sidebar (7 nav groups: AI & Agents · Core GRC · Privacy & Legal · Intelligence · Security · Trust Network — see `groups` array in sidebar.tsx), Topbar (NL search detection + CircleHelp ? button opens HelpPanel)
  help/
    help-content.ts             Static HELP_CONTENT map — all 32 modules, each with title/icon/group/overview/features[]/tips[]/route
    help-panel.tsx              "use client" slide-over panel (w-80, fixed right-0) — detects current module via usePathname(), shows overview + features + tips; triggered by ? in topbar
    help-docs-client.tsx        "use client" full docs page component — search, grouped left sidebar, module cards
  vendors/                      All vendor UI — forms, detail tabs, document components
  assessments/                  AssessmentForm, AiAssessmentSummary
  activity/                     ActivityFeed
  team/                         InviteForm, MemberRow (7 roles, transfer ownership, resend invite)
  settings/                     ProfileForm, OrgProfileForm, BrandingForm, PasswordForm, MfaPanel,
                                AuditLogTable, ApiKeyManager, IntegrationGrid
  compliance/
    compliance-badges.tsx       All compliance status badges
    compliance-ui.tsx           Shared helpers: ComplianceStat (border-l-2 accent bar + tinted bg, danger/warn/good tones), FilterChip, CoverageBar
    [all other compliance components]
  audit/
    audit-status-badge.tsx      AuditStatusBadge, SeverityBadge, FindingStatusBadge, CapaStatusBadge, AuditTypeBadge
    audit-ui.tsx                AuditStat (border-l-2 accent bar + tinted bg), AuditFilterChip, formatDate, isDueSoon, isOverdue
    audit-ai-chat.tsx           AI Auditor NL chat (mirrors AiComplianceChat pattern)
    audit-detail-actions.tsx    Start/Complete/Cancel audit status buttons
    new-audit-form.tsx          Create audit form (useActionState)
    edit-audit-form.tsx         Edit audit form
    new-finding-form.tsx        Add finding + AI Finding Generator (observation → structured finding)
    new-capa-form.tsx           Add CAPA with finding selector
    finding-actions.tsx         Close finding + Add CAPA link
    capa-actions.tsx            Mark Complete button
  vendors/ (trust additions)
    trust-score-badge.tsx       TrustScoreBadge — inline level chip (score + level label)
    trust-score-widget.tsx      TrustScoreWidget — full breakdown card: bars, strengths/concerns, AI narrative
  controls/
    control-health-badge.tsx    ControlHealthBadge — coloured chip showing health score + level
    control-status-badge.tsx    ControlStatusBadge, ControlTypeBadge, AutomationBadge, TestResultBadge
    new-control-form.tsx        Create control form (all fields including objective, frequency, automation)
    edit-control-form.tsx       Edit control — useActionState(updateControlAction, undefined) directly
    control-detail-actions.tsx  DeleteControlButton (variant="danger"), ComputeHealthButton (useTransition),
                                AddTestForm (useActionState + useEffect close-on-ok), DeleteTestButton
    control-ai-chat.tsx         AI Control Advisor NL chat

  risk/
    risk-status-badge.tsx       RiskStatusBadge, RiskScoreBadge, RiskLevelBadge, RiskCategoryBadge, TreatmentStatusBadge
    risk-heat-map.tsx           Client component — 5×5 grid, impact on Y (5→1), likelihood on X (1→5),
                                cells coloured by score range, risk counts, clickable to filter
    risk-detail-actions.tsx     UpdateStatus dropdown, delete, GenerateNarrative, AddTreatment inline form,
                                CompleteTreatment, AddReview inline form — all useTransition + router.refresh()
    new-risk-form.tsx           Create risk — live impact/likelihood sliders with real-time computeRiskScore
    edit-risk-form.tsx          Edit risk — useActionState with boundAction pattern (not bind())
    risk-ai-chat.tsx            AI Risk Officer NL chat

lib/reports/
  audit-report-pdf.tsx          Full audit report (overview, AI narrative, findings by severity, CAPAs table)
  audit-findings-pdf.tsx        Findings-only PDF
  audit-capa-pdf.tsx            CAPA Tracker PDF

supabase/
  migrations/
    0000–0004_*.sql             Initial schema through document_category enum
    0005_goofy_luke_cage.sql    Compliance Module — 6 enums + 10 tables ✅ APPLIED
    0006_clear_freak.sql        Settings Module — 6 enums + 6 tables + column extensions ✅ APPLIED
    0007_data_governance.sql    Data Governance Phase 1 — storage_providers table, vendor_documents
                                storage metadata columns, audit_logs.ip_address ✅ APPLIED
    0008_audit_management_apply.sql  Audit Management — 6 enums + 5 tables ✅ APPLIED
    0009_risk_lens.sql          Risk Lens™ — 5 enums + 9 tables (risks, risk_reviews, risk_treatments,
                                risk_vendors, risk_controls, risk_findings, risk_policies,
                                risk_frameworks, risk_evidence) ✅ APPLIED
    0010_trust_score.sql        Trust Score™ — 4 new columns on vendors + vendor_trust_history table ✅ APPLIED
    0011_control_center.sql     Control Center™ — 4 new enums + frameworkId nullable + 11 new columns on controls
                                + control_tests table + control_frameworks junction + control_vendors junction
                                + RLS policies for all 3 new tables ✅ APPLIED
    0012_trust_intelligence.sql Trust Intelligence™ — governance_snapshots table (orgId, scores JSON, component breakdown)
                                + RLS policy ✅ APPLIED
    0013_governance_trends.sql  Governance Trends™ — governance_alerts + alert enums + evidence_coverage_score ✅ APPLIED
    0014_trust_graph.sql        Trust Graph™ — graph_nodes + graph_edges + RLS ✅ APPLIED
    0015_policy_governance.sql  Policy Governance™ — policy_reviews + policy_attestations + policy_controls + policy_frameworks + RLS ✅ APPLIED
    0016_dpdp_privacy.sql       DPDP Privacy™ — data_assets + consent_records + privacy_requests + retention_policies + retention_events + privacy_assessments + data_transfers + privacy_trust_scores ✅ APPLIED
    0017_contract_governance.sql Contract Governance™ — 5 enums + contracts + contract_clauses + contract_obligations + contract_risks + contract_controls + contract_policies ✅ APPLIED
    0020_trust_exchange.sql     Third-Party Risk Exchange™ — 7 enums + trust_profiles + trust_documents + trust_shares + trust_questionnaires + trust_answers + trust_verifications + trust_badges + trust_relationships + trust_activity + RLS ✅ APPLIED
    0021_benchmarking.sql       Governance Benchmarking™ — 3 enums + benchmark_industries + benchmark_snapshots + benchmark_scores + benchmark_trends + RLS + seeded baselines ✅ APPLIED
    0024_executive_reporting.sql Executive Reporting & Analytics™ — analytics_dashboards + analytics_widgets + analytics_reports + analytics_schedules + analytics_snapshots + analytics_exports + analytics_forecasts + analytics_subscriptions + analytics_kpis + RLS ✅ APPLIED
    0025_ai_governance.sql      AI Governance™ — 8 enums + ai_systems + ai_vendors + ai_risks + ai_controls + ai_policies + ai_assessments + ai_incidents + ai_compliance + ai_trust_scores + ai_system_controls + ai_system_risks + RLS ✅ APPLIED
    0031_regulatory_intelligence.sql  Regulatory Intelligence™ — 14 tables: regulations + regulation_versions + regulatory_changes + obligations + obligation_mappings + regulatory_assessments + regulatory_impacts + regulatory_reviews + regulatory_alerts + regulatory_watchlists + regulatory_sources + regulatory_agents + regulatory_tasks + regulatory_updates + RLS. Seeds 18 built-in regulations + 6 regulatory sources ✅ APPLIED
  rls.sql                       RLS policies + auth trigger (apply once) — includes audit table policies
  rls-risk-lens.sql             Risk Lens™ RLS policies (apply once after migration 0009)
  storage.sql                   vendor-documents + compliance-documents buckets + RLS policies (apply once)

scripts/
  apply-sql.mjs                 Apply raw SQL to DB
  seed-templates.mjs            7 default vendor type templates
  seed-demo.mjs                 15 realistic Indian vendors + 67 docs (idempotent; populates new storage columns)
  seed-e2e.mjs                  E2E test user + workspace
  check-db.mjs                  Quick DB state check (counts all tables incl. new ones)
  seed-compliance-frameworks.mjs   5 frameworks + 174 controls (idempotent)
  seed-compliance-demo.mjs         Statuses, evidence, 104 mappings, 8 policies, gaps, scores
  seed-billing-plans.mjs           Starter/Growth/Enterprise plans; --assign-all flag
  seed-data-governance.mjs      Backfills doc storage metadata, org_settings, login_history, 25 audit events
  seed-risk-lens.mjs            20 risks · 25 treatments · 8 reviews · vendor/control/framework links (idempotent)
  seed-trust-scores.mjs         Computes and stores Trust Score™ for all active vendors (idempotent)
  seed-trust-exchange.mjs       1 published trust profile · 5 documents · 4 badges · 1 global questionnaire with answers
  seed-executive-reporting.mjs  10 KPIs + 5 snapshots + 3 board reports + 2 schedules + 9 forecasts (3 metrics × 3 horizons)
  seed-regulatory-intelligence.mjs  8 regulatory changes · 12 obligations · 3 assessments · 5 alerts · 5 watchlists · 8 tasks · 4 updates (idempotent)
  seed-asset-intelligence.mjs      30 assets (apps/databases/cloud/data-assets/processes) · 4 alerts · 6 relationships (idempotent; targets most-active org via membership count query)
  SEED.md                       Complete inventory of all demo seed data across all modules
```

---

## 9. Test Suite

```bash
npm run test              # 201 Vitest tests (~2s)
npm run test:coverage     # coverage report in coverage/
npm run test:watch        # watch mode
npm run test:e2e          # Playwright (dev server must be running)
npm run test:all          # Vitest + Playwright
```

| Layer | Files | Tests | Coverage |
|---|---|---|---|
| Pure functions | scoring.ts, risk-engine.ts, colors.ts, templates.ts, assessment-questions.ts | 103 | ~100% |
| Service unit | vendor-service.ts, document-service.ts, notification-service.ts | 38 | ~60% |
| Components (RTL) | Tabs, StatusBadge, ActivityFeed, ComplianceBreakdown, VendorStatus | 60 | ~75% |
| E2E Playwright | auth, vendor-crud, settings, portal | 4 spec files | live app |

**Total: 201 Vitest tests — all passing.** Settings + provider layer not yet unit-tested (next phase).

**Mocking pattern:**
```ts
vi.mock("@/lib/repositories/vendor-repo");
vi.mock("@/lib/db", () => ({
  db: { transaction: vi.fn((fn) => fn({})) },  // must call through!
}));
```

**E2E setup:** Set `E2E_USER_EMAIL` + `E2E_USER_PASSWORD` in `.env.local`, run `node scripts/seed-e2e.mjs`, then `npm run test:e2e`.

---

## 10. Product Roadmap

### Module 1 — Vendor Hub™ (Vendor Governance) ✅ Complete
### Module 2 — Evidence Vault™ (Compliance Management) ✅ Complete (8 phases)
### Module 3 — Settings & Organization Management ✅ Complete
### Phase 1 — Data Governance ✅ Complete (2026-06-05)
### Module 4 — Audit Management ✅ Complete (2026-06-06)
### Module 5 — Risk Lens™ ✅ Complete (2026-06-07)
### Module 6 — Control Center™ ✅ Complete (2026-06-07)
### Module 7 — Trust Intelligence™ ✅ Complete (2026-06-07)
### Module 8 — Governance Trends™ + Continuous Monitoring™ ✅ Complete (2026-06-09)
### Module 9 — Trust Graph™ ✅ Complete (2026-06-09)
### Trust Score™ ✅ Complete (2026-06-07)
### Landing Page — AUDT Rebrand ✅ Complete (2026-06-07)
### Domain — audt.tech ✅ DNS configured, SSL pending propagation (2026-06-07)

### Module 10 — Policy Governance™ ✅ Complete (2026-06-09)
### Module 11 — DPDP Privacy™ ✅ Complete (2026-06-09)
### Module 12 — Contract Governance™ ✅ Complete (2026-06-10)
### Module 13 — Issue & Remediation Hub™ ✅ Complete (2026-06-10)
### Module 14 — Workflow Studio™ ✅ Complete (2026-06-10)
### Module 15 — Third-Party Risk Exchange™ ✅ Complete (2026-06-11)
### Module 16 — Governance Benchmarking™ ✅ Complete (2026-06-11)
### Module 17A — Integration Hub™ ✅ Complete (2026-06-11)
### Module 18 — Trust Network™ ✅ Complete (2026-06-11)
### Module 19 — Executive Reporting & Analytics™ ✅ Complete (2026-06-12)
### Module 20 — AI Governance™ ✅ Complete (2026-06-13)
### Module 21 — Auditor Collaboration™ ✅ Complete (2026-06-13)
### Module 22 — Trust API Platform™ ✅ Complete (2026-06-13)
### Module 23 — Trust Verification Authority™ ✅ Complete (2026-06-13)
### Module 28 — Continuous Compliance™ ✅ Complete (2026-06-13)
### Module 29 — Governance Agent Framework™ ✅ Complete (2026-06-13)
### Module 30 — Regulatory Intelligence™ ✅ Complete (2026-06-14)
### Module 32 — Security Command Center™ ✅ Complete (2026-06-16)
### Module 31 — Asset Intelligence™ ✅ Complete (2026-06-16)

Centralized Governance Execution Layer. 6 new tables: `issues`, `issue_tasks`, `issue_comments`, `issue_exceptions`, `issue_escalations`, `issue_history`.

| Feature | Detail |
|---|---|
| **Issue Registry™** | Central repository for all governance issues from every module |
| **Task Management™** | Per-issue task tracking with status, owner, due dates |
| **Exception Management™** | Request/approve/reject governance exceptions |
| **Escalation Engine™** | Escalate critical issues to owner/manager/exec/board |
| **SLA Tracking™** | Auto-SLA days by severity (Critical=7d, High=14d, Medium=30d, Low=90d), breach detection |
| **AI Issue Generator™** | Convert observations into structured issues |
| **AI Remediation Planner™** | Generate remediation tasks with owners and timelines |
| **AI Advisor™** | Executive summary, NL chat ("Show critical issues", "What's overdue?") |
| **Monitoring rules** | 3 new rules: issue_overdue · issue_critical_open · issue_sla_breach |
| **REST API** | 3 endpoints: GET/POST /api/v1/issues, GET/PUT/DELETE /api/v1/issues/[id], GET /api/v1/issues/export/csv |

- Service: `lib/services/issue-hub/issue-service.ts`
- AI service: `lib/services/issue-hub/ai-issue-service.ts`
- Repo: `lib/repositories/issue-repo.ts`
- Actions: `lib/issue-hub/actions.ts`
- Migration: `supabase/migrations/0018_issue_remediation.sql`
- Routes: `/issue-hub/*` (9 pages)

### Module 12 — Contract Governance™ ✅ Complete (2026-06-10)
### Module 13 — Issue & Remediation Hub™ ✅ Complete (2026-06-10)
### Module 14 — Workflow Studio™ ✅ Complete (2026-06-10)

Contract lifecycle, obligation tracking, AI analysis. 6 new tables: `contracts`, `contract_clauses`, `contract_obligations`, `contract_risks`, `contract_controls`, `contract_policies`.

| Feature | Detail |
|---|---|
| **Contract Library** | Registry of all contracts with status, type, value, expiry |
| **Clause Management** | Per-contract clause tracking with category and risk level |
| **Obligation Tracker** | Org-wide obligation tracking with due dates and status |
| **Renewals** | Renewals dashboard sorted by expiry with action deadline calc |
| **Contract Score™** | 6-component 0–100 engine: clauseCoverage(25%) + obligationCompletion(20%) + renewalReadiness(15%) + riskExposure(20%) + policyAlignment(10%) + privacyCompliance(10%) |
| **AI Contract Advisor™** | Extract clauses/obligations, analyse clause risk, AI executive summary, NL chat |
| **Trust Graph integration** | Contract nodes linked to vendor/risk/policy/control entities |
| **Monitoring rules** | 3 new rules: contract_expiring · contract_renewal_due · contract_obligations_overdue |
| **REST API** | 3 endpoints: GET/POST /api/v1/contracts, GET/PUT/DELETE /api/v1/contracts/[id], GET /api/v1/contracts/obligations |

- Pure engine: `lib/services/contract-score.ts`
- Service: `lib/services/contract-governance/contract-service.ts`
- AI service: `lib/services/contract-governance/ai-contract-service.ts`
- Repo: `lib/repositories/contract-repo.ts`
- Actions: `lib/contract-governance/actions.ts`
- Migration: `supabase/migrations/0017_contract_governance.sql`
- Routes: `/contract-governance/*` (8 pages)

### Module 15 — Third-Party Risk Exchange™ ✅ Complete (2026-06-11)
### Module 16 — Governance Benchmarking™ ✅ Complete (2026-06-11)

Industry peer comparison across 10 governance categories. 4 new tables: `benchmark_industries`, `benchmark_snapshots`, `benchmark_scores`, `benchmark_trends`.

| Feature | Detail |
|---|---|
| **Benchmark Scorecards™** | 10 categories: Org Trust · Vendor Trust · Risk · Controls · Audit · Compliance · Privacy · Contract · Issues · Workflow |
| **Percentile Engine™** | Normal-distribution percentile vs industry baseline (10th–99th) |
| **Governance Rankings™** | Top 1% → At Risk labels with maturity level (Reactive → Trust Leader) |
| **Benchmark Trends™** | 6-month monthly sparkline trend per category |
| **AI Benchmark Analyst™** | Executive report · Industry Insights · Improvement Planner™ · NL chat |
| **Industry Baselines™** | Seeded at migration time — Technology, Financial Services, Healthcare, Manufacturing, Professional Services, All |
| **REST API** | 4 endpoints: GET /api/v1/benchmarking · /trust · /vendors · /rankings |
| **Phase 1 works immediately** | Uses AUDT internal module scores; no waiting for network scale |

- Pure engine: `lib/services/benchmarking-score.ts` — `computeBenchmark(orgScores, baselines)` → BenchmarkResult
- Service: `lib/services/benchmarking/benchmarking-service.ts`
- AI service: `lib/services/benchmarking/ai-benchmarking-service.ts`
- Repo: `lib/repositories/benchmarking-repo.ts`
- Actions: `lib/benchmarking/actions.ts`
- Migration: `supabase/migrations/0021_benchmarking.sql` ✅ APPLIED
- Routes: `/benchmarking/*` (6 pages: Dashboard · Vendor Trust · Risk & Controls · Compliance · Rankings · AI Analyst)
- Seed: `node scripts/seed-benchmarking.mjs`

### Module 17A — Integration Hub™ ✅ Complete (2026-06-11)

Connected Governance Platform — connectivity layer for the entire AUDT Governance OS. 8 new tables: `integration_registry`, `integration_instances`, `integration_credentials`, `integration_syncs`, `integration_logs`, `integration_events`, `integration_mappings`, `integration_webhooks`. 35+ connectors seeded in catalog.

| Feature | Detail |
|---|---|
| **Connector Marketplace™** | 35+ connectors across 11 categories: Identity · Cloud · Security · Source Control · Project Mgmt · ITSM · Endpoint · Communication · HR · Storage · Custom |
| **Phase 1 Connectors** | 8 connectors covering ~80% of prospect requirements: Entra ID · Okta · Google Workspace · AWS · GitHub · Jira · Slack · CrowdStrike · Microsoft Defender |
| **Integration Manager™** | Connect / Disconnect / Reconnect with encrypted credential storage (AES-256-GCM) |
| **Sync Engine™** | Incremental & full syncs with simulated connector results, sync history, success metrics |
| **Evidence Collection™** | Auto-collect governance evidence from connected systems (MFA, encryption, branch protection, etc.) |
| **Continuous Monitoring™** | Governance events generated from syncs: risks, control failures, misconfigurations |
| **Connection Health™** | Per-integration health dashboard — records synced, evidence collected, risks generated |
| **Webhook Engine™** | Inbound + outbound webhooks with event type routing, active/inactive toggle |
| **AI Integration Advisor™** | Executive health summary · Connector Recommendations™ · Coverage Gap Analysis™ · NL chat |
| **REST API** | 3 endpoints: GET /api/v1/integrations · GET /api/v1/integrations/syncs · GET /api/v1/integrations/health |

- Service: `lib/services/integration-hub/integration-service.ts`
- AI service: `lib/services/integration-hub/ai-integration-service.ts`
- Repo: `lib/repositories/integration-hub-repo.ts`
- Actions: `lib/integration-hub/actions.ts`
- Migration: `supabase/migrations/0022_integration_hub.sql` ✅ APPLIED
- Routes: `/integration-hub/*` (6 pages: Dashboard · Marketplace · Connections · Sync History · Webhooks · AI Advisor)
- Seed: `node scripts/seed-integration-hub.mjs`

Trust Network layer. 9 new tables: `trust_profiles`, `trust_documents`, `trust_shares`, `trust_questionnaires`, `trust_answers`, `trust_verifications`, `trust_badges`, `trust_relationships`, `trust_activity`.

| Feature | Detail |
|---|---|
| **Trust Profile™** | Public-facing trust passport — displayName, tagline, description, industry, companySize, country, website, visibility, profileCompleteness |
| **Evidence Exchange™** | Trust documents with configurable visibility (private/specific/network/public), expiry tracking, AI risk analysis |
| **Document Verification™** | AI or peer verification; Verified badge on confirmed documents |
| **Trust Badges™** | 8 badge types + custom; issue and revoke |
| **Questionnaire Exchange™** | Fill once, share many; completion % tracking; AI answer suggestions |
| **Vendor Trust Directory™** | Searchable public directory of published profiles |
| **AI Trust Analyst™** | Cached trust summary, per-document analysis, questionnaire suggestions, NL chat |
| **REST API** | 3 endpoints: GET /api/v1/trust-exchange · GET/POST /api/v1/trust-exchange/documents · GET /api/v1/trust-exchange/directory |

- Service: `lib/services/trust-exchange/trust-exchange-service.ts`
- AI service: `lib/services/trust-exchange/ai-trust-exchange-service.ts`
- Repo: `lib/repositories/trust-exchange-repo.ts`
- Actions: `lib/trust-exchange/actions.ts`
- Migration: `supabase/migrations/0020_trust_exchange.sql`
- Routes: `/trust-exchange/*` (8 pages)

### Module 18 — Trust Network™ ✅ Complete (2026-06-11)

Public Trust Infrastructure — platform layer aggregating Trust Exchange™, Benchmarking™, Integration Hub™, Trust Intelligence™, and Trust Graph™ into a unified external trust presence. No separate DB (reads from existing tables) + 2 new tables for network tracking.

| Feature | Detail |
|---|---|
| **Trust Network Reputation™** | 5-component 0–100 score: profile quality (25%) + benchmark percentile (20%) + automation coverage (20%) + org trust score (20%) + network activity (15%) |
| **Public Trust Profile 2.0** | Trust Score™ + Privacy Trust™ + Governance Maturity™ + Benchmark Position™ + Automation Transparency™ |
| **Governance Maturity™** | 6-level ladder (Reactive → Trust Leader), powered by Benchmarking™ |
| **Industry Ranking™** | Percentile bar + Top Quartile badge, powered by Benchmarking™ |
| **Automation Transparency™** | Evidence automation % + monitoring coverage % + connected systems, powered by Integration Hub™ |
| **Network Directory** | Browse all published Trust Profiles |
| **Trust Relationships™** | Org-to-org relationship registry with type/status breakdown |
| **Trust Activity Feed™** | Timeline of all trust network events |
| **Network Follow Graph** | Follow/unfollow orgs; follower/following counts |
| **Profile View Tracking** | 30-day profile view counts |
| **AI Trust Network Advisor™** | Executive summary + Network Improvement Plan™ (4 actions) + NL chat |
| **REST API** | `GET /api/v1/trust-network` (dashboard / directory / relationships views) |

- Service: `lib/services/trust-network/trust-network-service.ts`
- AI service: `lib/services/trust-network/ai-trust-network-service.ts`
- Repo: `lib/repositories/trust-network-repo.ts`
- Actions: `lib/trust-network/actions.ts`
- Migration: `supabase/migrations/0023_trust_network.sql` ✅ APPLIED
- Routes: `/trust-network/*` (6 pages: Dashboard · Profile · Directory · Relationships · Activity · AI Advisor)

### Module 19 — Executive Reporting & Analytics™ ✅ Complete (2026-06-12)

Executive command center with role-specific dashboards, board reporting, predictive forecasting, and governance scorecards. 9 new tables: `analytics_dashboards`, `analytics_widgets`, `analytics_reports`, `analytics_schedules`, `analytics_snapshots`, `analytics_exports`, `analytics_forecasts`, `analytics_subscriptions`, `analytics_kpis`.

| Feature | Detail |
|---|---|
| **Executive Dashboards™** | 6 role views: CEO · CRO · CISO · Compliance · Board · Custom — each shows role-relevant KPI subset |
| **Analytics Hub™** | Cross-module KPI analytics with 6 category group cards + 90-day snapshot history |
| **Board Reports™** | 8 pre-built report types: Board Governance · Risk Committee · Audit Committee · Privacy · Vendor · Contract · Executive · Trust Intelligence |
| **Scheduled Reports™** | Recurring report delivery — weekly/monthly/quarterly; per-schedule active/paused toggle |
| **Predictive Analytics™** | AI-powered forecasting at 30/90/180-day horizons for org trust, control health, open risks |
| **Executive Scorecards™** | 6 domain scorecards with On Track / Monitor / Attention status |
| **AI Executive Analyst™** | Executive summary (cached 24h) · Board report generator · Trend Analyst™ · Governance Copilot™ NL chat |
| **KPI Engine™** | 10 live KPIs computed via parallel queries: org trust, vendors, risks, control health, findings, CAPAs, frameworks, alerts, issues, contracts |

- Pure KPI engine: `lib/services/executive-reporting/executive-reporting-service.ts` — `computeKpis()`, `getDashboardData()`, `generateReport()`, `generateForecasts()`, `takeSnapshot()`
- AI service: `lib/services/executive-reporting/ai-executive-reporting-service.ts` — `generateExecutiveSummary()` (cached 24h), `generateBoardReport()`, `generateTrendAnalysis()`, `chat()`
- Repo: `lib/repositories/executive-reporting-repo.ts` — KPI upsert, snapshot history, reports, schedules, forecasts
- Actions: `lib/executive-reporting/actions.ts` — all server actions
- Migration: `supabase/migrations/0024_executive_reporting.sql` ✅ APPLIED
- Routes: `/executive-reporting/*` (7 pages: Hub · Dashboard/[type] · Analytics · Board Reports · Scheduled · Forecasts · Scorecards · AI)
- Seed: `node scripts/seed-executive-reporting.mjs`

### Module 20 — AI Governance™ ✅ Complete (2026-06-13)

Responsible AI governance platform for managing AI systems, risks, controls, vendors, compliance frameworks, and incidents. 11 new tables: `ai_systems`, `ai_vendors`, `ai_risks`, `ai_controls`, `ai_policies`, `ai_assessments`, `ai_incidents`, `ai_compliance`, `ai_trust_scores`, `ai_system_controls`, `ai_system_risks`.

| Feature | Detail |
|---|---|
| **AI System Inventory™** | Registry of all AI systems — type, vendor, risk classification, deployment env, approval status, AI Trust Score™ |
| **AI Trust Score™** | 6-component 0–100 engine: Risk(25%) + Controls(25%) + Compliance(20%) + Monitoring(15%) + Vendor(10%) + Incidents(5%); trust levels Trusted→Restricted |
| **AI Risk Register™** | 13 risk categories: hallucination, bias, privacy leakage, copyright risk, prompt injection, data poisoning, model drift, regulatory risk, security risk, vendor dependency, explainability risk, autonomous decision risk, other |
| **AI Controls™** | 11 control categories: human oversight, output review, prompt logging, model approval, data classification, access control, vendor review, model monitoring, content filtering, red team testing, other |
| **AI Vendor Cards™** | AI vendor registry with privacy/security posture indicators and contract status |
| **AI Compliance™** | 6 frameworks: ISO 42001, NIST AI RMF, EU AI Act, OECD AI Principles, DPDP AI, Internal — readiness scores + progress bars |
| **AI Incident Tracker™** | Full incident lifecycle: open → investigating → contained → resolved — severity badges, root cause, remediation |
| **AI Governance Copilot™** | Governance summary (cached 24h), AI Risk Advisory™ (5 recommendations), Compliance Readiness™ analysis, multi-turn NL chat |
| **REST API** | 3 endpoints: GET/POST /api/v1/ai/systems, risks, compliance |

- Service: `lib/services/ai-governance/ai-governance-service.ts`
- AI service: `lib/services/ai-governance/ai-copilot-service.ts`
- Repo: `lib/repositories/ai-governance-repo.ts`
- Actions: `lib/ai-governance/actions.ts`
- Migration: `supabase/migrations/0025_ai_governance.sql` ✅ APPLIED
- Routes: `/ai-governance/*` (8 pages: Hub · Inventory · Risks · Controls · Vendors · Compliance · Incidents · AI Copilot)
- Seed: `node scripts/seed-ai-governance.mjs`

### Module 21 — Auditor Collaboration™ ✅ Complete (2026-06-13)

External auditor engagement platform — secure audit rooms, evidence exchange, external findings, assessment projects, and AI audit readiness analysis.

| Feature | Detail |
|---|---|
| **Audit Room™** | Scoped workspace per audit engagement — ISO 27001, SOC 2, DPDP, AI Governance, custom |
| **Evidence Exchange™** | Auditors request evidence; internal team submits, accepts, or rejects with notes |
| **External Findings™** | Auditors raise non-conformances, recommendations, and opportunities; internal team tracks remediation |
| **Assessment Projects™** | Track assessment progress: milestones, completion %, open findings, pending evidence per engagement |
| **Auditor User Management™** | Invite external auditors, assessors, legal counsel, and customer reviewers with room-level RBAC |
| **Auditor Organisations™** | Registry of audit firms, law firms, and consulting partners with specializations |
| **Room Documents™** | Share AUDT-generated documents (exports, PDFs, CSVs) directly into audit rooms |
| **Room Activity™** | Timestamped audit trail of all evidence requests, findings, submissions, and status changes |
| **Audit Reviews™** | Per-reviewer review assignments across controls, documents, AI systems, and policies |
| **AI Audit Advisor™** | AI-powered audit readiness summary (cached 24h), evidence gap analysis (top 5 gaps), AI finding drafter, multi-turn NL chat |
| **REST API** | 4 endpoints: GET/POST /api/v1/audit-rooms, evidence-requests, external-findings, external-users |

- Service: `lib/services/auditor-collaboration/auditor-collaboration-service.ts`
- AI service: `lib/services/auditor-collaboration/ai-auditor-service.ts`
- Repo: `lib/repositories/auditor-collaboration-repo.ts`
- Actions: `lib/auditor-collaboration/actions.ts`
- Migration: `supabase/migrations/0026_auditor_collaboration.sql` ✅ APPLIED
- Routes: `/auditor-collaboration/*` (9 pages: Hub · Rooms · Room Detail · Evidence · Findings · Users · Assessments · AI Advisor)
- Seed: `node scripts/seed-auditor-collaboration.mjs`

**Evidence request types:** `policy` · `control_test` · `audit_log` · `risk_register` · `vendor_assessment` · `privacy_record` · `contract` · `ai_assessment` · `custom`

**Finding types:** `non_conformance` · `minor_nc` · `major_nc` · `observation` · `recommendation` · `opportunity`

**Finding statuses:** `open` · `in_remediation` · `verified` · `closed` · `accepted`

**User types:** `iso_auditor` · `soc_auditor` · `dpdp_assessor` · `security_assessor` · `privacy_consultant` · `ai_governance_reviewer` · `customer_reviewer` · `third_party_reviewer`

**12 DB tables (migration 0026):** `auditor_organizations` · `external_users` · `audit_rooms` · `audit_room_documents` · `audit_room_activities` · `evidence_requests` · `evidence_responses` · `audit_reviews` · `external_comments` · `external_findings` · `external_assessments` · `external_permissions`

### Module 23 — Trust Verification Authority™ ✅ Complete (2026-06-13)

Transforms AUDT into a Trust Authority — verify, certify, publish, revoke, and validate trust. 12 new DB tables, 10 built-in programs, public `/verify/[id]` page.

| Feature | Detail |
|---|---|
| **Verification Programs™** | 10 built-in (AUDT Verified™, Trusted Vendor™, Privacy Ready™, AI Governed™, Risk Managed™, Enterprise Ready™, Audit Ready™, Compliance Ready™, DPDP Ready™, ISO Ready™) + custom |
| **9-step Workflow** | Application → Eligibility → Evidence Review → Control Validation → Risk Review → Assessment → Decision → Certificate Issued → Registry Published |
| **Verification Levels** | Level 1 (Verified) · Level 2 (Trusted) · Level 3 (Advanced) · Level 4 (Trust Leader) |
| **Trust Certificates™** | Auto-issued on approval; cert number `AUDT-YYYY-XXXXXX`; SHA-256 hash; public verify URL |
| **Public Verify Page** | `/verify/[id]` — no auth; shows Valid (green) or Revoked/Expired (red) with cert details |
| **Readiness Score™** | 7-component pure engine: trustScore(25%) + controlHealth(20%) + complianceCoverage(15%) + riskPosture(15%) + privacyTrust(10%) + aiGovernance(10%) + monitoringHealth(5%) |
| **Continuous Monitoring** | 7 auto-suspension rules; event feed; expiring certs alert |
| **Renewal Management™** | Auto-scheduled; due-soon alerts; Start Renewal workflow |
| **AI Verification Advisor™** | Platform summary (cached 24h) · eligibility analysis · NL chat |
| **REST API** | 7 endpoints — verifications, certificates, registry (public), trust-passports, verification-programs (public) |

- Pure engine: `lib/services/verification-readiness.ts`
- Service: `lib/services/trust-verification/trust-verification-service.ts`
- AI service: `lib/services/trust-verification/ai-trust-verification-service.ts`
- Repo: `lib/repositories/trust-verification-repo.ts`
- Actions: `lib/trust-verification/actions.ts`
- Migration: `supabase/migrations/0028_trust_verification_authority.sql`
- Routes: `/trust-verification/*` (12 pages) + `/verify/[id]` (public)
- Seed: `node scripts/seed-trust-verification.mjs`

**12 DB tables (migration 0028):** `verification_programs` · `tva_verifications` · `verification_reviews` · `verification_evidence` · `verification_badges` · `verification_certificates` · `verification_registry` · `verification_events` · `verification_renewals` · `verification_assessments` · `verification_decisions` · `verification_auditors`

**CRITICAL — `tva_verifications` naming:** The Trust Exchange module (migration 0020) already has a `trust_verifications` table (Drizzle export: `trustVerifications`). TVA uses `tva_verifications` (Drizzle export: `tvaVerifications`) to avoid the collision. Never rename this back.

### Module 22 — Trust API Platform™ ✅ Complete (2026-06-13)

Transforms AUDT from a Governance OS into Trust Infrastructure — 8 API products, webhooks, developer portal, AI API builder, and usage analytics.

| Feature | Detail |
|---|---|
| **API Client Registry™** | Register application/partner/internal clients with plan and contact email |
| **API Key Manager™** | Issue `tap_`-prefixed keys (bcrypt); reveal-once; per-key plan + permissions; usage counter |
| **API Product Catalog™** | 8 products: trust-score · vendor-trust · ai-trust · benchmarking · verification · trust-network · governance-insights · compliance-readiness |
| **Webhook Engine™** | Subscribe to 9 trust events; live HTTP delivery with 10s timeout; delivery log |
| **API Analytics™** | 30-day daily call volume, top endpoints, success rate |
| **AI API Builder™** | Gemini generates per-product docs, code samples, integration guides |
| **AI Integration Advisor™** | Platform health summary (cached 24h), top opportunities, 4 recommendations |
| **Public APIs** | 6 Bearer-authenticated public endpoints for external system consumption |

- Service: `lib/services/trust-api/trust-api-service.ts`
- AI service: `lib/services/trust-api/ai-trust-api-service.ts`
- Repo: `lib/repositories/trust-api-repo.ts`
- Actions: `lib/trust-api/actions.ts`
- Migration: `supabase/migrations/0027_trust_api_platform.sql` ✅ APPLIED
- Routes: `/trust-api/*` (7 pages: Hub · Catalog · Portal · Keys · Webhooks · Usage · AI)
- Seed: `node scripts/seed-trust-api-platform.mjs`

**API Plans:** Free (100/day) · Growth (10k/month) · Business (100k/month) · Enterprise (unlimited)

**9 DB tables (migration 0027, `tap_` prefix):** `tap_products` · `tap_clients` · `tap_api_keys` · `tap_subscriptions` · `tap_usage` · `tap_webhooks` · `tap_webhook_deliveries` · `tap_rate_limits` · `tap_audit_events`

**Key naming convention:** Raw keys use `tap_` prefix (e.g. `tap_0919bb5c…`), bcrypt-hashed for storage. `tap_products` is a global catalog (no RLS, no `organization_id`) — seeded by migration.

### Module 28 — Continuous Compliance™ ✅ Complete (2026-06-13)

Always-on compliance automation — closes the gap vs Vanta, Drata, Sprinto, Secureframe. 17 new tables, 21 prebuilt automated checks across AWS, Azure, GCP, GitHub, M365, Google Workspace, and Okta.

| Feature | Detail |
|---|---|
| **UI polish (2026-06-14)** | `CcSubNav` component migrated to standard pill nav; page heading `text-xl`; `space-y-6` spacing; retains root `p-6` (no `layout.tsx`, shell does not provide padding) |
| **Compliance Checks Library™** | 21 prebuilt checks + custom; categories: aws · azure · gcp · github · m365 · google_workspace · okta · network · endpoint · custom |
| **Evidence Automation™** | Check runs generate evidence automatically and link to compliance controls |
| **Control Validation Engine™** | Continuous validation of control effectiveness from check results |
| **Framework Mapping Engine™** | Map checks → controls → frameworks; continuous readiness score per framework |
| **Access Review Manager™** | Quarterly and privileged access certifications with per-user approve/revoke decisions |
| **Compliance Attestations™** | Policy attestations + sign-offs with completion % tracking |
| **Training Compliance™** | Security awareness and privacy training campaigns with assignment tracking |
| **Workforce Compliance™** | Onboarding, offboarding, and lifecycle events |
| **Compliance Signals™** | Auto-generated signals from all modules; severity-based prioritization |
| **Compliance Health™** | 5-component 0–100 score: checkSuccess(30%) + signalReduction(25%) + evidence(20%) + training(15%) + accessReviews(10%) |
| **Automation Rules™** | If-this-then-that governance automation triggers |
| **Continuous Readiness™** | Per-framework readiness snapshots updated on every check run |
| **AI Compliance Officer™** | Executive summary (cached 24h), per-check remediation guides, multi-turn NL chat |

- Service: `lib/services/continuous-compliance/continuous-compliance-service.ts`
- AI service: `lib/services/continuous-compliance/ai-continuous-compliance-service.ts`
- Repo: `lib/repositories/continuous-compliance-repo.ts`
- Actions: `lib/continuous-compliance/actions.ts`
- Migration: `supabase/migrations/0029_continuous_compliance.sql`
- Routes: `/continuous-compliance/*` (12 pages: Hub · Checks · Health · Readiness · Access Reviews · Attestations · Training · Workforce · Signals · Automation · AI Officer)
- Seed: `node scripts/seed-continuous-compliance.mjs`

**17 DB tables (migration 0029):** `compliance_checks` · `compliance_check_runs` · `compliance_evidence` · `control_validations` · `framework_mappings` · `access_reviews` · `access_review_users` · `attestations` · `attestation_responses` · `training_campaigns` · `training_assignments` · `workforce_events` · `compliance_signals` · `compliance_health_scores` · `compliance_exceptions` · `automation_rules` · `continuous_readiness`

**Built-in checks (21, `organization_id = NULL`):** aws-root-mfa · aws-no-root-keys · aws-s3-public · aws-cloudtrail · aws-iam-review · azure-mfa · azure-defender · azure-policy · gcp-org-policy · gcp-audit-logs · github-secret-scan · github-branch-protection · github-mfa · m365-mfa · m365-dlp · m365-audit · google-workspace-mfa · google-workspace-drive · okta-mfa · okta-inactive · okta-sso. All returned to every org via `OR organization_id IS NULL` repo query.

### Module 29 — Governance Agent Framework™ ✅ Complete (2026-06-13)

AI agents that continuously monitor, reason, and act across the entire AUDT governance posture. Transforms AUDT from a record-keeping system into a proactive governance intelligence platform.

| Feature | Detail |
|---|---|
| **UI polish (2026-06-14)** | `AgentSubNav` migrated to standard pill nav; `lib/agents/utils.ts` added for `fmtDate()`/`fmtDuration()` (extracted from `"use client"` module to fix Next.js server-boundary error); page headings `text-xl`; `space-y-6` spacing |
| **Agent Registry™** | 6 agent types: risk_monitor · vendor_watch · compliance_guardian · policy_enforcer · audit_prep · custom. Execution modes: scheduled · realtime · manual |
| **Agent Studio™** | Create/configure custom governance agents — module scope, rules, thresholds, schedule |
| **Agent Runs™** | Full execution history — duration, observations generated, recommendations created, actions taken |
| **Observations™** | Governance signals with severity (critical/high/medium/low/info), status, source module, linked entity |
| **Recommendations™** | Prioritized AI actions: priority, confidence 0–100, impact/effort labels, suggested action steps, Accept/Dismiss |
| **Agent Actions™** | Proposed actions requiring human approval — Approve/Reject queue. No autonomous mutations |
| **Orchestration™** | Multi-agent governance pipelines — sequence agents, pass observations, orchestration run log |
| **Analytics™** | Success rate, MTTR improvement, automation coverage %, observations per run, acceptance rate |
| **Governance Copilot™** | Multi-turn NL chat — ask anything about governance posture |
| **Hub page** | KPI strip + recent runs + recent observations + pending approvals callout + 9-card module nav |

- Service: `lib/services/governance-agents/agent-service.ts`
- AI service: `lib/services/governance-agents/ai-agent-service.ts`
- Repo: `lib/repositories/governance-agents-repo.ts`
- Actions: `lib/agents/actions.ts`
- Migration: `supabase/migrations/0030_governance_agents.sql`
- Routes: `/agents/*` (10 pages: Hub · Registry · Studio · Runs · Observations · Recommendations · Actions · Orchestration · Analytics · Copilot™)
- Seed: `node scripts/seed-governance-agents.mjs`

**17 DB tables (migration 0030):** `governance_agents` · `agent_runs` · `agent_observations` · `agent_recommendations` · `agent_actions` · `agent_orchestrations` · `agent_metrics` · `agent_schedules` · `agent_triggers` · `agent_run_steps` · `agent_events` · `agent_knowledge` · `agent_policies` · `agent_permissions` · `agent_audit_log` · `agent_integrations` · `agent_templates`

### Module 30 — Regulatory Intelligence™ ✅ Complete (2026-06-14)

Always-current regulatory tracking for India (DPDP, RBI, SEBI, IRDAI) and global (GDPR, HIPAA, PCI DSS, ISO 27001, EU AI Act, NIST, DORA, NIS2, SOX) frameworks. 14 new tables, 18 built-in regulations seeded at migration time.

| Feature | Detail |
|---|---|
| **Regulation Library™** | 18 built-in global regulations + org-specific; categories: data_privacy · financial · healthcare · cybersecurity · ai_governance · sector_specific; jurisdiction field; effective/deadline dates |
| **Change Monitor™** | Track regulatory amendments with severity (critical/high/medium/low) and status workflow (new→under_review→assessed→actioned→closed) |
| **Obligations™** | Extract and track compliance obligations per regulation — priority, implementation status (not_started→in_progress→implemented→validated), owner, due date |
| **Impact Assessments™** | Per-change impact assessments with impact level and summary; linked to change + regulation |
| **Watchlists™** | Monitor specific regulations with suggested watchlists for quick setup |
| **Compliance Horizon™** | AI-powered 4-panel forecast: emerging regulatory risks · upcoming deadlines · global trends · recommended actions (cached 24h) |
| **Regulatory Readiness Score™** | (implemented + validated obligations) / total obligations × 100 — live on hub dashboard |
| **AI Regulatory Advisor™** | Cached 24h advisory summary, per-change AI analysis (keyChanges + requiredActions + impactAreas), obligation extraction, control mapping suggestions, NL chat |
| **REST API** | 5 endpoints: GET /api/v1/regulations, GET/POST /api/v1/obligations, GET /api/v1/regulatory-changes, GET/POST /api/v1/regulatory-assessments, GET /api/v1/regulatory-readiness |
| **Global built-ins** | 18 regulations seeded with `organization_id = NULL`; returned to all orgs via `OR organization_id IS NULL` repo query |

- Service: `lib/services/regulatory-intelligence/regulatory-service.ts`
- AI service: `lib/services/regulatory-intelligence/ai-regulatory-service.ts`
- Repo: `lib/repositories/regulatory-intelligence-repo.ts`
- Actions: `lib/regulatory-intelligence/actions.ts`
- Migration: `supabase/migrations/0031_regulatory_intelligence.sql`
- Routes: `/regulatory-intelligence/*` (8 pages: Hub · Library · Change Monitor · Obligations · Assessments · Watchlists · Horizon · AI Advisor)
- Seed: `node scripts/seed-regulatory-intelligence.mjs`

**14 DB tables (migration 0031):** `regulations` · `regulation_versions` · `regulatory_changes` · `obligations` · `obligation_mappings` · `regulatory_assessments` · `regulatory_impacts` · `regulatory_reviews` · `regulatory_alerts` · `regulatory_watchlists` · `regulatory_sources` · `regulatory_agents` (Drizzle: `regulatoryAgentConfig`) · `regulatory_tasks` · `regulatory_updates`

**Built-in regulations (18, `organization_id = NULL`):** DPDP Act 2023 · GDPR · CCPA · HIPAA · ISO 27001 · ISO 27701 · ISO 42001 · NIST CSF · NIST AI RMF · PCI DSS · DORA · NIS2 · SOX · RBI CSF · SEBI CSCRF · IRDAI ICS · EU AI Act · SOC 2 Type II. All returned to every org via `OR organization_id IS NULL` repo query.

**CRITICAL — `regulatory_agents` table naming:** Drizzle table is `pgTable("regulatory_agents", ...)` (DB table name is `regulatory_agents`) but the TypeScript export is `regulatoryAgentConfig`. Use `regulatoryAgentConfig` in Drizzle queries. Do not confuse with `governance_agents` from Module 29.

### Module 31 — Asset Intelligence™ ✅ Complete (2026-06-16)

Enterprise Asset Graph & Trust Mapping Platform — master inventory connecting every governance entity to enterprise assets. 20 new tables, 7 enums, 30 demo assets (8 apps, 5 databases, 6 cloud, 7 data assets, 4 processes).

| Feature | Detail |
|---|---|
| **Asset Registry™** | Full CRUD asset registry — 12 asset types: application · database · api · server · cloud_resource · data_asset · business_process · ai_system · vendor_service · network_asset · endpoint · custom |
| **Asset Trust Score™** | 6-component 0–100 engine: security controls (25%) + compliance coverage (20%) + risk posture (20%) + data protection (15%) + operational health (10%) + monitoring coverage (10%) |
| **Data Asset Catalog™** | PII/sensitive data tracking with DPDP regulation link, data classification badge |
| **Asset Relationships™** | Dependency graph: depends_on · contains · processes · hosts · accesses · connects_to · backs_up · replicates · manages · integrates_with |
| **Asset Alerts™** | Auto-generated alerts for critical assets missing owner/risk-assessment/controls/classification; severity triage |
| **AI Asset Advisor™** | Advisory summary (cached 24h), impact analyzer, dependency chain analyzer, multi-turn NL chat |
| **REST API** | GET/POST `/api/v1/assets` — Bearer auth, `read_write` for POST |

- Service: `lib/services/asset-intelligence/asset-service.ts`
- AI service: `lib/services/asset-intelligence/ai-asset-service.ts`
- Repo: `lib/repositories/asset-intelligence-repo.ts`
- Actions: `lib/asset-intelligence/actions.ts`
- Migration: `supabase/migrations/0032_asset_intelligence.sql`
- Routes: `/asset-intelligence/*` (6 pages: Hub · Registry™ · Data Assets™ · Relationships™ · Alerts · AI Advisor™)
- Seed: `node scripts/seed-asset-intelligence.mjs` — 30 assets · 4 alerts · 6 relationships

**20 DB tables (migration 0032):** `assets` · `asset_types` · `asset_owners` · `asset_tags` · `asset_relationships` · `asset_dependencies` · `asset_reviews` · `asset_scores` · `asset_alerts` · `asset_data_flows` · `asset_incidents` · `asset_snapshots` + 7 junction tables: `asset_risks` · `asset_controls` · `asset_vendors` · `asset_contracts` · `asset_regulations` · `asset_ai_systems` · `asset_criticality_log`

**7 enums:** `asset_type_enum` · `asset_criticality_enum` · `asset_status_enum` · `asset_environment_enum` · `asset_data_class_enum` · `asset_relationship_type_enum` · `asset_alert_type_enum`

**RLS helper:** `is_asset_member(p_asset_id UUID)` — validates org membership via asset lookup. Used by all junction table RLS policies.

**CRITICAL — seed org selection:** Seed script uses `SELECT organization_id FROM memberships GROUP BY organization_id ORDER BY count(*) DESC LIMIT 1` to target the most-active org (not `SELECT id FROM organizations LIMIT 1` which returns the E2E test org first).

### Module 32 — Security Command Center™ ✅ Complete (2026-06-16)

Enterprise security platform transforming AUDT into an enterprise-grade system for Banking, Fintech, Healthcare, and regulated industries. 21 new tables, 9 enums, 8 security phases.

| Feature | Detail |
|---|---|
| **MFA Management™** | TOTP enrollment tracking, per-org enforcement modes (optional/required_admins/required_all), remember-device policy, per-user status table |
| **Enterprise SSO™** | Entra ID · Okta · Google Workspace · Ping Identity · SAML 2.0 · OIDC; JIT provisioning, default role, domain verification |
| **Session Management™** | Active sessions per org with IP, browser, device, country; revoke individual or all sessions for a user |
| **IP Allow Lists™** | CIDR-based IP rules scoped to all/login/api/compliance/vendors resources; enable/disable per rule |
| **Fine-Grained Permissions™** | 20 built-in global permissions + org-level role overrides + per-user overrides |
| **Evidence Protection™** | Expiring share links (view_only/download/api), watermarking config, access log per share |
| **AI Security Governance™** | Prompt audit trail with sensitivity classification (clean/low/medium/high), PII detection, blocked prompt tracking, 30-day usage stats |
| **Customer Managed Encryption™** | AWS KMS · Azure Key Vault · Google KMS provider registry with audit log |
| **Public Trust Center™** | Per-org trust center config — title, tagline, description, security email, show/hide trust score/certs/documents |
| **Continuous Vendor Monitoring™** | Domain / SSL / reputation / certificate monitoring assets per vendor; alert lifecycle (open → acknowledged → resolved) |
| **Security Readiness Score™** | 5-component 0–100: mfaScore(30%) + ssoScore(20%) + ipScore(15%) + monScore(20%) + aiScore(15%). Levels: Enterprise Ready(≥90) · Strong(≥75) · Moderate(≥60) · Needs Attention(≥40) · Critical |
| **AI Security Advisor™** | Advisory summary (cached 24h), 5 prioritized recommendations, multi-turn NL chat |

- Service: `lib/services/security-command-center/security-service.ts`
- AI service: `lib/services/security-command-center/ai-security-service.ts`
- Repo: `lib/repositories/security-command-center-repo.ts`
- Actions: `lib/security-command-center/actions.ts`
- Migration: `supabase/migrations/0033_security_command_center.sql`
- Routes: `/security-center/*` (10 pages: Hub · Identity · Sessions · Access · Evidence · AI · Encryption · Trust Center · Monitoring · Reports)
- Seed: `node scripts/seed-security-command-center.mjs`

**21 DB tables (migration 0033):** `security_mfa_settings` (UNIQUE org) · `user_mfa_status` (UNIQUE user+org) · `sso_providers` · `sso_domains` (UNIQUE org+domain) · `user_sessions` · `ip_allowlists` · `security_permissions` (global, no org_id) · `security_role_permissions` (UNIQUE org+role+key) · `security_user_permissions` (UNIQUE org+user+key) · `evidence_shares` · `evidence_access_logs` · `evidence_watermarks` (UNIQUE org) · `ai_prompt_logs` · `encryption_providers` · `customer_keys` · `encryption_audit_logs` · `trust_center_config` (UNIQUE org) · `trust_center_documents` · `vendor_monitoring_assets` · `vendor_monitoring_events` · `vendor_monitoring_alerts`

**9 enums:** `mfa_enforcement_enum` · `sso_provider_type_enum` · `session_status_enum` · `ip_allowlist_resource_enum` · `evidence_share_access_enum` · `ai_prompt_sensitivity_enum` · `encryption_provider_type_enum` · `vendor_monitor_check_enum` · `vendor_monitor_severity_enum`

**CRITICAL — Security Readiness Score:** `computeSecurityReadiness(metrics)` is a pure function in `security-service.ts`. Call it with the metrics object from `getDashboardData()`. Never call it with partial metrics — all 6 keys required: `mfaPercent`, `ssoActive`, `ipRules`, `activeSessions`, `openMonAlerts`, `criticalMonAlerts`, `blockedPrompts`.

**CRITICAL — `security_permissions` global table:** Has no `organization_id` column. RLS policy is SELECT-only for authenticated users (all orgs can read). Never add org-scoped data to this table. Org-level permission overrides go in `security_role_permissions` and `security_user_permissions`.

| Next Module | Description | Status |
|---|---|---|
| Control Center™ | Control library, Control Health™, testing, AI advisor | ✅ Complete (2026-06-07) |
| Policy Governance™ | Full policy lifecycle, versioning, attestations, Policy Health™ | ✅ Complete (2026-06-09) |
| DPDP Privacy™ | India DPDP Act 2023 — data inventory, consent, retention, DSR, PIA | ✅ Complete (2026-06-09) |
| Contract Governance™ | Contract lifecycle, expiry, obligation tracking, AI analysis | ✅ Complete (2026-06-10) |
| Issue & Remediation Hub™ | Centralized governance execution — issues, tasks, exceptions, SLAs, AI | ✅ Complete (2026-06-10) |
| Workflow Studio™ | Governance automation engine — workflows, approvals, AI generator | ✅ Complete (2026-06-10) |
| Third-Party Risk Exchange™ | Trust Network — vendor trust profiles, evidence exchange, badges, directory, AI trust scoring | ✅ Complete (2026-06-11) |
| Executive Reporting & Analytics™ | Role dashboards, board reports, forecasting, scorecards, AI executive analyst | ✅ Complete (2026-06-12) |
| AI Governance™ | AI model risk, responsible AI frameworks, EU AI Act | ✅ Complete (2026-06-13) |
| Auditor Collaboration™ | External auditor rooms, evidence exchange, findings, AI readiness advisor | ✅ Complete (2026-06-13) |
| Trust API Platform™ | Trust-as-infrastructure — API products, webhooks, developer portal, AI API builder | ✅ Complete (2026-06-13) |
| Continuous Compliance™ | Always-on compliance — 21 automated checks, evidence automation, access reviews, attestations, training, AI Officer™ | ✅ Complete (2026-06-13) |
| Governance Agent Framework™ | AI agents that continuously monitor, reason, and act — observations, recommendations, human-approved actions | ✅ Complete (2026-06-13) |
| Regulatory Intelligence™ | Always-current regulatory tracking — 18 built-in regulations, change monitor, obligations, AI horizon, readiness score | ✅ Complete (2026-06-14) |
| Asset Intelligence™ | Enterprise Asset Graph & Trust Mapping — 30-asset registry, dependency graph, PII tracking, alerts, AI advisor | ✅ Complete (2026-06-16) |
| Security Command Center™ | Enterprise security platform — MFA, SSO, sessions, IP allow lists, evidence protection, AI security, CMK, trust center, vendor monitoring | ✅ Complete (2026-06-16) |
| Governance OS | Full category vision — system of record for organizational trust | Vision |

### Infrastructure (complete)

| Item | Status |
|---|---|
| Provider layer — auth, AI, storage, crypto, rate-limit | ✅ Done |
| AES-256-GCM integration config encryption | ✅ Done |
| REST API v1 — 26 endpoints (read-only + CRUD across audits/findings/CAPAs/risks/treatments/reviews + Trust Intelligence + CSV exports) | ✅ Done |
| API key auth middleware (bcrypt Bearer validation) | ✅ Done |
| DB connection pool config (max=10, idle/connect timeouts) | ✅ Done |
| DB SSL — `ssl:"require"` (TLS enforced, no cert chain verification) | ✅ Done |
| In-memory rate limiting (100/300/1000 per 60s) | ✅ Done |
| compliance-documents private bucket + tenant-prefixed paths | ✅ Done |
| storage_providers registry table (future S3/Azure/SharePoint) | ✅ Done |
| Data Governance module (/settings/data-governance) | ✅ Done |
| Audit Management module (/audits/*) | ✅ Done |
| Risk Lens™ module (/risks/*) | ✅ Done |
| Control Center™ module (/controls/*) | ✅ Done |
| Trust Intelligence™ module (/trust-intelligence/*) | ✅ Done |
| Redis-backed rate limiting (multi-instance) | Roadmap |
| S3 storage provider (`lib/providers/storage/s3.ts`) | ⚠ Pending — awaiting AWS provisioning |
| SUPABASE_SERVICE_ROLE_KEY configured | ⚠ Pending — team invite blocked |
| RESEND_API_KEY set in Vercel | ⚠ Pending — email alerts won't send |
| CRON_SECRET set in Vercel | ⚠ Pending — cron endpoints unprotected |

---

## 11. Critical Caveats & Gotchas

| Issue | Detail |
|---|---|
| **Lazy DB Proxy** | `lib/db/index.ts` defers `postgres()` to runtime. Never revert. Breaks Vercel build if reverted. |
| **`proxy.ts`** | Next 16 renamed `middleware.ts` → `proxy.ts`. Session refresh + route guards live here. `/api/v1/*` is excluded — API routes handle their own auth. |
| **`force-dynamic`** | Every protected page needs `export const dynamic = "force-dynamic"`. |
| **PDF routes** | Use `await import("@react-pdf/renderer")` (dynamic ESM). Wrap buffer as `new Uint8Array(buffer)`. |
| **Supabase pooler** | Use `aws-1-ap-south-1.pooler.supabase.com`. Direct host is IPv6-only, fails locally. |
| **DB SSL must be `"require"` not `rejectUnauthorized:true`** | Supabase Supavisor's TLS certificate is NOT in Node.js's default CA bundle. Setting `rejectUnauthorized:true` causes `SELF_SIGNED_CERT_IN_CHAIN` and crashes every DB query on Vercel with a 500. Always use `ssl:"require"` — it enforces TLS encryption without cert chain verification. This is what `lib/db/index.ts` uses and it must stay that way. |
| **Signup confirmation flow** | `signUp()` checks `data.session`. If null (Supabase "Confirm email" ON), redirects to `/signup/confirm` instead of `/onboarding`. If session exists (confirm email OFF), goes straight to onboarding. |
| **Confirm email** | Must be OFF in Supabase Auth for sandbox. |
| **Service role key** | `SUPABASE_SERVICE_ROLE_KEY` is placeholder — team invite will throw until set. |
| **Provider rule** | `@supabase/supabase-js` (admin) and `@google/genai` are ONLY imported inside `lib/providers/`. If you import them in a service, you've violated the boundary. |
| **ENCRYPTION_KEY** | Must be set in Vercel env vars and `.env.local`. App hard-fails at runtime if missing. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| **API key hash** | `api-key-repo.ts` never returns `keyHash` to callers (excluded from SELECT). Never add it back. |
| **Integration config** | `integration-repo.ts` transparently encrypts on write and decrypts on read. Config rows without `_enc` key are returned as-is (backwards compat). |
| **bcrypt API key validation** | `validateApiKey()` is intentionally slow (~100ms). The rate limiter sits above it — don't add caching that bypasses the bcrypt step. |
| **`.claude/settings.local.json`** | Gitignored — never commit. |
| **Drizzle migration naming** | Always use `npm run db:generate` then `npm run db:migrate`. Never manually create migration files without registering in `_journal.json`. |
| **AI provider singleton** | `lib/providers/ai/index.ts` holds a module-level `_ai` variable. It's reset on server restart — this is fine for Vercel serverless. Do not add shared mutable state beyond this. |
| **Compliance readiness recompute** | `recomputeReadiness()` is fire-and-forget (`.catch(() => {})`). Stale scores are acceptable. |
| **PDF CSS** | react-pdf v4 does NOT support `gap`, `border` shorthand, `paddingHorizontal/Vertical`. Use explicit longhand. |
| **Scoring module** | Pure functions in `lib/services/scoring.ts` — separate from `vendor-service.ts` so client components can import without pulling in DB. |
| **Storage bucket routing** | `lib/storage/server.ts` auto-detects bucket from path prefix: `tenant_` prefix → `compliance-documents`; plain UUID prefix → legacy `vendor-documents`. Never hardcode a bucket name in services. Use `buildVendorDocPath()` for new uploads — it generates the `tenant_` prefix automatically. |
| **StorageProvider interface** | Methods are `uploadFile`, `downloadFile`, `deleteFile`, `generateSignedUrl`, `exists`. Old names (`download`, `delete`, `signedUrl`) no longer exist — don't use them. |
| **Trust Score™ auto-refresh** | Page load triggers `computeAndSaveTrustScore()` only when `trust_score_at` is null or >1h stale. The service writes to both `vendor_trust_history` and `vendors.trust_score`. Never call `saveTrustScore()` without also computing via `computeTrustScore()` — the history row must match the cached column. |
| **Trust Score `breakdown` prop** | `TrustScoreWidget` accepts a `breakdown` prop (server-computed on page load). If null, the widget shows the cached `trustScore` number but no bar breakdown — the user must click Recalculate to regenerate. |
| **Risk Lens Drizzle column names** | `riskTreatmentStatus("status")` — the first arg is the DB column name. Compliance module uses `columnEnum("status")`; audit module uses prefixed names. Risk Lens follows compliance pattern: always `("status")`. Using `("risk_treatment_status")` references a non-existent column and causes 500s. |
| **Risk enum values** | Actual DB enums: category=`cyber_security` (not `cyber`), source=`audit_finding`/`compliance_gap`/`vendor` (not `audit`/`gap_analysis`/`assessment`). Check `seed-risk-lens.mjs` for all valid values. |
| **audit_findings column names** | The severity column is `finding_severity` (not `severity`) and status is `finding_status` (not `status`). Risk Lens seed uses these correct names. |
| **`controls.frameworkId` now nullable** | Migration 0011 dropped NOT NULL on `framework_id`. All 174 compliance controls still have a frameworkId. New Control Center™ standalone controls may have `frameworkId = null`. Everywhere `recomputeReadiness()` is called after a control mutation, guard with `if (control.frameworkId)` — missing this guard causes a crash trying to pass `null` to the framework service. |
| **Control Health™ AI cache key** | `ai-control-service.ts` uses `aiComplianceInsights` table. The `targetId` field is NOT NULL — executive summary uses `orgId` as targetId; per-control narrative uses `control.id`. Never call `getCached()` or `saveCache()` without a valid UUID for `targetId`. |
| **`auditFindings.status` vs `finding_status`** | In Drizzle schema, the TypeScript field is `.status` (the Drizzle field name) even though the DB column is `finding_status`. Use `auditFindings.status` in Drizzle queries — NOT `auditFindings.findingStatus` or `auditFindings.finding_status`. |
| **Analytics tables use `org_id` not `organization_id`** | All 9 analytics tables (`analytics_kpis`, `analytics_snapshots`, `analytics_reports`, `analytics_schedules`, `analytics_forecasts`, etc.) use `org_id` as the FK column name — unlike most other AUDT tables which use `organization_id`. Seed scripts and raw SQL queries must use `org_id`. ON CONFLICT clauses use `(org_id, kpi_key)` and `(org_id, snapshot_date)`. |
| **Standard module nav pattern (2026-06-14)** | All 30 modules use the pill nav: `rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-1` container + `shrink-0 rounded-xl px-4 py-2 text-sm font-medium` links. Active = `bg-white/[0.08] text-[var(--color-ink)]`. Inactive = `text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]`. Modules with `layout.tsx` define the nav there (`"use client"` + `usePathname`). CC and Agents use inline `CcSubNav`/`AgentSubNav` components. **Do not add `p-6` to pages inside a `layout.tsx` module** — the app shell `<main>` already provides `p-5 md:p-8`. CC/Agents pages retain `p-6` because they have no layout wrapper. |
| **Standard page heading / spacing** | All module hub and sub-pages use `font-[family-name:var(--font-display)] text-xl font-bold` (not `text-2xl`) and `space-y-6` root wrapper (not `space-y-8`). The one exception is `dashboard/page.tsx` line 411 which uses `text-2xl font-extrabold` for a data value display. |
| **Asset Intelligence™ encoding** | Asset Intelligence™ pages were written via PowerShell which corrupted UTF-8 `™` → `â„¢` and `—` → `â€"`. Fixed via binary byte replacement (`scripts/fix-encoding.py` + `scripts/fix-emdash.py`). If adding new asset-intelligence pages, write via the Write tool (not PowerShell `Set-Content`) to avoid re-corruption. |
| **`is_asset_member()` RLS helper** | Migration 0032 creates a `is_asset_member(p_asset_id UUID)` Postgres function for junction table RLS. All 7 junction tables (`asset_risks`, `asset_controls`, etc.) validate org membership via this function. Never add junction table RLS that bypasses this helper. |

---

## 12. Dev Commands Reference

```bash
# Development
npm run dev                    # Local server on :3000

# Build & Deploy
npm run build                  # tsc + Next.js production build
git push origin main           # Auto-deploys to Vercel

# Database
npm run db:generate            # Generate Drizzle migration
npm run db:migrate             # Apply all pending migrations
npm run db:studio              # Drizzle Studio GUI

# SQL utilities
node scripts/apply-sql.mjs supabase/rls.sql
node scripts/apply-sql.mjs supabase/storage.sql
node scripts/apply-sql.mjs supabase/migrations/0012_trust_intelligence.sql
node scripts/seed-templates.mjs
node scripts/seed-demo.mjs
node scripts/seed-billing-plans.mjs --assign-all
node scripts/seed-compliance-frameworks.mjs [orgId] [--list]
node scripts/seed-compliance-demo.mjs
node scripts/seed-e2e.mjs
node scripts/check-db.mjs
node scripts/seed-executive-reporting.mjs           # Executive Reporting™ KPIs, snapshots, reports, schedules, forecasts
node scripts/seed-ai-governance.mjs                # AI Governance™ — 8 AI systems, 5 vendors, 10 risks, 6 controls, 4 policies, 4 incidents, 6 compliance records
node scripts/seed-auditor-collaboration.mjs        # Auditor Collaboration™ — 3 auditor orgs, 8 external users, 4 audit rooms, 12 evidence requests, 8 findings

# Tests
npm run test                   # 201 Vitest tests
npm run test:coverage          # With coverage report
npm run test:watch             # Watch mode
npm run test:e2e               # Playwright (needs running server)
npm run test:all               # Vitest + Playwright
```

---

## 13. Environment Variables

All variables below must be set in both `.env.local` (local dev) and Vercel (production).
Adding a var to Vercel does NOT auto-redeploy — push a commit or manually redeploy.

### Vercel status (as of Jun 2026)

| Variable | Vercel | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set | |
| `DATABASE_URL` | ✅ Set | |
| `GEMINI_API_KEY` | ✅ Set | |
| `NEXT_PUBLIC_SITE_URL` | ✅ Set | `https://lekha-os.vercel.app` |
| `ENCRYPTION_KEY` | ✅ Set | Added Jun 2025 |
| `RESEND_API_KEY` | ⚠ Missing | Email alerts won't send |
| `CRON_SECRET` | ⚠ Missing | Cron endpoints unprotected |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠ Placeholder | Team invite blocked |

```bash
# Supabase (sandbox — rotate before production)
NEXT_PUBLIC_SUPABASE_URL="https://gacmazsbzxtwhwsgkuco.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_WKP94LJaUHL36tNJexFzRQ_LJPyLvKj"
SUPABASE_SERVICE_ROLE_KEY="<needed for team invite — still placeholder>"

# Database (use Supavisor pooler, NOT direct connection)
# IMPORTANT: ssl:"require" in lib/db/index.ts — do NOT change to rejectUnauthorized:true
# Supabase pooler cert is not in Node.js CA bundle → causes SELF_SIGNED_CERT_IN_CHAIN
DATABASE_URL="postgresql://postgres.gacmazsbzxtwhwsgkuco:%40%26uR%3F9u%2Buz5h%23sZ@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
DATABASE_URL_DIRECT="...same host, port 5432, for migrations only"

# AI — Google Gemini
GEMINI_API_KEY="AQ...."         # Google AI Studio — AQ. prefix format
# GEMINI_MODEL="gemini-2.5-flash"   # optional override

# Email — Resend
RESEND_API_KEY="re_..."
RESEND_FROM="AUDT <notifications@audt.tech>"

# Cron security
CRON_SECRET="..."

# Encryption — REQUIRED for integration config storage
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY="<64-char hex string — 32 bytes>"

# Site
NEXT_PUBLIC_SITE_URL="https://lekha-os.vercel.app"
```

See `.env.example` for full documentation.
