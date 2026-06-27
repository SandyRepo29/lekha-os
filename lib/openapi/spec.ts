/**
 * AUDT OpenAPI 3.1 specification.
 *
 * Returns a plain JS object representing the full spec.
 * Served as JSON at GET /api/docs
 * Rendered via Swagger UI at GET /api/docs/ui
 */

// ─── Reusable schema fragments ─────────────────────────────────────────────────

const ErrorSchema = {
  type: "object",
  properties: {
    error: { type: "string", example: "Unauthorized — provide a valid Bearer API key." },
  },
  required: ["error"],
};

const MetaSchema = {
  type: "object",
  properties: {
    page:     { type: "integer", example: 1 },
    pageSize: { type: "integer", example: 20 },
    total:    { type: "integer", example: 142 },
  },
};

function paginatedResponse(itemRef: string) {
  return {
    type: "object",
    properties: {
      data: { type: "array", items: { $ref: itemRef } },
      meta: { $ref: "#/components/schemas/Meta" },
    },
  };
}

function standardResponses(successSchema: object, description = "Success") {
  return {
    200: {
      description,
      content: { "application/json": { schema: successSchema } },
    },
    400: {
      description: "Bad request — missing or invalid parameters.",
      content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
    },
    401: {
      description: "Unauthorized — missing or invalid API key.",
      content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
    },
    403: {
      description: "Forbidden — API key lacks write permissions.",
      content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
    },
    422: {
      description: "Unprocessable entity — domain validation error.",
      content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
    },
    429: {
      description: "Rate limit exceeded.",
      content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
    },
    500: {
      description: "Internal server error.",
      content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
    },
  };
}

function createdResponses(successSchema: object, description = "Created") {
  return {
    ...standardResponses(successSchema, description),
    200: undefined,
    201: {
      description,
      content: { "application/json": { schema: successSchema } },
    },
  };
}

// ─── Pagination params ─────────────────────────────────────────────────────────

const pageParam = {
  name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 },
  description: "Page number (1-based).",
};
const pageSizeParam = {
  name: "pageSize", in: "query", schema: { type: "integer", default: 20, minimum: 1, maximum: 100 },
  description: "Items per page (max 100).",
};

// ─── Main spec builder ─────────────────────────────────────────────────────────

export function buildOpenApiSpec(): object {
  return {
    openapi: "3.1.0",
    info: {
      title: "AUDT API",
      version: "1.0.0",
      description:
        "AUDT Trust, Risk &amp; Compliance Platform API. Governance Built on Proof.\n\n" +
        "All endpoints require a Bearer API key issued from **Settings &#8594; API Keys**.\n\n" +
        "**Rate limits** (per 60-second window):\n" +
        "- `read_only` keys — 100 requests\n" +
        "- `read_write` keys — 300 requests\n" +
        "- `admin` keys — 1000 requests\n\n" +
        "Rate limit headers are included in every response: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.",
      contact: { name: "AUDT API Support", email: "api@audt.tech" },
      license: { name: "Proprietary" },
    },
    servers: [
      { url: "https://audt.tech/api/v1",                description: "Production" },
      { url: "https://lekha-os.vercel.app/api/v1",      description: "Staging" },
      { url: "http://localhost:3000/api/v1",             description: "Local development" },
    ],
    security: [{ bearerAuth: [] }],

    // ── Components ──────────────────────────────────────────────────────────────
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "API Key",
          description: "API key in the format `lk_live_<hex>`. Obtain from Settings → API Keys.",
        },
      },
      schemas: {
        Error: ErrorSchema,
        Meta: MetaSchema,

        // ── Vendor schemas ──────────────────────────────────────────────────────
        Vendor: {
          type: "object",
          properties: {
            id:              { type: "string", format: "uuid" },
            name:            { type: "string", example: "Acme Corp" },
            status:          { type: "string", enum: ["active", "inactive", "pending", "archived"] },
            riskLevel:       { type: "string", enum: ["low", "medium", "high", "critical"] },
            category:        { type: "string", example: "SaaS" },
            country:         { type: "string", example: "India" },
            website:         { type: "string", format: "uri", nullable: true },
            trustScore:      { type: "number", nullable: true, example: 82.5 },
            complianceScore: { type: "number", nullable: true, example: 75.0 },
            lifecycleState:  { type: "string", example: "active" },
            createdAt:       { type: "string", format: "date-time" },
            updatedAt:       { type: "string", format: "date-time" },
          },
        },
        VendorTrustScore: {
          type: "object",
          properties: {
            vendorId:    { type: "string", format: "uuid" },
            overallScore: { type: "number", example: 82.5 },
            level:       { type: "string", example: "Strong" },
            components: {
              type: "object",
              properties: {
                evidence:    { type: "number", example: 85 },
                compliance:  { type: "number", example: 78 },
                risk:        { type: "number", example: 80 },
                assessment:  { type: "number", example: 90 },
                operational: { type: "number", example: 70 },
                freshness:   { type: "number", example: 88 },
                contract:    { type: "number", example: 75 },
              },
            },
            history: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date:         { type: "string", format: "date" },
                  overallScore: { type: "number" },
                  triggerEvent: { type: "string" },
                },
              },
            },
            narrative: { type: "string", nullable: true },
            computedAt: { type: "string", format: "date-time" },
          },
        },

        // ── Risk schemas ────────────────────────────────────────────────────────
        Risk: {
          type: "object",
          properties: {
            id:               { type: "string", format: "uuid" },
            title:            { type: "string", example: "Vendor data breach exposure" },
            description:      { type: "string", nullable: true },
            category:         {
              type: "string",
              enum: ["operational", "cyber_security", "compliance", "vendor", "privacy",
                     "financial", "legal", "strategic", "technology", "business_continuity",
                     "third_party", "regulatory", "custom"],
            },
            status:           {
              type: "string",
              enum: ["identified", "under_assessment", "open", "mitigating", "accepted",
                     "transferred", "closed", "archived"],
            },
            impact:           { type: "integer", minimum: 1, maximum: 5, example: 4 },
            likelihood:       { type: "integer", minimum: 1, maximum: 5, example: 3 },
            inherentScore:    { type: "number", example: 12 },
            residualScore:    { type: "number", nullable: true },
            treatmentStrategy:{ type: "string", enum: ["mitigate", "accept", "transfer", "avoid", "monitor"] },
            source:           { type: "string", enum: ["manual", "vendor", "audit_finding", "compliance_gap",
                                                        "control_failure", "policy_exception", "ai_generated", "api"] },
            targetDate:       { type: "string", format: "date", nullable: true },
            nextReviewDate:   { type: "string", format: "date", nullable: true },
            createdAt:        { type: "string", format: "date-time" },
            updatedAt:        { type: "string", format: "date-time" },
          },
        },
        RiskInput: {
          type: "object",
          required: ["title"],
          properties: {
            title:             { type: "string", example: "Vendor data breach exposure" },
            description:       { type: "string", nullable: true },
            category:          { type: "string", default: "operational" },
            status:            { type: "string", default: "identified" },
            impact:            { type: "integer", minimum: 1, maximum: 5, default: 3 },
            likelihood:        { type: "integer", minimum: 1, maximum: 5, default: 3 },
            treatmentStrategy: { type: "string", default: "mitigate" },
            source:            { type: "string", default: "api" },
            targetDate:        { type: "string", format: "date", nullable: true },
          },
        },

        // ── Compliance schemas ──────────────────────────────────────────────────
        Framework: {
          type: "object",
          properties: {
            id:             { type: "string", format: "uuid" },
            name:           { type: "string", example: "ISO 27001" },
            description:    { type: "string", nullable: true },
            status:         { type: "string", enum: ["active", "draft", "archived"] },
            readinessScore: { type: "number", nullable: true, example: 72.5 },
            controlCount:   { type: "integer", example: 93 },
            createdAt:      { type: "string", format: "date-time" },
          },
        },
        ComplianceGap: {
          type: "object",
          properties: {
            id:          { type: "string", format: "uuid" },
            title:       { type: "string" },
            description: { type: "string", nullable: true },
            severity:    { type: "string", enum: ["critical", "high", "medium", "low"] },
            gapType:     { type: "string" },
            frameworkId: { type: "string", format: "uuid", nullable: true },
            controlId:   { type: "string", format: "uuid", nullable: true },
            resolvedAt:  { type: "string", format: "date-time", nullable: true },
            createdAt:   { type: "string", format: "date-time" },
          },
        },

        // ── Audit schemas ───────────────────────────────────────────────────────
        Audit: {
          type: "object",
          properties: {
            id:           { type: "string", format: "uuid" },
            name:         { type: "string", example: "ISO 27001 Surveillance Audit" },
            auditType:    { type: "string", enum: ["internal", "external", "regulatory", "vendor", "compliance", "security", "custom"] },
            status:       { type: "string", enum: ["planned", "in_progress", "completed", "cancelled", "on_hold"] },
            scope:        { type: "string", nullable: true },
            objective:    { type: "string", nullable: true },
            auditorName:  { type: "string", nullable: true },
            startDate:    { type: "string", format: "date", nullable: true },
            endDate:      { type: "string", format: "date", nullable: true },
            aiSummary:    { type: "string", nullable: true },
            frameworkId:  { type: "string", format: "uuid", nullable: true },
            createdAt:    { type: "string", format: "date-time" },
          },
        },
        AuditInput: {
          type: "object",
          required: ["name", "auditType"],
          properties: {
            name:        { type: "string" },
            auditType:   { type: "string" },
            scope:       { type: "string", nullable: true },
            objective:   { type: "string", nullable: true },
            auditorName: { type: "string", nullable: true },
            startDate:   { type: "string", format: "date", nullable: true },
            endDate:     { type: "string", format: "date", nullable: true },
            frameworkId: { type: "string", format: "uuid", nullable: true },
          },
        },

        // ── Finding schemas ─────────────────────────────────────────────────────
        Finding: {
          type: "object",
          properties: {
            id:              { type: "string", format: "uuid" },
            title:           { type: "string" },
            description:     { type: "string", nullable: true },
            findingSeverity: { type: "string", enum: ["critical", "high", "medium", "low"] },
            findingStatus:   { type: "string", enum: ["open", "remediating", "closed", "accepted"] },
            auditId:         { type: "string", format: "uuid" },
            controlId:       { type: "string", format: "uuid", nullable: true },
            evidenceRef:     { type: "string", nullable: true },
            closedAt:        { type: "string", format: "date-time", nullable: true },
            createdAt:       { type: "string", format: "date-time" },
          },
        },
        FindingInput: {
          type: "object",
          required: ["auditId", "title", "findingSeverity"],
          properties: {
            auditId:         { type: "string", format: "uuid" },
            title:           { type: "string" },
            description:     { type: "string", nullable: true },
            findingSeverity: { type: "string", enum: ["critical", "high", "medium", "low"] },
            findingStatus:   { type: "string", default: "open" },
            controlId:       { type: "string", format: "uuid", nullable: true },
          },
        },

        // ── CAPA schemas ────────────────────────────────────────────────────────
        Capa: {
          type: "object",
          properties: {
            id:               { type: "string", format: "uuid" },
            action:           { type: "string" },
            description:      { type: "string", nullable: true },
            status:           { type: "string", enum: ["open", "in_progress", "completed", "overdue"] },
            findingId:        { type: "string", format: "uuid" },
            owner:            { type: "string", nullable: true },
            dueDate:          { type: "string", format: "date", nullable: true },
            completionNotes:  { type: "string", nullable: true },
            completedAt:      { type: "string", format: "date-time", nullable: true },
            createdAt:        { type: "string", format: "date-time" },
          },
        },
        CapaInput: {
          type: "object",
          required: ["findingId", "action"],
          properties: {
            findingId:   { type: "string", format: "uuid" },
            action:      { type: "string" },
            description: { type: "string", nullable: true },
            owner:       { type: "string", nullable: true },
            dueDate:     { type: "string", format: "date", nullable: true },
          },
        },

        // ── Trust Intelligence schemas ───────────────────────────────────────────
        OrgTrustOverview: {
          type: "object",
          properties: {
            orgTrustScore: { type: "number", example: 74.3 },
            level:         { type: "string", example: "Moderate" },
            components: {
              type: "object",
              properties: {
                vendorTrust:         { type: "number" },
                riskPosture:         { type: "number" },
                controlHealth:       { type: "number" },
                auditReadiness:      { type: "number" },
                complianceCoverage:  { type: "number" },
              },
            },
            vendorCount:    { type: "integer" },
            riskCount:      { type: "integer" },
            openAlerts:     { type: "integer" },
            computedAt:     { type: "string", format: "date-time" },
          },
        },

        // ── Contract schemas ────────────────────────────────────────────────────
        Contract: {
          type: "object",
          properties: {
            id:             { type: "string", format: "uuid" },
            title:          { type: "string", example: "Master Service Agreement — Acme Corp" },
            contractType:   { type: "string", enum: ["msa", "nda", "sla", "dpa", "amendment", "order_form", "custom"] },
            status:         { type: "string", enum: ["draft", "active", "expired", "terminated", "renewed", "under_review"] },
            vendorId:       { type: "string", format: "uuid", nullable: true },
            contractValue:  { type: "number", nullable: true },
            currency:       { type: "string", example: "INR" },
            startDate:      { type: "string", format: "date", nullable: true },
            endDate:        { type: "string", format: "date", nullable: true },
            noticePeriodDays: { type: "integer", nullable: true },
            healthScore:    { type: "number", nullable: true },
            createdAt:      { type: "string", format: "date-time" },
          },
        },
        ContractInput: {
          type: "object",
          required: ["title", "contractType"],
          properties: {
            title:          { type: "string" },
            contractType:   { type: "string" },
            status:         { type: "string", default: "draft" },
            vendorId:       { type: "string", format: "uuid", nullable: true },
            contractValue:  { type: "number", nullable: true },
            currency:       { type: "string", default: "INR" },
            startDate:      { type: "string", format: "date", nullable: true },
            endDate:        { type: "string", format: "date", nullable: true },
            noticePeriodDays: { type: "integer", nullable: true },
          },
        },

        // ── Issue schemas ───────────────────────────────────────────────────────
        Issue: {
          type: "object",
          properties: {
            id:           { type: "string", format: "uuid" },
            title:        { type: "string" },
            description:  { type: "string", nullable: true },
            severity:     { type: "string", enum: ["critical", "high", "medium", "low"] },
            priority:     { type: "string", enum: ["critical", "high", "medium", "low"] },
            status:       { type: "string", enum: ["open", "investigating", "remediating", "resolved", "closed", "accepted"] },
            sourceModule: { type: "string", nullable: true },
            ownerId:      { type: "string", format: "uuid", nullable: true },
            slaBreached:  { type: "boolean" },
            slaDueAt:     { type: "string", format: "date-time", nullable: true },
            resolvedAt:   { type: "string", format: "date-time", nullable: true },
            createdAt:    { type: "string", format: "date-time" },
          },
        },
        IssueInput: {
          type: "object",
          required: ["title", "severity"],
          properties: {
            title:        { type: "string" },
            description:  { type: "string", nullable: true },
            severity:     { type: "string", enum: ["critical", "high", "medium", "low"] },
            priority:     { type: "string", default: "medium" },
            status:       { type: "string", default: "open" },
            sourceModule: { type: "string", nullable: true },
          },
        },

        // ── Asset schemas ───────────────────────────────────────────────────────
        Asset: {
          type: "object",
          properties: {
            id:             { type: "string", format: "uuid" },
            name:           { type: "string", example: "Customer DB — Production" },
            assetType:      {
              type: "string",
              enum: ["application", "database", "api", "server", "cloud_resource", "data_asset",
                     "business_process", "ai_system", "vendor_service", "network_asset", "endpoint", "custom"],
            },
            criticality:    { type: "string", enum: ["critical", "high", "medium", "low"] },
            status:         { type: "string", enum: ["active", "inactive", "decommissioned", "under_review"] },
            environment:    { type: "string", enum: ["production", "staging", "development", "testing", "dr"] },
            dataClass:      { type: "string", enum: ["public", "internal", "confidential", "restricted", "pii", "sensitive"] },
            containsPii:    { type: "boolean" },
            trustScore:     { type: "number", nullable: true },
            owner:          { type: "string", nullable: true },
            createdAt:      { type: "string", format: "date-time" },
          },
        },
        AssetInput: {
          type: "object",
          required: ["name", "assetType", "criticality"],
          properties: {
            name:        { type: "string" },
            assetType:   { type: "string" },
            criticality: { type: "string" },
            status:      { type: "string", default: "active" },
            environment: { type: "string", default: "production" },
            dataClass:   { type: "string", default: "internal" },
            containsPii: { type: "boolean", default: false },
            owner:       { type: "string", nullable: true },
            description: { type: "string", nullable: true },
          },
        },

        // ── Regulatory schemas ──────────────────────────────────────────────────
        Regulation: {
          type: "object",
          properties: {
            id:            { type: "string", format: "uuid" },
            name:          { type: "string", example: "DPDP Act 2023" },
            jurisdiction:  { type: "string", example: "India" },
            category:      { type: "string", enum: ["data_privacy", "financial", "healthcare", "cybersecurity", "ai_governance", "sector_specific"] },
            status:        { type: "string", enum: ["active", "draft", "superseded"] },
            effectiveDate: { type: "string", format: "date", nullable: true },
            deadlineDate:  { type: "string", format: "date", nullable: true },
            isBuiltIn:     { type: "boolean", description: "true for the 18 built-in global regulations" },
          },
        },
        Obligation: {
          type: "object",
          properties: {
            id:                   { type: "string", format: "uuid" },
            title:                { type: "string" },
            description:          { type: "string", nullable: true },
            regulationId:         { type: "string", format: "uuid" },
            priority:             { type: "string", enum: ["critical", "high", "medium", "low"] },
            status:               { type: "string", enum: ["not_started", "in_progress", "implemented", "validated"] },
            owner:                { type: "string", nullable: true },
            dueDate:              { type: "string", format: "date", nullable: true },
            implementationNotes:  { type: "string", nullable: true },
            createdAt:            { type: "string", format: "date-time" },
          },
        },
        ObligationInput: {
          type: "object",
          required: ["title", "regulationId"],
          properties: {
            title:        { type: "string" },
            description:  { type: "string", nullable: true },
            regulationId: { type: "string", format: "uuid" },
            priority:     { type: "string", default: "medium" },
            status:       { type: "string", default: "not_started" },
            owner:        { type: "string", nullable: true },
            dueDate:      { type: "string", format: "date", nullable: true },
          },
        },
        RegulatoryChange: {
          type: "object",
          properties: {
            id:           { type: "string", format: "uuid" },
            title:        { type: "string" },
            description:  { type: "string", nullable: true },
            regulationId: { type: "string", format: "uuid" },
            severity:     { type: "string", enum: ["critical", "high", "medium", "low"] },
            status:       { type: "string", enum: ["new", "under_review", "assessed", "actioned", "closed"] },
            effectiveDate:{ type: "string", format: "date", nullable: true },
            createdAt:    { type: "string", format: "date-time" },
          },
        },

        // ── AI Governance schemas ───────────────────────────────────────────────
        AiSystem: {
          type: "object",
          properties: {
            id:           { type: "string", format: "uuid" },
            name:         { type: "string", example: "Customer Support Chatbot" },
            systemType:   { type: "string", enum: ["generative_ai", "predictive", "classification", "nlp", "computer_vision", "recommendation", "automation", "custom"] },
            riskLevel:    { type: "string", enum: ["critical", "high", "medium", "low"] },
            status:       { type: "string", enum: ["draft", "development", "testing", "active", "deprecated", "retired"] },
            vendor:       { type: "string", nullable: true },
            environment:  { type: "string", nullable: true },
            trustScore:   { type: "number", nullable: true },
            approvalStatus: { type: "string", enum: ["pending", "approved", "rejected", "conditional"] },
            createdAt:    { type: "string", format: "date-time" },
          },
        },
        AiSystemInput: {
          type: "object",
          required: ["name", "systemType", "riskLevel"],
          properties: {
            name:        { type: "string" },
            systemType:  { type: "string" },
            riskLevel:   { type: "string" },
            status:      { type: "string", default: "draft" },
            description: { type: "string", nullable: true },
            vendor:      { type: "string", nullable: true },
            environment: { type: "string", nullable: true },
          },
        },

        // ── Benchmarking schemas ────────────────────────────────────────────────
        BenchmarkOverview: {
          type: "object",
          properties: {
            overallScore:       { type: "number", example: 68.4 },
            percentile:         { type: "number", example: 72.0 },
            maturityLevel:      { type: "string", example: "Governance Aware" },
            industry:           { type: "string", example: "Technology" },
            categoryScores: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category:   { type: "string" },
                  score:      { type: "number" },
                  percentile: { type: "number" },
                  label:      { type: "string" },
                },
              },
            },
            computedAt: { type: "string", format: "date-time" },
          },
        },

        // ── Audit log schemas ───────────────────────────────────────────────────
        AuditLog: {
          type: "object",
          properties: {
            id:         { type: "string", format: "uuid" },
            action:     { type: "string", example: "vendor.document.uploaded" },
            module:     { type: "string", example: "vendors" },
            entityId:   { type: "string", format: "uuid", nullable: true },
            entityType: { type: "string", nullable: true },
            actorId:    { type: "string", format: "uuid", nullable: true },
            actorEmail: { type: "string", format: "email", nullable: true },
            ipAddress:  { type: "string", nullable: true },
            metadata:   { type: "object", nullable: true },
            createdAt:  { type: "string", format: "date-time" },
          },
        },

        // ── Notification / alert schema ─────────────────────────────────────────
        GovernanceAlert: {
          type: "object",
          properties: {
            id:         { type: "string", format: "uuid" },
            title:      { type: "string" },
            message:    { type: "string" },
            severity:   { type: "string", enum: ["critical", "high", "medium", "low"] },
            alertType:  { type: "string" },
            status:     { type: "string", enum: ["open", "resolved"] },
            entityId:   { type: "string", format: "uuid", nullable: true },
            entityType: { type: "string", nullable: true },
            createdAt:  { type: "string", format: "date-time" },
            resolvedAt: { type: "string", format: "date-time", nullable: true },
          },
        },
      },
    },

    // ── Paths ──────────────────────────────────────────────────────────────────
    paths: {

      // ─────────────────────────────────────────────────────────────────────────
      // VENDOR ENDPOINTS
      // ─────────────────────────────────────────────────────────────────────────
      "/vendors": {
        get: {
          tags: ["Vendors"],
          summary: "List vendors",
          description: "Returns a paginated list of vendors for the authenticated organisation.",
          operationId: "listVendors",
          parameters: [
            pageParam, pageSizeParam,
            { name: "q",         in: "query", schema: { type: "string" },        description: "Text search in vendor name." },
            { name: "status",    in: "query", schema: { type: "string" },        description: "Filter by vendor status (active, inactive, pending, archived)." },
            { name: "riskLevel", in: "query", schema: { type: "string" },        description: "Filter by risk level (low, medium, high, critical)." },
          ],
          responses: standardResponses(paginatedResponse("#/components/schemas/Vendor"), "Paginated vendor list."),
        },
      },

      "/vendors/{id}": {
        get: {
          tags: ["Vendors"],
          summary: "Get vendor",
          description: "Returns a single vendor by ID.",
          operationId: "getVendor",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/Vendor" } } }, "Vendor detail."),
        },
      },

      "/vendors/{id}/trust-score": {
        get: {
          tags: ["Vendors", "Trust Score"],
          summary: "Get vendor Trust Score",
          description: "Returns the current Trust Score™ with component breakdown, 30-day history, and AI narrative.",
          operationId: "getVendorTrustScore",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/VendorTrustScore" } } }, "Vendor Trust Score."),
        },
      },

      // ─────────────────────────────────────────────────────────────────────────
      // RISK ENDPOINTS
      // ─────────────────────────────────────────────────────────────────────────
      "/risks": {
        get: {
          tags: ["Risks"],
          summary: "List risks",
          description: "Returns a paginated list of risks. Supports filtering by status and category.",
          operationId: "listRisks",
          parameters: [
            pageParam, pageSizeParam,
            { name: "status",   in: "query", schema: { type: "string" }, description: "Filter by risk status." },
            { name: "category", in: "query", schema: { type: "string" }, description: "Filter by risk category." },
          ],
          responses: standardResponses(paginatedResponse("#/components/schemas/Risk"), "Paginated risk list."),
        },
        post: {
          tags: ["Risks"],
          summary: "Create risk",
          description: "Creates a new risk. Requires `read_write` permission.",
          operationId: "createRisk",
          security: [{ bearerAuth: ["read_write"] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/RiskInput" } } },
          },
          responses: {
            ...standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/Risk" } } }),
            200: undefined,
            201: { description: "Risk created.", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Risk" } } } } } },
          },
        },
      },

      "/risks/{id}": {
        get: {
          tags: ["Risks"],
          summary: "Get risk",
          description: "Returns a single risk with treatments and reviews.",
          operationId: "getRisk",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/Risk" } } }),
        },
        put: {
          tags: ["Risks"],
          summary: "Update risk",
          description: "Updates an existing risk. Requires `read_write` permission.",
          operationId: "updateRisk",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/RiskInput" } } },
          },
          responses: standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/Risk" } } }),
        },
        delete: {
          tags: ["Risks"],
          summary: "Delete risk",
          description: "Deletes a risk and all associated data. Requires `read_write` permission.",
          operationId: "deleteRisk",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: standardResponses({ type: "object", properties: { data: { type: "object", properties: { deleted: { type: "boolean" } } } } }),
        },
      },

      // ─────────────────────────────────────────────────────────────────────────
      // COMPLIANCE ENDPOINTS
      // ─────────────────────────────────────────────────────────────────────────
      "/compliance/frameworks": {
        get: {
          tags: ["Compliance"],
          summary: "List compliance frameworks",
          description: "Returns all compliance frameworks with their readiness scores.",
          operationId: "listFrameworks",
          responses: standardResponses({
            type: "object",
            properties: { data: { type: "array", items: { $ref: "#/components/schemas/Framework" } } },
          }, "Frameworks list."),
        },
      },

      "/compliance/gaps": {
        get: {
          tags: ["Compliance"],
          summary: "List compliance gaps",
          description: "Returns open compliance gaps, optionally filtered by severity or resolved status.",
          operationId: "listComplianceGaps",
          parameters: [
            { name: "severity", in: "query", schema: { type: "string", enum: ["critical", "high", "medium", "low"] }, description: "Filter by severity." },
            { name: "resolved", in: "query", schema: { type: "boolean" }, description: "Include resolved gaps (default: false)." },
          ],
          responses: standardResponses({
            type: "object",
            properties: { data: { type: "array", items: { $ref: "#/components/schemas/ComplianceGap" } } },
          }, "Compliance gaps."),
        },
      },

      // ─────────────────────────────────────────────────────────────────────────
      // AUDIT ENDPOINTS
      // ─────────────────────────────────────────────────────────────────────────
      "/audits": {
        get: {
          tags: ["Audits"],
          summary: "List audits",
          description: "Returns a paginated list of audits.",
          operationId: "listAudits",
          parameters: [
            pageParam, pageSizeParam,
            { name: "status", in: "query", schema: { type: "string" }, description: "Filter by audit status." },
            { name: "type",   in: "query", schema: { type: "string" }, description: "Filter by audit type." },
          ],
          responses: standardResponses(paginatedResponse("#/components/schemas/Audit"), "Paginated audit list."),
        },
        post: {
          tags: ["Audits"],
          summary: "Create audit",
          description: "Creates a new audit. Requires `read_write` permission.",
          operationId: "createAudit",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuditInput" } } },
          },
          responses: {
            ...standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/Audit" } } }),
            200: undefined,
            201: { description: "Audit created.", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Audit" } } } } } },
          },
        },
      },

      "/audits/{id}": {
        get: {
          tags: ["Audits"],
          summary: "Get audit",
          description: "Returns a single audit with its findings.",
          operationId: "getAudit",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/Audit" } } }),
        },
        put: {
          tags: ["Audits"],
          summary: "Update audit",
          description: "Updates an existing audit. Requires `read_write` permission.",
          operationId: "updateAudit",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuditInput" } } },
          },
          responses: standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/Audit" } } }),
        },
        delete: {
          tags: ["Audits"],
          summary: "Delete audit",
          description: "Deletes an audit and all associated data. Requires `read_write` permission.",
          operationId: "deleteAudit",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: standardResponses({ type: "object", properties: { data: { type: "object", properties: { deleted: { type: "boolean" } } } } }),
        },
      },

      // ─────────────────────────────────────────────────────────────────────────
      // FINDINGS & CAPAs
      // ─────────────────────────────────────────────────────────────────────────
      "/findings": {
        get: {
          tags: ["Findings & CAPAs"],
          summary: "List findings",
          description: "Returns org-wide audit findings, optionally filtered.",
          operationId: "listFindings",
          parameters: [
            pageParam, pageSizeParam,
            { name: "severity", in: "query", schema: { type: "string" }, description: "Filter by finding severity." },
            { name: "status",   in: "query", schema: { type: "string" }, description: "Filter by finding status." },
            { name: "auditId",  in: "query", schema: { type: "string", format: "uuid" }, description: "Filter by audit ID." },
          ],
          responses: standardResponses(paginatedResponse("#/components/schemas/Finding"), "Findings list."),
        },
        post: {
          tags: ["Findings & CAPAs"],
          summary: "Create finding",
          description: "Creates a new audit finding. Requires `read_write` permission.",
          operationId: "createFinding",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/FindingInput" } } },
          },
          responses: {
            ...standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/Finding" } } }),
            200: undefined,
            201: { description: "Finding created.", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Finding" } } } } } },
          },
        },
      },

      "/capas": {
        get: {
          tags: ["Findings & CAPAs"],
          summary: "List CAPAs",
          description: "Returns org-wide corrective action and preventive action (CAPA) items.",
          operationId: "listCapas",
          parameters: [
            pageParam, pageSizeParam,
            { name: "status",    in: "query", schema: { type: "string" }, description: "Filter by CAPA status." },
            { name: "findingId", in: "query", schema: { type: "string", format: "uuid" }, description: "Filter by finding ID." },
          ],
          responses: standardResponses(paginatedResponse("#/components/schemas/Capa"), "CAPA list."),
        },
        post: {
          tags: ["Findings & CAPAs"],
          summary: "Create CAPA",
          description: "Creates a corrective/preventive action. Requires `read_write` permission.",
          operationId: "createCapa",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/CapaInput" } } },
          },
          responses: {
            ...standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/Capa" } } }),
            200: undefined,
            201: { description: "CAPA created.", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Capa" } } } } } },
          },
        },
      },

      // ─────────────────────────────────────────────────────────────────────────
      // TRUST INTELLIGENCE
      // ─────────────────────────────────────────────────────────────────────────
      "/trust-intelligence/overview": {
        get: {
          tags: ["Trust Intelligence"],
          summary: "Get Trust Intelligence overview",
          description: "Returns the full Org Trust Score™ with component breakdown, vendor metrics, and risk metrics.",
          operationId: "getTrustIntelligenceOverview",
          responses: standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/OrgTrustOverview" } } }, "Trust Intelligence overview."),
        },
      },

      "/trust-intelligence/org-score": {
        get: {
          tags: ["Trust Intelligence"],
          summary: "Get Org Trust Score",
          description: "Returns the current Organisational Trust Score™ and component breakdown.",
          operationId: "getOrgTrustScore",
          responses: standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/OrgTrustOverview" } } }),
        },
        post: {
          tags: ["Trust Intelligence"],
          summary: "Snapshot Org Trust Score",
          description: "Computes and snapshots the current Org Trust Score™ to governance_snapshots. Requires `read_write`.",
          operationId: "snapshotOrgTrustScore",
          requestBody: {
            required: false,
            content: { "application/json": { schema: { type: "object" } } },
          },
          responses: standardResponses({ type: "object", properties: { data: { type: "object", properties: { snapshotId: { type: "string" }, score: { type: "number" } } } } }),
        },
      },

      "/trust-intelligence/recommendations": {
        get: {
          tags: ["Trust Intelligence"],
          summary: "Get governance recommendations",
          description: "Returns a prioritised list of AI-generated governance actions.",
          operationId: "getTrustIntelligenceRecommendations",
          responses: standardResponses({
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id:          { type: "string" },
                    title:       { type: "string" },
                    category:    { type: "string" },
                    priority:    { type: "string" },
                    trustImpact: { type: "number" },
                    reasons:     { type: "array", items: { type: "string" } },
                    deepLink:    { type: "string" },
                  },
                },
              },
            },
          }),
        },
      },

      // ─────────────────────────────────────────────────────────────────────────
      // CONTRACTS
      // ─────────────────────────────────────────────────────────────────────────
      "/contracts": {
        get: {
          tags: ["Contracts"],
          summary: "List contracts",
          description: "Returns a paginated list of contracts.",
          operationId: "listContracts",
          parameters: [
            pageParam, pageSizeParam,
            { name: "status",       in: "query", schema: { type: "string" }, description: "Filter by contract status." },
            { name: "contractType", in: "query", schema: { type: "string" }, description: "Filter by contract type." },
            { name: "search",       in: "query", schema: { type: "string" }, description: "Text search in contract title." },
          ],
          responses: standardResponses(paginatedResponse("#/components/schemas/Contract"), "Paginated contract list."),
        },
        post: {
          tags: ["Contracts"],
          summary: "Create contract",
          description: "Creates a new contract. Requires `read_write` permission.",
          operationId: "createContract",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/ContractInput" } } },
          },
          responses: {
            ...standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/Contract" } } }),
            200: undefined,
            201: { description: "Contract created.", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Contract" } } } } } },
          },
        },
      },

      "/contracts/{id}": {
        get: {
          tags: ["Contracts"],
          summary: "Get contract",
          description: "Returns a single contract with clauses and obligations.",
          operationId: "getContract",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/Contract" } } }),
        },
        put: {
          tags: ["Contracts"],
          summary: "Update contract",
          description: "Updates an existing contract. Requires `read_write` permission.",
          operationId: "updateContract",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/ContractInput" } } },
          },
          responses: standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/Contract" } } }),
        },
        delete: {
          tags: ["Contracts"],
          summary: "Delete contract",
          description: "Deletes a contract. Requires `read_write` permission.",
          operationId: "deleteContract",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: standardResponses({ type: "object", properties: { data: { type: "object", properties: { deleted: { type: "boolean" } } } } }),
        },
      },

      "/contracts/obligations": {
        get: {
          tags: ["Contracts"],
          summary: "List contract obligations",
          description: "Returns org-wide contract obligation items.",
          operationId: "listContractObligations",
          parameters: [
            pageParam, pageSizeParam,
            { name: "status",     in: "query", schema: { type: "string" }, description: "Filter by obligation status (open, in_progress, completed, overdue, waived)." },
            { name: "contractId", in: "query", schema: { type: "string", format: "uuid" }, description: "Filter by contract ID." },
          ],
          responses: standardResponses({
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id:           { type: "string", format: "uuid" },
                    title:        { type: "string" },
                    status:       { type: "string" },
                    contractId:   { type: "string", format: "uuid" },
                    dueDate:      { type: "string", format: "date", nullable: true },
                  },
                },
              },
            },
          }),
        },
      },

      // ─────────────────────────────────────────────────────────────────────────
      // ISSUES
      // ─────────────────────────────────────────────────────────────────────────
      "/issues": {
        get: {
          tags: ["Issues"],
          summary: "List issues",
          description: "Returns a paginated list of governance issues.",
          operationId: "listIssues",
          parameters: [
            pageParam, pageSizeParam,
            { name: "status",       in: "query", schema: { type: "string" }, description: "Filter by issue status." },
            { name: "severity",     in: "query", schema: { type: "string" }, description: "Filter by severity." },
            { name: "priority",     in: "query", schema: { type: "string" }, description: "Filter by priority." },
            { name: "sourceModule", in: "query", schema: { type: "string" }, description: "Filter by source module (vendors, risks, audits, compliance, etc.)." },
            { name: "search",       in: "query", schema: { type: "string" }, description: "Text search in issue title." },
          ],
          responses: standardResponses(paginatedResponse("#/components/schemas/Issue"), "Paginated issue list."),
        },
        post: {
          tags: ["Issues"],
          summary: "Create issue",
          description: "Creates a new governance issue. Requires `read_write` permission.",
          operationId: "createIssue",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/IssueInput" } } },
          },
          responses: {
            ...standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/Issue" } } }),
            200: undefined,
            201: { description: "Issue created.", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Issue" } } } } } },
          },
        },
      },

      "/issues/{id}": {
        get: {
          tags: ["Issues"],
          summary: "Get issue",
          description: "Returns a single issue with tasks, comments, exceptions, escalations, and history.",
          operationId: "getIssue",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/Issue" } } }),
        },
        put: {
          tags: ["Issues"],
          summary: "Update issue",
          description: "Updates an existing issue. Requires `read_write` permission.",
          operationId: "updateIssue",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/IssueInput" } } },
          },
          responses: standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/Issue" } } }),
        },
        delete: {
          tags: ["Issues"],
          summary: "Delete issue",
          description: "Deletes an issue. Requires `read_write` permission.",
          operationId: "deleteIssue",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: standardResponses({ type: "object", properties: { data: { type: "object", properties: { deleted: { type: "boolean" } } } } }),
        },
      },

      // ─────────────────────────────────────────────────────────────────────────
      // ASSETS
      // ─────────────────────────────────────────────────────────────────────────
      "/assets": {
        get: {
          tags: ["Assets"],
          summary: "List assets",
          description: "Returns a list of enterprise assets. Supports filtering by type, criticality, status, and environment.",
          operationId: "listAssets",
          parameters: [
            pageParam, pageSizeParam,
            { name: "type",        in: "query", schema: { type: "string" }, description: "Filter by asset type." },
            { name: "criticality", in: "query", schema: { type: "string" }, description: "Filter by criticality (critical, high, medium, low)." },
            { name: "status",      in: "query", schema: { type: "string" }, description: "Filter by status." },
            { name: "environment", in: "query", schema: { type: "string" }, description: "Filter by environment (production, staging, development, etc.)." },
          ],
          responses: standardResponses(paginatedResponse("#/components/schemas/Asset"), "Asset list."),
        },
        post: {
          tags: ["Assets"],
          summary: "Create asset",
          description: "Registers a new enterprise asset. Requires `read_write` permission.",
          operationId: "createAsset",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/AssetInput" } } },
          },
          responses: {
            ...standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/Asset" } } }),
            200: undefined,
            201: { description: "Asset created.", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Asset" } } } } } },
          },
        },
      },

      // ─────────────────────────────────────────────────────────────────────────
      // REGULATORY INTELLIGENCE
      // ─────────────────────────────────────────────────────────────────────────
      "/regulations": {
        get: {
          tags: ["Regulatory Intelligence"],
          summary: "List regulations",
          description: "Returns all regulations including 18 built-in global regulations and org-specific ones.",
          operationId: "listRegulations",
          parameters: [
            pageParam, pageSizeParam,
            { name: "category", in: "query", schema: { type: "string" }, description: "Filter by regulatory category." },
          ],
          responses: standardResponses(paginatedResponse("#/components/schemas/Regulation"), "Regulation list."),
        },
      },

      "/obligations": {
        get: {
          tags: ["Regulatory Intelligence"],
          summary: "List obligations",
          description: "Returns compliance obligations extracted from regulations.",
          operationId: "listObligations",
          parameters: [
            pageParam, pageSizeParam,
            { name: "status",       in: "query", schema: { type: "string" }, description: "Filter by obligation status." },
            { name: "regulationId", in: "query", schema: { type: "string", format: "uuid" }, description: "Filter by regulation ID." },
            { name: "priority",     in: "query", schema: { type: "string" }, description: "Filter by priority." },
          ],
          responses: standardResponses(paginatedResponse("#/components/schemas/Obligation"), "Obligation list."),
        },
        post: {
          tags: ["Regulatory Intelligence"],
          summary: "Create obligation",
          description: "Creates a new compliance obligation. Requires `read_write` permission.",
          operationId: "createObligation",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/ObligationInput" } } },
          },
          responses: {
            ...standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/Obligation" } } }),
            200: undefined,
            201: { description: "Obligation created.", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Obligation" } } } } } },
          },
        },
      },

      "/regulatory-changes": {
        get: {
          tags: ["Regulatory Intelligence"],
          summary: "List regulatory changes",
          description: "Returns regulatory amendments and changes.",
          operationId: "listRegulatoryChanges",
          parameters: [
            { name: "status",   in: "query", schema: { type: "string" }, description: "Filter by change status (new, under_review, assessed, actioned, closed)." },
            { name: "severity", in: "query", schema: { type: "string" }, description: "Filter by severity (critical, high, medium, low)." },
          ],
          responses: standardResponses({
            type: "object",
            properties: { data: { type: "array", items: { $ref: "#/components/schemas/RegulatoryChange" } } },
          }),
        },
      },

      "/regulatory-assessments": {
        get: {
          tags: ["Regulatory Intelligence"],
          summary: "List regulatory assessments",
          description: "Returns per-change regulatory impact assessments.",
          operationId: "listRegulatoryAssessments",
          parameters: [pageParam, pageSizeParam],
          responses: standardResponses(paginatedResponse("#/components/schemas/Framework")), // placeholder schema
        },
      },

      "/regulatory-readiness": {
        get: {
          tags: ["Regulatory Intelligence"],
          summary: "Get regulatory readiness",
          description: "Returns the regulatory readiness score and obligation completion metrics.",
          operationId: "getRegulatoryReadiness",
          responses: standardResponses({
            type: "object",
            properties: {
              data: {
                type: "object",
                properties: {
                  readinessScore:         { type: "number", example: 68.5 },
                  implementedObligations: { type: "integer" },
                  totalObligations:       { type: "integer" },
                  criticalOpen:           { type: "integer" },
                },
              },
            },
          }),
        },
      },

      // ─────────────────────────────────────────────────────────────────────────
      // AI GOVERNANCE
      // ─────────────────────────────────────────────────────────────────────────
      "/ai/systems": {
        get: {
          tags: ["AI Governance"],
          summary: "List AI systems",
          description: "Returns the AI system inventory.",
          operationId: "listAiSystems",
          parameters: [
            pageParam, pageSizeParam,
            { name: "status",    in: "query", schema: { type: "string" }, description: "Filter by system status." },
            { name: "riskLevel", in: "query", schema: { type: "string" }, description: "Filter by risk level." },
            { name: "systemType",in: "query", schema: { type: "string" }, description: "Filter by system type." },
          ],
          responses: standardResponses(paginatedResponse("#/components/schemas/AiSystem"), "AI system list."),
        },
        post: {
          tags: ["AI Governance"],
          summary: "Register AI system",
          description: "Registers a new AI system in the inventory. Requires `read_write` permission.",
          operationId: "createAiSystem",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/AiSystemInput" } } },
          },
          responses: {
            ...standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/AiSystem" } } }),
            200: undefined,
            201: { description: "AI system registered.", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/AiSystem" } } } } } },
          },
        },
      },

      "/ai/risks": {
        get: {
          tags: ["AI Governance"],
          summary: "List AI risks",
          description: "Returns the AI risk register.",
          operationId: "listAiRisks",
          parameters: [
            pageParam, pageSizeParam,
            { name: "status",   in: "query", schema: { type: "string" }, description: "Filter by risk status." },
            { name: "riskLevel",in: "query", schema: { type: "string" }, description: "Filter by risk level." },
            { name: "systemId", in: "query", schema: { type: "string", format: "uuid" }, description: "Filter by AI system ID." },
          ],
          responses: standardResponses(paginatedResponse("#/components/schemas/Risk"), "AI risk list."),
        },
        post: {
          tags: ["AI Governance"],
          summary: "Create AI risk",
          description: "Creates a new AI governance risk. Requires `read_write` permission.",
          operationId: "createAiRisk",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/RiskInput" } } },
          },
          responses: {
            ...standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/Risk" } } }),
            200: undefined,
            201: { description: "AI risk created.", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Risk" } } } } } },
          },
        },
      },

      "/ai/compliance": {
        get: {
          tags: ["AI Governance"],
          summary: "List AI compliance records",
          description: "Returns AI governance compliance records across frameworks (ISO 42001, NIST AI RMF, EU AI Act, etc.).",
          operationId: "listAiCompliance",
          parameters: [
            { name: "framework", in: "query", schema: { type: "string" }, description: "Filter by framework name." },
          ],
          responses: standardResponses({
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id:            { type: "string", format: "uuid" },
                    framework:     { type: "string" },
                    systemId:      { type: "string", format: "uuid" },
                    readinessScore:{ type: "number" },
                    status:        { type: "string" },
                  },
                },
              },
            },
          }),
        },
      },

      // ─────────────────────────────────────────────────────────────────────────
      // BENCHMARKING
      // ─────────────────────────────────────────────────────────────────────────
      "/benchmarking": {
        get: {
          tags: ["Benchmarking"],
          summary: "Get benchmark overview",
          description: "Returns the full governance benchmarking dashboard — overall score, percentile, maturity level, and 10 category scores.",
          operationId: "getBenchmarkOverview",
          responses: standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/BenchmarkOverview" } } }, "Benchmark overview."),
        },
      },

      "/benchmarking/trust": {
        get: {
          tags: ["Benchmarking"],
          summary: "Get trust benchmark",
          description: "Returns Org Trust Score and Vendor Trust benchmark comparison.",
          operationId: "getBenchmarkTrust",
          responses: standardResponses({ type: "object", properties: { data: { $ref: "#/components/schemas/BenchmarkOverview" } } }),
        },
      },

      "/benchmarking/rankings": {
        get: {
          tags: ["Benchmarking"],
          summary: "Get governance rankings",
          description: "Returns full rankings across all categories and maturity level.",
          operationId: "getBenchmarkRankings",
          responses: standardResponses({ type: "object", properties: { data: { type: "object" } } }),
        },
      },

      // ─────────────────────────────────────────────────────────────────────────
      // AUDIT LOGS
      // ─────────────────────────────────────────────────────────────────────────
      "/audit-logs": {
        get: {
          tags: ["Platform"],
          summary: "List audit logs",
          description: "Returns the org-wide audit event stream.",
          operationId: "listAuditLogs",
          parameters: [
            pageParam, pageSizeParam,
            { name: "module", in: "query", schema: { type: "string" },        description: "Filter by module name (vendors, compliance, audits, risks, etc.)." },
            { name: "from",   in: "query", schema: { type: "string", format: "date-time" }, description: "Start date-time (ISO 8601)." },
            { name: "to",     in: "query", schema: { type: "string", format: "date-time" }, description: "End date-time (ISO 8601)." },
            { name: "userId", in: "query", schema: { type: "string", format: "uuid" },      description: "Filter by actor user ID." },
          ],
          responses: standardResponses(paginatedResponse("#/components/schemas/AuditLog"), "Audit log events."),
        },
      },

      // ─────────────────────────────────────────────────────────────────────────
      // NOTIFICATIONS
      // ─────────────────────────────────────────────────────────────────────────
      "/notifications": {
        get: {
          tags: ["Platform"],
          summary: "Get governance alerts",
          description: "Returns the top 20 open governance alerts for the notification bell.",
          operationId: "listNotifications",
          responses: standardResponses({
            type: "object",
            properties: { data: { type: "array", maxItems: 20, items: { $ref: "#/components/schemas/GovernanceAlert" } } },
          }, "Open governance alerts."),
        },
      },

      // ─────────────────────────────────────────────────────────────────────────
      // HEALTH CHECK (public)
      // ─────────────────────────────────────────────────────────────────────────
      "/../health": {
        get: {
          tags: ["Platform"],
          summary: "Health check",
          description: "Liveness/readiness probe. Returns DB latency and service config status. No auth required.",
          operationId: "healthCheck",
          security: [],
          responses: {
            200: {
              description: "Platform is healthy.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      checks: {
                        type: "object",
                        properties: {
                          db:         { type: "object", properties: { ok: { type: "boolean" }, latencyMs: { type: "integer" } } },
                          ai:         { type: "object", properties: { ok: { type: "boolean" } } },
                          email:      { type: "object", properties: { ok: { type: "boolean" } } },
                          storage:    { type: "object", properties: { ok: { type: "boolean" } } },
                          encryption: { type: "object", properties: { ok: { type: "boolean" } } },
                        },
                      },
                    },
                  },
                },
              },
            },
            503: { description: "One or more services are unhealthy." },
          },
        },
      },
    },

    // ── Tags ───────────────────────────────────────────────────────────────────
    tags: [
      { name: "Vendors",                  description: "Vendor Hub™ — vendor registry, documents, and assessments." },
      { name: "Trust Score",              description: "Trust Score™ — 7-component vendor trust scoring engine." },
      { name: "Risks",                    description: "Risk Lens™ — risk registry, treatments, and reviews." },
      { name: "Compliance",               description: "Evidence Vault™ — frameworks, controls, evidence, gaps." },
      { name: "Audits",                   description: "Audit Management™ — audit lifecycle from plan to report." },
      { name: "Findings & CAPAs",         description: "Audit findings and corrective/preventive actions." },
      { name: "Trust Intelligence",       description: "Trust Intelligence™ — Org Trust Score™ and governance insights." },
      { name: "Contracts",                description: "Contract Governance™ — contract library and obligations." },
      { name: "Issues",                   description: "Issue & Remediation Hub™ — governance issues and remediation tasks." },
      { name: "Assets",                   description: "Asset Intelligence™ — enterprise asset registry and trust mapping." },
      { name: "Regulatory Intelligence",  description: "Regulatory Intelligence™ — regulations, obligations, and change monitoring." },
      { name: "AI Governance",            description: "AI Governance™ — AI system inventory, risks, and compliance." },
      { name: "Benchmarking",             description: "Governance Benchmarking™ — industry peer comparison." },
      { name: "Platform",                 description: "Platform utilities — audit logs, notifications, health." },
    ],

    "x-tagGroups": [
      { name: "Vendor Governance", tags: ["Vendors", "Trust Score", "Contracts", "Assets"] },
      { name: "Risk & Compliance",  tags: ["Risks", "Compliance", "Audits", "Findings & CAPAs", "Issues"] },
      { name: "Intelligence",       tags: ["Trust Intelligence", "Benchmarking", "AI Governance", "Regulatory Intelligence"] },
      { name: "Platform",           tags: ["Platform"] },
    ],
  };
}
