# Lekha OS — Claude Code Reference

> **End-to-end project brief for any AI session. Read this first.**

---

## 1. Product Brief

**Lekha OS** is the Trust, Governance & Compliance (GRC) Operating System for Indian businesses.
Replaces spreadsheets and disconnected tools with a single AI-native platform for vendor governance, compliance, audits, risk and board governance.

- **Positioning:** Category-defining OS — not a point solution
- **First module:** Vendor Governance — **commercially launch-ready**
- **Target customers:** SaaS, Fintech, Healthcare, Manufacturing, IT Services (India)
- **Live:** https://lekha-os.vercel.app
- **GitHub:** https://github.com/SandyRepo29/lekha-os (private)
- **Local:** `C:\Users\sandy\OneDrive\Desktop\LekhaOS`

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Hosting | Vercel (Mumbai `bom1`) + Supabase (`ap-south-1`) — full India data residency |
| Database | Supabase Postgres + Row-Level Security |
| ORM | Drizzle — lazy init via Proxy in `lib/db/index.ts` |
| Auth | Supabase Auth + org-based RBAC (owner/admin/member/viewer) |
| Storage | Supabase Storage — `vendor-documents` bucket, org-scoped RLS |
| AI | Google Gemini 2.5 Flash (`@google/genai`) — extraction, summaries, NL search, reports |
| Email | Resend — expiry alerts + weekly digests (AI-written) |
| PDF | `@react-pdf/renderer` |
| Testing | Vitest 4 + RTL 16 + Playwright 1.60 |
| UI | Tailwind v4 · dark glassmorphism · deep indigo/purple/electric-blue |

### Architecture — layered modular monolith

```
React UI  →  Server Action (transport, thin)  →  Service (business logic, pure TS)
         →  Repository (Drizzle data access)  →  PostgreSQL
```

**Rules that must not be broken:**
- Business logic lives ONLY in `lib/services/*` — never in server actions or components
- Services have zero `next/*` imports — they are framework-agnostic
- Services throw `DomainError` for validation failures; actions catch and return `{ error }`
- Repositories accept an optional `Executor` so they compose inside `db.transaction()`
- `export const dynamic = "force-dynamic"` required on all authenticated pages
- `lib/db/index.ts` uses a Proxy for lazy init — **do not revert to top-level postgres() call** (breaks Vercel build)
- PDF route handlers: use `await import("@react-pdf/renderer")` (dynamic ESM, NOT require); wrap buffer as `new Uint8Array(buffer)`

---

## 3. Supabase Sandbox

| Setting | Value |
|---|---|
| Project ref | `gacmazsbzxtwhwsgkuco` |
| Region | ap-south-1 (Mumbai) ✓ |
| Anon key | `sb_publishable_WKP94LJaUHL36tNJexFzRQ_LJPyLvKj` |
| DB password | `@&uR?9u+uz5h#sZ` (URL-encode: `@=%40 &=%26 ?=%3F +=%2B #=%23`) |
| DATABASE_URL | `postgresql://postgres.gacmazsbzxtwhwsgkuco:%40%26uR%3F9u%2Buz5h%23sZ@aws-1-ap-south-1.pooler.supabase.com:6543/postgres` |
| Pooler note | Use `aws-1-ap-south-1.pooler.supabase.com` — direct `db.<ref>.supabase.co` is IPv6-only and fails locally |

**SUPABASE_SERVICE_ROLE_KEY** is still a placeholder — required to activate team invite functionality.

---

## 4. Database Schema

**15 tables** across 4 migration files (0000 + 0001 + 0002 + 0003 — all applied).

| Table | Purpose |
|---|---|
| `organizations` | Tenant boundary |
| `profiles` | Mirrors auth.users — auto-created by `handle_new_user` trigger |
| `memberships` | User↔org join with role + `is_active` |
| `vendors` | Core vendor registry (25 cols incl. owner, AI fields, checklist score) |
| `vendor_documents` | Documents with AI-extracted fields + `category` enum |
| `vendor_types` | Compliance templates (7 defaults seeded, custom org-specific allowed) |
| `vendor_type_documents` | Required/optional doc types per template |
| `document_requests` | Request workflow (requested→submitted→approved/rejected/expired) |
| `assessments` | Security assessments per vendor, score 0–100, `ai_summary` |
| `assessment_responses` | Per-question answers: yes/no/partial/na |
| `vendor_reviews` | Periodic governance reviews |
| `vendor_portal_tokens` | Magic-link tokens for vendor self-service |
| `notification_preferences` | Per-org notification settings |
| `notification_history` | Email deduplication + audit |
| `audit_logs` | Every meaningful action recorded |

**Key vendor columns (25 total):** name, category, contactEmail, status, riskLevel, complianceScore, notes, aiSummary, aiSummaryAt, aiScoreExplanation, aiScoreExplainedAt, aiRiskExplanation, aiRiskExplainedAt, aiRecommendedActions (jsonb), aiActionsGeneratedAt, ownerName, ownerEmail, ownerDepartment, vendorTypeId, checklistScore, createdBy, timestamps

**document_category enum:** security, privacy, legal, financial, quality, operational, other

**RLS:** All tables enabled. Helpers: `is_org_member()`, `has_org_role()` — applied via `supabase/rls.sql`.

**First-time setup on a fresh DB:**
```bash
npm run db:migrate
node scripts/apply-sql.mjs supabase/rls.sql
node scripts/apply-sql.mjs supabase/storage.sql
node scripts/seed-templates.mjs
node scripts/seed-demo.mjs      # optional: 15 realistic Indian vendors + full data
```

---

## 5. Features Implemented

### Module 1 — Vendor Governance (Launch-Ready)

#### Core Registry
- Add / edit / delete vendor — name, category (20+ grouped types), risk, contact, owner
- Vendor owner assignment — ownerName, ownerEmail, ownerDepartment
- Vendor status inline toggle — Active / Pending / Inactive (audited)
- Vendor notes — inline edit, audited
- Vendor type template assignment — 7 default templates seeded

#### Search, Filter, Pagination
- **Natural language search** — "high risk SaaS vendors missing a DPA" → Gemini parses → structured filters applied; AI badge shown, blue animated indicator in topbar
- Simple text search → `/vendors?q=term`; NL queries → `/vendors?nlq=term`
- Filter by risk / status / expiring (⏰) / expired (⛔)
- URL-driven filters from dashboard stat cards (`?expiring=1`, `?risk=high`)
- Pagination — 20/page, `?page=N`

#### Document Management
- Upload to Supabase Storage (org-scoped RLS)
- **AI extraction v2** — Gemini extracts 10 fields: type, issuer, issued date, expiry date, summary + **document category, certificationNumber, standardVersion, certificationScope, certificationBody, applicableRegions**
- **Document classification** — 7-category taxonomy with colour badges (Security/Privacy/Legal/Financial/Quality/Operational/Other)
- Rich metadata panel per document — expandable "More ↓" showing cert number, version, accreditation body, regions, scope
- Manual edit, re-run extraction, delete (purges storage + DB + audit)
- Document request workflow — create/track requests, status flow, portal fulfilment

#### Compliance & Scoring
- Document-driven score (0–100): risk base + valid docs (×5, max+40) − expiring (×10) − expired (×20)
- Vendor type compliance checklist — required vs uploaded per template, 0–100% completion
- Score breakdown panel — shows current / max achievable / what's needed
- Category breakdown strip — "Security 2 · Legal 1 · Financial 1" in Compliance tab

#### AI Features (Gemini 2.5 Flash)
- **AI Vendor Brief** — 3–5 sentence executive summary, cached, regeneratable
- **AI Explain Score** — plain-English explanation of why the score is what it is
- **AI Risk Explanation** — narrative of each risk factor, what to address first
- **AI Recommended Actions** — prioritised action list with point impact (Critical/High/Medium/Low)
- **AI Assessment Summary** — narrative of 17-question results: strengths, gaps, top priority
- **Executive Summary Report** — AI-narrated board-ready PDF (6 sections: Overview, Compliance, Risk, Governance, Recommendations, Conclusion)
- **Natural Language Search** — Gemini parses free-text to structured filters
- **AI Weekly Brief** — Gemini writes executive opening paragraph for weekly digest email
- **AI Dashboard Insights** — data-driven insight cards
- Stale content indicator — "Data changed" amber badge when data updated since generation
- Graceful degradation — all AI features fall back silently; uploads/email always work

#### Risk & Assessments
- Risk engine — computed 0–100 from: risk level + compliance score + doc status + assessment + owner
- Security assessments — 17 questions, 6 categories, weighted scoring (yes=1, partial=0.5, na=skip)
- Vendor reviews — Annual/Quarterly/Security/Compliance, status tracking

#### Reports & Exports
- Compliance PDF (`/reports/compliance`) — all vendors, full table, branded
- Expiry PDF (`/reports/expiry`) — expiring in 60 days, days-left column
- **Executive Summary PDF** (`/vendors/[id]/executive-report`) — AI-narrated per-vendor board dossier
- Audit Package PDF (`/vendors/[id]/audit-package`) — all sections
- CSV export (`/vendors/export`)

#### Vendor Portal
- Magic-link portal at `/portal/[token]` — no account required
- Vendor uploads documents, views pending requests, sees expiring docs
- Token valid 30 days, generated from vendor detail page

#### Audit Log
Every action logged: organization.created/renamed, vendor.created/updated/deleted/status_changed/notes_updated, document.uploaded/deleted, document_request.created/status_changed, assessment.created/completed, review.created/status_changed, team.member_invited/role_changed/deactivated/reactivated, portal.link_generated

### Platform Features

#### Auth & Identity
- Signup → onboarding → workspace creation → dashboard
- Login / logout, redirect preservation
- Supabase Auth — "Confirm email" must be OFF for sandbox

#### Team Management + RBAC
- Invite by email (Supabase `inviteUserByEmail` — needs `SUPABASE_SERVICE_ROLE_KEY`)
- Roles: Owner / Admin / Member / Viewer — enforced in app + RLS
- Deactivate / reactivate members (`is_active` flag)
- `/settings/team` page

#### Email Notifications
- **Resend** SDK — `RESEND_API_KEY` in `.env.local`
- Expiry alerts — at 90/60/30/15/7 days before + on expiry — daily cron 8am IST
- **AI-written weekly digest** — Gemini writes executive brief + data tables — Monday 9am IST
- Deduplication via `notification_history`
- Preferences page at `/settings/notifications`
- Cron routes: `/api/cron/expiry` and `/api/cron/digest` — secured with `CRON_SECRET`
- `vercel.json` schedules: `30 2 * * *` (expiry) and `30 3 * * 1` (digest)

#### Settings
- Profile — edit full name
- Organization — edit org name (owner/admin only)
- Notifications — expiry toggle, digest toggle, extra recipients, alert days, test email
- Team — invite, role changes, deactivate

#### UI Design System
- Dark glassmorphism, near-black bg, deep indigo/purple/electric-blue accents
- Fonts: Inter (body) + Sora (display headings)
- Shared components: `Button`, `Card`, `Badge`, `StatusBadge`, `Input`, `Select`, `Tabs`, `SectionHeading`, `EmptyState`, `ScoreRing`
- Shared utilities: `lib/ui/colors.ts` — `scoreBarGradient()`, `scoreTextColor()`, `scoreLabel()`, `statusBadgeStyles()`, `riskBadgeStyles()`
- Vendor detail — **4-tab layout** (Documents / Compliance / Risk & Assessments / Reviews & Activity)

---

## 6. App Routes

```
/                               Marketing landing page
/login                          Sign in
/signup                         Sign up
/onboarding                     First workspace creation
/dashboard                      Main dashboard
/vendors                        Vendor list (?q=, ?nlq=, ?risk=, ?expiring=1, ?page=N)
/vendors/new                    Add vendor
/vendors/[id]                   Vendor detail (4-tab layout)
/vendors/[id]/edit              Edit vendor
/vendors/[id]/assessment        Security assessment questionnaire
/vendors/[id]/audit-package     Audit package PDF download
/vendors/[id]/executive-report  AI executive summary PDF download
/vendors/export                 CSV download
/reports/compliance             Compliance PDF
/reports/expiry                 Expiry PDF
/settings                       Profile + org settings
/settings/team                  Team management
/settings/notifications         Email notification preferences
/portal/[token]                 Vendor self-service portal (no auth)
/api/cron/expiry                Daily expiry alert cron (CRON_SECRET secured)
/api/cron/digest                Weekly digest cron (CRON_SECRET secured)
/auth/callback                  Supabase auth redirect
```

---

## 7. Key File Map

```
lib/
  db/schema.ts                  15-table Drizzle schema (all enums + tables)
  db/index.ts                   Lazy DB Proxy — CRITICAL, do not change
  services/scoring.ts           Pure: computeScore(), computeDocStatus() — client-safe
  services/risk-engine.ts       Pure: computeRiskScore() → {level, score, factors[]}
  services/vendor-service.ts    All vendor business logic
  services/document-service.ts  Document lifecycle
  services/extraction-service.ts Gemini extraction pipeline (v2 — 10 fields)
  services/notification-service.ts Resend email engine + AI weekly brief
  services/template-service.ts  Checklist calculation
  services/assessment-service.ts Security assessment scoring
  services/team-service.ts      Invite + RBAC
  services/ai-insights-service.ts Gemini: explain score, risk, actions, assessment summary, executive report, weekly brief
  services/ai-summary-service.ts Gemini vendor brief (cached)
  services/nl-search-service.ts  Natural language search parser (Gemini → structured filters)
  repositories/                 Data access only (Drizzle) — all repos here
  email/resend.ts               Resend client + isResendConfigured()
  email/templates.ts            HTML email templates — expiryAlertHtml(), weeklyDigestHtml(aiBrief?)
  ai/gemini.ts                  Gemini client, extractDocumentFields() v2, DOCUMENT_CATEGORY_LABELS/COLORS
  ui/colors.ts                  Shared score/risk/status color functions
  constants/vendor-options.ts   Categories, risk levels, doc types (25+)
  constants/vendor-templates.ts 7 default template definitions
  constants/assessment-questions.ts 17 standard questions + calculateScore() + groupByCategory()
  reports/                      react-pdf templates: compliance, expiry, audit-package, executive-summary

components/
  ui/                           Button, Card, Badge, StatusBadge, Input, Select, Tabs,
                                SectionHeading, EmptyState, ScoreRing
  ai/                           AiInsightPanel (collapsible), AiRecommendedActions
  app-shell/                    Sidebar, Topbar (NL search detection), ScoreRing
  vendors/                      All vendor UI — forms, detail tabs, document components,
                                category badge, metadata panel, portal link, risk panel
  assessments/                  AssessmentForm, AiAssessmentSummary
  activity/                     ActivityFeed (Lucide icons per action type)
  settings/                     Profile, org, notification, team forms
  portal/                       PortalUpload component

supabase/
  migrations/0000_*.sql         Initial schema
  migrations/0001_*.sql         Launch features (owner, templates, assessments, portal, etc.)
  migrations/0002_*.sql         Notification tables
  migrations/0003_*.sql         AI insight fields on vendors + assessments
  migrations/0004_*.sql         document_category enum + category column
  rls.sql                       RLS policies + auth trigger (apply once)
  storage.sql                   Storage bucket + policies (apply once)

scripts/
  apply-sql.mjs                 Apply raw SQL file to DB
  seed-templates.mjs            Seed 7 default vendor type templates (run once)
  seed-demo.mjs                 Seed 15 realistic Indian vendors + 67 docs + assessments (idempotent)
  seed-e2e.mjs                  Seed E2E test user + workspace
  check-db.mjs                  Quick DB state check (counts)

tests/
  setup/vitest.setup.ts         jest-dom matchers
  setup/__mocks__/              next-navigation, next-cache, next-server stubs
  fixtures/vendors.ts           makeVendor() factory
  fixtures/documents.ts         makeDocument() factory
  e2e/                          Playwright specs: auth, vendor-crud, settings, portal
  e2e/helpers/auth.ts           signIn() + saveSession()
```

---

## 8. Test Suite

### Run commands

```bash
npm run test              # run 201 Vitest tests (~2s)
npm run test:coverage     # with coverage report (coverage/ dir)
npm run test:watch        # watch mode
npm run test:e2e          # Playwright (dev server must be running)
npm run test:e2e:ui       # Playwright visual UI
npm run test:all          # Vitest + Playwright
```

### Coverage (tested files only — scoped include in vitest.config.ts)

| Layer | Files | Tests | Coverage |
|---|---|---|---|
| Pure functions | `scoring.ts`, `risk-engine.ts`, `colors.ts`, `templates.ts`, `assessment-questions.ts` | 103 | ~100% |
| Service unit | `vendor-service.ts`, `document-service.ts`, `notification-service.ts` | 38 | ~60% |
| Components (RTL) | `Tabs`, `StatusBadge`, `ActivityFeed`, `ComplianceBreakdown`, `VendorStatus` | 60 | ~75% |
| E2E Playwright | auth, vendor-crud, settings, portal | 4 spec files | runs against live app |

**Total: 201 Vitest tests across 13 test files — all passing.**

### Mocking patterns

Service tests mock repos (not `lib/db` directly):
```ts
vi.mock("@/lib/repositories/vendor-repo");
vi.mock("@/lib/db", () => ({
  db: { transaction: vi.fn((fn) => fn({})) },  // must call through!
}));
```

### E2E setup

E2E tests skip automatically when no auth session exists. To activate:
1. Set `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` in `.env.local`
2. Run `node scripts/seed-e2e.mjs` to create test workspace
3. `npm run test:e2e`

### CI/CD

`.github/workflows/ci.yml` runs:
- **Unit tests** on every PR — no env vars needed
- **Build check** on every PR
- **E2E tests** on push to main — needs `TEST_SUPABASE_*`, `E2E_USER_*` GitHub secrets

---

## 9. Demo Seed Data

Run `node scripts/seed-demo.mjs` to populate the "admin corp" workspace with:

- **19 vendors** — Razorpay, HDFC Bank, Freshworks, TCS, Zoho, Wipro, Keka, Darwinbox, Infosys BPM, Quess Corp, Sify Technologies, Yotta Data Services, Apollo HealthCo, Birlasoft, GreytHR — covering every risk level, status, compliance state, and document category
- **67 documents** — v2 metadata pre-populated (cert numbers, scopes, accreditation bodies, regions)
- **6 assessments** — complete with all 17 question responses
- **11 reviews** — annual, quarterly, security, compliance; including one rejected review
- **9 document requests** — pending requests for high-risk / underdocumented vendors
- **Pre-written AI summaries** for 9 key vendors
- Idempotent — safe to re-run (uses ON CONFLICT DO NOTHING throughout)

---

## 10. Product Roadmap

### Vendor Governance — All features complete ✅

| Feature | Status |
|---|---|
| Vendor Owner Assignment | ✅ Done |
| Vendor Type Templates + Checklist | ✅ Done |
| Activity Feed | ✅ Done |
| Team Management + RBAC | ✅ Done |
| Email Notification Engine (Resend) | ✅ Done |
| PDF Executive Reports | ✅ Done |
| AI Vendor Summary (Gemini) | ✅ Done |
| AI Explain Score | ✅ Done |
| AI Risk Explanation | ✅ Done |
| AI Recommended Actions | ✅ Done |
| AI Assessment Summary | ✅ Done |
| Executive Summary PDF (AI-narrated) | ✅ Done |
| AI Weekly Executive Brief | ✅ Done |
| Document Classification (7 categories) | ✅ Done |
| Metadata Extraction v2 (10 fields) | ✅ Done |
| Natural Language Vendor Search | ✅ Done |
| Document Request Workflow | ✅ Done |
| Vendor Portal (magic link) | ✅ Done |
| Vendor Risk Engine | ✅ Done |
| Security Assessments | ✅ Done |
| Vendor Reviews | ✅ Done |
| Audit Package Generator | ✅ Done |
| Search / Filter / Pagination | ✅ Done |
| Document Manual Edit + Re-extract | ✅ Done |
| Comprehensive Demo Seed Data | ✅ Done |

### Future Modules (Roadmap)

| Year | Module |
|---|---|
| 2027 | Compliance Management — controls, policies, evidence, framework scores |
| 2028 | DPDP Privacy + Audit Workspace |
| 2029 | Risk Management — register, heat maps, remediation |
| 2030 | Board Governance + Trust Center |

---

## 11. Critical Caveats & Gotchas

| Issue | Detail |
|---|---|
| **Lazy DB Proxy** | `lib/db/index.ts` defers `postgres()` to runtime. Never revert. Breaks Vercel build if reverted. |
| **`proxy.ts`** | Next 16 renamed `middleware.ts` → `proxy.ts`. Session refresh + route guards live here. |
| **`force-dynamic`** | Every protected page needs `export const dynamic = "force-dynamic"` — prevents Vercel build failures. |
| **PDF routes** | Use `await import("@react-pdf/renderer")` (dynamic ESM import) NOT require(). Mixing ESM/CJS causes "Cannot read 'S'" crash. Wrap buffer as `new Uint8Array(buffer)`. |
| **Supabase pooler** | Use `aws-1-ap-south-1.pooler.supabase.com` — direct `db.<ref>` host is IPv6-only, fails locally. Occasional transient ENOTFOUND on local dev — retry. |
| **Confirm email** | Must be OFF in Supabase Auth settings for sandbox — otherwise signup returns no session. |
| **Service role key** | `SUPABASE_SERVICE_ROLE_KEY` is placeholder — needed for team invite. Add to Vercel env vars. |
| **`.claude/settings.local.json`** | Gitignored — never commit (previously caused GitHub push protection blocks). |
| **Git push** | Credential manager configured: `git push origin main` works. No tokens in push URL. |
| **GitHub push protection** | Previously blocked tokens in committed files. Resolved. All secrets in gitignored files. |
| **Screenshot preview** | Times out on this machine due to CSS animations. Verify UI via `fetch/DOM eval` instead. |
| **Vitest vs Playwright** | E2E `.spec.ts` files in `tests/e2e/` excluded from Vitest via `exclude` in `vitest.config.ts`. |
| **`db.transaction` mock** | Must call through: `vi.fn((fn) => fn({}))`. Plain `mockResolvedValue` silently skips transaction body. |
| **Scoring module** | Pure functions in `lib/services/scoring.ts` — separated from `vendor-service.ts` so client components can import without pulling in DB. |
| **PDF CSS** | react-pdf v4 does NOT support: `gap`, `border` shorthand, `paddingHorizontal/Vertical`. Use explicit longhand only. |
| **NL search Gemini rate limit** | `parseNaturalLanguageSearch()` falls back to simple text search if Gemini returns 503. Non-blocking. |
| **AI fields on vendor** | `aiRecommendedActions` is JSONB (`unknown` in Drizzle types). Use `Omit<Vendor,"aiRecommendedActions"> & { aiRecommendedActions?: RecommendedAction[] | null }` in component props. |

---

## 12. Dev Commands Reference

```bash
# Development
npm run dev                    # Local server on :3000

# Build & Deploy
npm run build                  # Production build (tsc + Next.js)
git push origin main           # Auto-deploys to Vercel

# Database
npm run db:generate            # Generate Drizzle migration from schema
npm run db:migrate             # Apply migrations to DB
npm run db:studio              # Drizzle Studio GUI

# SQL utilities
node scripts/apply-sql.mjs supabase/rls.sql
node scripts/apply-sql.mjs supabase/storage.sql
node scripts/seed-templates.mjs   # Seed 7 default vendor type templates
node scripts/seed-demo.mjs        # Seed 15 realistic Indian vendors (idempotent)
node scripts/seed-e2e.mjs         # Seed E2E test user + workspace
node scripts/check-db.mjs         # Quick DB state check

# Tests
npm run test                   # Run all 201 Vitest tests
npm run test:coverage          # With coverage report (coverage/ dir)
npm run test:watch             # Watch mode
npm run test:e2e               # Playwright (needs running server)
npm run test:e2e:ui            # Playwright with visual UI
npm run test:all               # Vitest + Playwright
```

---

## 13. Environment Variables

```bash
# Supabase (sandbox — rotate before production)
NEXT_PUBLIC_SUPABASE_URL="https://gacmazsbzxtwhwsgkuco.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_WKP94LJaUHL36tNJexFzRQ_LJPyLvKj"
SUPABASE_SERVICE_ROLE_KEY="<needed for team invite — still placeholder>"

# Database (use Supavisor pooler, NOT direct connection)
DATABASE_URL="postgresql://postgres.gacmazsbzxtwhwsgkuco:%40%26uR%3F9u%2Buz5h%23sZ@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
DATABASE_URL_DIRECT="...same host, port 5432, for migrations only"

# AI — Google Gemini
GEMINI_API_KEY="AQ...."         # Google AI Studio — AQ. prefix format
# GEMINI_MODEL="gemini-2.5-flash"  # optional override

# Email — Resend
RESEND_API_KEY="re_4AH3iAsB_..."
RESEND_FROM="Lekha OS <notifications@resend.dev>"

# Cron security
CRON_SECRET="141fa3621055f070354112f5583d83d5e9520865e2e774fb"

# Site
NEXT_PUBLIC_SITE_URL="https://lekha-os.vercel.app"
```

See `.env.example` for full documentation.
