# AUDT Enterprise Readiness Assessment
## Epic 04 – Enterprise Foundation
**Version 1.0 · 2026-06-27**

---

## Deliverable 1 — Enterprise Readiness Scorecard

| Domain | Score | Status |
|---|---|---|
| 1. Identity & Access Management | 6/10 | MFA/sessions strong · SSO schema-only · no SCIM · no password reset |
| 2. Authorization | 7/10 | 7-role RBAC solid · no field-level · no object-level scoping |
| 3. Tenant Administration | 6/10 | Org settings good · no dept structure · no multi-workspace · billing limits unenforced |
| 4. Security | 7/10 | Encryption, headers, cookies all correct · column encryption missing · no malware scanning |
| 5. Data Governance | 5/10 | Export works · deletion scaffolded · no retention policies · soft-delete inconsistent |
| 6. Operational Resilience | 6/10 | Health endpoint + cron solid · no structured logging · no alerting · CRON_SECRET unset |
| 7. API Platform | 7/10 | 99 endpoints, versioned, rate-limited · no OpenAPI · no request schema validation |
| 8. Integration Platform | 3/10 | 35+ connectors in catalogue · zero real implementations · Phase 1 simulation only |
| 9. Platform Administration | 7/10 | Audit logs, team management, billing UI solid · sparse action logging · no system alerts |
| 10. Auditability | 6/10 | Append-only table, RLS-protected · most CRUD operations not logged · no before/after diffs |
| 11. Performance & Scalability | 6/10 | Pagination enforced · no distributed rate limiting · no Redis · hits limits at 100k records |
| 12. Customer Administration | 6/10 | User lifecycle works · no workspace switcher · billing limits not enforced |
| 13. Enterprise UX | 6/10 | Responsive, consistent, help system · no accessibility (WCAG) · no keyboard shortcuts · no error boundaries |
| **Overall** | **6.2/10** | **SMB-ready · Enterprise deployment needs hardening** |

**Bottom line:** AUDT is production-ready for mid-market governance teams today. It is not yet suitable for Fortune 500 procurement approval, regulated industry deployment (banking, healthcare, fintech), or enterprise IT sign-off. The gap is not governance functionality — it is enterprise plumbing.

---

## Deliverable 2 — Capability Maturity Matrix

| Capability | Current State | Maturity | Gap | Priority |
|---|---|---|---|---|
| TOTP MFA | Full enrollment, recovery codes, enforcement modes, device trust | Complete | None | — |
| Session management | Idle/absolute timeout, concurrent session cap, httpOnly cookies | Complete | None | — |
| Password policy | Complexity, history, lockout, expiry per org | Complete | None | — |
| IP allowlists | CIDR rules, context-aware, proxy enforcement | Complete | None | — |
| Security headers | HSTS, CSP, X-Frame-Options, Permissions-Policy | Complete | None | — |
| AES-256-GCM encryption | Integration configs, TOTP secrets | Complete | Extend to PII columns | P1 |
| 7-role RBAC | Owner→viewer + 3 specialist roles, centralized guards | Complete | Add field-level and object-level | P1 |
| Multi-tenant RLS | 50+ tables, Postgres-enforced | Complete | Audit newer toe_/platform_ tables | P2 |
| Audit log (append-only) | Immutable, filterable, CSV export | Complete | Sparse — most CRUD not logged | P1 |
| REST API v1 | 99 endpoints, versioned, paginated, Bearer auth | Complete | No OpenAPI, no schema validation | P2 |
| Rate limiting | Per-key in-memory sliding window | Partial | Not distributed — resets per serverless instance | P1 |
| Health endpoint | DB, AI, email, storage, encryption checks | Partial | No external alerting, no structured logs | P2 |
| Cron jobs | 4 jobs (expiry, digest, billing, governance-snapshot) | Partial | CRON_SECRET unset in Vercel | P1 |
| Tenant data export | ZIP of 5 CSVs | Partial | No document files included, no deletion execution | P2 |
| Plan entitlements | Feature flags per plan, trial gets all | Partial | Limits stored but not enforced at routes | P1 |
| Org branding | Colors, footer, email signature | Partial | Timezone/language stored but not used | P2 |
| Onboarding wizard | 3-step org setup + goals + invites | Partial | Goals only in localStorage, no business unit structure | P3 |
| SAML/OIDC SSO | DB schema, UI configuration form | Missing | No auth flow, no library, no routes | P1 |
| SCIM provisioning | Nothing | Missing | No endpoints, no user sync | P2 |
| Password reset (unauthenticated) | Nothing | Missing | Supabase recovery tokens available but not wired | P1 |
| Field-level permissions | `canViewSensitive()` stub returns `true` | Missing | Sensitive data visible to all members in org | P1 |
| Object-level permissions | Nothing | Missing | Cannot scope user to subset of vendors/risks | P2 |
| Department structure | Free-text field only | Missing | No hierarchy, no assignment rules | P2 |
| Multi-workspace switching | Nothing | Missing | Cannot manage multiple orgs without logout | P2 |
| Real integrations | 35+ UI connectors, simulated syncs | Missing | Zero real API calls to external systems | P1 |
| OpenAPI specification | Nothing | Missing | No `/api/docs`, no SDK generation | P2 |
| Request schema validation | Minimal inline checks | Missing | No Zod at API boundary | P2 |
| Distributed rate limiting | In-memory per instance | Missing | Redis/Upstash needed for horizontal scale | P1 |
| Data retention policies | No table, no CRON | Missing | Data grows unbounded, DPDP risk | P1 |
| Soft delete | Inconsistent across modules | Missing | Hard delete on vendors, risks; no recovery | P2 |
| Structured logging | `console.log` only | Missing | No pino/winston, no correlation IDs | P2 |
| Error boundaries | Nothing | Missing | No `error.tsx`, blank page on crash | P2 |
| WCAG accessibility | Minimal ARIA usage | Missing | Screen readers, keyboard nav not functional | P2 |
| Keyboard shortcuts | None documented | Missing | No Cmd+K, no navigation shortcuts | P3 |
| Timezone-aware display | Stored, never used | Missing | All timestamps UTC only | P3 |
| i18n / localization | Language selector exists, no translations | Missing | False affordance; hardcoded English | P3 |
| Column-level encryption | Integration configs only | Missing | PII, financials, assessments in plaintext | P2 |
| Alerting / on-call | Nothing | Missing | No PagerDuty, Slack, OpsGenie integration | P2 |
| Backup / DR | Supabase default (assumed) | Missing | No documented RTO/RPO, no restore tested | P2 |

---

## Deliverable 3 — Gap Analysis

### Identity & Access Management Gaps

**G-IAM-01 — SAML/OIDC SSO (Critical)**

DB schema exists (`sso_providers`, `sso_domains`), plus configuration UI in Security Command Center. But there is no authentication flow. No SAML assertion handler (`/auth/saml/acs`), no OIDC token exchange (`/auth/oidc/callback`), no library integrated. `force_redirect` and `jit_enabled` flags are stored but never read. Enterprises mandate SSO before allowing any SaaS procurement. This is the single highest-impact gap.

**G-IAM-02 — Password Reset (High)**

Authenticated users can change their password via `/settings/security`. Unauthenticated users who forget their password have no self-service reset path. There is no `/auth/forgot-password` page, no reset token generation, no reset email. Supabase provides recovery token APIs ready to use. This directly blocks any user who gets locked out.

**G-IAM-03 — SCIM 2.0 (High)**

No `/scim/v2/Users` or `/scim/v2/Groups` endpoints exist. Enterprise IT teams provision and deprovision users automatically through their IdP (Okta, Entra). Manual invite-only is unacceptable for organizations with 500+ employees. Without SCIM, offboarding a leaver requires manual admin action in AUDT, creating security gaps.

**G-IAM-04 — Delegated Administration (Medium)**

The 7-role model covers governance functions well but has no delegation concept. An `admin` can do everything an `owner` can except transfer ownership. There is no way to delegate invite rights to a team lead without granting them full admin access to the entire platform. Enterprises routinely need regional admins or departmental admins scoped to their function.

### Authorization Gaps

**G-AUTH-01 — Field-Level Permissions (High)**

The `canViewSensitive()` function in `lib/ui/role-guard.ts` exists but returns `true` unconditionally. A `viewer` role member can see vendor financial contract values, assessment scores, and audit findings. A `procurement_manager` can read compliance gaps they have no responsibility for. Enterprises require role-scoped data visibility, especially for GDPR-regulated personal data.

**G-AUTH-02 — Object-Level Scoping (Medium)**

Authorization is org-wide. There is no mechanism to say "this user can see vendors in the APAC region but not EMEA." All members see all data within the tenant. For large enterprises with hundreds of vendors across multiple business units, this creates information overload and potential data policy violations.

**G-AUTH-03 — Plan Limit Enforcement (High)**

`checkPlanLimit()` in billing service returns whether a limit is reached but nothing stops the create operation. The `requireFeature()` function exists but is not called at API route boundaries. Trial and starter orgs can create unlimited vendors, unlimited users, and unlimited storage — exhausting Supabase quota with no safeguard.

### Data Governance Gaps

**G-DG-01 — Data Retention Policies (High)**

The DPDP Act 2023 requires that personal data be deleted once the purpose for which it was collected is served. There are no `retention_policies` table, no automated purge jobs, and no UI to configure retention periods. Currently all data is kept forever. This is a direct compliance risk for an Indian B2B SaaS.

**G-DG-02 — Right to Erasure (High)**

The deletion request workflow has a UI button and stores a request row, but no backend execution. GDPR Article 17 and DPDP Section 12 require erasure within 30 days of a valid request. There is no enforcement mechanism, no deadline tracking, no deletion audit trail.

**G-DG-03 — Soft Delete (Medium)**

Vendors are hard-deleted via SQL `DELETE`. If a user accidentally deletes a vendor with associated documents, assessments, and risks, recovery requires a full database restore. There is no 30-day recovery window. The `status` enum on `vendor_documents` is unused for soft-delete purposes.

**G-DG-04 — Audit Log Coverage (High)**

The `audit_logs` table is correctly append-only and RLS-protected. But a survey of services shows that most CRUD operations do not call `recordAudit()`. Vendor updates, risk score changes, framework control modifications, compliance gap creation — none of these generate audit entries. An enterprise compliance audit would immediately identify that configuration changes are not traceable.

### Operational Gaps

**G-OPS-01 — Structured Logging (Medium)**

All application logging uses `console.log` and `console.error`. On Vercel, these go to ephemeral function logs with no aggregation, no correlation IDs, no log levels. When an incident occurs, it is impossible to trace a request through multiple service calls. Enterprises require log shipping to SIEM platforms (Splunk, Datadog, Elastic).

**G-OPS-02 — Cron Secret Not Configured (Critical)**

The four cron routes (`/api/cron/expiry`, `/api/cron/digest`, `/api/cron/billing`, `/api/cron/governance-snapshot`) all check for `Authorization: Bearer ${CRON_SECRET}`. `CRON_SECRET` is missing from Vercel environment variables. Any actor can trigger billing events, trial expirations, and governance snapshots without authentication.

**G-OPS-03 — No External Alerting (Medium)**

The health endpoint returns structured status but no integration with alerting platforms. When DB goes down, no alert fires. Vercel dashboard is the only availability signal. There is no PagerDuty, OpsGenie, or Slack webhook for critical failures.

### API Gaps

**G-API-01 — No OpenAPI Specification (High)**

99 REST endpoints exist across 32 modules. There is no `openapi.json`, no `/api/docs` page, and no SDK generation capability. Enterprise platform teams require machine-readable API specs before building integrations. Developer onboarding is entirely manual.

**G-API-02 — No Request Schema Validation (Medium)**

API route handlers perform minimal inline validation (`if (!body.name)`). No Zod schema validation at the API boundary. Malformed payloads propagate to the service layer and produce DomainErrors with internal error messages leaked to the caller. Enterprise APIs must validate and sanitize at the boundary.

**G-API-03 — Distributed Rate Limiting (High)**

The in-memory rate limiter resets on every Vercel serverless cold start. With multiple instances (Vercel's default horizontal scaling), a client can effectively multiply its rate limit by the number of active instances. On a busy day with 10 instances running, a `read_only` key has 1,000 requests/minute, not 100.

### Integration Gaps

**G-INT-01 — Zero Real Connector Implementations (Critical)**

The Integration Hub is fully simulated. `simulateSyncResult(slug)` returns hardcoded record counts for every connector. Calling `syncIntegration()` never makes a real API call to Entra ID, Okta, AWS, GitHub, Jira, Slack, or any other system. This is appropriate for a demo but cannot be marketed as an integration platform to enterprise buyers.

---

## Deliverable 4 — Security Assessment

### Strengths (enterprise-grade)

- AES-256-GCM with auth tag verification on all integration credentials and TOTP secrets
- bcrypt (12 rounds) for API key hashing; keys never returned after initial generation
- Comprehensive security headers: HSTS 1yr + preload, CSP with `frame-ancestors 'none'`, X-Frame-Options DENY, Permissions-Policy
- Session cookies: `httpOnly: true`, `secure: true` in production, `sameSite: "lax"`
- RLS at Postgres layer on 50+ tables — tenant isolation cannot be bypassed via application bugs
- TOTP MFA with org-level enforcement, device trust, recovery codes

### Weaknesses Requiring Remediation

| Finding | Severity | Location |
|---|---|---|
| PII and financial data stored plaintext | High | All entity tables — `vendor_documents`, `vendors`, `contracts` |
| CRON_SECRET not set in production | Critical | Vercel environment |
| No malware/virus scanning on uploaded files | High | `lib/storage/server.ts` — no scan before upload completes |
| CSP uses `unsafe-inline` for scripts | Medium | `next.config.ts` — Next.js limitation; mitigatable with nonce |
| IPv6 native CIDR blocking incomplete | Medium | `lib/services/auth/ip-check-service.ts` — only handles `::ffff:` mapped |
| No HMAC signature on outbound webhooks | Medium | `lib/services/trust-api/trust-api-service.ts` |
| Geo-IP data collected but not enforced | Low | `user_sessions` table — country/city captured, no block rules |
| No key rotation automation | Low | `lib/providers/crypto/config-cipher.ts` — no version field |

---

## Deliverable 5 — Identity Assessment

### What Is Implemented

AUDT has a fully functional enterprise authentication stack for everything except SSO. TOTP MFA with org-level enforcement, per-org password policies, account lockout, device trust, IP allowlisting, session timeout, and concurrent session caps are all working. Session cookies are correctly hardened. This covers the majority of what a mid-market enterprise needs.

### What Is Missing

The enterprise-grade identity layer requires three things that are entirely absent: SSO (SAML/OIDC), SCIM provisioning, and self-service password reset. These three capabilities appear in every enterprise security checklist. Without them, AUDT cannot pass a procurement questionnaire from any company that has an IT department.

### Implementation Path

| Item | Library | Route(s) | Effort |
|---|---|---|---|
| Password reset | Supabase `auth.resetPasswordForEmail()` | `/auth/forgot-password`, `/auth/reset-confirm` | 1 day |
| SAML 2.0 | `@node-saml/node-saml` | `/api/auth/saml/metadata`, `/api/auth/saml/acs`, `/api/auth/saml/init` | 4 days |
| OIDC | `openid-client` | `/api/auth/oidc/init`, `/api/auth/oidc/callback` | 3 days |
| SCIM 2.0 | Custom (SCIM is REST) | `/scim/v2/Users`, `/scim/v2/Groups` | 6 days |

JIT provisioning for SSO uses the existing `jit_enabled` flag in `sso_providers`. Auto-create `profiles` + `memberships` row on first assertion/token with `default_role`. Domain enforcement reads `sso_domains` at login page to detect if SSO should be forced.

---

## Deliverable 6 — Integration Assessment

### Current State

The Integration Hub presents a compelling UI with 35+ connectors grouped by category (Identity, Cloud, Security, Source Control, ITSM, Communication, HR, Storage, Custom). Connection management, credential storage (AES-256-GCM encrypted), sync history, and event generation all work. But every sync calls `simulateSyncResult(slug)` which returns deterministic fake data. Not a single real API call exists.

### Connector Build Priority

| Connector | Enterprise Demand | Complexity | Priority |
|---|---|---|---|
| Microsoft Entra ID | Universal (90% of enterprises) | Medium — Graph API, OAuth2 | P1 |
| Okta | High — US/EU tech companies | Medium — Okta SDK | P1 |
| Slack | Universal — notifications | Low — Webhooks/Events API | P1 |
| GitHub | High — dev orgs | Low — REST + webhooks | P1 |
| Jira | High — ITSM | Medium — REST + OAuth2 | P2 |
| Microsoft Teams | High — Microsoft shops | Medium — Graph API | P2 |
| Google Workspace | Medium | Medium — Directory API | P2 |
| ServiceNow | Enterprise — large cos | High — SOAP + REST | P3 |
| CrowdStrike / Defender | CISO-driven | High — EDR API | P3 |
| AWS / Azure / GCP | Cloud-native orgs | High — multiple SDKs | P3 |

### Architecture Prerequisite

Before building any real connector, establish an async job queue. Real integration syncs take 30–120 seconds and cannot run inside a serverless function with a 10-second timeout. Use Vercel Queue API or BullMQ backed by Upstash Redis.

---

## Deliverable 7 — API Assessment

### Strengths

The API is well-structured. 99 endpoints across all 32 modules, consistently namespaced under `/api/v1/`, with standardized `{ data, meta }` response envelopes, proper HTTP status codes, Bearer authentication, per-key permission gates, and in-memory rate limiting with `X-RateLimit-*` headers. Pagination is enforced on all list endpoints.

### Gaps for Enterprise API Consumers

| Gap | Impact | Estimated Fix |
|---|---|---|
| No OpenAPI specification | Blocks SDK generation, Postman collections, API testing | `next-swagger-doc` or Redocly — 1 day |
| No request schema validation | Security risk, data integrity | Add Zod schemas to all POST/PUT routes — 3 days |
| No idempotency keys | Duplicate POST requests create duplicate records | `Idempotency-Key` header support — 2 days |
| Distributed rate limiting broken | Multi-instance bypass | Upstash Redis rate limiter — 1 day |
| No webhook signatures | Webhook delivery unverified | HMAC-SHA256 signing — 1 day |
| No bulk endpoints | Inefficient mass operations | `POST /api/v1/vendors/batch` etc. — 3 days |
| No cursor pagination | Offset pagination breaks at large datasets | Add `cursor` param to list endpoints — 2 days |
| No deprecation headers | Breaking changes ship silently | `Deprecation` + `Sunset` headers — 0.5 days |

---

## Deliverable 8 — Operational Readiness Assessment

### What Works

- Health endpoint (`/api/health`) checks DB latency, AI config, email config, storage config, encryption config — returns 503 on failure
- 4 daily/weekly cron jobs (expiry alerts, AI digests, billing, governance snapshots)
- Connection pool correctly configured (max=10, idle=20s, connect=10s, Supavisor pooler)
- SSL configured correctly (`ssl:"require"` — avoids cert chain issue with Supavisor)
- Vercel auto-deploy on push to main

### Operational Gaps

| Gap | Severity | Consequence |
|---|---|---|
| CRON_SECRET not set in Vercel | Critical | Any actor can trigger billing, trial expiry, governance snapshots without auth |
| RESEND_API_KEY not set | High | Email alerts silenced — no expiry warnings, no weekly digests |
| No structured logging | High | Cannot debug production incidents; no log aggregation |
| No external alerting | High | DB failure goes unnoticed until users complain |
| No distributed tracing | Medium | Cannot correlate logs across a request's service chain |
| No circuit breakers | Medium | Gemini API outage → all AI features fail with 500 |
| No retry/backoff | Medium | Transient failures cause hard errors |
| No documented RTO/RPO | Medium | Enterprises require SLA documentation during procurement |
| No load testing | Medium | Unknown failure point under concurrent load |
| No read replicas | Low | Report queries compete with write traffic on single DB |

### Immediate Operational Actions (Before Any Enterprise Deployment)

1. Set `CRON_SECRET` in Vercel environment variables
2. Set `RESEND_API_KEY` in Vercel environment variables
3. Set `SUPABASE_SERVICE_ROLE_KEY` in Vercel environment variables
4. Configure Vercel deployment failure → Slack alert

---

## Deliverable 9 — Risk Register

| ID | Risk | Probability | Impact | Severity | Mitigation |
|---|---|---|---|---|---|
| R-01 | Enterprise procurement blocked by missing SSO | Certain | Critical | **Critical** | Implement SAML/OIDC — G-IAM-01 |
| R-02 | CRON_SECRET unset allows unauthenticated billing manipulation | Certain | Critical | **Critical** | Set env var immediately |
| R-03 | User locked out with no self-service password reset | Likely | High | **Critical** | Implement forgot-password flow — G-IAM-02 |
| R-04 | DPDP/GDPR violation — no data retention or erasure | Certain | High | **High** | Implement retention policies + deletion execution |
| R-05 | Audit non-compliance — most CRUD ops not logged | Likely | High | **High** | Instrument all service writes |
| R-06 | Plan limits unenforced — Supabase quota exhaustion | Likely | High | **High** | Enforce at API route boundary |
| R-07 | Distributed rate limit bypass on horizontal scale | Likely | High | **High** | Replace in-memory with Redis |
| R-08 | WCAG accessibility failure — legal liability (ADA, EU EAA) | Likely | High | **High** | Add ARIA, keyboard nav, error boundaries |
| R-09 | PII data breach — sensitive data stored plaintext | Possible | High | **High** | Column-level encryption for PII |
| R-10 | IT/security rejection — no SCIM means manual offboarding | Likely | Medium | **High** | Implement SCIM 2.0 — G-IAM-03 |
| R-11 | Integration Hub misrepresented as real — customer trust damage | Possible | High | **High** | Clearly label as Phase 1 demo; build real connectors |
| R-12 | No malware scan — malicious file upload | Possible | High | **Medium** | Add virus scan on upload (ClamAV/VirusTotal) |
| R-13 | DB single point of failure — no DR | Possible | High | **Medium** | Document Supabase PITR; test restore; add secondary region |
| R-14 | Gemini API outage → all AI features 500 | Likely | Medium | **Medium** | Add graceful fallback; circuit breaker |
| R-15 | Object-level permission gap — cross-team data visibility | Certain | Medium | **Medium** | Implement resource_permissions table |
| R-16 | Webhook delivery unverified — spoofing risk | Possible | Medium | **Medium** | Add HMAC-SHA256 signature on outbound webhooks |
| R-17 | Timezone hardcoded UTC — poor UX in non-UTC orgs | Certain | Low | **Low** | Use org/user timezone in display layer |
| R-18 | Language selector misleads non-English users | Certain | Low | **Low** | Remove selector or implement i18n |

---

## Deliverable 10 — Prioritized Epic 04 Backlog

### Epic 04 Scope: Enterprise Foundation

The goal of Epic 04 is to close the gaps that prevent enterprise adoption. Governance functionality is complete. What remains is the infrastructure layer that enterprise IT, security, and procurement teams evaluate before signing a contract.

---

### Tier 1 — Critical Blockers
*Must ship before enterprise sales*

---

#### EP4-01 — Forgot Password / Self-Service Reset
**Gap:** G-IAM-02 · **Effort:** 1 day

Users who forget their password have no self-service path. Wire up Supabase `auth.resetPasswordForEmail()` to a `/auth/forgot-password` page and `/auth/reset-confirm` page. Send reset email via Resend with 1-hour expiry. Add password policy validation on new password entry.

---

#### EP4-02 — SAML 2.0 Enterprise SSO
**Gap:** G-IAM-01 · **Effort:** 4 days

Integrate `@node-saml/node-saml`. Create `/api/auth/saml/metadata` (SP metadata), `/api/auth/saml/acs` (assertion consumer), and `/api/auth/saml/init` (SP-initiated redirect). Read `sso_providers` and `sso_domains` tables per org. Implement JIT provisioning (create profile + membership on first login if `jit_enabled`). Enforce `force_redirect` on login page domain check.

---

#### EP4-03 — OIDC / OpenID Connect SSO
**Gap:** G-IAM-01 · **Effort:** 3 days

Integrate `openid-client`. Create `/api/auth/oidc/init` (redirect to IdP) and `/api/auth/oidc/callback` (token exchange + user provisioning). Support Entra ID, Okta, and Google Workspace as first-class providers. Store OIDC tokens per session; refresh on expiry.

---

#### EP4-04 — Distributed Rate Limiting (Upstash Redis)
**Gap:** G-API-03 · **Effort:** 1 day

Replace the in-memory sliding window rate limiter with Upstash Redis (`@upstash/ratelimit`). Serverless-compatible, zero infrastructure. Drop-in replacement for `lib/providers/rate-limit/index.ts`. All API key limits now enforced correctly across all Vercel instances.

---

#### EP4-05 — Plan Limit Enforcement
**Gap:** G-AUTH-03 · **Effort:** 2 days

Add enforcement middleware to `/api/v1/*` POST routes and key create actions. Before any create operation, call `checkPlanLimit(orgId, 'vendors')` and return 402 with upgrade prompt if limit reached. Add hard gates on the 30 `FeatureKey` types. Enforce seat limits on user invite.

---

#### EP4-06 — Set Missing Vercel Environment Variables
**Gap:** G-OPS-02 · **Effort:** 0.5 days

Set `CRON_SECRET`, `RESEND_API_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in Vercel. This unblocks: email alerts, weekly AI digests, team invite, and cron job security. Not a code change — purely ops.

---

### Tier 2 — High Priority
*Required before general availability*

---

#### EP4-07 — Comprehensive Audit Logging
**Gap:** G-DG-04 · **Effort:** 4 days

Instrument every service write (`createVendor`, `updateRisk`, `deleteControl`, `updateFramework`, `changeTeamRole`, `updateOrgSettings`, `rotateApiKey`, etc.) with a `recordAudit()` call. Pass `{ before, after }` in metadata for all updates. Merge auth events (`auth.login`, `auth.mfa_enroll`, `auth.password_change`, `auth.lockout`) into `audit_logs`. Target: zero untraced mutations.

---

#### EP4-08 — SCIM 2.0 User Provisioning
**Gap:** G-IAM-03 · **Effort:** 6 days

Create `/scim/v2/Users` (list, create, update, deactivate) and `/scim/v2/Groups` (list, create, sync). Authenticate via per-org SCIM Bearer token (store in `api_keys` with `scim` permission type). Map SCIM attributes to `profiles` and `memberships`. Support Okta and Entra ID attribute schemas. Auto-deactivate user on `active: false` from IdP.

---

#### EP4-09 — Data Retention Policies
**Gap:** G-DG-01 · **Effort:** 3 days

Add `retention_policies` table (orgId, entityType, retentionDays, createdBy). UI in `/settings/data-governance` to configure per-entity retention. Add daily CRON job (`/api/cron/data-retention`) that purges records older than policy. Support types: audit_logs, vendor_documents, risk_reviews, assessment_responses, governance_snapshots.

---

#### EP4-10 — Right to Erasure (GDPR/DPDP)
**Gap:** G-DG-02 · **Effort:** 3 days

When a deletion request is submitted, start 30-day countdown. On day 30, execute: anonymize `profiles` PII, hard-delete `vendor_documents`, `assessments`, `risks` for the requesting org, log deletion to immutable `data_deletion_audit` table. For DPDP compliance, generate deletion certificate (PDF). Notify requester via email.

---

#### EP4-11 — OpenAPI Specification
**Gap:** G-API-01 · **Effort:** 3 days

Generate `openapi.json` at `/api/docs` using `next-swagger-doc` or Zod-to-OpenAPI. Cover all 99 endpoints with request/response schemas. Include auth requirements, rate limit headers, pagination parameters. Serve interactive Swagger UI at `/docs`. Enables automated SDK generation for customers.

---

#### EP4-12 — Request Schema Validation (Zod)
**Gap:** G-API-02 · **Effort:** 3 days

Add Zod schemas to all POST/PUT `/api/v1/*` route handlers. Validate body before passing to service layer. Return 400 with structured error detail on schema violation. Infer TypeScript types from Zod schemas to eliminate manual interface duplication.

---

#### EP4-13 — Structured Logging (Pino)
**Gap:** G-OPS-01 · **Effort:** 3 days

Integrate `pino` with Vercel-compatible transport. Replace all `console.log/error` with `logger.info/error`. Include `orgId`, `userId`, `requestId` (correlation) in every log entry. Configure log shipping to Datadog or Axiom via Vercel integration. Log level configurable via env var.

---

#### EP4-14 — Error Boundaries
**Gap:** UX · **Effort:** 1 day

Add `error.tsx` to every route segment under `app/(app)/`. Create a shared `<ErrorBoundary>` client component wrapping complex client trees. Add a top-level 500 fallback page. Ensure all client-side crashes show a graceful recovery screen rather than a blank page.

---

#### EP4-15 — Soft Delete with Recovery Window
**Gap:** G-DG-03 · **Effort:** 4 days

Add `deleted_at TIMESTAMPTZ` column to `vendors`, `risks`, `controls`, `audits`, `contracts`, `issues`. Change all `deleteById()` repo functions to set `deleted_at = NOW()` instead of `DELETE`. Filter `WHERE deleted_at IS NULL` in all list queries. Add 30-day recovery UI. CRON job permanently purges records past recovery window.

---

### Tier 3 — Medium Priority
*Improves enterprise maturity*

---

#### EP4-16 — Real Connector: Microsoft Entra ID
**Effort:** 5 days

Integrate `@microsoft/microsoft-graph-client`. OAuth2 authorization code flow for admin consent. Sync: users (name, email, department, job title, MFA status), groups, conditional access policies. Map groups to AUDT roles. Surface MFA enrollment status per user. Fire governance events on policy change.

---

#### EP4-17 — Real Connector: Okta
**Effort:** 4 days

Integrate Okta SDK. OAuth2 authorization. Sync users, groups, MFA factors. Map Okta groups to AUDT roles. Enable SCIM push from Okta to AUDT.

---

#### EP4-18 — Real Connector: Slack (Notifications)
**Effort:** 2 days

Integrate Slack Webhooks API and Events API. Send governance alerts (expiring certs, overdue CAPAs, trust score drops) to configurable Slack channels. Support per-channel severity routing (critical → #security-alerts, all → #governance).

---

#### EP4-19 — Real Connector: GitHub
**Effort:** 3 days

Integrate GitHub REST API and webhooks. Sync: repos, branch protection rules, secret scanning alerts, Dependabot alerts. Map repos to vendor entries. Generate risks from critical alerts.

---

#### EP4-20 — Webhook Signatures (HMAC-SHA256)
**Effort:** 1 day

All outbound webhooks must include `X-AUDT-Signature: sha256=<hmac>` header. Compute HMAC using per-webhook secret stored in `tap_webhooks.secret` (encrypted). Document signature verification in developer portal.

---

#### EP4-21 — Field-Level Permissions
**Effort:** 3 days

Implement `canViewSensitive(role)` properly. Define sensitive fields per entity type (contract value, vendor financial score, audit finding details, risk scoring rationale). Mask fields in API responses based on caller role. Extend `lib/ui/role-guard.ts` with field-level map.

---

#### EP4-22 — Department Structure
**Effort:** 4 days

Create `departments` table (orgId, name, parentId, headUserId). UI to manage hierarchy under `/settings/team`. Assign vendors, risks, and audits to departments. Department heads can approve workflows scoped to their department. Filter lists by department membership.

---

#### EP4-23 — Multi-Workspace Switching
**Effort:** 2 days

Allow users with multiple org memberships to switch orgs without logout. Add workspace selector to topbar. Store active org in session. `requireUser()` returns active org based on selection, not just first membership.

---

#### EP4-24 — External Alerting (Operational)
**Effort:** 2 days

Integrate Vercel deployment hooks to Slack channel. Add `/api/health` polling via Vercel Cron every 5 minutes; alert on 503. Document runbook for DB down, Gemini down, storage quota exceeded. Optional: PagerDuty integration for critical governance alerts.

---

#### EP4-25 — Idempotency Keys
**Effort:** 2 days

Support `Idempotency-Key` header on all POST `/api/v1/*` routes. Cache response for 24h keyed by `(orgId + idempotency-key)` in Upstash Redis. Return cached response for duplicate requests. Prevents double-billing, double-risk-creation on retried API calls.

---

### Tier 4 — Future Enhancements

| ID | Item | Effort |
|---|---|---|
| EP4-26 | WCAG 2.1 AA Accessibility — ARIA, keyboard nav, skip links, contrast audit, screen reader testing | 7 days |
| EP4-27 | Timezone-aware display — `formatDateForUser()` utility applied to all timestamps, PDFs, emails | 2 days |
| EP4-28 | Internationalization — `next-intl`, wire language selector, launch English + Hindi | 5 days |
| EP4-29 | Column-level encryption — extend cipher pattern to PII columns (contact email, contract values, assessor names) | 4 days |
| EP4-30 | Cursor pagination — replace offset pagination on high-volume list endpoints | 3 days |
| EP4-31 | Bulk API operations — `POST /api/v1/vendors/batch`, `DELETE /api/v1/risks/batch` | 3 days |
| EP4-32 | Disaster recovery documentation — Supabase PITR test, RTO/RPO targets, quarterly restore drills | 3 days |

---

## Effort Summary

| Tier | Items | Estimated Effort |
|---|---|---|
| Tier 1 — Critical Blockers | EP4-01 to EP4-06 | ~11.5 days |
| Tier 2 — High Priority | EP4-07 to EP4-15 | ~23 days |
| Tier 3 — Medium Priority | EP4-16 to EP4-25 | ~26 days |
| Tier 4 — Future | EP4-26 to EP4-32 | ~27 days |
| **Total Tier 1 + 2** | | **~35 days** |
| **Total all tiers** | | **~87 days** |

Tier 1 + Tier 2 (35 development days) produce a platform that can pass enterprise procurement review, satisfy DPDP/GDPR data governance requirements, support real IdP integration via SAML/SCIM, and operate with production-grade observability.

---

## Success Criteria Assessment

| Question | Answer |
|---|---|
| Can AUDT be deployed inside a Fortune 500 organization today? | **No.** Missing SSO, SCIM, and password reset are pass/fail items on every enterprise security questionnaire. |
| What capabilities are missing before enterprise procurement approval? | EP4-01 (password reset), EP4-02/03 (SAML/OIDC), EP4-04 (distributed rate limiting), EP4-05 (plan enforcement), EP4-06 (env vars). |
| What capabilities are required before commercial launch? | All of Tier 1 + Tier 2 — 35 development days. |
| Which gaps are critical blockers? | R-01 (SSO), R-02 (CRON_SECRET), R-03 (password reset), R-07 (rate limiting), R-04/R-05 (data governance + audit coverage). |
| Which gaps can be deferred? | Tier 3 connectors, WCAG, i18n, column encryption, cursor pagination, DR documentation. |
| What is the scope of Epic 04? | EP4-01 through EP4-25. Tier 1 and Tier 2 are non-negotiable before GA. Tier 3 ships in parallel or immediately after. |

---

*Assessment based on codebase review of commit `d2aa437` · 2026-06-27 · No code was modified during this assessment.*
