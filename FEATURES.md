# AUDT — Features Implemented to Date

> Last updated: 2026-06-07 · Build: clean · Tests: 201/201 · Live: https://audt.tech · Modules: 7 shipped (+ Trust Score™)
> Rebranded from Lekha OS → AUDT (audt.tech) on 2026-06-07

---

## 🌐 Brand & Marketing

| Item | Detail |
|---|---|
| **Brand** | AUDT — AI-Native Trust, Risk & Compliance Platform |
| **Domain** | audt.tech (registered, DNS live on BigRock → Vercel) |
| **Category positioning** | Governance OS — not a point solution |
| **Tagline** | Governance Built on Proof. |
| **Landing page** | Full redesign — Hero, Trust Intelligence™ scores, Governance Copilot™ chat UI, platform pillars, solutions grid, audience cards, architecture diagram, roadmap, final CTA, structured footer |
| **Page title / SEO** | "AUDT | Governance Built on Proof." — updated across `app/layout.tsx` + OpenGraph |
| **DNS** | A record → `216.198.79.1` (Vercel), CNAME `www` → `cname.vercel-dns.com` — both set at BigRock |
| **SSL** | Pending Vercel auto-provisioning (DNS propagation in progress) |
| **Deployment** | Vercel (Mumbai `bom1`) — auto-deploys on `git push origin main` |

---

## 🏗️ Platform & Infrastructure

| Area | What's built |
|---|---|
| **Auth** | Supabase Auth — signup, login, email confirmation flow, session refresh via `proxy.ts` |
| **Onboarding** | Org creation + owner membership in a single transaction on first login |
| **RBAC** | 7 roles: Owner · Admin · Member · Viewer · Compliance Manager · Security Manager · Procurement Manager |
| **Multi-tenancy** | Every table has `organization_id`; RLS enforces isolation at DB level — no tenant can see another's data |
| **Provider layer** | Auth, AI, Storage, Crypto, Rate-limit — all SDKs isolated in `lib/providers/`; services never import SDKs directly |
| **Storage** | Two private buckets: `vendor-documents` (legacy) + `compliance-documents` (new, `tenant_` prefix paths); auto-routing by path prefix; 15-min signed URLs only — no public access |
| **Encryption** | AES-256-GCM for all integration credentials at rest (`ENCRYPTION_KEY`) |
| **REST API v1** | 21 endpoints (read-only + full CRUD for audits/findings/CAPAs/risks/treatments/reviews + Trust Score™ per vendor) · Bearer token auth + bcrypt key validation + in-memory rate limiting (100/300/1000 req/60s) |
| **Audit logging** | Every meaningful mutation logged to `audit_logs` with actor, action, entity, metadata, ip_address |
| **DB** | Drizzle ORM, lazy Proxy init, Supabase Postgres pooler, `ssl:"require"`, 48 tables across 10 migrations — all applied |
| **Email** | Resend integration — expiry alert emails + AI-written weekly digest |
| **PDF generation** | `@react-pdf/renderer` — dynamic ESM import pattern |

---

## 📦 Module 1 — Vendor Hub™ (Vendor Governance)

| Feature | Detail |
|---|---|
| **Vendor registry** | Create / edit / deactivate vendors; 25 fields including owner, contact, category, risk level |
| **Vendor types / templates** | 7 built-in templates (Cloud, SaaS, IT Services, Finance, Staffing, Legal, General) with required + optional doc checklists |
| **Document management** | Upload to private storage, type classification, issue/expiry dates, status tracking (valid / expiring / expired / missing) |
| **AI document extraction** | Gemini v2 extracts 10 structured fields from uploaded PDFs |
| **Document requests** | Request workflow — requested → submitted → approved / rejected / expired |
| **Compliance scoring** | Pure function `computeScore()` — 0–100 based on docs + checklist completion |
| **Risk engine** | `computeRiskScore()` — level + score + contributing factors array |
| **Security assessments** | 17-question assessment per vendor, scored 0–100, status tracked |
| **Vendor reviews** | Annual / quarterly / security / compliance review cycles |
| **Vendor portal** | Magic-link token for vendor self-service document upload — no auth required |
| **NL search** | Gemini converts plain English → structured filters (`?nlq=`) |
| **AI vendor summary** | Cached Gemini executive brief per vendor |
| **AI score explanation** | Plain-English "why this score" narrative |
| **AI risk narrative** | Risk factor explanation |
| **AI recommended actions** | JSON array of prioritised next steps |
| **Executive PDF** | AI-narrated vendor executive report |
| **Audit package PDF** | Full document + assessment bundle per vendor |
| **Expiry report PDF** | Org-wide document expiry report |
| **Email alerts** | Cron job — alerts at 90/60/30/15/7 days before expiry |
| **AI weekly digest** | Cron job — Gemini-written org health summary email |
| **Vendor export** | CSV export of full vendor registry |
| **Dashboard** | Compliance score trends, risk breakdown, expiring documents, activity feed |

---

## ✅ Module 2 — Evidence Vault™ (Compliance Management)

| Feature | Detail |
|---|---|
| **Frameworks** | Create and manage compliance frameworks (ISO 27001, SOC 2, DPDP, PCI DSS, HIPAA, custom) |
| **Seeded controls** | 174 standard controls: ISO 27001 (93) · SOC 2 (33) · DPDP (18) · PCI DSS (12) · HIPAA (18) |
| **Control management** | Per-control status (Implemented / Partial / Not Implemented / N/A), priority, owner, review date |
| **Evidence** | Create evidence items; auto-import from vendor docs, assessments, reviews; manual upload |
| **Evidence mapping** | Many-to-many control↔evidence; manual or AI-suggested |
| **Policies** | Create policies with version history; statuses: draft → review → approved → archived / expired |
| **Readiness scoring** | `computeReadiness()` — pure function; materialised score per framework (overall, control coverage, evidence coverage, policy coverage) |
| **Gap analysis** | 5 rule-based gap types: missing control, missing evidence, expired evidence, expired policy, unmapped control |
| **AI framework summary** | Gemini narrative of framework readiness |
| **AI readiness explanation** | Plain-English breakdown of the score |
| **AI gap narrative** | Contextual explanation of each gap |
| **AI executive summary** | Board-level compliance status brief |
| **AI Compliance Officer** | Live NL chat — ask anything about your compliance posture |
| **Framework PDF report** | Per-framework readiness PDF |
| **Executive compliance PDF** | AI-narrated multi-framework executive report |
| **CSV exports** | Controls · Evidence · Gaps |

---

## ⚙️ Module 3 — Settings & Org Management

| Tab | Features |
|---|---|
| **Profile** | Full name, job title, department, phone, timezone, language; notification preferences |
| **Organization** | Legal name, industry, company size, website, country, state, timezone; branding (primary/accent colours, report footer, email signature) |
| **Team** | Invite members; 7-role selector; department per member; Transfer Ownership; Resend Invite; deactivate/reactivate |
| **Security** | Password change with strength indicator; MFA panel (UI ready, awaits Supabase MFA); login history table |
| **Audit Logs** | Filterable by user / module / date / search; severity badges; pagination; CSV export |
| **Billing** | Plan card (Starter/Growth/Enterprise); usage meters (users/vendors/storage vs plan limits); upgrade CTA |
| **API Keys** | Generate / rotate / revoke; key shown once with copy/reveal; bcrypt hash stored — hash never returned to client |
| **Integrations** | 10 providers (Resend, SMTP, Google Workspace, Microsoft 365, Slack, Teams, WhatsApp, Google Drive, OneDrive, SharePoint); AES-256-GCM config encryption |

---

## 🔍 Module 4 — Audit Management

> Completed 2026-06-06

| Feature | Detail |
|---|---|
| **Audit lifecycle** | Plan → In Progress → Completed / Cancelled. Full CRUD with type (Internal / External / Vendor / Security / Compliance / Regulatory), scope, objective, auditor name, date range |
| **Audit program** | Auto-generate checklist from linked compliance framework controls. Status per item: Pending / Reviewed / Passed / Failed |
| **Findings** | Record audit findings with severity (Critical / High / Medium / Low) and status (Open / Remediating / Closed / Accepted). Linked to controls and evidence. Org-wide filterable list |
| **Corrective Actions (CAPAs)** | Full CAPA lifecycle: Open → In Progress → Completed / Overdue. Due-date tracking with overdue (red) and due-soon (amber) highlights. Linked to findings — creating a CAPA auto-moves finding to "remediating" |
| **AI Finding Generator** | Paste an observation → Gemini returns structured title, severity, description, recommendation |
| **AI CAPA Suggestions** | 3 AI-suggested remediation steps per finding |
| **AI Audit Summary** | Gemini 3–4 sentence executive summary per audit; cached in `ai_compliance_insights` |
| **AI Executive Report** | Board-level multi-paragraph narrative per audit; cached in `ai_compliance_insights` |
| **AI Auditor Assistant** | Live NL chat — ask anything about audits, findings, CAPAs |
| **Dashboard metrics** | Total / Planned / Active / Completed / Overdue audits · Open findings · Critical findings · CAPAs due soon |
| **Org-wide views** | Cross-audit findings list (filter by severity + status) · CAPA tracker (filter by status, due-date highlighting) |
| **PDF reports** | Full Audit Report (overview, AI narrative, findings by severity, CAPAs table) · Findings-only PDF · CAPA Tracker PDF |
| **CSV exports** | Findings CSV · CAPAs CSV — per audit |
| **REST API** | `GET/POST /api/v1/audits` · `GET/PUT/DELETE /api/v1/audits/[id]` · `GET/POST /api/v1/findings` · `GET/POST /api/v1/capas` — all Bearer auth + rate limited |
| **RBAC** | All mutations require owner/admin/member/compliance_manager/security_manager/procurement_manager role. Viewers read-only via RLS |
| **Audit logging** | `audit.created`, `audit.finding_created`, `audit.finding_closed`, `audit.capa_created`, `audit.capa_completed`, `audit.updated`, `audit.completed`, `audit.cancelled` |

---

## 🔴 Module 5 — Risk Lens™

> Completed 2026-06-07

| Feature | Detail |
|---|---|
| **Risk register** | Full CRUD for risks with 13 categories (operational, cyber_security, compliance, financial, strategic, legal, technology, vendor, privacy, business_continuity, third_party, regulatory, custom), 8 statuses, 5 sources |
| **Risk scoring** | Pure `computeRiskScore(impact, likelihood)` — score 1–25, 5 levels: Low / Moderate / High / Critical / Severe. Live matrix preview on create/edit |
| **Risk heat map** | Interactive 5×5 grid — impact (Y) × likelihood (X), cells coloured by score range, risk counts per cell, click to filter register |
| **Treatment tracking** | Add treatment actions per risk with target date, status (open / in_progress / completed / cancelled), progress %, and completion notes |
| **Risk reviews** | Periodic review log per risk — review date, outcome (no_change / score_updated / status_changed / closed), notes, reviewer |
| **Risk relationships** | Link risks to vendors, compliance controls, audit findings, policies, frameworks, evidence via 6 junction tables |
| **Dashboard metrics** | Total / Open / Mitigating / Accepted / Closed risks · Critical risk count · Overdue reviews · Category chart · Heat map · Top 5 risks by score |
| **Org-wide treatment tracker** | Cross-risk treatment list with due-date highlighting — overdue (red), due soon (amber), in-progress (blue) |
| **AI Risk Narrative** | Gemini executive summary per risk; cached in `ai_compliance_insights` |
| **AI Risk from Observation** | Paste an observation → Gemini returns structured title, category, severity, description |
| **AI Mitigation Recommendations** | 5 AI-suggested treatment actions per risk |
| **AI Executive Summary** | Board-level org-wide risk posture report; cached |
| **AI Risk Officer Chat** | Live NL chat — ask anything about your risk register ("Which risks are overdue?", "Summarise critical risks") |
| **Reports page** | Risks CSV · Treatments CSV download links |
| **CSV exports** | `/reports/risks/csv` · `/reports/risks/treatments/csv` — full org risk data |
| **REST API** | `GET/POST /api/v1/risks` · `GET/PUT/DELETE /api/v1/risks/[id]` · `GET/POST /api/v1/risk-treatments` · `GET/POST /api/v1/risk-reviews` — Bearer auth + rate limited |
| **RBAC** | All mutations require owner/admin/member/compliance_manager/security_manager/procurement_manager. Viewers read-only via RLS |
| **RLS** | 9 tables with org-scoped RLS — risks, risk_reviews, risk_treatments use `is_org_member()` / `has_org_role()`; junction tables validate via risk's org |
| **Navigation** | 5-tab sub-nav: Dashboard · Risk Register · Treatments · Reports · AI Risk Officer |
| **Seed data** | `seed-risk-lens.mjs` — 20 realistic risks · 25 treatment actions · 8 reviews · vendor/control/framework links |

---

## 🏆 Trust Score™

> Completed 2026-06-07 · Integrated into Vendor Hub™ · API-first

Trust Score™ is AUDT's flagship intelligence layer — a single 0–100 signal that answers *"Can this vendor be trusted?"* across 6 weighted governance dimensions.

### Scoring Model

| Component | Weight | Source | Calculation |
|---|---|---|---|
| **Evidence** | 25% | Vendor documents | 100 − penalties for expired (−10ea), expiring (−5ea), missing required types (−15ea); hard cap of 25 if no docs at all |
| **Compliance** | 20% | `vendor.complianceScore` | Direct passthrough from existing compliance scoring |
| **Risk** | 20% | Risk Lens™ linked risks | 100 − 25 per critical open risk (inherentScore ≥ 20) − 12 per high − 5 per medium; 100 if no linked risks |
| **Assessment** | 15% | Security assessments | Latest completed assessment score; baseline 30 if never assessed |
| **Operational** | 10% | Reviews + doc requests | Deducts for no reviews (−35), no review in 12mo (−20), open unfulfilled requests (proportional) |
| **Freshness** | 10% | Recency of governance activity | Deducts based on days since last review (−45 if >365d) and last assessment (−25 if >365d) |

**Formula:** `round(evidence×0.25 + compliance×0.20 + risk×0.20 + assessment×0.15 + operational×0.10 + freshness×0.10)`

### Trust Levels

| Range | Level | Colour |
|---|---|---|
| 95–100 | Exceptional | Emerald |
| 90–94 | Trusted | Emerald |
| 80–89 | Strong | Green |
| 70–79 | Moderate | Yellow |
| 60–69 | Needs Attention | Amber |
| 0–59 | High Concern | Red |

### Feature Detail

| Feature | Detail |
|---|---|
| **Auto-computation** | Score recomputes on vendor detail page load if stale (>1 hour). Trigger events: `page_load`, `manual`, `api`, `seed`, `document_upload`, `risk_created`, `assessment_completed`, `review_completed` |
| **Component breakdown** | All 6 component scores stored per snapshot — full traceability of what drives the overall score |
| **Trust history** | `vendor_trust_history` table — one row per snapshot; supports 7d / 30d / 90d / 12mo trend views |
| **Explainability widget** | `TrustScoreWidget` — live breakdown bars, strengths list (✓), concerns list (⚠), Recalculate button |
| **Strengths & Concerns** | Auto-generated from component scores: e.g. "Current SOC 2", "No critical risks", "DPA expires in 30 days", "Annual review overdue" |
| **Recommendations engine** | Up to 5 prioritised action items auto-derived from the scoring inputs (renew expired docs, complete assessment, schedule review, etc.) |
| **AI Trust Narrative** | Gemini-generated 2–3 sentence executive summary per vendor; cached 24 hours; refresh button in widget |
| **Trust Score badge** | `TrustScoreBadge` — inline level chip displayed in vendor header and list views |
| **Vendor header** | Trust Score box shown alongside the existing Compliance Score ring on the vendor detail page |
| **REST API** | `GET /api/v1/vendors/[id]/trust-score` — returns score, all 6 component scores, 30-day history array, AI narrative, strengths, concerns, recommendations |
| **Seed script** | `node scripts/seed-trust-scores.mjs` — pure SQL scoring; scores all active vendors and writes 1 history row each |
| **Pure engine** | `lib/services/trust-score.ts` — zero DB imports; fully testable; same logic used by seed script and service |

---

## 🛡️ Phase 1 — Data Governance

> Completed 2026-06-05

| Feature | Detail |
|---|---|
| **Data summary stats** | Documents, storage consumed, vendors, assessments, active users |
| **Data residency display** | Mumbai (ap-south-1) for all layers — app, DB, storage, AI; DPDP 2023 localisation badge |
| **Data retention policy** | Per-type retention periods displayed (read-only Phase 1) |
| **AI transparency** | Three explicit statements: what AI is used for · no-training guarantee · tenant isolation |
| **Security checklist** | 10 active controls verified; 2 roadmap items (BYOK, customer-owned storage) |
| **Export Tenant Data** | One-click ZIP download — vendors, documents metadata, assessments, team, audit logs as CSVs |
| **Request Data Deletion** | Confirmation modal with irreversibility warning → support ticket (Phase 2: automated) |
| **Recent audit events** | Last 30 days of activity visible on the governance page |
| **`compliance-documents` bucket** | Private Supabase Storage bucket with RLS; `tenant_{orgId}/` prefix paths |
| **`storage_providers` table** | Registry for future S3 / Azure Blob / SharePoint / OneDrive / Google Drive providers |
| **Storage metadata on docs** | `filename`, `content_type`, `file_size`, `storage_bucket`, `storage_provider`, `uploaded_by`, `checksum` |

---

## 🧭 Navigation

**Sidebar:** Dashboard · Vendors (with Trust Score™ inline) · Compliance · Audits · Risks · DPDP Privacy *(soon)* · Board Governance *(soon)* · Settings · Team · Notifications · Data Governance

**Trust Intelligence™** (future dedicated sidebar section): Vendor Trust · Control Trust · Organization Trust · Insights · Benchmarks

**Settings sub-nav (9 tabs):** Profile · Organization · Team · Security · Audit Logs · Billing · API Keys · Integrations · Data Governance

---

## 📍 Current Status (2026-06-07)

| Layer | Status |
|---|---|
| **Brand** | ✅ Rebranded to AUDT — landing page, page title, OpenGraph, footer, mock dashboard all updated |
| **Domain** | ✅ audt.tech DNS configured (A + CNAME set at BigRock) — SSL provisioning in progress (~4–6 hrs) |
| **GitHub** | ✅ https://github.com/SandyRepo29/lekha-os — all code current |
| **Vercel** | ✅ Auto-deployed on push — currently live at lekha-os.vercel.app and audt.tech (SSL pending) |
| **Trust Score™** | ✅ Complete — pure engine, service, repo, widget, badge, API, seed script |
| **Migration 0010** | ⚠ Pending apply — `node scripts/apply-sql.mjs supabase/migrations/0010_trust_score.sql` |
| **DB** | ✅ 37 tables, 9 migrations applied, Supabase Mumbai (ap-south-1) |
| **Module 1 — Vendor Hub™** | ✅ Complete |
| **Module 2 — Evidence Vault™** | ✅ Complete |
| **Module 3 — Settings & Org** | ✅ Complete |
| **Module 4 — Audit Management** | ✅ Complete |
| **Module 5 — Risk Lens™** | ✅ Complete |
| **Phase 1 — Data Governance** | ✅ Complete |
| **Tests** | ✅ 201/201 Vitest passing |

---

## ⚠️ Pending — blocked on config / provisioning, not code

| Item | Blocked by |
|---|---|
| SSL on audt.tech | DNS propagation in progress — Vercel will auto-provision Let's Encrypt once Valid Configuration shows |
| Team invite flow | `SUPABASE_SERVICE_ROLE_KEY` placeholder in Vercel |
| Email alerts + weekly digest | `RESEND_API_KEY` missing in Vercel |
| Cron endpoint security | `CRON_SECRET` missing in Vercel |
| S3 storage provider | Awaiting AWS provisioning — `lib/providers/storage/s3.ts` ready to implement against `StorageProvider` interface |

---

## 🗺️ Roadmap — What's Next

| Module | Description | Status |
|---|---|---|
| **Risk Lens™** | Risk register, heat maps, remediation tracking | ✅ Complete |
| **Control Center™** | Control library, health monitoring, coverage analytics | Roadmap |
| **Policy Governance** | Full policy lifecycle, versioning, owner accountability | Roadmap |
| **DPDP Privacy Module** | India DPDP Act 2023 — data inventory, consent tracking, retention | Roadmap |
| **Contract Governance** | Contract lifecycle, expiry monitoring, obligation tracking | Future |
| **AI Governance** | AI model risk, responsible AI frameworks, governance policies | Future |
| **Continuous Monitoring** | Real-time control health signals, automated evidence collection | Future |
| **Trust Graph™** | Cross-entity knowledge graph — vendors, controls, risks, policies | Future |
| **Governance OS** | Full category vision — system of record for organizational trust | Vision |

---

## 🏷️ AUDT Product Naming

| Generic Name | AUDT Brand Name |
|---|---|
| Vendor Management | Vendor Hub™ |
| Evidence Repository | Evidence Vault™ |
| Risk Engine | Risk Lens™ |
| AI Assistant | Governance Copilot™ |
| Controls | Control Center™ |
| Vendor Rating | Trust Score™ |
| Governance Graph | Trust Graph™ |
| Intelligence Layer | Trust Intelligence™ |
