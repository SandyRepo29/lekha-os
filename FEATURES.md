# AUDT — Features Implemented to Date

> Last updated: 2026-06-13 · Build: clean · Tests: 201/201 · Live: https://audt.tech
> Modules: **24 shipped** — Vendor Hub™ · Evidence Vault™ · Settings · Data Gov · Audits · Risk Lens™ · Trust Score™ · Control Center™ · Trust Intelligence™ · Governance Trends™ · Continuous Monitoring™ · Trust Graph™ · Policy Governance™ · DPDP Privacy™ · Contract Governance™ · Issue & Remediation Hub™ · Workflow Studio™ · Third-Party Risk Exchange™ · Trust Network™ · Governance Benchmarking™ · Integration Hub™ · Executive Reporting & Analytics™ · **AI Governance™**
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
| **REST API v1** | 47 endpoints — full CRUD for audits/findings/CAPAs/risks/treatments/reviews/contracts/issues/workflows + Trust Score™ + Control CSV exports + Trust Intelligence™ (overview, org-score, recommendations) + policies + privacy + workflow-runs + trust-exchange + trust-network + benchmarking + integrations · Bearer token auth + bcrypt key validation + in-memory rate limiting |
| **Audit logging** | Every meaningful mutation logged to `audit_logs` with actor, action, entity, metadata, ip_address |
| **DB** | Drizzle ORM, lazy Proxy init, Supabase Postgres pooler, `ssl:"require"`, **117 tables** across 23 migrations — all applied |
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

## 📈 Module 8 — Governance Trends™ + Continuous Monitoring™

> Completed 2026-06-09

Transforms AUDT from snapshot-based governance into **continuous governance** — tracking every metric over time and alerting on governance changes automatically.

Two new tabs added to Trust Intelligence™ sub-nav (9 tabs total).

### Governance Trends™

| Feature | Detail |
|---|---|
| **Trend dashboard** | SVG sparklines for 6 metrics: Org Trust · Vendor Trust · Risk Posture · Control Health · Audit Readiness · Compliance Coverage |
| **Change indicators** | Each metric shows current score, absolute change (pts), % change, and directional arrow vs period start |
| **Time periods** | 30 · 90 · 180 · 365-day windows |
| **Score history table** | Last 30 snapshots in tabular form — all 6 metrics per date |
| **Data source** | `governance_snapshots` table (extended with `evidence_coverage_score` column) |
| **Pure sparkline** | SVG-based `<Sparkline>` component — no chart library dependency |
| **Daily snapshots** | `ensureDailySnapshot()` — idempotent, skips if today already snapshotted |

### Continuous Monitoring™

| Feature | Detail |
|---|---|
| **Monitoring Engine™** | `runMonitoringRules()` — 7 automated governance rules |
| **Alert: expired evidence** | `high` — evidence past `expires_on` date |
| **Alert: expiring evidence** | `medium` — evidence expiring within 30 days |
| **Alert: critical control** | `critical` — control health score <40 |
| **Alert: critical risk** | `critical` — open risk with inherent_score ≥20 |
| **Alert: critical finding** | `high` — unresolved critical-severity audit finding |
| **Alert: overdue CAPAs** | `medium` — CAPAs past due date |
| **Alert: vendor trust** | `high` — active vendor Trust Score™ <40 |
| **Deduplication** | `findExistingAlert()` prevents repeated open alerts for same entity+type |
| **Alert severities** | info · low · medium · high · critical |
| **Resolve alerts** | One-click resolve per alert; recently resolved section |
| **Run Monitoring** | Manual trigger button; also runs automatically via daily cron |
| **Alert counts strip** | Open · Critical · High · Resolved metric cards |

### AI Governance Monitor™

| Feature | Detail |
|---|---|
| **Weekly Summary** | Gemini 3–4 sentence governance change summary; cached 24h |
| **30-day Forecast** | AI prediction of where governance posture will be in 30 days |
| **Trend Chat** | NL chat over trend data — "What declined this month?", "What should I focus on?" |

### Infrastructure

| Item | Detail |
|---|---|
| **Cron** | `GET /api/cron/governance-snapshot` — iterates all active orgs; `ensureDailySnapshot` + `runMonitoringRules` per org |
| **REST API** | `GET /api/v1/trends/overview?days=90` · `GET /api/v1/monitoring/alerts?status=open&severity=critical` |
| **Migration** | `0013_governance_trends.sql` — `governance_alerts` table + `alert_severity`/`alert_entity_type` enums + `evidence_coverage_score` column (applied) |
| **New tables** | `governance_alerts` — org-scoped, RLS enabled, status: open/resolved/snoozed |
| **Services** | `lib/services/governance-trends/` — trends-service · monitoring-service · ai-trends-service |
| **Repo** | `lib/repositories/governance-alerts-repo.ts` |
| **Navigation** | 9-tab sub-nav: Overview · Vendor Trust · Risk Insights · Control Health · Compliance · Recommendations · Executive View · **Trends** · **Monitoring** |

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

**Sidebar:** Dashboard · Vendors · Compliance · Audits · Risks · Control Center™ · **Policy Governance™** · **DPDP Privacy™** · **Contract Governance™** · **Issue & Remediation Hub™** · **Workflow Studio™** · **Third-Party Risk Exchange™** · **Trust Network™** · **Governance Benchmarking™** · Trust Intelligence™ · Settings · Team · Notifications · Data Governance

**Settings sub-nav (9 tabs):** Profile · Organization · Team · Security · Audit Logs · Billing · API Keys · Integrations · Data Governance

**Compliance sub-nav:** Dashboard · Frameworks · Evidence · Policies · Gaps · Reports · AI Officer

**Audit sub-nav:** Dashboard · Audits · Findings · CAPAs · Reports · AI Auditor

**Risk sub-nav:** Dashboard · Risk Register · Treatments · Reports · AI Risk Officer

**Control Center sub-nav:** Dashboard · Control Library · Testing · Reports · AI Advisor

**Policy Governance sub-nav:** Overview · Library · Reviews · Attestations · AI Advisor

**Trust Intelligence sub-nav:** Overview · Vendor Trust · Risk Insights · Control Health · Compliance · Recommendations · Executive View · Trends · Monitoring · Trust Graph™

---

## 🌐 Module 15 — Third-Party Risk Exchange™

> Completed 2026-06-11

The world's first AI-native Third-Party Trust Exchange. Transforms AUDT from Governance Software into a **Trust Network** — where vendors upload evidence once and share it with many customers, eliminating repetitive questionnaire cycles and creating an auditable trust marketplace.

### Strategic Vision

Every vendor on AUDT gets a **Trust Profile™** — a public-facing trust passport. Customers browse the **Vendor Trust Directory™** to evaluate prospective vendors, request access to trust documents, and receive AI-scored trust assessments — all without sending a single spreadsheet.

### Feature Detail

| Feature | Detail |
|---|---|
| **Trust Profile™** | Public-facing governance passport per organization — display name, tagline, description, industry, company size, country, website, visibility (private/network/public), profile completeness score |
| **Evidence Exchange™** | Upload and share trust documents (SOC 2, ISO 27001, ISO 27701, PCI DSS, HIPAA, DPDP, Cyber Insurance, Pen Test, DPA, SIG, CAIQ, custom) with configurable visibility (private/specific/network/public) and expiry tracking |
| **Document Verification™** | Request AI or peer verification; documents carry a Verified badge once confirmed |
| **Trust Badges™** | Issue governance achievement badges (AUDT Verified™, DPDP Ready™, Privacy Verified™, Vendor Trusted™, Low Risk™, Enterprise Ready™, ISO Verified™, SOC2 Verified™, Custom) |
| **Questionnaire Exchange™** | Global standardized questionnaire templates; orgs fill once and share answers with visibility controls; progress tracking per questionnaire |
| **Vendor Trust Directory™** | Searchable/filterable public directory of published profiles — filter by industry, country, trust score, risk level; AI-scored trust posture for each profile |
| **AI Trust Analyst™** | Per-profile AI trust summary (cached 24h): strengths, concerns, risk profile, recommended due diligence steps |
| **AI Document Analysis™** | Per-document AI breakdown: risk level (low/medium/high/critical), key findings, specific recommendation |
| **AI Questionnaire Suggestions™** | Gemini suggests answers for each questionnaire based on your existing governance posture |
| **AI Trust Exchange Chat™** | Multi-turn NL chat — "How complete is my trust profile?", "Which documents are expiring?", "How do I compare to industry peers?" |
| **Trust Activity Feed** | Live feed of profile views, document shares, badge issuances, verification events |
| **Profile Completeness** | 0–100% completeness score — computed from 6 profile fields (displayName, tagline, description, industry, website, visibility=public) |
| **Visibility Control** | Granular visibility per document and per profile: Private · Specific Customers · Trust Network · Public |
| **REST API** | `GET /api/v1/trust-exchange` (profile + docs + badges + questionnaires) · `GET/POST /api/v1/trust-exchange/documents` · `GET /api/v1/trust-exchange/directory` |
| **Navigation** | Sidebar entry "Trust Exchange™" with Globe icon between Workflow Studio and Trust Intelligence |
| **5-tab sub-nav** | Dashboard · My Profile · Documents · Badges · Questionnaires · Directory · AI Trust Analyst |
| **DB tables** | `trust_profiles` · `trust_documents` · `trust_shares` · `trust_questionnaires` · `trust_answers` · `trust_verifications` · `trust_badges` · `trust_relationships` · `trust_activity` (migration 0020 applied) |
| **Seed data** | 1 published profile · 5 documents · 4 badges · 1 global questionnaire with 4 answers · activity log |
| **Audit logging** | `trust_exchange.profile_updated` · `trust_exchange.document_added` · `trust_exchange.document_verified` · `trust_exchange.badge_issued` · `trust_exchange.badge_revoked` |

### Trust Profile™ Completeness Scoring

| Field | Contribution |
|---|---|
| Display Name | 20% |
| Tagline | 15% |
| Description | 20% |
| Industry | 15% |
| Website | 15% |
| Visibility = public | 15% |

---

## 📍 Current Status (2026-06-11)

| Layer | Status |
|---|---|
| **Brand** | ✅ Rebranded to AUDT — landing page, page title, OpenGraph, footer all updated |
| **Domain** | ✅ audt.tech DNS configured (A + CNAME set at BigRock) — SSL provisioning in progress |
| **GitHub** | ✅ https://github.com/SandyRepo29/lekha-os — all code current |
| **Vercel** | ✅ Auto-deployed on push — live at lekha-os.vercel.app and audt.tech |
| **DB** | ✅ 117 tables, 23 migrations applied, Supabase Mumbai (ap-south-1) |
| **Module 1 — Vendor Hub™** | ✅ Complete |
| **Module 2 — Evidence Vault™** | ✅ Complete |
| **Module 3 — Settings & Org** | ✅ Complete |
| **Module 4 — Audit Management** | ✅ Complete |
| **Module 5 — Risk Lens™** | ✅ Complete |
| **Module 6 — Control Center™** | ✅ Complete (2026-06-07) |
| **Module 7 — Trust Intelligence™** | ✅ Complete (2026-06-07) |
| **Module 8 — Governance Trends™ + Monitoring™** | ✅ Complete (2026-06-09) |
| **Module 9 — Trust Graph™** | ✅ Complete (2026-06-09) |
| **Module 10 — Policy Governance™** | ✅ Complete (2026-06-09) |
| **Module 11 — DPDP Privacy™** | ✅ Complete (2026-06-10) |
| **Module 12 — Contract Governance™** | ✅ Complete (2026-06-10) |
| **Module 13 — Issue & Remediation Hub™** | ✅ Complete (2026-06-10) |
| **Module 14 — Workflow Studio™** | ✅ Complete (2026-06-10) |
| **Module 15 — Third-Party Risk Exchange™** | ✅ Complete (2026-06-11) |
| **Module 16 — Governance Benchmarking™** | ✅ Complete (2026-06-11) |
| **Module 17A — Integration Hub™** | ✅ Complete (2026-06-11) |
| **Module 18 — Trust Network™** | ✅ Complete (2026-06-11) |
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
| **Governance Trends™ + Continuous Monitoring™** | Trend sparklines, change tracking, monitoring engine, governance alerts | ✅ Complete (2026-06-09) |
| **Policy Governance™** | Full policy lifecycle, versioning, attestations, Policy Health™, AI drafting | ✅ Complete (2026-06-09) |
| **Trust Graph™** | Cross-entity knowledge graph | ✅ Complete (2026-06-09) |
| **DPDP Privacy™** | India DPDP Act 2023 — data inventory, consent, DSR, retention, PIA | ✅ Complete (2026-06-10) |
| **Contract Governance™** | Contract lifecycle, obligation tracking, AI clause intelligence, Contract Trust Score™ | ✅ Complete (2026-06-10) |
| **Issue & Remediation Hub™** | Centralized governance execution — issues, tasks, exceptions, SLAs, AI advisor | ✅ Complete (2026-06-10) |
| **Workflow Studio™** | Governance automation engine — workflows, approvals, AI generator, Automation Rate™ | ✅ Complete (2026-06-10) |
| **Third-Party Risk Exchange™** | Trust Network layer — vendor trust profiles, evidence exchange, badges, questionnaire exchange, AI trust scoring | ✅ Complete (2026-06-11) |
| **Governance Benchmarking™** | Industry peer comparison across 10 categories — percentile engine, maturity levels, AI analyst, trends | ✅ Complete (2026-06-11) |
| **Integration Hub™** | Connector Marketplace, 35+ integrations, Sync Engine, Webhook Engine, AI Integration Advisor, governance event detection | ✅ Complete (2026-06-11) |
| **Trust Network™** | Public governance infrastructure — Network Reputation™ score, Governance Maturity™, profile views, network followers, AI reputation advisor | ✅ Complete (2026-06-11) |
| **Executive Reporting & Analytics™** | Board-ready governance intelligence — 6 role dashboards, Analytics Hub, Board Reporting, Predictive Analytics, AI Executive Analyst | ✅ Complete (2026-06-12) |
| **AI Governance** | AI model risk, responsible AI frameworks | Future |
| **Governance OS** | Full category vision — system of record for organizational trust | Vision |

---

## 📋 Module 10 — Policy Governance™

> Completed 2026-06-09

Elevates policies from compliance documents into **governed organizational assets** — first-class entities with lifecycle management, ownership accountability, attestations, Policy Health™ scoring, and AI-assisted drafting.

### Policy Health™ Scoring Model

| Component | Weight | Source |
|---|---|---|
| **Review Freshness** | 30% | Days since last review (100 if ≤30d, 0 if >365d or never) |
| **Approval Status** | 20% | 100 if published/approved, 50 if review, 25 if draft, 0 if expired/retired |
| **Control Coverage** | 20% | min(linked controls × 20, 100) |
| **Attestation Completion** | 15% | % of assigned users who acknowledged |
| **Framework Mapping** | 10% | min(linked frameworks × 33, 100) |
| **Audit Findings** | 5% | 100 if no findings, 50 if 1–2, 0 if >2 |

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
| **Policy Library** | Filterable table — Policy Name · Type · Owner · Status · Version · Last Review · Next Review · Policy Health™ · Actions |
| **Policy lifecycle** | Draft → Under Review → Approved → Published → Expired / Archived / Retired |
| **Policy types** | 11 types: Information Security · Privacy · Vendor Management · Data Retention · Access Control · Acceptable Use · Business Continuity · Incident Response · HR · Finance · Custom |
| **Version management** | Every update creates a version snapshot — version number, author, change summary, approval date, effective date |
| **Review management** | Per-policy reviews: reviewer, date, outcome (Approved / Changes Required / Rejected / Expired), notes, next review date |
| **Policy Health™** | 6-component 0–100 engine — `lib/services/policy-health.ts` (pure, zero DB imports) |
| **Compute Health** | Button on detail triggers `computeAndSaveHealth()` → saves score → refreshes |
| **Employee Attestations™** | Assign policies to audiences (Everyone / Department / Role / Custom); track who acknowledged, rejected, or is overdue |
| **Attestation workflow** | Publish → Assign Audience → Notify → Track Acknowledgements → Escalate Overdue |
| **Policy-Control mapping** | Link policies to controls (policy_controls junction); shown on both Control Center™ and Policy detail |
| **Policy-Framework mapping** | Link policies to frameworks (policy_frameworks junction) |
| **Policy-Risk mapping** | Existing `risk_policies` junction — shown on Risks tab of policy detail |
| **Dashboard metrics** | Total · Published · Draft · Under Review · Overdue · Due Soon · Avg Health · Attestation Rate · Weak Policies |
| **AI Policy Draft™** | Gemini generates full policy markdown from topic + optional context |
| **AI Policy Gap Analysis™** | Identifies missing, weak, outdated, and unmapped policies org-wide |
| **AI Executive Summary™** | Board-level policy posture summary; cached 24h |
| **AI Policy Advisor Chat** | Live NL chat — "Which policies need review?", "What policies support ISO 27001?" |
| **REST API** | `GET/POST /api/v1/policies` · `GET/PUT/DELETE /api/v1/policies/[id]` · `GET/POST /api/v1/policy-attestations` · `GET /api/v1/policy-health` |
| **Continuous Monitoring integration** | 3 new rules: `policy_expired` · `policy_review_overdue` · `policy_attestation_low` |
| **Trust Graph integration** | Policy → Control + Policy → Framework edges from junction tables |

---

## 🔐 Module 11 — DPDP Privacy™

> Completed 2026-06-10

India's Digital Personal Data Protection Act 2023 compliance module. Establishes AUDT as a **Privacy Governance Platform** with a dedicated Privacy Trust Score™ and AI Privacy Officer™.

### Privacy Trust Score™ Scoring Model

| Component | Weight | Source |
|---|---|---|
| **Data Inventory Coverage** | 25% | % of assets classified by sensitivity level |
| **Consent Coverage** | 20% | Active consent ratio; penalises expired/withdrawn |
| **DSR Performance** | 15% | Completion rate; 10-pt penalty per overdue request |
| **Retention Compliance** | 15% | Assets covered by retention policies; penalises violations |
| **Privacy Risks** | 15% | Open privacy risks (−5 each); critical (−15 each) |
| **Privacy Controls** | 10% | Effective privacy controls ratio |

### Privacy Levels

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
| **Data Inventory™** | Central registry of personal data assets — category (8 types), sensitivity (Low/Medium/High/Critical), department, owner, storage location, retention period, cross-border flag, status |
| **Data asset dashboard** | Metrics: Total Assets · Sensitive Assets · Cross-Border · Unclassified · Retention Violations |
| **Consent Management™** | Consent record lifecycle — granted/withdrawn/expired/pending/rejected. Linked to data asset + subject. Source tracking. |
| **Consent metrics** | Active / Expired / Withdrawn / Pending counts with trend indicators |
| **Data Subject Requests™** | Full DSR workflow: Access · Correction · Deletion · Portability · Consent Withdrawal · Grievance |
| **DSR SLA tracking** | 30-day DPDP SLA — due_date set on assignment; overdue alerts fired automatically |
| **DSR status workflow** | Submitted → Assigned → Investigating → Completed → Closed |
| **DSR metrics** | Total / Open / Overdue / Avg Resolution Days |
| **Retention Management™** | Retention policies per data category — retention days, legal basis, action on expiry (delete/archive/review). Retention events log per asset. |
| **Privacy Impact Assessments™** | Full PIA lifecycle: Draft → In Progress → Completed → Approved → Archived. Fields: scope, purpose, data types, risks, mitigations, controls, residual risk, approval. |
| **AI PIA Generator™** | Gemini generates full PIA structure from scope + purpose input |
| **Cross Border Transfers™** | Transfer registry: destination country, recipient, transfer basis, status (pending/approved/rejected/suspended), approval workflow, review date |
| **Privacy Trust Score™** | 6-component 0–100 pure engine (`lib/services/privacy-score.ts`) — score, breakdown bars, level, strengths, concerns, recommendations |
| **PrivacyScoreWidget** | Full breakdown card with component bars, level badge, strengths/concerns |
| **AI Privacy Officer™** | Live NL chat — "Show overdue DSRs", "Which assets are high risk?", "What privacy risks need attention?" |
| **AI Privacy Summary™** | Board-level executive privacy posture summary; Gemini cached 24h |
| **AI Consent Analysis™** | Detects missing/expired consent issues with severity |
| **Privacy badges** | `SensitivityBadge` · `ConsentStatusBadge` · `PrivacyRequestStatusBadge` · `PrivacyRequestTypeBadge` · `TransferStatusBadge` · `AssessmentStatusBadge` |
| **REST API** | `GET/POST /api/v1/privacy/assets` · `GET/POST /api/v1/privacy/consents` · `GET/POST /api/v1/privacy/requests` · `GET/POST /api/v1/privacy/assessments` · `GET /api/v1/privacy/trust-score` |
| **Monitoring integration** | 3 new rules: `consent_expired` · `dsr_overdue` · `cross_border_unapproved` |
| **Navigation** | Sidebar entry "DPDP Privacy™" with Shield icon; 8 sub-pages: Dashboard · Inventory · Consents · Requests · Retention · Assessments · Transfers · AI Officer |
| **DB tables** | `data_assets` · `consent_records` · `privacy_requests` · `retention_policies` · `retention_events` · `privacy_assessments` · `data_transfers` · `privacy_trust_scores` (migration 0016 applied) |
| **Audit logging** | `privacy.asset_created` · `privacy.request_created` · `privacy.request_completed` · `privacy.consent_updated` · `privacy.assessment_completed` · `privacy.score_recalculated` |
| **Navigation** | 5-tab sub-nav: Overview · Library · Reviews · Attestations · AI Advisor |
| **Schema** | `policies` extended (8 new cols incl. owner_id, health_score, attestation_required, audience); 4 new tables: `policy_reviews`, `policy_attestations`, `policy_controls`, `policy_frameworks`; `policyStatus` enum + `published` + `retired` |
| **Migration** | `supabase/migrations/0015_policy_governance.sql` ✅ Applied |

---

## 📄 Module 12 — Contract Governance™

> Completed 2026-06-10

Elevates contracts into first-class governed assets — with a dedicated Contract Trust Score™, AI clause intelligence, obligation lifecycle tracking, renewal management, and deep integration with vendors, risks, policies, and controls.

### Contract Trust Score™ Scoring Model

| Component | Weight | Source |
|---|---|---|
| **Clause Coverage** | 25% | Clauses present vs 12 expected standard categories |
| **Obligation Completion** | 20% | Completed / active (non-waived) obligations |
| **Renewal Readiness** | 15% | Days until expiry — 100 if >90 days, decays to 0; +20 if auto-renewal |
| **Risk Exposure** | 20% | Inverted critical-clause ratio — 100 if no critical clauses |
| **Policy Alignment** | 10% | Linked policies count / 3, capped at 100 |
| **Privacy Compliance** | 10% | DPA clause present or contract type is DPA → 100 |

### Trust Levels

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
| **Contract Repository™** | Centralised library — 9 contract types (Vendor Agreement, MSA, SOW, NDA, DPA, Employment, Partner, Procurement, Custom), 9 statuses, value + currency, owner, storage path |
| **Contract dashboard** | Metrics: Active · Expiring (≤90 days) · Expired · Renewals Due · Total Contract Value · Active Contract Value |
| **Contract detail** | 9 tabs: Overview · Clauses · Obligations · Risks · Policies · Controls · Vendor · AI Analysis · Activity |
| **Clause Intelligence™** | Per-contract clause registry — category (Privacy/Security/Financial/Operational/Legal/Compliance/Termination/Renewal/Custom), risk level (Low/Medium/High/Critical), AI analysis, missing-clause flag |
| **Obligation Management™** | Per-contract obligations with owner, due date, status (Open/In Progress/Completed/Overdue/Waived), risk level, completion notes |
| **Org-wide obligation tracker** | Cross-contract obligations at `/contract-governance/obligations` — filterable by status, due-date highlighting for overdue and due-soon |
| **Renewals dashboard** | `/contract-governance/renewals` — contracts sorted by expiry_date with notice-period countdown badges |
| **Contract Trust Score™** | Pure engine `lib/services/contract-score.ts` — 6 components, per-contract score 0–100, strengths/concerns/recommendations |
| **AI Contract Extraction™** | Gemini extracts parties, dates, clauses, obligations, risks from contract text — populates library automatically |
| **AI Clause Analysis™** | Per-clause AI breakdown: purpose, risk, impact, specific recommendations |
| **AI Obligation Generator™** | Generates obligation suggestions automatically from linked clauses |
| **AI Risk Assessment™** | Identifies high-risk clauses, missing protections, renewal risks, DPDP/privacy gaps |
| **AI Executive Summary™** | Board-level contract posture summary; Gemini cached 24h |
| **AI Contract Advisor™** | Live NL chat — "Which contracts expire next quarter?", "Show risky contracts", "Which contracts lack DPDP protections?" |
| **Risk integration** | Link contracts to risks (`contract_risks` junction) — shown on both contract detail and risk detail |
| **Control integration** | Link contracts to controls (`contract_controls` junction) |
| **Policy integration** | Link contracts to policies (`contract_policies` junction) |
| **Vendor integration** | Contracts linked to vendors via `vendor_id`; vendor card on contract detail |
| **Monitoring rules** | 3 new rules: `contract_expiring` (30 days) · `contract_renewal_due` (30 days) · `contract_obligations_overdue` |
| **Trust Graph integration** | Contract nodes with 4 edge types: contract→vendor · contract→risk · contract→policy · contract→control |
| **REST API** | `GET/POST /api/v1/contracts` · `GET/PUT/DELETE /api/v1/contracts/[id]` · `GET /api/v1/contracts/obligations` |
| **Audit logging** | `contract.created` · `contract.updated` · `contract.deleted` · `contract.clause_added` · `contract.obligation_created` · `contract.obligation_completed` · `contract.score_recalculated` |
| **Navigation** | 7-page sub-nav: Dashboard · Library · Obligations · Renewals · AI Advisor · Reports · [id] detail |
| **DB tables** | `contracts` · `contract_clauses` · `contract_obligations` · `contract_risks` · `contract_controls` · `contract_policies` (migration 0017 applied) |

---

## 🎯 Module 13 — Issue & Remediation Hub™

> Completed 2026-06-10

The Governance Execution Layer. Transforms AUDT from a platform that *identifies* governance problems into one that *tracks, assigns, remediates, and closes* them. Every module can create issues; every issue has ownership, SLA, tasks, exceptions, and escalation paths.

### Issue Lifecycle

`Open → Assigned → In Progress → Blocked → Pending Review → Resolved → Closed`
(or: `Accepted Risk` / `Deferred`)

### SLA by Severity (auto-assigned)

| Severity | SLA |
|---|---|
| Critical | 7 days |
| High | 14 days |
| Medium | 30 days |
| Low / Informational | 90 days |

### Feature Detail

| Feature | Detail |
|---|---|
| **Issue Registry™** | Central repository for all governance issues from any module — Risk · Audit Finding · CAPA · Control Failure · Policy Gap · Privacy Issue · Vendor Issue · Contract Obligation · Compliance Gap · Security Incident · Custom |
| **Issue dashboard** | Metrics: Open · Critical · Overdue · Blocked · Resolved This Month · Avg Resolution Days · SLA Compliance % · top open issues |
| **Issue detail** | 7 tabs: Overview · Tasks · Comments · Exceptions · Escalations · History · AI Analysis |
| **Task Management™** | Per-issue task tracking — title, owner, status (Open/In Progress/Blocked/Completed/Cancelled), due date, completion notes |
| **Org-wide task tracker** | `/issue-hub/tasks` — cross-issue task list with overdue / due-soon highlighting |
| **Exception Management™** | Request governance exceptions per issue — business justification, expiry date, review date; approve or reject with reason |
| **Escalation Engine™** | Escalate to: Owner · Manager · Department Head · Executive · Board |
| **SLA Tracking™** | Auto-SLA set by severity; `markSlaBreaches()` runs on dashboard load; `sla_breached` flag tracked per issue |
| **Issue History** | Field-level change log — status, severity, priority, assignee tracked with old/new values and actor |
| **Comments** | Threaded comments per issue with author and timestamp |
| **AI Issue Generator™** | Paste observation → Gemini returns structured issue: title, severity, priority, type, description, recommended actions (JSON) |
| **AI Remediation Planner™** | Per-issue → Gemini returns 3–5 remediation tasks with owner role, description, and days-to-complete |
| **AI Issue Narrative** | Per-issue Gemini narrative: root cause hypothesis, business impact, urgency, recommended next action; cached 24h |
| **AI Executive Summary™** | Board-level issue posture summary: governance execution health, risk areas, resolution progress, priority recommendation; cached 24h |
| **AI Advisor Chat** | Live NL chat — "Show critical issues", "What's overdue?", "Which issues affect our Trust Score?" |
| **Monitoring integration** | 3 new monitoring rules: `issue_overdue` · `issue_critical_open` · `issue_sla_breach` |
| **REST API** | `GET/POST /api/v1/issues` · `GET/PUT/DELETE /api/v1/issues/[id]` · `GET /api/v1/issues/export/csv` |
| **CSV export** | Issues export with all fields at `/issue-hub/reports` |
| **Audit logging** | `issue.created` · `issue.updated` · `issue.closed` · `issue.escalated` · `issue.exception_created` · `issue.exception_approved` |
| **Navigation** | Sidebar entry "Issue & Remediation Hub" with Target icon between Contract Governance and Trust Intelligence |
| **6-tab sub-nav** | Dashboard · Issue Registry™ · Tasks · Exceptions™ · Reports · AI Advisor™ |
| **DB tables** | `issues` · `issue_tasks` · `issue_comments` · `issue_exceptions` · `issue_escalations` · `issue_history` (migration 0018 applied) |

---

## ⚙️ Module 14 — Workflow Studio™

> Completed 2026-06-10

The Governance Automation Engine. Transforms AUDT from a platform that *monitors* governance into one that *orchestrates* it — configurable workflows, approval chains, SLA automation, and an AI generator that converts natural language into executable governance processes.

### Feature Detail

| Feature | Detail |
|---|---|
| **Workflow Library** | Registry of all workflows — name, module, trigger type, status (draft/active/archived/deprecated), run count, active run count |
| **Workflow Builder** | Create/edit workflows with module association, trigger type, description, and structured node definition |
| **Workflow Nodes** | 11 node types: Start · Task · Approval · Condition · Decision · Wait · Notification · Webhook · Create Record · Update Record · End |
| **Workflow Triggers™** | 8 trigger types: Manual · Record Created · Record Updated · Status Changed · Date Reached · Score Threshold · API Event · Scheduled |
| **Workflow Templates™** | 17 pre-built governance templates across 7 categories: Vendor Governance · Risk Management · Policy Governance · Privacy & DPDP · Contract Governance · Issue Remediation · Audit Management |
| **Workflow Runs™** | Full execution tracking — running/waiting/approved/rejected/failed/completed/cancelled · trigger type · started by · timestamps |
| **Approvals™** | Inline approve/reject pending approvals; full approval history table; due date tracking |
| **Automation Rate™** | Dashboard metric: completed runs / total runs — tracks governance automation adoption |
| **AI Workflow Generator™** | Paste NL description → Gemini returns structured workflow definition with name, module, trigger, and ordered nodes |
| **AI Bottleneck Analysis** | Analyzes failed runs and pending approvals to identify throughput bottlenecks |
| **AI Executive Summary™** | Board-level automation posture summary; Gemini cached 24h |
| **Governance Automation Copilot™** | Live NL chat — "Which workflows fail most?", "How can we improve throughput?", "What approvals are pending?" |
| **REST API** | `GET/POST /api/v1/workflows` · `GET/PUT/DELETE /api/v1/workflows/[id]` · `GET /api/v1/workflow-runs` |
| **Audit logging** | `workflow.created` · `workflow.updated` · `workflow.published` · `workflow.executed` · `workflow.approved` · `workflow.rejected` · `workflow.deleted` |
| **Navigation** | Sidebar entry "Workflow Studio™" with GitBranch icon between Issue & Remediation Hub and Trust Intelligence |
| **Sub-pages** | Dashboard · Library · New · \[id\] detail · \[id\]/edit · Runs · Approvals · Templates · AI Advisor · Reports |
| **DB tables** | `workflows` · `workflow_nodes` · `workflow_transitions` · `workflow_runs` · `workflow_run_steps` · `workflow_approvals` (migration 0019 applied) |
| **Supported modules** | Vendor Hub™ · Evidence Vault™ · Audit Management · Risk Lens™ · Control Center™ · Policy Governance™ · DPDP Privacy™ · Contract Governance™ · Issue Hub™ · Trust Intelligence™ · Custom |

### Workflow Run Statuses

| Status | Meaning |
|---|---|
| running | Actively executing steps |
| waiting | Paused at an approval or condition node |
| approved | Approval granted — continuing execution |
| rejected | Approval rejected — workflow halted |
| completed | All steps finished successfully |
| failed | Execution error encountered |
| cancelled | Manually cancelled by a user |

---

## 📊 Module 19 — Executive Reporting & Analytics™

> Completed 2026-06-12

The executive decision layer of the AUDT Governance OS. Transforms governance data from all 18 prior modules into board-ready intelligence, predictive analytics, and AI-powered decision support.

### Executive Dashboards™

| Dashboard | Audience | KPIs shown |
|---|---|---|
| **CEO Dashboard™** | Chief Executive | Org Trust Score™, Open Risks, Active Vendors, Monitoring Alerts, Open Issues |
| **CRO Dashboard™** | Chief Risk Officer | Open Risks, Open Findings, Open CAPAs, Monitoring Alerts, Control Health |
| **CISO Dashboard™** | Chief Information Security Officer | Control Health™, Open Findings, Monitoring Alerts, Compliance Frameworks, Open CAPAs |
| **Compliance Dashboard™** | Compliance Manager | Compliance Frameworks, Open Findings, Open CAPAs, Control Health™, Open Issues |
| **Board Dashboard™** | Board of Directors | Org Trust Score™, Open Risks, Control Health™, Frameworks, Active Vendors |
| **Custom Dashboard™** | Any role | All 10 KPIs in a full governance table |

### KPI Framework™ (10 live KPIs)

Trust Score™ · Active Vendors · Open Risks · Control Health™ · Open Findings · Open CAPAs · Compliance Frameworks · Monitoring Alerts · Open Issues · Active Contracts

Each KPI tracks current value, previous value, target value, trend direction (up/down/stable), and period.

### Analytics Hub™

- Cross-module analytics grouped into 6 categories: Trust, Risk, Vendor, Control, Issue, Contract
- Category cards with live progress bars and values
- 90-day KPI snapshot history table
- Snapshot data written daily (or on-demand via `takeSnapshotAction`)

### Board Reporting™

8 pre-built report types:
- Board Governance Report · Risk Committee Report · Audit Committee Report · Privacy Governance Report
- Vendor Governance Report · Contract Governance Report · Executive Governance Report · Trust Intelligence Report

One-click generation captures a KPI snapshot into `content_snapshot` (JSON). Reports logged to `analytics_reports` table with status lifecycle (draft → ready).

### Scheduled Reports™

Create recurring delivery schedules with: name, report type, frequency (daily/weekly/monthly/quarterly/annually), delivery method (email), recipient list. Pause/resume per schedule.

### Predictive Analytics™

AI Forecast Engine™ generates 30/90/180-day forecasts for:
- Org Trust Score™ · Control Health™ · Open Risks

Each forecast includes: current value, forecast value, confidence score (%), and horizon in days. Forecasts expire after 24h and regenerate on demand.

### Executive Scorecards™

6 domain scorecards with On Track / Monitor / Attention status:
- Trust Scorecard™ · Risk Scorecard™ · Control Scorecard™ · Vendor Scorecard™ · Contract Scorecard™ · Governance Scorecard™

Each scorecard compares current KPI values against governance targets with colour-coded status indicators.

### AI Executive Analyst™

| Feature | Detail |
|---|---|
| **AI Executive Summary™** | 3-4 sentence Gemini governance summary, cached 24h in `ai_compliance_insights` |
| **AI Board Report Generator™** | Structured board report narrative with metrics, risk highlights, recommendations |
| **AI Trend Analyst™** | 3 emerging trends + 2 positives + 1 strategic attention area |
| **Governance Copilot™ Chat** | Live NL Q&A — "What changed this month?", "Which risks are critical?" |
| **Suggestion prompts** | 4 pre-built executive questions for quick governance insight |

### Database (migration 0024)

9 new tables: `analytics_dashboards` · `analytics_widgets` · `analytics_reports` · `analytics_schedules` · `analytics_snapshots` · `analytics_exports` · `analytics_forecasts` · `analytics_subscriptions` · `analytics_kpis`. All with RLS using `is_org_member(org_id)`.

### Seed Data (`seed-executive-reporting.mjs`)

- 10 KPIs with current/previous/target values and trend direction
- 5 daily KPI snapshots (rolling 5-day history)
- 3 generated reports (Board Governance Q2 2026, Risk Committee June 2026, Executive Governance)
- 2 active schedules (Monthly Board Pack, Weekly Risk Briefing)
- 9 forecasts (3 metrics × 3 horizons: 30/90/180 days)

### Routes

| Route | Content |
|---|---|
| `/executive-reporting` | Main hub — KPI strip, dashboard selector, module nav, recent reports |
| `/executive-reporting/dashboard/[type]` | Role-specific dashboard (CEO/CRO/CISO/compliance/board/custom) |
| `/executive-reporting/analytics` | Analytics Hub™ — cross-module KPIs by category + snapshot history |
| `/executive-reporting/board-reports` | 8 report types + generated reports history |
| `/executive-reporting/scheduled` | Schedule management with create modal |
| `/executive-reporting/forecasts` | Predictive Analytics™ — horizon cards with confidence bars |
| `/executive-reporting/scorecards` | 6 Executive Scorecards™ with status indicators |
| `/executive-reporting/ai` | AI Executive Analyst™ — summary + feature cards + Copilot chat |
| `GET /api/v1/analytics` | REST — `?view=overview|kpis|reports` (Bearer auth) |

### Navigation

Sidebar "Executive Reporting™" (LineChart icon) added after Trust Intelligence™.

---

## 🌐 Module 18 — Trust Network™

> Completed 2026-06-11

The Public Governance Infrastructure Layer. Aggregates signals from Vendor Hub™, Trust Exchange™, Governance Benchmarking™, Trust Intelligence™, Integration Hub™, and Trust Graph™ into a single **Network Reputation™** score. Transforms AUDT from an internal governance platform into a public trust infrastructure that organizations use to signal governance maturity to the market.

### Trust Network Reputation™ Scoring Model

| Component | Weight | Source |
|---|---|---|
| **Profile Quality** | 25% | Trust Exchange™ profile completeness + document count + badges |
| **Benchmark Percentile** | 20% | Governance Benchmarking™ industry percentile |
| **Integration Automation** | 20% | Integration Hub™ connected systems count + sync frequency |
| **Org Trust Score** | 20% | Trust Intelligence™ Organizational Trust Score™ |
| **Network Activity** | 15% | Profile views (30d) + followers + trust relationships |

### Governance Maturity Levels™

| Level | Label | Percentile |
|---|---|---|
| 1 | Reactive | < 40th |
| 2 | Managed | 40th–59th |
| 3 | Defined | 60th–74th |
| 4 | Measured | 75th–89th |
| 5 | Optimized | 90th–98th |
| 6 | Trust Leader | ≥ 99th |

### Reputation Levels

| Range | Level |
|---|---|
| 90–100 | Trust Leader |
| 80–89 | Highly Trusted |
| 65–79 | Trusted |
| 45–64 | Developing |
| 25–44 | Emerging |
| 0–24 | Getting Started |

### Feature Detail

| Feature | Detail |
|---|---|
| **Dashboard** | Network Reputation™ score ring · 6 metrics (profile views, followers, documents, badges, relationships, automation %) · 3 pillar cards (Governance Maturity, Industry Ranking, Automation Transparency) · Trust Network activity feed |
| **Network Reputation™** | 5-component 0–100 pure engine (`trust-network-service.ts`) · level label · aggregated from 5 existing module data sources |
| **Public Trust Profile 2.0** | Reputation ring + profile completeness + Vendor Trust™, Privacy Trust™, Governance Maturity™, Benchmark Position™ signal cards · Automation Transparency™ panel (integration count, synced records, evidence collected) |
| **Network Directory** | Browse published profiles across the trust network — filter by industry, country; completeness badge for ≥80% complete profiles |
| **Trust Relationships™** | View active trust relationships by type (customer/vendor/partner/processor/auditor/consultant) with status and date |
| **Network Activity Feed** | Chronological timeline of trust milestones — document verifications, badge issuances, relationship events, profile updates |
| **Profile Views™** | 30-day rolling view count tracked in `network_profile_views` table — anonymous and authenticated viewers |
| **Trust Reach™** | Follower count + relationship count as network reach metric |
| **Industry Rank™** | Benchmark percentile position surfaced as a dashboard metric |
| **Automation Transparency™** | Public display of integration automation depth — systems connected, records synced, evidence auto-collected |
| **AI Network Advisor™** | Gemini board-ready governance reputation summary (cached 24h) · 4 Network Improvement Plan™ recommendations · NL chat |
| **AI Network Summary™** | Board-ready summary: market-facing trust posture, key strengths, improvement opportunities |
| **REST API** | `GET /api/v1/trust-network` — dashboard (?view=directory\|relationships) |
| **Navigation** | Sidebar "Trust Network™" with Network icon between Trust Exchange™ and Governance Benchmarking™ |
| **Sub-pages** | Dashboard · Public Profile · Network Directory · Relationships · Activity Feed · AI Advisor |
| **DB tables** | `network_profile_views` · `network_followers` (migration 0023 applied) |
| **Seed data** | 47 profile views (30-day window) · 12 trust activity milestones · 1 network follower |

---

## 📊 Module 16 — Governance Benchmarking™

> Completed 2026-06-11

Transforms AUDT from a **Governance Measurement** platform into a **Governance Intelligence Platform** by answering the question every customer asks: *"Is that good?"* — comparing governance posture against industry peers, sizing up percentile rankings, and delivering AI-generated competitive intelligence.

### Feature Detail

| Feature | Detail |
|---|---|
| **Benchmark Scorecards™** | 10 categories: Org Trust · Vendor Trust · Risk Posture · Control Health · Audit Readiness · Compliance Coverage · Privacy Trust · Contract Trust · Issue Resolution · Workflow Automation |
| **Percentile Engine™** | Normal-distribution CDF percentile vs industry baseline — 10th → 99th percentile with confidence |
| **Industry Baselines™** | Seeded for Technology, Financial Services, Healthcare, Manufacturing, Professional Services, All — 2,000+ peer data points; works immediately without network scale |
| **Governance Rankings™** | 8 labels: Top 1% · Top 5% · Top 10% · Top Quartile · Above Average · Average · Below Average · At Risk |
| **Governance Maturity Model™** | 6 levels: Reactive → Managed → Defined → Measured → Optimized → Trust Leader; visual progress bar |
| **Benchmark Trends™** | 6-month monthly sparkline trend per category with historical percentile tracking |
| **Top Strengths™** | Categories where org outperforms industry average — ranked by delta |
| **Improvement Opportunities™** | Categories below industry average — ranked by gap size |
| **AI Benchmark Report™** | Board-ready 3-paragraph executive report — position, strengths, improvement areas; Gemini cached 24h |
| **AI Industry Insights™** | Industry-specific governance trends, what top performers do, emerging risks — Gemini cached 24h |
| **AI Improvement Planner™** | Highest-ROI improvement actions per weak category with impact/effort ratings |
| **AI Benchmark Analyst™ Chat** | NL chat — "How do we compare?", "What should we improve first?", "How do we reach the top quartile?" |
| **REST API** | `GET /api/v1/benchmarking` · `/trust` · `/vendors` · `POST /vendors` (trigger benchmark) · `/rankings` |
| **Navigation** | Sidebar "Governance Benchmarking™" with BarChart3 icon between Trust Exchange™ and Trust Intelligence |
| **Sub-pages** | Dashboard · Vendor Trust · Risk & Controls · Compliance · Rankings · AI Analyst |
| **DB tables** | `benchmark_industries` · `benchmark_snapshots` · `benchmark_scores` · `benchmark_trends` (migration 0021 applied) |
| **Seed** | `node scripts/seed-benchmarking.mjs` — snapshot + 10 category scores + 6-month trends |

### Benchmark Categories

| Category | What It Measures |
|---|---|
| Organizational Trust™ | Overall governance trust score vs peers |
| Vendor Trust™ | Vendor assessment coverage, trust scores, evidence quality |
| Risk Posture™ | Open risk profile, critical/high counts, mitigation rate |
| Control Health™ | Average control health, testing coverage, weakness count |
| Audit Readiness™ | Audit completion, finding closure rate, CAPA completion |
| Compliance Coverage™ | Framework readiness, evidence coverage, gap density |
| Privacy Trust™ | Privacy score, DSR resolution, consent coverage |
| Contract Trust™ | Contract score, obligation completion, renewal readiness |
| Issue Resolution™ | Issue closure rate, SLA compliance, escalation frequency |
| Workflow Automation™ | Automation rate, workflow completion, approval cycle time |

### Governance Maturity Model™

| Level | Label | Percentile |
|---|---|---|
| 1 | Reactive | < 40th |
| 2 | Managed | 40th–59th |
| 3 | Defined | 60th–74th |
| 4 | Measured | 75th–89th |
| 5 | Optimized | 90th–98th |
| 6 | Trust Leader | ≥ 99th |

---

## 🔌 Module 17A — Integration Hub™

> Completed 2026-06-11

The connectivity layer for the AUDT Governance OS — turns integrations into a continuous governance evidence stream. Connects 35+ enterprise tools across 11 categories, syncs data automatically, and surfaces governance events in real time.

| Feature | Detail |
|---|---|
| **Connector Marketplace™** | 35+ connectors across 11 categories: Identity, Cloud, Source Control, ITSM, Project Management, Endpoint, Security, Communication, Storage, HR Systems, Custom |
| **Phase 1 Connectors (9)** | Microsoft Entra ID · Okta · Google Workspace · AWS · GitHub · Jira · Slack · CrowdStrike · Microsoft Defender — fully functional with realistic simulated data |
| **Integration Manager™** | Per-connection stats: records synced, evidence collected, risks generated, open events, last sync time; Disconnect; Trigger Sync |
| **Sync Engine™** | Per-connector sync simulation with realistic data volumes; sync frequency options (real-time / 15min / hourly / daily / weekly / manual); sync history log with status chips |
| **Webhook Engine™** | Inbound and outbound webhooks; event routing to governance modules |
| **Governance Events™** | Integration-sourced events surfaced as governance alerts (critical/high/medium/low); resolve events inline |
| **Auto Evidence Collection™** | Syncs automatically feed evidence into Evidence Vault™ |
| **Auto Risk Detection™** | Integration signals generate risks in Risk Lens™ |
| **AI Integration Advisor™** | Executive summary (cached 24h) · Connector Recommendations™ (top 3–5 unconnected high-value integrations) · Coverage Gap Analysis™ (compliance blind spots from missing categories) · NL chat |
| **Dashboard** | Metrics: connected / error / open events / evidence / risks; Phase 1 getting-started checklist when no integrations connected |
| **REST API** | `GET /api/v1/integrations` (connections + marketplace + dashboard views) · `GET /api/v1/integrations/health` · `GET /api/v1/integrations/syncs` |
| **Navigation** | Sidebar "Integration Hub™" with Plug icon |
| **Sub-pages** | Dashboard · Marketplace · Connections (Integration Manager) · Syncs · Webhooks · Events · AI Advisor |
| **DB tables** | `integration_registry` · `integration_instances` · `integration_credentials` · `integration_syncs` · `integration_logs` · `integration_events` · `integration_mappings` · `integration_webhooks` (migration 0022 applied) |
| **Seed** | `node scripts/seed-integration-hub.mjs` — 5 connections + 4 open governance events |

### Connector Categories

| Category | Example Connectors |
|---|---|
| Identity & Access | Microsoft Entra ID · Okta · Google Workspace · Ping Identity · OneLogin |
| Cloud Infrastructure | AWS · Azure · Google Cloud · Terraform Cloud |
| Source Control | GitHub · GitLab · Bitbucket · Azure DevOps |
| Project Management | Jira · Asana · Linear · Monday.com |
| ITSM | ServiceNow · Freshservice · Zendesk |
| Endpoint Management | CrowdStrike · Microsoft Defender · SentinelOne · Carbon Black |
| Security | Qualys · Tenable · Wiz · Snyk |
| Communication | Slack · Microsoft Teams · Google Chat |
| Storage | AWS S3 · Azure Blob · Google Drive · SharePoint |
| HR Systems | Workday · BambooHR · Darwinbox |
| Custom | Webhook · REST API |

---

## Module 20 — AI Governance™ ✅ Complete (2026-06-12)

Central AI governance platform — AI inventory, risk register, controls, vendor governance, compliance frameworks, incidents, trust scores, and AI copilot.

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
