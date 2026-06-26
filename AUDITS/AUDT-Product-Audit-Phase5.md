# AUDT Product Audit — Phase 5
## Enterprise Readiness Assessment

**Version:** 1.0  
**Date:** 2026-06-26  
**Overall Enterprise Readiness Score:** 58 / 100  
**Commercial Launch Readiness:** Pre-launch — 6 critical gaps  
**Fortune 500 Readiness:** Not ready — 14 gaps  
**Regulated Industry Readiness:** Not ready — 9 blockers

---

## Contents

1. [Enterprise Readiness Scorecard](#1-enterprise-readiness-scorecard)
2. [Security Assessment](#2-security-assessment)
3. [Identity Assessment](#3-identity-assessment)
4. [Platform Services Assessment](#4-platform-services-assessment)
5. [Integration Assessment](#5-integration-assessment)
6. [API Assessment](#6-api-assessment)
7. [Operational Readiness Assessment](#7-operational-readiness-assessment)
8. [Scalability Assessment](#8-scalability-assessment)
9. [Top Enterprise Risks](#9-top-enterprise-risks)
10. [Enterprise Roadmap](#10-enterprise-roadmap)

---

## 1. Enterprise Readiness Scorecard

### Dimension scores

| # | Dimension | Score | Rating |
|---|---|---|---|
| 1 | Identity & Access Management | 6.0 / 10 | Partial |
| 2 | Multi-Tenant Architecture | 8.0 / 10 | Strong |
| 3 | RBAC & Authorization | 5.5 / 10 | Partial |
| 4 | Security | 6.5 / 10 | Partial |
| 5 | Compliance Platform | 8.0 / 10 | Strong |
| 6 | Workflow Platform | 3.5 / 10 | Weak |
| 7 | Platform Services | 3.5 / 10 | Weak |
| 8 | API Platform | 5.5 / 10 | Partial |
| 9 | Integration Platform | 3.5 / 10 | Weak |
| 10 | Operations | 3.5 / 10 | Weak |
| 11 | Performance & Scalability | 5.0 / 10 | Partial |
| 12 | Administration | 7.0 / 10 | Strong |
| 13 | Customer Success Readiness | 5.5 / 10 | Partial |
| **Total** | **Weighted average** | **58 / 100** | **Pre-launch** |

### Commercial launch readiness by segment

| Customer segment | Ready? | Gaps |
|---|---|---|
| **SMB / Startup** | ⚠ Near-ready | Notifications, basic approvals |
| **Mid-market SaaS** | ❌ Not ready | SSO, notifications, comments, workflow engine |
| **Enterprise / Fortune 500** | ❌ Not ready | SSO+SCIM, CMK, APM, distributed rate limiting, DR, no global search |
| **Regulated: Banking** | ❌ Blocked | CMK, SAML, SCIM, formal pen-test, DR plan, IP restrictions on all services |
| **Regulated: Healthcare (HIPAA)** | ❌ Blocked | BAA required, CMK, SCIM, HIPAA-specific audit trail |
| **Regulated: Government** | ❌ Not applicable | No FedRAMP / GovCloud |

---

### Summary ratings

| Category | Rating | Notes |
|---|---|---|
| **Authentication core** | ✅ Strong | Supabase Auth + TOTP MFA + password policies + lockout |
| **Enterprise SSO** | ❌ Not ready | UI exists; SAML/OIDC handshake not implemented |
| **Data isolation** | ✅ Strong | RLS on all 259+ tables; org-scoped |
| **Encryption** | ⚠ Partial | At-rest: Supabase default. AES-256-GCM for configs. CMK: UI only |
| **API security** | ✅ Adequate | bcrypt Bearer auth, rate limiting (not distributed) |
| **Compliance frameworks** | ✅ Strong | ISO 27001, SOC 2, DPDP, HIPAA, PCI DSS seeded |
| **Workflow automation** | ❌ Weak | Workflow Studio™ is partial; no configurable approval engine |
| **Notifications** | ❌ Critical gap | No email delivery for governance events |
| **Integrations** | ❌ Weak | 35+ connectors in UI; none make real API calls |
| **Observability** | ❌ Not ready | No APM, no structured logging, no metrics pipeline |
| **Scalability** | ⚠ Partial | Vercel auto-scales; no job queue; offset pagination |
| **Disaster recovery** | ❌ Not ready | No documented DR plan; Supabase backups only |

---

## 2. Security Assessment

### 2.1 Encryption

| Control | Implementation | Status | Gap |
|---|---|---|---|
| **Encryption at rest** | Supabase Postgres: AES-256 (platform-managed) | ✅ | None — platform guaranteed |
| **Integration config encryption** | AES-256-GCM (`encryptConfig` / `decryptConfig`) via `ENCRYPTION_KEY` env var | ✅ | Key rotation mechanism missing |
| **TOTP secret encryption** | AES-256-GCM + JSON.stringify stored in TEXT column | ✅ | None |
| **API key storage** | bcrypt hash stored, plaintext shown once | ✅ | None |
| **Encryption in transit** | TLS enforced (`ssl:"require"` in DB config) + HTTPS on Vercel | ✅ | No mTLS for service-to-service |
| **Customer-managed encryption (CMK)** | UI, config tables, and provider registry built — AWS KMS / Azure Key Vault SDK not wired | ❌ | Functional CMK integration required before Banking/Healthcare launch |
| **Encryption key management** | `ENCRYPTION_KEY` stored as Vercel env var — no rotation, no vault | ⚠ | Should integrate with AWS Secrets Manager or Azure Key Vault |
| **Password hashing** | bcrypt 12 rounds for password history; Supabase handles auth passwords | ✅ | None |
| **Recovery code hashing** | bcrypt (same library) | ✅ | None |

**Score: 7 / 10**

---

### 2.2 Security headers and transport

| Header / Policy | Configured | Value |
|---|---|---|
| HSTS | ✅ | `max-age=31536000; includeSubDomains; preload` (1 year) |
| Content Security Policy | ✅ | Configured in `next.config.ts` |
| X-Frame-Options | ✅ | DENY |
| X-Content-Type-Options | ✅ | nosniff |
| Referrer-Policy | ✅ | Configured |
| Permissions-Policy | ✅ | Configured |
| X-Powered-By | ✅ | Removed (`poweredByHeader: false`) |
| CORS | ⚠ | Default Next.js — not explicitly locked for /api/v1/* |
| Subresource Integrity | ❌ | Not configured |

**Missing:** CORS policy is not explicitly locked to allowed origins on `/api/v1/*`. Public endpoints can be called from any origin.

---

### 2.3 Authentication security

| Control | Status | Implementation |
|---|---|---|
| Brute force protection | ✅ | `login_lockouts` table; configurable attempt count and duration |
| TOTP MFA | ✅ | otplib + AES-256-GCM secret storage |
| Recovery codes | ✅ | 10 bcrypt-hashed codes; regeneration invalidates old set |
| Session idle timeout | ✅ | Configurable per org (default 60 min) |
| Session absolute timeout | ✅ | Configurable per org (default 8h) |
| Concurrent session limit | ✅ | Configurable (default 5); oldest revoked on exceed |
| Session revocation | ✅ | `user_sessions` table; revoke individual or all |
| Device fingerprinting | ✅ | djb2 hash of UA + accept-language; 30-day trusted devices |
| IP allow lists | ✅ | CIDR-based, resource-scoped (all/login/api/compliance/vendors) |
| IP extraction | ✅ | Pure TS CIDR implementation; handles IPv4-mapped IPv6 |
| Proxy fail-open | ⚠ | Enterprise auth enforcement wrapped in try/catch — intentional but documented risk |

---

### 2.4 API security

| Control | Status | Implementation |
|---|---|---|
| API key authentication | ✅ | bcrypt Bearer validation in `validateApiKey()` |
| API key prefix | ✅ | `sk_` prefix for display, hash stored |
| Rate limiting — in-memory | ✅ | Sliding window: 100/300/1000 req per 60s by permission tier |
| Rate limiting — distributed | ❌ | In-memory only — resets on Vercel cold start; breaks under load balancing |
| Input validation | ⚠ | Service-layer validation present; no shared schema validation layer (Zod/Valibot) |
| SQL injection | ✅ | Drizzle ORM parameterised queries throughout |
| XSS protection | ✅ | React auto-escaping + CSP |
| SSRF protection | ⚠ | No SSRF protection on webhook URLs or integration endpoints |
| Secrets in logs | ⚠ | No formal secret scrubbing in server logs |
| `tokens.txt` incident | ✅ | GitHub PAT committed and push-blocked — PAT rotated, file gitignored |

---

### 2.5 Audit logging

| Capability | Status |
|---|---|
| Audit log table | ✅ `audit_logs` — every meaningful action recorded |
| Actor profile join | ✅ Actor name and email surfaced in UI |
| IP address capture | ✅ `ip_address` column added in migration 0007 |
| Filterable UI (user/module/date/search) | ✅ Pagination + CSV export |
| Immutable audit log | ⚠ Rows can be deleted by an admin with DB access — no append-only enforcement |
| SIEM export / streaming | ❌ No Splunk / Datadog / SIEM integration |
| Log retention policy | ❌ No automated purge or retention policy defined |
| Tamper detection | ❌ No hash chain or cryptographic integrity on audit records |

**Security Score: 6.5 / 10**

---

## 3. Identity Assessment

### 3.1 Authentication capabilities

| Capability | Status | Implementation |
|---|---|---|
| Email / password | ✅ | Supabase Auth |
| Passwordless (magic link) | ✅ | Supabase Auth — used for vendor portal |
| TOTP MFA | ✅ | Sprint B2.1 — fully implemented |
| SMS MFA | ❌ | Not implemented; Supabase supports it but not wired |
| Hardware keys (WebAuthn/FIDO2) | ❌ | Not implemented |
| Google OAuth | ❌ | Out of scope B2.1 |
| Microsoft OAuth | ❌ | Out of scope B2.1 |
| SAML 2.0 | ❌ | UI built; no IDP handshake implemented |
| OpenID Connect | ❌ | UI built; no OIDC flow implemented |
| SCIM 2.0 provisioning | ❌ | Not implemented; listed as roadmap |
| Just-in-Time (JIT) provisioning | ❌ | Not implemented |
| Directory sync | ❌ | Not implemented |

**Assessment:** Authentication core (local + TOTP + sessions) is enterprise-grade. The SSO gap is a hard blocker for any organisation with an identity provider mandate — which is virtually every organisation with 50+ employees.

---

### 3.2 Session and device management

| Capability | Status | Detail |
|---|---|---|
| Session records | ✅ | `user_sessions` table; IP, user agent, device, country |
| Session revocation (individual) | ✅ | Admin can revoke any session |
| Session revocation (all) | ✅ | Admin can revoke all sessions for a user |
| Idle timeout (configurable) | ✅ | Default 60 min, configurable per org |
| Absolute timeout (configurable) | ✅ | Default 8h, configurable per org |
| Concurrent session limit | ✅ | Default 5, configurable; oldest revoked |
| Device fingerprint | ✅ | djb2 hash of UA + accept-language |
| Trusted device registry | ✅ | 30-day trusted device cookie; per-user registry |
| Device revocation | ✅ | Admin can revoke trusted devices |
| Session activity tracking | ✅ | `lastActive` updated on each validated request |

---

### 3.3 Identity and access gaps

| Gap | Severity | Affected customers |
|---|---|---|
| No SAML 2.0 | Critical | All enterprise customers with Okta, Entra ID, or Ping Identity |
| No OIDC | Critical | Google Workspace, Auth0, Cognito customers |
| No SCIM | Critical | Automated provisioning/deprovisioning required for IT governance |
| No JIT provisioning | High | Enterprise customers cannot auto-create accounts on first SSO login |
| No directory sync | High | User attributes (name, department, title) must be manually maintained |
| No Google / Microsoft OAuth | High | Mid-market customers expect social login |
| No WebAuthn/FIDO2 | Medium | Phishing-resistant MFA required by some regulated industries |
| No SMS MFA | Medium | Backup MFA channel for users without authenticator apps |
| No delegated administration | High | Enterprise customers need sub-admins scoped to a department or region |
| No temporary access grants | Medium | No time-limited role elevation |

**Identity Score: 6.0 / 10**

---

## 4. Platform Services Assessment

### 4.1 Comments and collaboration

| Capability | Status | Detail |
|---|---|---|
| Comments on any governance entity | ❌ | No `comments` table or service. Absent from all modules except Auditor Collaboration™ (`external_comments`) |
| Threaded comments | ❌ | Not implemented |
| @mentions | ❌ | Not implemented |
| Comment notifications | ❌ | Not implemented |
| Comment audit trail | ❌ | Not implemented |
| Attachments on non-document entities | ❌ | Only `vendor_documents` and compliance storage have file upload. Cannot attach to risks, controls, findings, CAPAs, issues. |

**Assessment:** The absence of comments is the single most impactful productivity gap. Enterprise GRC teams discuss findings, debate risk treatments, and annotate evidence. Without comments, all discussion happens outside the platform (Slack, email) and is not captured in the governance record.

---

### 4.2 Notifications

| Capability | Status | Detail |
|---|---|---|
| In-app notification bell | ⚠ Partial | Bell icon + unread badge — reads from `governance_alerts` only |
| Email — team invite | ✅ | Resend; wired and working |
| Email — document expiry alert | ⚠ | Resend; requires RESEND_API_KEY configured in Vercel |
| Email — weekly AI digest | ⚠ | Resend; requires RESEND_API_KEY |
| Email — governance events | ❌ | No email for: due date, status change, assignment, alert, finding, CAPA, DSR |
| Slack notifications | ❌ | Not wired as notification channel (Slack connector in Integration Hub™ is simulated) |
| Microsoft Teams | ❌ | Not in marketplace |
| Webhook notifications | ❌ | Trust API Platform™ webhooks fire for trust events; no governance event webhooks |
| Per-event notification preferences | ⚠ | `notification_preferences` table exists but scope is limited |
| Notification digest | ❌ | No daily digest for pending actions |
| Push notifications | ❌ | Not implemented |

**Assessment:** Email notifications for governance events are entirely absent. This means users must actively log in to discover due dates, escalations, and critical alerts. No enterprise GRC tool is operable without notifications.

---

### 4.3 Search

| Capability | Status | Detail |
|---|---|---|
| Per-module keyword search | ✅ | Implemented across all modules (URL query param → DB ILIKE) |
| NL search (vendor module) | ✅ | Gemini-powered NL → structured filter |
| Cross-module search | ❌ | No global search; no unified search index |
| Full-text search (Postgres FTS) | ❌ | ILIKE pattern matching only — no `tsvector` indexes |
| Search by tag or label | ❌ | No tag or label system |
| Entity linking search | ❌ | Cannot search "find all risks linked to vendor X" across modules |
| Saved searches / filters | ❌ | No saved search or filter preset |

---

### 4.4 Version history

| Entity | Version history | Implementation |
|---|---|---|
| Policy | ✅ | `policy_versions` table — immutable snapshots |
| Risk record | ❌ | Audit log captures changes but no before/after snapshot |
| Control | ❌ | No version history |
| Vendor profile | ❌ | No version history |
| Contract | ❌ | No version history |
| Evidence | ❌ | No version history |
| Framework / controls | ❌ | No version history |

---

### 4.5 Audit logs

| Capability | Status |
|---|---|
| Comprehensive event capture | ✅ |
| Filterable UI | ✅ |
| CSV export | ✅ |
| Actor + IP recorded | ✅ |
| Severity badges | ✅ |
| Pagination | ✅ |
| SIEM integration | ❌ |
| Retention policy | ❌ |
| Append-only enforcement | ❌ |
| Cryptographic integrity | ❌ |

---

### 4.6 Import / Export

| Capability | Status | Modules |
|---|---|---|
| Vendor import (CSV) | ✅ | Vendor Hub™ |
| Risk import (CSV) | ✅ | Risk Lens™ |
| Evidence CSV export | ✅ | Evidence Vault™ |
| Control library CSV | ✅ | Control Center™ |
| Findings / CAPAs CSV | ✅ | Audit Management™ |
| Risks / Treatments CSV | ✅ | Risk Lens™ |
| Issues CSV | ✅ | Issue Hub™ |
| Contracts CSV | ✅ | Contract Governance™ |
| Assets CSV | ✅ | Asset Intelligence™ |
| Audit log CSV | ✅ | Settings |
| Tenant data ZIP export | ✅ | Data Governance |
| Policy import | ❌ | Manual only |
| Control import | ❌ | Manual only |
| Bulk evidence upload | ❌ | One at a time |
| Excel / XLSX export | ❌ | CSV only (no formatted Excel) |
| STIX/TAXII (threat intel) | ❌ | Not supported |

---

### 4.7 Labels, tags, and templates

| Capability | Status |
|---|---|
| Global labels / tags on entities | ❌ — no tag system |
| Vendor type templates | ✅ — 7 defaults + custom |
| Assessment question templates | ✅ — 17 standard questions |
| Workflow templates | ❌ — Workflow Studio™ has no pre-built templates |
| Report templates | ✅ — 8 board report types |
| Email templates | ⚠ — 2 templates (expiry, digest); no custom templates |

**Platform Services Score: 3.5 / 10**

---

## 5. Integration Assessment

### 5.1 Integration Hub™ — critical caveat

> **All 35+ connectors in Integration Hub™ are simulated.** The sync engine runs a simulation that generates placeholder records — it does not make real API calls to external systems. This is a critical commercial gap. The Integration Hub™ UI, sync history, and evidence collection are functional from a product perspective, but the underlying data is fabricated.

Before commercial launch, at minimum 3–5 connectors must make real API calls.

---

### 5.2 Connector inventory

| Category | Connectors in marketplace | Real API? | Priority |
|---|---|---|---|
| **Identity providers** | Entra ID, Okta, Google Workspace | ❌ Simulated | Critical |
| **Cloud platforms** | AWS, Azure, GCP | ❌ Simulated | Critical |
| **Source control** | GitHub | ❌ Simulated | High |
| **Project management** | Jira | ❌ Simulated | High |
| **Security / EDR** | CrowdStrike, Microsoft Defender | ❌ Simulated | High |
| **Communication** | Slack | ❌ Simulated | Medium |
| **ITSM** | ServiceNow | ❌ Simulated | High |
| **HR systems** | None | ❌ Not in marketplace | High |
| **Email** | Resend (direct, not via Integration Hub™) | ✅ Real | Complete |
| **Microsoft Teams** | Not in marketplace | ❌ | Medium |
| **Azure DevOps** | Not in marketplace | ❌ | Low |
| **SIEM / SOAR** | None | ❌ | High |
| **GRC** | None | ❌ | Low |
| **Vulnerability scanners** | None | ❌ | Medium |

---

### 5.3 Integration architecture assessment

| Dimension | Status | Detail |
|---|---|---|
| Connector credential storage | ✅ | AES-256-GCM via `encryptConfig()` |
| Connector health tracking | ✅ | Per-connector health metrics in UI |
| Sync history | ✅ | `integration_syncs` table with duration, records, status |
| Webhook inbound | ✅ | Webhook Engine™ routes to integration events |
| Webhook outbound | ✅ | Trust API Platform™ webhooks for trust events |
| OAuth 2.0 flow for connectors | ❌ | No OAuth callback handler; connectors use API key config |
| Sync scheduling | ⚠ | Sync can be triggered manually; no cron-based auto-sync |
| Error handling and retry | ❌ | No retry logic for failed sync runs |
| Sync conflict resolution | ❌ | No documented conflict resolution strategy |
| Evidence auto-collection (real) | ❌ | Evidence generated from simulated sync data only |
| Rate limiting on outbound calls | ❌ | No per-connector rate limiting |

---

### 5.4 Integration priority roadmap

| Priority | Integration | Business justification |
|---|---|---|
| **P1** | Okta (real OAuth + SCIM) | Identity provider for 60%+ of enterprise customers |
| **P1** | Microsoft Entra ID (real OAuth + SCIM) | Required for Microsoft-first enterprise accounts |
| **P1** | Slack (real notifications) | Governance alert delivery; blocks notification gap fix |
| **P2** | AWS (real compliance check: root MFA, S3 public, CloudTrail) | Evidence automation MVP; cloud-native customers |
| **P2** | GitHub (real check: secret scan, branch protection, MFA) | Developer-first companies; Continuous Compliance™ |
| **P2** | Jira (real ticket creation from Issues and CAPAs) | Closes CAPA → ticketing workflow break |
| **P3** | Microsoft Teams (notifications) | Microsoft-first enterprise accounts |
| **P3** | Google Workspace (real MFA / Drive check) | Google-first companies |
| **P3** | SIEM (Splunk / Datadog log export) | Security operations integration |
| **P4** | HR systems (BambooHR, Workday) | SCIM pre-requisite alternative; offboarding automation |

**Integration Score: 3.5 / 10**

---

## 6. API Assessment

### 6.1 REST API coverage

| Module | GET (list) | GET (single) | POST | PUT | DELETE | Coverage |
|---|---|---|---|---|---|---|
| Vendors | ✅ | ✅ | ❌ | ❌ | ❌ | 40% |
| Compliance frameworks | ✅ | ❌ | ❌ | ❌ | ❌ | 20% |
| Compliance gaps | ✅ | ❌ | ❌ | ❌ | ❌ | 20% |
| Audit logs | ✅ | ❌ | ❌ | ❌ | ❌ | 20% |
| Audits | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| Findings | ✅ | ❌ | ✅ | ❌ | ❌ | 40% |
| CAPAs | ✅ | ❌ | ✅ | ❌ | ❌ | 40% |
| Risks | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| Risk treatments | ✅ | ❌ | ✅ | ❌ | ❌ | 40% |
| Trust Intelligence | ✅ | ✅ | ✅ | ❌ | ❌ | 60% |
| Governance alerts | ✅ | ❌ | ❌ | ❌ | ❌ | 20% |
| Contracts | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| Issues | ✅ | ✅ | ✅ | ✅ | ✅ | 100% |
| Trust Exchange | ✅ | ❌ | ✅ | ❌ | ❌ | 40% |
| Benchmarking | ✅ | ❌ | ✅ | ❌ | ❌ | 40% |
| Integrations | ✅ | ❌ | ❌ | ❌ | ❌ | 20% |
| AI systems | ✅ | ❌ | ✅ | ❌ | ❌ | 40% |
| Audit rooms | ✅ | ❌ | ✅ | ❌ | ❌ | 40% |
| Verifications | ✅ | ✅ | ✅ | ❌ | ❌ | 60% |
| Assets | ✅ | ❌ | ✅ | ❌ | ❌ | 40% |
| Regulations | ✅ | ❌ | ❌ | ❌ | ❌ | 20% |
| Obligations | ✅ | ❌ | ✅ | ❌ | ❌ | 40% |
| Agent runs | ✅ | ❌ | ❌ | ❌ | ❌ | 20% |

**Average REST coverage: 47% across modules.**

Vendors, Compliance frameworks, Controls, Evidence, Policies, Agent observations/recommendations, DPDP entities, Regulatory alerts, Trust certificates — all have incomplete or no write API coverage.

---

### 6.2 API quality dimensions

| Dimension | Status | Detail |
|---|---|---|
| Versioning | ✅ | `/api/v1/` prefix established |
| Consistent envelope | ✅ | `ok()` / `err()` helpers used throughout |
| Pagination | ✅ | `page` + `pageSize` query params on list endpoints |
| Filtering | ✅ | `status`, `category`, `severity`, `search` filters on most lists |
| Sorting | ⚠ | Limited — most lists use DB default ordering |
| Cursor-based pagination | ❌ | Offset-based only — breaks on large datasets and concurrent writes |
| Rate limit headers | ✅ | `X-RateLimit-*` headers returned via `withRateLimitHeaders()` |
| Error response consistency | ✅ | `{ error: string }` envelope |
| HTTP status codes | ✅ | 200/400/401/403/404/429/500 used appropriately |
| OpenAPI / Swagger spec | ❌ | No specification file |
| SDK (TypeScript) | ❌ | No client SDK |
| SDK (Python) | ❌ | No client SDK |
| API changelog / versioning docs | ❌ | No changelog |
| Idempotency keys | ❌ | No idempotency support on POST endpoints |
| Bulk operations | ❌ | No batch create/update/delete |
| GraphQL | ❌ | REST only |
| Webhook event types | ✅ | 9 trust event types |
| Webhook delivery log | ✅ | `tap_webhook_deliveries` table |
| Webhook retry | ❌ | No retry on delivery failure |

---

### 6.3 API security

| Control | Status |
|---|---|
| Bearer token validation | ✅ bcrypt |
| Permission scope on keys (`read` vs `read_write`) | ✅ |
| Rate limiting | ✅ in-memory (not distributed) |
| CORS lock | ⚠ not explicitly scoped |
| Input sanitisation | ⚠ partial |
| SSRF prevention on webhooks | ❌ |
| mTLS | ❌ |

**API Score: 5.5 / 10**

---

## 7. Operational Readiness Assessment

### 7.1 Monitoring and observability

| Capability | Status | Detail |
|---|---|---|
| Application Performance Monitoring (APM) | ❌ | No Datadog, New Relic, Sentry, or Vercel Analytics configured |
| Structured logging | ❌ | `console.log` / `console.error` only — no JSON structured logs, no log pipeline |
| Log aggregation | ❌ | No Datadog Logs, CloudWatch, or Logtail |
| Error tracking | ❌ | No Sentry or equivalent |
| Distributed tracing | ❌ | No trace IDs |
| Metrics collection | ❌ | No Prometheus, Grafana, or equivalent |
| Uptime monitoring | ❌ | No Pingdom, UptimeRobot, or equivalent |
| Synthetic monitoring | ❌ | Not configured |
| Real user monitoring (RUM) | ❌ | Not configured |
| Health check endpoint | ✅ | `/api/health` — DB latency, AI, email, storage, encryption checks |
| SLA / uptime SLA defined | ❌ | No SLA commitment documented |
| On-call rotation | ❌ | Not documented |
| Incident response playbook | ❌ | Not documented |

**Assessment:** AUDT has zero observability infrastructure. A production outage would be diagnosed entirely from Vercel function logs in the dashboard. This is acceptable for a pre-launch product but is a hard blocker before signing enterprise contracts with SLA commitments.

---

### 7.2 Background jobs and reliability

| Capability | Status | Detail |
|---|---|---|
| Cron jobs | ✅ | 4 cron routes: expiry, digest, billing, governance-snapshot |
| Cron secret protection | ⚠ | `CRON_SECRET` not set in Vercel — cron endpoints currently unprotected |
| Job retry on failure | ❌ | No retry mechanism — cron fails silently |
| Job idempotency | ⚠ | Seed scripts use idempotent patterns; cron routes partially idempotent |
| Dead letter queue | ❌ | No DLQ |
| Async job queue | ❌ | No BullMQ, pg-boss, or equivalent |
| Long-running task handling | ❌ | Vercel serverless timeout (30s default) — AI PDF generation could time out |
| Job monitoring | ❌ | No job dashboard; cron failures are invisible unless Vercel logs checked |
| Background email delivery | ⚠ | Resend is sync within cron route — delivery failure not retried |
| Scheduled governance snapshot | ✅ | Daily cron fires governance-snapshot |
| Scheduled billing cycle | ✅ | Daily billing cron handles trial expiry |

---

### 7.3 Backup and disaster recovery

| Capability | Status | Detail |
|---|---|---|
| Database backups | ✅ | Supabase automated daily backups (platform-managed) |
| Backup retention | ⚠ | Supabase free tier: 7 days. Pro: 30 days. Enterprise: configurable |
| Point-in-time recovery (PITR) | ⚠ | Available on Supabase Pro+ |
| Storage backups | ❌ | Supabase Storage files not separately backed up to another region |
| Cross-region replication | ❌ | Single region (Mumbai ap-south-1) only |
| Disaster recovery plan | ❌ | No DR plan documented |
| Recovery time objective (RTO) | ❌ | Not defined |
| Recovery point objective (RPO) | ❌ | Not defined |
| Multi-region failover | ❌ | Not configured |
| Runbook for DB restore | ❌ | Not documented |
| Data export (tenant ZIP) | ✅ | `/api/export/tenant-data` — vendors, docs, assessments, team, audit |

---

### 7.4 High availability

| Capability | Status | Detail |
|---|---|---|
| Application HA | ✅ | Vercel serverless — globally distributed, auto-scaling |
| Database HA | ✅ | Supabase managed Postgres — platform-guaranteed HA |
| Storage HA | ✅ | Supabase Storage — S3-compatible, platform-guaranteed |
| AI service HA | ⚠ | Gemini API — single provider, no fallback model |
| Email HA | ⚠ | Resend — single provider, no fallback |
| CDN | ✅ | Vercel Edge Network |
| Cold start performance | ⚠ | Vercel serverless has cold starts; Drizzle lazy-init mitigates first-DB-query penalty |
| Connection pooling | ✅ | Supabase Supavisor (pooler) — max 10 connections per pool |

**Operations Score: 3.5 / 10**

---

## 8. Scalability Assessment

### 8.1 Database and query performance

| Dimension | Status | Detail |
|---|---|---|
| Connection pooling | ✅ | Supabase Supavisor; max 10 per instance |
| SSL enforcement | ✅ | `ssl:"require"` — TLS enforced without cert chain verification |
| Lazy DB initialization | ✅ | Drizzle Proxy pattern in `lib/db/index.ts` — prevents cold-start crash |
| Query optimisation | ⚠ | No documented query analysis; ILIKE searches not indexed; large JOINs not profiled |
| Full-text search indexes | ❌ | `tsvector` / `gin` indexes not created; search uses unindexed ILIKE |
| Pagination strategy | ⚠ | Offset-based — degrades at large page numbers; inconsistent on concurrent writes |
| Cursor-based pagination | ❌ | Not implemented |
| N+1 query prevention | ⚠ | Some repositories use parallel Drizzle queries; others may trigger N+1 on joins |
| Index coverage | ⚠ | Indexes exist on primary keys and FKs from migrations; query-specific indexes not systematically reviewed |
| Large table estimates | ⚠ | 259+ tables; `audit_logs` and `ai_compliance_insights` will be the highest-growth tables |
| Query timeout handling | ❌ | No explicit query timeout configuration |

---

### 8.2 Application layer scalability

| Dimension | Status | Detail |
|---|---|---|
| Horizontal scaling | ✅ | Vercel serverless — auto-scales to demand |
| Stateless architecture | ✅ | No in-process state; all state in DB / cookies |
| In-memory rate limiter | ❌ | Not shared across Vercel instances — resets on cold start; permits burst attacks |
| Redis / Upstash (distributed cache) | ❌ | Not implemented; required for distributed rate limiting and session invalidation |
| AI response caching | ✅ | 24h cache in `ai_compliance_insights` — reduces Gemini API calls |
| Gemini rate limiting | ⚠ | No per-org Gemini request throttling; one org making excessive AI calls could degrade others |
| PDF generation timeout | ⚠ | `@react-pdf/renderer` runs server-side; large reports could hit Vercel 30s limit |
| Async processing | ❌ | No job queue; all operations are synchronous within HTTP request |
| Large file upload | ⚠ | Supabase Storage handles file chunking; no client-side progress or retry |
| Storage growth | ✅ | Supabase Storage auto-scales |

---

### 8.3 Scalability targets vs current state

| Metric | Current capacity | Enterprise target | Gap |
|---|---|---|---|
| Concurrent users | ~500 (estimated) | 5,000+ | Needs load test |
| Vendors per org | Unlimited (no hard cap) | 10,000+ | No functional limit; query perf untested |
| Documents per org | Unlimited | 100,000+ | Storage scales; query perf untested |
| Audit log rows | Unlimited | 10M+ | ILIKE search will degrade; FTS required |
| API requests per minute | 100–1,000 (in-memory limit) | 100,000+ | Distributed rate limiter required |
| AI requests per day | Gemini API quota | High volume | Queue required to prevent quota exhaustion |
| Background jobs | 4 cron routes | 20+ | Job queue architecture required |
| Export file size | Synchronous (timeout risk) | GB-scale | Async export with download link required |

**Scalability Score: 5.0 / 10**

---

### 8.4 Scaling roadmap requirements

| Priority | Requirement | Effort |
|---|---|---|
| **Critical** | Distributed rate limiting (Upstash Redis) | Low — single dependency |
| **Critical** | Async job queue (pg-boss or Upstash QStash) | Medium |
| **High** | Full-text search indexes (`tsvector` on name, description) | Low — add indexes |
| **High** | Cursor-based pagination on high-volume endpoints | Medium |
| **High** | Load test under enterprise data volumes | Low-medium |
| **Medium** | Per-org Gemini quota tracking and throttling | Medium |
| **Medium** | Async PDF/CSV export with polling download | Medium |
| **Medium** | Connection pool tuning per environment | Low |
| **Low** | Read replica for analytics/reporting queries | High |
| **Low** | Multi-region deployment | High |

---

## 9. Top Enterprise Risks

### Risk inventory (ranked by commercial impact)

| # | Risk | Severity | Likelihood | Impact if unaddressed |
|---|---|---|---|---|
| **R1** | **No enterprise SSO** — SAML and OIDC UI built but not functional | Critical | Certain | Every enterprise and regulated-industry prospect will require SSO. Without it, AUDT is effectively limited to SMB. |
| **R2** | **No governance notifications** — email delivery for governance events not wired | Critical | Certain | Users must poll the platform for all updates. Adoption will fail — GRC workflows depend on push notification. |
| **R3** | **Integration Hub connectors are simulated** — no real API calls | Critical | High | If a prospect connects Okta or AWS and discovers the sync data is fabricated, trust is destroyed. Must be clearly communicated or fixed before demos to technical audiences. |
| **R4** | **No CRON_SECRET configured** — cron endpoints are publicly callable | Critical | High | Any actor can trigger billing cycle, governance snapshots, or email digests by calling the endpoint URL. |
| **R5** | **In-memory rate limiter** — resets on cold start and is not shared across instances | Critical | High | A single malicious org can exhaust API quota on Vercel restart; burst attacks possible. Blocks enterprise API contracts. |
| **R6** | **No zero observability** — no APM, no error tracking, no structured logs | High | Certain | Production incidents have no diagnostic path beyond Vercel function log scanning. Enterprise SLA commitments are undeliverable. |
| **R7** | **No SCIM provisioning** — user lifecycle cannot be automated | High | Certain | IT security teams require automated deprovisioning. Without SCIM, terminated employees retain access until manually deactivated. |
| **R8** | **CMK not functional** — AWS KMS / Azure Key Vault UI exists but SDK not wired | High | High | Banking and Healthcare customers will contractually require CMK. Non-functional CMK in a demo is a liability. |
| **R9** | **No comments on governance entities** — all collaboration is off-platform | High | Certain | Teams will use Slack/email for risk discussions. Context is lost. This undermines the "single source of truth" positioning. |
| **R10** | **No configurable approval engine** — approvals hard-coded in 3 modules | High | High | Enterprise governance requires configurable approval chains. Risk acceptance, vendor approval, and evidence sign-off all lack formal approval gates. |
| **R11** | **Vendor Approval process missing** — vendors are immediately usable with no approval gate | High | Certain | Procurement compliance teams will identify this immediately. Financial services requires formal vendor approval. |
| **R12** | **Vendor Offboarding missing** — no process to exit a vendor relationship | High | Certain | DPDP and GDPR require formal vendor exit with data destruction confirmation. |
| **R13** | **No disaster recovery plan** — single region, no documented RTO/RPO | High | Medium | Enterprise procurement will require DR documentation. An outage with no DR plan is a material risk. |
| **R14** | **DPDP Privacy™ is a stub** — no AI, no reports, no DSR deadline enforcement | High | Certain | AUDT targets India (DPDP) as primary market. The privacy module is the weakest in the platform for the target jurisdiction. |
| **R15** | **No WebAuthn / FIDO2** — phishing-resistant MFA absent | Medium | Medium | Regulated industries (Banking, SEBI) may mandate phishing-resistant MFA. TOTP is vulnerable to real-time phishing. |
| **R16** | **No immutable audit log** — rows can be deleted by DB admin | Medium | Low | For forensic purposes and compliance audits, audit log integrity is required. |
| **R17** | **Proxy.ts fail-open** — enterprise auth enforcement allows through on error | Medium | Low | If the DB is unreachable, IP restrictions and session timeouts are bypassed. Intentional but must be documented in security posture. |
| **R18** | **SSRF risk on webhook URLs** — no URL validation on inbound / outbound webhook targets | Medium | Medium | A malicious user could configure a webhook pointing to internal metadata services or internal network endpoints. |
| **R19** | **No OpenAPI specification** — API undocumented | Medium | High | Enterprise API consumers require machine-readable specs for SDK generation, integration testing, and security scanning. |
| **R20** | **No formal vulnerability disclosure process** — no CVE tracking, no pen-test | Medium | Medium | Enterprise procurement requires evidence of a security programme. A responsible disclosure policy and annual pen-test are standard requirements. |

---

## 10. Enterprise Roadmap

### Categorisation

The enterprise readiness gaps are grouped into four waves. Waves 1 and 2 must be complete before a commercial launch targeting mid-market or enterprise customers. Waves 3 and 4 are required for Fortune 500 and regulated-industry customers.

---

### Wave 1 — Commercial Launch Prerequisites (0–3 months)

These are non-negotiable before a single paying enterprise customer is onboarded.

| # | Item | Dimension | Effort |
|---|---|---|---|
| **1** | Configure `CRON_SECRET` in Vercel and enforce on all cron routes | Security | 1 hour |
| **2** | Email notifications — wire Resend for governance events (due dates, assignments, alerts, status changes) | Platform Services | 1 week |
| **3** | Configurable approval engine — approval workflow service for vendor approval, risk acceptance, evidence sign-off | Workflow | 2 weeks |
| **4** | Comments on governance entities — polymorphic `comments` table + service + per-module UI | Platform Services | 2 weeks |
| **5** | CORS lock on `/api/v1/*` — restrict to configured allowed origins | Security | 1 day |
| **6** | SSRF prevention on webhook URLs — validate against allowed URL patterns | Security | 2 days |
| **7** | Distributed rate limiting — replace in-memory with Upstash Redis | Scalability | 3 days |
| **8** | Sentry error tracking — add `@sentry/nextjs` with Vercel integration | Operations | 1 day |
| **9** | Vendor Approval workflow — formal approval gate with status field, approval chain, AI recommendation | Features | 2 weeks |
| **10** | DSR statutory deadline tracking — 30-day DPDP countdown + escalation | Compliance | 1 week |

---

### Wave 2 — Enterprise Customer Onboarding (3–6 months)

Required to onboard the first 10–20 enterprise accounts without objections.

| # | Item | Dimension | Effort |
|---|---|---|---|
| **11** | **SAML 2.0 / OIDC** — functional SSO integration with Okta and Microsoft Entra ID | Identity | 4 weeks |
| **12** | **SCIM 2.0** — automated user provisioning and deprovisioning | Identity | 3 weeks |
| **13** | **Slack integration (real)** — governance alert delivery to Slack channels | Integration | 1 week |
| **14** | **OpenAPI specification** — generate `openapi.json` from existing routes; publish at `/api/docs` | API | 1 week |
| **15** | **Async job queue** — pg-boss or Upstash QStash for background processing | Scalability | 2 weeks |
| **16** | **Structured logging** — JSON log format with request IDs; pipe to Datadog or Logtail | Operations | 1 week |
| **17** | **Full-text search indexes** — `tsvector` + `gin` index on: vendor name, risk title, control name, finding description | Scalability | 3 days |
| **18** | **Cursor-based pagination** — replace offset pagination on high-volume list endpoints | Scalability | 1 week |
| **19** | **Vendor Offboarding process** — guided checklist, access revocation, obligation closure, archive | Features | 3 weeks |
| **20** | **DR documentation** — define RTO/RPO; document DB restore runbook; configure Supabase Pro PITR | Operations | 1 week |
| **21** | **Integration Hub — 3 real connectors** (Okta OAuth, AWS compliance check, GitHub branch protection) | Integration | 4 weeks |
| **22** | **Exception Management** — dedicated entity with policy FK, compensating control, expiry, approver | Features | 2 weeks |
| **23** | **WebAuthn / FIDO2** — phishing-resistant MFA for regulated industry customers | Identity | 2 weeks |
| **24** | **Immutable audit log** — hash-chained log entries or append-only enforcement | Security | 1 week |
| **25** | **Responsible disclosure policy + pen-test** — bug bounty or coordinated disclosure; annual pen-test engagement | Security | Ongoing |

---

### Wave 3 — Fortune 500 Readiness (6–12 months)

Required to close deals with Fortune 500, Global 2000, and regulated-industry customers.

| # | Item | Dimension | Effort |
|---|---|---|---|
| **26** | **Customer-Managed Encryption (CMK)** — functional AWS KMS and Azure Key Vault integration | Security | 4 weeks |
| **27** | **SIEM integration** — Splunk / Datadog log export from audit_logs | Operations | 2 weeks |
| **28** | **Global search** — unified search across all modules with relevance ranking | Platform Services | 3 weeks |
| **29** | **Version history** — risk register, control, vendor profile — before/after snapshots | Platform Services | 2 weeks |
| **30** | **Attachments on all entities** — generic attachment service for risks, controls, findings | Platform Services | 1 week |
| **31** | **Delegation framework** — task, approval, and ownership delegation across all modules | Platform Services | 2 weeks |
| **32** | **Multi-region deployment** — Supabase region selector; EU (Frankfurt) for GDPR customers | Operations | 4 weeks |
| **33** | **Board member portal** — read-only, no-login access to executive reports and Trust Intelligence | Features | 3 weeks |
| **34** | **DPDP Privacy™ — production-grade rebuild** — AI, reports, DSR tracking, deadline enforcement | Compliance | 4 weeks |
| **35** | **Workflow Studio™ — production rebuild** — 10+ triggers, 8+ actions, error handling, templates | Workflow | 6 weeks |
| **36** | **TypeScript SDK** — auto-generated from OpenAPI spec | API | 2 weeks |
| **37** | **Load testing** — k6 or Locust test suite; enterprise data volumes (10k vendors, 100k documents) | Scalability | 2 weeks |
| **38** | **Per-org Gemini quota throttling** — prevent one org from exhausting API quota | Scalability | 1 week |
| **39** | **Jira integration (real)** — bi-directional sync: CAPA / Issue → Jira ticket | Integration | 2 weeks |
| **40** | **ServiceNow integration (real)** — ITSM integration for enterprise customers | Integration | 3 weeks |

---

### Wave 4 — Regulated Industry Certification (12–24 months)

Required to serve Banking, Healthcare, Government, and critical infrastructure sectors.

| # | Item | Dimension | Effort |
|---|---|---|---|
| **41** | **SOC 2 Type II** — audit AUDT itself against SOC 2 | Compliance | 6 months |
| **42** | **ISO 27001 certification** — certify AUDT as an ISO 27001-compliant service | Compliance | 6 months |
| **43** | **HIPAA BAA programme** — Business Associate Agreement template and controls | Compliance | 3 months |
| **44** | **DPDP Data Fiduciary registration** — formal registration as data fiduciary | Compliance | 2 months |
| **45** | **FedRAMP (US Government)** — if US government market targeted | Compliance | 18 months |
| **46** | **RBI CSCRF alignment** — formal mapping and gap assessment | Compliance | 3 months |
| **47** | **Annual penetration test** — third-party, scope: web app + API + infrastructure | Security | Annual |
| **48** | **Vulnerability management programme** — CVE tracking, SLA for critical patches (24h/7d/30d) | Security | Ongoing |
| **49** | **Data Processing Agreements (DPA)** — standardised DPA for EU/India customers | Legal | 2 months |
| **50** | **Uptime SLA + status page** — 99.9% SLA commitment + public status page | Operations | 1 month |

---

## Top 20 Enterprise Gaps (consolidated)

| # | Gap | Dimension | Severity |
|---|---|---|---|
| 1 | No enterprise SSO (SAML/OIDC) | Identity | Critical |
| 2 | No governance event email notifications | Platform Services | Critical |
| 3 | Integration connectors are simulated | Integration | Critical |
| 4 | CRON_SECRET not set — cron endpoints unprotected | Security | Critical |
| 5 | In-memory rate limiter — not distributed | Scalability | Critical |
| 6 | No SCIM provisioning | Identity | Critical |
| 7 | Zero observability (no APM, no error tracking, no logs) | Operations | High |
| 8 | CMK not functional | Security | High |
| 9 | No comments on governance entities | Platform Services | High |
| 10 | No configurable approval engine | Workflow | High |
| 11 | Vendor Approval process missing | Features | High |
| 12 | Vendor Offboarding process missing | Features | High |
| 13 | No disaster recovery plan | Operations | High |
| 14 | DPDP Privacy™ is a stub | Compliance | High |
| 15 | No OpenAPI specification | API | High |
| 16 | SSRF risk on webhook endpoints | Security | Medium |
| 17 | No full-text search indexes | Scalability | Medium |
| 18 | No immutable audit log | Security | Medium |
| 19 | No async job queue — all operations synchronous | Scalability | Medium |
| 20 | No responsible disclosure / pen-test programme | Security | Medium |

---

## Top 20 Recommendations (consolidated)

| # | Recommendation | Wave | Effort |
|---|---|---|---|
| 1 | Set `CRON_SECRET` in Vercel immediately | 1 | 1 hour |
| 2 | Implement email notifications for all governance events | 1 | 1 week |
| 3 | Add Sentry error tracking | 1 | 1 day |
| 4 | Replace in-memory rate limiter with Upstash Redis | 1 | 3 days |
| 5 | Implement CORS lock on `/api/v1/*` | 1 | 1 day |
| 6 | Add SSRF prevention on webhook URLs | 1 | 2 days |
| 7 | Build configurable approval engine | 1 | 2 weeks |
| 8 | Add comments to governance entities (platform service) | 1 | 2 weeks |
| 9 | Build Vendor Approval workflow | 1 | 2 weeks |
| 10 | Implement SAML 2.0 + OIDC (Okta + Entra ID) | 2 | 4 weeks |
| 11 | Implement SCIM 2.0 | 2 | 3 weeks |
| 12 | Wire Slack notifications (real integration) | 2 | 1 week |
| 13 | Generate and publish OpenAPI specification | 2 | 1 week |
| 14 | Add async job queue (pg-boss / QStash) | 2 | 2 weeks |
| 15 | Add structured logging (JSON + Datadog) | 2 | 1 week |
| 16 | Add full-text search indexes on primary text fields | 2 | 3 days |
| 17 | Document DR plan with RTO/RPO; enable Supabase PITR | 2 | 1 week |
| 18 | Build 3 real Integration Hub connectors (Okta, AWS, GitHub) | 2 | 4 weeks |
| 19 | Implement CMK (AWS KMS + Azure Key Vault functional) | 3 | 4 weeks |
| 20 | Publish responsible disclosure policy; engage pen-test firm | 2 | 2 months |

---

## Readiness Summary

### Overall Enterprise Readiness: 58 / 100

**What AUDT does well:**
- Multi-tenant data isolation (RLS on 259+ tables) is genuinely enterprise-grade
- GRC core (Evidence Vault™, Trust Intelligence™, Risk Lens™, Audit Management™) is functionally complete
- Authentication security (TOTP MFA, session governance, device trust, IP allow lists) is well-implemented
- Compliance framework coverage (ISO 27001, SOC 2, DPDP, HIPAA, PCI DSS) is broad and deep
- Security headers are correctly configured

**What must be fixed before launch:**
- Notifications, SSO, approval engine, and comments are the four most impactful gaps
- CRON_SECRET must be set before first production deployment
- Integration Hub connectors must be clearly labelled as simulated or made functional
- Zero observability is unacceptable in a production environment

**Realistic timeline to enterprise-ready:**
- SMB / Startup ready: **Now** (with notification fix)
- Mid-market ready: **3–4 months** (Wave 1 complete)
- Enterprise ready: **9–12 months** (Wave 2 complete)
- Fortune 500 ready: **12–18 months** (Wave 3 complete)
- Regulated industry (Banking/Healthcare) certified: **18–24 months** (Wave 4 complete)

---

*AUDT Product Audit Phase 5 · 2026-06-26 · Enterprise Readiness Assessment · 58/100 overall*  
*Builds on Phase 1 (lifecycle) · Phase 2 (entity model) · Phase 3 (processes) · Phase 4 (capability maturity)*  
*This document is the enterprise readiness baseline for commercial launch planning.*
