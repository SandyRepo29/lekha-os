# Lekha OS

**The Trust, Governance & Compliance Operating System for Indian Businesses.**

Live: https://lekha-os.vercel.app · GitHub: github.com/SandyRepo29/lekha-os

> For the complete project reference — stack, features, schema, caveats, AI features, test suite, dev commands — see **[claude.md](./claude.md)**.

---

## Modules

| Module | Status |
|---|---|
| **Vendor Governance** | ✅ Launch-ready |
| **Compliance Management** | 🚧 In progress (Phases 1–3 of 8 complete) |
| DPDP Privacy + Audit | Roadmap |
| Risk Management | Roadmap |
| Board Governance | Roadmap |

---

## Quick Start

```bash
npm install
npm run dev          # http://localhost:3000 (boots in demo mode without Supabase)
```

## Connect Supabase (Mumbai ap-south-1)

```bash
cp .env.example .env.local    # fill in Supabase values
npm run db:migrate
node scripts/apply-sql.mjs supabase/rls.sql
node scripts/apply-sql.mjs supabase/storage.sql
node scripts/seed-templates.mjs
node scripts/seed-demo.mjs    # optional: 15 realistic Indian vendors
```

In Supabase → Auth → Email → turn **OFF** "Confirm email" for sandbox.

## Key Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run test` | 201 Vitest unit/component tests |
| `npm run test:e2e` | Playwright E2E |
| `npm run db:generate` | Generate Drizzle migration from schema changes |
| `npm run db:migrate` | Apply DB migrations |
| `npm run db:studio` | Drizzle Studio |
| `git push origin main` | Auto-deploy to Vercel |

## Stack

Next.js 16 · TypeScript · Supabase (Mumbai) · Drizzle · Gemini AI · Resend · react-pdf · Tailwind v4 · Vitest · Playwright

## Database

**25 tables** — 15 Vendor Governance + 10 Compliance Module (migration 0005 applied).

---

*Lekha OS — Trust. Governance. Compliance. Built for India 🇮🇳*
