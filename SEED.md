# AUDT — Demo Seed Data Reference

> Complete inventory of all demo seed data across every module.
> All scripts target the **"admin corp"** workspace (owner: `admin@audt.tech`).
> Every script is idempotent — safe to re-run.

---

## Quick Start (Full Demo)

Run in this order on a fresh DB after migrations:

```bash
npm run db:migrate
node scripts/apply-sql.mjs supabase/rls.sql
node scripts/apply-sql.mjs supabase/storage.sql
node scripts/apply-sql.mjs supabase/rls-risk-lens.sql
node scripts/apply-sql.mjs supabase/migrations/0010_trust_score.sql
node scripts/seed-templates.mjs
node scripts/seed-billing-plans.mjs --assign-all
node scripts/seed-demo.mjs
node scripts/seed-compliance-frameworks.mjs
node scripts/seed-compliance-demo.mjs
node scripts/seed-data-governance.mjs
node scripts/seed-risk-lens.mjs
node scripts/seed-trust-scores.mjs
```

---

## Script Index

| Script | Module | What it seeds |
|---|---|---|
| `seed-templates.mjs` | Vendor Hub™ | 7 default vendor type templates |
| `seed-billing-plans.mjs` | Settings | 3 billing plans; optionally assigns Starter to all orgs |
| `seed-demo.mjs` | Vendor Hub™ | 15 vendors · 67 documents · 4 assessments · 3 reviews · audit logs |
| `seed-compliance-frameworks.mjs` | Evidence Vault™ | 5 frameworks · 174 controls |
| `seed-compliance-demo.mjs` | Evidence Vault™ | Control statuses · 12 manual evidence · 104 mappings · 8 policies · gaps · readiness scores |
| `seed-data-governance.mjs` | Settings / Data Gov | Branding · login history · 25 rich audit events · doc storage metadata |
| `seed-risk-lens.mjs` | Risk Lens™ | 20 risks · 25 treatments · 8 reviews · 15 vendor links · 5 control links · 14 framework links |
| `seed-trust-scores.mjs` | Trust Score™ | Computes 6-component Trust Score™ for all 15 active vendors + seeds 1 history snapshot each |

---

## Module 1 — Vendor Hub™

### `seed-templates.mjs` — Vendor Type Templates (7)

Global default templates (no org — available to all orgs).

| ID suffix | Template | Required Docs | Optional Docs |
|---|---|---|---|
| `...0001` | Cloud Provider | ISO 27001, SOC 2 II, GST, MSA, DPA, Cyber Insurance | ISO 22301, VAPT |
| `...0002` | SaaS Vendor | ISO 27001, SOC 2 I, MSA, DPA, GST | SOC 2 II, VAPT, Cyber Insurance |
| `...0003` | IT Services | GST, MCA, MSA, NDA, Prof Indemnity | ISO 27001, MSME |
| `...0004` | Finance Vendor | RBI Auth, GST, MCA, MSA, DPA | ISO 27001, SOC 2 II |
| `...0005` | Staffing / Outsourcing | GST, MCA, MSA, NDA, MSME | Prof Indemnity, General Liability |
| `...0006` | Legal / Consulting | GST, MSA, NDA, Prof Indemnity | MCA |
| `...0007` | General Vendor | GST, MSA | NDA, General Liability |

---

### `seed-demo.mjs` — Vendors (15)

All vendors seeded into **admin corp** workspace.

| # | Vendor | Category | Risk | Score | Status | Key Notes |
|---|---|---|---|---|---|---|
| 1 | **Razorpay Software Pvt Ltd** | Fintech/Payments | Low | 94 | Active | 8 docs — exemplary. Cyber Insurance expiring in 20 days. |
| 2 | **Freshworks Inc** | SaaS/CRM | Low | 88 | Active | 5 docs. DPA expiring in 28 days — needs renewal. |
| 3 | **Tata Consultancy Services Ltd** | IT Services | Medium | 72 | Active | 5 docs. Professional Indemnity expiring in 15 days. |
| 4 | **Zoho Corporation Pvt Ltd** | SaaS | Low | 87 | Active | 5 docs — all valid. ISO 27001 + SOC 2 II. |
| 5 | **Yotta Data Services Pvt Ltd** | Cloud / Hosting | High | 35 | Active | Only 2 docs (GST, MCA). ISO, SOC 2, DPA, Insurance missing. |
| 6 | **Quess Corp Ltd** | Staffing / HR | Medium | 70 | Active | 4 docs. No security assessment done. |
| 7 | **Sify Technologies Ltd** | Network / Telecom | High | 40 | Active | ISO 27001 **expired** 2 months ago. Only 3 docs total. |
| 8 | **HDFC Bank Ltd** | Banking / NBFC | Low | 97 | Active | 7 docs — near-perfect. RBI auth + ISO + SOC 2. |
| 9 | **Wipro Limited** | IT Services | Medium | 78 | Active | 5 docs. No security assessment yet. |
| 10 | **Keka Technologies Pvt Ltd** | SaaS / HR | Low | 82 | Active | 5 docs — strong posture. |
| 11 | **Darwinbox Digital Solutions** | SaaS / HR | Medium | 65 | Active | DPA expiring in 15 days. Missing SOC 2. |
| 12 | **Infosys BPM Ltd** | IT Services | Medium | 76 | Active | Missing ISO 22301 (BCP). Handles finance BPO. |
| 13 | **Greytip Software Pvt Ltd** | SaaS / HR | Low | 78 | Active | Payroll platform. No AI summary seeded. |
| 14 | **Apollo HealthCo Ltd** | Healthcare | Critical | 28 | Active | Only GST on file. No DPA / security cert — critical gap. |
| 15 | **Birlasoft Ltd** | IT Services | Medium | 74 | Active | ERP/SAP partner. No AI summary seeded. |

**Documents seeded: ~67 total**

| Category | Count | Examples |
|---|---|---|
| Security certs | 18 | ISO 27001, SOC 2 I/II, VAPT Reports |
| Legal docs | 14 | MSA, DPA, NDA |
| Financial / Compliance | 12 | GST, PAN, RBI Auth, MSME, MCA |
| Insurance | 6 | Cyber Liability, Professional Indemnity |
| Quality | 4 | ISO 9001 |
| **Expired** | 1 | Sify ISO 27001:2013 |
| **Expiring soon** | 3 | Razorpay Cyber Ins (20d), TCS Prof Indem (15d), Darwinbox DPA (15d), Freshworks DPA (28d) |

**Assessments seeded: 4** (Razorpay, HDFC, Infosys BPM + one more)

---

## Module 2 — Evidence Vault™ (Compliance)

### `seed-compliance-frameworks.mjs` — Frameworks & Controls (5 frameworks, 174 controls)

| Framework | Controls | Standard |
|---|---|---|
| ISO 27001:2022 | 93 | Information security management |
| SOC 2 Type II | 33 | Trust Services Criteria |
| DPDP Act 2023 | 18 | India Digital Personal Data Protection |
| PCI DSS v4.0 | 12 | Payment card security |
| HIPAA | 18 | US healthcare data |

Pass `<orgId>` to seed for a specific org. Pass `--list` to see available orgs.

---

### `seed-compliance-demo.mjs` — Compliance State

**Control statuses** (realistic distribution by framework):

| Framework | Implemented | Partial | Not Applicable | Not Implemented |
|---|---|---|---|---|
| ISO 27001:2022 | 35 | 28 | 6 | 24 |
| SOC 2 Type II | 21 | 12 | 0 | 0 |
| DPDP Act 2023 | 12 | 3 | 3 | 0 |
| PCI DSS v4.0 | 3 | 2 | 0 | 7 |
| HIPAA | 2 | 2 | 4 | 10 |

**Manual Evidence (12 items):**

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

**Evidence-Control Mappings: ~104**
- ISO 27001: 10 evidence items mapped to 42 controls
- SOC 2: 7 evidence items mapped to 18 controls
- DPDP: 6 evidence items mapped to 10 controls
- PCI DSS + HIPAA: 4 evidence items mapped to 5 controls
- Vendor-sourced evidence: 20 vendor docs → A.5.19–A.5.23 (supplier controls)

**Policies (8):**

| Policy | Version | Status | Reviewer |
|---|---|---|---|
| Information Security Policy | 2.1 | Approved | CISO |
| Vendor Management Policy | 1.3 | Approved | VP Operations |
| Access Control Policy | 1.5 | Approved | CISO |
| Privacy Policy | 3.0 | Approved (overdue review) | DPO |
| Incident Response Policy | 2.0 | In Review | — |
| Business Continuity Policy | 1.0 | Draft | — |
| Data Retention Policy | 1.1 | Expired | — |
| Acceptable Use Policy | 1.0 | Draft | — |

**Gap analysis:** Run for all 5 frameworks. ~107 open gaps (not_implemented controls, unmapped controls, expired evidence, expired/overdue policies).

**Readiness scores** (approximate after seeding):

| Framework | Overall | Controls | Evidence | Policy |
|---|---|---|---|---|
| ISO 27001:2022 | ~55% | ~55% | ~40% | ~75% |
| SOC 2 Type II | ~70% | ~80% | ~50% | ~75% |
| DPDP Act 2023 | ~72% | ~75% | ~55% | ~75% |
| PCI DSS v4.0 | ~35% | ~30% | ~20% | ~75% |
| HIPAA | ~30% | ~25% | ~15% | ~75% |

---

## Module 3 — Settings & Organization Management

### `seed-billing-plans.mjs` — Billing Plans (3)

| Plan | Price | Max Users | Max Vendors | Max Storage |
|---|---|---|---|---|
| Starter | Free | 5 | 10 | 1 GB |
| Growth | ₹4,999/mo | 25 | 100 | 50 GB |
| Enterprise | Custom | Unlimited | Unlimited | 1 TB |

`--assign-all` assigns a Starter subscription to every org without one.

---

### `seed-data-governance.mjs` — Settings / Data Governance Demo

**Org branding:** Primary color `#6366f1`, Accent `#a78bfa`, report footer + email signature.

**Login history:** 20 realistic login events for the demo owner (success, failed attempt, new device).

**Audit log events (25):** Rich events covering all Module 1–3 actions:
- Vendor created/updated/deleted
- Documents uploaded/approved/rejected
- Assessment completed
- Team member invited / role changed
- API key created / revoked
- Integration connected
- Settings updated
- Data export requested

**Vendor document metadata backfill:** Adds `filename`, `content_type`, `file_size`, `storage_bucket`, `storage_provider` to all existing vendor_documents rows (realistic MIME types and sizes per document type).

---

## Module 4 — Audit Management

> Audit demo data is created inline via the UI (no seed script).
> The AI Auditor and PDF reports work against live audit data.
> To quickly create demo audits, use the "Create Audit" form at `/audits/new`.

**Tip:** To pre-populate audit data, create 2–3 audits with status `active`, add findings and CAPAs via the UI or API, then use the AI Auditor at `/audits/ai` to generate the executive report.

---

## Trust Score™

### `seed-trust-scores.mjs` — Vendor Trust Scores

**Prerequisites:** All prior seeds must be run first (vendors, docs, assessments, reviews, risk-lens).

Computes and stores the Trust Score™ for every active vendor in the org. Each vendor gets:
- One row in `vendor_trust_history` with all 6 component scores + `trigger_event = "seed"`
- `trust_score` and `trust_score_at` updated on the `vendors` row

**Expected scores after full demo seed (all 15 vendors):**

| Vendor | Est. Trust Score | Level | Key Drivers |
|---|---|---|---|
| **HDFC Bank Ltd** | ~85–90 | Strong | 7 valid docs, low risk, high compliance, has assessment |
| **Razorpay Software Pvt Ltd** | ~80–86 | Strong | 8 docs (1 expiring), low risk, 94 compliance, has assessment |
| **Keka Technologies Pvt Ltd** | ~75–82 | Strong / Moderate | 5 valid docs, low risk, 82 compliance, no assessment |
| **Zoho Corporation Pvt Ltd** | ~75–82 | Strong / Moderate | 5 valid docs, low risk, 87 compliance, no assessment |
| **Freshworks Inc** | ~70–78 | Moderate | DPA expiring, low risk, 88 compliance, no assessment |
| **Greytip Software Pvt Ltd** | ~70–78 | Moderate | 5 docs valid, low risk, 78 compliance, no review |
| **Wipro Limited** | ~68–76 | Moderate | 5 docs, medium risk, 78 compliance, no assessment |
| **Infosys BPM Ltd** | ~65–73 | Moderate | Missing BCP doc, medium risk, 76 compliance |
| **TCS Ltd** | ~65–73 | Moderate | 1 expiring doc (Prof Indemnity), medium risk, 72 compliance |
| **Birlasoft Ltd** | ~62–70 | Moderate | Medium risk, 74 compliance, no reviews |
| **Quess Corp Ltd** | ~58–66 | Needs Attention | No assessment, medium risk, 70 compliance, no review |
| **Darwinbox Digital Solutions** | ~55–65 | Needs Attention | DPA expiring, missing SOC 2, medium risk, 65 compliance |
| **Sify Technologies Ltd** | ~40–52 | High Concern | 1 expired ISO 27001, high risk, 40 compliance, no assessment |
| **Yotta Data Services Pvt Ltd** | ~30–42 | High Concern | Only 2 docs, high risk, 35 compliance, no assessment, no review |
| **Apollo HealthCo Ltd** | ~18–30 | High Concern | 1 doc only, critical risk, 28 compliance, no assessment, no review |

**Component scoring summary:**
- **Evidence (25%):** Apollo/Yotta score lowest — almost no docs. HDFC/Razorpay score highest (all valid, certs current).
- **Compliance (20%):** Passes `vendor.complianceScore` directly — same as the existing ring score.
- **Risk (20%):** Vendors with linked critical/high risks from Risk Lens™ (Phishing → Razorpay, Data Breach → multiple, DPA → Freshworks/Darwinbox) are penalised.
- **Assessment (15%):** Only 4 vendors have completed assessments (Razorpay, HDFC, Infosys BPM, one other). Others receive baseline score of 30.
- **Operational (10%):** Vendors with no reviews or open document requests score lower.
- **Freshness (10%):** Vendors with recent reviews/assessments score higher.

**History rows created: 15** (one per active vendor, `trigger_event = "seed"`)

---

## Module 5 — Risk Lens™

### `seed-risk-lens.mjs` — Risks, Treatments & Reviews (20 risks)

**Prerequisites:** `seed-demo.mjs` and `seed-compliance-frameworks.mjs` must be run first.

**20 Risks across 8 categories:**

| # | Risk Title | Category | Status | Score | Priority |
|---|---|---|---|---|---|
| 1 | Third-Party Vendor Data Breach | Operational | Open | 15/25 | High |
| 2 | Business Continuity Failure — Cloud Outage | Operational | Mitigating | 10/25 | High |
| 3 | Key Person Dependency — IT Operations | Operational | Open | 9/25 | Medium |
| 4 | Payroll Processing Error — HR SaaS Platform | Operational | Open | 8/25 | Medium |
| 5 | Ransomware Attack on Production Systems | Cyber Security | Mitigating | 15/25 | High |
| 6 | Phishing and Social Engineering Attacks | Cyber Security | Open | 16/25 | Critical |
| 7 | Privileged Access Misuse | Cyber Security | Open | 10/25 | High |
| 8 | Unpatched Vulnerability Exploited in Production | Cyber Security | Open | 12/25 | High |
| 9 | DPDP Act Non-Compliance — Consent Management | Compliance | Mitigating | 15/25 | High |
| 10 | ISO 27001 Certification Lapse | Compliance | Open | 8/25 | Medium |
| 11 | Overdue Policy Reviews | Compliance | Accepted | 12/25 | High |
| 12 | Vendor Contract Dispute — IT Services | Financial | Open | 6/25 | Medium |
| 13 | Cost Overrun on Cloud Infrastructure | Financial | Open | 9/25 | Medium |
| 14 | Payment Fraud — Gateway Compromise | Financial | Mitigating | 10/25 | High |
| 15 | Vendor Lock-In — Single Cloud Provider | Strategic | Accepted | 6/25 | Medium |
| 16 | Regulatory Change — New RBI / SEBI Directive | Strategic | Open | 12/25 | High |
| 17 | Data Breach Public Disclosure | Custom (Reputational) | Open | 10/25 | High |
| 18 | Apollo HealthCo — Employee Health Data Exposure | Custom (Reputational) | Open | 15/25 | High |
| 19 | Expired Data Processing Agreements | Legal | Open | 16/25 | Critical |
| 20 | Employment Law Violation — Staffing Vendor | Legal | Open | 8/25 | Medium |

**Summary after seeding:**
- Total: 20 risks (14 open · 4 mitigating · 2 accepted)
- Critical (score ≥ 16): 2 risks
- Treatment actions: 25 (across 10 risks)
- Review records: 8 (across 5 risks)

**Treatment actions (25) — highlights:**

| Risk | Action | Status |
|---|---|---|
| Third-Party Vendor Data Breach | Implement vendor security scorecard | In Progress (60%) |
| Third-Party Vendor Data Breach | Enforce DPA renewal 90 days before expiry | Completed ✓ |
| Ransomware Attack | Implement immutable S3 backups | In Progress (75%) |
| Ransomware Attack | Deploy EDR across all endpoints | In Progress (40%) |
| Phishing Attacks | Deploy phishing simulation platform | In Progress (50%) |
| Phishing Attacks | Enable MFA for all staff | In Progress (80%) |
| Phishing Attacks | Security awareness training | Completed ✓ |
| DPDP Compliance | Implement consent management platform | In Progress (35%) |
| DPDP Compliance | Appoint DPO and register with Board | Open (5%) |
| Payment Fraud | Implement webhook HMAC validation | Completed ✓ |
| Expired DPAs | Renew Freshworks DPA | In Progress (80%) |
| Privileged Access | Deploy PAM solution | Open (0%) |
| Apollo HealthCo | Issue formal notice requiring DPA | In Progress (50%) |
| … | … | … |

**Vendor links (15):** Risks linked to Razorpay, Freshworks, Yotta, Sify, HDFC, Apollo, Darwinbox, Quess, Wipro, Infosys, Keka, Greytip.

**Control links (5):** Top risks linked to ISO 27001 and DPDP controls.

**Framework links (14):** Risks mapped to relevant frameworks (ISO 27001, DPDP, SOC 2, PCI DSS).

---

## E2E / Test Data

### `seed-e2e.mjs` — End-to-End Test Workspace

Creates a dedicated E2E test org + user separate from admin corp.

```bash
E2E_USER_EMAIL=test@example.com E2E_USER_PASSWORD=TestPass123! node scripts/seed-e2e.mjs
```

Or set `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` in `.env.local` first.

---

## Utility Scripts

| Script | Purpose |
|---|---|
| `check-db.mjs` | Quick table row counts for all 48 tables |
| `apply-sql.mjs <file>` | Apply raw SQL file to DB (migrations, RLS, storage policies) |
| `verify-db.mjs` | Deeper DB state verification |
| `verify-vendors.mjs` | Vendor data quality checks |

---

## Full Data Inventory (after all seeds)

| Table | Demo Rows |
|---|---|
| `organizations` | 1 (admin corp) |
| `memberships` | 1 owner |
| `vendors` | 15 |
| `vendor_documents` | ~67 |
| `vendor_types` | 7 (global defaults) |
| `vendor_type_documents` | ~50 (across 7 templates) |
| `assessments` | 4 |
| `assessment_responses` | ~68 |
| `frameworks` | 5 |
| `controls` | 174 |
| `evidence` | ~80 (67 from vendors + 12 manual + vendor assessments/reviews) |
| `control_evidence_mappings` | ~104 |
| `policies` | 8 |
| `policy_versions` | 5 (approved/expired policies) |
| `readiness_scores` | 5 (one per framework) |
| `gap_analysis` | ~107 open gaps |
| `billing_plans` | 3 (Starter/Growth/Enterprise) |
| `subscriptions` | 1 (Starter for admin corp) |
| `organization_settings` | 1 (branding) |
| `login_history` | 20 |
| `audit_logs` | ~30 (seed-data-governance + regular actions) |
| `risks` | 20 |
| `risk_treatments` | 25 |
| `risk_reviews` | 8 |
| `risk_vendors` | 15 |
| `risk_controls` | 5 |
| `risk_frameworks` | 14 |
| `storage_providers` | 1 (supabase/platform) |
| `vendor_trust_history` | 15 (one per active vendor) |

> **vendors.trust_score** is also populated for all 15 active vendors after `seed-trust-scores.mjs` runs.
