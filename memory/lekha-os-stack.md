---
name: lekha-os-stack
description: "AUDT platform — 32 modules shipped, 259 DB tables, Phase 2 enterprise quality complete 2026-06-25"
metadata: 
  node_node: memory
  type: project
  originSessionId: 9b9b384a-70d6-484c-9980-e1535d0c524a
---

# AUDT — Current State

**Brand:** AUDT (rebranded from Lekha OS on 2026-06-07)  
**Tagline:** Governance Built on Proof.  
**Category:** AI-Native Trust, Risk & Compliance Platform (Governance OS)  
**Live at:** https://audt.tech (DNS propagating) + https://lekha-os.vercel.app  
**GitHub:** https://github.com/SandyRepo29/lekha-os (private)  
**Local:** `C:\Users\sandy\OneDrive\Desktop\LekhaOS`  
**Last updated:** 2026-06-25 (Phase 2 enterprise quality pass)

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Hosting:** Vercel (Mumbai `bom1`) + Supabase (`ap-south-1` Mumbai) — full India data residency
- **DB:** Supabase Postgres + Row-Level Security + Drizzle ORM · **259 tables** · 34 migrations (0000–0033, all applied)
- **Pooler:** Supavisor — `aws-1-ap-south-1.pooler.supabase.com` port 6543. MUST use pooler — direct host is IPv6-only, fails locally.
- **Auth:** Supabase Auth — Confirm email must be OFF for sandbox. 7 RBAC roles.
- **Storage:** Two private buckets: `vendor-documents` (legacy) + `compliance-documents` (new, `tenant_{orgId}/` prefix paths)
- **AI:** Google Gemini 2.5 Flash (`@google/genai`) — NOT Anthropic/Claude. Key format: `AQ.…`
- **PDF:** `@react-pdf/renderer` — `await import(...)` dynamic ESM in route handlers; buffer must be `new Uint8Array(buffer)` for NextResponse
- **Architecture:** Layered modular monolith — UI → server action → service (`lib/services/*`, DomainError) → repository → Postgres. Services have zero `next/*` imports.
- **Session:** `requireUser()` returns `AuthUser & { org: ActiveOrg | null; orgName: string }` — has `id`, `email`, `demo`, `org`, `orgName`. NO `profile` field. Use `s.id` for userId, `s.org?.id ?? ""` for orgId.
- **Actions:** Must return `void | Promise<void>` for form `action` props. Use `redirect()` for post-create navigation.
- **Windows encoding:** PowerShell 5.1 defaults to Windows-1252 when writing files — corrupts `™` (U+2122) and `—` (U+2014). Always use the Write tool or Python for file writes that include Unicode symbols. `scripts/fix-encoding.py` and `scripts/fix-emdash.py` exist to repair corrupted asset-intelligence pages.

---

## All Modules (32 complete)

| Module | Routes | Status |
|---|---|---|
| Module 1 — Vendor Hub™ | `/vendors/*` | ✅ Complete (V2 2026-06-23) |
| Module 2 — Evidence Vault™ (Compliance) | `/compliance/*` | ✅ Complete |
| Module 3 — Settings & Org Management | `/settings/*` | ✅ Complete |
| Phase 1 — Data Governance | `/settings/data-governance` | ✅ Complete |
| Module 4 — Audit Management | `/audits/*` | ✅ Complete (2026-06-06) |
| Module 5 — Risk Lens™ | `/risks/*` | ✅ Complete (2026-06-07) |
| Module 6 — Control Center™ | `/controls/*` | ✅ Complete (2026-06-07) |
| Module 7 — Trust Intelligence™ | `/trust-intelligence/*` | ✅ Complete (V2 2026-06-25) |
| Module 8 — Governance Trends™ + Continuous Monitoring™ | `/trust-intelligence/trends`, `/monitoring` | ✅ Complete (2026-06-09) |
| Module 9 — Trust Graph™ | `/trust-intelligence/trust-graph` | ✅ Complete (2026-06-09) |
| Module 10 — Policy Governance™ | `/policy-governance/*` | ✅ Complete (2026-06-09) |
| Module 11 — DPDP Privacy™ | `/dpdp-privacy/*` | ✅ Complete (2026-06-09) |
| Module 12 — Contract Governance™ | `/contract-governance/*` | ✅ Complete (V2 2026-06-23) |
| Module 13 — Issue & Remediation Hub™ | `/issue-hub/*` | ✅ Complete (2026-06-10) |
| Module 14 — Workflow Studio™ | `/workflow-studio/*` | ✅ Complete (2026-06-10) |
| Module 15 — Third-Party Risk Exchange™ | `/trust-exchange/*` | ✅ Complete (2026-06-11) |
| Module 16 — Governance Benchmarking™ | `/benchmarking/*` | ✅ Complete (2026-06-11) |
| Module 17A — Integration Hub™ | `/integration-hub/*` | ✅ Complete (2026-06-11) |
| Module 18 — Trust Network™ | `/trust-network/*` | ✅ Complete (2026-06-11) |
| Module 19 — Executive Reporting & Analytics™ | `/executive-reporting/*` | ✅ Complete (2026-06-12) |
| Module 20 — AI Governance™ | `/ai-governance/*` | ✅ Complete (2026-06-13) |
| Module 21 — Auditor Collaboration™ | `/auditor-collaboration/*` | ✅ Complete (2026-06-13) |
| Module 22 — Trust API Platform™ | `/trust-api/*` | ✅ Complete (2026-06-13) |
| Module 23 — Trust Verification Authority™ | `/trust-verification/*`, `/verify/[id]` | ✅ Complete (2026-06-13) |
| Module 28 — Continuous Compliance™ | `/continuous-compliance/*` | ✅ Complete (2026-06-13) |
| Module 29 — Governance Agent Framework™ | `/agents/*` | ✅ Complete (2026-06-13) |
| Module 30 — Regulatory Intelligence™ | `/regulatory-intelligence/*` | ✅ Complete (2026-06-14) |
| Module 31 — Asset Intelligence™ | `/asset-intelligence/*` | ✅ Complete (2026-06-16) |
| Module 32 — Security Command Center™ | `/security-center/*` | ✅ Complete (2026-06-16) |
| Trust Score™ | embedded in vendor detail | ✅ Complete (V2 7-component 2026-06-23) |

---

## Shared Component Library (added Phase 2, 2026-06-25)

Always use these — never build one-off patterns.

| Component | Path | Purpose |
|---|---|---|
| ArchiveDialog | `components/ui/archive-dialog.tsx` | Safe delete — Archive default, hard-delete requires name confirmation |
| ConfirmDialog | `components/ui/confirm-dialog.tsx` | Simple confirmation modal |
| CacheIndicator | `components/ui/cache-indicator.tsx` | AI output age + Refresh button |
| SkeletonCard | `components/ui/skeleton-card.tsx` | Animated loading skeleton |
| BulkActionBar | `components/ui/bulk-action-bar.tsx` | Fixed-bottom multi-select action toolbar |
| ImportModal | `components/ui/import-modal.tsx` | 3-step CSV import: upload → preview → confirm |
| SearchInput | `components/ui/search-input.tsx` | "use client" URL-param search input |
| PageHeader | `components/ui/page-header.tsx` | Standard h1 + description + actions row |
| toast() + ToastContainer | `components/ui/toast-simple.tsx` | Imperative toast — ToastContainer must be in app/(app)/layout.tsx |
| NotificationBell | `components/notifications/notification-bell.tsx` | Bell + unread badge — integrated in topbar |
| NotificationPanel | `components/notifications/notification-panel.tsx` | Slide-over notifications list |

**Hooks & utilities:**

| File | Purpose |
|---|---|
| `hooks/use-selection.ts` | Multi-select state for list views |
| `hooks/use-notifications.ts` | Fetches /api/v1/notifications, falls back to mock |
| `lib/ui/role-guard.ts` | canEdit(role), canDelete(role), canCreate(role), isAdminOrOwner(role) |
| `lib/utils/csv-parser.ts` | parseCSV(), validateCSVHeaders(), generateCSVTemplate() |

---

## Import Infrastructure (Phase 2)

CSV import implemented for Vendors and Risks. Pattern for future modules:
- `components/[module]/[entity]-import-button.tsx` — "use client", opens ImportModal
- `lib/[module]/import-actions.ts` — "use server", validates + creates via service
- Template CSV at `public/templates/[entity]-import-template.csv`

---

## Role-Based UI Pattern (Phase 2)

```ts
import { canEdit, canDelete, canCreate } from '@/lib/ui/role-guard'
// session.role comes from requireUser() in server components
{canDelete(session.role) && <DeleteButton />}
{canEdit(session.role) && <EditButton />}
```

Applied to: vendor list, vendor detail, risk list, risk detail.

---

## Delete / Archive Pattern (Phase 2)

All delete flows now use ArchiveDialog. Archive is the default; hard-delete requires typing the item name. Applied to audit detail, risk detail. Apply to all future modules.

---

## Navigation (Phase 2 fix)

Three previously orphaned modules added to sidebar:
- Trust Network™ → `/trust-network`
- Policy Governance™ → `/policy-governance`
- Workflow Studio™ → `/workflow-studio`

---

## New API Routes (Phase 2)

| Route | Purpose |
|---|---|
| `GET /api/v1/notifications` | Governance alerts for notification bell |
| `GET /api/v1/contracts/export/csv` | Contracts CSV |
| `GET /api/v1/assets/export/csv` | Assets CSV |

---

## Build State

- TypeScript: 0 errors (verified after Phase 2)
- Tests: 201/201 passing (Vitest)
- DB: 259 tables across migrations 0000–0033 (all applied)
- Deployed: https://lekha-os.vercel.app (Vercel auto-deploy on push to main)
- Last major work: Phase 2 enterprise quality — 55-item audit implementation (2026-06-25)
- Audit report: `audt_platform_audit_june2026.md` in project root

---

## Outstanding Config (code ready, env vars missing)

| Var | Blocked |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Team invite flow |
| `RESEND_API_KEY` | Email alerts + weekly digest |
| `CRON_SECRET` | Cron endpoints unprotected |
| S3 provisioning | `lib/providers/storage/s3.ts` — just needs implementing |

---

## Critical Caveats

- **`ssl:"require"`** in `lib/db/index.ts` — NEVER change to `rejectUnauthorized:true` (Supabase cert not in Node CA bundle → crash on Vercel)
- **Lazy DB Proxy** — `lib/db/index.ts` defers `postgres()` to runtime. Never revert.
- **`proxy.ts`** — Next 16 renamed `middleware.ts`. `/api/v1/*` excluded — API routes handle own auth.
- **`force-dynamic`** — every protected page needs this export.
- **Provider rule** — `@supabase/supabase-js` (admin) and `@google/genai` imported ONLY in `lib/providers/`.
- **Analytics tables** use `org_id` (not `organization_id`) as the FK column name.
- **`tva_verifications`** — Trust Verification Authority uses this name (not `trust_verifications`) to avoid collision with Trust Exchange's `trust_verifications` table.
- **Continuous Compliance™ health score** — DB column is `open_findings` (not `open_signals`). Drizzle field: `openFindings`.
- **Built-in checks** — `compliance_checks` rows with `organization_id = NULL` are returned to all orgs via `OR organization_id IS NULL` repo query.
- **Asset Intelligence™ encoding** — Pages written via PowerShell corrupted ™ and —. Fixed via binary replacement scripts. Always use Write tool for new asset-intelligence pages.
- **`is_asset_member()` RLS helper** — Migration 0032 creates this Postgres function for Asset Intelligence™ junction table RLS. Never bypass.
- **Seed org targeting** — `seed-asset-intelligence.mjs` uses `SELECT organization_id FROM memberships GROUP BY organization_id ORDER BY count(*) DESC LIMIT 1` (NOT `SELECT id FROM organizations LIMIT 1` which returns E2E test org).
- **`findVendorsByOrg`** — takes 1 argument (orgId only). Do not pass a second `{}` options arg — TypeScript error and was fixed in commit `233f4ea`.
- **Trust Intelligence™ `getSnapshotHistory`** — imported from `lib/repositories/trust-intelligence-repo`, NOT from the service layer. Returns `GovernanceSnapshot[]` with `orgTrustScore`, `vendorTrustScore`, `riskPostureScore`, `avgControlHealth`, `avgFrameworkReadiness`, `snapshotDate`.
- **HTML entities in TSX** — use `&#8482;` (™), `&#8212;` (—), `&#8593;` (↑), `&#8595;` (↓), `&#8594;` (→) to avoid PowerShell/encoding corruption risk.
- **ToastContainer placement** — must be rendered inside `app/(app)/layout.tsx` for `toast()` calls to work globally. The `_setToast` singleton wires at mount.
- **Bulk action client components** — `vendor-list-table.tsx` and `risk-list-table.tsx` are "use client" wrappers around the table that use `useSelection`. The server hub page passes the data array as props.
- **SearchInput is "use client"** — uses `useRouter` + `useSearchParams`. Must be imported into server hub/list pages as a client island; the surrounding page stays server.
- **importVendorsAction / importRisksAction** — live in `lib/vendors/import-actions.ts` and `lib/risk/import-actions.ts` (separate from the main `actions.ts` files). Deduplicate by name within org before inserting.
- **notification-types.ts has no "use client"** — it's a plain type file shared between server and client. Keep it that way.
- **Page metadata exports** — cannot be in "use client" files. If a hub page has "use client", add the title to the nearest `layout.tsx` instead.
