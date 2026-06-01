# Lekha OS

**The Trust, Governance & Compliance Operating System for Indian Businesses.**

Live: https://lekha-os.vercel.app · GitHub: github.com/SandyRepo29/lekha-os

---

## What is Lekha OS?

A multi-tenant, AI-native GRC platform built specifically for Indian businesses. Replaces spreadsheets and disconnected tools with a single operating system for vendor governance, compliance, audits, risk and governance.

**First module: Vendor Governance — commercially launch-ready.**

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + custom dark design system |
| Database | Supabase Postgres + Row-Level Security (Mumbai ap-south-1) |
| ORM | Drizzle (lazy init — required for Vercel) |
| Auth | Supabase Auth + org-based RBAC |
| Storage | Supabase Storage (vendor documents) |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| PDF | `@react-pdf/renderer` |
| Hosting | Vercel (Mumbai bom1) + Supabase (ap-south-1) — India data residency |
| Architecture | Layered modular monolith: UI → actions → services → repos → Postgres |

---

## What's Built

### Vendor Governance Module (Launch-Ready)
- Vendor registry with owner assignment, type templates, risk engine
- Document upload → Gemini AI extraction (type, issuer, dates, summary)
- Document-driven compliance scoring (0–100)
- Compliance checklist against vendor type templates (7 default templates)
- Security assessments (17-question, weighted scoring 0–100)
- Vendor reviews (annual/quarterly/security/compliance)
- Document request workflow (requested → submitted → approved/rejected)
- Vendor portal — magic link, vendor self-uploads without account
- AI vendor summary — Gemini executive summary per vendor, cached
- Activity feed — audit log surfaced on dashboard + vendor detail
- Audit package PDF per vendor (all sections in one document)
- Compliance + expiry PDF reports, CSV export
- Team management — invite, roles (Owner/Admin/Member/Viewer), deactivate

### Platform
- Auth: signup → onboarding → workspace creation → dashboard
- Multi-tenancy: RLS on every table, org-scoped storage
- Settings: profile edit, org name, team management (`/settings/team`)
- Investor landing page: animated, responsive, fully designed
- Vendor search (topbar), filters, pagination

---

## Project Structure

```
app/
  (marketing)/          Public landing page
  (auth)/               Login + signup
  (app)/                Authenticated app (dashboard, vendors, settings, team)
  portal/[token]/       Vendor portal (no auth required)
  onboarding/           First-time workspace setup
  auth/callback/        Supabase auth redirect

lib/
  db/                   Drizzle schema (13 tables) + lazy DB client
  services/             Business logic (pure TS, no Next imports)
  repositories/         Data access (Drizzle only)
  ai/                   Gemini client + extraction
  reports/              PDF templates (react-pdf)
  constants/            Categories, doc types, templates, assessment questions
  storage/              Storage paths + session adapter

supabase/
  migrations/           Drizzle SQL migrations (0000 + 0001 applied)
  rls.sql               RLS policies + auth trigger (apply once)
  storage.sql           Storage bucket + RLS (apply once)

scripts/
  apply-sql.mjs         Apply raw SQL to DB
  seed-templates.mjs    Seed 7 default vendor type templates (run once)
```

---

## Getting Started

```bash
npm install
npm run dev    # http://localhost:3000
```

The app boots in demo mode — landing page and app shell visible immediately.

### Connect Supabase (Mumbai ap-south-1)

```bash
# 1. Copy env template and fill in your Supabase values
cp .env.example .env.local

# 2. Apply schema + security + seed
npm run db:migrate
node scripts/apply-sql.mjs supabase/rls.sql
node scripts/apply-sql.mjs supabase/storage.sql
node scripts/seed-templates.mjs

# 3. In Supabase → Auth → Email: turn OFF "Confirm email" (sandbox)
npm run dev
```

---

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run db:generate` | Generate migration from schema changes |
| `npm run db:migrate` | Apply migrations to DB |
| `npm run db:studio` | Drizzle Studio GUI |
| `node scripts/apply-sql.mjs <file>` | Apply raw SQL to DB |
| `node scripts/seed-templates.mjs` | Seed default vendor type templates |
| `npm run test` | Run all 201 Vitest tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Vitest with coverage report (`coverage/`) |
| `npm run test:e2e` | Playwright E2E (auto-starts dev server) |
| `npm run test:all` | Vitest then Playwright |

---

## Testing

Two independent layers. Unit/service/component tests need **no env vars** (all I/O is mocked); E2E tests need Supabase + E2E user credentials.

| Layer | Runner | Config | Location |
|---|---|---|---|
| Unit / Service / Component | Vitest 4 + RTL 16 | `vitest.config.ts` | colocated `*.test.ts(x)` next to source |
| End-to-end | Playwright 1.60 | `playwright.config.ts` | `tests/e2e/*.spec.ts` |

**Status: 13 Vitest files, 201 tests — all passing (~2s).**

### Vitest layers
- **Pure functions (~100%):** `scoring.ts`, `risk-engine.ts`, `colors.ts`, `email/templates.ts`, `assessment-questions.ts`
- **Service layer (mocked repos):** `vendor-service.ts`, `document-service.ts`, `notification-service.ts`
- **Components (RTL, jsdom):** `Tabs`, `StatusBadge`, `ActivityFeed`, `ComplianceBreakdown`, `VendorStatus`

Config notes (`vitest.config.ts`): `node` env globally, `*.test.tsx` → jsdom via `environmentMatchGlobs`; `next/navigation`, `next/cache`, `next/server` aliased to hand-written mocks in `tests/setup/__mocks__/`; coverage is **allowlisted** to tested source files only (thresholds: lines/statements 65, functions 58, branches 55).

### Service-test mocking idiom
Tests mock **repositories**, not `lib/db`. The transaction mock must call through, or the transaction body is silently skipped:
```ts
vi.mock("@/lib/repositories/vendor-repo", () => ({ findById: vi.fn(), insertVendor: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { transaction: vi.fn((fn) => fn({})) } })); // ⚠ must call through
```
Fixtures: `makeVendor(overrides)` / `makeDocument(overrides)` in `tests/fixtures/`.

### E2E (Playwright)
- 4 specs / 17 tests: `auth`, `vendor-crud`, `settings`, `portal`.
- Authenticated tests **auto-skip** unless `E2E_USER_EMAIL` is set (`test.skip(...)`); unauthenticated tests (landing render, redirect-to-login) always run.
- To activate: set `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` in `.env.local`, run `node scripts/seed-e2e.mjs`, then `npm run test:e2e`.

### CI (`.github/workflows/ci.yml`)
Node 20, 3 jobs: **unit-tests** (coverage → Codecov) and **build** run on every PR + push; **e2e-tests** runs only on push to `main` (needs `TEST_SUPABASE_*` / `E2E_USER_*` / `CRON_SECRET` secrets).

---

## Critical Notes

- `export const dynamic = "force-dynamic"` required on all protected pages
- `lib/db/index.ts` uses a Proxy for lazy DB init — do NOT revert to top-level connection (breaks Vercel build)
- `proxy.ts` = Next 16 name for `middleware.ts` (session refresh + route guards)
- PDF routes: use `require('@react-pdf/renderer')`, not ES import; wrap buffer as `new Uint8Array(buffer)`
- `.claude/settings.local.json` is gitignored — do not commit
- `SUPABASE_SERVICE_ROLE_KEY` needed for team invite feature
- Git: `git push origin main` (credential manager configured)

---

## Next

- Email notification engine (Resend — document expiry alerts, weekly digest)
- Compliance Management module (2027 roadmap)

See `PRODUCT.md` for the full feature list.

---

*Lekha OS — Trust. Governance. Compliance. Built for India 🇮🇳*
