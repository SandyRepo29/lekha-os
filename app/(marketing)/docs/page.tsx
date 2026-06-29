"use client";

import { useState, useEffect, useRef } from "react";
import "./docs.css";

/* ============================================================
   TYPES & CONSTANTS
   ============================================================ */
type Tab = { id: string; label: string };
type SidebarItem = { id: string; label: string };
type SidebarGroup = { group: string; items: SidebarItem[] };

const TABS: Tab[] = [
  { id: "getting-started", label: "Getting Started" },
  { id: "use-cases", label: "Use Cases" },
  { id: "modules", label: "Modules" },
  { id: "frameworks", label: "Frameworks" },
  { id: "role-guides", label: "Role Guides" },
  { id: "resources", label: "Resources" },
  { id: "ai-agents", label: "AI Agents" },
  { id: "api", label: "API & Integrations" },
];

const SIDEBAR: Record<string, SidebarGroup[]> = {
  "getting-started": [
    {
      group: "Getting Started",
      items: [
        { id: "gs-welcome", label: "Welcome to AUDT" },
        { id: "gs-quick-actions", label: "Quick Actions" },
        { id: "gs-first-15", label: "First 15 Minutes" },
        { id: "gs-overview", label: "Platform Overview" },
        { id: "gs-scoring", label: "Scoring Engines" },
        { id: "gs-trust-score", label: "Trust Score™ Deep Dive" },
        { id: "gs-toe", label: "Trust Operations Engine™" },
      ],
    },
  ],
  "use-cases": [
    {
      group: "Workflows",
      items: [
        { id: "uc-onboard-vendor", label: "Onboard a New Vendor" },
        { id: "uc-assess-risk", label: "Assess Vendor Risk" },
        { id: "uc-collect-evidence", label: "Collect Compliance Evidence" },
        { id: "uc-run-assessment", label: "Run a Compliance Assessment" },
        { id: "uc-prepare-audit", label: "Prepare for an Audit" },
        { id: "uc-manage-policies", label: "Create & Manage Policies" },
        { id: "uc-review-status", label: "Review Compliance Status" },
        { id: "uc-automate-governance", label: "Automate Governance (TOE)" },
        { id: "uc-govern-ai", label: "Govern AI Systems" },
      ],
    },
  ],
  modules: [
    {
      group: "Module Reference",
      items: [
        { id: "mod-core-grc", label: "Core GRC" },
        { id: "mod-intelligence", label: "Intelligence" },
        { id: "mod-privacy-legal", label: "Privacy & Legal" },
        { id: "mod-operations", label: "Operations" },
        { id: "mod-trust-network", label: "Trust Network" },
        { id: "mod-enterprise", label: "Enterprise" },
      ],
    },
  ],
  frameworks: [
    {
      group: "Frameworks",
      items: [
        { id: "fw-iso27001", label: "ISO 27001" },
        { id: "fw-soc2", label: "SOC 2" },
        { id: "fw-pcidss", label: "PCI DSS" },
        { id: "fw-hipaa", label: "HIPAA" },
        { id: "fw-dpdp", label: "DPDP (India)" },
      ],
    },
  ],
  "role-guides": [
    {
      group: "Role Guides",
      items: [
        { id: "role-ciso", label: "CISO" },
        { id: "role-compliance", label: "Compliance Manager" },
        { id: "role-procurement", label: "Procurement Manager" },
        { id: "role-auditor", label: "Internal Auditor" },
        { id: "role-it-admin", label: "IT Administrator" },
      ],
    },
  ],
  resources: [
    {
      group: "Resources",
      items: [
        { id: "res-templates", label: "Templates & Checklists" },
        { id: "res-insights", label: "Executive Insights" },
      ],
    },
  ],
  "ai-agents": [
    {
      group: "AI Agents",
      items: [
        { id: "ag-overview", label: "Overview" },
        { id: "ag-framework", label: "Governance Agents" },
        { id: "ag-risk-monitor", label: "Risk Monitor Agent" },
        { id: "ag-vendor-watch", label: "Vendor Watch Agent" },
        { id: "ag-compliance-guardian", label: "Compliance Guardian" },
        { id: "ag-policy-enforcer", label: "Policy Enforcer" },
        { id: "ag-audit-prep", label: "Audit Prep Agent" },
        { id: "ag-custom", label: "Custom Agents" },
        { id: "ag-assistants", label: "Module AI Assistants" },
        { id: "ag-lifecycle", label: "Agent Lifecycle" },
      ],
    },
  ],
  api: [
    {
      group: "Getting Started",
      items: [
        { id: "api-auth", label: "Authentication" },
        { id: "api-rate-limits", label: "Rate Limits" },
        { id: "api-error-handling", label: "Error Handling" },
      ],
    },
    {
      group: "Code Examples",
      items: [
        { id: "api-curl", label: "cURL Examples" },
        { id: "api-js", label: "JavaScript / TypeScript" },
        { id: "api-python", label: "Python" },
        { id: "api-webhooks", label: "Webhooks" },
      ],
    },
    {
      group: "Reference",
      items: [
        { id: "api-endpoints", label: "Key Endpoints" },
        { id: "api-trust-score-ref", label: "Trust Score API" },
        { id: "api-integrations", label: "Integrations" },
      ],
    },
  ],
};

/* ============================================================
   DATA
   ============================================================ */
const QUICK_ACTIONS = [
  { icon: "🏢", title: "Onboard a Vendor" },
  { icon: "⚠️", title: "Assess Vendor Risk" },
  { icon: "🛡️", title: "Collect Compliance Evidence" },
  { icon: "🔍", title: "Run a Compliance Assessment" },
  { icon: "📋", title: "Prepare for an Audit" },
  { icon: "📝", title: "Create & Manage Policies" },
  { icon: "📊", title: "Review Compliance Status" },
  { icon: "⚡", title: "Automate Governance (TOE)" },
  { icon: "🤖", title: "Govern AI Systems" },
];

const FIRST_15 = [
  { icon: "✅", title: "Create Organization", route: "/onboarding", body: "Set up your organization, industry, and company size in the 3-step onboarding wizard." },
  { icon: "👥", title: "Invite Team Members", route: "/settings/team", body: "Add teammates and assign roles: owner, admin, compliance_manager, security_manager, procurement_manager, member, viewer." },
  { icon: "🏢", title: "Add Your First Vendor", route: "/vendors → New Vendor", body: "Create a vendor record with name, website, category, and risk level." },
  { icon: "📋", title: "Select Compliance Framework", route: "/compliance/frameworks → New", body: "Choose from ISO 27001, SOC 2, DPDP, PCI DSS, HIPAA." },
  { icon: "📎", title: "Upload Evidence", route: "/compliance/evidence → New Evidence", body: "Attach evidence items and map them to controls." },
  { icon: "📊", title: "Review Dashboard", route: "/dashboard", body: "See your Org Trust Score™, compliance readiness, and open risks at a glance." },
];

const SCORING_ENGINES = [
  {
    name: "Org Trust Score™",
    components: ["Vendor Trust (25%)", "Risk Posture (25%)", "Control Health (20%)", "Audit Readiness (15%)", "Compliance Coverage (15%)"],
  },
  {
    name: "Vendor Trust Score™",
    components: ["Evidence (20%)", "Risk (20%)", "Compliance (15%)", "Assessment (15%)", "Contract (10%)", "Operational (10%)", "Freshness (10%)"],
  },
  {
    name: "Control Health™",
    components: ["Evidence (30%)", "Testing (25%)", "Audit (15%)", "Policy (10%)", "Freshness (10%)", "Risk Reduction (10%)"],
  },
];

type UseCase = {
  id: string;
  title: string;
  goal: string;
  time: string;
  prereq: string;
  outcome: string;
  flow: string[];
  steps: string[];
  tip?: string;
};

const USE_CASES: UseCase[] = [
  {
    id: "uc-onboard-vendor",
    title: "Onboard a New Vendor",
    goal: "Register, assess, and approve a new third-party vendor.",
    time: "20–30 minutes",
    prereq: "Owner or procurement_manager role; vendor contact email.",
    outcome: "An approved vendor with documents collected, fields extracted, and a security assessment score.",
    flow: ["Create Vendor", "Assign Owner", "Request Documents", "Review Responses", "Risk Assessment", "Approval"],
    steps: [
      "Go to /vendors → New Vendor. Enter name, website, category (SaaS/Cloud/IT Services/etc.), risk level, country.",
      "Assign an owner from your team. Owner receives notifications for expiries and reviews.",
      "Go to vendor detail → Documents tab → Request Documents. Select from required doc types (SOC 2, ISO cert, DPA, etc.).",
      "Vendor receives magic-link portal email. They upload at /portal/[token] — no account needed.",
      "Review uploaded documents. AI auto-extracts: issuer, validity dates, coverage scope, certification body.",
      "Go to Assessment tab → launch Security Assessment (17 questions). Score computed automatically.",
      "Once score ≥ 60 and required docs present, vendor status auto-advances to \"approved\".",
    ],
    tip: "Use Vendor Types (templates) to pre-define required document checklists for each vendor category.",
  },
  {
    id: "uc-assess-risk",
    title: "Assess Vendor Risk",
    goal: "Identify, score, and treat a risk associated with a vendor.",
    time: "10–15 minutes",
    prereq: "An existing vendor record.",
    outcome: "A scored risk with a treatment plan, linked to relevant entities and visible on the heat map.",
    flow: ["Open Risk Tab", "Set Impact/Likelihood", "Score Computed", "Add Treatment", "Link Entities", "Monitor"],
    steps: [
      "Open vendor detail → Risk tab → Add Risk or /risks/new",
      "Set category (cyber_security, compliance, vendor, privacy, etc.), impact (1–5), likelihood (1–5)",
      "AUDT computes inherent score = impact × likelihood × 4 (max 100)",
      "Add treatment: strategy (mitigate/accept/transfer/avoid), assign owner, set due date",
      "Link risk to vendor, relevant controls, compliance frameworks",
      "Monitor via /risks dashboard — heat map shows all risks by impact × likelihood",
    ],
  },
  {
    id: "uc-collect-evidence",
    title: "Collect Compliance Evidence",
    goal: "Gather and map evidence to compliance controls.",
    time: "15 minutes",
    prereq: "At least one compliance framework added.",
    outcome: "Evidence items mapped to controls, improving framework readiness coverage.",
    flow: ["New Evidence", "Set Type", "Upload/Link", "Map to Controls", "Check Coverage", "Review Gaps"],
    steps: [
      "Go to /compliance/evidence → New Evidence",
      "Set title, type (document/assessment/review/policy/other), status (collected/pending/expired)",
      "Upload file OR link from vendor documents (auto-import available)",
      "Map to controls: Evidence → Map to Control",
      "Each mapping contributes to control readiness. Framework readiness = covered/total controls",
      "Check gaps at /compliance/gaps — 5 automated gap rules",
    ],
    tip: "Go to Evidence → Auto-Import from Vendors to pull approved vendor docs as evidence automatically.",
  },
  {
    id: "uc-run-assessment",
    title: "Run a Compliance Assessment",
    goal: "Assess readiness against a framework and produce a report.",
    time: "30–60 minutes",
    prereq: "A framework with controls selected.",
    outcome: "A complete readiness assessment with gap analysis and a shareable PDF report.",
    flow: ["Select Framework", "Review Controls", "Update Status", "Run Gap Analysis", "Generate Report", "Share"],
    steps: [
      "Go to /compliance/frameworks → select framework",
      "Review all controls — each shows: status, linked evidence count, owner",
      "For each control: update status, link evidence, add notes",
      "Run Gap Analysis: /compliance/gaps → 5 gap types: missing evidence, expired evidence, unimplemented controls, no policy coverage, no control owner",
      "Generate report: /compliance/reports → Framework PDF or Executive PDF (AI-narrated)",
      "Share with auditor or board from reports page",
    ],
  },
  {
    id: "uc-prepare-audit",
    title: "Prepare for an Audit",
    goal: "Plan an audit, track findings, and produce a board-ready report.",
    time: "1–2 hours",
    prereq: "A compliance framework and collected evidence.",
    outcome: "A completed audit with findings, CAPAs, and an exportable audit report.",
    flow: ["Create Audit", "Auto-Generate Program", "Review Items", "Add Findings", "Create CAPAs", "Generate Report"],
    steps: [
      "Go to /audits/new → create audit (name, type, framework link, scope, auditor)",
      "AUDT auto-generates audit program from framework controls",
      "Review each program item: mark reviewed/passed/failed",
      "Add findings: /audits/[id]/findings → AI can convert observations into structured findings",
      "For each finding, create CAPA: assign owner, due date, remediation steps",
      "Generate Audit Package: vendor detail → Audit Package — exports vendor docs, assessment, risk summary",
      "Generate Audit Report PDF: /reports/audits/[id]",
    ],
  },
  {
    id: "uc-manage-policies",
    title: "Create & Manage Policies",
    goal: "Author, publish, and track attestation of organizational policies.",
    time: "20 minutes",
    prereq: "compliance_manager or admin role.",
    outcome: "A published policy with attestation tracking and a scheduled review date.",
    flow: ["New Policy", "Set Metadata", "Draft", "Review", "Publish", "Attest", "Track Reviews"],
    steps: [
      "Go to /compliance/policies → New Policy",
      "Set: title, description, version, category, owner, effective date, review date",
      "Save as Draft → review → change status to Active to publish",
      "Map policy to compliance frameworks and controls",
      "Assign attestation — team members confirm they have read the policy",
      "Track reviews: set next review date. AUDT alerts when review is due.",
    ],
  },
  {
    id: "uc-review-status",
    title: "Review Compliance Status (Executive View)",
    goal: "Get a board-level view of organizational governance posture.",
    time: "10 minutes",
    prereq: "Org with vendors, risks, and compliance data populated.",
    outcome: "An executive summary and board-ready report covering all trust dimensions.",
    flow: ["View Trust Score", "Drill Components", "Check Recommendations", "Review Trends", "Generate Summary", "Export Report"],
    steps: [
      "Go to /trust-intelligence — Org Trust Score™ ring shows 0–100 score",
      "Drill into components: Vendor Trust, Risk Posture, Control Health, Audit Readiness, Compliance Coverage",
      "Review Recommendations tab for prioritized actions with impact/effort ratings",
      "Check Trends tab for 90-day governance trend sparklines",
      "Generate AI Executive Summary from Executive View tab (Governance Copilot™)",
      "Export board report at /executive-reporting/board-reports",
    ],
  },
  {
    id: "uc-automate-governance",
    title: "Automate Governance with Trust Operations Engine™",
    goal: "Connect governance events across modules to automated workflows and approval queues.",
    time: "15–20 minutes",
    prereq: "Active vendors, risks, or compliance frameworks in the platform.",
    outcome: "Governance events automatically trigger workflows, route approvals, and fire automation rules — reducing manual follow-up.",
    flow: ["Review Event Stream", "Choose Workflow Template", "Start Instance", "Monitor Steps", "Approve Actions", "View Analytics"],
    steps: [
      "Go to /operations/events — see the live event stream across all 37 event types (vendor.document_expired, risk.score_critical, control.health_low, etc.)",
      "Go to /operations/workflows — choose from 6 built-in templates: Vendor Onboarding, Evidence Expiry Response, Trust Score Drop Response, Contract Renewal, Vendor Offboarding, Critical Risk Escalation",
      "Click Start Workflow on any template — fill in parameters, assign owner",
      "Monitor active instances at /operations/workflows — each step shows pending/in_progress/completed/failed status",
      "Go to /operations/approvals — review pending approvals and approve or reject with notes",
      "Create automation rules at /operations/automation — define event→action triggers (e.g., 'When trust score drops below 60, create a risk review task')",
      "View /operations/analytics for workflow SLA metrics, completion rates, and historical throughput",
    ],
    tip: "Use /operations/command-center for a real-time cross-module governance snapshot — critical items needing attention surface automatically.",
  },
  {
    id: "uc-govern-ai",
    title: "Govern AI Systems",
    goal: "Inventory, risk-assess, and monitor AI systems for responsible governance.",
    time: "20–30 minutes",
    prereq: "admin or security_manager role.",
    outcome: "An AI system in the inventory with linked risks, controls, and an AI Trust Score™.",
    flow: ["Add AI System", "Set Classification", "Link Risks", "Map Controls", "Check Compliance", "Monitor Trust Score"],
    steps: [
      "Go to /ai-governance/inventory → Add AI System",
      "Set: name, type (llm/ml_model/automation/decision_support), vendor, deployment env, risk classification",
      "Link AI risks: type (hallucination/bias/privacy_leakage/prompt_injection/etc.), impact, likelihood",
      "Map to AI controls: human oversight, output review, prompt logging, model approval",
      "Check compliance: AUDT maps to ISO 42001, NIST AI RMF, EU AI Act, DPDP AI",
      "Monitor via AI Trust Score™ — Risk(25%), Controls(25%), Compliance(20%), Monitoring(15%), Vendor(10%), Incidents(5%). Set up automation rules at /operations/automation to trigger alerts when AI risk scores breach thresholds.",
    ],
  },
];

type Module = {
  name: string;
  route?: string;
  desc: string;
  features: string;
  workflow?: string;
};

const MODULE_GROUPS: { id: string; group: string; modules: Module[] }[] = [
  {
    id: "mod-core-grc",
    group: "Core GRC",
    modules: [
      { name: "Vendor Hub™", route: "/vendors", desc: "Central vendor registry with AI-powered document processing and Trust Score™ engine.", features: "25-column vendor registry, document management with AI extraction (10 fields), magic-link vendor portal, Trust Score™, NL search.", workflow: "Add vendor → Request documents → Auto-extract fields → Risk assess → Approve" },
      { name: "Evidence Vault™", route: "/compliance", desc: "Unified compliance management across 5 frameworks with 174 built-in controls.", features: "10 compliance tables, 174 built-in controls across 5 frameworks, auto-import from vendors, gap analysis, AI Officer™.", workflow: "Select framework → Map controls → Collect evidence → Run gap analysis → Generate report" },
      { name: "Audit Management", route: "/audits", desc: "End-to-end audit lifecycle from planning to board-ready reports.", features: "Full audit lifecycle, auto-generated audit program, AI finding generator, CAPA tracker, PDF reports.", workflow: "Plan audit → Generate program → Review items → Add findings → Create CAPAs → Generate report" },
      { name: "Risk Lens™", route: "/risks", desc: "Visual risk intelligence with heat map and AI-powered risk officer.", features: "5×5 heat map, 13 risk categories, treatment tracking, AI Risk Officer™, treatment strategies.", workflow: "Identify risk → Score impact/likelihood → Add treatment → Link to framework → Monitor" },
      { name: "Control Center™", route: "/controls", desc: "Control effectiveness scoring and continuous testing platform.", features: "Control Health™ scoring (6 components), test logging, AI gap detection, framework mapping.", workflow: "Create control → Link evidence → Run tests → Compute health score → Review gaps" },
    ],
  },
  {
    id: "mod-intelligence",
    group: "Intelligence",
    modules: [
      { name: "Trust Intelligence™", route: "/trust-intelligence", desc: "Executive governance command center with Org Trust Score™.", features: "Org Trust Score™ (5 components), 9-tab command center, Governance Copilot™, recommendations engine.", workflow: "View score → Drill components → Review recommendations → Generate summary" },
      { name: "Governance Trends™", desc: "90-day governance trend monitoring across 6 key metrics.", features: "90-day sparklines for 6 metrics, change % vs period start, 30-row score history." },
      { name: "Continuous Monitoring™", desc: "Automated governance monitoring with 7 rule engine.", features: "7 automated monitoring rules, auto-generated alerts, resolve workflow." },
      { name: "Trust Graph™", desc: "Force-directed governance knowledge graph with AI reasoning.", features: "Force-directed SVG visualization, Root Cause Analysis™, Impact Analysis™, Governance Reasoner™." },
    ],
  },
  {
    id: "mod-privacy-legal",
    group: "Privacy & Legal",
    modules: [
      { name: "Policy Governance™", desc: "Full policy lifecycle with version control and attestation tracking.", features: "Policy lifecycle, versioning, attestations, Policy Health™, review scheduling." },
      { name: "DPDP Privacy™", desc: "India-specific DPDP Act 2023 compliance platform.", features: "Data inventory, consent records, DSR workflow, retention policies, privacy assessments. Mumbai data residency (ap-south-1)." },
      { name: "Contract Governance™", route: "/contract-governance", desc: "Contract lifecycle management with obligation tracking and renewal alerts.", features: "Contract library, clause management, obligation tracker, renewals dashboard, Contract Score™." },
    ],
  },
  {
    id: "mod-operations",
    group: "Operations",
    modules: [
      { name: "Trust Operations Engine™", route: "/operations", desc: "Event-driven orchestration layer connecting every governance capability into one intelligent platform.", features: "37 built-in event types, 6 workflow templates, unified approval queue, automation rules engine, AI Decision Engine, Operations Copilot™.", workflow: "Publish event → Match workflow → Run steps → Approve actions → Monitor analytics" },
      { name: "Issue & Remediation Hub™", route: "/issue-hub", desc: "Centralized governance issue registry with SLA tracking.", features: "Issue registry, task management, exception management, escalation engine, SLA tracking." },
      { name: "Workflow Studio™", desc: "Governance automation engine with approval workflows.", features: "Workflow definitions, approval workflows, AI workflow generator, run history." },
    ],
  },
  {
    id: "mod-trust-network",
    group: "Trust Network",
    modules: [
      { name: "Third-Party Risk Exchange™", route: "/trust-exchange", desc: "Public trust marketplace for vendor evidence sharing.", features: "Trust profiles, evidence exchange, badges, questionnaire exchange, vendor directory." },
      { name: "Governance Benchmarking™", route: "/benchmarking", desc: "Industry peer comparison across 10 governance categories.", features: "10 category scorecards, percentile ranking, Governance Rankings™, 6-month trends." },
      { name: "Integration Hub™", route: "/integration-hub", desc: "Connectivity layer with 35+ pre-built connectors.", features: "35+ connectors, sync engine, evidence automation, webhook engine, connection health." },
      { name: "Trust Network™", desc: "Public trust infrastructure aggregating all trust signals.", features: "Trust reputation score, governance maturity ladder, network directory, activity feed." },
    ],
  },
  {
    id: "mod-enterprise",
    group: "Enterprise",
    modules: [
      { name: "Executive Reporting & Analytics™", route: "/executive-reporting", desc: "Role-specific dashboards and predictive governance analytics.", features: "6 role dashboards (CEO/CRO/CISO/Compliance/Board/Custom), board reports, predictive forecasting, scorecards." },
      { name: "AI Governance™", route: "/ai-governance", desc: "Responsible AI governance platform for AI system risk management.", features: "AI system inventory, AI Trust Score™, EU AI Act compliance, ISO 42001, incident tracking." },
      { name: "Auditor Collaboration™", route: "/auditor-collaboration", desc: "Secure external auditor engagement platform.", features: "Secure audit rooms, evidence exchange, external findings, assessment projects, auditor user management." },
      { name: "Trust API Platform™", route: "/trust-api", desc: "Trust-as-infrastructure API with 8 products and developer portal.", features: "8 API products, webhooks, developer portal, usage analytics, AI API builder." },
      { name: "Trust Verification Authority™", route: "/trust-verification", desc: "Certification authority for governance trust.", features: "10 verification programs, 9-step workflow, Trust Certificates™, public /verify/[id] page." },
      { name: "Continuous Compliance™", desc: "Always-on compliance automation with 21 automated checks.", features: "21 automated checks, access reviews, attestations, training campaigns, Compliance Health™ score." },
      { name: "Governance Agent Framework™", route: "/agents", desc: "AI agents for proactive governance monitoring.", features: "6 agent types, observations, recommendations, human-approved actions, Governance Copilot™." },
      { name: "Regulatory Intelligence™", route: "/regulatory-intelligence", desc: "Real-time regulatory tracking for 18+ regulations.", features: "18 built-in regulations (India + global), change monitor, obligations, Compliance Horizon™." },
      { name: "Asset Intelligence™", route: "/asset-intelligence", desc: "Enterprise asset graph with trust mapping.", features: "12 asset types, Asset Trust Score™, dependency graph, PII tracking, alerts." },
      { name: "Security Command Center™", route: "/security-center", desc: "Enterprise security platform for regulated industries.", features: "MFA management, Enterprise SSO, session management, IP allow lists, AI prompt audit, Customer Managed Encryption." },
    ],
  },
];

type Framework = {
  id: string;
  name: string;
  meta: string;
  domains: string[];
  evidence: string;
  note?: string;
};

const FRAMEWORKS: Framework[] = [
  {
    id: "fw-iso27001",
    name: "ISO 27001",
    meta: "93 controls · 14 domains",
    domains: ["Information Security Policies", "Organization", "Human Resource Security", "Asset Management", "Access Control", "Cryptography", "Physical Security", "Operations Security", "Communications Security", "System Acquisition", "Supplier Relationships", "Incident Management", "Business Continuity", "Compliance"],
    evidence: "Policy documents, access logs, risk assessments, incident records, supplier contracts.",
    note: "Route: /compliance/frameworks → ISO 27001",
  },
  {
    id: "fw-soc2",
    name: "SOC 2",
    meta: "33 controls · 5 Trust Services Criteria",
    domains: ["Security (CC)", "Availability (A)", "Processing Integrity (PI)", "Confidentiality (C)", "Privacy (P)"],
    evidence: "SOC 2 reports, penetration test results, access reviews, encryption documentation.",
  },
  {
    id: "fw-pcidss",
    name: "PCI DSS",
    meta: "12 controls",
    domains: ["Network security", "Cardholder data protection", "Vulnerability management", "Access control", "Monitoring", "Security policy"],
    evidence: "Network diagrams, scan reports, penetration tests, access control logs, training records.",
  },
  {
    id: "fw-hipaa",
    name: "HIPAA",
    meta: "18 controls · 3 safeguard groups",
    domains: ["Administrative", "Physical", "Technical"],
    evidence: "Risk analysis, workforce training, access controls, audit logs, business associate agreements.",
  },
  {
    id: "fw-dpdp",
    name: "DPDP (India)",
    meta: "18 controls · DPDP Act 2023",
    domains: ["Consent management", "Data principal rights (DSR)", "Data fiduciary obligations", "Cross-border transfer restrictions", "Breach notification"],
    evidence: "Consent records, DSR logs, retention schedules, breach notification records, privacy assessments.",
    note: "Dedicated module: /privacy · Data residency: Mumbai (ap-south-1).",
  },
];

type RoleGuide = {
  id: string;
  role: string;
  intro: string;
  workflows: string[];
};

const ROLE_GUIDES: RoleGuide[] = [
  {
    id: "role-ciso",
    role: "CISO",
    intro: "CISOs use AUDT to maintain end-to-end visibility across vendor risk, compliance posture, and AI governance. Key activities: weekly trust score review, AI system governance, board reporting.",
    workflows: [
      "Review Org Trust Score™ at /trust-intelligence (weekly)",
      "Monitor critical risks at /risks — filter by status=critical",
      "Check AI governance posture at /ai-governance",
      "Review Security Command Center™ at /security-center — MFA compliance, active sessions, IP rules",
      "Generate board report at /executive-reporting/board-reports",
      "Review Governance Benchmarking™ at /benchmarking — percentile vs industry",
    ],
  },
  {
    id: "role-compliance",
    role: "Compliance Manager",
    intro: "Compliance Managers own framework readiness, evidence collection, gap analysis, and policy lifecycle. AUDT automates the evidence pipeline and generates audit-ready reports.",
    workflows: [
      "Manage framework readiness at /compliance/frameworks",
      "Collect and map evidence at /compliance/evidence",
      "Run gap analysis at /compliance/gaps",
      "Review and publish policies at /compliance/policies",
      "Prepare compliance reports at /compliance/reports",
      "Track regulatory obligations at /regulatory-intelligence/obligations",
    ],
  },
  {
    id: "role-procurement",
    role: "Procurement Manager",
    intro: "Procurement Managers use AUDT's Vendor Hub™ to onboard, assess, and continuously monitor third-party vendors. AUDT automates document collection and risk scoring.",
    workflows: [
      "Add new vendors at /vendors/new",
      "Request vendor documents at vendor detail → Documents tab",
      "Review vendor risk assessments",
      "Track vendor reviews at vendor detail → Reviews tab",
      "Monitor document expiry at /vendors?expiring=1",
      "Manage contracts at /contract-governance",
    ],
  },
  {
    id: "role-auditor",
    role: "Internal Auditor",
    intro: "Internal Auditors use AUDT to plan audits, generate programs from compliance controls, track findings, and produce board-ready reports — all in one platform.",
    workflows: [
      "Plan audit at /audits/new",
      "Review audit program checklist at /audits/[id]",
      "Add findings at /audits/[id]/findings",
      "Create CAPAs at /audits/[id]/capas",
      "Generate audit report PDF",
      "Collaborate with external auditors at /auditor-collaboration",
    ],
  },
  {
    id: "role-it-admin",
    role: "IT Administrator",
    intro: "IT Administrators manage team access, SSO configuration, MFA enforcement, and integration setup. AUDT's Security Command Center™ provides enterprise-grade identity controls.",
    workflows: [
      "Manage team and RBAC at /settings/team — 7 roles available",
      "Configure SSO at /security-center (Entra ID, Okta, Google Workspace, SAML 2.0, OIDC)",
      "Manage MFA enforcement at /security-center (optional / required_admins / required_all)",
      "Set up integrations at /integration-hub — 35+ connectors",
      "Manage API keys at /settings/api-keys",
      "Review IP allow lists and session management at /security-center",
    ],
  },
];

const TEMPLATE_GROUPS: { group: string; items: string[] }[] = [
  { group: "Vendor Templates", items: ["Vendor Risk Assessment Template", "Vendor Due Diligence Checklist", "Vendor Review Checklist", "Vendor Security Questionnaire", "Vendor Offboarding Checklist"] },
  { group: "Compliance Templates", items: ["ISO 27001 Readiness Checklist", "SOC 2 Preparation Checklist", "PCI DSS Requirements Checklist", "HIPAA Safeguards Checklist", "DPDP Compliance Checklist"] },
  { group: "Audit Templates", items: ["Audit Preparation Checklist", "Evidence Collection Template", "Audit Finding Template", "Remediation Plan Template", "CAPA Tracking Template"] },
  { group: "Policy Templates", items: ["Information Security Policy", "Acceptable Use Policy", "Data Classification Policy", "Incident Response Policy", "Vendor Management Policy"] },
];

const INSIGHTS = [
  { title: "Why Vendor Governance Matters in 2025", body: "Third-party breaches account for 60%+ of data incidents. Build a proactive vendor governance program before regulators require it.", read: "5 min read" },
  { title: "Building a Third-Party Risk Program from Scratch", body: "A practical 6-step framework for organizations starting their vendor risk journey. Covers scoping, tiering, assessment, and monitoring.", read: "8 min read" },
  { title: "Audit Readiness Best Practices", body: "How to reduce audit preparation time from weeks to hours. Continuous evidence collection and automated control validation are the keys.", read: "6 min read" },
  { title: "Reducing Compliance Costs with Automation", body: "Manual compliance processes cost enterprises $3.5M annually on average. AUDT's evidence automation and continuous monitoring cut that by 60%+.", read: "7 min read" },
  { title: "Managing AI Risk: The Governance Imperative", body: "With EU AI Act and DPDP AI provisions in force, governing AI systems is no longer optional. A practical guide to AI inventory and risk scoring.", read: "9 min read" },
  { title: "Vendor Due Diligence in the Age of AI", body: "AI-extracted document fields, automated risk scoring, and Trust Score™ signals are transforming how procurement teams assess vendors.", read: "6 min read" },
];

const RATE_LIMITS = [
  { plan: "Growth (Trial)", limit: "100 requests", window: "60 seconds" },
  { plan: "Growth", limit: "300 requests", window: "60 seconds" },
  { plan: "Business", limit: "1,000 requests", window: "60 seconds" },
  { plan: "Enterprise", limit: "Unlimited", window: "—" },
];

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/vendors", desc: "List vendors (paginated)", perm: "read_only" },
  { method: "GET", path: "/api/v1/vendors/[id]/trust-score", desc: "Vendor Trust Score™ with history", perm: "read_only" },
  { method: "GET", path: "/api/v1/compliance/frameworks", desc: "Frameworks with readiness", perm: "read_only" },
  { method: "GET", path: "/api/v1/compliance/gaps", desc: "Open compliance gaps", perm: "read_only" },
  { method: "GET", path: "/api/v1/audits", desc: "Audit list", perm: "read_only" },
  { method: "POST", path: "/api/v1/audits", desc: "Create audit", perm: "read_write" },
  { method: "GET", path: "/api/v1/findings", desc: "Org-wide findings", perm: "read_only" },
  { method: "POST", path: "/api/v1/findings", desc: "Create finding", perm: "read_write" },
  { method: "GET", path: "/api/v1/capas", desc: "Org-wide CAPAs", perm: "read_only" },
  { method: "GET", path: "/api/v1/risks", desc: "Risk register", perm: "read_only" },
  { method: "POST", path: "/api/v1/risks", desc: "Create risk", perm: "read_write" },
  { method: "GET", path: "/api/v1/risk-treatments", desc: "Treatment tracker", perm: "read_only" },
  { method: "GET", path: "/api/v1/trust-intelligence/overview", desc: "Full dashboard data", perm: "read_only" },
  { method: "GET", path: "/api/v1/trust-intelligence/org-score", desc: "Org Trust Score™", perm: "read_only" },
  { method: "GET", path: "/api/v1/contracts", desc: "Contract list", perm: "read_only" },
  { method: "GET", path: "/api/v1/issues", desc: "Issue registry", perm: "read_only" },
  { method: "GET", path: "/api/v1/regulations", desc: "Regulation library", perm: "read_only" },
  { method: "GET", path: "/api/v1/obligations", desc: "Obligation list", perm: "read_only" },
  { method: "GET", path: "/api/v1/assets", desc: "Asset registry", perm: "read_only" },
  { method: "GET", path: "/api/v1/audit-logs", desc: "Audit event stream", perm: "read_only" },
  { method: "GET", path: "/api/v1/monitoring/alerts", desc: "Governance alerts", perm: "read_only" },
  { method: "GET", path: "/api/v1/registry", desc: "Public verification registry", perm: "public" },
  { method: "GET", path: "/api/v1/benchmarking", desc: "Governance benchmark dashboard", perm: "read_only" },
  { method: "GET", path: "/api/v1/benchmarking/rankings", desc: "Full rankings + maturity level", perm: "read_only" },
  { method: "GET", path: "/api/v1/ai/systems", desc: "AI system inventory", perm: "read_only" },
  { method: "GET", path: "/api/v1/agents", desc: "Governance agent list", perm: "read_only" },
  { method: "GET", path: "/api/v1/agent-runs", desc: "Agent execution history", perm: "read_only" },
  { method: "GET", path: "/api/v1/public/trust-score", desc: "Real-time org trust score (Trust API Platform™)", perm: "bearer" },
  { method: "GET", path: "/api/v1/public/verification", desc: "Proof-of-governance bundle", perm: "bearer" },
  { method: "GET", path: "/api/v1/public/benchmarking", desc: "Industry benchmark snapshot", perm: "bearer" },
  { method: "GET", path: "/api/health", desc: "Liveness/readiness probe &#8212; DB + config checks", perm: "public" },
  { method: "GET", path: "/api/docs", desc: "OpenAPI 3.1 JSON spec", perm: "public" },
];

const CURL_EXAMPLES = `# Get Org Trust Score
curl -H "Authorization: Bearer tap_your_key" \\
  https://audt.tech/api/v1/trust-intelligence/org-score

# Create a Risk
curl -X POST -H "Authorization: Bearer tap_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Vendor data breach risk","category":"cyber_security","impact":4,"likelihood":3}' \\
  https://audt.tech/api/v1/risks

# Get Vendor Trust Score
curl -H "Authorization: Bearer tap_your_key" \\
  https://audt.tech/api/v1/vendors/{id}/trust-score`;

const JS_EXAMPLES = `// Install: no SDK needed — use fetch or axios

const AUDT_KEY = process.env.AUDT_API_KEY; // tap_...
const BASE = "https://audt.tech";

// Get Org Trust Score
async function getOrgTrustScore() {
  const res = await fetch(\`\${BASE}/api/v1/trust-intelligence/org-score\`, {
    headers: { Authorization: \`Bearer \${AUDT_KEY}\` },
  });
  const data = await res.json();
  // data.score: number, data.level: string, data.components: object
  return data;
}

// Create a Risk
async function createRisk(title, category, impact, likelihood) {
  const res = await fetch(\`\${BASE}/api/v1/risks\`, {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${AUDT_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, category, impact, likelihood }),
  });
  return res.json(); // { id, title, score, ... }
}

// Get Vendor Trust Score with history
async function getVendorTrustScore(vendorId) {
  const res = await fetch(\`\${BASE}/api/v1/vendors/\${vendorId}/trust-score\`, {
    headers: { Authorization: \`Bearer \${AUDT_KEY}\` },
  });
  return res.json();
  // .score, .level, .components, .history (30 days), .narrative
}

// List open risks (filter by status + category)
async function getOpenRisks() {
  const params = new URLSearchParams({ status: "open", category: "cyber_security" });
  const res = await fetch(\`\${BASE}/api/v1/risks?\${params}\`, {
    headers: { Authorization: \`Bearer \${AUDT_KEY}\` },
  });
  return res.json(); // { data: Risk[], meta: { page, total } }
}`;

const PYTHON_EXAMPLES = `import os, requests

AUDT_KEY = os.environ["AUDT_API_KEY"]  # tap_...
BASE = "https://audt.tech"
HEADERS = {"Authorization": f"Bearer {AUDT_KEY}"}

# Get Org Trust Score
def get_org_trust_score():
    r = requests.get(f"{BASE}/api/v1/trust-intelligence/org-score", headers=HEADERS)
    r.raise_for_status()
    return r.json()  # { score, level, components }

# Create a Risk
def create_risk(title, category, impact, likelihood):
    payload = {"title": title, "category": category,
               "impact": impact, "likelihood": likelihood}
    r = requests.post(f"{BASE}/api/v1/risks", json=payload, headers=HEADERS)
    r.raise_for_status()
    return r.json()  # { id, title, score, ... }

# Get all frameworks with readiness
def get_frameworks():
    r = requests.get(f"{BASE}/api/v1/compliance/frameworks", headers=HEADERS)
    r.raise_for_status()
    return r.json()  # [{ id, name, readinessScore, controlCount }]

# Paginate through vendors
def get_all_vendors():
    vendors, page = [], 1
    while True:
        r = requests.get(f"{BASE}/api/v1/vendors?page={page}&pageSize=50",
                         headers=HEADERS)
        data = r.json()
        vendors.extend(data["data"])
        if page >= data["meta"]["totalPages"]:
            break
        page += 1
    return vendors`;

const WEBHOOK_EXAMPLES = `// Register a webhook at /trust-api/webhooks
// AUDT delivers POST to your endpoint for each subscribed event.

// 1. Verify the payload (check x-audt-signature header)
// 2. Process the event type
// 3. Return 200 OK within 10 seconds (AUDT retries on timeout)

// Node.js webhook handler (Express)
app.post("/audt-webhook", express.raw({ type: "application/json" }), (req, res) => {
  const event = JSON.parse(req.body.toString());

  switch (event.event_type) {
    case "trust_score.dropped":
      // event.data: { vendor_id, old_score, new_score, delta }
      console.log("Trust score dropped for", event.data.vendor_id);
      break;

    case "evidence.expired":
      // event.data: { evidence_id, vendor_id, expired_at }
      notifyTeam("Evidence expired: " + event.data.evidence_id);
      break;

    case "risk.critical":
      // event.data: { risk_id, title, score, vendor_id }
      escalateRisk(event.data);
      break;
  }

  res.status(200).json({ received: true });
});

// Available event types:
// trust_score.dropped  trust_score.improved  evidence.expired
// evidence.expiring_soon  risk.critical  vendor.status_changed
// contract.expiring  capa.overdue  audit.completed`;

const ERROR_HANDLING = `// AUDT API error response format:
// { "error": "string description", "code": "ERROR_CODE" (optional) }

// HTTP status codes:
// 200  OK
// 201  Created
// 400  Bad Request — invalid body, missing required fields
// 401  Unauthorized — missing or invalid Bearer token
// 403  Forbidden — key lacks required permission (read_write needed for POST/PUT/DELETE)
// 404  Not Found — resource does not exist in your organisation
// 422  Unprocessable Entity — valid JSON but business rule violation
// 429  Too Many Requests — rate limit exceeded (see Retry-After header)
// 500  Internal Server Error — contact support@audt.tech

// Rate limit headers on every response:
// X-RateLimit-Limit: 100
// X-RateLimit-Remaining: 87
// X-RateLimit-Reset: 1720000060

// Retry-After on 429:
// Retry-After: 60  (seconds)

// Example: robust fetch with retry
async function audtFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { Authorization: \`Bearer \${AUDT_KEY}\`, ...options.headers },
  });
  if (res.status === 429) {
    const wait = parseInt(res.headers.get("Retry-After") ?? "60", 10);
    await new Promise(r => setTimeout(r, wait * 1000));
    return audtFetch(url, options);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? \`AUDT API \${res.status}\`);
  }
  return res.json();
}`;

const TRUST_SCORE_API = `// Vendor Trust Score™ — full breakdown
GET /api/v1/vendors/{id}/trust-score

Response:
{
  "score": 82,
  "level": "Strong",       // Exceptional | Trusted | Strong | Moderate | Needs Attention | High Concern
  "components": {
    "evidence":     { "score": 75, "weight": 0.20, "weighted": 15.0 },
    "risk":         { "score": 85, "weight": 0.20, "weighted": 17.0 },
    "compliance":   { "score": 80, "weight": 0.15, "weighted": 12.0 },
    "assessment":   { "score": 90, "weight": 0.15, "weighted": 13.5 },
    "contract":     { "score": 70, "weight": 0.10, "weighted": 7.0 },
    "operational":  { "score": 80, "weight": 0.10, "weighted": 8.0 },
    "freshness":    { "score": 90, "weight": 0.10, "weighted": 9.0 }
  },
  "history": [          // last 30 daily snapshots
    { "date": "2026-06-28", "score": 82 },
    { "date": "2026-06-27", "score": 79 }
  ],
  "narrative": "Vendor X maintains a Strong trust posture...",
  "strengths": ["Assessment score 90/100", "Evidence up to date"],
  "concerns":  ["Contract expires in 45 days", "2 open risks"]
}

// Org Trust Score™
GET /api/v1/trust-intelligence/org-score

Response:
{
  "score": 74,
  "level": "Moderate",
  "components": {
    "vendorTrust":         { "score": 78, "weight": 0.25, "weighted": 19.5 },
    "riskPosture":         { "score": 70, "weight": 0.25, "weighted": 17.5 },
    "controlHealth":       { "score": 75, "weight": 0.20, "weighted": 15.0 },
    "auditReadiness":      { "score": 65, "weight": 0.15, "weighted": 9.75 },
    "complianceCoverage":  { "score": 80, "weight": 0.15, "weighted": 12.0 }
  }
}`;

const INTEGRATION_CATEGORIES = [
  "Identity & Access", "Cloud Infrastructure", "Security", "Source Control", "Project Management", "ITSM", "Endpoint Security", "Communication", "HR & People", "Storage", "Custom",
];

const PHASE1_CONNECTORS = ["Entra ID", "Okta", "Google Workspace", "AWS", "GitHub", "Jira", "Slack", "CrowdStrike", "Microsoft Defender"];

/* ============================================================
   SHARED PRESENTATION COMPONENTS
   ============================================================ */
function OutcomeBox({ goal, time, prereq, outcome }: { goal: string; time: string; prereq: string; outcome: string }) {
  return (
    <div className="docs-outcome">
      <div className="docs-outcome-row"><span className="docs-outcome-key">Goal</span><span>{goal}</span></div>
      <div className="docs-outcome-row"><span className="docs-outcome-key">Time Required</span><span>{time}</span></div>
      <div className="docs-outcome-row"><span className="docs-outcome-key">Prerequisites</span><span>{prereq}</span></div>
      <div className="docs-outcome-row"><span className="docs-outcome-key">Expected Outcome</span><span>{outcome}</span></div>
    </div>
  );
}

function WorkflowDiagram({ steps }: { steps: string[] }) {
  return (
    <div className="docs-flow">
      {steps.map((s, i) => (
        <div className="docs-flow-item" key={i}>
          <div className="docs-flow-node">{i + 1}</div>
          <span className="docs-flow-label">{s}</span>
          {i < steps.length - 1 && <span className="docs-flow-arrow">→</span>}
        </div>
      ))}
    </div>
  );
}

function NumberedSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="docs-steps">
      {steps.map((s, i) => (
        <li className="docs-step" key={i}>
          <span className="docs-step-num">{i + 1}</span>
          <span className="docs-step-text"><StepText text={s} /></span>
        </li>
      ))}
    </ol>
  );
}

function TipCallout({ text }: { text: string }) {
  return (
    <div className="docs-tip">
      <span className="docs-tip-icon">💡</span>
      <span>{text}</span>
    </div>
  );
}

/* Parses plain text and turns any /route paths into clickable links */
function StepText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const re = /(\/[a-zA-Z0-9][a-zA-Z0-9\-_\/\[\]?=&#.]*)/g;
  let last = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const href = match[1];
    parts.push(<a key={match.index} href={href} className="docs-route-link">{href}</a>);
    last = match.index + href.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

/* ============================================================
   SECTION COMPONENTS
   ============================================================ */
function GettingStartedSection() {
  return (
    <section id="getting-started" className="docs-section">
      <div id="gs-welcome" className="docs-anchor">
        <div className="docs-hero">
          <h1 className="docs-hero-title">Welcome to AUDT</h1>
          <p className="docs-hero-sub">AI-Native Trust, Risk &amp; Compliance Platform &#8212; Governance OS</p>
          <p className="docs-hero-body">
            Replace spreadsheets and disconnected tools with a single AI-native platform for vendor governance, compliance, audits, risk, board governance, regulatory intelligence, and more. 32 modules. 259+ tables. Governance built on proof.
          </p>
          <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
            <a href="/docs/getting-started" className="docs-cta-btn-primary">
              Step-by-Step Guide (9 steps, 30 min) →
            </a>
            <a href="/signup" className="docs-cta-btn-secondary">
              Start Free Trial
            </a>
          </div>
        </div>
      </div>

      <div id="gs-quick-actions" className="docs-anchor">
        <h2 className="docs-h2">Quick Actions</h2>
        <div className="docs-grid-2x4">
          {QUICK_ACTIONS.map((a, i) => (
            <div className="docs-action-card" key={i}>
              <span className="docs-action-icon">{a.icon}</span>
              <span className="docs-action-title">{a.title}</span>
              <span className="docs-action-arrow">→</span>
            </div>
          ))}
        </div>
      </div>

      <div id="gs-first-15" className="docs-anchor">
        <h2 className="docs-h2">Your First 15 Minutes</h2>
        <OutcomeBox
          goal="Get a working AUDT workspace with a vendor, a framework, and a populated dashboard."
          time="15 minutes"
          prereq="A new AUDT account and your team members' emails."
          outcome="An organization with team, a first vendor, a selected framework, and a live Org Trust Score™."
        />
        <NumberedSteps
          steps={FIRST_15.map((s) => `${s.icon} ${s.title} (${s.route}) — ${s.body}`)}
        />
      </div>

      <div id="gs-overview" className="docs-anchor">
        <h2 className="docs-h2">Platform Overview</h2>
        <p className="docs-p">
          AUDT replaces spreadsheets and disconnected tools with a single AI-native platform for vendor governance,
          compliance, audits, risk, and board governance. Every action flows into a unified trust posture that is
          continuously scored, monitored, and reported.
        </p>
        <h3 className="docs-h3">Vendor Lifecycle</h3>
        <WorkflowDiagram steps={["Discover", "Assess", "Onboard", "Monitor", "Review", "Offboard"]} />
        <h3 className="docs-h3">Compliance Lifecycle</h3>
        <WorkflowDiagram steps={["Framework", "Controls", "Evidence", "Assessment", "Remediation", "Audit"]} />
      </div>

      <div id="gs-scoring" className="docs-anchor">
        <h2 className="docs-h2">Scoring Engines</h2>
        <div className="docs-scoring-box">
          {SCORING_ENGINES.map((e, i) => (
            <div className="docs-scoring-engine" key={i}>
              <h4 className="docs-scoring-name">{e.name}</h4>
              <div className="docs-scoring-pills">
                {e.components.map((c, j) => (
                  <span className="docs-pill" key={j}>{c}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="gs-trust-score" className="docs-anchor">
        <h2 className="docs-h2">Trust Score™ Deep Dive</h2>
        <p className="docs-p">
          The Vendor Trust Score™ is a 0–100 composite signal computed from 7 weighted components. It updates on every meaningful governance action — document upload, assessment completion, risk change, contract update. A score ≥ 90 is <strong>Trusted</strong>. Below 60 is <strong>High Concern</strong>.
        </p>
        <h4 className="docs-h4">Score Levels</h4>
        <table className="docs-table">
          <thead><tr><th>Level</th><th>Range</th><th>Meaning</th></tr></thead>
          <tbody>
            {[
              ["Exceptional", "95–100", "Best-in-class governance. All components healthy."],
              ["Trusted",     "90–94",  "Strong posture. Minor gaps tolerated."],
              ["Strong",      "80–89",  "Good governance. One or two areas need attention."],
              ["Moderate",    "70–79",  "Governance present but inconsistent. Prioritise weakest component."],
              ["Needs Attention","60–69","Material gaps. Remediation plan required."],
              ["High Concern","0–59",   "Critical governance failure. Escalate immediately."],
            ].map(([level, range, meaning]) => (
              <tr key={level}><td><strong>{level}</strong></td><td>{range}</td><td>{meaning}</td></tr>
            ))}
          </tbody>
        </table>
        <h4 className="docs-h4">Components &amp; How to Improve Them</h4>
        <table className="docs-table">
          <thead><tr><th>Component</th><th>Weight</th><th>How to improve</th></tr></thead>
          <tbody>
            {[
              ["Evidence",    "20%", "Upload more vendor documents. Keep expiry dates current. Map docs to controls."],
              ["Risk",        "20%", "Treat open risks. Close critical risks. Remove duplicate risk entries."],
              ["Compliance",  "15%", "Improve framework readiness. Close gaps. Map evidence to controls."],
              ["Assessment",  "15%", "Run a fresh security assessment. Score ≥ 80 maximises this component."],
              ["Contract",    "10%", "Add contract records. Track expiry. Complete open obligations."],
              ["Operational", "10%", "Complete periodic vendor reviews. Respond to document requests promptly."],
              ["Freshness",   "10%", "Conduct a review within 30 days. Refresh stale assessments."],
            ].map(([comp, weight, improve]) => (
              <tr key={comp}><td><strong>{comp}</strong></td><td>{weight}</td><td>{improve}</td></tr>
            ))}
          </tbody>
        </table>
        <TipCallout text="The Vendor Trust Score™ feeds into the Org Trust Score™ as the Vendor Trust component (25% weight). Improving your bottom 3 vendor scores has the highest leverage on the org-level number." />
      </div>

      <div id="gs-toe" className="docs-anchor">
        <h2 className="docs-h2">Trust Operations Engine™</h2>
        <p className="docs-p">
          The Trust Operations Engine™ (TOE) is the orchestration layer that connects every governance module into an automated, event-driven platform. It transforms AUDT from a record-keeping system into a proactive governance intelligence platform that closes the loop on every governance signal.
        </p>
        <WorkflowDiagram steps={["Event Occurs", "Event Published", "Workflow Triggered", "Approvals Requested", "AI Decision", "Action Taken", "Audit Trail"]} />
        <h4 className="docs-h4">The Four Layers</h4>
        <NumberedSteps steps={[
          "Event Engine — 37 built-in event types. Every vendor action, risk change, evidence expiry, and compliance gap triggers an event automatically.",
          "Workflow Engine — 6 built-in workflows: Vendor Onboarding, Evidence Expiry Response, Trust Score Drop, Contract Renewal, Vendor Offboarding, Critical Risk Escalation. Plus custom workflows via /operations/workflows.",
          "Automation Engine — No-code if-this-then-that rules. Connect any event to any action: create risk, assign task, request evidence, send notification, escalate for approval.",
          "AI Decision Engine — AI generates recommendations with confidence scores and suggested actions. All proposed mutations require human approval at /operations/approvals — no autonomous data changes.",
        ]} />
        <TipCallout text="Start with the Vendor Onboarding workflow template at /operations/workflows. It automates document requests, assessment scheduling, and approval routing for every new vendor." />
      </div>
    </section>
  );
}

function UseCasesSection() {
  return (
    <section id="use-cases" className="docs-section">
      <h1 className="docs-h1">Use Cases</h1>
      <p className="docs-p">Eight complete, step-by-step workflows covering the most common AUDT operations.</p>
      {USE_CASES.map((uc, i) => (
        <div id={uc.id} className="docs-anchor docs-usecase" key={i}>
          <h2 className="docs-h2">{`UC${i + 1}: ${uc.title}`}</h2>
          <OutcomeBox goal={uc.goal} time={uc.time} prereq={uc.prereq} outcome={uc.outcome} />
          <WorkflowDiagram steps={uc.flow} />
          <NumberedSteps steps={uc.steps} />
          {uc.tip && <TipCallout text={uc.tip} />}
        </div>
      ))}
    </section>
  );
}

function ModulesSection() {
  return (
    <section id="modules" className="docs-section">
      <h1 className="docs-h1">Module Reference</h1>
      <p className="docs-p">AUDT ships 32 governance modules across six groups. Each module is self-contained with its own data layer, services, AI assistant, and REST API surface.</p>
      {MODULE_GROUPS.map((g, i) => (
        <div id={g.id} className="docs-anchor" key={i}>
          <h2 className="docs-h2 docs-module-group">{g.group}</h2>
          <div className="docs-module-list">
            {g.modules.map((m, j) => (
              <div className="docs-module-card" key={j}>
                <div className="docs-module-head">
                  <span className="docs-module-name">{m.name}</span>
                  {m.route && <a href={m.route} className="docs-module-route">{m.route}</a>}
                </div>
                <p className="docs-module-desc">{m.desc}</p>
                <p className="docs-module-features"><strong>Features:</strong> {m.features}</p>
                {m.workflow && <p className="docs-module-workflow"><strong>Workflow:</strong> {m.workflow}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function FrameworksSection() {
  return (
    <section id="frameworks" className="docs-section">
      <h1 className="docs-h1">Compliance Framework Center</h1>
      <p className="docs-p">AUDT ships with 174 built-in controls across five frameworks. Add a framework at <a href="/compliance/frameworks" className="docs-route-link">/compliance/frameworks</a> to begin tracking readiness.</p>
      {FRAMEWORKS.map((f, i) => (
        <div id={f.id} className="docs-anchor docs-fw-card" key={i}>
          <div className="docs-fw-head">
            <h2 className="docs-h2">{f.name}</h2>
            <span className="docs-fw-meta">{f.meta}</span>
          </div>
          <h4 className="docs-h4">Domains</h4>
          <div className="docs-fw-pills">
            {f.domains.map((d, j) => (
              <span className="docs-pill" key={j}>{d}</span>
            ))}
          </div>
          <p className="docs-p"><strong>Evidence:</strong> {f.evidence}</p>
          {f.note && <p className="docs-fw-note"><StepText text={f.note} /></p>}
        </div>
      ))}
    </section>
  );
}

function RoleGuidesSection() {
  return (
    <section id="role-guides" className="docs-section">
      <h1 className="docs-h1">Role Guides</h1>
      <p className="docs-p">Recommended workflows tailored to each role in your governance team.</p>
      {ROLE_GUIDES.map((r, i) => (
        <div id={r.id} className="docs-anchor docs-role-card" key={i}>
          <h2 className="docs-h2">{r.role}</h2>
          <p className="docs-role-intro">{r.intro}</p>
          <NumberedSteps steps={r.workflows} />
        </div>
      ))}
    </section>
  );
}

function ResourcesSection() {
  return (
    <section id="resources" className="docs-section">
      <h1 className="docs-h1">Resources</h1>

      <div id="res-templates" className="docs-anchor">
        <h2 className="docs-h2">Templates &amp; Checklists</h2>
        <p className="docs-p">Downloadable templates to accelerate your governance program. New templates are added regularly.</p>
        {TEMPLATE_GROUPS.map((tg, i) => (
          <div className="docs-template-group" key={i}>
            <h4 className="docs-h4">{tg.group}</h4>
            <div className="docs-template-grid">
              {tg.items.map((t, j) => (
                <div className="docs-template-card" key={j}>
                  <span className="docs-template-name">{t}</span>
                  <span className="docs-badge-amber">Coming Soon</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div id="res-insights" className="docs-anchor">
        <h2 className="docs-h2">Executive Insights</h2>
        <div className="docs-insights-grid">
          {INSIGHTS.map((a, i) => (
            <div className="docs-insight-card" key={i}>
              <h4 className="docs-insight-title">{a.title}</h4>
              <p className="docs-insight-body">{a.body}</p>
              <span className="docs-badge-cyan">{a.read}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AiAgentsSection() {
  return (
    <section id="ai-agents" className="docs-section">
      <h1 className="docs-h1">AI Agents</h1>
      <p className="docs-lead">
        AUDT ships two layers of AI: <strong>Governance Agents</strong> that continuously monitor your posture and propose actions, and <strong>Module AI Assistants</strong> embedded inside every module for on-demand analysis and NL chat.
      </p>

      {/* ── Overview ── */}
      <div id="ag-overview" className="docs-anchor">
        <h2 className="docs-h2">How AI Agents Work</h2>
        <p className="docs-p">
          All agents follow a four-stage lifecycle designed around <strong>human-in-the-loop governance</strong>. Agents observe, reason, and recommend — but they never mutate data without an explicit human approval.
        </p>
        <div className="docs-flow docs-flow-horizontal">
          {["👁️ Observe", "🧠 Reason", "💡 Recommend", "✅ Human Approves → Act"].map((s, i) => (
            <div className="docs-flow-step" key={i}>
              <div className="docs-flow-circle">{i + 1}</div>
              <div className="docs-flow-label">{s}</div>
            </div>
          ))}
        </div>
        <div className="docs-grid-3" style={{ marginTop: 20 }}>
          {[
            { icon: "👁️", term: "Observation", def: "A structured signal generated by an agent — severity (critical/high/medium/low/info), source module, linked entity, and a human-readable description." },
            { icon: "💡", term: "Recommendation", def: "A prioritised suggested action derived from one or more observations. Includes confidence score (0–100), impact label, effort label, and step-by-step suggested actions." },
            { icon: "⚡", term: "Agent Action", def: "A proposed system mutation (e.g., create a task, send a reminder, trigger a document request). Sits in the approval queue at /agents/actions until a human approves or rejects it." },
          ].map((item, i) => (
            <div className="docs-card docs-agent-concept-card" key={i}>
              <div className="docs-agent-concept-icon">{item.icon}</div>
              <div className="docs-agent-concept-term">{item.term}</div>
              <div className="docs-agent-concept-def">{item.def}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Governance Agents ── */}
      <div id="ag-framework" className="docs-anchor">
        <h2 className="docs-h2">Governance Agent Framework™</h2>
        <p className="docs-p">
          Six purpose-built agents monitor your governance posture continuously. Each agent has a defined module scope, configurable thresholds, and an execution schedule. Manage them at <a href="/agents" className="docs-route-link">/agents</a>.
        </p>
      </div>

      {GOVERNANCE_AGENTS.map((agent, i) => (
        <div id={agent.id} className="docs-anchor docs-agent-card" key={i}>
          <div className="docs-agent-header">
            <span className="docs-agent-icon">{agent.icon}</span>
            <div>
              <div className="docs-agent-name">{agent.name}</div>
              <div className="docs-agent-meta">
                <span className="docs-badge docs-badge-indigo">{agent.type}</span>
                <span className="docs-badge docs-badge-blue">{agent.mode}</span>
                <a href={agent.route} className="docs-agent-route">{agent.route}</a>
              </div>
            </div>
          </div>
          <p className="docs-agent-tagline">{agent.tagline}</p>
          <p className="docs-p">{agent.what}</p>

          <div className="docs-agent-grid">
            <div>
              <div className="docs-agent-col-title">🎯 Trigger conditions</div>
              <ul className="docs-ul">
                {agent.triggers.map((t, j) => <li key={j}>{t}</li>)}
              </ul>
            </div>
            <div>
              <div className="docs-agent-col-title">📤 Outputs</div>
              <ul className="docs-ul">
                {agent.outputs.map((o, j) => <li key={j}>{o}</li>)}
              </ul>
            </div>
          </div>
        </div>
      ))}

      {/* ── Module AI Assistants ── */}
      <div id="ag-assistants" className="docs-anchor">
        <h2 className="docs-h2">Module AI Assistants</h2>
        <p className="docs-p">
          Every AUDT module has a dedicated AI assistant powered by Google Gemini 2.5 Flash. These assistants provide on-demand analysis, cached executive summaries, and multi-turn NL chat — accessible from each module's AI tab.
        </p>
        <div className="docs-module-list">
          {MODULE_AI_ASSISTANTS.map((a, i) => (
            <div className="docs-module-card docs-assistant-card" key={i}>
              <div className="docs-module-head">
                <span className="docs-agent-icon" style={{ fontSize: 18 }}>{a.icon}</span>
                <span className="docs-module-name">{a.name}</span>
                <span className="docs-module-name" style={{ color: "var(--docs-ink-dim)", fontWeight: 400, fontSize: 12 }}>in {a.module}</span>
                <a href={a.route} className="docs-module-route">{a.route}</a>
              </div>
              <p className="docs-module-desc">{a.what}</p>
              <div className="docs-agent-caps">
                {a.capabilities.map((c, j) => (
                  <span className="docs-cap-pill" key={j}>{c}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Lifecycle ── */}
      <div id="ag-lifecycle" className="docs-anchor">
        <h2 className="docs-h2">Agent Lifecycle &amp; Pages</h2>
        <p className="docs-p">The Governance Agent Framework™ spans 10 pages under <code className="docs-code">/agents</code>:</p>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead><tr><th>Page</th><th>Route</th><th>What it does</th></tr></thead>
            <tbody>
              {[
                ["Hub", "/agents", "KPI strip — total agents, runs today, pending approvals, observations this week. Recent runs + observations. 9-card module nav."],
                ["Registry", "/agents/registry", "All configured agents with type, execution mode, status, and key metrics (avg runs/week, observations generated, acceptance rate)."],
                ["Studio", "/agents/studio", "Create and configure custom agents — select module scope, write rules in plain English, set thresholds, choose schedule."],
                ["Runs", "/agents/runs", "Full execution history — start time, duration, observations generated, recommendations created, actions proposed per run."],
                ["Observations", "/agents/observations", "All governance signals with severity badge, source module, linked entity, status (open/actioned/dismissed). Filter by severity, module, date."],
                ["Recommendations", "/agents/recommendations", "Prioritised action list — confidence ring (0–100), impact/effort labels, suggested steps. Accept or Dismiss each recommendation."],
                ["Actions", "/agents/actions", "Human approval queue — proposed system mutations waiting for Approve or Reject. Full action history below queue."],
                ["Orchestration", "/agents/orchestration", "Multi-agent pipelines — sequence agents to pass observations downstream. Run log shows which agents ran in each pipeline."],
                ["Analytics", "/agents/analytics", "Agent performance metrics — success rate, MTTR improvement, automation coverage %, observations per run, recommendation acceptance rate."],
                ["Copilot™", "/agents/copilot", "Multi-turn NL governance chat — ask anything about agent activity, observations, recommendations, or posture across all modules."],
              ].map((row, i) => (
                <tr key={i}>
                  <td><strong>{row[0]}</strong></td>
                  <td><a href={row[1]} className="docs-route-link">{row[1]}</a></td>
                  <td>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="docs-callout docs-callout-tip" style={{ marginTop: 20 }}>
          <span className="docs-callout-icon">💡</span>
          <div><strong>Getting started:</strong> Go to <a href="/agents/registry" className="docs-route-link">/agents/registry</a>, enable the Risk Monitor and Vendor Watch agents, set your schedule to daily, and click Run Now. Your first observations will appear within seconds.</div>
        </div>
      </div>
    </section>
  );
}

function ApiSection() {
  return (
    <section id="api" className="docs-section">
      <h1 className="docs-h1">API &amp; Integrations</h1>

      <div id="api-auth" className="docs-anchor">
        <h2 className="docs-h2">Authentication</h2>
        <p className="docs-p">
          AUDT uses Bearer token authentication. Create API keys at <a href="/settings/api-keys" className="docs-route-link">/settings/api-keys</a>.
          Two permission levels are available: <strong>read_only</strong> and <strong>read_write</strong>. Keys are shown
          once at creation and stored as a bcrypt hash.
        </p>
      </div>

      <div id="api-rate-limits" className="docs-anchor">
        <h2 className="docs-h2">Rate Limits</h2>
        <table className="docs-table">
          <thead>
            <tr><th>Plan</th><th>Limit</th><th>Window</th></tr>
          </thead>
          <tbody>
            {RATE_LIMITS.map((r, i) => (
              <tr key={i}><td>{r.plan}</td><td>{r.limit}</td><td>{r.window}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div id="api-endpoints" className="docs-anchor">
        <h2 className="docs-h2">Key Endpoints</h2>
        <table className="docs-table">
          <thead>
            <tr><th>Method</th><th>Endpoint</th><th>Description</th><th>Permission</th></tr>
          </thead>
          <tbody>
            {ENDPOINTS.map((e, i) => (
              <tr key={i}>
                <td><span className={`docs-method docs-method-${e.method.toLowerCase()}`}>{e.method}</span></td>
                <td><code className="docs-inline-code">{e.path}</code></td>
                <td>{e.desc}</td>
                <td><span className="docs-perm">{e.perm}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div id="api-error-handling" className="docs-anchor">
        <h2 className="docs-h2">Error Handling</h2>
        <p className="docs-p">All errors return JSON with an <code className="docs-inline-code">error</code> field. HTTP status codes follow REST conventions.</p>
        <pre className="docs-code"><code>{ERROR_HANDLING}</code></pre>
      </div>

      <div id="api-curl" className="docs-anchor">
        <h2 className="docs-h2">cURL Examples</h2>
        <pre className="docs-code"><code>{CURL_EXAMPLES}</code></pre>
      </div>

      <div id="api-js" className="docs-anchor">
        <h2 className="docs-h2">JavaScript / TypeScript</h2>
        <p className="docs-p">No SDK required — use native <code className="docs-inline-code">fetch</code> or any HTTP client. The API returns JSON on every endpoint.</p>
        <pre className="docs-code"><code>{JS_EXAMPLES}</code></pre>
      </div>

      <div id="api-python" className="docs-anchor">
        <h2 className="docs-h2">Python</h2>
        <p className="docs-p">Use the <code className="docs-inline-code">requests</code> library. All endpoints return JSON dictionaries matching the TypeScript types.</p>
        <pre className="docs-code"><code>{PYTHON_EXAMPLES}</code></pre>
      </div>

      <div id="api-webhooks" className="docs-anchor">
        <h2 className="docs-h2">Webhooks</h2>
        <p className="docs-p">Register webhooks at <a href="/trust-api/webhooks" className="docs-route-link">/trust-api/webhooks</a>. AUDT delivers a <code className="docs-inline-code">POST</code> to your endpoint for each subscribed event. Expects a <code className="docs-inline-code">200</code> response within 10 seconds, then retries.</p>
        <pre className="docs-code"><code>{WEBHOOK_EXAMPLES}</code></pre>
      </div>

      <div id="api-trust-score-ref" className="docs-anchor">
        <h2 className="docs-h2">Trust Score API</h2>
        <p className="docs-p">The Trust Score endpoints return structured breakdowns useful for embedding in external dashboards, SIEM integrations, or BI tools.</p>
        <pre className="docs-code"><code>{TRUST_SCORE_API}</code></pre>
      </div>

      <div id="api-integrations" className="docs-anchor">
        <h2 className="docs-h2">Integrations</h2>
        <p className="docs-p">
          35+ connectors across 11 categories. Phase 1 connectors cover ~80% of prospect requirements.
        </p>
        <h4 className="docs-h4">Phase 1 Connectors</h4>
        <div className="docs-fw-pills">
          {PHASE1_CONNECTORS.map((c, i) => (
            <span className="docs-pill" key={i}>{c}</span>
          ))}
        </div>
        <h4 className="docs-h4">How to Connect</h4>
        <p className="docs-p">
          Go to <a href="/integration-hub/marketplace" className="docs-route-link">/integration-hub/marketplace</a> → click connector → Configure →
          enter credentials → Test Connection → Save. Credentials are stored AES-256-GCM encrypted.
        </p>
        <h4 className="docs-h4">Categories</h4>
        <div className="docs-fw-pills">
          {INTEGRATION_CATEGORIES.map((c, i) => (
            <span className="docs-pill" key={i}>{c}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   AI AGENTS DATA
   ============================================================ */
const GOVERNANCE_AGENTS = [
  {
    id: "ag-risk-monitor",
    icon: "⚠️",
    name: "Risk Monitor Agent",
    type: "risk_monitor",
    mode: "Scheduled · Real-time",
    tagline: "Continuously scans your risk register for posture changes, new critical risks, and overdue treatment plans.",
    what: "The Risk Monitor Agent runs on a configurable schedule (daily by default) across your entire Risk Lens™ register. It evaluates every open risk for score changes, overdue treatment deadlines, and missing owners. When it detects a deterioration — such as a risk whose inherent score has increased or a treatment plan that has passed its due date — it generates a structured Observation and raises a prioritised Recommendation for a human to act on.",
    triggers: [
      "A risk transitions to Critical (score ≥ 80) with no active treatment plan",
      "A treatment action passes its due date without being completed",
      "A risk has had no review in more than 90 days",
      "A vendor-linked risk has no assigned owner",
      "More than 5 open Critical risks exist simultaneously",
    ],
    outputs: [
      "Observations tagged severity: critical / high / medium / low",
      "Recommendations: 'Assign owner to risk X', 'Escalate overdue treatment Y'",
      "Agent Actions (awaiting human approval): auto-create a follow-up treatment, escalate to CISO",
    ],
    route: "/agents/registry",
  },
  {
    id: "ag-vendor-watch",
    icon: "🏢",
    name: "Vendor Watch Agent",
    type: "vendor_watch",
    mode: "Scheduled · Real-time",
    tagline: "Monitors the entire vendor portfolio for document expiry, trust score decline, and missing assessments.",
    what: "The Vendor Watch Agent tracks every active vendor across document validity, Trust Score™ trajectory, assessment recency, and review schedules. It pulls data from Vendor Hub™, Risk Lens™, and the Trust Score™ engine to build a consolidated health picture per vendor. When a vendor's posture deteriorates — expired SOC 2, declining Trust Score, or an overdue periodic review — the agent generates targeted observations and recommendations before the issue surfaces in an audit.",
    triggers: [
      "A critical document (SOC 2, ISO cert, DPA) expires or will expire within 30 days",
      "A vendor Trust Score™ drops by more than 10 points in 7 days",
      "A vendor has had no security assessment in over 180 days",
      "A vendor review is overdue by more than 14 days",
      "A High-risk vendor has no linked compliance control",
    ],
    outputs: [
      "Observations: 'Vendor Acme Corp SOC 2 expires in 12 days'",
      "Recommendations: 'Request updated ISO 27001 certificate from Vendor X'",
      "Agent Actions: auto-trigger a document request to the vendor portal",
    ],
    route: "/agents/registry",
  },
  {
    id: "ag-compliance-guardian",
    icon: "🛡️",
    name: "Compliance Guardian",
    type: "compliance_guardian",
    mode: "Scheduled · Event-driven",
    tagline: "Watches framework readiness scores, control coverage gaps, and evidence health across all active frameworks.",
    what: "The Compliance Guardian runs after every evidence upload, control status change, or gap analysis to check whether readiness scores are on track for upcoming audit deadlines. It understands the relationship between evidence, controls, and framework readiness — so when a piece of evidence expires, it immediately identifies which controls lose coverage and which frameworks are affected. It is particularly useful for organisations managing multiple frameworks simultaneously (e.g., ISO 27001 + SOC 2 + DPDP).",
    triggers: [
      "A framework readiness score drops below a configured threshold (default 70%)",
      "An evidence item expires, leaving one or more controls uncovered",
      "A control status changes to 'not_implemented' on a critical framework",
      "A gap analysis detects a new Critical gap",
      "An audit deadline is within 60 days and readiness is below 80%",
    ],
    outputs: [
      "Observations: 'ISO 27001 readiness dropped to 64% — 8 controls now uncovered'",
      "Recommendations: 'Upload renewed penetration test report to cover A.12.6.1'",
      "Agent Actions: auto-create evidence collection tasks in Issue Hub™",
    ],
    route: "/agents/registry",
  },
  {
    id: "ag-policy-enforcer",
    icon: "📋",
    name: "Policy Enforcer",
    type: "policy_enforcer",
    mode: "Scheduled · Event-driven",
    tagline: "Ensures policies are current, attested, and linked to the controls and frameworks they govern.",
    what: "The Policy Enforcer monitors your Policy Governance™ module for stale policies, missing attestations, and broken policy-to-control linkages. It knows that an unattested policy is as dangerous as no policy — so it tracks attestation completion rates per policy and per team member. It also validates that every active compliance control has at least one approved policy backing it, and alerts when that link breaks (e.g., a policy is archived without a replacement).",
    triggers: [
      "A policy's review date has passed without a new version being published",
      "An active policy has less than 80% attestation completion after 14 days",
      "A policy is archived and leaves controls without policy coverage",
      "A new framework control is created with no linked policy",
      "A policy owner has left the organisation (membership deactivated)",
    ],
    outputs: [
      "Observations: 'Acceptable Use Policy — 14 team members have not attested (deadline passed)'",
      "Recommendations: 'Send attestation reminders for Information Security Policy'",
      "Agent Actions: auto-send attestation reminder emails via Resend",
    ],
    route: "/agents/registry",
  },
  {
    id: "ag-audit-prep",
    icon: "🔍",
    name: "Audit Prep Agent",
    type: "audit_prep",
    mode: "Scheduled · Manual trigger",
    tagline: "Validates that all evidence, controls, and CAPAs are in order before an audit milestone.",
    what: "The Audit Prep Agent is designed to be run 30–60 days before a scheduled audit. It performs a comprehensive pre-audit sweep: checks every audit program item for completion, validates that each finding has an associated CAPA, verifies that CAPAs are on track or completed, confirms evidence is current and mapped, and ensures the audit package documents are generated and up to date. Think of it as an automated audit readiness reviewer that flags every gap before the auditor sees it.",
    triggers: [
      "An audit is within 60 days of its start date",
      "An audit program item has been pending for more than 14 days",
      "A finding has no CAPA assigned after 7 days",
      "A CAPA is overdue by more than its target date",
      "An audit report has not been generated within 7 days of audit completion",
    ],
    outputs: [
      "Observations: 'Audit ISO-2025-Q2 — 6 program items still pending, 2 findings have no CAPA'",
      "Recommendations: 'Generate audit package for vendor Acme Corp before 15 Jan'",
      "Agent Actions: auto-generate audit program from framework controls, assign CAPA owners",
    ],
    route: "/agents/registry",
  },
  {
    id: "ag-custom",
    icon: "⚙️",
    name: "Custom Agent",
    type: "custom",
    mode: "Scheduled · Real-time · Manual",
    tagline: "Build your own governance agent with custom rules, module scope, thresholds, and schedule.",
    what: "Custom Agents let you define governance automation that goes beyond the five built-in types. Using Agent Studio™ at /agents/studio, you select which modules the agent monitors, write plain-English rules (e.g., 'Alert if any vendor with risk level = High has no active contract'), set numeric thresholds, and choose an execution schedule. The agent runs on your schedule, evaluates your rules against live data, and generates observations and recommendations exactly like the built-in agents — with full audit trail and human-approval gates on any proposed action.",
    triggers: [
      "Any condition you define: module-level data thresholds, status changes, date triggers",
      "Cross-module rules: e.g., 'Vendor risk is High AND no active contract exists'",
      "Composite conditions: e.g., 'Control health < 60% AND last test was > 90 days ago'",
    ],
    outputs: [
      "Observations with your custom severity and label",
      "Recommendations with your configured action steps",
      "Agent Actions queued for human approval in /agents/actions",
    ],
    route: "/agents/studio",
  },
];

const MODULE_AI_ASSISTANTS = [
  { icon: "🏢", module: "Vendor Hub™", name: "AI Insights™", route: "/vendors/[id]", what: "Generates AI-written vendor briefs and executive summaries from assessment scores, document coverage, and risk exposure. Also powers NL search — type 'show high-risk SaaS vendors with expired SOC 2' and get filtered results.", capabilities: ["Vendor brief (cached 24h)", "NL vendor search", "Score explanations", "Risk factor narratives"] },
  { icon: "🛡️", module: "Evidence Vault™", name: "AI Compliance Officer™", route: "/compliance/ai", what: "A full AI governance advisor for compliance. Explains framework readiness scores, narrates gap findings in plain English, generates executive compliance summaries for board presentations, and answers live NL questions about your compliance posture.", capabilities: ["Framework readiness explanation", "Gap narrative generation", "Executive summary (cached 24h)", "Multi-turn NL chat: 'What are our biggest ISO 27001 gaps?'"] },
  { icon: "🔍", module: "Audit Management", name: "AI Auditor™", route: "/audits/ai", what: "Converts plain-English observations into structured audit findings (severity, description, affected control, recommendation). Generates CAPA suggestions for each finding. Produces board-ready audit executive reports. Answers questions like 'Which CAPAs are overdue?' in real time.", capabilities: ["Finding generator from observation text", "3 CAPA suggestions per finding", "Executive audit report (cached)", "Multi-turn NL chat"] },
  { icon: "⚠️", module: "Risk Lens™", name: "AI Risk Officer™", route: "/risks/ai", what: "Generates a risk narrative for every risk — explaining the inherent score, linking it to affected assets and vendors, and recommending mitigation strategies. Produces a board-level risk executive report. Handles live questions like 'Summarise our top 5 cyber risks'.", capabilities: ["Per-risk narrative (cached)", "5 mitigation recommendations", "Executive risk report (cached)", "Multi-turn NL chat"] },
  { icon: "🎛️", module: "Control Center™", name: "AI Control Advisor™", route: "/controls/ai", what: "Detects the top 5 control gaps across your entire control library — controls with low health scores, missing evidence, or no recent tests. Generates an executive summary suitable for a board risk committee. Answers live questions about specific controls.", capabilities: ["Top-5 gap detection", "Executive summary (cached)", "Per-control narrative (cached)", "Multi-turn NL chat"] },
  { icon: "📋", module: "Policy Governance™", name: "AI Policy Advisor™", route: "/compliance/policies", what: "Reviews policy content and suggests improvements, flags policies nearing review dates, and identifies controls that lack policy coverage. Embedded inline on the policy detail page.", capabilities: ["Policy gap detection", "Review date alerts", "Control-policy coverage check"] },
  { icon: "📝", module: "Contract Governance™", name: "AI Contract Advisor™", route: "/contract-governance/ai", what: "Extracts key clauses and obligations from contract text, analyses clause risk levels, and generates an executive contract summary. Answers questions like 'Which contracts expire in Q1?' or 'Show contracts with no DPA clause'.", capabilities: ["Clause extraction", "Obligation extraction", "Clause risk analysis", "Executive summary", "Multi-turn NL chat"] },
  { icon: "🔧", module: "Issue & Remediation Hub™", name: "AI Issue Advisor™", route: "/issue-hub/ai", what: "Converts governance observations into structured issues with severity, source module, and suggested owner. Generates a full remediation task plan for any open issue. Answers questions like 'Show all overdue critical issues' and summarises the overall remediation backlog.", capabilities: ["Issue generator from observation", "Remediation task planner", "Executive summary", "Multi-turn NL chat"] },
  { icon: "📊", module: "Trust Intelligence™", name: "Governance Copilot™", route: "/trust-intelligence/executive", what: "The flagship AI assistant. Generates a comprehensive AI Governance Summary covering all 5 Org Trust Score™ components — suitable for board and executive presentations. Answers free-form questions about your entire governance posture across all modules.", capabilities: ["Governance summary (cached 24h)", "Cross-module NL reasoning", "Driver/detractor explanations", "Multi-turn NL chat"] },
  { icon: "📈", module: "Executive Reporting™", name: "AI Executive Analyst™", route: "/executive-reporting/ai", what: "Generates role-specific executive summaries (CEO, CRO, CISO, Compliance, Board), board-ready reports for 8 report types, and trend analysis narratives. Can answer questions like 'What's our governance trajectory over the last 90 days?'.", capabilities: ["Role dashboard summaries", "Board report generation", "Trend analysis", "Multi-turn NL chat"] },
  { icon: "🤖", module: "AI Governance™", name: "AI Governance Copilot™", route: "/ai-governance/ai", what: "Specialised AI advisor for responsible AI governance. Reviews your AI system inventory, flags high-risk AI systems with inadequate controls, assesses compliance against ISO 42001 / EU AI Act / NIST AI RMF, and recommends governance actions.", capabilities: ["AI risk advisory (5 recs)", "Compliance readiness analysis", "System inventory summary", "Multi-turn NL chat"] },
  { icon: "🔗", module: "Integration Hub™", name: "AI Integration Advisor™", route: "/integration-hub/ai", what: "Analyses the health of all connected integrations, identifies connectors that would improve evidence automation coverage, and recommends the highest-ROI integrations based on your compliance framework gaps.", capabilities: ["Integration health summary", "Connector recommendations", "Coverage gap analysis", "Multi-turn NL chat"] },
  { icon: "📉", module: "Benchmarking™", name: "AI Benchmark Analyst™", route: "/benchmarking/ai", what: "Generates an industry benchmark executive report comparing your governance scores to sector peers, identifies which categories have the most improvement potential, and creates a personalised Improvement Planner™ with ranked actions.", capabilities: ["Executive benchmark report", "Industry insights narrative", "Improvement Planner™", "Multi-turn NL chat"] },
  { icon: "📰", module: "Regulatory Intelligence™", name: "AI Regulatory Advisor™", route: "/regulatory-intelligence/ai", what: "Provides a cached regulatory advisory summary covering your most relevant regulations, analyses individual regulatory changes for impact on your controls and obligations, and generates a 4-panel Compliance Horizon™ forecast covering emerging risks, deadlines, global trends, and recommended actions.", capabilities: ["Advisory summary (cached 24h)", "Per-change impact analysis", "Obligation extraction", "Compliance Horizon™ forecast", "Multi-turn NL chat"] },
  { icon: "✅", module: "Trust Verification™", name: "AI Verification Advisor™", route: "/trust-verification/ai", what: "Assesses your organisation's eligibility for each of the 10 verification programs (AUDT Verified™, Privacy Ready™, Enterprise Ready™, etc.), identifies the readiness gaps that would prevent certification, and provides a step-by-step preparation guide.", capabilities: ["Verification eligibility analysis", "Readiness gap report", "Preparation guide", "Multi-turn NL chat"] },
  { icon: "🛡", module: "Security Command Center™", name: "AI Security Advisor™", route: "/security-center", what: "Reviews your security posture across MFA adoption, SSO configuration, session hygiene, IP allow list coverage, and AI prompt audit logs. Generates 5 prioritised security recommendations and an overall Security Readiness Score™ narrative.", capabilities: ["Security posture summary (cached 24h)", "5 prioritised recommendations", "Prompt sensitivity analysis", "Multi-turn NL chat"] },
  { icon: "🗂️", module: "Asset Intelligence™", name: "AI Asset Advisor™", route: "/asset-intelligence/ai", what: "Analyses your asset inventory for coverage gaps, high-criticality assets without owners or risk assessments, and PII assets without DPDP linkage. Performs dependency chain analysis to show the blast radius of a critical asset failure.", capabilities: ["Advisory summary (cached 24h)", "Impact analyser", "Dependency chain analysis", "Multi-turn NL chat"] },
  { icon: "🧠", module: "Governance Agent Framework™", name: "Governance Copilot™", route: "/agents/copilot", what: "A dedicated NL chat interface for querying agent activity across all governance agents. Ask 'Which agents raised critical observations this week?', 'What actions are pending approval?', or 'Summarise the vendor watch agent findings for Q1'.", capabilities: ["Cross-agent NL reasoning", "Observation query", "Recommendation query", "Action status query"] },
  { icon: "✅", module: "Continuous Compliance™", name: "AI Compliance Officer™", route: "/continuous-compliance/ai", what: "Reviews your automated check results, access review completions, attestation rates, and training compliance. Generates a Compliance Health™ narrative and per-check remediation guides for any failing checks.", capabilities: ["Health score narrative", "Per-check remediation guide", "Compliance summary (cached 24h)", "Multi-turn NL chat"] },
  { icon: "⚡", module: "Trust Operations Engine™", name: "Operations Copilot™", route: "/operations/ai", what: "Generates an Operations Advisory covering your event pipeline, active workflow instances, pending approvals, and automation rule effectiveness. Provides AI Decision Engine recommendations and workflow guidance.", capabilities: ["Operations advisory (cached 24h)", "Workflow recommendations", "Step guidance", "Multi-turn NL chat"] },
  { icon: "🤝", module: "Auditor Collaboration™", name: "AI Audit Advisor™", route: "/auditor-collaboration/ai", what: "Assesses audit readiness across all active audit rooms, identifies the top evidence gaps auditors are likely to flag, and generates AI-drafted findings from room activity. Answers questions about evidence request status and external finding trends.", capabilities: ["Audit readiness summary (cached 24h)", "Evidence gap analysis (top 5)", "AI finding drafter", "Multi-turn NL chat"] },
  { icon: "🌐", module: "Trust Network™", name: "AI Trust Network Advisor™", route: "/trust-network/ai", what: "Generates a Trust Network Reputation™ narrative explaining your 5-component network score, identifies the highest-ROI actions for improving your public trust presence, and provides a Network Improvement Plan™ with 4 prioritised actions.", capabilities: ["Network reputation summary", "4-action Improvement Plan™", "Profile completeness guidance", "Multi-turn NL chat"] },
  { icon: "🔌", module: "Trust API Platform™", name: "AI API Builder™", route: "/trust-api/ai", what: "Generates per-product API documentation, code samples, and integration guides for each of the 8 Trust API Platform™ products. Provides an integration health summary and recommends the highest-value API products for your platform tier.", capabilities: ["Per-product API docs", "Code sample generation", "Platform health summary (cached 24h)", "Multi-turn NL chat"] },
];


function DocsHeader({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (v: string) => void }) {
  return (
    <header className="docs-header">
      <div className="docs-header-left">
        <span className="docs-logo-mark">A</span>
        <span className="docs-logo-text">AUDT</span>
        <span className="docs-docs-badge">Docs</span>
      </div>
      <div className="docs-header-center">
        <input
          className="docs-search"
          type="text"
          placeholder="Search documentation…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="docs-header-right">
        <a className="docs-header-link" href="/dashboard">Dashboard</a>
        <a className="docs-header-link docs-header-link-primary" href="https://audt.tech" target="_blank" rel="noreferrer">audt.tech</a>
      </div>
    </header>
  );
}

function DocsTabBar({ activeTab, onTab }: { activeTab: string; onTab: (id: string) => void }) {
  return (
    <nav className="docs-tabbar">
      {TABS.map((t, i) => (
        <button
          key={i}
          className={`docs-tab ${activeTab === t.id ? "docs-tab-active" : ""}`}
          onClick={() => onTab(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

function DocsSidebar({
  activeTab,
  activeSection,
  searchQuery,
  onItem,
}: {
  activeTab: string;
  activeSection: string;
  searchQuery: string;
  onItem: (id: string) => void;
}) {
  const groups = SIDEBAR[activeTab] ?? [];
  const q = searchQuery.trim().toLowerCase();

  const anyMatch = groups.some((g) =>
    (q ? g.items.filter((it) => it.label.toLowerCase().includes(q)) : g.items).length > 0
  );

  return (
    <aside className="docs-sidebar">
      {groups.map((g, i) => {
        const items = q ? g.items.filter((it) => it.label.toLowerCase().includes(q)) : g.items;
        if (items.length === 0) return null;
        return (
          <div className="docs-sidebar-group" key={i}>
            <div className="docs-sidebar-grouptitle">{g.group}</div>
            {items.map((it, j) => (
              <button
                key={j}
                className={`docs-sidebar-item ${activeSection === it.id ? "docs-sidebar-item-active" : ""}`}
                onClick={() => onItem(it.id)}
              >
                {it.label}
              </button>
            ))}
          </div>
        );
      })}
      {!anyMatch && q && <div className="docs-sidebar-empty">No matches.</div>}
    </aside>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function DocsPage() {
  const [activeTab, setActiveTab] = useState("getting-started");
  const [activeSection, setActiveSection] = useState("gs-welcome");
  const [searchQuery, setSearchQuery] = useState("");
  const programmaticScroll = useRef(false);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    programmaticScroll.current = true;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
    window.setTimeout(() => {
      programmaticScroll.current = false;
    }, 800);
  };

  const handleTab = (id: string) => {
    setActiveTab(id);
    const firstItem = SIDEBAR[id]?.[0]?.items?.[0];
    window.setTimeout(() => {
      const targetId = firstItem ? firstItem.id : id;
      scrollToId(targetId);
    }, 30);
  };

  const handleItem = (id: string) => {
    scrollToId(id);
  };

  // Track which tab section is in view → update activeTab
  useEffect(() => {
    const sectionEls = TABS.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    if (sectionEls.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (programmaticScroll.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveTab(visible[0].target.id);
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
    );

    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Track which anchored subsection is in view → update activeSection
  useEffect(() => {
    const anchorEls = Array.from(document.querySelectorAll<HTMLElement>(".docs-anchor"));
    if (anchorEls.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (programmaticScroll.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0] && visible[0].target.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-130px 0px -65% 0px", threshold: 0 }
    );

    anchorEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="docs-root">
      <DocsHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <DocsTabBar activeTab={activeTab} onTab={handleTab} />
      <div className="docs-body">
        <DocsSidebar
          activeTab={activeTab}
          activeSection={activeSection}
          searchQuery={searchQuery}
          onItem={handleItem}
        />
        <main className="docs-main">
          <GettingStartedSection />
          <UseCasesSection />
          <ModulesSection />
          <FrameworksSection />
          <RoleGuidesSection />
          <ResourcesSection />
          <AiAgentsSection />
          <ApiSection />
        </main>
      </div>
    </div>
  );
}
