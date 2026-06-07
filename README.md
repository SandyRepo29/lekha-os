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
| Policy Governance | Roadmap | — |
| DPDP Privacy | Roadmap | — |

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

node scripts/seed-templates.mjs                    # 7 vendor type templates
node scripts/seed-billing-plans.mjs --assign-all   # Starter / Growth / Enterprise plans
node scripts/seed-demo.mjs                         # 15 realistic Indian vendors + docs
node scripts/seed-compliance-frameworks.mjs        # 5 frameworks + 174 standard controls
node scripts/seed-compliance-demo.mjs              # statuses, evidence, policies, gaps
node scripts/seed-data-governance.mjs              # branding, login history, audit events
node scripts/seed-risk-lens.mjs                    # 20 risks, treatments, reviews
node scripts/seed-trust-scores.mjs                 # Trust Score™ for all vendors
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
| `node scripts/check-db.mjs` | Table row counts for all 51 tables |
| `git push origin main` | Auto-deploy to Vercel |

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Hosting | Vercel (Mumbai `bom1`) + Supabase (`ap-south-1`) — India data residency |
| Database | Supabase Postgres · Drizzle ORM · 51 tables · 11 migrations applied |
| Auth | Supabase Auth · org RBAC (7 roles) |
| Storage | Two private buckets: `vendor-documents` + `compliance-documents`; org-scoped RLS; 15-min signed URLs |
| AI | Google Gemini 2.5 Flash — extraction, summaries, NL search, compliance officer, audit officer, risk officer, control advisor, trust narratives |
| Email | Resend — expiry alerts + AI-written weekly digests |
| PDF | `@react-pdf/renderer` |
| Security | AES-256-GCM config encryption · bcryptjs API key hashing |
| Testing | Vitest 4 + RTL 16 + Playwright 1.60 |
| UI | Tailwind v4 · dark glassmorphism · deep indigo/purple/electric-blue |

---

*AUDT — Governance Built on Proof. 🇮🇳*
