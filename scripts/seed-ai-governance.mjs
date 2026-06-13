/**
 * Seed script — AI Governance™ module
 * Seeds: 8 AI systems, 5 AI vendors, 10 AI risks, 6 AI controls,
 *        4 AI policies, 3 AI assessments, 4 AI incidents, 6 AI compliance records
 *
 * Usage: node scripts/seed-ai-governance.mjs [orgId]
 *        node scripts/seed-ai-governance.mjs --list
 */

import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

import { randomUUID } from "crypto";

async function listOrgs() {
  const rows = await sql`SELECT id, name FROM organizations ORDER BY created_at LIMIT 20`;
  console.log("Organizations:");
  rows.forEach((r) => console.log(`  ${r.id}  ${r.name}`));
}

// ── Seed ──────────────────────────────────────────────────────────────────────

async function seed(orgId) {
  console.log(`\nSeeding AI Governance™ for org: ${orgId}\n`);

  const [org] = await sql`SELECT id, name FROM organizations WHERE id = ${orgId} LIMIT 1`;
  if (!org) { console.error("Org not found"); process.exit(1); }
  console.log(`  Org: ${org.name}`);

  const profiles = await sql`
    SELECT id FROM profiles
    WHERE id IN (SELECT user_id FROM memberships WHERE organization_id = ${orgId} AND role = 'owner')
    LIMIT 1
  `;
  const actorId = profiles[0]?.id ?? null;

  const counts = {};

  // ── 1. AI Systems ─────────────────────────────────────────────────────────

  const aiSystems = [
    {
      name: "ChatGPT",
      description: "OpenAI large language model used for customer service interactions and support ticket summarisation.",
      provider: "OpenAI",
      vendor_type: "commercial",
      model_type: "llm",
      use_case: "customer_service",
      deployment_env: "cloud",
      status: "approved",
      approval_status: "approved",
      trust_score: 78,
      risk_level: "medium",
      data_sensitivity: "medium",
      personal_data: true,
      training_data_reviewed: true,
      human_oversight: true,
      output_review: true,
      documentation_complete: true,
      version: "GPT-4o",
      department: "Customer Success",
    },
    {
      name: "GitHub Copilot",
      description: "AI pair programmer by Microsoft/GitHub. Assists developers with code completion, generation and review.",
      provider: "Microsoft",
      vendor_type: "commercial",
      model_type: "llm",
      use_case: "software_development",
      deployment_env: "cloud",
      status: "approved",
      approval_status: "approved",
      trust_score: 82,
      risk_level: "low",
      data_sensitivity: "high",
      personal_data: false,
      training_data_reviewed: true,
      human_oversight: true,
      output_review: true,
      documentation_complete: true,
      version: "Copilot Business",
      department: "Engineering",
    },
    {
      name: "Gemini",
      description: "Google Gemini multimodal model used for marketing copy generation and campaign analysis.",
      provider: "Google",
      vendor_type: "commercial",
      model_type: "llm",
      use_case: "marketing",
      deployment_env: "cloud",
      status: "approved",
      approval_status: "approved",
      trust_score: 71,
      risk_level: "medium",
      data_sensitivity: "low",
      personal_data: false,
      training_data_reviewed: true,
      human_oversight: true,
      output_review: false,
      documentation_complete: true,
      version: "Gemini 2.5 Flash",
      department: "Marketing",
    },
    {
      name: "Internal Support Bot",
      description: "Internally built LLM-powered agent for first-line IT and HR support. Deployed on internal infrastructure.",
      provider: null,
      vendor_type: "internal",
      model_type: "agent",
      use_case: "customer_service",
      deployment_env: "on_premise",
      status: "approved",
      approval_status: "approved",
      trust_score: 65,
      risk_level: "medium",
      data_sensitivity: "high",
      personal_data: true,
      training_data_reviewed: false,
      human_oversight: true,
      output_review: true,
      documentation_complete: false,
      version: "v1.2",
      department: "IT",
    },
    {
      name: "Cursor",
      description: "AI-powered code editor used by the engineering team for accelerated development. Under security review.",
      provider: "Anysphere",
      vendor_type: "commercial",
      model_type: "llm",
      use_case: "software_development",
      deployment_env: "local",
      status: "under_review",
      approval_status: "pending",
      trust_score: null,
      risk_level: "medium",
      data_sensitivity: "high",
      personal_data: false,
      training_data_reviewed: false,
      human_oversight: true,
      output_review: false,
      documentation_complete: false,
      version: "0.43",
      department: "Engineering",
    },
    {
      name: "AWS Bedrock RAG",
      description: "Retrieval-augmented generation pipeline on AWS Bedrock. Answers operational queries from internal knowledge base.",
      provider: "Amazon Web Services",
      vendor_type: "commercial",
      model_type: "rag",
      use_case: "operations",
      deployment_env: "cloud",
      status: "approved",
      approval_status: "approved",
      trust_score: 69,
      risk_level: "medium",
      data_sensitivity: "medium",
      personal_data: false,
      training_data_reviewed: true,
      human_oversight: true,
      output_review: true,
      documentation_complete: true,
      version: "Titan Text G1",
      department: "Operations",
    },
    {
      name: "Internal Risk Analyzer",
      description: "Internal LLM application that analyses financial transaction patterns to flag anomalies and risk signals.",
      provider: null,
      vendor_type: "internal",
      model_type: "llm_app",
      use_case: "finance",
      deployment_env: "on_premise",
      status: "pending_approval",
      approval_status: "pending",
      trust_score: null,
      risk_level: "high",
      data_sensitivity: "high",
      personal_data: true,
      training_data_reviewed: false,
      human_oversight: false,
      output_review: false,
      documentation_complete: false,
      version: "v0.1 beta",
      department: "Finance",
    },
    {
      name: "Vendor Screening Agent",
      description: "Autonomous agent under development that screens new vendors against risk criteria and compliance requirements.",
      provider: null,
      vendor_type: "internal",
      model_type: "agent",
      use_case: "operations",
      deployment_env: "cloud",
      status: "pending_approval",
      approval_status: "pending",
      trust_score: null,
      risk_level: "high",
      data_sensitivity: "medium",
      personal_data: false,
      training_data_reviewed: false,
      human_oversight: false,
      output_review: false,
      documentation_complete: false,
      version: "alpha",
      department: "Procurement",
    },
  ];

  let systemCount = 0;
  const systemIds = {};
  for (const s of aiSystems) {
    const existing = await sql`
      SELECT id FROM ai_systems
      WHERE organization_id = ${orgId} AND name = ${s.name}
      LIMIT 1
    `;
    let id;
    if (existing.length > 0) {
      id = existing[0].id;
    } else {
      id = randomUUID();
      const depEnv = s.deployment_env === 'on_premise' || s.deployment_env === 'local' ? 'production'
        : s.deployment_env === 'cloud' ? 'production'
        : s.deployment_env === 'staging' ? 'staging'
        : s.deployment_env === 'development' ? 'development'
        : s.deployment_env === 'research' ? 'research'
        : null;
      await sql`
        INSERT INTO ai_systems (
          id, organization_id, name, description, system_type, vendor_name,
          use_case, deployment_environment, approval_status, risk_classification,
          version, created_by, created_at, updated_at
        ) VALUES (
          ${id}, ${orgId}, ${s.name}, ${s.description},
          ${s.vendor_type ?? s.system_type ?? 'commercial'},
          ${s.provider ?? null},
          ${s.use_case ?? null}, ${depEnv},
          ${s.approval_status ?? 'approved'}, ${s.risk_level === 'medium' ? 'moderate' : (s.risk_level ?? 'moderate')},
          ${s.version ?? null}, ${actorId}, NOW(), NOW()
        )
        ON CONFLICT DO NOTHING
      `;
      systemCount++;
    }
    systemIds[s.name] = id;
  }
  counts.ai_systems = systemCount;
  console.log(`  ✓ Seeded ${systemCount} AI systems (${aiSystems.length - systemCount} already existed)`);

  // ── 2. AI Vendors ─────────────────────────────────────────────────────────

  const aiVendors = [
    {
      name: "OpenAI",
      website: "https://openai.com",
      country: "United States",
      risk_rating: "high",
      privacy_posture: "strong",
      security_posture: "strong",
      contract_status: "active",
      assessment_status: "assessed",
      trust_score: 78,
      data_processing_agreement: true,
      subprocessors_disclosed: true,
      breach_notification_sla: "72_hours",
      model_cards_provided: true,
      bias_testing_done: true,
      explainability_docs: true,
      category: "Foundation Model Provider",
      notes: "Primary LLM provider. DPA signed. OpenAI Enterprise tier.",
    },
    {
      name: "Microsoft (Azure AI)",
      website: "https://azure.microsoft.com/en-in/products/ai-services",
      country: "United States",
      risk_rating: "moderate",
      privacy_posture: "strong",
      security_posture: "strong",
      contract_status: "active",
      assessment_status: "assessed",
      trust_score: 82,
      data_processing_agreement: true,
      subprocessors_disclosed: true,
      breach_notification_sla: "72_hours",
      model_cards_provided: true,
      bias_testing_done: true,
      explainability_docs: true,
      category: "Cloud AI Platform",
      notes: "GitHub Copilot Business + Azure OpenAI Service. Microsoft enterprise agreement in place.",
    },
    {
      name: "Google (Vertex AI)",
      website: "https://cloud.google.com/vertex-ai",
      country: "United States",
      risk_rating: "moderate",
      privacy_posture: "strong",
      security_posture: "adequate",
      contract_status: "active",
      assessment_status: "assessed",
      trust_score: 71,
      data_processing_agreement: true,
      subprocessors_disclosed: true,
      breach_notification_sla: "72_hours",
      model_cards_provided: true,
      bias_testing_done: false,
      explainability_docs: true,
      category: "Cloud AI Platform",
      notes: "Gemini API + Vertex AI platform. Google Cloud DPA applied.",
    },
    {
      name: "Anthropic",
      website: "https://anthropic.com",
      country: "United States",
      risk_rating: "low",
      privacy_posture: "strong",
      security_posture: "strong",
      contract_status: "active",
      assessment_status: "assessed",
      trust_score: 90,
      data_processing_agreement: true,
      subprocessors_disclosed: true,
      breach_notification_sla: "24_hours",
      model_cards_provided: true,
      bias_testing_done: true,
      explainability_docs: true,
      category: "Foundation Model Provider",
      notes: "Claude API for internal tooling. Constitutional AI approach considered best-in-class for safety.",
    },
    {
      name: "Meta (Llama / PyTorch Hub)",
      website: "https://ai.meta.com",
      country: "United States",
      risk_rating: "high",
      privacy_posture: "weak",
      security_posture: "adequate",
      contract_status: "none",
      assessment_status: "pending",
      trust_score: 45,
      data_processing_agreement: false,
      subprocessors_disclosed: false,
      breach_notification_sla: null,
      model_cards_provided: true,
      bias_testing_done: false,
      explainability_docs: false,
      category: "Open Source Model Provider",
      notes: "Llama 3 models being evaluated for on-premise deployment. No DPA in place — high risk flag.",
    },
  ];

  let vendorCount = 0;
  const vendorIds = {};
  for (const v of aiVendors) {
    const existing = await sql`
      SELECT id FROM ai_vendors
      WHERE organization_id = ${orgId} AND name = ${v.name}
      LIMIT 1
    `;
    let id;
    if (existing.length > 0) {
      id = existing[0].id;
    } else {
      id = randomUUID();
      await sql`
        INSERT INTO ai_vendors (
          id, organization_id, name, website, risk_rating, privacy_posture,
          security_posture, contract_status, assessment_status, trust_score,
          notes, created_by, created_at, updated_at
        ) VALUES (
          ${id}, ${orgId}, ${v.name}, ${v.website ?? null},
          ${v.risk_rating ?? 'moderate'}, ${v.privacy_posture ?? null},
          ${v.security_posture ?? null}, ${v.contract_status ?? null},
          ${v.assessment_status ?? null}, ${v.trust_score ?? null},
          ${v.notes ?? null}, ${actorId}, NOW(), NOW()
        )
        ON CONFLICT DO NOTHING
      `;
      vendorCount++;
    }
    vendorIds[v.name] = id;
  }
  counts.ai_vendors = vendorCount;
  console.log(`  ✓ Seeded ${vendorCount} AI vendors (${aiVendors.length - vendorCount} already existed)`);

  // ── 3. AI Risks ───────────────────────────────────────────────────────────

  const aiRisks = [
    {
      title: "Hallucination in Customer-Facing Responses",
      description: "ChatGPT may generate plausible but factually incorrect information in customer support interactions, leading to misinformation and potential liability.",
      risk_type: "hallucination",
      severity: "high",
      likelihood: "likely",
      impact: "high",
      status: "open",
      affected_system: "ChatGPT",
      mitigation: "Implement RAG grounding for all customer-facing responses. Require human review for claims involving policy, pricing, or legal matters.",
      owner_department: "Customer Success",
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    },
    {
      title: "Bias in Automated Hiring Recommendations",
      description: "AI screening tools may exhibit demographic bias based on training data, leading to discriminatory shortlisting outcomes and potential legal exposure under DPDP and equal opportunity laws.",
      risk_type: "bias",
      severity: "critical",
      likelihood: "possible",
      impact: "critical",
      status: "open",
      affected_system: "Internal Risk Analyzer",
      mitigation: "Conduct bias audit using diverse test datasets. Mandate human decision-making for all hiring outcomes. Disable automated recommendations until audit complete.",
      owner_department: "HR",
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    },
    {
      title: "Personal Data Leakage via LLM Prompts",
      description: "Employees may inadvertently include PII or sensitive business data in prompts sent to third-party LLM APIs, violating DPDP Act data minimisation obligations.",
      risk_type: "privacy_leakage",
      severity: "high",
      likelihood: "likely",
      impact: "high",
      status: "open",
      affected_system: "ChatGPT",
      mitigation: "Deploy prompt scanning layer to detect and redact PII before API calls. Update Acceptable Use Policy. Conduct employee awareness training.",
      owner_department: "Data Privacy",
      due_date: new Date(Date.now() + 21 * 86400000).toISOString().split("T")[0],
    },
    {
      title: "Prompt Injection Attack on Internal Agent",
      description: "The Internal Support Bot is vulnerable to adversarial prompt injection via user-controlled inputs, potentially allowing privilege escalation or data exfiltration.",
      risk_type: "prompt_injection",
      severity: "critical",
      likelihood: "possible",
      impact: "critical",
      status: "mitigating",
      affected_system: "Internal Support Bot",
      mitigation: "Implement input sanitisation and output filtering. Adopt system prompt hardening. Restrict agent tool permissions to least privilege. Add anomaly detection on agent actions.",
      owner_department: "Security",
      due_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    },
    {
      title: "EU AI Act High-Risk Classification Exposure",
      description: "The Internal Risk Analyzer may qualify as a high-risk AI system under EU AI Act Annex III (employment/credit decisions). Non-compliance could result in fines up to 3% global turnover.",
      risk_type: "regulatory_risk",
      severity: "high",
      likelihood: "likely",
      impact: "high",
      status: "open",
      affected_system: "Internal Risk Analyzer",
      mitigation: "Engage legal counsel to classify system under EU AI Act. Prepare conformity assessment documentation. Halt production deployment until classification confirmed.",
      owner_department: "Compliance",
      due_date: new Date(Date.now() + 45 * 86400000).toISOString().split("T")[0],
    },
    {
      title: "Model Drift in Fraud Detection Output",
      description: "Production model serving the financial risk pipeline may exhibit distributional drift over time, causing degraded precision and increased false negatives in fraud detection.",
      risk_type: "model_performance",
      severity: "medium",
      likelihood: "possible",
      impact: "medium",
      status: "open",
      affected_system: "Internal Risk Analyzer",
      mitigation: "Implement automated performance monitoring with alerting on key metrics. Schedule quarterly model revalidation. Define performance SLA thresholds.",
      owner_department: "Finance",
      due_date: new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0],
    },
    {
      title: "Vendor Lock-In — OpenAI API Dependency",
      description: "Heavy reliance on OpenAI's proprietary API creates concentration risk. API policy changes, pricing increases, or service discontinuity could disrupt customer-facing operations.",
      risk_type: "vendor_dependency",
      severity: "medium",
      likelihood: "possible",
      impact: "medium",
      status: "accepted",
      affected_system: "ChatGPT",
      mitigation: "Maintain abstraction layer allowing model swap. Evaluate Anthropic and Google as fallback providers. Document migration runbook.",
      owner_department: "Engineering",
      due_date: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
    },
    {
      title: "Lack of AI Model Documentation for Audit Trail",
      description: "Several deployed models lack adequate model cards, training data documentation, and decision logs, making it impossible to reconstruct AI decisions for regulatory audit.",
      risk_type: "governance_gap",
      severity: "medium",
      likelihood: "very_likely",
      impact: "medium",
      status: "open",
      affected_system: "Internal Support Bot",
      mitigation: "Mandate model cards for all production AI systems. Implement decision logging. Add documentation completeness check to AI procurement checklist.",
      owner_department: "Governance",
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    },
    {
      title: "Unapproved AI Tool Adoption (Shadow AI)",
      description: "Employees are using unapproved AI tools (e.g., Cursor, consumer ChatGPT) for business tasks, creating uncontrolled data exposure and compliance gaps outside the approved AI inventory.",
      risk_type: "governance_gap",
      severity: "high",
      likelihood: "very_likely",
      impact: "medium",
      status: "open",
      affected_system: null,
      mitigation: "Deploy network-level monitoring for AI tool usage. Issue Shadow AI policy. Implement lightweight AI tool approval fast-track process.",
      owner_department: "IT",
      due_date: new Date(Date.now() + 21 * 86400000).toISOString().split("T")[0],
    },
    {
      title: "DPDP Act Consent Gaps for AI-Processed Personal Data",
      description: "AI systems processing personal data of Indian residents (customers, employees) may lack valid consent records under the Digital Personal Data Protection Act 2023.",
      risk_type: "regulatory_risk",
      severity: "high",
      likelihood: "likely",
      impact: "high",
      status: "open",
      affected_system: "Internal Support Bot",
      mitigation: "Audit all AI systems for personal data processing. Map consent collection points. Update privacy notices. Implement consent management module.",
      owner_department: "Data Privacy",
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    },
  ];

  let riskCount = 0;
  for (const r of aiRisks) {
    const existing = await sql`
      SELECT id FROM ai_risks
      WHERE organization_id = ${orgId} AND title = ${r.title}
      LIMIT 1
    `;
    if (existing.length === 0) {
      const systemId = r.affected_system ? (systemIds[r.affected_system] ?? null) : null;
      const riskCategory = r.risk_type === 'hallucination' ? 'hallucination'
        : r.risk_type === 'regulatory_risk' ? 'regulatory_risk'
        : r.risk_type === 'bias_fairness' ? 'bias'
        : r.risk_type === 'data_privacy' ? 'privacy_leakage'
        : r.risk_type === 'governance_gap' ? 'other'
        : 'other';
      const riskLevel = r.severity === 'critical' ? 'critical'
        : r.severity === 'high' ? 'high'
        : r.severity === 'medium' ? 'moderate' : 'low';
      const likelihood = r.likelihood === 'very_likely' ? 5
        : r.likelihood === 'likely' ? 4
        : r.likelihood === 'possible' ? 3 : 2;
      const impact = r.impact === 'high' ? 4 : r.impact === 'medium' ? 3 : 2;
      await sql`
        INSERT INTO ai_risks (
          id, organization_id, ai_system_id, title, description, risk_category,
          likelihood, impact, risk_level, status, treatment,
          target_date, created_by, created_at, updated_at
        ) VALUES (
          ${randomUUID()}, ${orgId}, ${systemId}, ${r.title}, ${r.description},
          ${riskCategory}, ${likelihood}, ${impact}, ${riskLevel},
          ${r.status ?? 'open'}, ${r.mitigation ?? null},
          ${r.due_date ?? null}, ${actorId}, NOW(), NOW()
        )
        ON CONFLICT DO NOTHING
      `;
      riskCount++;
    }
  }
  counts.ai_risks = riskCount;
  console.log(`  ✓ Seeded ${riskCount} AI risks (${aiRisks.length - riskCount} already existed)`);

  // ── 4. AI Controls ────────────────────────────────────────────────────────

  const aiControls = [
    {
      name: "Human Oversight for High-Stakes AI Decisions",
      description: "All AI-generated decisions with material impact on individuals (credit, hiring, clinical, legal) must be reviewed and approved by a qualified human before action is taken.",
      control_type: "process",
      category: "accountability",
      status: "implemented",
      effectiveness: "effective",
      frequency: "continuous",
      owner_department: "Governance",
      evidence: "Documented in AI Acceptable Use Policy v2.1. Verified via audit sample Q1 2026.",
    },
    {
      name: "AI Output Quality Review Process",
      description: "Periodic sampling and review of AI-generated outputs for accuracy, bias indicators, and policy compliance. Quarterly review for high-risk systems; monthly for critical systems.",
      control_type: "process",
      category: "quality",
      status: "implemented",
      effectiveness: "partially_effective",
      frequency: "monthly",
      owner_department: "Quality",
      evidence: "Review reports available for ChatGPT (Feb–May 2026). AWS Bedrock RAG review pending.",
    },
    {
      name: "Prompt and Interaction Logging",
      description: "All AI system interactions (prompts and outputs) are logged with retention for 90 days for audit, incident investigation, and compliance purposes. Logs must be tamper-evident.",
      control_type: "technical",
      category: "auditability",
      status: "partially_implemented",
      effectiveness: "partially_effective",
      frequency: "continuous",
      owner_department: "IT",
      evidence: "Implemented for ChatGPT and AWS Bedrock. Internal Support Bot logging not yet enabled.",
    },
    {
      name: "AI System Procurement Approval Gate",
      description: "All new AI systems must pass a structured approval process including risk assessment, DPA review, vendor assessment, and sign-off from CISO and DPO before production use.",
      control_type: "process",
      category: "procurement",
      status: "implemented",
      effectiveness: "effective",
      frequency: "ad_hoc",
      owner_department: "Procurement",
      evidence: "AI Procurement Checklist v1.3. Approval records for ChatGPT, Copilot, Gemini, AWS Bedrock.",
    },
    {
      name: "Content and Output Filtering",
      description: "Automated content filters applied to AI outputs to prevent generation or display of harmful, discriminatory, or legally sensitive content. Filters reviewed and updated quarterly.",
      control_type: "technical",
      category: "safety",
      status: "partially_implemented",
      effectiveness: "partially_effective",
      frequency: "continuous",
      owner_department: "Engineering",
      evidence: "Filters active on ChatGPT (via OpenAI Moderation API). Not yet deployed on Internal Support Bot.",
    },
    {
      name: "Annual AI Vendor Security Review",
      description: "All AI vendors processing personal or business-sensitive data must undergo annual security assessment covering SOC 2, penetration testing recency, incident history, and subprocessor disclosure.",
      control_type: "process",
      category: "vendor_management",
      status: "planned",
      effectiveness: null,
      frequency: "annual",
      owner_department: "Security",
      evidence: "Review schedule established Q2 2026. First cycle due Q3 2026.",
    },
  ];

  let controlCount = 0;
  const controlIds = {};
  for (const c of aiControls) {
    const existing = await sql`
      SELECT id FROM ai_controls
      WHERE organization_id = ${orgId} AND name = ${c.name}
      LIMIT 1
    `;
    let id;
    if (existing.length > 0) {
      id = existing[0].id;
    } else {
      id = randomUUID();
      const controlCategory = c.category === 'oversight' ? 'human_oversight'
        : c.category === 'output_review' ? 'output_review'
        : c.category === 'logging' ? 'prompt_logging'
        : c.category === 'approval' ? 'model_approval'
        : c.category === 'data' ? 'data_classification'
        : c.category === 'access' ? 'access_control'
        : c.category === 'vendor' ? 'vendor_review'
        : c.category === 'monitoring' ? 'model_monitoring'
        : c.category === 'content' ? 'content_filtering'
        : c.category === 'red_team' ? 'red_team_testing'
        : 'other';
      await sql`
        INSERT INTO ai_controls (
          id, organization_id, name, description, control_category,
          status, effectiveness, notes,
          created_by, created_at, updated_at
        ) VALUES (
          ${id}, ${orgId}, ${c.name}, ${c.description}, ${controlCategory},
          ${c.status ?? 'planned'}, ${c.effectiveness ?? null}, ${c.evidence ?? null},
          ${actorId}, NOW(), NOW()
        )
        ON CONFLICT DO NOTHING
      `;
      controlCount++;
    }
    controlIds[c.name] = id;
  }
  counts.ai_controls = controlCount;
  console.log(`  ✓ Seeded ${controlCount} AI controls (${aiControls.length - controlCount} already existed)`);

  // ── 5. AI Policies ────────────────────────────────────────────────────────

  const aiPolicies = [
    {
      name: "AI Acceptable Use Policy",
      description: "Defines permitted and prohibited uses of AI tools by employees. Covers data handling obligations, prohibited categories (autonomous decisions on individuals, weapons, surveillance), and employee responsibilities.",
      policy_type: "acceptable_use",
      status: "active",
      version: "2.1",
      effective_date: new Date(Date.now() - 60 * 86400000).toISOString().split("T")[0],
      review_date: new Date(Date.now() + 305 * 86400000).toISOString().split("T")[0],
      owner_department: "Legal",
      scope: "All employees, contractors, and third parties using AI tools on behalf of the organisation.",
      attestation_required: true,
      attestation_count: 47,
    },
    {
      name: "Responsible AI Framework",
      description: "Establishes the organisation's principles for ethical AI development and deployment: fairness, transparency, accountability, safety, and privacy. Defines governance roles including AI Ethics Lead and AI Risk Committee.",
      policy_type: "responsible_ai",
      status: "active",
      version: "1.0",
      effective_date: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
      review_date: new Date(Date.now() + 335 * 86400000).toISOString().split("T")[0],
      owner_department: "Governance",
      scope: "All AI systems designed, procured, or deployed by the organisation.",
      attestation_required: false,
      attestation_count: 0,
    },
    {
      name: "AI Procurement and Vendor Due Diligence Policy",
      description: "Mandates risk assessment, DPA review, vendor trust scoring, and CISO/DPO approval before contracting any AI vendor. Sets minimum security and privacy standards for AI suppliers.",
      policy_type: "procurement",
      status: "draft",
      version: "0.3",
      effective_date: null,
      review_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      owner_department: "Procurement",
      scope: "All commercial AI tool and platform procurements.",
      attestation_required: false,
      attestation_count: 0,
    },
    {
      name: "AI Development Standards and Guidelines",
      description: "Technical standards for internal AI/ML development: model documentation requirements, training data governance, bias testing protocols, model versioning, and deployment checklists.",
      policy_type: "development_standards",
      status: "draft",
      version: "0.1",
      effective_date: null,
      review_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      owner_department: "Engineering",
      scope: "Engineering teams building or fine-tuning AI/ML models.",
      attestation_required: false,
      attestation_count: 0,
    },
  ];

  let policyCount = 0;
  for (const p of aiPolicies) {
    const existing = await sql`
      SELECT id FROM ai_policies
      WHERE organization_id = ${orgId} AND name = ${p.name}
      LIMIT 1
    `;
    if (existing.length === 0) {
      const polType = ['acceptable_use','development','procurement','responsible_ai','privacy','security','custom'].includes(p.policy_type)
        ? p.policy_type
        : p.policy_type === 'development_standards' ? 'development'
        : 'custom';
      await sql`
        INSERT INTO ai_policies (
          id, organization_id, name, description, policy_type, status, version,
          review_date, created_by, created_at, updated_at
        ) VALUES (
          ${randomUUID()}, ${orgId}, ${p.name}, ${p.description}, ${polType},
          ${p.status ?? 'draft'}, ${p.version ?? '1.0'},
          ${p.review_date ?? null}, ${actorId}, NOW(), NOW()
        )
        ON CONFLICT DO NOTHING
      `;
      policyCount++;
    }
  }
  counts.ai_policies = policyCount;
  console.log(`  ✓ Seeded ${policyCount} AI policies (${aiPolicies.length - policyCount} already existed)`);

  // ── 6. AI Assessments ─────────────────────────────────────────────────────

  const aiAssessments = [
    {
      name: "ChatGPT — AI Impact Assessment",
      assessment_type: "impact_assessment",
      status: "completed",
      score: 72,
      target_system: "ChatGPT",
      assessor: "AI Risk Team",
      assessment_date: new Date(Date.now() - 45 * 86400000).toISOString().split("T")[0],
      next_review_date: new Date(Date.now() + 320 * 86400000).toISOString().split("T")[0],
      findings_count: 5,
      critical_findings: 0,
      high_findings: 2,
      summary: "ChatGPT deployment assessed as medium-risk. Key concerns: PII exposure via prompts (mitigated by prompt scanning implementation), hallucination rate in complex queries (ongoing monitoring). Overall posture satisfactory with controls in place.",
      recommendations: "1. Implement RAG grounding for policy-related queries. 2. Deploy automated PII redaction before API calls. 3. Add output confidence scoring for high-stakes responses.",
    },
    {
      name: "AWS Bedrock RAG — AI Risk Assessment",
      assessment_type: "risk_assessment",
      status: "completed",
      score: 65,
      target_system: "AWS Bedrock RAG",
      assessor: "External — SecureAI Consulting",
      assessment_date: new Date(Date.now() - 20 * 86400000).toISOString().split("T")[0],
      next_review_date: new Date(Date.now() + 345 * 86400000).toISOString().split("T")[0],
      findings_count: 7,
      critical_findings: 0,
      high_findings: 3,
      summary: "RAG pipeline assessed with moderate risk profile. Retrieval layer retrieves from internal knowledge base only — data exfiltration risk is low. Key gaps: prompt logging not fully enabled, retrieval scope not strictly bounded, no adversarial test suite for injection attacks.",
      recommendations: "1. Enable comprehensive prompt logging. 2. Implement retrieval guardrails to prevent out-of-scope data access. 3. Conduct adversarial red-teaming exercise.",
    },
    {
      name: "Organisational EU AI Act Readiness Assessment",
      assessment_type: "regulatory_assessment",
      status: "in_progress",
      score: null,
      target_system: null,
      assessor: "Compliance Team + External Counsel",
      assessment_date: null,
      next_review_date: new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0],
      findings_count: 0,
      critical_findings: 0,
      high_findings: 0,
      summary: "Assessment initiated to classify all AI systems under EU AI Act risk tiers (unacceptable/high/limited/minimal). Scope includes Internal Risk Analyzer (suspected high-risk, Annex III) and Internal Support Bot. Conformity assessment documentation being prepared.",
      recommendations: "Engage notified body for high-risk system conformity review. Prepare CE marking documentation. Register high-risk systems in EU AI database by deadline.",
    },
  ];

  let assessmentCount = 0;
  for (const a of aiAssessments) {
    const existing = await sql`
      SELECT id FROM ai_assessments
      WHERE organization_id = ${orgId} AND title = ${a.name}
      LIMIT 1
    `;
    if (existing.length === 0) {
      const systemId = a.target_system ? (systemIds[a.target_system] ?? null) : null;
      if (!systemId) continue; // ai_system_id is NOT NULL
      const asmtType = a.assessment_type === 'impact_assessment' ? 'impact'
        : a.assessment_type === 'risk_assessment' ? 'risk'
        : a.assessment_type === 'regulatory_assessment' ? 'eu_ai_act'
        : 'custom';
      await sql`
        INSERT INTO ai_assessments (
          id, organization_id, ai_system_id, title, assessment_type, status, score,
          findings, recommendations, created_by, created_at, updated_at
        ) VALUES (
          ${randomUUID()}, ${orgId}, ${systemId},
          ${a.name}, ${asmtType}, ${a.status === 'completed' ? 'completed' : 'in_progress'},
          ${a.score ?? null},
          ${JSON.stringify(a.summary ? [{ text: a.summary }] : [])},
          ${JSON.stringify(a.recommendations ? [{ text: a.recommendations }] : [])},
          ${actorId}, NOW(), NOW()
        )
        ON CONFLICT DO NOTHING
      `;
      assessmentCount++;
    }
  }
  counts.ai_assessments = assessmentCount;
  console.log(`  ✓ Seeded ${assessmentCount} AI assessments (${aiAssessments.length - assessmentCount} already existed)`);

  // ── 7. AI Incidents ───────────────────────────────────────────────────────

  const aiIncidents = [
    {
      title: "ChatGPT Hallucinated Refund Policy to Customer",
      description: "ChatGPT incorrectly stated that customers are eligible for a full refund within 90 days (actual policy: 30 days). Customer relied on this and raised a formal complaint. Incident identified via customer service escalation.",
      incident_type: "hallucination",
      severity: "low",
      status: "resolved",
      affected_system: "ChatGPT",
      affected_users: 1,
      data_breach: false,
      regulatory_reportable: false,
      detected_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      resolved_at: new Date(Date.now() - 22 * 86400000).toISOString(),
      root_cause: "Model lacked grounding with current refund policy. Policy was updated 45 days prior but prompt context was not refreshed.",
      remediation: "Updated system prompt with current policy. Implemented RAG grounding for policy-related queries. Customer compensated.",
      lessons_learned: "All policy-related query paths must use RAG retrieval, not static prompt context. Policy change management process updated to include AI system context refresh.",
    },
    {
      title: "Potential Gender Bias Detected in CV Screening Outputs",
      description: "Internal audit of AI screening outputs identified statistically significant difference in recommendation rates between male and female applicants for technical roles. 68% recommendation rate for male applicants vs 41% for female applicants in the same pool.",
      incident_type: "bias_event",
      severity: "high",
      status: "open",
      affected_system: "Internal Risk Analyzer",
      affected_users: 34,
      data_breach: false,
      regulatory_reportable: true,
      detected_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      resolved_at: null,
      root_cause: "Under investigation. Likely training data reflects historical hiring patterns. Gender-correlated proxy features (e.g., university names, extracurricular activities) not removed from feature set.",
      remediation: "AI screening output suspended for hiring decisions. Manual review of all Q2 shortlists in progress. Bias audit commissioned.",
      lessons_learned: null,
    },
    {
      title: "Employee PII Submitted to OpenAI API in Prompt",
      description: "Employee submitted a prompt containing names, salaries, and performance ratings of 12 colleagues to ChatGPT to generate an appraisal summary. Data was transmitted to OpenAI's API without consent or data minimisation.",
      incident_type: "data_exposure",
      severity: "medium",
      status: "resolved",
      affected_system: "ChatGPT",
      affected_users: 12,
      data_breach: true,
      regulatory_reportable: true,
      detected_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      resolved_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      root_cause: "No technical controls prevented PII transmission. Employee unaware of acceptable use policy restrictions on personal data in AI prompts.",
      remediation: "Deployed prompt scanning with PII detection. Issued mandatory AI AUP training to all 210 employees. DPO notified. Assessment: below DPDP reportable threshold (no sensitive personal data, limited scope).",
      lessons_learned: "PII scanning must be implemented before policy-only controls. AUP training must be completed before AI tool access granted.",
    },
    {
      title: "Prompt Injection Attempt on Internal Support Bot",
      description: "Security monitoring detected a crafted prompt attempting to override system instructions and exfiltrate internal HR FAQ documents. Attempt partially succeeded — bot returned document titles but not content.",
      incident_type: "prompt_injection",
      severity: "high",
      status: "investigating",
      affected_system: "Internal Support Bot",
      affected_users: 0,
      data_breach: false,
      regulatory_reportable: false,
      detected_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      resolved_at: null,
      root_cause: "System prompt does not use hardened injection-resistant formatting. Document tool permissions not scoped to minimum required access.",
      remediation: "Temporarily restricted bot to FAQ queries only. Engaging red team for full injection testing. System prompt hardening in progress.",
      lessons_learned: null,
    },
  ];

  let incidentCount = 0;
  for (const i of aiIncidents) {
    const existing = await sql`
      SELECT id FROM ai_incidents
      WHERE organization_id = ${orgId} AND title = ${i.title}
      LIMIT 1
    `;
    if (existing.length === 0) {
      const systemId = i.affected_system ? (systemIds[i.affected_system] ?? null) : null;
      const incType = i.incident_type === 'bias_event' ? 'bias_event'
        : i.incident_type === 'hallucination' ? 'hallucination'
        : i.incident_type === 'data_exposure' ? 'data_exposure'
        : i.incident_type === 'unauthorized_usage' ? 'unauthorized_usage'
        : 'other';
      await sql`
        INSERT INTO ai_incidents (
          id, organization_id, ai_system_id, title, description, incident_type,
          severity, status, root_cause, remediation, detected_at, resolved_at,
          created_at, updated_at
        ) VALUES (
          ${randomUUID()}, ${orgId}, ${systemId}, ${i.title}, ${i.description},
          ${incType}, ${i.severity ?? 'medium'}, ${i.status ?? 'open'},
          ${i.root_cause ?? null}, ${i.remediation ?? null},
          ${i.detected_at ?? 'NOW()'}, ${i.resolved_at ?? null},
          NOW(), NOW()
        )
        ON CONFLICT DO NOTHING
      `;
      incidentCount++;
    }
  }
  counts.ai_incidents = incidentCount;
  console.log(`  ✓ Seeded ${incidentCount} AI incidents (${aiIncidents.length - incidentCount} already existed)`);

  // ── 8. AI Compliance Records ──────────────────────────────────────────────

  const complianceRecords = [
    {
      framework: "iso_42001",
      framework_name: "ISO/IEC 42001:2023 — AI Management System",
      status: "in_progress",
      coverage_percent: 45,
      controls_total: 38,
      controls_implemented: 17,
      last_assessed: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
      target_date: new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0],
      notes: "Gap assessment completed. Priority areas: AI impact assessment process, AI objectives and planning, competence management. External certification target Q4 2026.",
      certification_body: null,
      certified: false,
    },
    {
      framework: "nist_ai_rmf",
      framework_name: "NIST AI Risk Management Framework 1.0",
      status: "in_progress",
      coverage_percent: 62,
      controls_total: 72,
      controls_implemented: 45,
      last_assessed: new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0],
      target_date: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
      notes: "GOVERN and MAP functions substantially complete. MEASURE function 50% complete (explainability and bias metrics gaps). MANAGE function 40% (incident response and continuous monitoring gaps).",
      certification_body: null,
      certified: false,
    },
    {
      framework: "eu_ai_act",
      framework_name: "EU AI Act (Regulation 2024/1689)",
      status: "not_started",
      coverage_percent: 15,
      controls_total: 55,
      controls_implemented: 8,
      last_assessed: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0],
      target_date: new Date(Date.now() + 270 * 86400000).toISOString().split("T")[0],
      notes: "Initial scoping only. System classification exercise in progress. Internal Risk Analyzer likely high-risk (Annex III employment category). Full readiness programme to commence Q3 2026.",
      certification_body: null,
      certified: false,
    },
    {
      framework: "oecd_ai_principles",
      framework_name: "OECD AI Principles (2023 Revision)",
      status: "partial",
      coverage_percent: 70,
      controls_total: 25,
      controls_implemented: 18,
      last_assessed: new Date(Date.now() - 60 * 86400000).toISOString().split("T")[0],
      target_date: new Date(Date.now() + 120 * 86400000).toISOString().split("T")[0],
      notes: "Strong alignment on transparency, accountability, and robustness principles. Gaps in human oversight documentation (Principle 2) and inclusive growth considerations (Principle 1). Self-assessment basis.",
      certification_body: null,
      certified: false,
    },
    {
      framework: "dpdp_ai",
      framework_name: "DPDP Act 2023 — AI Data Processing Requirements",
      status: "in_progress",
      coverage_percent: 55,
      controls_total: 30,
      controls_implemented: 17,
      last_assessed: new Date(Date.now() - 20 * 86400000).toISOString().split("T")[0],
      target_date: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
      notes: "Consent management for AI-processed personal data at 40%. Data minimisation controls for LLM prompts partially implemented. Data Fiduciary obligations mapped but attestation process pending. DPO engaged.",
      certification_body: null,
      certified: false,
    },
    {
      framework: "internal",
      framework_name: "Internal AI Governance Policy Framework",
      status: "compliant",
      coverage_percent: 85,
      controls_total: 20,
      controls_implemented: 17,
      last_assessed: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
      target_date: new Date(Date.now() + 355 * 86400000).toISOString().split("T")[0],
      notes: "Largely compliant with internal Responsible AI Framework and Acceptable Use Policy. Three controls partially implemented: prompt logging (Internal Support Bot gap), content filtering (not deployed on all systems), annual vendor review (scheduled, not yet executed).",
      certification_body: null,
      certified: false,
    },
  ];

  let complianceCount = 0;
  for (const c of complianceRecords) {
    const existing = await sql`
      SELECT id FROM ai_compliance
      WHERE organization_id = ${orgId} AND framework = ${c.framework}
      LIMIT 1
    `;
    if (existing.length === 0) {
      await sql`
        INSERT INTO ai_compliance (
          id, organization_id, framework, status, readiness_score,
          total_controls, implemented_controls, open_gaps,
          last_assessed_at, notes, created_at, updated_at
        ) VALUES (
          ${randomUUID()}, ${orgId}, ${c.framework},
          ${c.status === 'compliant' ? 'compliant' : c.status === 'in_progress' ? 'in_progress' : 'not_started'},
          ${c.coverage_percent ?? 0},
          ${c.controls_total ?? 0}, ${c.controls_implemented ?? 0},
          ${(c.controls_total ?? 0) - (c.controls_implemented ?? 0)},
          ${c.last_assessed ?? null}, ${c.notes ?? null},
          NOW(), NOW()
        )
        ON CONFLICT DO NOTHING
      `;
      complianceCount++;
    }
  }
  counts.ai_compliance = complianceCount;
  console.log(`  ✓ Seeded ${complianceCount} AI compliance records (${complianceRecords.length - complianceCount} already existed)`);

  // ── Summary ───────────────────────────────────────────────────────────────

  await sql.end();

  console.log("\n✅ AI Governance™ seed complete");
  console.log("─────────────────────────────────────");
  console.log(`   AI Systems:          ${counts.ai_systems}`);
  console.log(`   AI Vendors:          ${counts.ai_vendors}`);
  console.log(`   AI Risks:            ${counts.ai_risks}`);
  console.log(`   AI Controls:         ${counts.ai_controls}`);
  console.log(`   AI Policies:         ${counts.ai_policies}`);
  console.log(`   AI Assessments:      ${counts.ai_assessments}`);
  console.log(`   AI Incidents:        ${counts.ai_incidents}`);
  console.log(`   AI Compliance:       ${counts.ai_compliance}`);
  console.log("─────────────────────────────────────");
  console.log("   Visit: /ai-governance");
}

// ── Entry point ───────────────────────────────────────────────────────────────

const arg = process.argv[2];
if (arg === "--list") {
  await listOrgs();
  await sql.end();
} else if (arg) {
  await seed(arg);
} else {
  const [org] = await sql`SELECT id, name FROM organizations ORDER BY created_at LIMIT 1`;
  if (!org) {
    console.error("No organizations found. Run seed-demo.mjs first.");
    process.exit(1);
  }
  console.log(`Auto-detected org: ${org.name} (${org.id})`);
  await seed(org.id);
}
