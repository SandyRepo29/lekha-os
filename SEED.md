# AUDT — Demo Seed Data Reference

> Complete inventory of all demo seed data across every module.
> All scripts target the **"admin corp"** workspace (owner: `admin@audt.tech`).
> Every script is idempotent — safe to re-run.

---

## Quick Start — Full Demo (all 9 modules)

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
```

After this, **Trust Intelligence™ (Module 7)** is immediately populated — it aggregates from the data above. Visit `/trust-intelligence` to see the live Organizational Trust Score™.

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

> No seed script — create audits via UI to test end-to-end.

| Test | Where | Expected |
|---|---|---|
| Create audit | `/audits/new` | Fill in name, type (Internal), scope, dates → Save |
| View audit dashboard | `/audits` | New audit appears in metrics |
| Add audit finding | `/audits/[id]/findings/new` | Fill in severity Critical, title, description |
| AI Finding Generator | `/audits/[id]/findings/new` | Paste observation → AI fills fields |
| Add CAPA | `/audits/[id]/capas` | CAPA links to finding, finding moves to "remediating" |
| AI CAPA Suggestions | Finding detail | "Suggest CAPAs" → 3 AI options |
| Start audit | Audit detail → Start button | Status → In Progress |
| Generate AI summary | Audit detail → AI Summary panel | 3–4 sentence Gemini narrative |
| Generate executive report | `/audits/ai` | Board-level report; AI chat |
| Full audit PDF | `/reports/audits/[id]` | PDF with findings + CAPAs |
| Findings CSV | `/reports/audits/[id]/findings/csv` | CSV download |
| Complete audit | Audit detail → Complete button | Status → Completed |

**Quick demo path:** Create 1 audit → Add 2 findings (1 Critical, 1 High) → Add CAPAs → Start → Generate AI summary → View PDF.

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

| Test | Where | Expected |
|---|---|---|
| Control dashboard | `/controls` | 174 controls — metrics: total/healthy/weak/overdue |
| Control library | `/controls/library` | 174 controls — search "access", filter by status |
| Open control detail | Any control | Health™ breakdown (6 components), no scores yet |
| Compute Health™ | Control detail → Compute Health™ | Scores populate, page refreshes |
| Add test record | Control detail → Add Test | Date + result (Passed) → appears in test history |
| Testing log | `/controls/testing` | Org-wide test log |
| Create new control | `/controls/new` | Standalone control (no framework) |
| AI Executive Summary | `/controls/ai` → Generate Summary | Cached board-level narrative |
| AI Gap Detection | `/controls/ai` → Detect Gaps | Top 5 gaps with actions |
| AI chat | `/controls/ai` | Ask "Which controls lack evidence?" |
| Controls CSV | `/api/v1/controls/export/csv` | CSV download |

**Note:** Health scores start at 0 for seeded controls. Compute a few to see the scoring model in action. The "weakest controls" list on the dashboard updates as you compute more scores.

---

### Module 7 — Trust Intelligence™

| Test | Where | Expected |
|---|---|---|
| Overview | `/trust-intelligence` | Org Trust Score™ ring (live score), component bars, metrics grid |
| Trust Drivers™ | Overview | Green bullets — e.g. "No open critical findings" |
| Trust Detractors™ | Overview | Red bullets — e.g. "X weak controls", "Y critical risks" |
| Governance Timeline | Overview | Last 10 audit log events with actor + date |
| Vendor Trust view | `/trust-intelligence/vendors` | Avg trust score, top 10 / bottom 10 with bars |
| Risk Insights view | `/trust-intelligence/risks` | Active/critical/high/medium counts + category chart |
| Control Health view | `/trust-intelligence/controls` | Avg health, weakest controls list |
| Compliance view | `/trust-intelligence/compliance` | Per-framework readiness bars |
| Recommendations | `/trust-intelligence/recommendations` | Prioritized actions — at least 3 high-priority after full seed |
| Executive View | `/trust-intelligence/executive` | Org Trust ring + AI summary + open actions |
| Governance Copilot™ | Executive View → chat | Ask "Why did trust decline?" or "Which risks need attention?" |
| AI Executive Summary | Executive View | Gemini board summary (auto-generates if not cached) |

**Expected Org Trust Score after full demo seed:** ~55–70 (Moderate) — several critical risks + weak controls + low compliance readiness on PCI/HIPAA drive the score down. Apollo HealthCo (critical risk, 1 doc) and Yotta/Sify (high risk, low docs) are main vendor trust detractors.

**Snapshot governance:** The score is computed live on page load. To persist a daily snapshot to `governance_snapshots` (for future trend charts), call:
```bash
curl -X POST https://lekha-os.vercel.app/api/v1/trust-intelligence/org-score \
  -H "Authorization: Bearer lk_live_<your-key>"
```
Or implement a cron job calling `snapshotGovernance(orgId)`.

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
| *(live data)* | Audit Management | Create via UI — no seed script |
| *(live data)* | Control Center™ | Controls from `seed-compliance-frameworks.mjs`; health computed on demand |
| *(live data)* | Trust Intelligence™ | Aggregates from all modules above — no seed needed, works immediately |

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

**Documents: ~67 total** · Assessments: 4 · Reviews: 3 · Expiring soon: 4 docs · Expired: 1 (Sify ISO 27001)

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

> No seed script. Create via UI or REST API.

**Quick E2E path:**
1. Create audit at `/audits/new` — type: Internal, scope: "Annual security audit", status: Planned
2. Add 2 findings (1 Critical + 1 High) via `/audits/[id]/findings/new`
3. Use AI Finding Generator on the second finding (paste an observation)
4. Add a CAPA to the critical finding (finding auto-moves to "remediating")
5. Start the audit → Status = In Progress
6. Generate AI summary on the audit detail page
7. View Full Report PDF at `/reports/audits/[id]`
8. Complete the audit

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

## E2E / Test Data

```bash
E2E_USER_EMAIL=test@example.com E2E_USER_PASSWORD=TestPass123! node scripts/seed-e2e.mjs
```

Then set `E2E_USER_EMAIL` + `E2E_USER_PASSWORD` in `.env.local` and run `npm run test:e2e`.

---

## Utility Scripts

| Script | Purpose |
|---|---|
| `check-db.mjs` | Quick table row counts for all 52 tables |
| `apply-sql.mjs <file>` | Apply raw SQL file to DB |
| `verify-db.mjs` | Deeper DB state verification |
| `verify-vendors.mjs` | Vendor data quality checks |

---

## Full Data Inventory (after all seeds)

| Table | Demo Rows |
|---|---|
| `organizations` | 1 |
| `memberships` | 1 owner |
| `vendors` | 15 (trust_score populated for all) |
| `vendor_documents` | ~67 |
| `vendor_types` | 7 (global defaults) |
| `vendor_type_documents` | ~50 |
| `assessments` | 4 |
| `assessment_responses` | ~68 |
| `frameworks` | 5 |
| `controls` | 174 (health_score = 0 until computed) |
| `evidence` | ~80 |
| `control_evidence_mappings` | ~104 |
| `policies` | 8 |
| `policy_versions` | 5 |
| `readiness_scores` | 5 |
| `gap_analysis` | ~107 open gaps |
| `billing_plans` | 3 |
| `subscriptions` | 1 (Starter) |
| `organization_settings` | 1 |
| `login_history` | 20 |
| `audit_logs` | ~30+ |
| `risks` | 20 |
| `risk_treatments` | 25 |
| `risk_reviews` | 8 |
| `risk_vendors` | 15 |
| `risk_controls` | 5 |
| `risk_frameworks` | 14 |
| `storage_providers` | 1 |
| `vendor_trust_history` | 15 (one per active vendor) |
| `control_frameworks` | 0 (populate via UI) |
| `control_vendors` | 0 (populate via UI) |
| `control_tests` | 0 (populate via UI) |
| `governance_snapshots` | 0 (populate via Trust Intelligence™ snapshot action) |
| **audits** | 0 (create via UI or API) |
| **audit_programs** | 0 (auto-generated when audit starts) |
| **audit_findings** | 0 (create via UI or API) |
| **corrective_actions** | 0 (create via UI or API) |

> After running all seeds, **`/trust-intelligence`** is immediately usable with a live Organizational Trust Score™ reflecting real governance data.
