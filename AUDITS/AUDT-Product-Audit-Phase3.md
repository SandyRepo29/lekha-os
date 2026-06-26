# AUDT Product Audit — Phase 3
## Business Process & Workflow Assessment

**Version:** 1.0  
**Date:** 2026-06-26  
**Processes evaluated:** 42 across 7 domains  
**Platform average process score:** 6.4 / 10

---

## Contents

1. [Business Process Inventory](#1-business-process-inventory)
2. [Process Workflow Diagrams](#2-process-workflow-diagrams)
3. [Process Dependency Matrix](#3-process-dependency-matrix)
4. [Automation Assessment](#4-automation-assessment)
5. [AI Maturity Assessment](#5-ai-maturity-assessment)
6. [Reporting Coverage Matrix](#6-reporting-coverage-matrix)
7. [Enterprise Readiness Assessment](#7-enterprise-readiness-assessment)
8. [Business Process Scorecard](#8-business-process-scorecard)
9. [Workflow Gap Analysis](#9-workflow-gap-analysis)
10. [Strategic Recommendations](#10-strategic-recommendations)

---

## 1. Business Process Inventory

### Domain 1 — Vendor Lifecycle (9 processes)

| Process | Business objective | Primary persona | Trigger | Expected outcome |
|---|---|---|---|---|
| **Vendor Onboarding** | Register a new vendor and capture all required information | Procurement Manager | New vendor relationship identified | Vendor record created, documents collected, initial classification applied |
| **Vendor Classification** | Assign risk tier and category to govern assessment depth | Risk Manager | Vendor created or annual reclassification | Vendor assigned risk level, category, and vendor type |
| **Vendor Assessment** | Evaluate vendor security posture against a standard questionnaire | Risk / Procurement | Onboarding or periodic review | Assessment score, AI summary, evidence auto-imported |
| **Vendor Risk Assessment** | Identify and quantify risks introduced by a vendor | Risk Manager | Assessment completed or incident occurred | Risk record created, linked to vendor, treatment plan initiated |
| **Vendor Approval** | Formally approve a vendor for use before procurement proceeds | Compliance / Legal | Classification and assessment complete | Vendor status = approved; audit trail of decision |
| **Vendor Monitoring** | Continuously track vendor posture between review cycles | Risk / Compliance | Ongoing (cron + manual) | Trust Score current, alerts fired for degradation, agent observations |
| **Vendor Review** | Periodic governance review of vendor relationship | Procurement Manager | Scheduled review date reached | Review record created, next review date set, Trust Score updated |
| **Vendor Renewal** | Decide whether to renew, renegotiate, or exit a vendor contract | Legal / Procurement | Contract expiry approaching | Documented renewal decision with supporting evidence |
| **Vendor Offboarding** | Formally exit a vendor relationship and close all obligations | Procurement / Legal | Contract terminated or decision to exit | Access revoked, obligations closed, records archived, final audit |

### Domain 2 — Risk & Compliance (8 processes)

| Process | Business objective | Primary persona | Trigger | Expected outcome |
|---|---|---|---|---|
| **Compliance Assessment** | Assess organisational compliance against a regulatory framework | Compliance Manager | Framework adopted or annual cycle | Readiness score, gap analysis, AI narrative, PDF report |
| **Evidence Collection** | Gather artefacts that demonstrate controls are satisfied | Compliance Manager | Gap identified or control under review | Evidence linked to control, status = approved, readiness score updated |
| **Control Management** | Maintain the organisation's control library | CISO / Compliance | Control created, tested, or reviewed | Control Health Score™ current, test records stored, owner assigned |
| **Control Testing** | Formally test a control's operating effectiveness | Control Owner | Scheduled test date or incident | Test result recorded, health score updated, pass/fail documented |
| **Risk Identification** | Discover and record new risks | Risk Manager | Assessment, finding, alert, or manual | Risk record in Risk Lens™ with category, source, and owner |
| **Risk Assessment** | Evaluate likelihood, impact, and treatment strategy for a risk | Risk Manager | Risk identified | Inherent score, residual score, AI narrative, treatment plan |
| **Risk Treatment** | Execute actions to mitigate, accept, transfer, or avoid a risk | Risk Owner | Risk assessed and treatment strategy chosen | Treatment actions tracked, progress %, completion recorded |
| **Continuous Compliance** | Automate evidence collection and compliance validation | Compliance Manager | Integration connected or scheduled run | Check results, auto-evidence, control validations, health score |

### Domain 3 — Audit & Assurance (6 processes)

| Process | Business objective | Primary persona | Trigger | Expected outcome |
|---|---|---|---|---|
| **Audit Planning** | Plan an internal or external audit engagement | Head of Internal Audit | Annual plan or triggered audit | Audit record created, scope defined, program generated, team assigned |
| **Audit Execution** | Execute audit fieldwork — test controls, gather evidence, raise findings | Auditor | Audit status = active | Program items completed, findings raised, AI summary generated |
| **Evidence Request** | Request specific evidence from auditees during an audit | External Auditor | Audit in progress | Evidence requests submitted, reviewed, accepted/rejected |
| **Finding Management** | Record, track, and close audit findings | Auditor | Evidence insufficient or control failure observed | Finding raised, severity set, CAPA created, status tracked |
| **CAPA Management** | Track corrective and preventive actions arising from findings | Control Owner / Risk | Finding raised | CAPA assigned, progress tracked, completed or escalated |
| **External Auditor Collaboration** | Facilitate external auditor access to evidence and findings | Head of Internal Audit | External audit engagement initiated | Audit room created, evidence exchanged, external findings tracked |

### Domain 4 — Governance (5 processes)

| Process | Business objective | Primary persona | Trigger | Expected outcome |
|---|---|---|---|---|
| **Policy Lifecycle** | Create, review, approve, and retire governance policies | Compliance Manager | Policy needed or annual review | Approved policy, version history, attestations, linked controls |
| **Policy Attestation** | Obtain employee sign-off on governance policies | HR / Compliance | Policy approved or annual attestation cycle | Completion %, non-attestors identified, escalation sent |
| **Exception Management** | Formally manage policy exceptions and risk acceptances | Compliance / Legal | User cannot comply with a policy | Exception approved/rejected with documented rationale |
| **Regulatory Change Management** | Track new regulations and respond to regulatory changes | Legal / Compliance | Regulation published or amended | Change assessed, obligations updated, controls mapped, alert resolved |
| **Executive Reporting** | Produce board and executive reports on governance posture | CISO / CRO / Board Secretary | Board meeting approaching or on-demand | Role-specific dashboards, board report PDF, KPIs current |

### Domain 5 — Privacy (5 processes)

| Process | Business objective | Primary persona | Trigger | Expected outcome |
|---|---|---|---|---|
| **Data Asset Registration** | Catalogue all personal data assets and flows | DPO | Data processing activity identified | Data asset recorded, classified, linked to regulations and controls |
| **Privacy Impact Assessment** | Assess privacy risks of a new project or processing activity | DPO | New project or high-risk processing activity | PIA documented, risks identified, mitigations recorded |
| **Consent Management** | Record and manage data subject consent | DPO / Engineering | Consent collected at point of data collection | Consent records created, withdrawals tracked |
| **Data Subject Requests** | Process DSRs — access, deletion, portability, correction | DPO | Data subject submits a request | Request logged, processed within statutory deadline, response sent |
| **Data Retention** | Enforce retention schedules on data assets | DPO / IT | Retention policy defined | Retention events tracked, disposals recorded, compliance documented |

### Domain 6 — AI Governance (4 processes)

| Process | Business objective | Primary persona | Trigger | Expected outcome |
|---|---|---|---|---|
| **AI System Registration** | Register and classify all AI systems in use | CISO / DPO | New AI system deployed or identified | AI system record with type, risk level, vendor, and compliance status |
| **AI Risk Assessment** | Assess risks specific to an AI system | Risk / CISO | AI system registered or incident occurred | AI risk record, severity, treatment, linked to AI system |
| **AI Compliance Assessment** | Assess AI system compliance with AI frameworks (EU AI Act, ISO 42001) | Compliance | Framework adopted | Compliance record, readiness score, gaps identified |
| **AI Monitoring** | Ongoing monitoring of AI system behaviour and prompt usage | CISO | AI system active | Prompt audit log, sensitivity classification, governance alerts |

### Domain 7 — Platform (5 processes)

| Process | Business objective | Primary persona | Trigger | Expected outcome |
|---|---|---|---|---|
| **User Onboarding** | Bring a new team member onto the platform | Admin / Owner | Team invite sent | User profile created, role assigned, access granted |
| **Team Management** | Manage team members, roles, and departments | Admin | Org change or role change | Memberships current, roles correct, audit trail maintained |
| **Integration Setup** | Connect an external system to AUDT | IT Admin | New tool adopted or compliance check requires integration | Integration active, sync running, evidence flowing |
| **Workflow Automation** | Automate a recurring governance task | Admin / Power User | Repetitive manual process identified | Workflow running, triggers firing, actions executing |
| **API Integration** | Expose AUDT data to external systems via API | Platform Engineer | External system needs governance data | API client active, keys issued, webhooks configured, usage monitored |

---

## 2. Process Workflow Diagrams

### 2.1 Vendor Onboarding

```
TRIGGER: New vendor relationship identified
↓
[Manual] Create vendor record in Vendor Hub™
  Inputs: name, category, risk level, vendor type, website, country, owner
  Module: Vendor Hub™ | Entity: Vendor
↓
[Manual] Upload documents
  Module: Vendor Hub™ | Entity: Document
↓
[Auto] AI extraction (10 fields from document)
  Module: Vendor Hub™ (Gemini) | Entity: Document
↓
[Manual] Send document request via vendor portal
  Module: Vendor Hub™ | Entity: Document Request
  ⚠ DECISION: Are required documents complete?
    YES → Continue
    NO → Wait for vendor submission (portal magic link)
↓
[Auto] Evidence auto-import to Evidence Vault™
  Module: Evidence Vault™ | Entity: Evidence
↓
[Manual] Conduct security assessment (17 questions)
  Module: Vendor Hub™ | Entity: Assessment
↓
[Auto] Assessment score computed, AI summary generated
  Module: Vendor Hub™ (Gemini) | Entity: Assessment
↓
[Auto] Trust Score™ computed
  Module: Trust Score™ | Entity: Trust Score
↓
OUTCOME: Vendor onboarded with initial posture captured

⚠ MISSING STEPS:
  - No formal approval gate before vendor is "active"
  - No guided classification wizard
  - No integration-triggered onboarding (e.g. from procurement system)
  - No onboarding checklist for completeness gate
```

**Process steps:**

| # | Step | Module | Entity | Type | AI |
|---|---|---|---|---|---|
| 1 | Create vendor record | Vendor Hub™ | Vendor | Manual | ❌ |
| 2 | Upload documents | Vendor Hub™ | Document | Manual | ❌ |
| 3 | AI field extraction | Vendor Hub™ | Document | Auto | ✅ Gemini |
| 4 | Send document request | Vendor Hub™ | Document Request | Manual | ❌ |
| 5 | Vendor portal submission | Vendor Hub™ | Document | Manual (vendor) | ❌ |
| 6 | Evidence auto-import | Evidence Vault™ | Evidence | Auto | ❌ |
| 7 | Security assessment | Vendor Hub™ | Assessment | Manual | ❌ |
| 8 | Score computation | Vendor Hub™ | Assessment | Auto | ✅ summary |
| 9 | Trust Score computation | Trust Score™ | Trust Score | Auto | ✅ narrative |

---

### 2.2 Vendor Classification

```
TRIGGER: Vendor created or annual reclassification cycle
↓
[Manual] Select risk level (critical / high / medium / low / very low)
  Decision: based on user judgement — no guided questionnaire
↓
[Manual] Select vendor category (freetext / dropdown)
↓
[Manual] Select vendor type (checklist template)
↓
OUTCOME: Classification stored on vendor record

⚠ MISSING STEPS:
  - No inherent risk questionnaire (data access? contract value? geography? sub-processor?)
  - No classification policy enforcement
  - No approval of classification decision
  - No reclassification trigger when circumstances change
  - No auto-reclassification after assessment score changes
```

| # | Step | Module | Entity | Type | AI |
|---|---|---|---|---|---|
| 1 | Assign risk level | Vendor Hub™ | Vendor | Manual | ❌ |
| 2 | Assign category | Vendor Hub™ | Vendor | Manual | ❌ |
| 3 | Assign vendor type | Vendor Hub™ | Vendor | Manual | ❌ |

---

### 2.3 Vendor Assessment

```
TRIGGER: Vendor onboarded or periodic reassessment required
↓
[Manual] Navigate to vendor → Assessment tab → Start assessment
↓
[Manual] Answer 17 fixed security questions (yes/no/partial/na)
  Questions: grouped by category — access control, data security, incident response etc.
↓
[Auto] Score computed (0–100)
  Module: Vendor Hub™ | Pure function: computeScore()
↓
[Auto] AI summary generated
  Module: Vendor Hub™ (Gemini) | Entity: Assessment
↓
[Auto] Assessment auto-imported as Evidence
  Module: Evidence Vault™ | Entity: Evidence
↓
OUTCOME: Assessment score and AI summary stored

⚠ MISSING STEPS:
  - No custom assessment templates per vendor tier
  - No assessment scheduling / due-date tracking
  - No assessment approval workflow
  - No auto-risk creation from failing question responses
  - No reassessment trigger when trust score degrades
  - No comparison to previous assessment (trend)
```

---

### 2.4 Vendor Approval (MISSING PROCESS)

```
TRIGGER: Vendor classification and assessment complete
↓
⚠ PROCESS DOES NOT EXIST
  - Vendor is created with status "active" immediately
  - No approval workflow, no sign-off requirement
  - No pending/approved/rejected vendor status
  - Procurement can proceed without formal sign-off
↓
Expected workflow (not built):
  Classification complete → Risk level assigned
  → Assessment score meets threshold?
    YES → Auto-approve or send to approver
    NO → Flag for additional assessment or escalation
  → Approver reviews → Approve / Reject / Conditional
  → Vendor status updated → Audit trail recorded
  → Notification sent to requester
↓
OUTCOME (expected): Vendor formally approved for use
OUTCOME (actual): No approval gate — vendor immediately usable
```

---

### 2.5 Vendor Monitoring

```
TRIGGER: Daily cron + manual "Run Monitoring" button
↓
[Auto] Governance snapshot computed (Org Trust Score™)
  Cron: /api/cron/governance-snapshot (daily)
↓
[Auto] 7 monitoring rules evaluated:
  1. expired_evidence — evidence past expiry date
  2. expiring_evidence — evidence expiring in 30 days
  3. critical_control_health — control health < 50
  4. open_critical_risks — unreviewed critical risks > 30 days
  5. unresolved_critical_findings — open critical findings > 60 days
  6. overdue_capas — CAPAs past due date
  7. vendor_trust_critical — vendor Trust Score < 40
↓
[Auto] Governance alerts generated in governance_alerts
↓
[Auto] Trust Score recomputed if stale > 1h (on page load)
↓
[Manual] User reviews alerts → Resolves alert
  ⚠ DECISION: Alert critical?
    YES → User manually creates audit or issue (no auto-action)
    NO → Resolve and close
↓
[Agent] Governance Agent Framework™ observes data across modules
  → Generates observations, recommendations, proposes actions (human approval required)
↓
OUTCOME: Current governance posture visible, alerts actioned

⚠ MISSING STEPS:
  - No alert-to-audit auto-creation
  - No alert-to-issue auto-creation
  - No vendor-specific alert subscriptions (per-vendor email/Slack)
  - No real-time feeds from integrations (polling only)
```

---

### 2.6 Vendor Renewal

```
TRIGGER: Contract expiry date approaches (monitoring rule: contract_expiring)
↓
[Auto] Governance alert generated (contract_expiring)
↓
[Manual] User navigates to Contract Governance™ → Renewals tab
↓
[Manual] Reviews contract health score, clause coverage, obligations
  Module: Contract Governance™ | Entity: Contract
↓
[Manual] Reviews Contract Intelligence™ AI recommendation
  AI output: Renew / Review / Renegotiate / Exit + confidence %
  Module: Contract Governance™ (Gemini) | Entity: Contract
↓
⚠ DECISION POINT (not structured):
  - Trust Score trend NOT surfaced here
  - Open risks linked to vendor NOT surfaced here
  - Open CAPAs linked to vendor NOT surfaced here
  - Compliance readiness NOT surfaced here
↓
[Manual] Record renewal decision (no formal capture in platform)
↓
[Manual] Update contract status / dates if renewing
↓
OUTCOME: Contract renewed or terminated — no formal decision record

⚠ MISSING STEPS:
  - No aggregated renewal decision screen
  - No formal renewal approval workflow
  - No renewal decision entity (no record of why decision was made)
  - No auto-link from renewal to offboarding if exit decision
```

---

### 2.7 Vendor Offboarding (MISSING PROCESS)

```
TRIGGER: Decision to exit vendor relationship
↓
⚠ PROCESS DOES NOT EXIST
  - No offboarding workflow, checklist, or entity
  - Vendor status can be changed but no guided process follows
  - No access revocation coordination
  - No open obligation closure workflow
  - No outstanding risk closure
  - No final audit generation
  - No document archival
  - No formal contract termination record
  - No notification to dependent teams
↓
Expected workflow (not built):
  Exit decision recorded → Offboarding initiated
  → Access revocation checklist (systems, API keys, portal tokens)
  → Open obligations reviewed and closed/waived
  → Outstanding risks transferred or closed
  → Open CAPAs closed or re-scoped
  → Documents archived / returned / deleted
  → Final Trust Score snapshot taken
  → Final audit report generated
  → Contract termination recorded
  → Vendor status = offboarded
  → Audit trail sealed
```

---

### 2.8 Compliance Assessment

```
TRIGGER: Framework adopted, annual cycle, or regulatory requirement
↓
[Manual/Seeded] Create or import framework (ISO 27001, SOC 2, DPDP, PCI DSS, HIPAA)
  Module: Evidence Vault™ | Entity: Framework
  174 controls auto-seeded for standard frameworks
↓
[Auto] Controls created from framework template
  Module: Evidence Vault™ | Entity: Control
↓
[Manual] Assign control owners
↓
[Manual] Collect and map evidence to controls
  Module: Evidence Vault™ | Entity: Evidence + control_evidence_mappings
  ⚠ DECISION: Evidence adequate?
    YES → Status = approved
    NO → Gap detected, gap record created
↓
[Auto] Gap analysis run (5 rule-based gap types)
  Module: Evidence Vault™ | Entity: Gap
↓
[Auto] Readiness score computed per framework
  Pure function: computeReadiness() | Entity: readiness_scores (upserted)
↓
[Auto] AI framework summary and gap narrative generated
  Module: Evidence Vault™ (Gemini) | Entity: ai_compliance_insights (cached)
↓
[Manual] Generate compliance PDF report
  Module: Evidence Vault™ | Entity: Report
↓
OUTCOME: Readiness score, gap list, AI narrative, PDF report

✅ WELL-CONNECTED: Auto-import from vendor docs/assessments/reviews, Control Center™ health feeds Trust Intelligence™
```

---

### 2.9 Risk Assessment

```
TRIGGER: Risk identified (manually, from finding, from gap, from alert)
↓
[Manual] Create risk record in Risk Lens™
  Inputs: title, category (13 types), source (8 types), description, owner
  Entity: Risk
↓
[Manual] Set impact (1–5) and likelihood (1–5)
↓
[Auto] Inherent risk score computed
  Pure function: computeRiskScore(impact, likelihood)
↓
[Manual] Select treatment strategy (mitigate / accept / transfer / avoid / monitor)
↓
[Manual] Create treatment actions (risk_treatments)
  Inputs: action, owner, due date, target date
↓
[Manual] Set residual score (post-treatment estimate)
↓
[Auto] AI risk narrative generated (on demand / cached)
  Module: Risk Lens™ (Gemini) | Entity: ai_compliance_insights
↓
[Manual] Link to related entities (vendors, controls, findings, policies, frameworks, evidence)
  Entities: 6 junction tables (risk_vendors, risk_controls, risk_findings, risk_policies, risk_frameworks, risk_evidence)
↓
[Auto] Risk feeds Trust Intelligence™ (Risk Posture component — 25% of Org Trust Score)
↓
OUTCOME: Documented risk with treatment plan

⚠ MISSING STEPS:
  - No approval of risk status change (open → accepted requires sign-off in regulated industries)
  - No risk scoring review board workflow
  - No auto-creation from assessment or finding
```

---

### 2.10 Audit Planning

```
TRIGGER: Annual audit plan or triggered audit (incident, monitoring alert, request)
↓
[Manual] Create audit record
  Inputs: name, type (internal/external/iso/soc2/dpdp/custom), scope, objective, auditor name, dates
  Module: Audit Management | Entity: Audit
↓
[Manual] Link to framework (optional)
↓
[Auto] Generate audit program from framework controls
  Module: Audit Management | Entity: audit_programs (bulk insert from controls)
  ⚠ DECISION: Is this framework-based?
    YES → Auto-generate program items from controls
    NO → Manual program item creation
↓
[Manual] Review and adjust program items
↓
[Manual] Assign individual program items to auditors (no assignment field in current schema)
↓
OUTCOME: Audit record with program checklist

⚠ MISSING STEPS:
  - No audit scheduling / recurring audit calendar
  - No audit kickoff notification to stakeholders
  - No individual program item assignment
  - No audit budget / hour tracking
  - No pre-audit document request initiation (separate from Auditor Collaboration™)
  - No monitoring alert → audit auto-creation
```

---

### 2.11 Audit Execution

```
TRIGGER: Audit status changed to Active (manual action)
↓
[Manual] Work through program checklist items
  Status: pending → reviewed → passed / failed
  Module: Audit Management | Entity: audit_programs
↓
[Manual] Request evidence from auditees
  (Via document requests in Vendor Hub™ OR via Auditor Collaboration™ — no unified path)
↓
[Auto] AI audit summary generated (cached)
  Module: Audit Management (Gemini) | Entity: ai_compliance_insights
↓
[Manual] Raise findings for failed program items
  Module: Audit Management | Entity: audit_findings
  AI: AI Finding Generator (observation → structured finding) ✅
↓
[Manual] Create CAPAs per finding
  Module: Audit Management | Entity: corrective_actions
  AI: AI CAPA Suggestions (3 per finding) ✅
↓
[Manual] Complete audit → status = Completed
↓
[Manual] Generate audit reports (PDF / CSV)
↓
OUTCOME: Completed audit with findings and CAPAs

⚠ MISSING STEPS:
  - No workpaper / working document management
  - No team collaboration (comments on program items)
  - No cross-auditor assignment
  - No time tracking
```

---

### 2.12 Policy Lifecycle

```
TRIGGER: New policy required or annual review date reached
↓
[Manual] Create policy
  Inputs: name, description, category, owner, effective date, review date
  Module: Policy Governance™ | Entity: Policy
↓
[Manual] Status: Draft → Under Review → Approved
  Review records created for each state change
↓
[Auto] Version snapshot created on each update
  Entity: policy_versions
↓
[Manual] Link policy to controls and frameworks
  Entities: policy_controls junction, policy_frameworks junction
↓
[Manual] Create attestation (assign to users)
  Entity: attestations, attestation_responses
↓
[Manual] Track attestation completion %
  ⚠ DECISION: All users attested?
    YES → Policy cycle complete
    NO → Send reminder (no auto-reminder in platform)
↓
[Manual] Schedule next review
↓
OUTCOME: Approved policy with version history and attestation record

⚠ MISSING STEPS:
  - No attestation auto-reminders / escalation
  - No policy exception entity (formal exception process)
  - No policy PDF export
  - No policy effectiveness metric
```

---

### 2.13 Exception Management

```
TRIGGER: Business unit cannot comply with a policy requirement
↓
⚠ NO DEDICATED EXCEPTION PROCESS
  Current approach: Create an Issue in Issue & Remediation Hub™ with sourceModule = policy
↓
[Manual] Create Issue with exception context
  Module: Issue & Remediation Hub™ | Entity: Issue
↓
[Manual] Exception reviewed via issue workflow
  Decision: Approve exception / Reject / Conditional
  (No formal exception entity, no expiry date on exception, no re-review schedule)
↓
OUTCOME: Exception tracked as an issue (without formal exception attributes)

⚠ MISSING:
  - No dedicated exception entity with: policy_id FK, justification, compensating control, expiry date, approver, re-review date
  - No exception reporting
  - No exception in Trust Intelligence or benchmarking
  - No exception inventory for auditors
```

---

### 2.14 Regulatory Change Management

```
TRIGGER: Regulation amended or new regulation published
↓
[Manual / Seed] Regulation exists in library (18 built-in global + org-specific)
↓
[Manual] Create regulatory change record
  Inputs: title, description, severity (critical/high/medium/low), regulation link
  Module: Regulatory Intelligence™ | Entity: regulatory_changes
↓
[Auto] Alert auto-generated for high/critical severity changes
  Entity: regulatory_alerts
↓
[Manual] Advance change status: new → under_review → assessed → actioned → closed
↓
[Manual] Create impact assessment
  Module: Regulatory Intelligence™ | Entity: regulatory_assessments
  AI: Per-change AI analysis (keyChanges + requiredActions + impactAreas) ✅
↓
[Manual] Extract and create obligation records
  Module: Regulatory Intelligence™ | Entity: obligations
  AI: Obligation extraction (Gemini) ✅
↓
[Manual] Map obligations to controls
  Entity: obligation_mappings (obligation ↔ control)
  AI: Control mapping suggestions (Gemini) ✅
↓
[Auto] AI Compliance Horizon™ forecast updated (cached 24h)
↓
OUTCOME: Change assessed, obligations created, controls mapped

⚠ MISSING STEPS:
  - No integration with regulatory monitoring services (auto-ingestion of changes)
  - No workflow assignment (who is responsible for actioning this change?)
  - No regulatory change reporting in Executive Reporting
```

---

### 2.15 Executive Reporting

```
TRIGGER: Board meeting approaching, monthly cycle, or on-demand request
↓
[Auto] Daily Org Trust Score™ snapshot (cron)
  Module: Trust Intelligence™ | Entity: governance_snapshots
↓
[Manual] Navigate to Executive Reporting™
↓
[Manual] Select role dashboard (CEO / CRO / CISO / Compliance / Board / Custom)
  Each shows role-relevant KPI subset
↓
[Auto] KPIs computed via parallel queries (10 KPIs)
  Entity: analytics_kpis
↓
[Manual] Generate board report (8 types)
  AI: Board report generator (Gemini) ✅
↓
[Manual] Schedule report delivery
  Entity: analytics_schedules
  ⚠ NOTE: Scheduling exists but email delivery (RESEND_API_KEY) may not be configured
↓
[Manual] Download PDF or CSV
↓
OUTCOME: Board-ready report with KPIs and AI narrative

⚠ MISSING STEPS:
  - No board-specific secure portal (reports emailed as PDFs)
  - No comment / annotation on reports
  - No report version comparison
  - No board member acknowledgment tracking
```

---

## 3. Process Dependency Matrix

### Primary governance process chain

```
Vendor Onboarding
    ↓ [Manual]
Vendor Classification
    ↓ [Manual]
Vendor Assessment          ←── Custom Assessment Templates (MISSING)
    ↓ [BREAK — manual]
Risk Identification        ←── No auto-creation from assessment
    ↓ [Manual]
Risk Assessment
    ↓ [Manual]
Risk Treatment
    ↓ [Manual link]
Control Management         ←── Control Health auto-updated
    ↓ [Auto]
Evidence Collection        ←── Auto-import from vendor / auto from checks
    ↓ [Auto]
Compliance Assessment      ←── Readiness auto-computed
    ↓ [Auto]
Vendor Monitoring          ←── 7 rules, agents
    ↓ [BREAK — manual]
Audit Planning             ←── No alert → audit auto-trigger
    ↓ [Manual]
Audit Execution
    ↓ [Manual]
Finding Management
    ↓ [BREAK — manual]
CAPA Management            ←── No auto-link to Issue Hub
    ↓ [BREAK — manual]
Issue → Remediation
    ↓ [Manual]
Vendor Renewal             ←── Aggregated decision (MISSING)
    ↓ [BREAK — no process]
Vendor Offboarding         ←── ENTIRE PROCESS MISSING
```

### Automated transitions (no user action required)

| From | To | Mechanism |
|---|---|---|
| Document upload | Evidence record | Auto-import bridge in evidence-service |
| Assessment completion | Evidence record | Auto-import bridge in evidence-service |
| Vendor review | Evidence record | Auto-import bridge in evidence-service |
| Control / evidence status change | Readiness score | `recomputeReadiness()` fire-and-forget |
| Page load (stale > 1h) | Trust Score refresh | `computeAndSaveTrustScore()` |
| Daily cron | Org Trust Score snapshot | `governance-snapshot` cron |
| Daily cron | Monitoring rule evaluation | `governance-snapshot` cron |
| Daily cron | Trial / subscription expiry | `billing` cron |
| Compliance check run | Evidence record + control validation | Continuous Compliance™ |
| High/critical regulatory change | Regulatory alert | `createChange()` service |
| CAPA created | Finding status → remediating | `capa-service.ts` side effect |

### Manual transitions (require user action, candidates for automation)

| From | To | Gap severity |
|---|---|---|
| Assessment score | Risk record | ❌ Critical |
| Governance alert | Audit creation | ❌ Critical |
| Audit finding | Issue in Issue Hub | ❌ Critical |
| CAPA blocked | Issue escalation | ❌ High |
| Contract expiry alert | Renewal decision workflow | ❌ High |
| Renewal decision | Offboarding initiation | ❌ High |
| Regulatory change | Obligation tasks assigned | ⚠️ Medium |
| Evidence expiry | Evidence renewal task | ⚠️ Medium |
| Policy attestation due | Reminder notification | ⚠️ Medium |
| Risk treatment overdue | Escalation to risk owner | ⚠️ Medium |

---

## 4. Automation Assessment

### Current automation inventory

| Automation | Trigger | Module | Frequency |
|---|---|---|---|
| Vendor Trust Score recompute | Page load (stale > 1h) | Trust Score™ | Per visit |
| Evidence auto-import from vendor entities | Document / assessment / review created | Evidence Vault™ | On event |
| Compliance readiness recompute | Control or evidence status changed | Evidence Vault™ | On event |
| CAPA auto-links finding to "remediating" | CAPA created for finding | Audit Management | On create |
| Governance snapshot | Daily cron | Trust Intelligence™ | Daily |
| Monitoring rule evaluation (7 rules) | Daily cron / manual | Continuous Monitoring™ | Daily |
| Governance alert generation | Monitoring rules fire | Continuous Monitoring™ | On rule |
| Trial / subscription expiry | Daily billing cron | Finance / Billing | Daily |
| Continuous compliance check | Manual trigger | Continuous Compliance™ | On demand |
| Regulatory alert auto-creation | High/critical change created | Regulatory Intelligence™ | On create |
| Agent observation generation | Agent run | Governance Agent Framework™ | Scheduled / manual |
| AI insight caching | First request per entity (24h TTL) | All AI services | On demand |

### Automation gaps by process

| Process | Critical missing automation | Impact |
|---|---|---|
| Vendor Classification | No reclassification trigger when assessment score drops | High risk vendors may be under-classified |
| Vendor Assessment | No periodic reassessment scheduling | Critical vendors may go 2+ years without reassessment |
| Vendor Approval | No approval workflow automation at all | Unapproved vendors can be used immediately |
| Vendor Monitoring | Alert does not auto-create audit or issue | Alerts require manual follow-through |
| Vendor Renewal | No renewal decision workflow trigger | Contracts may auto-renew without governance review |
| Vendor Offboarding | Entire process is manual / non-existent | Regulatory exposure, data leakage risk |
| Risk Identification | No auto-risk from assessment, finding, or alert | Risk register is always incomplete |
| Audit Planning | No scheduled audit creation from annual plan | Audits must be manually created each cycle |
| Policy Attestation | No auto-reminders for non-attestors | Compliance manager must manually chase |
| Evidence Collection | No auto-task when evidence expires | Expired evidence creates silent gaps |
| Exception Management | No expiry and re-review automation | Exceptions may never be reviewed again |
| Finding Management | No auto-escalation when finding exceeds age | Critical findings may sit open indefinitely |

### Priority automation opportunities (ranked)

| Rank | Opportunity | Estimated effort | Impact |
|---|---|---|---|
| 1 | Alert → Issue / Audit auto-creation (one-click from alert card) | Low | Critical |
| 2 | Assessment → Risk auto-promotion (one-click + pre-fill) | Low | Critical |
| 3 | Evidence expiry → Renewal task auto-creation | Low | High |
| 4 | Policy attestation auto-reminders (email at due date and overdue) | Medium | High |
| 5 | Periodic assessment scheduling (due-date on vendor record) | Medium | High |
| 6 | Finding age → Auto-escalation after N days | Medium | High |
| 7 | CAPA overdue → Auto-escalation to risk owner | Medium | High |
| 8 | Vendor approval workflow (status gate before active) | Medium | Critical |
| 9 | Contract renewal workflow trigger (90/60/30-day alerts + decision form) | Medium | High |
| 10 | Regulatory change → Obligation task auto-assignment | Medium | Medium |

---

## 5. AI Maturity Assessment

### AI maturity scale

- **L0 — None:** No AI
- **L1 — Contextual:** AI uses entity as background context only
- **L2 — On-demand:** AI generates insight on user request
- **L3 — Proactive:** AI generates insight on page load or event trigger without user request
- **L4 — Autonomous:** AI acts without user input (scheduled / event-driven)

### Process-level AI maturity

| Process | AI today | Level | What AI does | What AI should do |
|---|---|---|---|---|
| Vendor Onboarding | Document extraction, vendor brief, NL search | L3 | Extracts 10 fields, generates vendor brief, enables NL search | Auto-suggest classification tier from extracted data |
| Vendor Classification | None | L0 | — | Suggest risk tier from category, geography, and data access |
| Vendor Assessment | Assessment summary | L2 | Generates AI narrative of assessment result | Auto-suggest risk records from failing question responses |
| Vendor Risk Assessment | Risk narrative, mitigation recommendations | L3 | Generates narrative and treatment suggestions | Auto-create risk from assessment or finding trigger |
| Vendor Monitoring | Governance Copilot™, agent observations | L3 | NL chat, agent-generated observations | Proactive anomaly detection, auto-escalation |
| Vendor Renewal | Contract health analysis, renewal risk | L3 | Recommend Continue / Renegotiate / Exit | Trigger renewal decision workflow automatically |
| Vendor Offboarding | None | L0 | — | Generate offboarding checklist from vendor data |
| Compliance Assessment | Framework summary, gap narrative, executive summary | L3 | Summarises readiness, explains gaps | Proactively flag new gaps when control status changes |
| Evidence Collection | Gap analysis (Auditor Collaboration) | L1 | Context for gap analysis | Classify uploaded evidence, suggest control mappings |
| Control Management | Control narrative, gap detection, executive summary | L3 | Narratives, top 5 gaps, board summary | Auto-detect controls drifting toward failure |
| Control Testing | None | L0 | — | Suggest test procedures per control type |
| Risk Identification | AI Risk Officer, executive report | L3 | Executive report, NL chat | Auto-detect emerging risks from integrated data |
| Risk Assessment | Risk narrative, mitigation recommendations | L3 | Narrative, 5 treatment suggestions | Score risk automatically from contextual signals |
| Risk Treatment | Via risk context only | L1 | Background context | Alert when treatment is falling behind schedule |
| Audit Planning | None | L0 | — | Suggest audit scope and program from risk posture |
| Audit Execution | Audit summary, finding generator, CAPA suggestions | L3 | AI drafts findings and CAPAs | Auto-flag program items that are likely to fail based on evidence |
| Finding Management | AI Finding Generator, CAPA suggestions | L2 | Structured finding from observation | Predict recurrence risk, suggest root cause |
| CAPA Management | AI CAPA Suggestions | L2 | 3 CAPA suggestions per finding | Track CAPA effectiveness after completion |
| External Auditor Collaboration | Evidence gap analysis, finding drafter | L2 | Gap analysis, AI finding draft | Proactively surface most relevant evidence per request |
| Policy Lifecycle | Policy summary (via compliance) | L2 | Summary in compliance context | Generate policy draft from regulatory obligation |
| Policy Attestation | None | L0 | — | Identify which users are least likely to attest based on history |
| Exception Management | None (no dedicated process) | L0 | — | Suggest compensating controls for approved exceptions |
| Regulatory Change Management | Change analysis, obligation extraction, control suggestions, horizon forecast | L3 | Full AI analysis + AI Horizon forecast | Auto-monitor public regulatory feeds |
| Executive Reporting | Board report generator, executive summary, trend analysis | L3 | Board-ready narrative, KPI commentary | Proactively flag governance deterioration before board meeting |
| Data Asset Registration | None | L0 | — | Auto-classify data assets from description |
| Privacy Impact Assessment | None | L0 | — | AI-guided PIA questionnaire with risk scoring |
| Consent Management | None | L0 | — | Flag consent records approaching expiry |
| Data Subject Requests | None | L0 | — | Auto-classify DSR type, suggest response template |
| AI System Registration | Governance summary | L2 | Summary of AI system posture | Auto-classify AI system risk level from description |
| AI Risk Assessment | Risk advisory, compliance readiness | L2 | 5 recommendations, compliance analysis | Auto-detect AI system drift and hallucination risks |
| AI Monitoring | Prompt audit (sensitivity classification) | L3 | Classify prompt sensitivity automatically | Auto-block high-risk prompts before they are sent |
| Workflow Automation | AI workflow generator | L2 | Generate workflow definition from description | Proactively suggest workflows when repetitive manual patterns detected |

### AI maturity summary

| Level | Count | Processes |
|---|---|---|
| **L4 Autonomous** | 0 | None — Agent Framework is the closest but requires human approval of every action |
| **L3 Proactive** | 13 | Vendor Onboarding, Vendor Risk Assessment, Vendor Monitoring, Vendor Renewal, Compliance Assessment, Control Management, Risk Identification, Risk Assessment, Audit Execution, Regulatory Change Management, Executive Reporting, AI Monitoring, Executive Reporting |
| **L2 On-demand** | 10 | Vendor Assessment, Finding Management, CAPA Management, External Auditor Collaboration, Policy Lifecycle, AI System Registration, AI Risk Assessment, Workflow Automation + 2 others |
| **L1 Contextual** | 3 | Evidence Collection, Risk Treatment, External Auditor Collaboration |
| **L0 None** | 10 | Vendor Classification, Vendor Offboarding, Control Testing, Audit Planning, Policy Attestation, Exception Management, Data Asset Registration, Privacy Impact Assessment, Consent Management, Data Subject Requests |

**Platform AI maturity score: 2.8 / 4.0**  
Strong AI coverage across GRC core. Entire privacy domain and platform operational processes have no AI.

---

## 6. Reporting Coverage Matrix

| Process | Dashboard | KPI | Executive Report | Trends | Benchmarking | PDF | CSV |
|---|---|---|---|---|---|---|---|
| Vendor Onboarding | ✅ Hub metrics | ✅ vendor count | ✅ Trust Intelligence | ✅ | ✅ Vendor Trust | ✅ | ✅ |
| Vendor Classification | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Vendor Assessment | ✅ per vendor | ❌ | ✅ vendor report | ❌ | ❌ | ✅ | ❌ |
| Vendor Risk Assessment | ✅ Risk dashboard | ✅ open risks | ✅ Risk executive | ✅ | ✅ Risk | ❌ | ✅ |
| Vendor Approval | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Vendor Monitoring | ✅ Monitoring tab | ✅ alerts | ✅ Trust Intelligence | ✅ | ✅ | ❌ | ❌ |
| Vendor Review | ✅ per vendor | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Vendor Renewal | ✅ Renewals tab | ✅ expiring | ✅ Contract | ❌ | ✅ Contract | ❌ | ✅ |
| Vendor Offboarding | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Compliance Assessment | ✅ Vault dashboard | ✅ avg readiness | ✅ Compliance | ✅ | ✅ Compliance | ✅ | ✅ |
| Evidence Collection | ✅ evidence counts | ✅ expiring docs | ✅ | ✅ | ❌ | ❌ | ✅ |
| Control Management | ✅ Control dashboard | ✅ health avg | ✅ Control Center | ✅ | ✅ Controls | ❌ | ✅ |
| Control Testing | ✅ tests tab | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Risk Identification | ✅ Risk register | ❌ | ✅ Risk officer | ❌ | ❌ | ❌ | ✅ |
| Risk Assessment | ✅ Risk dashboard | ✅ critical risks | ✅ Risk executive | ✅ | ✅ | ❌ | ✅ |
| Risk Treatment | ✅ treatments tab | ❌ | ✅ (via risk) | ❌ | ❌ | ❌ | ✅ |
| Continuous Compliance | ✅ checks dashboard | ✅ | ✅ | ❌ | ✅ Automation | ❌ | ❌ |
| Audit Planning | ✅ Audit dashboard | ✅ planned audits | ✅ | ✅ | ✅ Audit | ❌ | ❌ |
| Audit Execution | ✅ Audit detail | ✅ findings | ✅ Audit executive | ✅ | ✅ | ✅ | ✅ |
| Evidence Request | ✅ Collab dashboard | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Finding Management | ✅ Findings tab | ✅ critical findings | ✅ | ❌ | ❌ | ✅ | ✅ |
| CAPA Management | ✅ CAPAs tab | ✅ overdue CAPAs | ✅ | ❌ | ❌ | ✅ | ✅ |
| External Auditor Collab | ✅ Collab dashboard | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Policy Lifecycle | ✅ Policy dashboard | ❌ | ✅ (via compliance) | ❌ | ❌ | ❌ | ❌ |
| Policy Attestation | ✅ completion % | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Exception Management | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Regulatory Change Mgmt | ✅ Reg dashboard | ✅ readiness | ✅ (via executive) | ❌ | ❌ | ❌ | ❌ |
| Executive Reporting | ✅ Analytics Hub | ✅ 10 KPIs | ✅ Full board report | ✅ | ✅ | ✅ | ✅ |
| Data Asset Registration | ✅ Asset catalog | ✅ PII assets | ✅ (via executive) | ❌ | ❌ | ❌ | ❌ |
| Privacy Impact Assessment | ✅ DPDP dashboard | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Consent Management | ✅ DPDP dashboard | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Data Subject Requests | ✅ DPDP dashboard | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Data Retention | ✅ DPDP dashboard | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| AI System Registration | ✅ AI Gov dashboard | ✅ system count | ✅ (via executive) | ❌ | ❌ | ❌ | ❌ |
| AI Risk Assessment | ✅ AI risks tab | ❌ | ✅ AI advisory | ❌ | ❌ | ❌ | ❌ |
| AI Compliance Assessment | ✅ AI compliance tab | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| AI Monitoring | ✅ SCC dashboard | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| User Onboarding | ✅ Team tab | ✅ user count | ❌ | ❌ | ❌ | ❌ | ❌ |
| Team Management | ✅ Team tab | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Integration Setup | ✅ Hub dashboard | ✅ connected | ❌ | ❌ | ✅ Automation | ❌ | ❌ |
| Workflow Automation | ✅ Studio dashboard | ❌ | ❌ | ❌ | ✅ Automation | ❌ | ❌ |
| API Integration | ✅ API dashboard | ✅ API calls | ❌ | ❌ | ❌ | ❌ | ❌ |

**Processes with no reporting at all:** Vendor Classification, Vendor Approval, Vendor Offboarding, Exception Management.

---

## 7. Enterprise Readiness Assessment

| Process | Multi-user | RBAC | Audit trail | Notifications | Approvals | Version history | Delegation | Comments | SLA tracking |
|---|---|---|---|---|---|---|---|---|---|
| **Vendor Onboarding** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Vendor Classification** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Vendor Assessment** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Vendor Approval** | N/A | N/A | N/A | N/A | ❌ (missing) | N/A | N/A | N/A | N/A |
| **Vendor Monitoring** | ✅ | ✅ | ✅ | ❌ | ❌ | N/A | ❌ | ❌ | ❌ |
| **Vendor Renewal** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Compliance Assessment** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Evidence Collection** | ✅ | ✅ | ✅ | ❌ | ✅ (status change) | ❌ | ❌ | ❌ | ❌ |
| **Control Management** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Control Testing** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Risk Assessment** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Risk Treatment** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Audit Planning** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Audit Execution** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Finding Management** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **CAPA Management** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (overdue detect) |
| **External Audit Collab** | ✅ | ✅ | ✅ | ❌ | ✅ (accept/reject) | ❌ | ❌ | ✅ comments | ❌ |
| **Policy Lifecycle** | ✅ | ✅ | ✅ | ❌ | ✅ (status advance) | ✅ | ❌ | ❌ | ❌ |
| **Policy Attestation** | ✅ | ✅ | ✅ | ❌ | ✅ (sign-off) | N/A | ❌ | ❌ | ❌ |
| **Exception Management** | ✅ (via Issue Hub) | ✅ | ✅ | ❌ | ✅ (issue approval) | ❌ | ❌ | ❌ | ✅ SLA (Issue Hub) |
| **Regulatory Change** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Executive Reporting** | ✅ | ✅ | ✅ | ❌ (delivery not live) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Issue Management** | ✅ | ✅ | ✅ | ❌ | ✅ exceptions | ❌ | ❌ | ❌ | ✅ |
| **Privacy Processes** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **AI Governance** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **User Onboarding** | ✅ | ✅ | ✅ | ✅ (invite email) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Team Management** | ✅ | ✅ | ✅ | ✅ (invite email) | ✅ (ownership transfer) | ❌ | ❌ | ❌ | ❌ |

### Enterprise readiness gaps

**Notifications: consistently absent across all processes.**  
Every process that has a monitoring alert, deadline, or status change should support configurable email/Slack/webhook notifications. Currently only team invites and Resend-based weekly digest exist. Notification Preferences table exists but scope is limited.

**Approvals: absent from most processes.**  
Only Issue Hub, Policy, and Attestation have formal approval workflows. Risk acceptance, finding closure, CAPA completion, evidence approval, vendor onboarding, and classification all lack formal approval gates that regulated industries require.

**Comments: absent from almost all processes.**  
External Auditor Collaboration™ has comments via `external_comments` table. No other process supports in-context comments on entities (vendor, risk, control, finding, CAPA).

**Delegation: entirely absent.**  
No process allows a user to delegate a task or approval to another user. In large teams, this is essential — a CISO must be able to delegate control testing assignments.

**Version history: limited to Policy.**  
Only Policy has version snapshots (`policy_versions` table). Risk register entries, controls, and vendor records have no version history — only audit logs record changes at the row level.

---

## 8. Business Process Scorecard

### Scoring methodology

Each process scored on 7 dimensions (each /10), then averaged:

| Dimension | Weight |
|---|---|
| Workflow Completeness | All steps present? |
| Automation | Degree of automation vs manual |
| AI | AI maturity level |
| Reporting | Dashboard, KPIs, board reports, trends |
| Cross-Module Integration | Connected to upstream/downstream |
| Enterprise Readiness | RBAC, approvals, notifications, audit trail, comments |
| User Experience | Guided, clear, low friction |

### Vendor Lifecycle scores

| Process | Workflow | Automation | AI | Reporting | Integration | Enterprise | UX | **Overall** |
|---|---|---|---|---|---|---|---|---|
| **Vendor Onboarding** | 7 | 6 | 8 | 7 | 7 | 4 | 7 | **6.6** |
| **Vendor Classification** | 3 | 1 | 1 | 1 | 3 | 3 | 4 | **2.3** |
| **Vendor Assessment** | 6 | 5 | 6 | 5 | 6 | 4 | 6 | **5.4** |
| **Vendor Risk Assessment** | 7 | 4 | 7 | 7 | 7 | 4 | 6 | **6.0** |
| **Vendor Approval** | 1 | 1 | 1 | 1 | 1 | 1 | 1 | **1.0** |
| **Vendor Monitoring** | 7 | 7 | 7 | 7 | 7 | 4 | 7 | **6.6** |
| **Vendor Review** | 5 | 3 | 4 | 4 | 5 | 4 | 5 | **4.3** |
| **Vendor Renewal** | 4 | 3 | 7 | 6 | 5 | 3 | 5 | **4.7** |
| **Vendor Offboarding** | 1 | 1 | 1 | 1 | 1 | 1 | 1 | **1.0** |
| **Domain average** | | | | | | | | **4.2** |

### Risk & Compliance scores

| Process | Workflow | Automation | AI | Reporting | Integration | Enterprise | UX | **Overall** |
|---|---|---|---|---|---|---|---|---|
| **Compliance Assessment** | 9 | 7 | 8 | 9 | 8 | 5 | 8 | **7.7** |
| **Evidence Collection** | 7 | 7 | 5 | 7 | 8 | 5 | 7 | **6.6** |
| **Control Management** | 8 | 6 | 8 | 8 | 8 | 5 | 8 | **7.3** |
| **Control Testing** | 7 | 4 | 2 | 6 | 7 | 4 | 7 | **5.3** |
| **Risk Identification** | 5 | 3 | 7 | 7 | 5 | 4 | 5 | **5.1** |
| **Risk Assessment** | 8 | 5 | 8 | 8 | 7 | 4 | 7 | **6.7** |
| **Risk Treatment** | 7 | 4 | 5 | 6 | 6 | 4 | 7 | **5.6** |
| **Continuous Compliance** | 7 | 8 | 6 | 7 | 7 | 4 | 7 | **6.6** |
| **Domain average** | | | | | | | | **6.4** |

### Audit & Assurance scores

| Process | Workflow | Automation | AI | Reporting | Integration | Enterprise | UX | **Overall** |
|---|---|---|---|---|---|---|---|---|
| **Audit Planning** | 6 | 4 | 2 | 7 | 6 | 4 | 6 | **5.0** |
| **Audit Execution** | 7 | 4 | 8 | 8 | 6 | 4 | 7 | **6.3** |
| **Evidence Request** | 8 | 5 | 6 | 5 | 6 | 7 | 7 | **6.3** |
| **Finding Management** | 7 | 4 | 7 | 7 | 5 | 4 | 6 | **5.7** |
| **CAPA Management** | 7 | 5 | 6 | 7 | 5 | 5 | 7 | **6.0** |
| **External Auditor Collab** | 8 | 5 | 7 | 6 | 7 | 8 | 8 | **7.0** |
| **Domain average** | | | | | | | | **6.1** |

### Governance scores

| Process | Workflow | Automation | AI | Reporting | Integration | Enterprise | UX | **Overall** |
|---|---|---|---|---|---|---|---|---|
| **Policy Lifecycle** | 8 | 5 | 6 | 6 | 7 | 7 | 8 | **6.7** |
| **Policy Attestation** | 7 | 3 | 2 | 5 | 5 | 6 | 6 | **4.9** |
| **Exception Management** | 3 | 2 | 1 | 1 | 3 | 5 | 4 | **2.7** |
| **Regulatory Change Mgmt** | 7 | 4 | 8 | 7 | 6 | 4 | 7 | **6.1** |
| **Executive Reporting** | 8 | 7 | 8 | 9 | 8 | 5 | 8 | **7.6** |
| **Domain average** | | | | | | | | **5.6** |

### Privacy scores

| Process | Workflow | Automation | AI | Reporting | Integration | Enterprise | UX | **Overall** |
|---|---|---|---|---|---|---|---|---|
| **Data Asset Registration** | 7 | 4 | 2 | 6 | 6 | 4 | 7 | **5.1** |
| **Privacy Impact Assessment** | 5 | 3 | 2 | 5 | 5 | 4 | 5 | **4.1** |
| **Consent Management** | 6 | 3 | 1 | 5 | 4 | 4 | 5 | **4.0** |
| **Data Subject Requests** | 6 | 3 | 1 | 5 | 4 | 4 | 5 | **4.0** |
| **Data Retention** | 6 | 4 | 1 | 5 | 5 | 4 | 5 | **4.3** |
| **Domain average** | | | | | | | | **4.3** |

### AI Governance scores

| Process | Workflow | Automation | AI | Reporting | Integration | Enterprise | UX | **Overall** |
|---|---|---|---|---|---|---|---|---|
| **AI System Registration** | 7 | 4 | 6 | 6 | 5 | 4 | 7 | **5.6** |
| **AI Risk Assessment** | 6 | 4 | 6 | 6 | 5 | 4 | 6 | **5.3** |
| **AI Compliance Assessment** | 6 | 4 | 6 | 6 | 5 | 4 | 6 | **5.3** |
| **AI Monitoring** | 6 | 5 | 7 | 6 | 5 | 4 | 6 | **5.6** |
| **Domain average** | | | | | | | | **5.5** |

### Platform scores

| Process | Workflow | Automation | AI | Reporting | Integration | Enterprise | UX | **Overall** |
|---|---|---|---|---|---|---|---|---|
| **User Onboarding** | 6 | 5 | 1 | 4 | 5 | 6 | 7 | **4.9** |
| **Team Management** | 8 | 5 | 1 | 5 | 5 | 7 | 8 | **5.6** |
| **Integration Setup** | 7 | 6 | 6 | 6 | 6 | 4 | 6 | **5.9** |
| **Workflow Automation** | 4 | 4 | 5 | 4 | 2 | 4 | 4 | **3.9** |
| **API Integration** | 8 | 6 | 5 | 7 | 6 | 5 | 7 | **6.3** |
| **Domain average** | | | | | | | | **5.3** |

### Executive Business Process Matrix

| Business Process | Complete | Automated | AI | Enterprise Ready | **Score /10** |
|---|---|---|---|---|---|
| **Vendor Onboarding** | ⚠️ Partial | ⚠️ Partial | ✅ Strong | ❌ No | 6.6 |
| **Vendor Classification** | ❌ Missing steps | ❌ None | ❌ None | ❌ No | 2.3 |
| **Vendor Assessment** | ⚠️ Partial | ⚠️ Partial | ⚠️ Limited | ❌ No | 5.4 |
| **Vendor Risk Assessment** | ⚠️ Partial | ❌ Minimal | ✅ Strong | ❌ No | 6.0 |
| **Vendor Approval** | ❌ Not built | ❌ None | ❌ None | ❌ No | 1.0 |
| **Vendor Monitoring** | ⚠️ Partial | ✅ Good | ✅ Strong | ❌ No | 6.6 |
| **Vendor Review** | ⚠️ Partial | ❌ None | ⚠️ Limited | ❌ No | 4.3 |
| **Vendor Renewal** | ❌ Partial | ❌ None | ✅ Good | ❌ No | 4.7 |
| **Vendor Offboarding** | ❌ Not built | ❌ None | ❌ None | ❌ No | 1.0 |
| **Compliance Assessment** | ✅ Complete | ✅ Good | ✅ Strong | ⚠️ Partial | 7.7 |
| **Evidence Collection** | ✅ Complete | ✅ Good | ⚠️ Contextual | ⚠️ Partial | 6.6 |
| **Control Management** | ✅ Complete | ⚠️ Partial | ✅ Strong | ⚠️ Partial | 7.3 |
| **Control Testing** | ⚠️ Partial | ❌ Minimal | ❌ None | ⚠️ Partial | 5.3 |
| **Risk Identification** | ⚠️ Partial | ❌ Minimal | ✅ Good | ❌ No | 5.1 |
| **Risk Assessment** | ✅ Complete | ⚠️ Partial | ✅ Strong | ❌ No | 6.7 |
| **Risk Treatment** | ✅ Complete | ⚠️ Partial | ⚠️ Limited | ❌ No | 5.6 |
| **Continuous Compliance** | ✅ Complete | ✅ Strong | ⚠️ Good | ❌ No | 6.6 |
| **Audit Planning** | ⚠️ Partial | ❌ Minimal | ❌ None | ⚠️ Partial | 5.0 |
| **Audit Execution** | ⚠️ Partial | ❌ Minimal | ✅ Strong | ❌ No | 6.3 |
| **Evidence Request** | ✅ Complete | ⚠️ Partial | ⚠️ Good | ✅ Good | 6.3 |
| **Finding Management** | ⚠️ Partial | ❌ Minimal | ✅ Good | ❌ No | 5.7 |
| **CAPA Management** | ⚠️ Partial | ⚠️ Partial | ⚠️ Good | ❌ No | 6.0 |
| **External Auditor Collab** | ✅ Complete | ⚠️ Partial | ⚠️ Good | ✅ Good | 7.0 |
| **Policy Lifecycle** | ✅ Complete | ⚠️ Partial | ⚠️ Limited | ✅ Good | 6.7 |
| **Policy Attestation** | ⚠️ Partial | ❌ Minimal | ❌ None | ⚠️ Partial | 4.9 |
| **Exception Management** | ❌ Informal | ❌ None | ❌ None | ⚠️ Partial | 2.7 |
| **Regulatory Change Mgmt** | ✅ Complete | ⚠️ Partial | ✅ Strong | ❌ No | 6.1 |
| **Executive Reporting** | ✅ Complete | ✅ Good | ✅ Strong | ⚠️ Partial | 7.6 |
| **Privacy Processes** | ⚠️ Partial | ❌ Minimal | ❌ None | ❌ No | 4.3 |
| **AI Governance** | ⚠️ Partial | ⚠️ Partial | ⚠️ Good | ❌ No | 5.5 |
| **Platform / Team** | ✅ Complete | ⚠️ Partial | ❌ Minimal | ✅ Good | 5.3 |
| **API Integration** | ✅ Complete | ✅ Good | ⚠️ Good | ⚠️ Partial | 6.3 |

**Platform average: 5.5 / 10**

---

## 9. Workflow Gap Analysis

### Processes not built (score 1.0)

**Vendor Approval**  
No formal approval gate before a vendor can be used. Enterprise procurement policies universally require formal sign-off before a vendor is approved for use. This is a commercial blocker for regulated industries (banking, healthcare, insurance).

**Vendor Offboarding**  
No structured exit process. Access tokens remain valid, data obligations remain open, risks remain linked, and no final audit is generated. This is a regulatory compliance risk for any customer subject to DPDP, GDPR, or financial regulations.

**Exception Management (formal)**  
Policy exceptions are tracked as Issues with no dedicated entity, no expiry, no formal approval chain, and no reporting. Auditors expect a formal exception register.

---

### Critical workflow breaks

| Break | From | To | Commercial impact |
|---|---|---|---|
| **B1** | Vendor Assessment | Risk Lens™ | Risk register is systematically under-populated. High-risk vendors may have no risk records. |
| **B2** | Governance Alert | Audit / Issue | Alert fatigue — alerts are raised but have no automated follow-through. Users must manually act. |
| **B3** | Audit Finding | Issue Hub | Two separate remediation tracks operate independently. CISO cannot see unified remediation status. |
| **B4** | Contract Expiry | Renewal Decision | Contracts may auto-renew without governance sign-off. |
| **B5** | Renewal Decision | Offboarding | Exit decision has no downstream workflow. |

---

### Missing automation (by process)

| Process | Missing automation | Risk if unaddressed |
|---|---|---|
| Vendor Assessment | Periodic reassessment scheduling | Critical vendors go years without reassessment |
| Vendor Monitoring | Alert-to-action auto-creation | Alerts are seen but not acted upon systematically |
| Evidence Collection | Expiry → renewal task | Expired evidence creates silent compliance gaps |
| Policy Attestation | Non-attestor reminders | Low completion rates for mandatory attestations |
| Audit Planning | Annual audit schedule | Audits must be manually created each year |
| Risk Treatment | Overdue → escalation | Overdue treatments may never be followed up |
| Finding Management | Age → escalation | Critical findings may sit open for months |
| CAPA Management | Blocked → issue escalation | Blocked CAPAs have no path to escalation |
| Regulatory Change | Assignment to responsible user | Changes assessed but no one owns actioning them |

---

### Missing AI opportunities (by process)

| Process | Recommended AI capability | Maturity gain |
|---|---|---|
| Vendor Classification | AI-suggested risk tier from vendor category, geography, data access | L0 → L3 |
| Vendor Approval | AI approval recommendation based on Trust Score + risk + compliance | New process |
| Control Testing | AI-generated test procedures per control type | L0 → L2 |
| Audit Planning | AI-suggested audit scope from risk posture and compliance gaps | L0 → L2 |
| Policy Attestation | AI identification of non-attestor patterns | L0 → L2 |
| Evidence Collection | AI-suggested control mapping for uploaded documents | L1 → L3 |
| Privacy Impact Assessment | AI-guided PIA with risk scoring | L0 → L3 |
| Data Subject Requests | AI-classified DSR type + response template | L0 → L2 |
| Vendor Offboarding | AI-generated offboarding checklist | New process |
| Exception Management | AI-suggested compensating controls for approved exceptions | New process |

---

### Enterprise readiness gaps (platform-wide)

The following gaps apply across all or most processes:

**1. No notifications infrastructure for governance events**  
Almost every process has at least one state change or deadline that should trigger a notification. Currently only team invites and the weekly digest (when RESEND_API_KEY is configured) send emails. A governance notification framework is needed.

**2. No approval workflow framework**  
Approvals are hard-coded into specific entities (policy status, issue exception, attestation sign-off). A configurable approval workflow engine would let admins define approval chains for any entity and process.

**3. No comments on governance entities**  
Users cannot leave comments on risks, controls, findings, CAPAs, vendors, or contracts. This prevents team collaboration and creates a separate communication channel (email, Slack) that is not captured in the governance record.

**4. No delegation**  
No process allows a task, approval, or responsibility to be delegated to another user. Required for large teams and for scenarios where primary owners are unavailable.

**5. No version history on key entities**  
Only Policy has version snapshots. Risk register entries, vendor profiles, and control definitions change over time with no before/after snapshot.

---

## 10. Strategic Recommendations

### Top 10 workflow improvements

| # | Improvement | Process(es) | Outcome |
|---|---|---|---|
| **W1** | Build Vendor Approval workflow — status gate before vendor is active; configurable approval chain; AI recommendation input | Vendor Approval | Eliminates single largest enterprise readiness gap in the Vendor Lifecycle domain |
| **W2** | Build Vendor Offboarding checklist workflow — guided multi-step process (access revocation → obligation closure → risk closure → archive → final audit) | Vendor Offboarding | Closes the lifecycle; required for regulated industries |
| **W3** | Add "Create Risk from Assessment" and "Create Issue from Finding" one-click actions | Vendor Assessment, Finding Management | Closes the two most critical workflow breaks in the platform |
| **W4** | Add "Create Audit" and "Create Issue" actions directly on governance alert cards | Vendor Monitoring | Converts alert review from passive observation to active governance |
| **W5** | Build formal Exception Management process with dedicated entity (policy_id, justification, compensating control, expiry, approver, re-review date) | Exception Management | Makes AUDT audit-ready for regulated industries that require a formal exception register |
| **W6** | Build Vendor Renewal Decision workflow — one screen aggregating Trust Score trend, open risks, open CAPAs, compliance readiness, contract health — and a formal decision record | Vendor Renewal | Closes the renewal lifecycle break; creates formal record of renewal governance |
| **W7** | Add guided Vendor Classification wizard — 3-step inherent risk questionnaire → recommended tier → approver confirmation | Vendor Classification | Makes classification enforceable and consistent across teams |
| **W8** | Add audit scheduling — recurring audit creation (annual, quarterly) with auto-creation from schedule | Audit Planning | Eliminates manual audit creation each cycle; critical for ISO/SOC programmes |
| **W9** | Unify remediation — single "Action Centre" view aggregating CAPAs, Issues, Risk Treatments with source references; preserve individual module detail pages | Finding Management, CAPA Management, Risk Treatment | Gives CISO a single operational home for "what needs fixing today" |
| **W10** | Build Vendor Assessment scheduling — due-date field per vendor, overdue alert, auto-create reassessment task | Vendor Assessment | Ensures critical vendors are regularly reassessed without manual tracking |

---

### Top 10 automation opportunities

| # | Opportunity | Trigger | Action | Priority |
|---|---|---|---|---|
| **A1** | Evidence expiry → renewal task | `evidence.expiry_date < now() + 30 days` | Create task in Issue Hub with owner = evidence owner | Critical |
| **A2** | Assessment completion → risk suggestion | `assessments.score < threshold` per question | Surface "Create Risk" with pre-filled fields; no auto-create | Critical |
| **A3** | Critical governance alert → issue creation | `governance_alerts.severity = critical` | Create Issue in Issue Hub with alert as sourceRef | Critical |
| **A4** | Policy attestation due → reminder email | `attestations.due_date = today - 3 days` | Send reminder email to non-attestors via Resend | High |
| **A5** | Contract renewal window → decision workflow | `contracts.end_date < now() + 90 days` | Create renewal decision task and notify contract owner | High |
| **A6** | Finding age → escalation | `audit_findings.status = open AND created_at < now() - 30 days` (critical) | Create escalation notification to finding owner's manager | High |
| **A7** | Risk treatment overdue → escalation | `risk_treatments.target_date < now() AND status != completed` | Create Issue with treatment as sourceRef; notify risk owner | High |
| **A8** | Vendor trust score critical → vendor review task | `trust_score < 40` | Create vendor review task and notify vendor owner | High |
| **A9** | Periodic reassessment scheduling | `assessments.created_at < now() - 365 days AND vendor risk = critical` | Create assessment task for vendor owner | Medium |
| **A10** | Regulatory change assignment | `regulatory_changes.status = new AND severity IN (critical, high)` | Create task in Issue Hub and assign to Compliance Manager | Medium |

---

### Top 10 AI opportunities

| # | Opportunity | Process | Current maturity | Target maturity |
|---|---|---|---|---|
| **AI1** | AI Vendor Classification Advisor — suggest risk tier from vendor category, data access, geography, contract value | Vendor Classification | L0 | L3 |
| **AI2** | AI Approval Recommendation — before vendor approval, summarise trust posture and recommend Approve / Conditional / Reject | Vendor Approval | N/A | L2 |
| **AI3** | AI Evidence Classifier — when evidence is uploaded, suggest which controls it satisfies and map automatically | Evidence Collection | L1 | L3 |
| **AI4** | AI Control Test Procedure — for any control, generate a test procedure matching its type and frequency | Control Testing | L0 | L2 |
| **AI5** | AI Audit Scope Advisor — based on risk posture, compliance gaps, and last audit findings, recommend audit scope and focus areas | Audit Planning | L0 | L2 |
| **AI6** | AI PIA Assistant — guided Privacy Impact Assessment with AI-scored risk questions and suggested mitigations | Privacy Impact Assessment | L0 | L3 |
| **AI7** | AI DSR Handler — classify incoming data subject request type, suggest response template, flag deadline | Data Subject Requests | L0 | L2 |
| **AI8** | AI Offboarding Checklist Generator — based on vendor data (open risks, contracts, obligations, integrations), generate a personalised offboarding checklist | Vendor Offboarding | L0 | L2 |
| **AI9** | AI Exception Advisor — for approved exceptions, suggest compensating controls and re-review timeline | Exception Management | L0 | L2 |
| **AI10** | AI Risk Identification Agent — proactively identify emerging risks by analysing assessment trends, monitoring alerts, regulatory changes, and finding patterns across the platform | Risk Identification | L3 (passive) | L4 (proactive) |

---

### Top 10 enterprise readiness improvements

| # | Improvement | Scope | Commercial impact |
|---|---|---|---|
| **E1** | **Governance notifications framework** — configurable email/Slack/webhook notifications for any entity status change, deadline, or alert; built as a notification service that all modules can emit to | Platform-wide | Eliminates the need for users to check the platform manually; required for enterprise adoption |
| **E2** | **Configurable approval workflow engine** — define multi-step approval chains for any entity (vendor, risk acceptance, exception, evidence approval, finding closure) | Platform-wide | Replaces hard-coded approvals; enables AUDT to enforce customer governance policies |
| **E3** | **Comments on governance entities** — threaded comments on Vendor, Risk, Control, Finding, CAPA, Contract, and Issue; captured in audit trail | Platform-wide | Eliminates Slack/email side-channels; makes governance conversations part of the record |
| **E4** | **Task delegation** — ability to delegate any task, approval, or ownership to another user; notification sent to delegate | Platform-wide | Required for large teams; prevents governance items from stalling when primary owner is unavailable |
| **E5** | **Version history on Vendor, Risk, Control** — before/after snapshot on each significant field change; surfaced in entity history tab | Vendor, Risk, Control | Required for ISO 27001 and SOC 2 audits that verify change controls on risk register |
| **E6** | **Attachments on all entities** — ability to attach supporting documents to risks, controls, findings, CAPAs, and exceptions; not just vendor documents | Platform-wide | Enables inline evidence capture without requiring a formal Evidence Vault upload |
| **E7** | **Formal exception register** — dedicated exception entity with policy link, justification, compensating control, expiry date, approver, and re-review schedule; exception inventory in Trust Intelligence | Exception Management | Required for all enterprise GRC customers; auditors expect an exception log |
| **E8** | **Vendor approval gate** — formal approval status on vendor (pending / approved / rejected / conditional); no vendor usable without approval; configurable approval chain | Vendor Approval | Eliminates largest commercial gap for enterprise procurement teams |
| **E9** | **Recurring audit scheduling** — annual / quarterly / ad-hoc audit schedule with auto-creation; calendar view of upcoming audits | Audit Planning | Required for ISO and SOC 2 programmes that run regular audit cycles |
| **E10** | **Board member portal (read-only)** — a secure read-only view of Trust Intelligence, Executive Reports, and board reports accessible to board members without full AUDT access | Executive Reporting | Required to close the loop on governance reporting to boards who will not use an operational GRC tool |

---

*AUDT Product Audit Phase 3 · 2026-06-26 · 42 processes · 7 domains · platform average 5.5/10*  
*Builds on Phase 1 (lifecycle) and Phase 2 (entity model). This audit establishes the process baseline for Phase 4 (Enterprise Readiness) and Phase 5 (Commercial Readiness).*
