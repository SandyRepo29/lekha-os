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
- **Modules shipped:** Vendor Hub™ · Evidence Vault™ (Compliance) · Settings & Org Management · Data Governance (Phase 1) · Audit Management · Risk Lens™ · Trust Score™ · Control Center™ · Trust Intelligence™ · Governance Trends™ · Continuous Monitoring™ · Trust Graph™ · Policy Governance™ · DPDP Privacy™ · Contract Governance™ · Issue & Remediation Hub™ · Workflow Studio™ · Third-Party Risk Exchange™ · Governance Benchmarking™ · Integration Hub™ · Trust Network™ · Executive Reporting & Analytics™ · AI Governance™ · Auditor Collaboration™ · **Trust API Platform™**
- **Total tables:** 158 (149 previous + 9 Trust API Platform tables from migration 0027)
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

**52 tables** across 12 migration files (0000–0012 — all applied).

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

**RLS:** All 52 tables enabled. Helpers: `is_org_member()`, `has_org_role()`. Risk junction tables validate org via `EXISTS (SELECT 1 FROM risks WHERE id = risk_id AND is_org_member(organization_id))`. Control junction tables validate org via `EXISTS (SELECT 1 FROM controls c JOIN memberships m ON m.organization_id = c.organization_id WHERE c.id = control_id AND m.user_id = auth.uid())`.

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
node scripts/seed-demo.mjs                          # optional: 15 realistic vendors
node scripts/seed-compliance-frameworks.mjs         # optional: 5 frameworks + 174 controls
node scripts/seed-compliance-demo.mjs               # optional: realistic demo state
node scripts/seed-risk-lens.mjs                     # optional: 20 risks + treatments + reviews
node scripts/seed-trust-scores.mjs                  # optional: Trust Score™ for all active vendors (19 vendors scored, HDFC 95 → Yotta 44)
node scripts/seed-executive-reporting.mjs           # optional: Executive Reporting™ — 10 KPIs, 5 snapshots, 3 reports, 2 schedules, 9 forecasts
node scripts/seed-ai-governance.mjs                # optional: AI Governance™ — 8 AI systems, 5 vendors, 10 risks, 6 controls, 4 policies, 4 incidents, 6 compliance records
node scripts/seed-auditor-collaboration.mjs        # optional: Auditor Collaboration™ — 3 auditor orgs, 8 external users, 4 audit rooms, 12 evidence requests, 8 findings
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
- UI: `TrustScoreWidget` (full breakdown, strengths/concerns, AI narrative) + `TrustScoreBadge` (inline level chip)
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

### Module 1 — Vendor Governance ✅ Complete (Launch-Ready)

25 features including: vendor registry, document management (AI extraction v2 — 10 fields), risk engine, security assessments, NL search (Gemini), executive PDFs, vendor portal (magic link), team RBAC, email cron jobs (expiry alerts + AI weekly digest).

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
  app-shell/                    Sidebar, Topbar (NL search detection)
  vendors/                      All vendor UI — forms, detail tabs, document components
  assessments/                  AssessmentForm, AiAssessmentSummary
  activity/                     ActivityFeed
  team/                         InviteForm, MemberRow (7 roles, transfer ownership, resend invite)
  settings/                     ProfileForm, OrgProfileForm, BrandingForm, PasswordForm, MfaPanel,
                                AuditLogTable, ApiKeyManager, IntegrationGrid
  compliance/
    compliance-badges.tsx       All compliance status badges
    compliance-ui.tsx           Shared helpers: ComplianceStat, FilterChip, CoverageBar
    [all other compliance components]
  audit/
    audit-status-badge.tsx      AuditStatusBadge, SeverityBadge, FindingStatusBadge, CapaStatusBadge, AuditTypeBadge
    audit-ui.tsx                AuditStat, AuditFilterChip, formatDate, isDueSoon, isOverdue
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
