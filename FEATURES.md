# AUDT — Features Implemented to Date

> Last updated: 2026-06-07 · Build: clean · Tests: 201/201 · Live: https://audt.tech
> Modules: **9 shipped** — Vendor Hub™ · Evidence Vault™ · Settings · Data Gov · Audits · Risk Lens™ · Trust Score™ · Control Center™ · Trust Intelligence™
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
| **REST API v1** | 26 endpoints — full CRUD for audits/findings/CAPAs/risks/treatments/reviews + Trust Score™ + Control CSV exports + Trust Intelligence™ (overview, org-score, recommendations) · Bearer token auth + bcrypt key validation + in-memory rate limiting |
| **Audit logging** | Every meaningful mutation logged to `audit_logs` with actor, action, entity, metadata, ip_address |
| **DB** | Drizzle ORM, lazy Proxy init, Supabase Postgres pooler, `ssl:"require"`, **52 tables** across 12 migrations — all applied |
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
| **AI Audit Summary** | Gemini 3–4 sentence executive summary per audit; cached |
| **AI Executive Report** | Board-level multi-paragraph narrative per audit; cached |
| **AI Auditor Assistant** | Live NL chat — ask anything about audits, findings, CAPAs |
| **Dashboard metrics** | Total / Planned / Active / Completed / Overdue audits · Open findings · Critical findings · CAPAs due soon |
| **Org-wide views** | Cross-audit findings list (filter by severity + status) · CAPA tracker (filter by status, due-date highlighting) |
| **PDF reports** | Full Audit Report · Findings-only PDF · CAPA Tracker PDF |
| **CSV exports** | Findings CSV · CAPAs CSV — per audit |
| **REST API** | `GET/POST /api/v1/audits` · `GET/PUT/DELETE /api/v1/audits/[id]` · `GET/POST /api/v1/findings` · `GET/POST /api/v1/capas` |
| **RBAC** | All mutations require non-viewer role; viewers read-only via RLS |
| **Audit logging** | `audit.created`, `audit.finding_created`, `audit.finding_closed`, `audit.capa_created`, `audit.capa_completed`, `audit.completed`, `audit.cancelled` |

---

## 🔴 Module 5 — Risk Lens™

> Completed 2026-06-07

| Feature | Detail |
|---|---|
| **Risk register** | Full CRUD — 13 categories, 8 statuses, 5 sources |
| **Risk scoring** | Pure `computeRiskScore(impact, likelihood)` — score 1–25, 5 levels: Low / Moderate / High / Critical / Severe. Live matrix preview on create/edit |
| **Risk heat map** | Interactive 5×5 grid — impact (Y) × likelihood (X), cells coloured by score range, click to filter register |
| **Treatment tracking** | Add treatment actions per risk — status, progress %, target date, completion notes |
| **Risk reviews** | Periodic review log per risk — outcome, notes, reviewer |
| **Risk relationships** | Link risks to vendors, controls, findings, policies, frameworks, evidence via 6 junction tables |
| **Dashboard metrics** | Total / Open / Mitigating / Accepted / Closed · Critical count · Overdue reviews · Category chart · Heat map · Top 5 |
| **Org-wide treatment tracker** | Cross-risk treatment list — overdue (red), due soon (amber), in-progress (blue) |
| **AI Risk Narrative** | Gemini executive summary per risk; cached |
| **AI Risk from Observation** | Paste an observation → Gemini returns structured risk entry |
| **AI Mitigation Recommendations** | 5 AI-suggested treatment actions per risk |
| **AI Executive Summary** | Board-level org-wide risk posture report; cached |
| **AI Risk Officer Chat** | Live NL chat |
| **Reports page** | Risks CSV · Treatments CSV |
| **REST API** | `GET/POST /api/v1/risks` · `GET/PUT/DELETE /api/v1/risks/[id]` · `GET/POST /api/v1/risk-treatments` · `GET/POST /api/v1/risk-reviews` |
| **Seed data** | 20 risks · 25 treatments · 8 reviews · vendor/control/framework links |

---

## 🛡️ Module 6 — Control Center™

> Completed 2026-06-07

Central governance layer connecting risks, audits, evidence, policies, vendors and frameworks through **Control Health™** — a 6-component 0–100 scoring engine.

### Control Health™ Scoring Model

| Component | Weight | Source |
|---|---|---|
| **Evidence Coverage** | 30% | Approved evidence linked to control |
| **Testing Results** | 25% | Pass rate of tests in last 12 months |
| **Audit Performance** | 15% | Open vs closed findings linked to this control |
| **Policy Support** | 10% | Approved policies in the org (proxy) |
| **Review Freshness** | 10% | Days since last review |
| **Risk Reduction Impact** | 10% | Mitigating/accepted/closed linked risks ratio |

### Health Levels

| Range | Level |
|---|---|
| 95–100 | Exceptional |
| 90–94 | Healthy |
| 80–89 | Strong |
| 70–79 | Moderate |
| 60–69 | Needs Attention |
| < 60 | Critical |

### Feature Detail

| Feature | Detail |
|---|---|
| **Control Library** | Filterable table (search, status, category); columns: ID · Name · Category · Type · Status · Health™ · Evidence · Priority |
| **Control detail** | Health™ breakdown with per-component bars, strengths/concerns, test history |
| **Create / Edit** | Full form: ref, name, description, objective, category, type, status, priority, frequency, automation, owner, dates |
| **Control types** | Preventive · Detective · Corrective · Compensating · Administrative · Technical · Physical · Hybrid |
| **Control testing** | Per-control test records: date, result, tester, method, comments. Org-wide test log at `/controls/testing` |
| **Compute Health™** | Button on detail triggers `computeControlHealth()` → saves scores → refreshes |
| **Dashboard** | Total / healthy / weak / overdue / avg health / implementation coverage / weakest list / category chart |
| **AI Executive Summary** | Board-level control posture narrative; Gemini cached 24h |
| **AI Gap Detection** | Top 5 gaps with specific remediation actions |
| **AI Control Advisor Chat** | Live NL chat |
| **CSV exports** | Control library · Tests |
| **Navigation** | 5-tab sub-nav: Dashboard · Control Library · Testing · Reports · AI Advisor |
| **Schema** | `controls` extended (frameworkId nullable + 11 new cols); `control_tests`, `control_frameworks`, `control_vendors` |

---

## 🧠 Module 7 — Trust Intelligence™

> Completed 2026-06-07

Executive governance command center. Aggregates signals from all modules into a single **Organizational Trust Score™** — the flagship governance metric.

### Organizational Trust Score™ Scoring Model

| Component | Weight | Source |
|---|---|---|
| **Vendor Trust** | 25% | Average vendor Trust Score™ across active vendors |
| **Risk Posture** | 25% | Active/critical/high risk counts from Risk Lens™ |
| **Control Health** | 20% | Average control health score from Control Center™ |
| **Audit Readiness** | 15% | Audit completion ratio + open critical findings |
| **Compliance Coverage** | 15% | Average framework readiness from Evidence Vault™ |

**Formula:** `round(vendorTrust×0.25 + riskPosture×0.25 + controlHealth×0.20 + auditReadiness×0.15 + complianceCoverage×0.15)`

### Trust Levels

| Range | Level |
|---|---|
| 95–100 | Exceptional |
| 90–94 | Trusted |
| 80–89 | Strong |
| 70–79 | Moderate |
| 60–69 | Needs Attention |
| < 60 | Critical |

### Feature Detail

| Feature | Detail |
|---|---|
| **Overview dashboard** | Org Trust Score™ ring (animated SVG) + 5-component bars · Metrics grid (vendors/risks/controls/findings/compliance) · Trust Drivers™ · Trust Detractors™ · Governance Timeline (last 10 events) |
| **Vendor Trust view** | Total/scored/avg/high-concern counts · Top 10 trusted · Bottom 10 · Full ranked list with score bars and level badges |
| **Risk Insights view** | Active/critical/high/medium counts · Top critical risks with deep-links · Category distribution chart |
| **Control Health view** | Avg health · Healthy/Weak counts · Weakest controls ranked list · Health distribution (Healthy/Moderate/Weak) |
| **Compliance Health view** | Per-framework readiness bars (control % + evidence %) · Avg readiness · Status verdict |
| **Recommendations Engine™** | Prioritized governance actions (high/medium/low) — generated from live risk/control/vendor/finding data · Impact + effort scores · Deep-links to source module |
| **Executive View** | Org Trust ring · AI Governance Summary (cached 24h) · Full component breakdown · Trust Drivers™/Detractors™ · Open high-priority actions · Governance Copilot™ chat |
| **Governance Copilot™** | NL chat — "Why did trust decline?", "Which risks need attention?", "Summarize our posture", with suggested starter questions |
| **AI Executive Summary** | Board-ready Gemini narrative — posture, strengths, risks, top actions; cached 24h per org |
| **Trust Drivers™** | Positive governance contributors shown on Overview + Executive view |
| **Trust Detractors™** | Negative contributors shown on Overview + Executive view |
| **Governance Timeline** | Last 30 audit log events with actor, action, date |
| **Governance Snapshots** | `governance_snapshots` table — daily org-level scores for trend tracking; upserted via `snapshotGovernance()` |
| **Pure scoring engine** | `lib/services/org-trust-score.ts` — `computeOrgTrustScore(inputs)` → breakdown + level + drivers + detractors. Zero DB imports. |
| **REST API** | `GET /api/v1/trust-intelligence/overview` · `GET /api/v1/trust-intelligence/org-score` · `POST /api/v1/trust-intelligence/org-score` (snapshot) · `GET /api/v1/trust-intelligence/recommendations` |
| **Navigation** | 7-tab sub-nav: Overview · Vendor Trust · Risk Insights · Control Health · Compliance · Recommendations · Executive View |
| **Sidebar** | Trust Intelligence™ entry with Brain icon between Control Center™ and DPDP Privacy |
| **Audit logging** | `trust_intelligence.viewed`, `trust_intelligence.summary_generated`, `trust_intelligence.score_recalculated` |

---

## 🏆 Trust Score™

> Completed 2026-06-07 · Integrated into Vendor Hub™ · API-first

Trust Score™ is AUDT's per-vendor intelligence signal — a single 0–100 score across 6 governance dimensions.

### Scoring Model

| Component | Weight | Source | Calculation |
|---|---|---|---|
| **Evidence** | 25% | Vendor documents | 100 − penalties for expired (−10), expiring (−5), missing required types (−15); hard cap 25 if no docs |
| **Compliance** | 20% | `vendor.complianceScore` | Direct passthrough |
| **Risk** | 20% | Risk Lens™ linked risks | 100 − 25 per critical open risk − 12 per high − 5 per medium |
| **Assessment** | 15% | Security assessments | Latest score; baseline 30 if never assessed |
| **Operational** | 10% | Reviews + doc requests | Deducts for no reviews (−35), no review in 12mo (−20), open requests (proportional) |
| **Freshness** | 10% | Recency of governance activity | Deducts based on days since last review/assessment |

### Feature Detail

| Feature | Detail |
|---|---|
| **Auto-computation** | Score recomputes on vendor detail page load if stale (>1 hour) |
| **Trust history** | `vendor_trust_history` — one row per snapshot; trend-ready |
| **Explainability widget** | `TrustScoreWidget` — breakdown bars, strengths, concerns, Recalculate button |
| **AI Trust Narrative** | Gemini executive summary per vendor; cached 24 hours |
| **Trust Score badge** | `TrustScoreBadge` — inline level chip in vendor header and list views |
| **REST API** | `GET /api/v1/vendors/[id]/trust-score` — score, components, 30-day history, narrative |
| **Seed script** | `node scripts/seed-trust-scores.mjs` — scores all active vendors |
| **Pure engine** | `lib/services/trust-score.ts` — zero DB imports |

---

## 🛡️ Phase 1 — Data Governance

> Completed 2026-06-05

| Feature | Detail |
|---|---|
| **Data summary stats** | Documents, storage consumed, vendors, assessments, active users |
| **Data residency display** | Mumbai (ap-south-1) for all layers — DPDP 2023 localisation badge |
| **Data retention policy** | Per-type retention periods (read-only Phase 1) |
| **AI transparency** | What AI is used for · no-training guarantee · tenant isolation |
| **Security checklist** | 10 active controls verified |
| **Export Tenant Data** | One-click ZIP — vendors, documents, assessments, team, audit logs as CSVs |
| **Request Data Deletion** | Confirmation modal → support ticket (Phase 2: automated) |
| **Recent audit events** | Last 30 days visible on governance page |
| **`compliance-documents` bucket** | Private Supabase Storage bucket with RLS; `tenant_{orgId}/` prefix paths |
| **`storage_providers` table** | Registry for future S3 / Azure Blob / SharePoint / Google Drive providers |

---

## 🧭 Navigation

**Sidebar:** Dashboard · Vendors · Compliance · Audits · Risks · Control Center™ · **Trust Intelligence™** · DPDP Privacy *(soon)* · Board Governance *(soon)* · Settings · Team · Notifications · Data Governance

**Settings sub-nav (9 tabs):** Profile · Organization · Team · Security · Audit Logs · Billing · API Keys · Integrations · Data Governance

**Compliance sub-nav:** Dashboard · Frameworks · Evidence · Policies · Gaps · Reports · AI Officer

**Audit sub-nav:** Dashboard · Audits · Findings · CAPAs · Reports · AI Auditor

**Risk sub-nav:** Dashboard · Risk Register · Treatments · Reports · AI Risk Officer

**Control Center sub-nav:** Dashboard · Control Library · Testing · Reports · AI Advisor

**Trust Intelligence sub-nav:** Overview · Vendor Trust · Risk Insights · Control Health · Compliance · Recommendations · Executive View

---

## 📍 Current Status (2026-06-07)

| Layer | Status |
|---|---|
| **Brand** | ✅ Rebranded to AUDT — landing page, page title, OpenGraph, footer all updated |
| **Domain** | ✅ audt.tech DNS configured (A + CNAME set at BigRock) — SSL provisioning in progress |
| **GitHub** | ✅ https://github.com/SandyRepo29/lekha-os — all code current |
| **Vercel** | ✅ Auto-deployed on push — live at lekha-os.vercel.app and audt.tech |
| **DB** | ✅ 52 tables, 12 migrations applied, Supabase Mumbai (ap-south-1) |
| **Module 1 — Vendor Hub™** | ✅ Complete |
| **Module 2 — Evidence Vault™** | ✅ Complete |
| **Module 3 — Settings & Org** | ✅ Complete |
| **Module 4 — Audit Management** | ✅ Complete |
| **Module 5 — Risk Lens™** | ✅ Complete |
| **Module 6 — Control Center™** | ✅ Complete (2026-06-07) |
| **Module 7 — Trust Intelligence™** | ✅ Complete (2026-06-07) |
| **Trust Score™** | ✅ Complete |
| **Phase 1 — Data Governance** | ✅ Complete |
| **Tests** | ✅ 201/201 Vitest passing |

---

## ⚠️ Pending — blocked on config / provisioning, not code

| Item | Blocked by |
|---|---|
| SSL on audt.tech | DNS propagation in progress — Vercel auto-provisions once ready |
| Team invite flow | `SUPABASE_SERVICE_ROLE_KEY` placeholder in Vercel |
| Email alerts + weekly digest | `RESEND_API_KEY` missing in Vercel |
| Cron endpoint security | `CRON_SECRET` missing in Vercel |
| S3 storage provider | Awaiting AWS provisioning |

---

## 🗺️ Roadmap — What's Next

| Module | Description | Status |
|---|---|---|
| **Trust Intelligence™** | Org Trust Score™, Recommendations Engine™, Governance Copilot™ | ✅ Complete (2026-06-07) |
| **Governance Trends** | 30/90/365-day trend charts using `governance_snapshots` | Next |
| **Policy Governance** | Full policy lifecycle, versioning, owner accountability | Roadmap |
| **DPDP Privacy Module** | India DPDP Act 2023 — data inventory, consent tracking, retention | Roadmap |
| **Contract Governance** | Contract lifecycle, expiry monitoring, obligation tracking | Future |
| **AI Governance** | AI model risk, responsible AI frameworks | Future |
| **Continuous Monitoring** | Real-time control health, automated evidence collection | Future |
| **Trust Graph™** | Cross-entity knowledge graph | Future |
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
| Org Governance Score | Organizational Trust Score™ |
