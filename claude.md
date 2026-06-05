# Lekha OS — Claude Code Reference

> **End-to-end project brief for any AI session. Read this first.**

---

## 1. Product Brief

**Lekha OS** is the Trust, Governance & Compliance (GRC) Operating System for Indian businesses.
Replaces spreadsheets and disconnected tools with a single AI-native platform for vendor governance, compliance, audits, risk and board governance.

- **Positioning:** Category-defining OS — not a point solution
- **Modules shipped:** Vendor Governance · Compliance Management · Settings & Org Management
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
| Auth | Supabase Auth + org-based RBAC (7 roles) |
| Storage | Supabase Storage — `vendor-documents` bucket, org-scoped RLS |
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

**31 tables** across 7 migration files (0000–0006 — all applied).

### Vendor Governance tables (15)

| Table | Purpose |
|---|---|
| `organizations` | Tenant boundary (extended: legalName, industry, companySize, website, country, state, timezone, logoUrl) |
| `profiles` | Mirrors auth.users (extended: jobTitle, department, phone, timezone, language) |
| `memberships` | User↔org join with role + department + `is_active` |
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
| `audit_logs` | Every meaningful action recorded (with actor profile join for UI) |

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

**Membership roles (7):** `owner` · `admin` · `member` · `viewer` · `compliance_manager` · `security_manager` · `procurement_manager`

**Settings enums:** `industry_type` · `company_size_range` · `api_key_status` · `api_key_permission` · `integration_provider` · `integration_status`

**Compliance enums:** `framework_status` · `control_status` · `control_priority` · `evidence_status` · `evidence_source` · `policy_status`

**RLS:** All 31 tables enabled. Helpers: `is_org_member()`, `has_org_role()`.

**First-time setup on a fresh DB:**
```bash
npm run db:migrate
node scripts/apply-sql.mjs supabase/rls.sql
node scripts/apply-sql.mjs supabase/storage.sql
node scripts/seed-templates.mjs
node scripts/seed-billing-plans.mjs --assign-all
node scripts/seed-demo.mjs                          # optional: 15 realistic vendors
node scripts/seed-compliance-frameworks.mjs         # optional: 5 frameworks + 174 controls
node scripts/seed-compliance-demo.mjs               # optional: realistic demo state
```

---

## 6. Features Implemented

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

--- Settings (8-tab sub-nav) ---
/settings                                    Profile + notifications
/settings/organization                       Org profile + branding
/settings/team                               Team management
/settings/security                           Password + MFA + login history
/settings/audit-logs                         Filterable org-wide audit log + CSV export
/settings/billing                            Plan overview + usage meters
/settings/api-keys                           API key management
/settings/integrations                       Integration provider cards
/settings/notifications                      (redirected to /settings — notifications merged into Profile tab)

--- REST API (Bearer token) ---
GET /api/v1/vendors                          Paginated vendor list
GET /api/v1/vendors/[id]                     Single vendor
GET /api/v1/compliance/frameworks            All frameworks with readiness
GET /api/v1/compliance/gaps                  Open gaps (?severity=, ?resolved=)
GET /api/v1/audit-logs                       Event stream (?module=, ?from=, ?to=, ?userId=)

--- Platform ---
/portal/[token]                              Vendor self-service portal (no auth)
/api/cron/expiry  /api/cron/digest           Scheduled cron routes (CRON_SECRET)
/api/export/audit-logs                       CSV export (session auth)
/auth/callback                               Supabase auth redirect
```

---

## 8. Key File Map

```
lib/
  db/
    schema.ts                   31-table Drizzle schema — all enums + tables + inferred types
    index.ts                    Lazy DB Proxy — ssl:"require", pool config — CRITICAL, do not change

  providers/                    ← INFRASTRUCTURE ADAPTERS (only place SDKs are imported)
    ai/index.ts                 Lazy GoogleGenAI singleton · generateText() · getAI() · AI_MODEL · isAIConfigured()
    auth/index.ts               AuthProvider interface + factory (getAuthProvider())
    auth/supabase.ts            Supabase Admin SDK implementation (inviteUser)
    storage/index.ts            StorageProvider interface
    storage/supabase.ts         Supabase Storage implementation
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

  --- Server actions (thin transport — auth + service call + revalidatePath) ---
  vendors/actions.ts
  documents/actions.ts
  assessments/actions.ts
  reviews/actions.ts
  compliance/actions.ts         All compliance actions (frameworks, controls, evidence, policies, gaps, AI)
  settings/actions.ts           Profile, org, branding, password, API keys, integrations
  team/actions.ts               Invite, role, deactivate, reactivate, transfer ownership, resend invite

  storage/
    server.ts                   Thin delegator → providers/storage/supabase.ts (4 lines)
    paths.ts                    buildVendorDocPath() — pure path utility

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
    dashboard/, vendors/, compliance/, settings/   (see Section 7 for full route list)
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

supabase/
  migrations/
    0000–0004_*.sql             Initial schema through document_category enum
    0005_goofy_luke_cage.sql    Compliance Module — 6 enums + 10 tables ✅ APPLIED
    0006_clear_freak.sql        Settings Module — 6 enums + 6 tables + column extensions ✅ APPLIED
  rls.sql                       RLS policies + auth trigger (apply once)
  storage.sql                   Storage bucket + policies (apply once)

scripts/
  apply-sql.mjs                 Apply raw SQL to DB
  seed-templates.mjs            7 default vendor type templates
  seed-demo.mjs                 15 realistic Indian vendors + 67 docs (idempotent)
  seed-e2e.mjs                  E2E test user + workspace
  check-db.mjs                  Quick DB state check (counts)
  seed-compliance-frameworks.mjs   5 frameworks + 174 controls (idempotent)
  seed-compliance-demo.mjs         Statuses, evidence, 104 mappings, 8 policies, gaps, scores
  seed-billing-plans.mjs           Starter/Growth/Enterprise plans; --assign-all flag
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

### Module 1 — Vendor Governance ✅ Complete
### Module 2 — Compliance Management ✅ Complete (8 phases)
### Module 3 — Settings & Organization Management ✅ Complete

| Future Module | Status |
|---|---|
| DPDP Privacy + Audit Workspace | Roadmap |
| Risk Management — register, heat maps, remediation | Roadmap |
| Board Governance + Trust Center | Roadmap |

### Infrastructure (complete)

| Item | Status |
|---|---|
| Provider layer — auth, AI, storage, crypto, rate-limit | ✅ Done |
| AES-256-GCM integration config encryption | ✅ Done |
| REST API v1 — 5 read-only endpoints | ✅ Done |
| API key auth middleware (bcrypt Bearer validation) | ✅ Done |
| DB connection pool config (max=10, idle/connect timeouts) | ✅ Done |
| DB SSL — `ssl:"require"` (TLS enforced, no cert chain verification) | ✅ Done |
| In-memory rate limiting (100/300/1000 per 60s) | ✅ Done |
| API write endpoints (POST/PUT/DELETE /api/v1/*) | Roadmap |
| Redis-backed rate limiting (multi-instance) | Roadmap |
| SUPABASE_SERVICE_ROLE_KEY configured | ⚠ Pending — team invite blocked |

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
node scripts/seed-templates.mjs
node scripts/seed-demo.mjs
node scripts/seed-billing-plans.mjs --assign-all
node scripts/seed-compliance-frameworks.mjs [orgId] [--list]
node scripts/seed-compliance-demo.mjs
node scripts/seed-e2e.mjs
node scripts/check-db.mjs

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

### Vercel status (as of Jun 2025)

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
RESEND_FROM="Lekha OS <notifications@lekhaos.in>"

# Cron security
CRON_SECRET="..."

# Encryption — REQUIRED for integration config storage
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY="<64-char hex string — 32 bytes>"

# Site
NEXT_PUBLIC_SITE_URL="https://lekha-os.vercel.app"
```

See `.env.example` for full documentation.
