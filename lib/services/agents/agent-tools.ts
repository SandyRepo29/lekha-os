/**
 * Agent Tools — Gemini FunctionDeclaration definitions for Governance Agent Framework™
 *
 * These tools map to existing AUDT services and are passed to Gemini's
 * function-calling API when an agent runs. No "use server" — pure TypeScript.
 *
 * Each tool follows the Gemini FunctionDeclaration schema:
 * { name, description, parameters: { type, properties, required } }
 */

// ── Types ─────────────────────────────────────────────────────────────────────

/** A single function call emitted by Gemini during an agent run. */
export interface AgentToolCall {
  name: string;
  args: Record<string, unknown>;
}

/** The result returned after executing a tool call. */
export interface AgentToolResult {
  toolName: string;
  success: boolean;
  /** Serialisable result payload — stored in agent_actions.result */
  data?: Record<string, unknown>;
  errorMessage?: string;
}

// ── Tool Definitions (Gemini FunctionDeclaration format) ─────────────────────

export const AGENT_TOOLS = [
  // ── create_issue ────────────────────────────────────────────────────────────
  {
    name: "create_issue",
    description:
      "Creates a governance issue in AUDT Issue Hub™. Use when the agent detects a policy violation, " +
      "compliance gap, vendor risk, audit finding, or any actionable governance concern that requires " +
      "tracking and remediation.",
    parameters: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Short, clear issue title (under 120 characters).",
        },
        description: {
          type: "string",
          description:
            "Detailed description of the issue including context, root cause, and potential impact.",
        },
        severity: {
          type: "string",
          enum: ["critical", "high", "medium", "low", "informational"],
          description: "Issue severity level based on potential impact to the organization.",
        },
        priority: {
          type: "string",
          enum: ["urgent", "high", "medium", "low"],
          description:
            "Issue priority for remediation scheduling. Urgent = same-day, High = this week.",
        },
        sourceModule: {
          type: "string",
          enum: [
            "vendor_hub",
            "evidence_vault",
            "audit_management",
            "risk_lens",
            "control_center",
            "trust_intelligence",
            "policy_governance",
            "dpdp_privacy",
            "contract_governance",
            "continuous_compliance",
            "ai_governance",
            "agent",
          ],
          description: "The AUDT module that generated this issue.",
        },
      },
      required: ["title", "description", "severity", "priority", "sourceModule"],
    },
  },

  // ── create_risk ─────────────────────────────────────────────────────────────
  {
    name: "create_risk",
    description:
      "Creates a new risk entry in AUDT Risk Lens™. Use when the agent identifies an emerging risk " +
      "that is not yet tracked — such as a new vendor vulnerability, regulatory change, control failure, " +
      "or AI model risk.",
    parameters: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Concise risk title describing the threat (under 120 characters).",
        },
        category: {
          type: "string",
          enum: [
            "operational",
            "cyber_security",
            "compliance",
            "vendor",
            "privacy",
            "financial",
            "legal",
            "strategic",
            "technology",
            "business_continuity",
            "third_party",
            "regulatory",
            "custom",
          ],
          description: "Risk Lens™ category that best classifies this risk.",
        },
        impact: {
          type: "number",
          description:
            "Impact score 1–5: 1=Negligible, 2=Minor, 3=Moderate, 4=Significant, 5=Catastrophic.",
        },
        likelihood: {
          type: "number",
          description:
            "Likelihood score 1–5: 1=Rare, 2=Unlikely, 3=Possible, 4=Likely, 5=Almost Certain.",
        },
      },
      required: ["title", "category", "impact", "likelihood"],
    },
  },

  // ── create_task ──────────────────────────────────────────────────────────────
  {
    name: "create_task",
    description:
      "Creates an action task for a team member. Use when the agent determines that a human " +
      "needs to perform a specific time-bound action — such as reviewing a document, updating a " +
      "control, completing training, or responding to a vendor questionnaire.",
    parameters: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Clear, actionable task title starting with a verb.",
        },
        description: {
          type: "string",
          description:
            "Full task description including what needs to be done, why, and any relevant context.",
        },
        dueDate: {
          type: "string",
          description:
            "ISO 8601 date string for task due date (e.g. '2026-06-20'). " +
            "Set based on severity: critical=3 days, high=7 days, medium=14 days, low=30 days.",
        },
        assigneeId: {
          type: "string",
          description:
            "UUID of the user to assign this task to. Leave empty to leave unassigned.",
        },
      },
      required: ["title", "description", "dueDate"],
    },
  },

  // ── request_evidence ─────────────────────────────────────────────────────────
  {
    name: "request_evidence",
    description:
      "Sends a document evidence request to a vendor through AUDT Vendor Hub™. Use when compliance " +
      "checks reveal missing documentation — such as expired certifications, missing security policies, " +
      "or overdue audit reports.",
    parameters: {
      type: "object" as const,
      properties: {
        vendorId: {
          type: "string",
          description: "UUID of the vendor to request evidence from.",
        },
        documentType: {
          type: "string",
          description:
            "Type of document being requested. Examples: 'ISO 27001 Certificate', " +
            "'SOC 2 Type II Report', 'Penetration Test Report', 'Data Processing Agreement', " +
            "'Business Continuity Plan'.",
        },
        message: {
          type: "string",
          description:
            "Personalized message to the vendor explaining why this document is needed " +
            "and by what date.",
        },
      },
      required: ["vendorId", "documentType", "message"],
    },
  },

  // ── generate_report ──────────────────────────────────────────────────────────
  {
    name: "generate_report",
    description:
      "Triggers generation of a governance report within AUDT. Use after an agent sweep " +
      "to produce an executive summary, board report, or module-specific report for stakeholders.",
    parameters: {
      type: "object" as const,
      properties: {
        reportType: {
          type: "string",
          enum: [
            "executive_summary",
            "board_governance",
            "risk_committee",
            "audit_committee",
            "vendor_trust",
            "compliance_readiness",
            "control_health",
            "ai_governance",
            "agent_activity",
          ],
          description: "Type of report to generate.",
        },
        format: {
          type: "string",
          enum: ["pdf", "csv", "json"],
          description: "Output format for the report.",
        },
      },
      required: ["reportType", "format"],
    },
  },

  // ── notify_stakeholder ───────────────────────────────────────────────────────
  {
    name: "notify_stakeholder",
    description:
      "Sends a governance notification to a specific AUDT user. Use when an agent identifies " +
      "a condition that requires immediate human attention — such as a critical risk, compliance " +
      "deadline, expiring certificate, or pending approval.",
    parameters: {
      type: "object" as const,
      properties: {
        userId: {
          type: "string",
          description: "UUID of the AUDT user to notify.",
        },
        message: {
          type: "string",
          description:
            "Clear, actionable notification message. Include what was found, why it matters, " +
            "and what action is required.",
        },
        priority: {
          type: "string",
          enum: ["urgent", "high", "medium", "low"],
          description:
            "Notification priority: urgent = in-app + email immediately; " +
            "high = in-app + next digest; medium/low = next digest only.",
        },
      },
      required: ["userId", "message", "priority"],
    },
  },

  // ── create_review ────────────────────────────────────────────────────────────
  {
    name: "create_review",
    description:
      "Schedules a vendor governance review in AUDT Vendor Hub™. Use when an agent detects " +
      "that a vendor is overdue for review, has dropped in Trust Score™, or has had recent " +
      "adverse findings.",
    parameters: {
      type: "object" as const,
      properties: {
        vendorId: {
          type: "string",
          description: "UUID of the vendor to schedule a review for.",
        },
        reviewType: {
          type: "string",
          enum: [
            "annual",
            "periodic",
            "triggered",
            "incident_driven",
            "pre_renewal",
            "post_incident",
          ],
          description: "Type of vendor governance review to schedule.",
        },
        scheduledDate: {
          type: "string",
          description:
            "ISO 8601 date string for when the review should occur (e.g. '2026-07-01').",
        },
      },
      required: ["vendorId", "reviewType", "scheduledDate"],
    },
  },

  // ── launch_workflow ──────────────────────────────────────────────────────────
  {
    name: "launch_workflow",
    description:
      "Launches an automated governance workflow in AUDT Workflow Studio™. Use to trigger " +
      "approval chains, onboarding sequences, incident response procedures, or any multi-step " +
      "governance process.",
    parameters: {
      type: "object" as const,
      properties: {
        workflowType: {
          type: "string",
          enum: [
            "vendor_onboarding",
            "vendor_offboarding",
            "risk_escalation",
            "policy_approval",
            "evidence_collection",
            "access_review",
            "incident_response",
            "compliance_remediation",
            "contract_renewal",
          ],
          description: "Type of workflow to launch.",
        },
        entityId: {
          type: "string",
          description:
            "UUID of the entity this workflow operates on (vendor, risk, policy, contract, etc.).",
        },
        parameters: {
          type: "object",
          description:
            "Additional workflow-specific parameters as key-value pairs. " +
            "For example, for vendor_onboarding: { vendorType: 'SaaS', tier: 'critical' }.",
        },
      },
      required: ["workflowType", "entityId"],
    },
  },

  // ── assign_owner ──────────────────────────────────────────────────────────────
  {
    name: "assign_owner",
    description:
      "Assigns or reassigns an owner to a governance entity in AUDT. Use when the agent finds " +
      "unowned risks, controls without owners, or issues with no assignee — ownership gaps are " +
      "a common governance failure.",
    parameters: {
      type: "object" as const,
      properties: {
        entityType: {
          type: "string",
          enum: [
            "risk",
            "control",
            "issue",
            "vendor",
            "policy",
            "contract",
            "audit",
            "finding",
            "capa",
          ],
          description: "Type of AUDT entity to assign an owner to.",
        },
        entityId: {
          type: "string",
          description: "UUID of the entity to assign an owner to.",
        },
        ownerId: {
          type: "string",
          description: "UUID of the AUDT user to assign as owner.",
        },
      },
      required: ["entityType", "entityId", "ownerId"],
    },
  },

  // ── escalate ──────────────────────────────────────────────────────────────────
  {
    name: "escalate",
    description:
      "Escalates a governance issue in AUDT Issue Hub™ to a higher authority. Use when an " +
      "issue has breached SLA, is critical severity and unacknowledged, or requires executive " +
      "attention.",
    parameters: {
      type: "object" as const,
      properties: {
        issueId: {
          type: "string",
          description: "UUID of the issue to escalate.",
        },
        escalateTo: {
          type: "string",
          enum: ["owner", "manager", "executive", "board", "legal", "external_auditor"],
          description: "The escalation target level.",
        },
        reason: {
          type: "string",
          description:
            "Clear explanation of why this issue requires escalation, including what has already " +
            "been attempted and the risk of inaction.",
        },
      },
      required: ["issueId", "escalateTo", "reason"],
    },
  },
] as const;

// Derive the tool name union from the definitions for type safety
export type AgentToolName = (typeof AGENT_TOOLS)[number]["name"];
