# AUDT

**AI-Native Trust, Risk & Compliance Platform — Governance Built on Proof.**

Live: [audt.tech](https://audt.tech) · Fallback: [lekha-os.vercel.app](https://lekha-os.vercel.app) · GitHub: [SandyRepo29/lekha-os](https://github.com/SandyRepo29/lekha-os)

> Complete developer reference: **[CLAUDE.md](./claude.md)** — architecture, schema, features, caveats, dev commands, environment variables.
> Seed data reference: **[SEED.md](./SEED.md)** · Feature inventory: **[FEATURES.md](./FEATURES.md)**

---

## Modules Shipped

| Module | Status | Routes |
|---|---|---|
| **Vendor Hub™** — Vendor Governance | ✅ Complete | `/vendors/*` |
| **Evidence Vault™** — Compliance Management | ✅ Complete (8 phases) | `/compliance/*` |
| **Settings & Org Management** | ✅ Complete (9 tabs) | `/settings/*` |
| **Data Governance Phase 1** | ✅ Complete | `/settings/data-governance` |
| **Audit Management** | ✅ Complete | `/audits/*` |
| **Risk Lens™** | ✅ Complete | `/risks/*` |
| **Trust Score™** | ✅ Complete | Vendor detail + API |
| **Control Center™** | ✅ Complete (2026-06-07) | `/controls/*` |
| **Trust Intelligence™** | ✅ Complete (2026-06-07) | `/trust-intelligence/*` |
| **Governance Trends™** | ✅ Complete (2026-06-09) | `/trust-intelligence/trends` |
| **Continuous Monitoring™** | ✅ Complete (2026-06-09) | `/trust-intelligence/monitoring` |
| **Trust Graph™** | ✅ Complete (2026-06-09) | `/trust-intelligence/trust-graph` |
| **Policy Governance™** | ✅ Complete (2026-06-09) | `/policy-governance/*` |
| **DPDP Privacy™** | ✅ Complete (2026-06-10) | `/dpdp-privacy/*` |
| **Contract Governance™** | ✅ Complete (2026-06-10) | `/contract-governance/*` |
| **Issue & Remediation Hub™** | ✅ Complete (2026-06-10) | `/issue-hub/*` |
| **Workflow Studio™** | ✅ Complete (2026-06-10) | `/workflow-studio/*` |
| **Third-Party Risk Exchange™** | ✅ Complete (2026-06-11) | `/trust-exchange/*` |
| **Trust Network™** | ✅ Complete (2026-06-11) | `/trust-network/*` |
| **Governance Benchmarking™** | ✅ Complete (2026-06-11) | `/benchmarking/*` |
| **Integration Hub™** | ✅ Complete (2026-06-11) | `/integration-hub/*` |
| **Executive Reporting & Analytics™** | ✅ Complete (2026-06-12) | `/executive-reporting/*` |
| **AI Governance™** | ✅ Complete (2026-06-13) | `/ai-governance/*` |
| **Auditor Collaboration™** | ✅ Complete (2026-06-13) | `/auditor-collaboration/*` |
| **Trust API Platform™** | ✅ Complete (2026-06-13) | `/trust-api/*` |

---

## Architecture

Layered modular monolith with a clean provider abstraction:

```
Browser / API client
        │
   app/ (Transport)         ← Pages, server actions, REST route handlers
        │
   lib/auth/                ← requireUser() session auth  |  validateApiKey() Bearer auth
        │
   lib/services/            ← Business logic, domain errors, audit logging
        │              │
   lib/repositories/  lib/providers/    ← DB queries (Drizzle)  |  Infrastructure adapters
        │                    │
   lib/db/ (Postgres)   Supabase / Gemini / Storage / Crypto / Rate limit
```

**Key rule:** Infrastructure SDKs (`@supabase/supabase-js`, `@google/genai`) are imported only inside `lib/providers/`. Swapping any backend = one file change.

---

## Quick Start

```bash
npm install
npm run dev          # http://localhost:3000
```

### Full Setup (Supabase + all seed data)

```bash
cp .env.example .env.local   # fill in: Supabase, Gemini, Resend, ENCRYPTION_KEY

npm run db:migrate
node scripts/apply-sql.mjs supabase/rls.sql
node scripts/apply-sql.mjs supabase/storage.sql
node scripts/apply-sql.mjs supabase/rls-risk-lens.sql
node scripts/apply-sql.mjs supabase/migrations/0010_trust_score.sql
node scripts/apply-sql.mjs supabase/migrations/0011_control_center.sql
node scripts/apply-sql.mjs supabase/migrations/0012_trust_intelligence.sql
node scripts/apply-sql.mjs supabase/migrations/0013_governance_trends.sql
node scripts/apply-sql.mjs supabase/migrations/0015_policy_governance.sql
node scripts/apply-sql.mjs supabase/migrations/0016_dpdp_privacy.sql
node scripts/apply-sql.mjs supabase/migrations/0017_contract_governance.sql
node scripts/apply-sql.mjs supabase/migrations/0018_issue_remediation.sql
node scripts/apply-sql.mjs supabase/migrations/0019_workflow_studio.sql
node scripts/apply-sql.mjs supabase/migrations/0020_trust_exchange.sql
node scripts/apply-sql.mjs supabase/migrations/0021_benchmarking.sql
node scripts/apply-sql.mjs supabase/migrations/0022_integration_hub.sql
node scripts/apply-sql.mjs supabase/migrations/0023_trust_network.sql
node scripts/apply-sql.mjs supabase/migrations/0025_ai_governance.sql

node scripts/seed-templates.mjs                    # 7 vendor type templates
node scripts/seed-billing-plans.mjs --assign-all   # Starter / Growth / Enterprise plans
node scripts/seed-demo.mjs                         # 15 realistic Indian vendors + docs
node scripts/seed-compliance-frameworks.mjs        # 5 frameworks + 174 standard controls
node scripts/seed-compliance-demo.mjs              # statuses, evidence, policies, gaps
node scripts/seed-data-governance.mjs              # branding, login history, audit events
node scripts/seed-risk-lens.mjs                    # 20 risks, treatments, reviews
node scripts/seed-trust-scores.mjs                 # Trust Score™ for all vendors
node scripts/seed-audits.mjs                       # 5 audits, 14 findings, 9 CAPAs
node scripts/seed-control-tests.mjs                # 40+ control tests + health scores
node scripts/seed-governance-snapshots.mjs         # 14-day governance trend history
node scripts/seed-vendor-extras.mjs                # assessments, reviews, doc requests
node scripts/seed-portal-tokens.mjs                # portal tokens (prints test URLs)
node scripts/seed-policy-governance.mjs            # 32 policy reviews, 8 attestations, control/framework links
node scripts/seed-contracts.mjs                    # 6 contracts (AWS/HDFC/TCS/Infosys/Azure/Razorpay) + clauses + obligations
node scripts/seed-issues.mjs                       # 10 governance issues + tasks + comments + escalations
node scripts/seed-dpdp-privacy.mjs                 # 5 data assets, 10 consents, 5 DSRs, 2 DPIAs, 3 data transfers
node scripts/seed-workflows.mjs                    # 5 workflows + nodes + runs + pending approvals
node scripts/seed-trust-exchange.mjs               # Trust Profile + 5 documents + 4 badges + questionnaire
node scripts/seed-benchmarking.mjs                 # Benchmark snapshot + 10 category scores + 6-month trends
node scripts/seed-integration-hub.mjs              # 5 connected integrations + 4 governance events
node scripts/seed-trust-network.mjs               # 47 profile views + 12 activity events + follower
node scripts/seed-executive-reporting.mjs          # 10 KPIs + 5 snapshots + 3 reports + 2 schedules + 9 forecasts
node scripts/seed-ai-governance.mjs               # 8 AI systems + 5 vendors + 10 risks + 6 controls + 4 incidents
```

In Supabase → Auth → Email → turn **OFF** "Confirm email".

---

## REST API

Authenticated with API keys from **Settings → API Keys**.

```
Authorization: Bearer audt_live_<key>
```

| Endpoint | Auth | Description |
|---|---|---|
| `GET /api/v1/vendors` | read_only | Paginated vendor list |
| `GET /api/v1/vendors/:id` | read_only | Single vendor |
| `GET /api/v1/vendors/:id/trust-score` | read_only | Trust Score™: components, history, narrative |
| `GET /api/v1/compliance/frameworks` | read_only | All frameworks with readiness scores |
| `GET /api/v1/compliance/gaps` | read_only | Open compliance gaps |
| `GET /api/v1/audit-logs` | read_only | Filterable audit event stream |
| `GET/POST /api/v1/audits` | read_write | Audit list + create |
| `GET/PUT/DELETE /api/v1/audits/:id` | read_write | Single audit CRUD |
| `GET/POST /api/v1/findings` | read_write | Org-wide findings + create |
| `GET/POST /api/v1/capas` | read_write | Org-wide CAPAs + create |
| `GET/POST /api/v1/risks` | read_write | Risk list + create |
| `GET/PUT/DELETE /api/v1/risks/:id` | read_write | Single risk CRUD |
| `GET/POST /api/v1/risk-treatments` | read_write | Treatments list + create |
| `GET/POST /api/v1/risk-reviews` | read_write | Reviews list + create |
| `GET /api/v1/controls/export/csv` | session | Control library CSV export |
| `GET /api/v1/controls/tests/export/csv` | session | Control tests CSV export |
| `GET /api/v1/trust-intelligence/overview` | read_only | Full dashboard — all 5 components + metrics |
| `GET /api/v1/trust-intelligence/org-score` | read_only | Org Trust Score™ + breakdown |
| `POST /api/v1/trust-intelligence/org-score` | read_write | Snapshot score to governance_snapshots |
| `GET /api/v1/trust-intelligence/recommendations` | read_only | Prioritized governance actions |
| `GET /api/v1/trends/overview` | read_only | Governance trend history (?days=30\|90\|180\|365) |
| `GET /api/v1/monitoring/alerts` | read_only | Governance alerts (?status=open\|resolved, ?severity=) |
| `GET/POST /api/v1/policies` | read_write | Policy list + create |
| `GET/PUT/DELETE /api/v1/policies/:id` | read_write | Single policy CRUD |
| `GET/POST /api/v1/policy-attestations` | read_write | Org-wide attestations + assign |
| `GET /api/v1/policy-health` | read_only | Org policy health metrics |
| `GET/POST /api/v1/contracts` | read_write | Contract list + create |
| `GET/PUT/DELETE /api/v1/contracts/:id` | read_write | Single contract CRUD |
| `GET /api/v1/contracts/obligations` | read_only | Org-wide obligation tracker |
| `GET/POST /api/v1/issues` | read_write | Issue list + create |
| `GET/PUT/DELETE /api/v1/issues/:id` | read_write | Single issue CRUD |
| `GET /api/v1/issues/export/csv` | session | Issues CSV export |
| `GET/POST /api/v1/workflows` | read_write | Workflow list + create |
| `GET/PUT/DELETE /api/v1/workflows/:id` | read_write | Single workflow CRUD |
| `GET /api/v1/workflow-runs` | read_only | Workflow run log (?status=, ?workflowId=) |
| `GET /api/v1/trust-exchange` | read_only | Trust profile + documents + badges + questionnaires |
| `GET/POST /api/v1/trust-exchange/documents` | read_write | Trust document list + add |
| `GET /api/v1/trust-exchange/directory` | read_only | Public vendor trust directory (?industry=, ?country=, ?minScore=) |
| `GET /api/v1/benchmarking` | read_only | Full benchmark dashboard — snapshot + all category scores + trends |
| `GET /api/v1/benchmarking/trust` | read_only | Org trust + vendor trust benchmark comparison |
| `GET /api/v1/benchmarking/vendors` | read_only | Vendor governance benchmark breakdown |
| `POST /api/v1/benchmarking/vendors` | read_write | Trigger a new benchmark computation |
| `GET /api/v1/benchmarking/rankings` | read_only | Full rankings across all categories + maturity level |
| `GET /api/v1/integrations` | read_only | Connected integrations list (?view=marketplace\|dashboard) |
| `GET /api/v1/integrations/health` | read_only | Integration Hub™ health metrics |
| `GET /api/v1/integrations/syncs` | read_only | Sync history log |
| `GET /api/v1/trust-network` | read_only | Network dashboard (?view=directory\|relationships) |
| `GET /api/v1/analytics` | read_only | Executive KPIs + snapshots + forecasts (?view=kpis\|snapshots\|forecasts) |
| `GET/POST /api/v1/ai/systems` | read_write | AI system list + create |
| `GET/POST /api/v1/ai/risks` | read_write | AI risk list + create |
| `GET /api/v1/ai/compliance` | read_only | AI compliance records (?framework=) |

Rate limits: 100 req/60s (read_only) · 300 (read_write) · 1000 (admin).

---

## Key Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server on :3000 |
| `npm run build` | Production build (tsc + Next.js) |
| `npm run test` | 201 Vitest unit + component tests |
| `npm run test:coverage` | With coverage report |
| `npm run test:e2e` | Playwright end-to-end |
| `npm run db:generate` | Generate Drizzle migration from schema |
| `npm run db:migrate` | Apply all pending Drizzle migrations |
| `npm run db:studio` | Drizzle Studio GUI |
| `node scripts/seed-trust-scores.mjs` | Compute Trust Score™ for all active vendors |
| `node scripts/seed-audits.mjs` | 5 audits · 14 findings · 9 CAPAs across all lifecycle states |
| `node scripts/seed-control-tests.mjs` | 40+ control tests with mixed results + health scores |
| `node scripts/seed-governance-snapshots.mjs` | 14-day governance trend (49 → 62) for Trust Intelligence™ |
| `node scripts/seed-vendor-extras.mjs` | Remaining vendor assessments, reviews, doc requests |
| `node scripts/seed-portal-tokens.mjs` | Portal tokens for E2E testing (prints ready-to-use URLs) |
| `node scripts/seed-trust-exchange.mjs` | Trust Profile + 5 documents + 4 badges + 1 questionnaire with answers |
| `node scripts/seed-benchmarking.mjs` | Benchmark snapshot · 10 category scores · 6-month trend history |
| `node scripts/seed-integration-hub.mjs` | 5 connected integrations (Entra ID, AWS, GitHub, CrowdStrike, Slack) + 4 governance events |
| `node scripts/seed-trust-network.mjs` | 47 profile views + 12 trust activity milestones + 1 network follower |
| `node scripts/check-db.mjs` | Table row counts for all 117 tables |
| `git push origin main` | Auto-deploy to Vercel |

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Hosting | Vercel (Mumbai `bom1`) + Supabase (`ap-south-1`) — India data residency |
| Database | Supabase Postgres · Drizzle ORM · 117 tables · 23 migrations applied |
| Auth | Supabase Auth · org RBAC (7 roles) |
| Storage | Two private buckets: `vendor-documents` + `compliance-documents`; org-scoped RLS; 15-min signed URLs |
| AI | Google Gemini 2.5 Flash — extraction, summaries, NL search, compliance officer, audit officer, risk officer, control advisor, trust narratives, governance monitor, trend forecasting |
| Email | Resend — expiry alerts + AI-written weekly digests |
| PDF | `@react-pdf/renderer` |
| Security | AES-256-GCM config encryption · bcryptjs API key hashing |
| Testing | Vitest 4 + RTL 16 + Playwright 1.60 |
| UI | Tailwind v4 · dark glassmorphism · deep indigo/purple/electric-blue |

---

*AUDT — Governance Built on Proof. 🇮🇳*
