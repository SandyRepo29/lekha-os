export type ModuleHelp = {
  title: string;
  icon: string;
  group: string;
  overview: string;
  features: string[];
  tips: string[];
  route: string;
};

export const HELP_CONTENT: Record<string, ModuleHelp> = {
  "/dashboard": {
    title: "Dashboard",
    icon: "LayoutDashboard",
    group: "",
    overview:
      "Your governance command centre — a single-screen summary of organisational trust posture, recent activity, and module health across all 31 AUDT modules.",
    features: [
      "Live Org Trust Score™ ring with component breakdown",
      "Module health strip — quick status for Vendor Hub, Risk Lens, Compliance, Audits, and more",
      "Recent audit log events and activity feed",
      "Quick-access cards to every major module",
      "Critical alerts and overdue action counts at a glance",
    ],
    tips: [
      "Bookmark /dashboard as your daily starting point — it surfaces whatever needs attention first.",
      "Click any metric card to deep-link directly into that module's filtered view.",
      "Use the global search (/) to find vendors, risks, controls, and more from any page.",
    ],
    route: "/dashboard",
  },

  "/vendors": {
    title: "Vendor Hub™",
    icon: "Building2",
    group: "Core GRC",
    overview:
      "The central registry for all third-party vendors — manage relationships, documents, assessments, risk scores, and AI-powered due diligence from one place.",
    features: [
      "Vendor registry with 25-column profiles including owner, risk level, and compliance tier",
      "AI document extraction — automatically pulls 10 key fields from uploaded certificates and contracts",
      "Security assessments with 17-question scorecard and AI summary",
      "Trust Score™ badge — 6-component 0-100 governance signal per vendor",
      "Vendor portal with magic-link self-service for document submission",
      "Periodic governance reviews with AI narrative",
      "Natural language search — ask 'show high-risk vendors missing ISO cert'",
      "Executive PDF and Audit Package export per vendor",
    ],
    tips: [
      "Use the natural language search bar in the topbar for complex vendor queries — it understands plain English like 'vendors expiring in 30 days'.",
      "The Trust Score&#8482; auto-refreshes on page load if older than 1 hour — click Recalculate to force a fresh score immediately.",
      "Assign document templates to vendor types so required docs are enforced automatically on every new vendor.",
      "Press N anywhere on the Vendor Hub to quickly add a new vendor.",
      "Use the global search (/) to find vendors, risks, controls, and more from any page.",
    ],
    route: "/vendors",
  },

  "/compliance": {
    title: "Evidence Vault™",
    icon: "ShieldCheck",
    group: "Core GRC",
    overview:
      "Full compliance lifecycle management — frameworks, controls, evidence, policies, gap analysis, and AI-narrated reports for ISO 27001, SOC 2, DPDP, PCI DSS, and HIPAA.",
    features: [
      "174 pre-built controls across ISO 27001, SOC 2, DPDP, PCI DSS, and HIPAA",
      "Readiness scoring — live per-framework coverage percentage",
      "Evidence management with vendor doc auto-import bridge",
      "Policy library with version history and immutable snapshots",
      "Rule-based gap analysis with AI narratives for each gap",
      "AI Compliance Officer — executive summaries, framework explanations, and NL chat",
      "Framework PDF and executive AI-narrated report exports",
      "Control-to-evidence many-to-many mappings",
    ],
    tips: [
      "Run gap analysis immediately after uploading new evidence — it re-scores readiness in real time.",
      "Use the AI Officer chat tab to explain complex gaps to non-technical stakeholders.",
      "Auto-import pulls in vendor documents and assessments as compliance evidence — check the Evidence tab after each vendor review.",
    ],
    route: "/compliance",
  },

  "/audits": {
    title: "Audit Management",
    icon: "ClipboardCheck",
    group: "Core GRC",
    overview:
      "End-to-end audit lifecycle — plan audits, execute checklists, raise findings, manage CAPAs, and generate board-ready PDF reports with AI narratives.",
    features: [
      "Audit registry with type (internal/external/regulatory/vendor), scope, and status workflow",
      "Program checklist auto-generated from framework controls",
      "Findings management with severity (critical/high/medium/low) and status tracking",
      "Corrective Action Plans (CAPAs) with owner, due date, and completion workflow",
      "AI Finding Generator — converts observations into structured findings",
      "AI CAPA Suggestions — three recommended actions per finding",
      "Full Audit PDF, Findings PDF, CAPAs PDF, and CSV export",
      "AI Auditor — executive board narrative and NL chat",
    ],
    tips: [
      "Start an audit from a framework — the program checklist is auto-populated with all relevant controls.",
      "Use the AI CAPA Suggestions before manually writing remediation steps — it saves significant time.",
      "The Findings CSV is useful for importing into external tracking tools like Jira or ServiceNow.",
    ],
    route: "/audits",
  },

  "/risks": {
    title: "Risk Lens™",
    icon: "AlertTriangle",
    group: "Core GRC",
    overview:
      "Full risk lifecycle management — identify, assess, treat, and review risks across 13 categories with a 5×5 heat map, AI narratives, and board-ready reporting.",
    features: [
      "Risk registry with 13 categories including cyber, operational, vendor, and privacy",
      "5×5 impact × likelihood heat map with clickable risk counts",
      "Risk treatment plans with progress tracking and completion workflow",
      "Periodic review records with outcome tracking",
      "Junction links to vendors, controls, frameworks, policies, and evidence",
      "AI Risk Officer — executive report, risk narrative per risk, and NL chat",
      "Inherent and residual score computation",
      "CSV export for risks and treatments",
    ],
    tips: [
      "Use the heat map as a presentation tool — it instantly communicates top risks to board audiences.",
      "Link risks to controls so Control Health&#8482; picks up the risk-reduction signal automatically.",
      "The AI executive report is cached for 24 hours — click 'Regenerate' when major changes occur.",
      "Use the global search (/) to find any risk by title from any page.",
    ],
    route: "/risks",
  },

  "/controls": {
    title: "Control Center™",
    icon: "Shield",
    group: "Core GRC",
    overview:
      "Central governance layer for all controls — create, test, score, and monitor every control across frameworks with the 6-component Control Health™ engine.",
    features: [
      "Control library with CRUD, type, frequency, automation level, and owner",
      "Control Health™ score — 6-component engine: evidence (30%), testing (25%), audit (15%), policy (10%), freshness (10%), risk reduction (10%)",
      "Test log with pass/fail/partially-effective results and history",
      "Cross-framework and cross-vendor control mapping",
      "AI Gap Detection — top 5 control gaps with recommended actions",
      "AI Executive Summary — board-narrative for control posture",
      "Control library CSV and test history CSV export",
      "Weakest controls list on dashboard for immediate attention",
    ],
    tips: [
      "Run a test immediately after implementing a control change so the health score reflects the new state.",
      "Standalone controls (no framework) are fully supported — useful for internal operational controls.",
      "The AI Advisor gap detection highlights the highest-value improvement opportunities first.",
      "Use the global search (/) to jump directly to any control by name from any page.",
    ],
    route: "/controls",
  },

  "/policy-governance": {
    title: "Policy Governance&#8482;",
    icon: "FileText",
    group: "Trust Operations",
    overview:
      "Full policy lifecycle management &#8212; create, version, approve, attest, and retire governance policies across your organization.",
    features: [
      "Policy Library with version history and immutable snapshots",
      "Review workflows and scheduled review reminders",
      "Attestation campaigns for org-wide policy sign-off",
      "Control and framework linkage for compliance mapping",
      "Policy Health&#8482; scoring based on review freshness and attestation rate",
      "AI Policy Advisor&#8482; for drafting, gap analysis, and executive summaries",
    ],
    tips: [
      "Link policies to compliance controls to improve readiness scores",
      "Set review schedules on critical policies to avoid staleness penalties",
      "Use attestation campaigns before audits to demonstrate policy awareness",
    ],
    route: "/policy-governance",
  },

  "/dpdp-privacy": {
    title: "DPDP Privacy™",
    icon: "Lock",
    group: "Privacy & Legal",
    overview:
      "India DPDP Act 2023 compliance module — manage data assets, consent records, privacy requests (DSR), retention schedules, and privacy impact assessments.",
    features: [
      "Data asset inventory with PII classification and sensitivity levels",
      "Consent record management with purpose tracking and withdrawal",
      "Data Subject Request (DSR) lifecycle — access, deletion, correction, portability",
      "Retention policy engine with automated event scheduling",
      "Privacy Impact Assessments (PIA) with risk scoring",
      "Cross-border data transfer registry with safeguard documentation",
      "Privacy Trust Score™ per org",
      "DPDP readiness dashboard with gap indicators",
    ],
    tips: [
      "Register all personal data assets before running the Privacy Trust Score — missing assets lower the score significantly.",
      "DSR requests have a 72-hour response SLA under DPDP — use the status tracker to avoid breaches.",
      "Link data assets to Asset Intelligence™ for a complete enterprise data map.",
    ],
    route: "/dpdp-privacy",
  },

  "/contract-governance": {
    title: "Contract Governance™",
    icon: "FileSignature",
    group: "Privacy & Legal",
    overview:
      "Complete contract lifecycle management — library, clauses, obligations, renewals, and AI-powered risk scoring with a 6-component Contract Score™ engine.",
    features: [
      "Contract library with status, type, value, and expiry tracking",
      "Clause management with category and risk level per clause",
      "Obligation tracker with due dates, owner, and status workflow",
      "Renewals dashboard sorted by expiry date",
      "Contract Score™ — 6-component engine: clause coverage, obligation completion, renewal readiness, risk exposure, policy alignment, privacy compliance",
      "Contract Intelligence&#8482; — contract health analysis, renewal risk summary, AI executive summary, NL chat",
      "Trust Graph integration — contract nodes linked to vendor/risk/policy/control entities",
      "Monitoring rules for expiring and overdue contracts",
    ],
    tips: [
      "Use the AI obligation extractor when uploading new contracts — it pulls out key obligations automatically.",
      "Set renewal reminders 90 days out for material vendor contracts to avoid auto-renewal surprises.",
      "Link contracts to risks so Risk Lens™ tracks contract-related risk exposure.",
    ],
    route: "/contract-governance",
  },

  "/issue-hub": {
    title: "Issue & Remediation Hub™",
    icon: "Target",
    group: "Privacy & Legal",
    overview:
      "Centralised governance execution layer — create, track, escalate, and resolve governance issues from every module with SLA tracking and AI remediation planning.",
    features: [
      "Issue registry sourced from any AUDT module (risk, audit, compliance, control, vendor)",
      "Task management per issue with owner and due date",
      "Exception management — request, approve, and reject governance exceptions",
      "Escalation engine — escalate to owner, manager, exec, or board",
      "SLA tracking — auto-calculated by severity (Critical=7d, High=14d, Medium=30d, Low=90d)",
      "AI Issue Generator — convert observations into structured issues",
      "AI Remediation Planner — generate task plans with owners and timelines",
      "AI Advisor — executive summary and NL chat",
    ],
    tips: [
      "Use the AI Issue Generator to batch-convert audit findings into trackable issues in seconds.",
      "SLA breach monitoring is automatic — configure the Continuous Monitoring™ rules to alert on breaches.",
      "Link issues to risks so Risk Lens™ reflects the current remediation status.",
    ],
    route: "/issue-hub",
  },

  "/workflow-studio": {
    title: "Workflow Studio&#8482;",
    icon: "GitBranch",
    group: "Trust Operations",
    overview:
      "Governance automation engine &#8212; build approval workflows, escalation chains, and automated triggers across all AUDT modules.",
    features: [
      "Visual workflow builder with step-by-step configuration",
      "Approval chains with multi-level sign-off",
      "Escalation rules based on SLA breaches and severity",
      "Cross-module triggers (e.g., create a risk when a critical finding is raised)",
      "Workflow run history and status tracking",
      "AI Workflow Generator&#8482; for automated workflow creation from descriptions",
      "Workflow templates for common governance processes",
    ],
    tips: [
      "Start with the pre-built Vendor Onboarding workflow template",
      "Use escalation rules to auto-notify executives on critical governance events",
      "Link workflows to Governance Agent Framework&#8482; for fully automated governance",
    ],
    route: "/workflow-studio",
  },

  "/trust-intelligence": {
    title: "Trust Intelligence™",
    icon: "Brain",
    group: "Intelligence",
    overview:
      "Executive governance command centre — aggregates all 31 modules into an Organisational Trust Score™ with drivers, detractors, recommendations, and AI Governance Copilot™.",
    features: [
      "Org Trust Score™ ring — 5-component engine: vendor trust (25%), risk posture (25%), control health (20%), audit readiness (15%), compliance coverage (15%)",
      "Vendor Trust, Risk Insights, Control Health, and Compliance sub-views",
      "Recommendations Engine™ — prioritised actions with impact, effort, and module deep-links",
      "Executive View — AI Governance Summary cached 24h, open actions list",
      "Governance Trends™ — 90-day sparklines for 6 metrics with change percentages",
      "Continuous Monitoring™ — 7 automated alert rules with resolve workflow",
      "Trust Graph™ — force-directed knowledge graph with root cause and impact analysis",
      "Governance Copilot™ — multi-turn NL chat about your governance posture",
    ],
    tips: [
      "Run the daily governance snapshot cron job to maintain accurate 90-day trend charts.",
      "The Recommendations tab is the fastest way to identify the highest-value governance improvements.",
      "Bookmark Trust Intelligence → Executive View for board-ready reporting in seconds.",
    ],
    route: "/trust-intelligence",
  },

  "/benchmarking": {
    title: "Governance Benchmarking™",
    icon: "BarChart3",
    group: "Intelligence",
    overview:
      "Compare your governance posture against industry peers across 10 categories — percentile ranking, maturity level (Reactive → Trust Leader), and AI improvement planner.",
    features: [
      "10 benchmark categories: Org Trust, Vendor Trust, Risk, Controls, Audit, Compliance, Privacy, Contract, Issues, Workflow",
      "Percentile ranking against industry baselines (Technology, Financial Services, Healthcare, Manufacturing, Professional Services)",
      "Governance Maturity Level™ — 6-level ladder from Reactive to Trust Leader",
      "6-month trend sparklines per category",
      "Governance Rankings™ table with Top 1% to At Risk labels",
      "AI Benchmark Analyst™ — executive report, industry insights, improvement planner, NL chat",
      "REST API for external benchmark data consumption",
    ],
    tips: [
      "Run benchmarking after major governance improvements to see your percentile change.",
      "The Improvement Planner identifies the 3 categories where effort yields the greatest percentile gain.",
      "Use the Rankings page for board presentations — it communicates maturity level clearly.",
    ],
    route: "/benchmarking",
  },

  "/executive-reporting": {
    title: "Executive Reporting & Analytics™",
    icon: "LineChart",
    group: "Intelligence",
    overview:
      "Role-specific executive dashboards, board reporting, predictive forecasting, and governance scorecards — the boardroom layer of the AUDT Governance OS.",
    features: [
      "6 role dashboards: CEO, CRO, CISO, Compliance, Board, Custom",
      "10 live KPIs computed in parallel across all modules",
      "Board Reports™ — 8 pre-built types: governance, risk committee, audit, privacy, vendor, contract, executive, trust intelligence",
      "Scheduled Reports™ — weekly/monthly/quarterly automated delivery",
      "Predictive Analytics™ — AI forecasts at 30/90/180-day horizons",
      "Executive Scorecards™ — 6 domains with On Track / Monitor / Attention status",
      "AI Executive Analyst™ — summary, board report generator, trend analysis, NL chat",
    ],
    tips: [
      "Set up scheduled board reports so they auto-generate before every board meeting.",
      "The CEO dashboard surfaces the 5 most critical governance signals without requiring deep dives.",
      "Forecasts are AI-powered — regenerate monthly as your governance posture improves.",
    ],
    route: "/executive-reporting",
  },

  "/regulatory-intelligence": {
    title: "Regulatory Intelligence™",
    icon: "Scale",
    group: "Intelligence",
    overview:
      "Always-current regulatory tracking — monitor 18 built-in global regulations (DPDP, GDPR, RBI, SEBI, EU AI Act, DORA, NIS2, SOX, and more) plus custom org-specific regulations.",
    features: [
      "18 built-in regulations covering India, EU, US, and global frameworks",
      "Change Monitor™ — track regulatory amendments with severity and status workflow",
      "Obligations Registry™ — extract and track compliance obligations per regulation",
      "Impact Assessments™ — per-change impact analysis with affected areas",
      "Watchlists™ — curated regulation monitoring lists",
      "Compliance Horizon™ — AI 4-panel forecast: emerging risks, upcoming deadlines, global trends, recommended actions",
      "Regulatory Readiness Score™ — implemented + validated obligations as a percentage",
      "AI Regulatory Advisor™ — advisory summary, per-change analysis, obligation extraction, NL chat",
    ],
    tips: [
      "Add critical regulations to a Watchlist so amendments surface immediately in your monitoring feed.",
      "Run the Compliance Horizon quarterly — it anticipates regulatory changes 6-12 months ahead.",
      "Link obligations to AUDT controls via the obligation mappings to close the compliance loop.",
    ],
    route: "/regulatory-intelligence",
  },

  "/asset-intelligence": {
    title: "Asset Intelligence™",
    icon: "Layers",
    group: "Intelligence",
    overview:
      "Enterprise asset graph and trust mapping — master inventory connecting every governance entity (risks, controls, vendors, regulations) to the assets they protect.",
    features: [
      "12 asset types: application, database, API, server, cloud resource, data asset, business process, AI system, vendor service, network asset, endpoint, custom",
      "Asset Trust Score™ — 6-component engine: security controls, compliance coverage, risk posture, data protection, operational health, monitoring coverage",
      "Data Asset Catalog™ — PII tracking with DPDP regulation links and data classification",
      "Asset Relationships™ — dependency graph with 10 relationship types",
      "Asset Alerts™ — auto-generated alerts for critical assets missing owners, risk assessments, or classification",
      "AI Asset Advisor™ — advisory summary, impact analysis, dependency chain analysis, NL chat",
      "Junction links to risks, controls, vendors, contracts, regulations, and AI systems",
    ],
    tips: [
      "Start with your critical-tier assets — classify all production databases and customer-facing applications first.",
      "Use the dependency graph before a major change to understand blast radius.",
      "PII-tagged assets automatically surface in the DPDP Privacy™ Data Asset Catalog.",
    ],
    route: "/asset-intelligence",
  },

  "/security-center": {
    title: "Security Command Center™",
    icon: "ShieldAlert",
    group: "Security",
    overview:
      "Enterprise security platform — MFA enforcement, SSO, session management, IP allow lists, evidence protection, AI prompt auditing, customer managed encryption, and vendor monitoring.",
    features: [
      "MFA Management™ — TOTP enrollment tracking with per-org enforcement modes (optional / required_admins / required_all)",
      "Enterprise SSO™ — Entra ID, Okta, Google Workspace, Ping Identity, SAML 2.0, OIDC with JIT provisioning",
      "Session Management™ — active sessions per org with revoke individual or all sessions",
      "IP Allow Lists™ — CIDR-based rules scoped to login, API, compliance, and vendor resources",
      "Evidence Protection™ — expiring share links with view-only/download/API access and watermarking",
      "AI Prompt Logs™ — audit trail with PII detection and sensitivity classification",
      "Customer Managed Encryption™ — AWS KMS, Azure Key Vault, Google KMS provider registry",
      "Public Trust Center™ — configurable per-org trust page showing certs, score, and documents",
      "Continuous Vendor Monitoring™ — domain, SSL, and reputation monitoring with alert lifecycle",
    ],
    tips: [
      "Enable MFA required_all mode for regulated industries — Banking, Fintech, and Healthcare require it.",
      "Configure IP allow lists for API access to lock down your REST API endpoints to known CIDRs.",
      "Review the AI Prompt Log weekly to detect sensitive data leakage in Copilot interactions.",
    ],
    route: "/security-center",
  },

  "/continuous-compliance": {
    title: "Continuous Compliance™",
    icon: "Cpu",
    group: "Security",
    overview:
      "Always-on compliance automation — 21 prebuilt checks across AWS, Azure, GCP, GitHub, M365, Google Workspace, and Okta, with evidence automation, access reviews, and training campaigns.",
    features: [
      "21 prebuilt compliance checks covering MFA, encryption, audit logs, branch protection, DLP, and more",
      "Evidence Automation™ — check runs generate and link evidence to controls automatically",
      "Control Validation Engine™ — continuous effectiveness validation from check results",
      "Access Review Manager™ — quarterly and privileged access certifications with approve/revoke decisions",
      "Compliance Attestations™ — policy sign-offs with completion percentage tracking",
      "Training Compliance™ — security awareness and privacy training campaigns",
      "Compliance Health™ — 5-component 0-100 score: check success, signal reduction, evidence, training, access reviews",
      "AI Compliance Officer™ — executive summary, per-check remediation guides, NL chat",
    ],
    tips: [
      "Connect the Integration Hub™ before running checks — connected systems produce real check results instead of simulated ones.",
      "Set up quarterly access reviews for privileged accounts as a baseline DPDP and ISO 27001 control.",
      "The Compliance Health score factors into the Org Trust Score™ — improving check pass rate directly lifts the overall score.",
    ],
    route: "/continuous-compliance",
  },

  "/trust-exchange": {
    title: "Third-Party Risk Exchange™",
    icon: "Globe",
    group: "Trust Network",
    overview:
      "Trust profile marketplace — publish your governance posture, exchange evidence documents, issue trust badges, and answer questionnaires once to share with multiple requestors.",
    features: [
      "Trust Profile™ — public-facing governance passport with visibility controls",
      "Evidence Exchange™ — share documents with configurable visibility (private/specific/network/public)",
      "Trust Badges™ — 8 badge types plus custom; issue and revoke with lifecycle tracking",
      "Questionnaire Exchange™ — fill once, share many with completion percentage tracking",
      "Vendor Trust Directory™ — searchable directory of published profiles",
      "AI Trust Analyst™ — trust summary, document risk analysis, questionnaire suggestions, NL chat",
      "Profile completeness scoring to maximise directory visibility",
    ],
    tips: [
      "Complete your Trust Profile to 100% before requesting Trust Verification Authority™ certification — it boosts readiness score.",
      "Use the Questionnaire Exchange to avoid filling the same security questionnaire for every customer.",
      "Documents with verified status (AI or peer reviewed) carry more weight in the directory ranking.",
    ],
    route: "/trust-exchange",
  },

  "/trust-network": {
    title: "Trust Network™",
    icon: "Network",
    group: "Trust Network",
    overview:
      "Public trust infrastructure layer — aggregates Trust Exchange, Benchmarking, Integration Hub, Trust Intelligence, and Trust Graph into a unified external governance presence.",
    features: [
      "Trust Network Reputation™ — 5-component 0-100 score: profile quality, benchmark percentile, automation coverage, org trust score, network activity",
      "Governance Maturity™ — 6-level ladder powered by Benchmarking™",
      "Industry Ranking™ — percentile bar with Top Quartile badge",
      "Automation Transparency™ — evidence automation %, monitoring coverage %, connected systems",
      "Trust Relationships™ — org-to-org relationship registry with type and status",
      "Trust Activity Feed™ — timeline of all trust network events",
      "Network Follow Graph — follow/unfollow orgs with follower and following counts",
      "AI Trust Network Advisor™ — executive summary, Network Improvement Plan™, NL chat",
    ],
    tips: [
      "Improving Integration Hub™ connectivity directly boosts Automation Transparency™ in your network score.",
      "Follow peer organisations in your industry to benchmark activity patterns.",
      "The Network Improvement Plan identifies the 4 highest-impact actions to climb the maturity ladder.",
    ],
    route: "/trust-network",
  },

  "/trust-verification": {
    title: "Trust Verification Authority™",
    icon: "BadgeCheck",
    group: "Trust Network",
    overview:
      "AUDT becomes a Trust Authority — verify, certify, publish, and revoke governance credentials with a public verify page, 10 built-in programs, and SHA-256 certificate hashes.",
    features: [
      "10 built-in verification programs: AUDT Verified™, Trusted Vendor™, Privacy Ready™, AI Governed™, Risk Managed™, Enterprise Ready™, Audit Ready™, Compliance Ready™, DPDP Ready™, ISO Ready™",
      "9-step verification workflow from application to published certificate",
      "Trust Certificates™ — auto-issued on approval with cert number AUDT-YYYY-XXXXXX and SHA-256 hash",
      "Public /verify/[id] page — no auth required, shows Valid or Revoked/Expired",
      "Readiness Score™ — 7-component pure engine before applying",
      "Continuous monitoring with 7 auto-suspension rules",
      "Renewal Management™ — auto-scheduled renewals with due-soon alerts",
      "AI Verification Advisor™ — platform summary, eligibility analysis, NL chat",
    ],
    tips: [
      "Check your Readiness Score before applying — the system tells you exactly which components need improvement.",
      "Share your public /verify/[id] URL on vendor onboarding forms and RFP responses as proof of governance.",
      "Certificate renewals are auto-scheduled — set a calendar reminder 30 days before expiry as a backup.",
    ],
    route: "/trust-verification",
  },

  "/trust-api": {
    title: "Trust API Platform™",
    icon: "Zap",
    group: "Trust Network",
    overview:
      "Transform AUDT into trust infrastructure — 8 API products, webhooks, developer portal, usage analytics, and AI API builder for external system integration.",
    features: [
      "8 API products: trust-score, vendor-trust, ai-trust, benchmarking, verification, trust-network, governance-insights, compliance-readiness",
      "API Client Registry™ with plan tiers: Free (100/day), Growth (10k/month), Business (100k/month), Enterprise (unlimited)",
      "API Key Manager™ — issue tap_-prefixed keys with bcrypt storage, reveal-once, per-key permissions",
      "Webhook Engine™ — subscribe to 9 trust events with live HTTP delivery and delivery log",
      "API Analytics™ — 30-day daily call volume, top endpoints, success rate",
      "AI API Builder™ — Gemini generates per-product docs, code samples, and integration guides",
      "Developer Portal™ — quickstart, cURL and SDK samples, partner integrations",
      "6 public Bearer-authenticated endpoints for external consumption",
    ],
    tips: [
      "Use webhooks to push real-time trust score changes to your CRM or vendor portal.",
      "The AI API Builder generates working cURL examples — paste them directly into Postman for testing.",
      "Partner integrations (procurement portals, vendor onboarding tools) should use the verification endpoint for proof-of-governance checks.",
    ],
    route: "/trust-api",
  },

  "/auditor-collaboration": {
    title: "Auditor Collaboration™",
    icon: "Users2",
    group: "Trust Network",
    overview:
      "Secure external auditor engagement platform — audit rooms, evidence exchange, external findings, assessment projects, and AI audit readiness analysis for ISO, SOC 2, DPDP, and AI governance audits.",
    features: [
      "Audit Room™ — scoped workspace per engagement with room-level RBAC",
      "Evidence Exchange™ — auditors request evidence; internal team submits, accepts, or rejects",
      "External Findings™ — non-conformances, recommendations, and opportunities from auditors",
      "Assessment Projects™ — track milestones, completion %, open findings, and pending evidence",
      "External User Registry™ — invite ISO auditors, SOC auditors, DPDP assessors, legal counsel",
      "Auditor Organisation Registry™ — audit firms, law firms, and consulting partners",
      "Room Documents™ — share AUDT-generated PDFs and CSVs directly into audit rooms",
      "AI Audit Advisor™ — readiness summary, evidence gap analysis, finding drafter, NL chat",
    ],
    tips: [
      "Create a separate audit room per engagement — it keeps evidence requests and findings cleanly scoped.",
      "Run the AI evidence gap analysis before an audit — it identifies the top 5 missing evidence items.",
      "Give auditors viewer-only access to specific rooms rather than your full AUDT instance.",
    ],
    route: "/auditor-collaboration",
  },

  "/integration-hub": {
    title: "Integration Hub™",
    icon: "Plug",
    group: "Trust Network",
    overview:
      "Connected governance platform — 35+ connectors across identity, cloud, security, source control, ITSM, and communication tools, with sync engine, webhook routing, and AI health advisor.",
    features: [
      "35+ connectors: Entra ID, Okta, Google Workspace, AWS, GitHub, Jira, Slack, CrowdStrike, Microsoft Defender, and more",
      "Connector Marketplace™ — 11 categories including Identity, Cloud, Security, Source Control, Project Management, ITSM",
      "Sync Engine™ — incremental and full syncs with simulated results, history, and success metrics",
      "Evidence Collection™ — auto-collect governance evidence (MFA, encryption, branch protection) from connected systems",
      "Continuous Monitoring™ — governance events from syncs: risks, control failures, misconfigurations",
      "Connection Health™ — per-integration dashboard with records synced, evidence collected, risks generated",
      "Webhook Engine™ — inbound and outbound webhooks with event type routing",
      "AI Integration Advisor™ — health summary, connector recommendations, coverage gap analysis, NL chat",
    ],
    tips: [
      "Connect your identity provider first (Entra ID or Okta) — it feeds MFA compliance checks in Continuous Compliance™.",
      "After each sync, review the governance events generated — they surface risks and control failures automatically.",
      "Use the Coverage Gap Analysis to see which governance areas have no connected data source.",
    ],
    route: "/integration-hub",
  },

  "/agents": {
    title: "Governance Agent Framework™",
    icon: "Bot",
    group: "AI & Agents",
    overview:
      "AI agents that continuously monitor, reason, and propose actions across your entire governance posture — observations, recommendations, and human-approved action queue.",
    features: [
      "6 agent types: Risk Monitor, Vendor Watch, Compliance Guardian, Policy Enforcer, Audit Prep, Custom",
      "Agent Studio™ — create and configure custom governance agents with module scope, rules, and thresholds",
      "Agent Runs™ — full execution history with duration, observations generated, and recommendations created",
      "Observations™ — governance signals with severity (critical/high/medium/low/info) and source module",
      "Recommendations™ — prioritised actions with confidence 0-100 and impact/effort labels",
      "Agent Actions™ — human approval queue: all agent mutations require explicit Approve or Reject",
      "Orchestration™ — multi-agent governance pipelines with sequenced runs",
      "Governance Copilot™ — multi-turn NL chat about your governance posture",
    ],
    tips: [
      "Start with the built-in Compliance Guardian agent — it covers the most common governance gaps out of the box.",
      "All agent actions require human approval — review the Actions queue daily to avoid bottlenecks.",
      "Use Orchestration to chain agents: Risk Monitor → Vendor Watch → Compliance Guardian for end-to-end coverage.",
    ],
    route: "/agents",
  },

  "/ai-governance": {
    title: "AI Governance™",
    icon: "Brain",
    group: "AI & Agents",
    overview:
      "Responsible AI governance — manage AI systems, risks, controls, vendors, compliance frameworks (ISO 42001, EU AI Act, NIST AI RMF), and incidents with an AI Trust Score™ per system.",
    features: [
      "AI System Inventory™ — registry of all AI systems with type, vendor, risk classification, and deployment environment",
      "AI Trust Score™ — 6-component engine: risk (25%), controls (25%), compliance (20%), monitoring (15%), vendor (10%), incidents (5%)",
      "AI Risk Register™ — 13 risk categories: hallucination, bias, privacy leakage, prompt injection, model drift, and more",
      "AI Controls™ — 11 control categories: human oversight, output review, prompt logging, model approval, red team testing",
      "AI Compliance™ — 6 frameworks: ISO 42001, NIST AI RMF, EU AI Act, OECD AI Principles, DPDP AI, Internal",
      "AI Incident Tracker™ — full incident lifecycle from open to resolved with root cause and remediation",
      "AI Vendor Cards™ — vendor registry with privacy and security posture indicators",
      "AI Governance Copilot™ — summary, risk advisory, compliance readiness analysis, multi-turn NL chat",
    ],
    tips: [
      "Register every AI system in use — shadow AI is the biggest gap in most organisations' AI governance posture.",
      "Map AI controls to your ISO 42001 framework in the Compliance tab to track readiness automatically.",
      "The EU AI Act requires a risk classification for every AI system — complete this before the compliance deadline.",
    ],
    route: "/ai-governance",
  },
};
