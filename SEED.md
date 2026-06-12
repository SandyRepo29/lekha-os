# AUDT — Demo Seed Data Reference

> Complete inventory of all demo seed data across every module.
> All scripts target the **"admin corp"** workspace (owner: `admin@audt.tech`).
> Every script is idempotent — safe to re-run.

---

## Quick Start — Full Demo (all modules)

Run in this exact order on a fresh DB after migrations:

```bash
# 1. Apply all migrations
npm run db:migrate

# 2. Apply RLS + storage policies
node scripts/apply-sql.mjs supabase/rls.sql
node scripts/apply-sql.mjs supabase/storage.sql
node scripts/apply-sql.mjs supabase/rls-risk-lens.sql
node scripts/apply-sql.mjs supabase/migrations/0010_trust_score.sql
node scripts/apply-sql.mjs supabase/migrations/0011_control_center.sql
node scripts/apply-sql.mjs supabase/migrations/0012_trust_intelligence.sql
node scripts/apply-sql.mjs supabase/migrations/0013_governance_trends.sql
node scripts/apply-sql.mjs supabase/migrations/0015_policy_governance.sql
node scripts/apply-sql.mjs supabase/migrations/0016_dpdp_privacy.sql
node scripts/apply-sql.mjs supabase/migrations/0017_contract_governance.sql
node scripts/apply-sql.mjs supabase/migrations/0018_issue_remediation.sql
node scripts/apply-sql.mjs supabase/migrations/0019_workflow_studio.sql
node scripts/apply-sql.mjs supabase/migrations/0020_trust_exchange.sql
node scripts/apply-sql.mjs supabase/migrations/0021_benchmarking.sql
node scripts/apply-sql.mjs supabase/migrations/0022_integration_hub.sql
node scripts/apply-sql.mjs supabase/migrations/0023_trust_network.sql

# 3. Seed platform defaults
node scripts/seed-templates.mjs
node scripts/seed-billing-plans.mjs --assign-all

# 4. Seed Vendor Hub™ (Module 1)
node scripts/seed-demo.mjs

# 5. Seed Evidence Vault™ (Module 2)
node scripts/seed-compliance-frameworks.mjs
node scripts/seed-compliance-demo.mjs

# 6. Seed Settings / Data Governance
node scripts/seed-data-governance.mjs

# 7. Seed Risk Lens™ (Module 5)
node scripts/seed-risk-lens.mjs

# 8. Seed Trust Score™
node scripts/seed-trust-scores.mjs

# 9. Seed Audit Management (Module 4) — 5 audits across all states
node scripts/seed-audits.mjs

# 10. Seed Control Center™ test records + health scores (Module 6)
node scripts/seed-control-tests.mjs

# 11. Seed Trust Intelligence™ governance trend history (Module 7)
node scripts/seed-governance-snapshots.mjs

# 12. Seed Vendor extras — assessments for remaining vendors + reviews + doc requests
node scripts/seed-vendor-extras.mjs

# 13. Seed Vendor Portal tokens for E2E testing
node scripts/seed-portal-tokens.mjs

# 14. Seed Third-Party Risk Exchange™ (Module 15)
node scripts/seed-trust-exchange.mjs

# 15. Seed Governance Benchmarking™ (Module 16)
node scripts/seed-benchmarking.mjs

# 16. Seed Integration Hub™ (Module 17A)
node scripts/seed-integration-hub.mjs

# 17. Seed Trust Network™ (Module 18)
node scripts/seed-trust-network.mjs
```

After this, **every module has complete demo data**. **Trust Network™** is live at `/trust-network` with Network Reputation™ score, 47 profile views, 12 activity milestones, and an AI Network Advisor. **Integration Hub™** is live at `/integration-hub` with 5 connected integrations (Microsoft Entra ID, AWS, GitHub, CrowdStrike, Slack) and 4 open governance events. **Governance Benchmarking™** is live at `/benchmarking` with industry peer comparison across 10 categories. **Trust Intelligence™** shows a meaningful Organizational Trust Score™ with 14-day trend history. **Third-Party Risk Exchange™** is live at `/trust-exchange` — view the Trust Profile, explore documents and badges, and browse the Vendor Trust Directory. **Policy Governance™** is available at `/policy-governance` — use the Library to create policies and the AI Advisor to draft new ones. The **Monitoring™** tab will populate with alerts once `runMonitoringRules` runs (click "Run Monitoring" in the UI or wait for the daily cron). Visit `/trust-intelligence` to see the live score, `/trust-intelligence/trends` for the trend chart, and `/trust-intelligence/monitoring` for alerts. **DPDP Privacy™** is live at `/dpdp-privacy` — use the Data Inventory to register personal data assets, manage DSRs, and track consent. **Contract Governance™** is live at `/contract-governance` — use the Library to add contracts, extract clauses via AI, track obligations, and monitor renewals. **Issue & Remediation Hub™** is live at `/issue-hub` — create governance issues from any source module, assign tasks, track SLAs, manage exceptions, and use the AI Issue Generator to convert observations into structured issues. **Workflow Studio™** is live at `/workflow-studio` — create governance automation workflows, use the 17 pre-built templates, start workflow runs, manage approvals, and use the AI Workflow Generator to build workflows from natural language.

---

## Module Test Checklist — End-to-End

Use this to verify every module after seeding.

### Module 1 — Vendor Hub™

| Test | Where | Expected |
|---|---|---|
| View vendor list | `/vendors` | 15 vendors — mix of active, varied risk levels |
| Open vendor detail | `/vendors/[id]` | 4 tabs: Documents, Compliance, Risk, Reviews |
| View Trust Score widget | Vendor detail → Trust Score tab | Score 0–100 with breakdown bars |
| Check expiring docs | `/vendors` → `?expiring=1` | Razorpay (Cyber Ins), TCS (Prof Indem), Darwinbox (DPA), Freshworks (DPA) |
| Check high-risk vendors | `/vendors?risk=high` | Yotta, Sify |
| NL search | `/vendors` → search box | Type "vendors with expired certificates" → filter applied |
| Vendor portal | `/portal/[token]` | Magic link page — no auth required |
| Export vendors | `/vendors/export` | CSV download |
| Executive PDF | `/vendors/[id]/executive-report` | PDF renders |
| Audit package PDF | `/vendors/[id]/audit-package` | PDF renders |

---

### Module 2 — Evidence Vault™

| Test | Where | Expected |
|---|---|---|
| View compliance dashboard | `/compliance` | 5 frameworks, readiness scores, gap counts |
| Open ISO 27001 framework | `/compliance/frameworks/[id]` | Readiness ~55%, controls list, AI summary panel |
| View evidence | `/compliance/evidence` | ~80 items (vendor docs + manual) |
| View policies | `/compliance/policies` | 8 policies — mix of approved/draft/expired |
| View gaps | `/compliance/gaps` | ~107 open gaps |
| AI Officer chat | `/compliance/ai` | Ask "What are my biggest compliance gaps?" |
| Framework PDF | `/reports/compliance/framework/[id]` | PDF with readiness breakdown |
| Executive compliance PDF | `/reports/compliance/executive` | AI-narrated multi-framework report |
| Controls CSV | `/reports/compliance/controls` | CSV download |

---

### Module 3 — Settings

| Test | Where | Expected |
|---|---|---|
| Profile | `/settings` | Name, job title, notification prefs |
| Org branding | `/settings/organization` | Primary colour #6366f1 set |
| Team | `/settings/team` | 1 owner member |
| Audit logs | `/settings/audit-logs` | ~30+ logged events from seed scripts |
| Billing | `/settings/billing` | Starter plan, usage meters |
| API keys | `/settings/api-keys` | Create a key — shown once |
| Integrations | `/settings/integrations` | 10 provider cards |
| Data governance | `/settings/data-governance` | Stats, residency badge, export ZIP |

---

### Module 4 — Audit Management

> **`seed-audits.mjs`** seeds 5 audits across all lifecycle states with 14 findings and 9 CAPAs.

| Test | Where | Expected |
|---|---|---|
| View audit dashboard | `/audits` | 5 audits: 2 completed, 2 in_progress, 1 planned |
| View completed ISO audit | Audit list → "Annual ISO 27001 Internal Audit 2026" | Status: Completed, AI summary present |
| View findings | `/audits/findings` | 14 findings — critical/high/medium/low — all severities |
| View CAPAs | `/audits/capas` | 9 CAPAs — open/in_progress/completed — overdue highlighted |
| Open critical finding | Findings list → "Privileged Access Management..." | Severity: Critical, status: remediating, 2 CAPAs linked |
| View completed CAPA | CAPA list → "Conduct ransomware tabletop exercise" | Status: completed, completion notes present |
| Add audit finding | `/audits/[id]/findings/new` | Fill in severity Critical, title, description |
| AI Finding Generator | `/audits/[id]/findings/new` | Paste observation → AI fills fields |
| Add CAPA | `/audits/[id]/capas` | CAPA links to finding, finding moves to "remediating" |
| AI CAPA Suggestions | Finding detail | "Suggest CAPAs" → 3 AI options |
| Start audit | Planned audit → Start button | Status → In Progress |
| Generate AI summary | Audit detail → AI Summary panel | 3–4 sentence Gemini narrative |
| Generate executive report | `/audits/ai` | Board-level report; AI chat |
| Full audit PDF | `/reports/audits/[id]` | PDF with findings + CAPAs |
| Findings CSV | `/reports/audits/[id]/findings/csv` | CSV download |

**Seeded audit states:**
- **Annual ISO 27001 Internal Audit 2026** — `completed` · 5 findings (1 critical, 2 high, 1 medium, 1 low) · 3 CAPAs · AI summary included
- **Q1 Vendor Security Review — Razorpay 2026** — `completed` · 3 findings (1 high, 2 medium) · 2 CAPAs (1 completed)
- **SOC 2 Type II Gap Assessment** — `in_progress` · 3 findings (1 critical, 2 high) · 2 CAPAs · 8 program items
- **DPDP Act Compliance Audit 2026** — `planned` · 6 program items · no findings yet
- **PCI DSS v4.0 Pre-Assessment** — `in_progress` · 3 findings (1 critical, 2 high) · 2 CAPAs · 8 program items

---

### Module 5 — Risk Lens™

| Test | Where | Expected |
|---|---|---|
| Risk dashboard | `/risks` | 20 risks — heat map, category chart, top 5 list |
| Heat map | Risk dashboard | 5×5 grid — critical cells populated (Phishing at 4×4, Expired DPAs at 4×4) |
| Risk register | `/risks/list` | Filter by status=open → 14 risks |
| Open critical risk | Risk list → Phishing Attack | Detail with treatments, reviews, AI narrative |
| Treatments tracker | `/risks/treatments` | 25 treatment actions — overdue/due-soon highlighted |
| Add treatment | Risk detail → Add Treatment | New treatment row appears |
| Complete treatment | Treatment row → Complete | Status = completed, progress = 100% |
| AI Risk Officer | `/risks/ai` | Ask "Which risks are critical?" → contextual response |
| Generate executive report | `/risks/ai` → Generate Report | Board-level risk posture summary |
| Risks CSV | `/risks/reports` | CSV download |

---

### Module 6 — Control Center™

> **`seed-control-tests.mjs`** seeds 40+ test records across all 5 frameworks with mixed results, then sets `health_score`/`effectiveness_score`/`last_tested` directly on controls.

| Test | Where | Expected |
|---|---|---|
| Control dashboard | `/controls` | 174 controls — healthy/weak/overdue counts populated, avg health ~55 |
| Weakest controls | Dashboard → Weakest controls | 5 controls with health 10–28 (exception/fail state) |
| Control library | `/controls/library` | 174 controls — Health™ column shows coloured badges |
| Open strong control | First few ISO controls | Health badge Green/Blue — 2–3 passing tests in history |
| Open weak control | Controls in positions 70–85% | Health badge Red — recent fail or exception in history |
| Testing log | `/controls/testing` | 40+ test records — all 4 result types: passed/partially_effective/failed/exception |
| Test result distribution | Testing log stats | ~35% passed · ~25% partial · ~25% failed · ~15% exception |
| Compute Health™ | Any control → Compute Health™ | Score recomputes from fresh inputs, overwrites seeded value |
| Add test record | Control detail → Add Test | New record appears, health recomputes |
| AI Executive Summary | `/controls/ai` → Generate Summary | Cached board-level narrative |
| AI Gap Detection | `/controls/ai` → Detect Gaps | Top 5 gaps — now includes weak controls |
| AI chat | `/controls/ai` | Ask "Which controls have recent test failures?" |
| Controls CSV | `/api/v1/controls/export/csv` | CSV download |

**Seeded health score distribution (approximate):**
- Strong (≥80): ~30% of controls — recent passing tests, low review age
- Moderate (60–79): ~20% — 1 pass + 1 older partial
- Needs Attention (40–59): ~20% — recent partial + historical fail
- Weak/Critical (20–39): ~15% — recent fail
- Very low (<20): ~15% — exception state, no recent clean test

---

### Module 7 — Trust Intelligence™

> **`seed-governance-snapshots.mjs`** seeds 14 daily governance snapshots showing an upward trend from score 49 (14 days ago) to 62 (yesterday). Required for the Governance Timeline trend chart.

| Test | Where | Expected |
|---|---|---|
| Overview | `/trust-intelligence` | Org Trust Score™ ring (live score), component bars, metrics grid |
| Trust Drivers™ | Overview | Green bullets — e.g. "No open critical findings" |
| Trust Detractors™ | Overview | Red bullets — e.g. "X weak controls", "Y critical risks" |
| Governance Timeline | Overview | Last 10 audit log events with actor + date |
| Vendor Trust view | `/trust-intelligence/vendors` | Avg trust score, top 10 / bottom 10 with bars |
| Risk Insights view | `/trust-intelligence/risks` | Active/critical/high/medium counts + category chart |
| Control Health view | `/trust-intelligence/controls` | Avg health, weakest controls list (populated by seed-control-tests) |
| Compliance view | `/trust-intelligence/compliance` | Per-framework readiness bars |
| Recommendations | `/trust-intelligence/recommendations` | ≥8 prioritized actions — critical risks + weak controls + low-trust vendors |
| Executive View | `/trust-intelligence/executive` | Org Trust ring + AI summary + open actions |
| Governance trend chart | Executive View | 14-day line chart: org_trust_score 49 → 62 (upward trend) |
| Governance Copilot™ | Executive View → chat | Ask "Why did trust decline?" or "Which risks need attention?" |
| AI Executive Summary | Executive View | Gemini board summary (auto-generates if not cached) |

**Expected Org Trust Score after full demo seed (all modules):** ~62–70 (Moderate) with a clear upward trend visible in the governance snapshot chart.

Component scores with full seed:
- Vendor Trust: ~68 (avg vendor trust, dragged down by Apollo/Yotta/Sify)
- Risk Posture: ~53 (2 critical risks + 14 open)
- Control Health: ~55 (mixed scores from seed-control-tests)
- Audit Readiness: ~55 (2 completed + 2 in-progress audits)
- Compliance Coverage: ~56 (avg of 5 framework readiness scores)

**Snapshot governance:** The score is computed live on page load. Historical snapshots are pre-seeded. To add today's snapshot to the trend:
```bash
curl -X POST https://lekha-os.vercel.app/api/v1/trust-intelligence/org-score \
  -H "Authorization: Bearer lk_live_<your-key>"
```

---

### Module 8 — Governance Trends™ + Continuous Monitoring™

| Test | Where | Expected |
|---|---|---|
| Trends tab | `/trust-intelligence/trends` | 6 sparkline cards with change % indicators; score history table |
| Monitoring tab | `/trust-intelligence/monitoring` | Alert count strip (open/critical/high/resolved) |
| Run Monitoring | Monitoring tab → "Run Monitoring" button | Alerts created for expired evidence, critical controls, critical risks |
| Open alerts list | Monitoring tab | Each alert shows severity badge, type label, title, description, date |
| Resolve alert | Monitoring tab → Resolve button | Alert moves to "Recently Resolved" section |
| Trend sparklines | Trends tab | SVG line charts showing 14-day history (seeded by seed-governance-snapshots.mjs) |
| Score history table | Trends tab | Table rows for each snapshot date with all 6 component scores |
| REST API — trends | `GET /api/v1/trends/overview?days=90` | JSON with points array + metric trends with change/changePct/direction |
| REST API — alerts | `GET /api/v1/monitoring/alerts?status=open` | JSON with alerts array + counts |
| Change indicators | Trends tab | Each metric card shows: current score, ±pts, ±% vs period start, up/down/stable arrow |

---

### Trust Score™

| Test | Where | Expected |
|---|---|---|
| View Trust Score | Any vendor detail page | Score + breakdown bars + strengths/concerns |
| Check HDFC Bank | `/vendors/[hdfc-id]` | Score ~85–90 (Strong) |
| Check Apollo HealthCo | `/vendors/[apollo-id]` | Score ~18–30 (High Concern) |
| AI narrative | Trust Score widget → AI icon | Gemini vendor trust summary |
| Recalculate | Trust Score widget → Recalculate | Score recomputes, new snapshot saved |
| REST API | `GET /api/v1/vendors/[id]/trust-score` | JSON with score, components, history |

---

## Script Index

| Script | Module | What it seeds |
|---|---|---|
| `seed-templates.mjs` | Vendor Hub™ | 7 default vendor type templates |
| `seed-billing-plans.mjs` | Settings | 3 billing plans; `--assign-all` assigns Starter to all orgs |
| `seed-demo.mjs` | Vendor Hub™ | 15 vendors · ~67 documents · 4 assessments · 3 reviews · audit logs |
| `seed-compliance-frameworks.mjs` | Evidence Vault™ | 5 frameworks · 174 controls |
| `seed-compliance-demo.mjs` | Evidence Vault™ | Control statuses · 12 manual evidence · 104 mappings · 8 policies · gaps · readiness scores |
| `seed-data-governance.mjs` | Settings / Data Gov | Branding · login history · 25 audit events · doc storage metadata |
| `seed-risk-lens.mjs` | Risk Lens™ | 20 risks · 25 treatments · 8 reviews · vendor/control/framework links |
| `seed-trust-scores.mjs` | Trust Score™ | Computes 6-component Trust Score™ for all active vendors + 1 history snapshot each |
| `seed-audits.mjs` | Audit Management | 5 audits · 14 findings · 9 CAPAs · audit program items across all lifecycle states |
| `seed-control-tests.mjs` | Control Center™ | 40+ test records across 30 controls with mixed results · sets health_score + effectiveness_score |
| `seed-governance-snapshots.mjs` | Trust Intelligence™ | 14 daily governance snapshots (upward trend: 49 → 62) for Governance Timeline chart |
| `seed-vendor-extras.mjs` | Vendor Hub™ | Assessments for remaining 11 vendors · reviews for all vendors · doc requests in all 5 states |
| `seed-portal-tokens.mjs` | Vendor Hub™ | 4 portal tokens: 3 active (Apollo/Yotta/Sify) + 1 expired (Darwinbox) with ready-to-use portal URLs |
| `seed-trust-exchange.mjs` | Third-Party Risk Exchange™ | 1 published Trust Profile · 5 trust documents (ISO 27001, SOC 2, Cyber Insurance, Pen Test, DPDP) · 4 badges · 1 global questionnaire with 4 answered questions · activity log |
| `seed-benchmarking.mjs` | Governance Benchmarking™ | 1 benchmark snapshot (overall 77, 72nd percentile, Defined maturity) · 10 category scores · 60 trend rows (6 months × 10 categories) |
| `seed-integration-hub.mjs` | Integration Hub™ | 5 connected integrations (Entra ID, AWS, GitHub, CrowdStrike, Slack) · sync history · 4 open governance events |
| `seed-trust-network.mjs` | Trust Network™ | 47 anonymous profile views (30-day window) · 12 activity milestones · 1 network follower · profile published (score 92) |

---

## Module 1 — Vendor Hub™

### Vendors (15)

| # | Vendor | Category | Risk | Score | Status | Key Notes |
|---|---|---|---|---|---|---|
| 1 | **Razorpay Software Pvt Ltd** | Fintech/Payments | Low | 94 | Active | 8 docs — exemplary. Cyber Insurance expiring in 20 days. |
| 2 | **Freshworks Inc** | SaaS/CRM | Low | 88 | Active | 5 docs. DPA expiring in 28 days. |
| 3 | **Tata Consultancy Services Ltd** | IT Services | Medium | 72 | Active | 5 docs. Professional Indemnity expiring in 15 days. |
| 4 | **Zoho Corporation Pvt Ltd** | SaaS | Low | 87 | Active | 5 docs — all valid. ISO 27001 + SOC 2 II. |
| 5 | **Yotta Data Services Pvt Ltd** | Cloud / Hosting | High | 35 | Active | Only 2 docs. ISO, SOC 2, DPA, Insurance all missing. |
| 6 | **Quess Corp Ltd** | Staffing / HR | Medium | 70 | Active | 4 docs. No security assessment. |
| 7 | **Sify Technologies Ltd** | Network / Telecom | High | 40 | Active | ISO 27001 **expired** 2 months ago. Only 3 docs total. |
| 8 | **HDFC Bank Ltd** | Banking / NBFC | Low | 97 | Active | 7 docs — near-perfect. RBI auth + ISO + SOC 2. |
| 9 | **Wipro Limited** | IT Services | Medium | 78 | Active | 5 docs. No security assessment yet. |
| 10 | **Keka Technologies Pvt Ltd** | SaaS / HR | Low | 82 | Active | 5 docs — strong posture. |
| 11 | **Darwinbox Digital Solutions** | SaaS / HR | Medium | 65 | Active | DPA expiring in 15 days. Missing SOC 2. |
| 12 | **Infosys BPM Ltd** | IT Services | Medium | 76 | Active | Missing ISO 22301 (BCP). Finance BPO. |
| 13 | **Greytip Software Pvt Ltd** | SaaS / HR | Low | 78 | Active | Payroll platform. 5 docs valid. |
| 14 | **Apollo HealthCo Ltd** | Healthcare | Critical | 28 | Active | Only GST on file. No DPA / security cert — critical gap. |
| 15 | **Birlasoft Ltd** | IT Services | Medium | 74 | Active | ERP/SAP partner. 4 docs. |

**Documents: ~67 total** · Assessments: 15 (all vendors) · Reviews: ~15 (all vendors) · Doc requests: 5 (all states) · Portal tokens: 4 (3 active + 1 expired) · Expiring soon: 4 docs · Expired: 1 (Sify ISO 27001)

### Document Requests (5 — `seed-vendor-extras.mjs`)

| Vendor | Document Type | Status |
|---|---|---|
| Apollo HealthCo Ltd | Data Processing Agreement (DPA) | `requested` — pending vendor response |
| Yotta Data Services | ISO/IEC 27001 Certificate | `submitted` — awaiting review |
| Quess Corp Ltd | Professional Indemnity Insurance | `approved` — reviewed and accepted |
| Birlasoft Ltd | SOC 2 Type II Report | `rejected` — wrong report year, resubmission needed |
| Infosys BPM Ltd | Cyber Liability Insurance | `expired` — 30-day window elapsed |

### Portal Tokens (4 — `seed-portal-tokens.mjs`)

| Vendor | Expires | State | Use Case |
|---|---|---|---|
| Apollo HealthCo Ltd | +30 days | Active | Main E2E test target — critical vendor, minimal docs |
| Yotta Data Services | +14 days | Active | High-risk vendor portal flow |
| Sify Technologies Ltd | +7 days | Active (expiring soon) | Tests 7-day expiry warning |
| Darwinbox Digital Solutions | −7 days | Expired | Tests expiry handling (portal → 404) |

Run `node scripts/seed-portal-tokens.mjs` and check the output for ready-to-use portal URLs.

### Vendor Type Templates (7)

| Template | Required Docs |
|---|---|
| Cloud Provider | ISO 27001, SOC 2 II, GST, MSA, DPA, Cyber Insurance |
| SaaS Vendor | ISO 27001, SOC 2 I, MSA, DPA, GST |
| IT Services | GST, MCA, MSA, NDA, Prof Indemnity |
| Finance Vendor | RBI Auth, GST, MCA, MSA, DPA |
| Staffing / Outsourcing | GST, MCA, MSA, NDA, MSME |
| Legal / Consulting | GST, MSA, NDA, Prof Indemnity |
| General Vendor | GST, MSA |

---

## Module 2 — Evidence Vault™

### Frameworks (5) · Controls (174)

| Framework | Controls | Readiness after seed |
|---|---|---|
| ISO 27001:2022 | 93 | ~55% |
| SOC 2 Type II | 33 | ~70% |
| DPDP Act 2023 | 18 | ~72% |
| PCI DSS v4.0 | 12 | ~35% |
| HIPAA | 18 | ~30% |

### Control Statuses

| Framework | Implemented | Partial | Not Applicable | Not Implemented |
|---|---|---|---|---|
| ISO 27001:2022 | 35 | 28 | 6 | 24 |
| SOC 2 Type II | 21 | 12 | 0 | 0 |
| DPDP Act 2023 | 12 | 3 | 3 | 0 |
| PCI DSS v4.0 | 3 | 2 | 0 | 7 |
| HIPAA | 2 | 2 | 4 | 10 |

### Manual Evidence (12 items)

| Evidence | Status | Expires |
|---|---|---|
| Information Security Policy v2.1 | Approved | 2025-12-31 |
| Annual Penetration Test Report 2024 | Approved | 2025-03-31 |
| ISO 27001 Internal Audit Report Q3 2024 | Approved | — |
| Employee Security Awareness Training 2024 | Approved | 2025-06-30 |
| Access Review Q4 2024 | Approved | — |
| Data Classification Policy | Approved | 2026-01-01 |
| Business Continuity Plan v1.3 | Approved | 2025-09-30 |
| Vendor Security Assessment Framework | Approved | 2026-01-01 |
| Incident Response Runbook | Approved | — |
| DPDP Consent Management Procedure | Approved | — |
| Data Retention and Deletion Policy | Approved | 2025-12-31 |
| Network Architecture Diagram 2024 | Pending Review | 2025-06-30 |

**Evidence-Control Mappings: ~104** · Policies: 8 · Open gaps: ~107

### Policies (8)

| Policy | Version | Status |
|---|---|---|
| Information Security Policy | 2.1 | Approved |
| Vendor Management Policy | 1.3 | Approved |
| Access Control Policy | 1.5 | Approved |
| Privacy Policy | 3.0 | Approved (overdue review) |
| Incident Response Policy | 2.0 | In Review |
| Business Continuity Policy | 1.0 | Draft |
| Data Retention Policy | 1.1 | Expired |
| Acceptable Use Policy | 1.0 | Draft |

---

## Module 3 — Settings

### Billing Plans (3)

| Plan | Price | Max Users | Max Vendors | Max Storage |
|---|---|---|---|---|
| Starter | Free | 5 | 10 | 1 GB |
| Growth | ₹4,999/mo | 25 | 100 | 50 GB |
| Enterprise | Custom | Unlimited | Unlimited | 1 TB |

### Settings Demo Data

- **Org branding:** Primary `#6366f1`, Accent `#a78bfa`, report footer + email signature
- **Login history:** 20 events (success, failed attempt, new device)
- **Audit events (25):** Vendor CRUD, doc upload/approval, team invite, API key, integration, settings, data export

---

## Module 4 — Audit Management

### Audits (5 — seeded by `seed-audits.mjs`)

| Audit | Type | Status | Findings | CAPAs |
|---|---|---|---|---|
| Annual ISO 27001 Internal Audit 2026 | internal | completed | 5 (1 critical, 2 high, 1 medium, 1 low) | 3 (1 completed, 2 in_progress) |
| Q1 Vendor Security Review — Razorpay 2026 | vendor | completed | 3 (1 high, 2 medium) | 2 (1 completed, 1 in_progress) |
| SOC 2 Type II Gap Assessment | compliance | in_progress | 3 (1 critical, 2 high) | 2 (both open) |
| DPDP Act Compliance Audit 2026 | compliance | planned | — | — |
| PCI DSS v4.0 Pre-Assessment | external | in_progress | 3 (1 critical, 2 high) | 2 (1 open, 1 in_progress) |

### Findings (14 — all severities)

Critical (4): Privileged Access Management · Encryption at Rest · PAN Data Out-of-Scope · Cardholder Data Env
High (6): Incident Response · Supplier Assessments · API Key Rotation · Change Management · Logical Access · Network Segmentation
Medium (3): Vulnerability Patching · DPA Sub-processors · Audit Log Retention
Low (1): Security Awareness Training

### CAPAs (9 — all statuses)

| Status | Count | Example |
|---|---|---|
| open | 3 | Upgrade PCI databases to AES-256; Tokenize PAN data; Deploy PAM solution |
| in_progress | 5 | HashiCorp Vault deployment; Firewall rule removal; PAM workflow; HRMS deprovisioning |
| completed | 1 | Ransomware tabletop exercise (completed 2026-03-28 with notes) |

**REST API quick create:**
```bash
curl -X POST https://lekha-os.vercel.app/api/v1/audits \
  -H "Authorization: Bearer lk_live_<key>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Q2 Internal Audit","type":"internal","scope":"All systems","startDate":"2026-06-01","endDate":"2026-06-30"}'
```

---

## Module 5 — Risk Lens™

### Risks (20)

| # | Risk Title | Category | Status | Score | Priority |
|---|---|---|---|---|---|
| 1 | Third-Party Vendor Data Breach | Operational | Open | 15/25 | High |
| 2 | Business Continuity Failure — Cloud Outage | Operational | Mitigating | 10/25 | High |
| 3 | Key Person Dependency — IT Operations | Operational | Open | 9/25 | Medium |
| 4 | Payroll Processing Error — HR SaaS | Operational | Open | 8/25 | Medium |
| 5 | Ransomware Attack on Production Systems | Cyber Security | Mitigating | 15/25 | High |
| 6 | **Phishing and Social Engineering Attacks** | Cyber Security | Open | 16/25 | **Critical** |
| 7 | Privileged Access Misuse | Cyber Security | Open | 10/25 | High |
| 8 | Unpatched Vulnerability in Production | Cyber Security | Open | 12/25 | High |
| 9 | DPDP Act Non-Compliance — Consent Mgmt | Compliance | Mitigating | 15/25 | High |
| 10 | ISO 27001 Certification Lapse | Compliance | Open | 8/25 | Medium |
| 11 | Overdue Policy Reviews | Compliance | Accepted | 12/25 | High |
| 12 | Vendor Contract Dispute — IT Services | Financial | Open | 6/25 | Medium |
| 13 | Cost Overrun on Cloud Infrastructure | Financial | Open | 9/25 | Medium |
| 14 | Payment Fraud — Gateway Compromise | Financial | Mitigating | 10/25 | High |
| 15 | Vendor Lock-In — Single Cloud Provider | Strategic | Accepted | 6/25 | Medium |
| 16 | Regulatory Change — New RBI/SEBI Directive | Strategic | Open | 12/25 | High |
| 17 | Data Breach Public Disclosure | Custom/Reputational | Open | 10/25 | High |
| 18 | Apollo HealthCo — Employee Data Exposure | Custom/Reputational | Open | 15/25 | High |
| 19 | **Expired Data Processing Agreements** | Legal | Open | 16/25 | **Critical** |
| 20 | Employment Law Violation — Staffing Vendor | Legal | Open | 8/25 | Medium |

**Summary:** 14 open · 4 mitigating · 2 accepted · 2 critical · Treatments: 25 · Reviews: 8 · Vendor links: 15 · Control links: 5 · Framework links: 14

---

## Module 6 — Control Center™

> Controls come from `seed-compliance-frameworks.mjs` (174 controls across 5 frameworks).
> Health scores are 0 until computed. Compute via detail page or Control Center™ dashboard.

| What to do | Where |
|---|---|
| View all 174 controls | `/controls/library` |
| Compute health for one control | Control detail → Compute Health™ button |
| See health levels appear | Control list → Health™ column updates |
| Add a test record | Control detail → Add Test (use result: Passed) |
| View org-wide test log | `/controls/testing` |
| Create standalone control | `/controls/new` (no framework required) |

**After computing ~10 health scores**, the Dashboard at `/controls` will show:
- Avg health score
- Healthy vs Weak counts
- Weakest controls list

---

## Module 7 — Trust Intelligence™

> No seed script needed. Aggregates from all modules above in real-time.

| What you see | Expected value after full seed |
|---|---|
| Organizational Trust Score™ | ~55–68 (Moderate) |
| Vendor Trust component | ~65 (avg vendor trust ~70, but Yotta/Sify/Apollo drag it down) |
| Risk Posture component | ~50–60 (2 critical risks = Phishing + Expired DPAs) |
| Control Health component | ~40 (most health scores = 0 until computed via Control Center™) |
| Audit Readiness component | ~50 (no audits seeded — 0 audits = neutral 50) |
| Compliance Coverage component | ~52 (avg of 55%+70%+72%+35%+30%) |
| Recommendations count | ~8–12 (critical risks + low-trust vendors + weak controls + critical findings) |
| Governance Copilot™ | Live — asks about any of the above |

**Improve the score during demo:**
- Compute health for 10+ controls → Control Health score rises
- Create and complete an audit → Audit Readiness improves
- Change risk status to "accepted" for 1–2 risks → Risk Posture improves
- Recalculate Trust Score on Apollo/Yotta after any doc upload → Vendor Trust rises

### Snapshot governance trends
To save today's snapshot for trend tracking:
```bash
curl -X POST https://lekha-os.vercel.app/api/v1/trust-intelligence/org-score \
  -H "Authorization: Bearer lk_live_<key>"
```

---

## Trust Score™

### Expected Scores After Full Seed

| Vendor | Est. Trust Score | Level |
|---|---|---|
| HDFC Bank Ltd | ~85–90 | Strong |
| Razorpay Software Pvt Ltd | ~80–86 | Strong |
| Keka Technologies Pvt Ltd | ~75–82 | Strong / Moderate |
| Zoho Corporation Pvt Ltd | ~75–82 | Strong / Moderate |
| Freshworks Inc | ~70–78 | Moderate |
| Greytip Software Pvt Ltd | ~70–78 | Moderate |
| Wipro Limited | ~68–76 | Moderate |
| Infosys BPM Ltd | ~65–73 | Moderate |
| TCS Ltd | ~65–73 | Moderate |
| Birlasoft Ltd | ~62–70 | Moderate |
| Quess Corp Ltd | ~58–66 | Needs Attention |
| Darwinbox Digital Solutions | ~55–65 | Needs Attention |
| Sify Technologies Ltd | ~40–52 | High Concern |
| Yotta Data Services Pvt Ltd | ~30–42 | High Concern |
| Apollo HealthCo Ltd | ~18–30 | High Concern |

---

### Module 10 — Policy Governance™

> No seed script needed for initial demo — use the UI to create policies, then map controls/frameworks and run AI features.

| Test | Where | Expected |
|---|---|---|
| View dashboard | `/policy-governance` | Metrics strip: Total / Published / Due for Review / Avg Health |
| Policy library | `/policy-governance/library` | Empty on fresh DB; create a new policy |
| Create policy | Library → New Policy | Fill: name, type (Access Control), version 1.0, attestation required |
| Policy detail | Click policy name | 8 tabs: Overview · Versions · Controls · Frameworks · Risks · Attestations · Reviews · Activity |
| Add review | Policy detail → Reviews tab → Add Review | Select outcome: Approved, set next review date |
| Compute Health™ | Policy detail → Overview → Compute Health button | Health score populates with breakdown |
| Link control | Policy detail → Controls tab | Search and link an ISO 27001 control |
| Link framework | Policy detail → Frameworks tab | Link to ISO 27001 |
| Publish policy | Policy detail → Publish button | Status → Published |
| AI Policy Draft | `/policy-governance/ai` → Draft Policy | Enter "Access Control Policy for cloud SaaS" → Gemini returns full policy markdown |
| AI Gap Analysis | AI Advisor → Analyze Gaps | Returns missing/weak/outdated/unmapped policy lists |
| AI Executive Summary | AI Advisor → Generate Summary | Board-level policy posture paragraph |
| AI chat | AI Advisor → chat | Ask "Which policies need review?" |
| Reviews page | `/policy-governance/reviews` | Shows reviews added via detail page |
| Attestations page | `/policy-governance/attestations` | Shows attestations after assigning via detail page |
| REST API — policies | `GET /api/v1/policies` | JSON list |
| REST API — health | `GET /api/v1/policy-health` | Org policy health metrics |

---

### Module 12 — Contract Governance™

> No seed script yet — use the UI to create contracts, then add clauses, obligations, and run AI features.

| Test | Where | Expected |
|---|---|---|
| View dashboard | `/contract-governance` | Metrics strip: Active / Expiring / Expired / Renewals Due / Total Value |
| Contract library | `/contract-governance/library` | Empty on fresh DB; create a new contract |
| Create contract | Library → New Contract | Fill: title, type (MSA), vendor, effective/expiry dates, value |
| Contract detail | Click contract title | 9 tabs: Overview · Clauses · Obligations · Risks · Policies · Controls · Vendor · AI Analysis · Activity |
| Add clause | Contract detail → Clauses tab | Title, category (Security), risk level (High), content |
| Add obligation | Contract detail → Obligations tab | Title, due date, owner, risk level |
| Complete obligation | Obligation row → Complete | Status → completed, completed_at set |
| Compute Trust Score™ | Contract detail → Overview → Compute Score | Score populates with component breakdown bars |
| Link risk | Contract detail → Risks tab | Link an existing risk |
| Link policy | Contract detail → Policies tab | Link a compliance policy |
| AI extraction | Contract detail → AI Analysis → Extract | Paste contract text → Gemini returns clauses + obligations |
| AI clause analysis | Clauses tab → any clause → Analyse | Purpose, risk, impact, recommendations |
| AI risk assessment | AI Analysis → Risk Assessment | High-risk clauses, missing protections, DPDP gaps |
| AI Executive Summary | `/contract-governance/ai` → Generate Summary | Board-level contract posture summary |
| AI chat | AI Advisor → chat | Ask "Which contracts expire next quarter?" |
| Obligations tracker | `/contract-governance/obligations` | All obligations across contracts |
| Renewals page | `/contract-governance/renewals` | Contracts sorted by expiry, notice-period countdown |
| REST API — contracts | `GET /api/v1/contracts` | JSON list |
| REST API — obligations | `GET /api/v1/contracts/obligations` | Org-wide obligations |

---

### Module 13 — Issue & Remediation Hub™

> No seed script — use the UI or AI Issue Generator to populate issues.

| Test | Where | Expected |
|---|---|---|
| View dashboard | `/issue-hub` | Metrics strip: Open / Critical / Overdue / SLA Compliance % |
| Issue registry | `/issue-hub/list` | Empty on fresh DB; create a new issue |
| Create issue | `/issue-hub/new` | Fill: title, type (Risk), severity (High), priority (P2), owner, due date |
| Issue detail | Click issue title | 7 tabs: Overview · Tasks · Comments · Exceptions · Escalations · History · AI |
| Add task | Issue detail → Tasks tab | New task row with status Open |
| Complete task | Task row → Complete | Status → completed, completed_at set |
| Add comment | Issue detail → Comments tab | Comment appears with author + timestamp |
| Update status | Issue detail → Overview → Update Status | Status changes, history entry recorded |
| Request exception | Issue detail → Exceptions tab → Request Exception | Exception created with status: pending |
| Approve exception | Exception row → Approve | Status → approved, approver set |
| Escalate issue | Issue detail → Escalations tab → Escalate | Escalation created, issue moves to in_progress |
| AI Issue Generator | `/issue-hub/ai` → Generate Issue | Paste observation → Gemini returns structured issue JSON |
| AI Remediation Planner | Issue detail → AI tab → Generate Plan | 3–5 tasks with owners and timelines |
| AI Executive Summary | `/issue-hub/ai` → Generate Summary | Board-level issue posture summary |
| AI chat | AI Advisor → chat | Ask "Show critical issues" or "What's overdue?" |
| Task tracker | `/issue-hub/tasks` | Org-wide tasks across all issues |
| Exceptions page | `/issue-hub/exceptions` | All exceptions with approve/reject buttons |
| CSV export | `/issue-hub/reports` → Download | Issues CSV |
| Run Monitoring | Trust Intelligence → Monitoring → Run Monitoring | `issue_overdue` / `issue_critical_open` / `issue_sla_breach` alerts appear |
| REST API — issues | `GET /api/v1/issues` | JSON list |
| REST API — create | `POST /api/v1/issues` | Issue created via Bearer token |

---

### Module 14 — Workflow Studio™

> No seed script — use the UI, Templates, or AI Workflow Generator to populate workflows.

| Test | Where | Expected |
|---|---|---|
| View dashboard | `/workflow-studio` | Metrics strip: Workflows / Active / Runs / Approvals / Automation Rate™ bar |
| Workflow library | `/workflow-studio/library` | Empty on fresh DB; create a new workflow |
| Create workflow | `/workflow-studio/new` | Fill: name, module (Risk Lens™), trigger (Manual) → creates draft |
| Browse templates | `/workflow-studio/templates` | 17 pre-built templates across 7 categories with node flow preview |
| Use template | Templates → "Vendor Onboarding" → Use Template | Navigates to new workflow form pre-filled |
| Workflow detail | Click workflow name | Header with Publish / Start Run buttons; step list; recent runs |
| Publish workflow | Workflow detail → Publish | Status: draft → active |
| Start run | Workflow detail → Start Run (active only) | Run created; appears in runs list |
| View runs | `/workflow-studio/runs` | Filterable run log with status chips |
| View approvals | `/workflow-studio/approvals` | Pending approvals with inline Approve/Reject |
| Approve | Approvals → Approve button | Status → approved |
| Reject | Approvals → Reject button | Status → rejected |
| Edit workflow | Workflow detail → Edit | Form pre-filled; save updates name/description/trigger |
| AI Executive Summary | `/workflow-studio/ai` | Board-level automation posture summary |
| AI Generator | `/workflow-studio/ai` → Generate Workflow | Enter "Create a vendor onboarding workflow" → JSON with nodes returned |
| Create from AI | AI result → Create This Workflow | Navigates to new workflow form pre-filled from AI output |
| AI Bottleneck Analysis | AI Advisor page | Auto-appears if failed runs or pending approvals exist |
| AI chat | AI Advisor → chat | Ask "Which workflows fail most?" or "How can we improve automation rate?" |
| REST API — list | `GET /api/v1/workflows` | JSON with workflows array |
| REST API — create | `POST /api/v1/workflows` | Workflow created via Bearer token |
| REST API — runs | `GET /api/v1/workflow-runs` | JSON with runs array |

---

### Module 15 — Third-Party Risk Exchange™

> **`seed-trust-exchange.mjs`** seeds a complete trust profile with documents, badges, and questionnaire answers.

| Test | Where | Expected |
|---|---|---|
| View dashboard | `/trust-exchange` | Metrics strip: Profile Completeness · Documents · Badges · Questionnaires |
| My Profile | `/trust-exchange/my-profile` | Trust Profile form pre-filled from org data; AI trust summary present |
| Documents | `/trust-exchange/documents` | 5 trust documents — ISO 27001, SOC 2, Cyber Insurance, Pen Test, DPDP |
| Add document | Documents → Add Document | Form with doc type, title, issuer, issued/expiry dates, visibility |
| Verify document | Document row → Verify | `isVerified = true`, Verified badge appears |
| Badges | `/trust-exchange/badges` | 4 active badges — AUDT Verified™, DPDP Ready™, ISO Verified™, SOC2 Verified™ |
| Issue badge | Badges → Issue Badge | Select type, enter label → badge appears in grid |
| Questionnaires | `/trust-exchange/questionnaires` | 1 global questionnaire with 4 answers · 100% completion |
| Vendor Directory | `/trust-exchange/directory` | Published profiles; filter by industry/country |
| AI Trust Analyst | `/trust-exchange/ai` | AI summary + document analysis + chat |
| AI chat | AI page → chat | Ask "How complete is my trust profile?" or "Which documents are expiring?" |
| Publish profile | My Profile → Publish to Directory | Profile `visibility = public`, appears in Directory |
| REST API — profile | `GET /api/v1/trust-exchange` | JSON with profile, documents, badges, questionnaire count |
| REST API — directory | `GET /api/v1/trust-exchange/directory` | Publicly listed profiles |

**Seeded Trust Exchange data:**
- **Trust Profile**: Published · Industry: IT Services · 80% completeness
- **Documents (5)**: ISO 27001 (BSI, expires 2027) · SOC 2 Type II (AICPA, expires 2027) · Cyber Insurance (verified) · Pen Test Report · DPDP Compliance Assessment
- **Badges (4)**: AUDT Verified™ · DPDP Ready™ · ISO Verified™ · SOC2 Verified™
- **Questionnaire**: "Security & Privacy Questionnaire" — 4 answered questions (access control, data encryption, incident response, DPDP compliance)

---

### Module 16 — Governance Benchmarking™

> **`seed-benchmarking.mjs`** seeds a complete benchmark snapshot with industry peer comparison across 10 categories.

| Test | Where | Expected |
|---|---|---|
| View dashboard | `/benchmarking` | Overall score 77 · 72nd percentile · Defined maturity level · 10 category scorecards |
| Vendor Trust benchmark | `/benchmarking/vendors` | Vendor governance deep-dive vs industry peers |
| Risk & Controls benchmark | `/benchmarking/risks` | Risk posture · control health · audit readiness comparison |
| Compliance benchmark | `/benchmarking/compliance` | Coverage · privacy · contract · workflow automation scores |
| Rankings | `/benchmarking/rankings` | Full ranking table · maturity progress bar (Reactive → Trust Leader) |
| AI Benchmark Analyst | `/benchmarking/ai` | Executive report + industry insights + improvement planner + chat |
| REST API | `GET /api/v1/benchmarking` | Full snapshot + all category scores + trends |

**Seeded benchmark data:**
- **Snapshot**: Overall score 77 · 72nd percentile · Defined maturity
- **Categories (10)**: Org Trust · Vendor Trust · Risk · Controls · Audit · Compliance · Privacy · Contract · Issues · Workflow
- **Trend history**: 6 months × 10 categories = 60 trend rows

---

### Module 18 — Trust Network™

> **`seed-trust-network.mjs`** seeds profile views, trust activity milestones, and a network follower.

| Test | Where | Expected |
|---|---|---|
| View dashboard | `/trust-network` | Reputation score ring, 6 metrics, 3 pillar cards, activity feed |
| Network Reputation™ | Dashboard | Score ~85+ (Highly Trusted) — computed from 5 module signals |
| Public Profile | `/trust-network/profile` | Profile completeness 100%, trust 92, badges shown |
| Network Directory | `/trust-network/directory` | Published profile with completeness badge |
| Trust Relationships | `/trust-network/relationships` | Relationships from Trust Exchange™ |
| Activity Feed | `/trust-network/activity` | 12 milestones: verifications, badges, relationship events |
| AI Advisor | `/trust-network/ai` | Reputation summary + 4 improvement recommendations + chat |
| REST API | `GET /api/v1/trust-network` | Dashboard data |
| REST API directory | `GET /api/v1/trust-network?view=directory` | Published profile list |

**Seeded Trust Network data:**
- **Profile views**: 47 anonymous views across 30-day window
- **Activity milestones (12)**: profile_created · document_verified (3×) · badge_issued (4×) · questionnaire_answered · relationship_created · profile_updated
- **Network follower**: 1 (if second org exists in DB)
- **Profile**: Published · 100% completeness · trust_score 92 · privacy_score 88 · ISO 27001 + SOC 2 + DPDP Ready certifications

---

### Module 17A — Integration Hub™

> **`seed-integration-hub.mjs`** seeds 5 connected integrations and 4 open governance events.

| Test | Where | Expected |
|---|---|---|
| View dashboard | `/integration-hub` | Metrics strip: Connected / Error / Open Events / Evidence / Risks; Phase 1 getting-started checklist |
| Connector Marketplace | `/integration-hub/marketplace` | 35+ connectors across 11 categories; Phase 1 coverage progress bar |
| Connect integration | Marketplace → Connect button | Modal with auth fields; sync frequency selector |
| Integration Manager | `/integration-hub/connections` | 5 connected integrations with sync stats and open events |
| Trigger sync | Connection row → Sync button | Sync run created; stats update |
| Disconnect | Connection row → Disconnect | Instance removed from list |
| Sync History | `/integration-hub/syncs` | Filterable sync log with status chips |
| Webhook Engine | `/integration-hub/webhooks` | Webhook list; create inbound/outbound webhook |
| Events | `/integration-hub/events` | Governance events from all integrations; resolve events |
| AI Integration Advisor | `/integration-hub/ai` | Executive summary + connector recommendations + coverage gap analysis + chat |
| REST API — connections | `GET /api/v1/integrations` | JSON with connected integrations |
| REST API — health | `GET /api/v1/integrations/health` | Connectivity health metrics |
| REST API — syncs | `GET /api/v1/integrations/syncs` | Sync history log |

**Seeded Integration Hub data:**
- **Microsoft Entra ID** (Identity): connected · 240 records synced · 12 evidence · 3 risks · last synced today
- **AWS** (Cloud): connected · 1820 records synced · 28 evidence · 7 risks
- **GitHub** (Source Control): connected · 856 records synced · 14 evidence · 2 risks
- **CrowdStrike** (Security): connected · 2450 records synced · 45 evidence · 12 risks
- **Slack** (Communication): connected · 340 records synced · 8 evidence · 1 risk
- **Governance Events (4 open)**: Privileged access without MFA (critical) · Public S3 bucket detected (critical) · Unpatched endpoint (high) · Failed login attempts spike (medium)

---

## REST API — Quick Test Commands

Replace `<key>` with an API key from `/settings/api-keys`.

```bash
# Vendor list
curl https://lekha-os.vercel.app/api/v1/vendors \
  -H "Authorization: Bearer lk_live_<key>"

# Trust Score for a vendor
curl https://lekha-os.vercel.app/api/v1/vendors/<id>/trust-score \
  -H "Authorization: Bearer lk_live_<key>"

# Organizational Trust Score
curl https://lekha-os.vercel.app/api/v1/trust-intelligence/org-score \
  -H "Authorization: Bearer lk_live_<key>"

# Governance overview
curl https://lekha-os.vercel.app/api/v1/trust-intelligence/overview \
  -H "Authorization: Bearer lk_live_<key>"

# Recommendations
curl https://lekha-os.vercel.app/api/v1/trust-intelligence/recommendations \
  -H "Authorization: Bearer lk_live_<key>"

# Risk list
curl https://lekha-os.vercel.app/api/v1/risks \
  -H "Authorization: Bearer lk_live_<key>"

# Compliance frameworks
curl https://lekha-os.vercel.app/api/v1/compliance/frameworks \
  -H "Authorization: Bearer lk_live_<key>"

# Audit list
curl https://lekha-os.vercel.app/api/v1/audits \
  -H "Authorization: Bearer lk_live_<key>"
```

---

```bash
# Issue list
curl https://lekha-os.vercel.app/api/v1/issues \
  -H "Authorization: Bearer lk_live_<key>"

# Create issue
curl -X POST https://lekha-os.vercel.app/api/v1/issues \
  -H "Authorization: Bearer lk_live_<key>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Critical vendor data exposure","severity":"critical","issueType":"vendor_issue","sourceModule":"vendor_hub"}'
```

```bash
# Workflow list
curl https://lekha-os.vercel.app/api/v1/workflows \
  -H "Authorization: Bearer lk_live_<key>"

# Create workflow
curl -X POST https://lekha-os.vercel.app/api/v1/workflows \
  -H "Authorization: Bearer lk_live_<key>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Vendor Onboarding","module":"vendor_hub","triggerType":"manual","description":"End-to-end vendor intake workflow"}'

# Workflow runs
curl https://lekha-os.vercel.app/api/v1/workflow-runs \
  -H "Authorization: Bearer lk_live_<key>"
```

```bash
# Integration Hub — connected integrations
curl https://lekha-os.vercel.app/api/v1/integrations \
  -H "Authorization: Bearer lk_live_<key>"

# Integration Hub — health metrics
curl https://lekha-os.vercel.app/api/v1/integrations/health \
  -H "Authorization: Bearer lk_live_<key>"

# Integration Hub — sync history
curl https://lekha-os.vercel.app/api/v1/integrations/syncs \
  -H "Authorization: Bearer lk_live_<key>"
```

## E2E / Test Data

```bash
E2E_USER_EMAIL=test@example.com E2E_USER_PASSWORD=TestPass123! node scripts/seed-e2e.mjs
```

Then set `E2E_USER_EMAIL` + `E2E_USER_PASSWORD` in `.env.local` and run `npm run test:e2e`.

---

## Utility Scripts

| Script | Purpose |
|---|---|
| `check-db.mjs` | Quick table row counts for all 117 tables |
| `apply-sql.mjs <file>` | Apply raw SQL file to DB |
| `verify-db.mjs` | Deeper DB state verification |
| `verify-vendors.mjs` | Vendor data quality checks |

---

## Full Data Inventory (after all seeds)

| Table | Demo Rows | Script |
|---|---|---|
| `organizations` | 1 | seed-demo |
| `memberships` | 1 owner | seed-demo |
| `vendors` | 15 (trust_score + health_score populated) | seed-demo + seed-trust-scores |
| `vendor_documents` | ~67 | seed-demo |
| `vendor_types` | 7 (global defaults) | seed-templates |
| `vendor_type_documents` | ~50 | seed-templates |
| `assessments` | 15 (all vendors covered) | seed-demo (4) + seed-vendor-extras (11) |
| `assessment_responses` | ~255 (15 × 17 questions) | seed-demo + seed-vendor-extras |
| `vendor_reviews` | ~15 (all vendors, varied types) | seed-demo (3) + seed-vendor-extras (12) |
| `document_requests` | 5 (all states: requested/submitted/approved/rejected/expired) | seed-vendor-extras |
| `vendor_portal_tokens` | 4 (3 active + 1 expired) | seed-portal-tokens |
| `vendor_trust_history` | 15 (one per active vendor) | seed-trust-scores |
| `frameworks` | 5 | seed-compliance-frameworks |
| `controls` | 174 (~30% with health scores from control tests) | seed-compliance-frameworks + seed-control-tests |
| `evidence` | ~80 | seed-compliance-demo |
| `control_evidence_mappings` | ~104 | seed-compliance-demo |
| `policies` | 8 | seed-compliance-demo |
| `policy_versions` | 5 | seed-compliance-demo |
| `readiness_scores` | 5 | seed-compliance-demo |
| `gap_analysis` | ~107 open gaps | seed-compliance-demo |
| `control_tests` | 40+ (all 4 result types across 30 controls) | seed-control-tests |
| `control_frameworks` | 0 (populate via UI) | — |
| `control_vendors` | 0 (populate via UI) | — |
| `billing_plans` | 3 | seed-billing-plans |
| `subscriptions` | 1 (Starter) | seed-billing-plans |
| `organization_settings` | 1 | seed-data-governance |
| `login_history` | 20 | seed-data-governance |
| `audit_logs` | ~30+ | seed-data-governance |
| `risks` | 20 | seed-risk-lens |
| `risk_treatments` | 25 | seed-risk-lens |
| `risk_reviews` | 8 | seed-risk-lens |
| `risk_vendors` | 15 | seed-risk-lens |
| `risk_controls` | 5 | seed-risk-lens |
| `risk_frameworks` | 14 | seed-risk-lens |
| `storage_providers` | 1 | seed-data-governance |
| `audits` | 5 (planned/in_progress/completed) | seed-audits |
| `audit_programs` | ~40 (8–12 items per audit with framework controls) | seed-audits |
| `audit_findings` | 14 (critical/high/medium/low — all severities) | seed-audits |
| `corrective_actions` | 9 (open/in_progress/completed — all states) | seed-audits |
| `governance_snapshots` | 14 (daily trend: 49 → 62 over 14 days) | seed-governance-snapshots |
| `governance_alerts` | 0 (populated by Run Monitoring or daily cron) | monitoring-service |
| `policy_reviews` | 0 (create via `/policy-governance/[id]` Reviews tab) | — |
| `policy_attestations` | 0 (assign via policy detail → Attestations tab) | — |
| `policy_controls` | 0 (link via policy detail → Controls tab) | — |
| `policy_frameworks` | 0 (link via policy detail → Frameworks tab) | — |
| `contracts` | 0 (create via `/contract-governance/new`) | — |
| `contract_clauses` | 0 (add via contract detail → Clauses tab or AI extraction) | — |
| `contract_obligations` | 0 (add via contract detail → Obligations tab) | — |
| `contract_risks` | 0 (link via contract detail → Risks tab) | — |
| `contract_controls` | 0 (link via contract detail → Controls tab) | — |
| `contract_policies` | 0 (link via contract detail → Policies tab) | — |
| `issues` | 0 (create via `/issue-hub/new` or AI Issue Generator) | — |
| `issue_tasks` | 0 (add via issue detail → Tasks tab) | — |
| `issue_comments` | 0 (add via issue detail → Comments tab) | — |
| `issue_exceptions` | 0 (request via issue detail → Exceptions tab) | — |
| `issue_escalations` | 0 (escalate via issue detail → Escalations tab) | — |
| `issue_history` | 0 (auto-populated on status/field changes) | — |
| `workflows` | 0 (create via `/workflow-studio/new` or Templates) | — |
| `workflow_nodes` | 0 (added via workflow builder) | — |
| `workflow_transitions` | 0 (added via workflow builder) | — |
| `workflow_runs` | 0 (start via workflow detail → Start Run) | — |
| `workflow_run_steps` | 0 (auto-populated on run execution) | — |
| `workflow_approvals` | 0 (created at approval nodes during runs) | — |
| `trust_profiles` | 1 (published, 80% completeness) | seed-trust-exchange |
| `trust_documents` | 5 (ISO 27001, SOC 2, Cyber Insurance, Pen Test, DPDP) | seed-trust-exchange |
| `trust_shares` | 0 (populate via sharing flow) | — |
| `trust_questionnaires` | 1 (global "Security & Privacy Questionnaire") | seed-trust-exchange |
| `trust_answers` | 1 (4 answered questions, 100% completion) | seed-trust-exchange |
| `trust_verifications` | 0 (verify docs via Documents page) | — |
| `trust_badges` | 4 (AUDT Verified, DPDP Ready, ISO Verified, SOC2 Verified) | seed-trust-exchange |
| `trust_relationships` | 0 (connect via Directory) | — |
| `trust_activity` | 1 (profile creation event) | seed-trust-exchange |
| `benchmark_industries` | 60 (industry baselines — seeded at migration 0021) | migration 0021 |
| `benchmark_snapshots` | 1 (overall score 77 · 72nd percentile · Defined maturity) | seed-benchmarking |
| `benchmark_scores` | 10 (one per benchmark category with percentile + ranking) | seed-benchmarking |
| `benchmark_trends` | 60 (6 months × 10 categories with score + percentile history) | seed-benchmarking |
| `integration_registry` | 35+ connectors seeded at migration time | migration 0022 |
| `integration_instances` | 5 (Entra ID, AWS, GitHub, CrowdStrike, Slack — all connected) | seed-integration-hub |
| `integration_credentials` | 5 (AES-256-GCM encrypted per instance) | seed-integration-hub |
| `integration_syncs` | 5+ (one recent sync per instance) | seed-integration-hub |
| `integration_logs` | 0 (append-only; populated by real sync runs) | — |
| `integration_events` | 4 (open governance events: 2 critical, 1 high, 1 medium) | seed-integration-hub |
| `integration_mappings` | 0 (configure via webhook setup) | — |
| `integration_webhooks` | 0 (create via `/integration-hub/webhooks`) | — |
| `network_profile_views` | 47 (anonymous views across 30-day window) | seed-trust-network |
| `network_followers` | 0–1 (1 if 2nd org exists) | seed-trust-network |

> After running all seeds, **every module has complete, realistic demo data** — no modules require manual setup. Visit `/trust-network` for the Network Reputation™ dashboard, `/benchmarking` for industry peer comparison, `/trust-intelligence` for Org Trust Score™ with 14-day trends, `/trust-intelligence/monitoring` to run governance alerts, and `/integration-hub` to see the Connector Marketplace with 5 live integrations and open governance events.
