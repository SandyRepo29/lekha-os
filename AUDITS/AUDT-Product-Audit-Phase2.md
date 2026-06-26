# AUDT Product Audit — Phase 2
## Domain Model & Entity Relationship Assessment

**Version:** 1.0  
**Date:** 2026-06-26  
**Entities evaluated:** 22 core business entities  
**Scope:** Business domain model only — no code review, no UI assessment

---

## Contents

1. [Complete Business Entity Inventory](#1-complete-business-entity-inventory)
2. [Entity Ownership Matrix](#2-entity-ownership-matrix)
3. [Entity Relationship Map](#3-entity-relationship-map)
4. [Cross-Module Data Flow Analysis](#4-cross-module-data-flow-analysis)
5. [Entity Lifecycle Assessment](#5-entity-lifecycle-assessment)
6. [CRUD Coverage Matrix](#6-crud-coverage-matrix)
7. [AI Coverage Matrix](#7-ai-coverage-matrix)
8. [Reporting Coverage Matrix](#8-reporting-coverage-matrix)
9. [Entity Health Scorecard](#9-entity-health-scorecard)
10. [Strategic Recommendations](#10-strategic-recommendations)

---

## 1. Complete Business Entity Inventory

### Group A — Governance Subjects (things being governed)

#### Vendor
| Field | Value |
|---|---|
| **Description** | External organisation providing goods or services. The primary subject of the Vendor Trust Lifecycle. |
| **Owner module** | Vendor Hub™ |
| **Created by** | Vendor Hub™ (manual), Integration Hub™ (sync), Third-Party Risk Exchange™ (directory) |
| **Updated by** | Vendor Hub™, Trust Score™ (score fields), Integration Hub™ (sync) |
| **Consumed by** | Risk Lens™, Evidence Vault™, Contract Governance™, Audit Management, Trust Score™, Trust Intelligence™, Trust Graph™, Issue & Remediation Hub™, DPDP Privacy™, Asset Intelligence™ |
| **Reported by** | Trust Intelligence™, Executive Reporting™, Governance Benchmarking™, Vendor Hub™ dashboard |
| **AI usage** | AI-extracted document fields, AI vendor brief (cached), NL search, Trust Score™ narrative, AI Risk Officer context |

#### Asset
| Field | Value |
|---|---|
| **Description** | Enterprise technical or business asset — application, database, API, cloud resource, data asset, business process, AI system, network asset, endpoint. |
| **Owner module** | Asset Intelligence™ |
| **Created by** | Asset Intelligence™ (manual + bulk) |
| **Updated by** | Asset Intelligence™, Integration Hub™ (sync), Security Command Center™ (vendor monitoring assets are a sub-type) |
| **Consumed by** | Risk Lens™ (via asset risks), DPDP Privacy™ (data assets), AI Governance™ (AI system sub-type), Trust Graph™ |
| **Reported by** | Asset Intelligence™ dashboard, Executive Reporting™ |
| **AI usage** | Advisory summary, impact analysis, dependency chain analysis, NL chat |

#### AI System
| Field | Value |
|---|---|
| **Description** | An AI model, product, or service deployed within or by the organisation. Sub-type of Asset with additional governance attributes. |
| **Owner module** | AI Governance™ |
| **Created by** | AI Governance™ (manual) |
| **Updated by** | AI Governance™ |
| **Consumed by** | Asset Intelligence™ (junction: asset_ai_systems), Trust Graph™, Security Command Center™ (prompt audit logs) |
| **Reported by** | AI Governance™ dashboard, Executive Reporting™ |
| **AI usage** | Governance Copilot™ summary, AI Risk Advisory™, Compliance Readiness™ analysis, NL chat |

---

### Group B — Risk & Compliance Instruments

#### Risk
| Field | Value |
|---|---|
| **Description** | An identified threat or uncertainty that may adversely affect the organisation or a vendor. Central entity linking vendors, controls, evidence, findings, policies, and frameworks. |
| **Owner module** | Risk Lens™ |
| **Created by** | Risk Lens™ (manual). No other module auto-creates risks. |
| **Updated by** | Risk Lens™ (status, score, treatment), Trust Score™ (read — risk inputs vendor trust score) |
| **Consumed by** | Trust Score™, Trust Intelligence™, Control Center™, Evidence Vault™ (gap analysis), Trust Graph™, Contract Governance™ (contract risks junction), Asset Intelligence™ (asset risks junction), AI Governance™ (AI risk register) |
| **Reported by** | Risk Lens™ dashboard, Trust Intelligence™, Executive Reporting™, Governance Benchmarking™ |
| **AI usage** | Risk narrative (cached), risk from observation (generative), mitigation recommendations, executive report, NL chat |

#### Control
| Field | Value |
|---|---|
| **Description** | A safeguard or countermeasure used to manage risks and satisfy compliance requirements. |
| **Owner module** | Control Center™ (operational management); Evidence Vault™ (compliance context — 174 seeded controls) |
| **Created by** | Evidence Vault™ (seed import — 174 controls across 5 frameworks), Control Center™ (standalone controls, frameworkId = null) |
| **Updated by** | Control Center™ (health score, test records, objective, frequency, automation level), Evidence Vault™ (status, evidence mappings) |
| **Consumed by** | Risk Lens™ (risk_controls junction), Policy Governance™ (policy_controls junction), Contract Governance™ (contract_controls junction), Audit Management (audit_programs linked to controls), Continuous Compliance™ (control_validations), Asset Intelligence™ (asset_controls junction), Regulatory Intelligence™ (obligation_mappings), Trust Graph™ |
| **Reported by** | Control Center™ dashboard, Trust Intelligence™ (control health tab), Governance Benchmarking™, Executive Reporting™ |
| **AI usage** | Control narrative (cached), executive summary (cached), gap detection, NL chat |

#### Policy
| Field | Value |
|---|---|
| **Description** | Formal governance policy document — version-controlled with approval workflow. |
| **Owner module** | Policy Governance™ |
| **Created by** | Policy Governance™ |
| **Updated by** | Policy Governance™ (versions, attestations, reviews) |
| **Consumed by** | Risk Lens™ (risk_policies junction), Contract Governance™ (contract_policies junction), Evidence Vault™ (evidence bridge), Trust Graph™ |
| **Reported by** | Policy Governance™ dashboard, Evidence Vault™ (policies tab), Executive Reporting™ |
| **AI usage** | Policy summary, compliance analysis, NL context |

#### Framework
| Field | Value |
|---|---|
| **Description** | A compliance framework (ISO 27001, SOC 2, DPDP, PCI DSS, HIPAA, custom) defining the structure of controls and readiness scoring. |
| **Owner module** | Evidence Vault™ |
| **Created by** | Evidence Vault™ (manual or via seed — 5 standard frameworks), Regulatory Intelligence™ (regulations reference frameworks implicitly) |
| **Updated by** | Evidence Vault™ (readiness recompute on control/evidence change), Control Center™ (control_frameworks junction — cross-framework mapping) |
| **Consumed by** | Risk Lens™ (risk_frameworks junction), Audit Management (framework_id on audits), Policy Governance™ (policy_frameworks junction), Continuous Compliance™ (framework_mappings), Trust Graph™, Trust Intelligence™ (compliance tab), Governance Benchmarking™ |
| **Reported by** | Evidence Vault™ dashboard, Trust Intelligence™, Governance Benchmarking™, Executive Reporting™ |
| **AI usage** | Framework summary (cached), readiness explanation, gap narrative, executive summary, NL chat |

#### Evidence
| Field | Value |
|---|---|
| **Description** | Artefact (document, screenshot, record) that demonstrates a control is satisfied or a compliance requirement is met. |
| **Owner module** | Evidence Vault™ |
| **Created by** | Evidence Vault™ (manual), Vendor Hub™ (auto-import: vendor documents, assessments, reviews bridge to evidence), Continuous Compliance™ (automated check runs generate evidence), Auditor Collaboration™ (evidence responses) |
| **Updated by** | Evidence Vault™ (status: collected → approved → expired) |
| **Consumed by** | Control Center™ (control_evidence_mappings — evidence satisfies controls), Risk Lens™ (risk_evidence junction), Trust Score™ (evidence component — doc count, expiry, required missing), Trust Graph™ |
| **Reported by** | Evidence Vault™ dashboard, Trust Intelligence™, Continuous Compliance™, Executive Reporting™ |
| **AI usage** | Gap narrative, AI extraction (vendor documents), evidence gap analysis (Auditor Collaboration™) |

#### Regulation / Obligation
| Field | Value |
|---|---|
| **Description** | A legal or regulatory requirement (Regulation) and the specific compliance obligation it imposes (Obligation). 18 built-in global regulations. |
| **Owner module** | Regulatory Intelligence™ |
| **Created by** | Regulatory Intelligence™ (org-specific), migration seed (18 global built-ins with organization_id = NULL) |
| **Updated by** | Regulatory Intelligence™ (changes, assessments, obligations status) |
| **Consumed by** | DPDP Privacy™ (DPDP regulation link on data assets), Asset Intelligence™ (asset_regulations junction), Control Center™ (via obligation_mappings — obligations link to controls), Trust Graph™ |
| **Reported by** | Regulatory Intelligence™ dashboard (readiness score, horizon), Executive Reporting™ |
| **AI usage** | Advisory summary (cached), per-change analysis, obligation extraction, control mapping suggestions, compliance horizon forecast, NL chat |

---

### Group C — Assurance Activities

#### Assessment (Security)
| Field | Value |
|---|---|
| **Description** | A structured security evaluation of a vendor using a fixed 17-question questionnaire. Produces a score 0–100 and AI summary. |
| **Owner module** | Vendor Hub™ |
| **Created by** | Vendor Hub™ |
| **Updated by** | Vendor Hub™ |
| **Consumed by** | Trust Score™ (assessment component — latest score), Evidence Vault™ (auto-import as evidence), Trust Graph™ |
| **Reported by** | Vendor Hub™ (vendor detail), Trust Intelligence™ (vendor trust tab) |
| **AI usage** | AI assessment summary |

#### Audit
| Field | Value |
|---|---|
| **Description** | A formal audit engagement — internal or external — with scope, objective, auditor, findings, and CAPAs. |
| **Owner module** | Audit Management |
| **Created by** | Audit Management (manual) |
| **Updated by** | Audit Management (status: planned → active → completed / cancelled), Auditor Collaboration™ (external rooms link to audits) |
| **Consumed by** | Trust Intelligence™ (audit readiness component), Governance Benchmarking™, Executive Reporting™, Trust Graph™ |
| **Reported by** | Audit Management (dashboard + PDFs + CSVs), Executive Reporting™, Trust Intelligence™ |
| **AI usage** | Audit summary (cached), AI Finding Generator, CAPA suggestions, executive report (cached), NL chat |

#### Finding (Audit)
| Field | Value |
|---|---|
| **Description** | A non-conformance, observation, or recommendation identified during an audit. Linked to a control and optionally to evidence. |
| **Owner module** | Audit Management |
| **Created by** | Audit Management (manual + AI generator) |
| **Updated by** | Audit Management (status: open → remediating → closed / accepted), Issue & Remediation Hub™ (does not write to audit_findings — creates separate Issue records) |
| **Consumed by** | Risk Lens™ (risk_findings junction — findings linked to risks), Issue & Remediation Hub™ (sourceModule = audit, but creates a separate Issue record — no FK to audit_findings), Trust Graph™ |
| **Reported by** | Audit Management (findings tab + PDFs + CSVs), Executive Reporting™ |
| **AI usage** | AI Finding Generator (observation → structured finding), AI context for CAPA suggestions |

#### CAPA (Corrective Action)
| Field | Value |
|---|---|
| **Description** | A corrective and preventive action arising from an audit finding. Has an owner, due date, and completion status. |
| **Owner module** | Audit Management |
| **Created by** | Audit Management (manual + AI CAPA Suggestions), auto-links to finding on create |
| **Updated by** | Audit Management (status: open → in_progress → completed / overdue) |
| **Consumed by** | Continuous Monitoring™ (overdue CAPA monitoring rule), Trust Intelligence™ (audit readiness component — overdue CAPAs reduce score), Executive Reporting™ |
| **Reported by** | Audit Management (CAPAs tab + PDFs + CSVs), Trust Intelligence™ |
| **AI usage** | AI CAPA Suggestions (3 per finding), overdue context in executive reports |

#### External Finding
| Field | Value |
|---|---|
| **Description** | A finding raised by an external auditor inside an Audit Room. Separate entity from internal audit_findings. |
| **Owner module** | Auditor Collaboration™ |
| **Created by** | Auditor Collaboration™ (external auditor) |
| **Updated by** | Auditor Collaboration™ (status: open → in_remediation → verified → closed / accepted) |
| **Consumed by** | Not consumed by any other module |
| **Reported by** | Auditor Collaboration™ dashboard only |
| **AI usage** | AI finding drafter, evidence gap analysis context |

---

### Group D — Remediation Instruments

#### Issue
| Field | Value |
|---|---|
| **Description** | A governance problem requiring resolution. Sourced from any module. Includes tasks, exceptions, escalations, and SLA tracking. |
| **Owner module** | Issue & Remediation Hub™ |
| **Created by** | Issue & Remediation Hub™ (manual + AI generator). No other module auto-creates Issues. |
| **Updated by** | Issue & Remediation Hub™ |
| **Consumed by** | Continuous Monitoring™ (issue_overdue, issue_critical_open, issue_sla_breach monitoring rules), Trust Graph™ |
| **Reported by** | Issue & Remediation Hub™ dashboard, Executive Reporting™ |
| **AI usage** | AI Issue Generator, AI Remediation Planner, executive summary, NL chat |

#### Risk Treatment
| Field | Value |
|---|---|
| **Description** | An action taken to mitigate, accept, transfer, or avoid a specific risk. Distinct from CAPAs and Issues. |
| **Owner module** | Risk Lens™ |
| **Created by** | Risk Lens™ |
| **Updated by** | Risk Lens™ (status, progress %) |
| **Consumed by** | Trust Score™ (operational component — treatment activity), Trust Intelligence™ |
| **Reported by** | Risk Lens™ (treatments tab + CSV), Executive Reporting™ |
| **AI usage** | Mitigation recommendations context |

---

### Group E — Contracts & Legal

#### Contract
| Field | Value |
|---|---|
| **Description** | A formal agreement with a vendor. Tracks clauses, obligations, health score, and renewals. |
| **Owner module** | Contract Governance™ |
| **Created by** | Contract Governance™ |
| **Updated by** | Contract Governance™ (health score, obligations, clauses, renewal status) |
| **Consumed by** | Trust Score™ (contract health component — 10% weight), Risk Lens™ (contract_risks junction), Asset Intelligence™ (asset_contracts junction), Vendor Hub™ (vendor detail — Contracts tab), Trust Graph™ |
| **Reported by** | Contract Governance™ dashboard, Executive Reporting™, Governance Benchmarking™ |
| **AI usage** | Contract Intelligence™ — health analysis, renewal risk, executive summary, NL chat |

---

### Group F — Platform Entities

#### User / Profile
| Field | Value |
|---|---|
| **Description** | An authenticated human actor. Mirrors Supabase Auth. Extended with jobTitle, department, phone, timezone, language, password_changed_at. |
| **Owner module** | Settings & Org Management |
| **Created by** | Auth flow (signup / team invite) |
| **Updated by** | Settings & Org Management (profile), Security Command Center™ (MFA status, sessions, trusted devices) |
| **Consumed by** | All modules (actor on audit logs, owner fields on risks, controls, issues, CAPAs) |
| **Reported by** | Settings (team tab), Security Command Center™ (sessions tab), Audit Logs |
| **AI usage** | NL chat context (session user), no direct AI entity |

#### Organisation / Team
| Field | Value |
|---|---|
| **Description** | Tenant boundary. All data is org-scoped via RLS. Memberships define user roles (7 roles). |
| **Owner module** | Settings & Org Management |
| **Created by** | Signup / onboarding wizard |
| **Updated by** | Settings & Org Management (name, branding, industry, size), Billing (subscription status) |
| **Consumed by** | All 32 modules (RLS gates every query on organization_id) |
| **Reported by** | Trust Intelligence™ (Org Trust Score™), Executive Reporting™, Governance Benchmarking™ |
| **AI usage** | Context for all AI summaries and NL chat sessions |

#### Integration
| Field | Value |
|---|---|
| **Description** | An authenticated connection to an external system (Okta, GitHub, AWS, Jira, Slack, etc.). Config stored AES-256-GCM encrypted. |
| **Owner module** | Integration Hub™ (operational). Settings & Org Management (legacy — 10-provider simpler model in /settings/integrations). |
| **Created by** | Integration Hub™ (35+ connectors), Settings / Integrations (10 providers) |
| **Updated by** | Integration Hub™ (sync status, events), Settings / Integrations (connect / disconnect) |
| **Consumed by** | Continuous Compliance™ (checks pull from integration syncs), Evidence Vault™ (auto-collect evidence from syncs) |
| **Reported by** | Integration Hub™ dashboard, Continuous Compliance™ |
| **AI usage** | AI Integration Advisor™ — health summary, connector recommendations, NL chat |

#### Workflow
| Field | Value |
|---|---|
| **Description** | An automated governance process — trigger → condition → action. Managed by Workflow Studio™. |
| **Owner module** | Workflow Studio™ |
| **Created by** | Workflow Studio™ |
| **Updated by** | Workflow Studio™ |
| **Consumed by** | Not referenced by any other module via FK. No module surfaces "trigger workflow" in context. |
| **Reported by** | Workflow Studio™ only |
| **AI usage** | AI workflow generator |

#### Report
| Field | Value |
|---|---|
| **Description** | A generated artefact — PDF, CSV, or analytics snapshot — representing a point-in-time view of one or more entities. |
| **Owner module** | Distributed — each module owns its reports. Executive Reporting™ provides cross-module board reports. |
| **Created by** | Every module (PDFs, CSVs). Executive Reporting™ (board reports). Auditor Collaboration™ (audit room documents). |
| **Updated by** | N/A — reports are immutable snapshots |
| **Consumed by** | Auditor Collaboration™ (documents shared into audit rooms), Trust Verification Authority™ (evidence for verification programs) |
| **Reported by** | Executive Reporting™ (report history tab) |
| **AI usage** | AI narrative generation for PDFs (compliance, audit, risk, trust score) |

#### Governance Agent
| Field | Value |
|---|---|
| **Description** | An AI agent configured to monitor, observe, recommend, and (with approval) act across governance modules. |
| **Owner module** | Governance Agent Framework™ |
| **Created by** | Governance Agent Framework™ |
| **Updated by** | Governance Agent Framework™ (runs, observations, recommendations, actions) |
| **Consumed by** | All modules conceptually (agents observe data across all modules) — no FK relationships from other module tables to governance_agents |
| **Reported by** | Governance Agent Framework™ dashboard, Trust Intelligence™ (recommendations tab) |
| **AI usage** | Core entity IS an AI entity — every agent run uses Gemini |

#### Trust Score (Vendor)
| Field | Value |
|---|---|
| **Description** | A 7-component composite score (0–100) representing a vendor's governance trustworthiness. Computed on demand, cached, stored in history. |
| **Owner module** | Trust Score™ (engine) + Vendor Hub™ (vendor_trust_history table owner) |
| **Created by** | Trust Score™ service (computeAndSaveTrustScore) |
| **Updated by** | Trust Score™ service (on page load if stale > 1h, or on Recalculate action) |
| **Consumed by** | Trust Intelligence™ (vendor trust component), Governance Benchmarking™, Third-Party Risk Exchange™, Trust Verification Authority™ (readiness score input), Trust Graph™ |
| **Reported by** | Vendor Hub™ (trust score tab), Trust Intelligence™, Executive Reporting™ |
| **AI usage** | AI narrative (cached 24h per vendor) |

---

## 2. Entity Ownership Matrix

### Ownership conflicts and shared write access

| Entity | Primary owner | Also written by | Conflict severity |
|---|---|---|---|
| **Control** | Control Center™ | Evidence Vault™ (creates 174 controls via seed/import; also updates status) | ⚠️ Moderate — same DB table (`controls`), two modules treat it as home |
| **Evidence** | Evidence Vault™ | Vendor Hub™ (auto-import of docs/assessments/reviews as evidence records), Continuous Compliance™ (check runs generate evidence), Auditor Collaboration™ (evidence responses) | ⚠️ Moderate — multiple creators, single owner |
| **Integration** | Integration Hub™ (35+ connectors) | Settings / Integrations (10-provider legacy model, separate `integrations` table) | ❌ High — two independent integration stores with no relationship; data is duplicated across `integrations` (Settings) and `integration_instances` (Hub) |
| **Finding** | Audit Management (`audit_findings`) | Auditor Collaboration™ (`external_findings` — separate table) | ⚠️ Moderate — two finding entities with no cross-reference; remediation is tracked separately per entity |
| **Remediation action** | None — three independent owners | Audit Management (CAPAs), Issue & Remediation Hub™ (Issues), Risk Lens™ (Risk Treatments) | ❌ High — no unified remediation entity; no FK relationships between the three tables |
| **Trust Score** | Trust Score™ / Vendor Hub™ | (computed only — no other module writes trust score records) | ✅ Clean |
| **Vendor** | Vendor Hub™ | Integration Hub™ (sync may update vendor fields) | ✅ Acceptable — clear primary owner |
| **Risk** | Risk Lens™ | (no other module creates or updates risks) | ✅ Clean |
| **Audit** | Audit Management | Auditor Collaboration™ (audit rooms reference audits but do not modify `audits` table directly) | ✅ Clean |
| **Policy** | Policy Governance™ | Evidence Vault™ (reads policies as evidence context) | ✅ Clean |
| **Contract** | Contract Governance™ | (no other module writes contracts) | ✅ Clean |
| **Asset** | Asset Intelligence™ | Security Command Center™ (vendor_monitoring_assets is a sub-type not FK-linked to assets table) | ⚠️ Moderate — monitoring assets are not the same entity as governance assets |
| **Regulation** | Regulatory Intelligence™ | Migration seed (18 global built-ins, org_id = NULL) | ✅ Clean |
| **Workflow** | Workflow Studio™ | (no other module creates workflows) | ✅ Clean — but also not consumed anywhere |

### Single source of truth summary

| Status | Count | Entities |
|---|---|---|
| ✅ Clean single owner | 10 | Risk, Audit, Policy, Contract, Regulation, Trust Score, Workflow, User, Organisation, Governance Agent |
| ⚠️ Shared writes (manageable) | 7 | Control, Evidence, Asset, Finding, Vendor, Assessment, Report |
| ❌ Ownership conflict | 2 | Integration (dual store), Remediation Action (three independent tables) |

---

## 3. Entity Relationship Map

### Core entity relationships

```
Organisation (1)
  ├── has many → Vendors (M)
  ├── has many → Assets (M)
  ├── has many → Risks (M)
  ├── has many → Controls (M)
  ├── has many → Frameworks (M)
  ├── has many → Policies (M)
  ├── has many → Audits (M)
  ├── has many → Contracts (M)
  ├── has many → Issues (M)
  ├── has many → Regulations / Obligations (M + global shared)
  ├── has many → Users / Memberships (M)
  └── has one  → Org Trust Score (1)

Vendor (1)
  ├── has many → Documents / Evidence (M)          [vendor_documents]
  ├── has many → Assessments (M)                   [assessments]
  ├── has many → Reviews (M)                        [vendor_reviews]
  ├── has many → Document Requests (M)              [document_requests]
  ├── has many → Trust Score History (M)            [vendor_trust_history]
  ├── has many ↔ Risks (M:M)                        [risk_vendors]
  ├── has many ↔ Controls (M:M)                     [control_vendors]
  ├── has many → Contracts (M)                      [contracts.vendor_id]
  └── has one  → Vendor Type / Template (1)         [vendor_types]

Risk (1)
  ├── has many → Treatments (M)                     [risk_treatments]
  ├── has many → Reviews (M)                        [risk_reviews]
  ├── has many ↔ Vendors (M:M)                      [risk_vendors]
  ├── has many ↔ Controls (M:M)                     [risk_controls]
  ├── has many ↔ Findings (M:M)                     [risk_findings]
  ├── has many ↔ Policies (M:M)                     [risk_policies]
  ├── has many ↔ Frameworks (M:M)                   [risk_frameworks]
  └── has many ↔ Evidence (M:M)                     [risk_evidence]

Control (1)
  ├── has many → Test Records (M)                   [control_tests]
  ├── has many ↔ Frameworks (M:M)                   [control_frameworks — cross-framework mapping]
  ├── has many ↔ Vendors (M:M)                      [control_vendors]
  ├── has many ↔ Evidence (M:M)                     [control_evidence_mappings]
  ├── has many ↔ Risks (M:M)                        [risk_controls]
  ├── has many ↔ Policies (M:M)                     [policy_controls]
  ├── has many ↔ Contracts (M:M)                    [contract_controls]
  ├── has many ↔ Assets (M:M)                       [asset_controls]
  ├── has many ↔ Obligations (M:M)                  [obligation_mappings]
  └── belongs to → Framework (1, nullable)          [controls.framework_id — nullable since migration 0011]

Audit (1)
  ├── has many → Program Items (M)                  [audit_programs — linked to controls]
  ├── has many → Findings (M)                       [audit_findings]
  ├── has many → Reports (M)                        [audit_reports]
  ├── belongs to → Framework (1, nullable)          [audits.framework_id]
  └── Finding (1)
        └── has many → CAPAs (M)                   [corrective_actions.finding_id]

Contract (1)
  ├── has many → Clauses (M)                        [contract_clauses]
  ├── has many → Obligations (M)                    [contract_obligations]
  ├── has many ↔ Risks (M:M)                        [contract_risks]
  ├── has many ↔ Controls (M:M)                     [contract_controls]
  ├── has many ↔ Policies (M:M)                     [contract_policies]
  ├── has many ↔ Assets (M:M)                       [asset_contracts]
  └── belongs to → Vendor (1)                       [contracts.vendor_id]

Asset (1)
  ├── has many → Reviews (M)                        [asset_reviews]
  ├── has many → Alerts (M)                         [asset_alerts]
  ├── has many → Snapshots (M)                      [asset_snapshots]
  ├── has many ↔ Risks (M:M)                        [asset_risks]
  ├── has many ↔ Controls (M:M)                     [asset_controls]
  ├── has many ↔ Vendors (M:M)                      [asset_vendors]
  ├── has many ↔ Contracts (M:M)                    [asset_contracts]
  ├── has many ↔ Regulations (M:M)                  [asset_regulations]
  └── has many ↔ AI Systems (M:M)                   [asset_ai_systems]
```

### Missing relationships (gaps in the entity graph)

| Missing relationship | Impact |
|---|---|
| Assessment → Risk (no FK) | Assessment findings cannot auto-promote to risks; users must manually create a Risk record |
| Audit Finding → Issue (no FK) | Findings cannot auto-create Issues; two independent remediation chains operate without cross-reference |
| CAPA → Issue (no FK) | CAPAs and Issues are never reconciled; a finding may have both a CAPA and an Issue with no link |
| Risk Treatment → Issue (no FK) | Risk treatments and issues have no relationship; a CISO cannot see all open actions in one place |
| Monitoring Alert → Audit (no FK) | Governance alerts cannot trigger or reference audit creation |
| Monitoring Alert → Issue (no FK) | Governance alerts cannot trigger or reference issue creation |
| Regulation → Control (no direct FK; only via obligation_mappings → controls) | Regulatory obligations link to controls, but regulations do not directly reference the controls they require |
| Vendor → Issue (no FK) | Issues have a `sourceModule` field but no `vendor_id` FK; vendor-specific issues cannot be queried by vendor |
| External Finding → Audit Finding (no FK) | External findings from Auditor Collaboration™ have no relationship to internal audit_findings |
| AI System → Risk (direct; AI risks exist in ai_risks, separate from risk_lens risks) | AI-specific risks exist in a separate table and are not part of the main Risk Lens™ entity graph |
| Workflow → any entity (no FK) | Workflow Studio™ workflows are not linked to any business entity by FK |

---

## 4. Cross-Module Data Flow Analysis

### Primary governance data flow (Vendor Trust Lifecycle)

```
[Manual] Vendor created in Vendor Hub™
         ↓
[Manual] Documents uploaded → AI extraction (10 fields)
         ↓ auto
Evidence Vault™ auto-imports vendor docs/assessments/reviews as Evidence
         ↓
[Manual] Security Assessment scored (17 fixed questions)
         ↓ ⚠️ BREAK — no auto-promotion
[Manual] Risk created manually in Risk Lens™
         ↓
[Manual] Risk linked to Control (risk_controls junction — UI exists)
         ↓
         Control Center™ computes Control Health™ (evidence, testing, audit, policy, freshness, risk reduction)
         ↓
         Compliance readiness recomputed per framework
         ↓ auto
Continuous Monitoring™ evaluates 7 rules (control health, evidence expiry, open risks, overdue CAPAs)
         ↓ ⚠️ BREAK — alert does not trigger audit or issue
[Manual] Audit created in Audit Management
         ↓
[Manual] Finding raised → CAPA created
         ↓ ⚠️ BREAK — CAPA not linked to Issue Hub
[Manual] Issue created separately in Issue & Remediation Hub™
         ↓
[Manual] Contract renewal date checked in Contract Governance™
         ↓ ⚠️ BREAK — no renewal decision workflow using aggregated data
Trust Score™ computed from all inputs → Trust Intelligence™ aggregates Org Trust Score™
         ↓
Executive Reporting™ → Board report
```

### Automated steps (no user action required)

| Automation | Trigger | Destination |
|---|---|---|
| Evidence auto-import | Vendor document / assessment / review created | Evidence Vault™ (evidence record created) |
| Readiness recompute | Control or evidence status changed | `readiness_scores` table updated |
| Trust Score recompute | Page load if stale > 1h | `vendor_trust_history` + `vendors.trust_score` |
| Org Trust Score snapshot | `POST /api/cron/governance-snapshot` (daily) | `governance_snapshots` |
| Monitoring rule evaluation | Run Monitoring button or cron | `governance_alerts` |
| Continuous Compliance check | Manual run or scheduled | `compliance_check_runs` + `compliance_evidence` |
| Control Health recompute | `computeAndSaveHealth()` action | `controls.health_score` + `controls.effectiveness_score` |
| Agent observation | Agent run triggered | `agent_observations` + `agent_recommendations` |
| Contract expiry alert | Monitoring rule `contract_expiring` | `governance_alerts` |

### Manual steps that could be automated

| Manual step | Recommended automation |
|---|---|
| Create Risk from Assessment finding | One-click "Create Risk" from assessment detail |
| Create Issue from Audit Finding | "Escalate to Issue Hub" action on finding |
| Create Audit from Monitoring Alert | "Create Audit" action on governance alert card |
| Vendor Renewal Decision | Aggregated recommendation workflow using Trust Score, risks, CAPAs, contract health |
| Vendor Offboarding | Guided checklist triggered from vendor status change to "offboarding" |
| Link Risk to Controls | Auto-suggest controls based on risk category |

---

## 5. Entity Lifecycle Assessment

### Vendor
```
Create → Classify (risk level, category, type) → Assess (security assessment)
→ Monitor (trust score, document expiry, reviews) → Review (periodic vendor review)
→ [MISSING: Renew decision] → [MISSING: Offboard workflow]
```
**Lifecycle completeness: 7/10** — Strong through Monitor. Renewal decision and offboarding are absent.

---

### Risk
```
Identified → Under Assessment → Open → Mitigating → Accepted / Transferred / Closed → Archived
```
**Lifecycle completeness: 9/10** — All 8 status states implemented. Risk reviews track state transitions. Treatments track remediation. Missing: auto-creation from upstream entities (Assessment, Finding, Alert).

---

### Control
```
[Created — Draft implied] → Active → Under Review (next_review_date) → [MISSING: Deprecated / Retired]
```
**Lifecycle completeness: 6/10** — Control status enum is limited (active / inactive / under_review / deprecated). No archive workflow in UI. No restore. Framework-linked controls cannot be independently decommissioned.

---

### Policy
```
Draft → Under Review → Approved → [Expired / Superseded via new version]
```
**Lifecycle completeness: 8/10** — Version history, attestations, policy reviews all present. Missing: policy exception tracking (when an obligation cannot be met, no formal exception process exists outside Issue Hub).

---

### Contract
```
Draft → Active → Expiring Soon → Renewed / Terminated
```
**Lifecycle completeness: 7.5/10** — Health scoring, obligation tracking, renewal dashboard all present. Missing: post-termination archival, formal vendor exit linkage.

---

### Asset
```
Active → Under Review → Decommissioned
```
**Lifecycle completeness: 6/10** — Status exists (active / under_review / decommissioned / archived). No guided decommissioning workflow. No restore. Asset relationships not cleaned up on decommission.

---

### AI System
```
Draft → Active → Under Review → Retired
```
**Lifecycle completeness: 6.5/10** — Good inventory and risk/control associations. No formal approval workflow for new AI system deployments. No auto-retirement trigger. Risks exist in `ai_risks` (separate table) rather than main Risk Lens™.

---

### Evidence
```
Collected → Under Review → Approved → Expired
```
**Lifecycle completeness: 7/10** — Status lifecycle present. Expiry tracked. Auto-import from vendor entities works. Missing: evidence renewal workflow (when evidence expires, no auto-task created to collect replacement).

---

### Audit
```
Planned → Active → Completed / Cancelled
```
**Lifecycle completeness: 8/10** — Status transitions enforced. Full finding and CAPA lifecycle within audit context. Missing: audit scheduling (recurring audits), audit closure report auto-generation.

---

### Finding (Audit)
```
Open → Remediating → Closed / Accepted
```
**Lifecycle completeness: 7/10** — Status transitions present. CAPA creation auto-moves finding to "remediating." Missing: finding-to-issue escalation, finding-to-risk promotion, finding reopen workflow.

---

### Issue
```
Open → In Progress → Resolved → Closed
Exception sub-flow: Requested → Approved / Rejected
Escalation: L1 → L2 → L3 → Board
SLA: breach auto-detected by monitoring rule
```
**Lifecycle completeness: 8.5/10** — Most comprehensive remediation lifecycle in the platform. Missing: auto-creation from upstream entities (findings, alerts), link back to source entity on resolution.

---

### CAPA
```
Open → In Progress → Completed / Overdue
```
**Lifecycle completeness: 7/10** — Status lifecycle present. Overdue detection in Continuous Monitoring. Missing: CAPA reopen, CAPA-to-issue escalation when blocked.

---

## 6. CRUD Coverage Matrix

| Entity | Create | View | Edit | Archive | Restore | Delete | Search | Filter | Export | Report | Audit trail |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Vendor** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ NL | ✅ | ✅ CSV | ✅ | ✅ |
| **Asset** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ CSV | ✅ | ✅ |
| **Risk** | ✅ | ✅ | ✅ | ✅ status | ❌ | ✅ | ❌ | ✅ | ✅ CSV | ✅ | ✅ |
| **Control** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ CSV | ✅ | ✅ |
| **Policy** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Framework** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Evidence** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ CSV | ✅ | ✅ |
| **Assessment** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Audit** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ PDF+CSV | ✅ | ✅ |
| **Finding** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ CSV | ✅ | ✅ |
| **CAPA** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ CSV | ✅ | ✅ |
| **Issue** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ CSV | ✅ | ✅ |
| **Risk Treatment** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ CSV | ✅ | ✅ |
| **Contract** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ CSV | ✅ | ✅ |
| **Regulation** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **AI System** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Workflow** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Trust Score** | ✅ auto | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **User / Profile** | ✅ | ✅ | ✅ | ✅ deactivate | ✅ reactivate | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Integration** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ disconnect | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Governance Agent** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |

### Critical CRUD gaps

| Gap | Affected entities | Impact |
|---|---|---|
| **No archive / restore** | Vendor, Asset, Control, Policy, Framework, Evidence, Contract, Issue, CAPA, Finding, Risk Treatment | Enterprise users cannot safely retire records without deleting them. Hard delete risks losing audit history. |
| **Assessment is immutable after creation** | Assessment | No edit or delete means stale assessments cannot be corrected. Only a new assessment can supersede. |
| **Finding and CAPA cannot be edited** | Finding, CAPA | Typos, wrong severity assignments, or incorrect control links cannot be corrected without deleting and recreating. |
| **No NL search beyond Vendor** | All entities except Vendor | Vendor Hub™ has NL search (Gemini). Every other entity is filter-only. No cross-entity search. |
| **No cross-entity search** | All | A user searching "MFA control failure" cannot query across Controls, Risks, Issues, and Findings simultaneously. |
| **Workflow has no audit trail** | Workflow | Governance automation runs are not logged in the `audit_logs` table. |
| **Policy and Framework cannot be exported** | Policy, Framework | No CSV/PDF export from Policy Governance™ or Evidence Vault™ framework list. |

---

## 7. AI Coverage Matrix

**AI maturity levels:**
- **L4 — Autonomous:** AI acts without user input (scheduled)
- **L3 — Proactive:** AI generates insights on page load / event trigger
- **L2 — On-demand:** AI generates on user request (button click / chat)
- **L1 — Contextual:** AI uses entity as context only
- **L0 — None:** No AI interaction

| Entity | Summarise | Generate insights | Recommend actions | Identify risks | Answer questions (chat) | Automate | Level |
|---|---|---|---|---|---|---|---|
| **Vendor** | ✅ cached brief | ✅ NL search filters | ✅ AI executive report | ✅ risk narrative | ✅ NL chat | ❌ | **L3** |
| **Risk** | ✅ narrative (cached) | ✅ heat map context | ✅ mitigation recommendations | ✅ executive report | ✅ NL chat | ❌ | **L3** |
| **Control** | ✅ narrative (cached) | ✅ gap detection | ✅ executive summary | ✅ gaps | ✅ NL chat | ❌ | **L3** |
| **Policy** | ✅ compliance summary | ✅ readiness explanation | ✅ gap narrative | ✅ gaps | ✅ NL chat (via compliance) | ❌ | **L2** |
| **Framework** | ✅ framework summary | ✅ readiness explanation | ✅ gap narrative | ✅ gaps | ✅ NL chat | ❌ | **L3** |
| **Evidence** | ❌ | ✅ gap analysis (Auditor) | ❌ | ✅ gap narrative | ✅ (via compliance) | ❌ | **L1** |
| **Assessment** | ✅ AI summary | ❌ | ❌ | ❌ | ❌ | ❌ | **L2** |
| **Audit** | ✅ summary (cached) | ✅ executive report | ✅ CAPA suggestions | ✅ finding generator | ✅ NL chat | ❌ | **L3** |
| **Finding** | ❌ | ❌ | ✅ CAPA suggestions (per finding) | ✅ AI Finding Generator | ❌ | ❌ | **L2** |
| **CAPA** | ❌ | ❌ | ✅ AI CAPA Suggestions | ❌ | ❌ | ❌ | **L2** |
| **Issue** | ✅ executive summary | ✅ issue generator | ✅ remediation planner | ❌ | ✅ NL chat | ❌ | **L3** |
| **Risk Treatment** | ❌ | ❌ | ✅ (via risk recommendations) | ❌ | ✅ (via risk chat) | ❌ | **L1** |
| **Contract** | ✅ executive summary | ✅ health analysis | ✅ renewal risk | ❌ | ✅ NL chat | ❌ | **L3** |
| **Asset** | ✅ advisory summary (cached) | ✅ impact analysis | ❌ | ✅ advisory | ✅ NL chat | ❌ | **L3** |
| **AI System** | ✅ governance summary | ✅ risk advisory | ✅ recommendations | ✅ compliance readiness | ✅ NL chat | ❌ | **L3** |
| **Regulation** | ✅ advisory (cached) | ✅ horizon forecast | ✅ obligation extraction | ✅ change analysis | ✅ NL chat | ❌ | **L3** |
| **Workflow** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (IS the automation) | **L2** |
| **Trust Score** | ✅ narrative (cached) | ✅ component breakdown | ✅ strengths/concerns | ❌ | ✅ (via trust intelligence) | ❌ | **L3** |
| **Governance Agent** | ✅ run summaries | ✅ observations | ✅ recommendations | ✅ multi-module | ✅ Copilot™ | ✅ (approved actions) | **L4** |
| **Integration** | ✅ health summary | ✅ recommendations | ✅ coverage gaps | ❌ | ✅ NL chat | ❌ | **L2** |
| **User / Profile** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **L0** |

### AI coverage gaps

| Gap | Entities affected |
|---|---|
| No AI on User / Profile entity | User — no AI review of access patterns, dormant accounts, privilege escalation |
| Evidence has no AI summarisation | Evidence — no "explain this evidence" or "does this evidence satisfy the control?" AI |
| Risk Treatment has no independent AI | Risk Treatment — recommendations only accessible via parent Risk context |
| Finding has no NL chat | Finding — CAPA suggestions exist but no conversational interface per finding |
| CAPA has no NL chat | CAPA — no AI advisor for tracking or status reasoning |
| No AI automation (L4) beyond Agents | All entities — Agent Framework is the only L4 capability; all module-level AI is L2/L3 on-demand |

---

## 8. Reporting Coverage Matrix

| Entity | Dashboard | Executive Report | KPI | Analytics (Snapshots) | Trust Score | Trends | Benchmarking |
|---|---|---|---|---|---|---|---|
| **Vendor** | ✅ Hub dashboard | ✅ Executive report PDF | ✅ (vendor count, expiring docs) | ✅ | ✅ (Trust Score component) | ✅ Governance Trends | ✅ Vendor Trust benchmark |
| **Risk** | ✅ Risk Lens dashboard | ✅ Risk executive report | ✅ (open risks, critical risks) | ✅ | ✅ (Risk Posture component) | ✅ | ✅ Risk benchmark |
| **Control** | ✅ Control Center dashboard | ✅ AI executive summary | ✅ (control health avg) | ✅ | ✅ (Control Health component) | ✅ | ✅ Controls benchmark |
| **Policy** | ✅ Policy dashboard | ✅ (via compliance) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Framework** | ✅ Evidence Vault dashboard | ✅ PDF reports | ✅ (avg readiness) | ✅ | ✅ (Compliance component) | ✅ | ✅ Compliance benchmark |
| **Evidence** | ✅ (evidence counts) | ✅ (via compliance) | ✅ (expiring docs) | ✅ | ✅ (Evidence component in Trust Score) | ✅ | ❌ |
| **Assessment** | ✅ (per vendor) | ✅ (via vendor report) | ❌ | ❌ | ✅ (Assessment component) | ❌ | ❌ |
| **Audit** | ✅ Audit dashboard | ✅ PDF reports | ✅ (open audits, findings) | ✅ | ✅ (Audit Readiness component) | ✅ | ✅ Audit benchmark |
| **Finding** | ✅ (in audit dashboard) | ✅ PDF | ✅ (critical findings count) | ❌ | ❌ | ❌ | ❌ |
| **CAPA** | ✅ (CAPAs due soon) | ✅ PDF | ✅ (overdue CAPAs) | ❌ | ❌ | ❌ | ❌ |
| **Issue** | ✅ Issue Hub dashboard | ✅ (via executive report) | ✅ (open issues) | ✅ | ❌ | ❌ | ✅ (Issues benchmark) |
| **Risk Treatment** | ✅ (treatments tab) | ✅ (via risk report) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Contract** | ✅ Contract dashboard | ✅ (via executive) | ✅ (expiring contracts) | ✅ | ✅ (Contract Health component) | ❌ | ✅ Contract benchmark |
| **Asset** | ✅ Asset dashboard | ✅ (via executive) | ✅ (critical assets, PII) | ❌ | ❌ | ❌ | ❌ |
| **AI System** | ✅ AI Gov dashboard | ✅ (via executive) | ✅ (AI system count) | ❌ | ❌ | ❌ | ❌ |
| **Regulation** | ✅ Reg Intel dashboard | ✅ (via executive) | ✅ (readiness score) | ❌ | ❌ | ❌ | ❌ |
| **Workflow** | ✅ (run history) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (Workflow Automation benchmark) |
| **Trust Score** | ✅ per vendor + org | ✅ Trust Intelligence | ✅ (avg trust) | ✅ | N/A (IS the score) | ✅ | ✅ |
| **Governance Agent** | ✅ Agent dashboard | ❌ | ✅ (agent runs, obs) | ❌ | ❌ | ❌ | ❌ |
| **Integration** | ✅ Hub dashboard | ❌ | ✅ (connected systems) | ❌ | ❌ | ❌ | ✅ (Automation benchmark) |
| **User / Profile** | ✅ (team tab) | ❌ | ✅ (user count) | ❌ | ❌ | ❌ | ❌ |

### Entities with no reporting beyond their own dashboard

| Entity | Missing coverage |
|---|---|
| **Policy** | Not in KPIs, Analytics snapshots, Trends, or Benchmarking |
| **Assessment** | Not in KPIs or Analytics; only visible on vendor detail |
| **Risk Treatment** | Not in KPIs, Analytics, or Benchmarking |
| **Asset** | Not in Analytics snapshots or Trends |
| **AI System** | Not in Analytics, Trends, or Benchmarking |
| **Governance Agent** | Not in Executive Report; agent value not surfaced at board level |
| **External Finding** | Not visible in any reporting layer outside Auditor Collaboration™ |

---

## 9. Entity Health Scorecard

| Entity | Score /10 | Strengths | Weaknesses |
|---|---|---|---|
| **Risk** | **9.0** | 13 categories, 8 statuses, treatments, reviews, heat map, AI officer, M:M junction coverage | No auto-creation from assessments, findings, or alerts |
| **Audit** | **8.5** | Full lifecycle, PDF reports, AI generator, external collaboration, program checklist | No recurring schedule, monitoring alerts do not trigger audits |
| **Vendor** | **8.5** | Rich profile, AI extraction, NL search, trust scoring, portal, 7 junction relationships | No archive, no offboarding, no guided classification |
| **Trust Score** | **8.5** | 7-component engine, history, narrative, portfolio metrics, benchmarking integration | Read-only; cannot be manually adjusted; contract component has no separate column |
| **Issue** | **8.5** | Most complete remediation lifecycle — tasks, exceptions, SLAs, escalations, AI | Not auto-created from findings or alerts; no link back to source entity on close |
| **Contract** | **8.0** | Health scoring, obligation tracking, renewals, vendor link, AI intelligence | No post-termination archival, no vendor exit linkage, not in Trends reporting |
| **Framework** | **8.0** | Readiness scoring, 174 controls, AI summaries, cross-framework mapping | Cannot be exported, no archive, no custom control bulk import |
| **Policy** | **7.5** | Version history, attestations, reviews, M:M junctions | No exception tracking, not in KPIs/Benchmarking/Trends, no export |
| **Control** | **7.5** | Health scoring (6-component), test tracking, M:M junctions (8 junction tables) | Dual ownership (Vault + Center), no archive/restore, no NL search |
| **Evidence** | **7.5** | Auto-import from vendor entities, status lifecycle, M:M with controls and risks | No AI summarisation per evidence item, no renewal workflow on expiry |
| **Regulation** | **7.5** | 18 built-ins, change tracking, obligations, AI horizon, readiness scoring | Not in Analytics snapshots or Trends; obligation-to-control link indirect |
| **Asset** | **7.0** | 12 types, 7 junction tables, criticality, PII tracking, alerts | No archive/restore, no NL search, not in Trends or Analytics |
| **Finding** | **7.0** | Status lifecycle, CAPA auto-link, M:M with risks | Cannot be edited, no escalation to Issue Hub, no NL search |
| **CAPA** | **7.0** | Status lifecycle, overdue detection, AI suggestions | Cannot be edited, no link to Issue Hub, no NL search |
| **Assessment** | **6.5** | 17-question set, score 0–100, AI summary, auto-imports as evidence | Fixed questions, immutable after creation, no custom templates, no auto-risk creation |
| **AI System** | **6.5** | Good inventory, AI risk/control junctions, compliance frameworks | Risks in separate ai_risks table (not Risk Lens™), no formal approval workflow |
| **Workflow** | **5.5** | Automation engine exists, runs and definitions stored | Not FK-linked to any business entity, not surfaced from operational modules, no audit trail |
| **Integration** | **5.5** | 35+ connectors, sync engine, evidence collection | Dual store (Settings + Hub), no real-time push, Continuous Compliance is the only consumer |
| **External Finding** | **5.0** | Status lifecycle in Auditor Collaboration context | Not linked to audit_findings, not in any reporting layer, not consumed by any other module |
| **Risk Treatment** | **7.0** | Status lifecycle, progress %, M:M with risks | Not in KPIs or Benchmarking, no link to Issues or CAPAs, no AI advisor |
| **Governance Agent** | **7.5** | L4 AI maturity, observations + recommendations + approved actions, multi-module scope | Not in Executive Report, agent value not surfaced at board level |
| **User / Profile** | **6.5** | 7 roles, MFA, sessions, login history, password policy | No AI coverage, no deprovisioning workflow, no access review automation |

**Platform average entity health: 7.3 / 10**

---

## 10. Strategic Recommendations

### Strongest entities

The following entities are the most mature and well-integrated in the domain model:

1. **Risk** (9.0) — Comprehensive lifecycle, rich relationships, strong AI.
2. **Audit** (8.5) — Full lifecycle with external collaboration support.
3. **Vendor** (8.5) — The primary subject of the platform; well-built.
4. **Trust Score** (8.5) — Defensible proprietary composite signal.
5. **Issue** (8.5) — Most complete remediation lifecycle.

---

### Weakest entities

The following entities have significant gaps that reduce overall platform coherence:

1. **Workflow** (5.5) — Exists but is disconnected from all other entities. No FK relationships, no audit trail, no in-context access from operational modules.
2. **Integration** (5.5) — Dual store creates inconsistency. Settings `/integrations` and Integration Hub™ are parallel systems.
3. **External Finding** (5.0) — Isolated to Auditor Collaboration™. Not linked to internal findings, not reported anywhere outside its module.
4. **Assessment** (6.5) — Immutable, fixed-question set. Cannot generate risks. Cannot be customised per vendor tier.
5. **User / Profile** (6.5) — No AI coverage. No deprovisioning workflow. Access reviews exist in Continuous Compliance™ but are not linked to User entity.

---

### Duplicate ownership

| Conflict | Description | Recommendation |
|---|---|---|
| **Remediation Actions (3 tables)** | CAPAs (`corrective_actions`), Issues (`issues`), Risk Treatments (`risk_treatments`) are independent entities with no cross-references. A unified "remediation item" concept does not exist. | Introduce an `ActionItem` entity or a cross-reference junction. At minimum, add optional FK columns: `capa_id` on issues, `issue_id` on CAPAs, `treatment_id` on issues. |
| **Integration (2 stores)** | `integrations` table (Settings module, 10 providers) and `integration_instances` table (Hub module, 35+ connectors) coexist without a FK relationship. | Migrate Settings integrations to Hub instances. Deprecate the legacy `integrations` table or make it a view over Hub data. |
| **Control (dual module)** | Evidence Vault™ created 174 controls and considers them compliance controls. Control Center™ manages them operationally and creates standalone controls. Both modules write to the same `controls` table. | This is acceptable but needs an explicit owner declaration. Control Center™ should be the declared write-owner; Evidence Vault™ should be read-only for control data. The compliance context (framework_id, evidence mappings) should remain in Evidence Vault™ scope. |
| **Finding (2 separate tables)** | Internal `audit_findings` and external `external_findings` (Auditor Collaboration™) are separate entities with no relationship. | Add an optional `external_finding_id` FK on `audit_findings` and an optional `audit_finding_id` FK on `external_findings` to enable cross-reference when an external finding maps to an internal finding. |
| **Asset / AI System overlap** | AI Systems (`ai_systems` table) are a conceptual sub-type of Asset (`assets` table) but have no FK relationship. `asset_ai_systems` junction exists, but an AI System is not required to have an Asset record. | Enforce the sub-type relationship: every AI System should optionally reference an Asset record (`assets.id`). The `ai_systems` table should add `asset_id UUID REFERENCES assets(id)`. |

---

### Missing relationships

| Missing link | Priority | Recommended FK |
|---|---|---|
| Assessment → Risk | **Critical** | Add optional `assessment_id` on `risks` + UI action "Create Risk from Assessment" |
| Audit Finding → Issue | **Critical** | Add optional `audit_finding_id` on `issues` + UI action "Escalate to Issue Hub" |
| CAPA → Issue | **High** | Add optional `capa_id` on `issues` (and vice versa) |
| Risk Treatment → Issue | **High** | Add optional `risk_treatment_id` on `issues` |
| Governance Alert → Audit | **High** | Add optional `governance_alert_id` on `audits` + "Create Audit from Alert" action |
| Governance Alert → Issue | **High** | Add optional `governance_alert_id` on `issues` + "Create Issue from Alert" action |
| Issue → Vendor | **High** | Add optional `vendor_id` on `issues` to enable vendor-scoped issue queries |
| AI System → Asset (sub-type) | **Medium** | Add optional `asset_id` on `ai_systems` |
| Workflow → Entity | **Medium** | Add a `workflow_triggers` junction: `(workflow_id, entity_type, entity_id)` |
| External Finding → Audit Finding | **Medium** | Add optional cross-reference FKs on both tables |

---

### Missing lifecycle stages

| Entity | Missing stage | Impact |
|---|---|---|
| **Vendor** | Offboard | No formal exit process; critical for regulated industries |
| **Vendor** | Renew decision | No aggregated renewal recommendation workflow |
| **Vendor** | Guided classification | No tier-assignment wizard; risk classification is informal |
| **Control** | Archive / Restore | Controls cannot be safely retired; only hard-delete available |
| **Assessment** | Edit / Supersede | Immutable after creation; incorrect assessments cannot be corrected |
| **Finding** | Edit / Reopen | Cannot correct typos or severity; cannot reopen a closed finding |
| **CAPA** | Edit / Reopen | Cannot correct or reopen a completed CAPA |
| **Policy** | Exception | No formal policy exception process; exceptions go to Issue Hub informally |
| **Evidence** | Renewal | Expired evidence creates no replacement task; gap persists until manually fixed |
| **AI System** | Approval / Retirement | No formal deployment approval or retirement workflow |
| **Asset** | Decommission (guided) | Status field exists but no workflow: no relationship cleanup, no owner handoff |
| **Integration** | Reconnect / Health check | Disconnected integrations do not auto-alert; no reconnect workflow |

---

### Top 10 recommendations

| # | Recommendation | Target entities | Type |
|---|---|---|---|
| **R1** | **Introduce a universal `source_ref` pattern on remediation entities** — add `(source_type, source_id)` columns to `issues`, `corrective_actions`, and `risk_treatments` to enable bidirectional cross-referencing across the three remediation tables without a schema merge | CAPA, Issue, Risk Treatment | Schema (additive) |
| **R2** | **Add `audit_finding_id` FK on `issues`** and surface "Escalate to Issue Hub" as an action on the Finding detail page; this closes the single most damaging workflow break in the platform | Finding, Issue | Schema + UI action |
| **R3** | **Add `assessment_id` FK on `risks`** and surface "Create Risk from Assessment" as an action; pre-fill risk fields from assessment category and score | Assessment, Risk | Schema + UI action |
| **R4** | **Consolidate the two integration stores** — migrate `/settings/integrations` (10-provider model) to read from Integration Hub™ `integration_instances`; deprecate `integrations` table | Integration | Schema migration |
| **R5** | **Add `vendor_id` FK on `issues`** to enable vendor-scoped issue queries and surface vendor issues on vendor detail page | Issue, Vendor | Schema (additive) |
| **R6** | **Add Archive / Restore to Vendor, Control, Asset, Contract, Policy** — soft-delete pattern with `archived_at TIMESTAMPTZ` and `archived_by UUID`; keeps audit history intact | Vendor, Control, Asset, Contract, Policy | Schema (additive) |
| **R7** | **Make Assessment editable and allow supersession** — add a `superseded_by UUID` FK on `assessments`; allow edit while status = draft; lock on finalisation | Assessment | Schema + UI |
| **R8** | **Enforce AI System → Asset sub-type relationship** — add optional `asset_id UUID REFERENCES assets(id)` on `ai_systems`; surface "Create Asset Record" from AI System detail | AI System, Asset | Schema (additive) |
| **R9** | **Add a `workflow_triggers` entity** — `(workflow_id UUID, entity_type TEXT, entity_id UUID, trigger_event TEXT)` — so Workflow Studio™ workflows are FK-linked to the governance entities they orchestrate; enables in-context "Automate this" from operational modules | Workflow, all entities | Schema + UI |
| **R10** | **Introduce a Vendor Lifecycle Status** — add a `lifecycle_stage` enum on `vendors` (active / under_review / offboarding / offboarded / archived) and build guided stage transitions with checklists (Classification Wizard, Renewal Decision, Offboarding); owned by Vendor Hub™ | Vendor | Schema + UI |

---

*AUDT Product Audit Phase 2 · 2026-06-26 · 22 entities · 10 sections · 10 recommendations*  
*Builds on Phase 1 (lifecycle coverage). This audit establishes the domain model baseline for Phase 3 (Architecture Assessment) and Phase 4 (Enterprise Readiness Assessment).*
