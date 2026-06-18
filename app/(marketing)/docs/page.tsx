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
  api: [
    {
      group: "API & Integrations",
      items: [
        { id: "api-auth", label: "Authentication" },
        { id: "api-rate-limits", label: "Rate Limits" },
        { id: "api-endpoints", label: "Key Endpoints" },
        { id: "api-curl", label: "Examples" },
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
    components: ["Evidence (25%)", "Compliance (20%)", "Risk (20%)", "Assessment (15%)", "Operational (10%)", "Freshness (10%)"],
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
      "Monitor via AI Trust Score™ — Risk(25%), Controls(25%), Compliance(20%), Monitoring(15%), Vendor(10%), Incidents(5%)",
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
  { plan: "Starter", limit: "100 requests", window: "60 seconds" },
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
          <span className="docs-step-text">{s}</span>
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

/* ============================================================
   SECTION COMPONENTS
   ============================================================ */
function GettingStartedSection() {
  return (
    <section id="getting-started" className="docs-section">
      <div id="gs-welcome" className="docs-anchor">
        <div className="docs-hero">
          <h1 className="docs-hero-title">Welcome to AUDT</h1>
          <p className="docs-hero-sub">Vendor Governance, Compliance &amp; Audit Management Platform</p>
          <p className="docs-hero-body">
            Manage vendors, compliance programs, risks and audits from a single platform. From vendor onboarding to board-ready audit reports.
          </p>
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
      <p className="docs-p">AUDT ships 31 governance modules across six groups. Each module is self-contained with its own data layer, services, AI assistant, and REST API surface.</p>
      {MODULE_GROUPS.map((g, i) => (
        <div id={g.id} className="docs-anchor" key={i}>
          <h2 className="docs-h2 docs-module-group">{g.group}</h2>
          <div className="docs-module-list">
            {g.modules.map((m, j) => (
              <div className="docs-module-card" key={j}>
                <div className="docs-module-head">
                  <span className="docs-module-name">{m.name}</span>
                  {m.route && <code className="docs-module-route">{m.route}</code>}
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
      <p className="docs-p">AUDT ships with 174 built-in controls across five frameworks. Add a framework at /compliance/frameworks to begin tracking readiness.</p>
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
          {f.note && <p className="docs-fw-note">{f.note}</p>}
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

function ApiSection() {
  return (
    <section id="api" className="docs-section">
      <h1 className="docs-h1">API &amp; Integrations</h1>

      <div id="api-auth" className="docs-anchor">
        <h2 className="docs-h2">Authentication</h2>
        <p className="docs-p">
          AUDT uses Bearer token authentication. Create API keys at <code className="docs-inline-code">/settings/api-keys</code>.
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

      <div id="api-curl" className="docs-anchor">
        <h2 className="docs-h2">Examples</h2>
        <pre className="docs-code"><code>{CURL_EXAMPLES}</code></pre>
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
          Go to <code className="docs-inline-code">/integration-hub/marketplace</code> → click connector → Configure →
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
   LAYOUT COMPONENTS
   ============================================================ */
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
          <ApiSection />
        </main>
      </div>
    </div>
  );
}
