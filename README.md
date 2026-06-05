# Lekha OS

**The Trust, Governance & Compliance Operating System for Indian Businesses.**

Live: [lekha-os.vercel.app](https://lekha-os.vercel.app) · GitHub: [SandyRepo29/lekha-os](https://github.com/SandyRepo29/lekha-os)

> Complete developer reference: **[CLAUDE.md](./CLAUDE.md)** — stack, schema, features, caveats, architecture, test suite, dev commands.

---

## Modules

| Module | Status |
|---|---|
| **M1 — Vendor Governance** | ✅ Complete |
| **M2 — Compliance Management** | ✅ Complete (all 8 phases) |
| **M3 — Settings & Organization Management** | ✅ Complete (all 8 tabs) |
| DPDP Privacy + Audit Workspace | Roadmap |
| Risk Management — register, heat maps, remediation | Roadmap |
| Board Governance + Trust Center | Roadmap |

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

**Key rule:** Infrastructure SDKs (`@supabase/supabase-js`, `@google/genai`) are imported only inside `lib/providers/`. Services import provider interfaces. Swapping any backend = one file change.

---

## Quick Start

```bash
npm install
npm run dev          # http://localhost:3000 — boots in demo mode without Supabase
```

### Full Setup (Supabase Mumbai)

```bash
cp .env.example .env.local   # fill in Supabase, Gemini, Resend, ENCRYPTION_KEY

npm run db:migrate
node scripts/apply-sql.mjs supabase/rls.sql
node scripts/apply-sql.mjs supabase/storage.sql
node scripts/seed-templates.mjs                    # 7 vendor type templates
node scripts/seed-demo.mjs                         # 15 realistic Indian vendors + docs
node scripts/seed-compliance-frameworks.mjs        # 5 frameworks + 174 standard controls
node scripts/seed-compliance-demo.mjs              # statuses, evidence, policies, gaps
node scripts/seed-billing-plans.mjs --assign-all   # Starter / Growth / Enterprise plans
```

In Supabase → Auth → Email → turn **OFF** "Confirm email".

---

## REST API

The `/api/v1/` layer is authenticated with API keys created in **Settings → API Keys**.

```
Authorization: Bearer lk_live_<key>
```

| Endpoint | Auth | Description |
|---|---|---|
| `GET /api/v1/vendors` | read_only | Paginated vendor list |
| `GET /api/v1/vendors/:id` | read_only | Single vendor |
| `GET /api/v1/compliance/frameworks` | read_only | All frameworks with readiness scores |
| `GET /api/v1/compliance/gaps` | read_only | Open compliance gaps |
| `GET /api/v1/audit-logs` | read_only | Filterable audit event stream |

Rate limits: 100 req/60s (read_only) · 300 (read_write) · 1000 (admin).  
`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers on every response.

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
| `npm run db:migrate` | Apply all pending migrations |
| `npm run db:studio` | Drizzle Studio GUI |
| `npm run db:seed-compliance` | 5 frameworks + 174 controls |
| `npm run db:seed-compliance-demo` | Realistic demo data |
| `git push origin main` | Auto-deploy to Vercel |

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Hosting | Vercel (Mumbai `bom1`) + Supabase (`ap-south-1`) — India data residency |
| Database | Supabase Postgres · Drizzle ORM · 31 tables · 6 migrations applied |
| Auth | Supabase Auth · org RBAC (owner/admin/member/viewer/compliance_manager/security_manager/procurement_manager) |
| Storage | Supabase Storage — `vendor-documents` bucket, org-scoped RLS |
| AI | Google Gemini 2.5 Flash — extraction, summaries, NL search, compliance officer |
| Email | Resend — expiry alerts + AI-written weekly digests |
| PDF | `@react-pdf/renderer` |
| Security | AES-256-GCM config encryption · bcryptjs API key hashing |
| Testing | Vitest 4 + RTL 16 + Playwright 1.60 |
| UI | Tailwind v4 · dark glassmorphism · deep indigo/purple/electric-blue |

---

*Lekha OS — Trust. Governance. Compliance. Built for India 🇮🇳*
