# AUDT

**AI-Native Trust, Risk & Compliance Platform — Governance Built on Proof.**

Live: [audt.tech](https://audt.tech) · Fallback: [lekha-os.vercel.app](https://lekha-os.vercel.app) · GitHub: [SandyRepo29/lekha-os](https://github.com/SandyRepo29/lekha-os)

> Complete developer reference: **[CLAUDE.md](./CLAUDE.md)** — architecture, schema, features, caveats, dev commands, environment variables.
> Seed data reference: **[SEED.md](./SEED.md)** · Feature inventory: **[FEATURES.md](./FEATURES.md)**

---

## Modules Shipped — 30 Complete

| Module | Status | Routes |
|---|---|---|
| **Vendor Hub™** — Vendor Governance | ✅ Complete | `/vendors/*` |
| **Evidence Vault™** — Compliance Management | ✅ Complete (8 phases) | `/compliance/*` |
| **Settings & Org Management** | ✅ Complete (9 tabs) | `/settings/*` |
| **Data Governance Phase 1** | ✅ Complete | `/settings/data-governance` |
| **Audit Management™** | ✅ Complete | `/audits/*` |
| **Risk Lens™** | ✅ Complete | `/risks/*` |
| **Trust Score™** | ✅ Complete | Vendor detail + API |
| **Control Center™** | ✅ Complete (2026-06-07) | `/controls/*` |
| **Trust Intelligence™** | ✅ Complete (2026-06-07) | `/trust-intelligence/*` |
| **Governance Trends™** | ✅ Complete (2026-06-09) | `/trust-intelligence/trends` |
| **Continuous Monitoring™** | ✅ Complete (2026-06-09) | `/trust-intelligence/monitoring` |
| **Trust Graph™** | ✅ Complete (2026-06-09) | `/trust-intelligence/trust-graph` |
| **Policy Governance™** | ✅ Complete (2026-06-09) | `/policy-governance/*` |
| **DPDP Privacy™** | ✅ Complete (2026-06-09) | `/dpdp-privacy/*` |
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
| **Trust Verification Authority™** | ✅ Complete (2026-06-13) | `/trust-verification/*` + `/verify/:id` |
| **Continuous Compliance™** | ✅ Complete (2026-06-13) | `/continuous-compliance/*` |
| **Governance Agent Framework™** | ✅ Complete (2026-06-13) | `/agents/*` |
| **Regulatory Intelligence™** | ✅ Complete (2026-06-14) | `/regulatory-intelligence/*` |

**Total: 218 DB tables · 32 migrations applied · 30 modules shipped**

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
node scripts/apply-sql.mjs supabase/migrations/0024_executive_reporting.sql
node scripts/apply-sql.mjs supabase/migrations/0025_ai_governance.sql
node scripts/apply-sql.mjs supabase/migrations/0026_auditor_collaboration.sql
node scripts/apply-sql.mjs supabase/migrations/0027_trust_api_platform.sql
node scripts/apply-sql.mjs supabase/migrations/0028_trust_verification_authority.sql
node scripts/apply-sql.mjs supabase/migrations/0029_continuous_compliance.sql
node scripts/apply-sql.mjs supabase/migrations/0030_governance_agents.sql
node scripts/apply-sql.mjs supabase/migrations/0031_regulatory_intelligence.sql

node scripts/seed-templates.mjs                     # 7 vendor type templates
node scripts/seed-billing-plans.mjs --assign-all    # Starter / Growth / Enterprise plans
node scripts/seed-demo.mjs                          # 19 realistic Indian vendors + 67 docs
node scripts/seed-compliance-frameworks.mjs         # 5 frameworks + 174 standard controls
node scripts/seed-compliance-demo.mjs               # evidence, policies, gaps, readiness scores
node scripts/seed-data-governance.mjs               # branding, login history, audit events
node scripts/seed-risk-lens.mjs                     # 20 risks, 25 treatments, 8 reviews
node scripts/seed-trust-scores.mjs                  # Trust Score™ for all vendors
node scripts/seed-audits.mjs                        # 5 audits, 15 findings, 9 CAPAs
node scripts/seed-control-tests.mjs                 # 54 control tests + health scores
node scripts/seed-governance-snapshots.mjs          # 14-day governance trend history
node scripts/seed-vendor-extras.mjs                 # extra assessments, reviews, doc requests
node scripts/seed-portal-tokens.mjs                 # portal tokens for E2E testing
node scripts/seed-policy-governance.mjs             # 32 policy reviews, 8 attestations
node scripts/seed-contracts.mjs                     # contracts with clauses + obligations
node scripts/seed-issues.mjs                        # issues with tasks + escalations + SLAs
node scripts/seed-dpdp-privacy.mjs                  # data assets, consent records, DSRs
node scripts/seed-workflows.mjs                     # workflow definitions + runs
node scripts/seed-trust-exchange.mjs                # Trust Profile + documents + badges
node scripts/seed-benchmarking.mjs                  # benchmark snapshot + 10 categories
node scripts/seed-integration-hub.mjs               # 5 connected integrations
node scripts/seed-trust-network.mjs                 # network profile views + activity
node scripts/seed-executive-reporting.mjs           # 10 KPIs + snapshots + reports + forecasts
node scripts/seed-ai-governance.mjs                 # 8 AI systems + risks + controls + incidents
node scripts/seed-auditor-collaboration.mjs         # 3 auditor orgs + 4 rooms + evidence requests
node scripts/seed-trust-api-platform.mjs            # 3 clients + 3 keys + 3 webhooks + usage
node scripts/seed-trust-verification.mjs            # AUDT Verified™ cert + Privacy Ready™ cert
node scripts/seed-continuous-compliance.mjs         # 3 access reviews · 3 attestations · 3 training campaigns · 5 signals · 3 automation rules
node scripts/seed-governance-agents.mjs             # 5 agents · runs · observations · recommendations · actions · metrics
node scripts/seed-regulatory-intelligence.mjs       # 8 changes · 12 obligations · 3 assessments · 5 alerts · 5 watchlists · 8 tasks · 4 updates
node scripts/check-all-modules.mjs                  # verify all module table counts
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
| `GET /api/v1/trust-intelligence/overview` | read_only | Full dashboard — all 5 components + metrics |
| `GET /api/v1/trust-intelligence/org-score` | read_only | Org Trust Score™ + breakdown |
| `POST /api/v1/trust-intelligence/org-score` | read_write | Snapshot score to governance_snapshots |
| `GET /api/v1/trust-intelligence/recommendations` | read_only | Prioritized governance actions |
| `GET /api/v1/trends/overview` | read_only | Governance trend history |
| `GET /api/v1/monitoring/alerts` | read_only | Governance alerts |
| `GET/POST /api/v1/contracts` | read_write | Contract list + create |
| `GET/PUT/DELETE /api/v1/contracts/:id` | read_write | Single contract CRUD |
| `GET /api/v1/contracts/obligations` | read_only | Org-wide obligation tracker |
| `GET/POST /api/v1/issues` | read_write | Issue list + create |
| `GET/PUT/DELETE /api/v1/issues/:id` | read_write | Single issue CRUD |
| `GET /api/v1/benchmarking` | read_only | Benchmark dashboard + category scores |
| `GET /api/v1/benchmarking/rankings` | read_only | Full rankings + maturity level |
| `GET /api/v1/integrations` | read_only | Connected integrations |
| `GET /api/v1/analytics` | read_only | Executive KPIs + snapshots + forecasts |
| `GET/POST /api/v1/ai/systems` | read_write | AI system list + create |
| `GET/POST /api/v1/ai/risks` | read_write | AI risk list + create |
| `GET/POST /api/v1/audit-rooms` | read_write | Audit room list + create |
| `GET/POST /api/v1/evidence-requests` | read_write | Evidence requests + create |
| `GET/POST /api/v1/external-findings` | read_write | External findings + create |
| `GET /api/v1/agents` | read_only | Agent list |
| `POST /api/v1/agents` | read_write | Create agent |
| `GET/PUT/DELETE /api/v1/agents/:id` | read_write | Single agent CRUD |
| `GET /api/v1/agent-runs` | read_only | Agent run history |
| `GET /api/v1/agent-observations` | read_only | Agent observations |
| `GET /api/v1/agent-actions` | read_only | Agent action queue |
| `POST /api/v1/agent-actions/:id/approve` | read_write | Approve agent action |
| `GET /api/v1/public/trust-score` | Bearer (tap_) | Public: live org trust score |
| `GET /api/v1/public/vendor-trust` | Bearer (tap_) | Public: per-vendor trust scores |
| `GET /api/v1/public/verification` | Bearer (tap_) | Public: proof-of-governance bundle |
| `GET /api/v1/verifications` | read_only | Verification applications list |
| `POST /api/v1/verifications` | read_write | Apply for verification |
| `GET /api/v1/certificates` | read_only | Issued certificates |
| `GET /api/v1/registry` | **public** | Public verification registry |
| `GET /api/v1/verification-programs` | **public** | Verification programs catalog |
| `GET /api/v1/trust-passports` | read_only | Org trust passport |
| `GET /api/v1/regulations` | read_only | Regulation list (incl. 18 built-in global regulations) |
| `GET/POST /api/v1/obligations` | read_write | Compliance obligations list + create |
| `GET /api/v1/regulatory-changes` | read_only | Regulatory change monitor |
| `GET/POST /api/v1/regulatory-assessments` | read_write | Impact assessments list + create |
| `GET /api/v1/regulatory-readiness` | read_only | Regulatory readiness score + metrics |

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
| `node scripts/check-all-modules.mjs` | Row counts across all 50+ module tables |
| `node scripts/check-db.mjs` | Core table counts (vendors, frameworks, evidence) |
| `git push origin main` | Auto-deploy to Vercel |

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Hosting | Vercel (Mumbai `bom1`) + Supabase (`ap-south-1`) — India data residency |
| Database | Supabase Postgres · Drizzle ORM · **218 tables** · 32 migrations applied |
| Auth | Supabase Auth · org RBAC (7 roles) |
| Storage | Two private buckets: `vendor-documents` + `compliance-documents`; org-scoped RLS; 15-min signed URLs |
| AI | Google Gemini 2.5 Flash — extraction, summaries, NL search, compliance officer, audit officer, risk officer, control advisor, trust narratives, governance copilot, AI API builder, governance agents |
| Email | Resend — expiry alerts + AI-written weekly digests |
| PDF | `@react-pdf/renderer` |
| Security | AES-256-GCM config encryption · bcryptjs API key hashing · SHA-256 certificate integrity |
| Testing | Vitest 4 + RTL 16 + Playwright 1.60 |
| UI | Tailwind v4 · dark glassmorphism · deep indigo/purple/electric-blue |

---

*AUDT — Governance Built on Proof.*
