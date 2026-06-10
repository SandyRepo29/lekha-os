import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  date,
  integer,
  bigint,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  numeric,
  varchar,
  doublePrecision,
} from "drizzle-orm/pg-core";

/* ============================================================
   Enums
   ============================================================ */
export const membershipRole = pgEnum("membership_role", [
  "owner",
  "admin",
  "member",
  "viewer",
  "compliance_manager",
  "security_manager",
  "procurement_manager",
]);

export const industryType = pgEnum("industry_type", [
  "saas",
  "it_services",
  "fintech",
  "healthcare",
  "manufacturing",
  "government",
  "education",
  "other",
]);

export const companySizeRange = pgEnum("company_size_range", [
  "1_10",
  "11_50",
  "51_200",
  "201_500",
  "501_1000",
  "1000_plus",
]);

export const apiKeyStatus = pgEnum("api_key_status", ["active", "revoked"]);

export const apiKeyPermission = pgEnum("api_key_permission", [
  "read_only",
  "read_write",
  "admin",
]);

export const integrationProvider = pgEnum("integration_provider", [
  "resend",
  "smtp",
  "google_workspace",
  "microsoft_365",
  "slack",
  "teams",
  "whatsapp",
  "google_drive",
  "onedrive",
  "sharepoint",
]);

export const integrationStatus = pgEnum("integration_status", [
  "connected",
  "disconnected",
  "error",
  "pending",
]);

export const vendorStatus = pgEnum("vendor_status", [
  "active",
  "pending",
  "inactive",
]);

export const riskLevel = pgEnum("risk_level", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const documentStatus = pgEnum("document_status", [
  "valid",
  "expiring",
  "expired",
  "missing",
]);

export const documentCategory = pgEnum("document_category", [
  "security",
  "privacy",
  "legal",
  "financial",
  "quality",
  "operational",
  "other",
]);

export const requestStatus = pgEnum("request_status", [
  "requested",
  "submitted",
  "approved",
  "rejected",
  "expired",
]);

export const reviewType = pgEnum("review_type", [
  "annual",
  "quarterly",
  "security",
  "compliance",
]);

export const reviewStatus = pgEnum("review_status", [
  "pending",
  "approved",
  "rejected",
  "needs_followup",
]);

export const assessmentAnswer = pgEnum("assessment_answer", [
  "yes",
  "no",
  "partial",
  "na",
]);

/* ============================================================
   Tenancy
   ============================================================ */

/** A customer organization — the tenant boundary for all data. */
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  legalName: text("legal_name"),
  industry: industryType("industry"),
  companySize: companySizeRange("company_size"),
  website: text("website"),
  country: text("country").default("India"),
  state: text("state"),
  timezone: text("timezone").default("Asia/Kolkata"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Mirrors auth.users (id === Supabase auth uid). Profile metadata. */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  jobTitle: text("job_title"),
  department: text("department"),
  phone: text("phone"),
  timezone: text("timezone").default("Asia/Kolkata"),
  language: text("language").default("en"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Join table: which users belong to which org, and their role. */
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: membershipRole("role").notNull().default("member"),
    department: text("department"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("memberships_org_user_uniq").on(t.organizationId, t.userId),
    index("memberships_user_idx").on(t.userId),
  ]
);

/* ============================================================
   Vendor Governance
   ============================================================ */

export const vendors = pgTable(
  "vendors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category"),
    contactEmail: text("contact_email"),
    status: vendorStatus("status").notNull().default("pending"),
    riskLevel: riskLevel("risk_level").notNull().default("medium"),
    /** 0–100 derived compliance score. */
    complianceScore: integer("compliance_score").notNull().default(0),
    notes: text("notes"),
    /** AI-generated executive summary. */
    aiSummary: text("ai_summary"),
    aiSummaryAt: timestamp("ai_summary_at", { withTimezone: true }),
    /** AI-generated score explanation (plain-English why). */
    aiScoreExplanation: text("ai_score_explanation"),
    aiScoreExplainedAt: timestamp("ai_score_explained_at", { withTimezone: true }),
    /** AI-generated risk narrative. */
    aiRiskExplanation: text("ai_risk_explanation"),
    aiRiskExplainedAt: timestamp("ai_risk_explained_at", { withTimezone: true }),
    /** AI-generated recommended actions (JSON array). */
    aiRecommendedActions: jsonb("ai_recommended_actions"),
    aiActionsGeneratedAt: timestamp("ai_actions_generated_at", { withTimezone: true }),
    /** Internal owner — the person accountable for this vendor. */
    ownerName: text("owner_name"),
    ownerEmail: text("owner_email"),
    ownerDepartment: text("owner_department"),
    /** Vendor type template assigned (e.g. "cloud_provider", "saas_vendor"). */
    vendorTypeId: uuid("vendor_type_id"),
    /** Onboarding checklist completion 0–100. */
    checklistScore: integer("checklist_score").notNull().default(0),
    /** Trust Score™ — 0–100 computed from 6 governance signals. */
    trustScore: integer("trust_score"),
    trustScoreAt: timestamp("trust_score_at", { withTimezone: true }),
    /** AI-generated trust narrative (board-ready summary). */
    aiTrustNarrative: text("ai_trust_narrative"),
    aiTrustNarrativeAt: timestamp("ai_trust_narrative_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("vendors_org_idx").on(t.organizationId),
    index("vendors_owner_idx").on(t.organizationId, t.ownerEmail),
  ]
);

export const vendorDocuments = pgTable(
  "vendor_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    documentType: text("document_type").notNull(),
    /** Original file name as uploaded by the user. */
    filename: text("filename"),
    /** MIME type (e.g. "application/pdf"). */
    contentType: text("content_type"),
    /** File size in bytes. */
    fileSize: bigint("file_size", { mode: "number" }),
    /** Storage provider key (e.g. "supabase"). References storage_providers.name. */
    storageProvider: text("storage_provider").default("supabase"),
    /** Bucket name where the file lives. Used for bucket-aware downloads/deletes. */
    storageBucket: text("storage_bucket").default("vendor-documents"),
    storagePath: text("storage_path"),
    /** SHA-256 hex digest of the file content for integrity verification. */
    checksum: text("checksum"),
    /** User who uploaded the file. */
    uploadedBy: uuid("uploaded_by").references(() => profiles.id),
    status: documentStatus("status").notNull().default("missing"),
    /** AI-classified document category. */
    category: documentCategory("category"),
    issuedOn: date("issued_on"),
    expiresOn: date("expires_on"),
    /** Structured fields extracted by Lekha AI (v2: richer metadata). */
    extracted: jsonb("extracted"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("vendor_documents_org_idx").on(t.organizationId),
    index("vendor_documents_vendor_idx").on(t.vendorId),
    index("vendor_documents_expiry_idx").on(t.organizationId, t.expiresOn),
  ]
);

/* ============================================================
   Vendor Type Templates
   ============================================================ */

export const vendorTypes = pgTable(
  "vendor_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("vendor_types_org_idx").on(t.organizationId)]
);

/** Required document types for a vendor type template. */
export const vendorTypeDocuments = pgTable(
  "vendor_type_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorTypeId: uuid("vendor_type_id")
      .notNull()
      .references(() => vendorTypes.id, { onDelete: "cascade" }),
    documentType: text("document_type").notNull(),
    isRequired: boolean("is_required").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("vendor_type_docs_type_idx").on(t.vendorTypeId)]
);

/* ============================================================
   Document Requests
   ============================================================ */

export const documentRequests = pgTable(
  "document_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    documentType: text("document_type").notNull(),
    message: text("message"),
    dueDate: date("due_date"),
    priority: text("priority").notNull().default("medium"),
    status: requestStatus("status").notNull().default("requested"),
    requestedBy: uuid("requested_by").references(() => profiles.id),
    completedDocumentId: uuid("completed_document_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("doc_requests_org_idx").on(t.organizationId),
    index("doc_requests_vendor_idx").on(t.vendorId),
  ]
);

/* ============================================================
   Security Assessments
   ============================================================ */

export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    score: integer("score"),
    status: text("status").notNull().default("draft"),
    conductedBy: uuid("conducted_by").references(() => profiles.id),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    /** AI-generated narrative summary of the assessment results. */
    aiSummary: text("ai_summary"),
    aiSummaryAt: timestamp("ai_summary_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("assessments_vendor_idx").on(t.vendorId)]
);

export const assessmentResponses = pgTable(
  "assessment_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    questionKey: text("question_key").notNull(),
    answer: assessmentAnswer("answer"),
    notes: text("notes"),
  },
  (t) => [uniqueIndex("assessment_response_uniq").on(t.assessmentId, t.questionKey)]
);

/* ============================================================
   Vendor Reviews
   ============================================================ */

export const vendorReviews = pgTable(
  "vendor_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    reviewType: reviewType("review_type").notNull(),
    status: reviewStatus("review_status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => profiles.id),
    summary: text("summary"),
    nextReviewAt: date("next_review_at"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("reviews_vendor_idx").on(t.vendorId)]
);

/* ============================================================
   Vendor Portal
   ============================================================ */

export const vendorPortalTokens = pgTable(
  "vendor_portal_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("portal_tokens_vendor_idx").on(t.vendorId),
    index("portal_tokens_token_idx").on(t.token),
  ]
);

/* ============================================================
   Notification Preferences + History
   ============================================================ */

export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .unique()
    .references(() => organizations.id, { onDelete: "cascade" }),
  expiryAlertsEnabled: boolean("expiry_alerts_enabled").notNull().default(true),
  weeklyDigestEnabled: boolean("weekly_digest_enabled").notNull().default(true),
  recipientEmails: jsonb("recipient_emails").default([]),
  alertDaysBefore: jsonb("alert_days_before").default([90, 60, 30, 15, 7]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notificationHistory = pgTable(
  "notification_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    notificationType: text("notification_type").notNull(),
    entityId: uuid("entity_id"),
    sentTo: jsonb("sent_to").notNull(),
    resendId: text("resend_id"),
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("notif_history_org_idx").on(t.organizationId, t.sentAt),
    index("notif_history_dedup_idx").on(t.organizationId, t.notificationType, t.entityId),
  ]
);

/* ============================================================
   Audit log
   ============================================================ */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => profiles.id),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    /** Client IP address captured at the transport layer. */
    ipAddress: text("ip_address"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("audit_logs_org_idx").on(t.organizationId, t.createdAt)]
);

/* ============================================================
   Data Governance — Storage Provider Registry
   ============================================================ */

/**
 * Registry of storage providers available to the platform.
 * Phase 1: single "supabase" (platform-managed) entry.
 * Future: customer-owned S3, Azure Blob, SharePoint, OneDrive, Google Drive.
 * Documents reference this table via storageProvider (name key).
 */
export const storageProviders = pgTable("storage_providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Short key referenced by vendor_documents.storage_provider (e.g. "supabase"). */
  name: text("name").notNull().unique(),
  /** "platform" = Lekha-managed; "customer" = customer-owned (future). */
  type: text("type").notNull().default("platform"),
  isActive: boolean("is_active").notNull().default(true),
  /** Provider-specific config — region, endpoint, bucket, etc. */
  configJson: jsonb("config_json").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ============================================================
   Settings Module — Tables
   ============================================================ */

/** Org-level branding and report customization settings. */
export const organizationSettings = pgTable("organization_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .unique()
    .references(() => organizations.id, { onDelete: "cascade" }),
  primaryColor: text("primary_color").default("#6366f1"),
  accentColor: text("accent_color").default("#8b5cf6"),
  reportFooter: text("report_footer"),
  emailSignature: text("email_signature"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Authentication event history per user. */
export const loginHistory = pgTable(
  "login_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    location: text("location"),
    /** success | failed | suspicious */
    status: text("status").notNull().default("success"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("login_history_org_idx").on(t.organizationId),
    index("login_history_user_idx").on(t.userId, t.createdAt),
  ]
);

/** Available subscription plans (seeded at setup). */
export const billingPlans = pgTable("billing_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  priceMonthly: integer("price_monthly").notNull().default(0),
  priceYearly: integer("price_yearly").notNull().default(0),
  features: jsonb("features").default([]),
  maxUsers: integer("max_users").notNull().default(5),
  maxVendors: integer("max_vendors").notNull().default(10),
  maxStorageGb: integer("max_storage_gb").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Active subscription per org. */
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .unique()
    .references(() => organizations.id, { onDelete: "cascade" }),
  planId: uuid("plan_id")
    .notNull()
    .references(() => billingPlans.id),
  /** active | trial | cancelled | past_due */
  status: text("status").notNull().default("trial"),
  /** monthly | yearly | trial */
  billingCycle: text("billing_cycle").notNull().default("trial"),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).defaultNow(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** API keys for programmatic access. Plain key shown once; only hash stored. */
export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by").references(() => profiles.id),
    name: text("name").notNull(),
    /** First 8 chars of the plain key for display (e.g. "lk_live_"). */
    keyPrefix: text("key_prefix").notNull(),
    /** bcrypt hash of the full key — never returned to client. */
    keyHash: text("key_hash").notNull(),
    permissions: apiKeyPermission("permissions").notNull().default("read_only"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    status: apiKeyStatus("status").notNull().default("active"),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("api_keys_org_idx").on(t.organizationId)]
);

/** External integration connections per org. One row per provider. */
export const integrations = pgTable(
  "integrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    provider: integrationProvider("provider").notNull(),
    displayName: text("display_name").notNull(),
    /** Provider-specific config (API keys, host, etc.) — plaintext for now. */
    config: jsonb("config").default({}),
    status: integrationStatus("status").notNull().default("disconnected"),
    connectedAt: timestamp("connected_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("integrations_org_provider_uniq").on(t.organizationId, t.provider),
    index("integrations_org_idx").on(t.organizationId),
  ]
);

/* ============================================================
   Audit Management — Enums
   ============================================================ */

export const auditType = pgEnum("audit_type", [
  "internal",
  "external",
  "vendor",
  "security",
  "compliance",
  "regulatory",
]);

export const auditStatus = pgEnum("audit_status", [
  "planned",
  "in_progress",
  "completed",
  "cancelled",
]);

export const auditProgramStatus = pgEnum("audit_program_status", [
  "pending",
  "reviewed",
  "passed",
  "failed",
]);

export const findingSeverity = pgEnum("finding_severity", [
  "critical",
  "high",
  "medium",
  "low",
]);

export const findingStatus = pgEnum("finding_status", [
  "open",
  "accepted",
  "remediating",
  "closed",
]);

export const correctiveActionStatus = pgEnum("corrective_action_status", [
  "open",
  "in_progress",
  "completed",
  "overdue",
]);

/* ============================================================
   Compliance Module — Enums
   ============================================================ */

export const frameworkStatus = pgEnum("framework_status", [
  "not_started",
  "in_progress",
  "ready",
  "certified",
  "expired",
]);

export const controlStatus = pgEnum("control_status", [
  "implemented",
  "partial",
  "not_implemented",
  "not_applicable",
]);

export const controlPriority = pgEnum("control_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const evidenceStatus = pgEnum("evidence_status", [
  "draft",
  "pending_review",
  "approved",
  "expired",
  "archived",
]);

export const evidenceSource = pgEnum("evidence_source", [
  "vendor_document",
  "vendor_assessment",
  "vendor_review",
  "manual",
  "policy",
]);

export const policyStatus = pgEnum("policy_status", [
  "draft",
  "review",
  "approved",
  "archived",
  "expired",
  "published",
  "retired",
]);

/* ============================================================
   Policy Governance™ — Enums
   ============================================================ */

export const policyReviewOutcome = pgEnum("policy_review_outcome", [
  "approved",
  "changes_required",
  "rejected",
  "expired",
]);

export const attestationStatus = pgEnum("attestation_status", [
  "pending",
  "acknowledged",
  "rejected",
  "overdue",
]);

/* ============================================================
   Control Center™ — Enums
   ============================================================ */

export const controlType = pgEnum("control_type", [
  "preventive",
  "detective",
  "corrective",
  "compensating",
  "administrative",
  "technical",
  "physical",
  "hybrid",
]);

export const controlFrequency = pgEnum("control_frequency", [
  "continuous",
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "semi_annual",
  "annual",
  "ad_hoc",
]);

export const automationLevel = pgEnum("automation_level", [
  "manual",
  "semi_automated",
  "automated",
  "ai_assisted",
]);

export const controlTestResult = pgEnum("control_test_result", [
  "passed",
  "failed",
  "partially_effective",
  "exception",
  "not_tested",
]);

/* ============================================================
   Compliance Module — Tables
   ============================================================ */

/** A compliance framework the org is working towards (ISO 27001, SOC 2, etc.) */
export const frameworks = pgTable(
  "frameworks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    version: text("version"),
    owner: text("owner"),
    status: frameworkStatus("status").notNull().default("not_started"),
    reviewDate: date("review_date"),
    /** AI-generated narrative summary of framework readiness. */
    aiSummary: text("ai_summary"),
    aiSummaryAt: timestamp("ai_summary_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("frameworks_org_idx").on(t.organizationId)]
);

/** Individual control — platform entity (framework link is optional). */
export const controls = pgTable(
  "controls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    /** Legacy single-framework FK — nullable so controls can be standalone. */
    frameworkId: uuid("framework_id").references(() => frameworks.id, {
      onDelete: "cascade",
    }),
    /** Human-readable reference code, e.g. "A.5.1", "CC1.2", "Req 1". */
    controlRef: text("control_ref").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    objective: text("objective"),
    category: text("category"),
    /** Text owner label (legacy / compliance module). */
    owner: text("owner"),
    /** Structured owner FK — used by Control Center™. */
    ownerId: uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
    status: controlStatus("status").notNull().default("not_implemented"),
    priority: controlPriority("priority").notNull().default("medium"),
    controlType: controlType("control_type"),
    frequency: controlFrequency("frequency"),
    automationLevel: automationLevel("automation_level").default("manual"),
    healthScore: integer("health_score"),
    effectivenessScore: integer("effectiveness_score"),
    reviewDate: date("review_date"),
    nextReviewDate: date("next_review_date"),
    lastTested: date("last_tested"),
    nextTestDate: date("next_test_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("controls_org_idx").on(t.organizationId),
    index("controls_framework_idx").on(t.frameworkId),
  ]
);

/** A piece of evidence that satisfies one or more controls. */
export const evidence = pgTable(
  "evidence",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    source: evidenceSource("source").notNull().default("manual"),
    /**
     * Polymorphic FK — points to vendor_documents.id, assessments.id, or
     * vendor_reviews.id depending on the source value.
     */
    sourceEntityId: uuid("source_entity_id"),
    owner: text("owner"),
    expiresOn: date("expires_on"),
    status: evidenceStatus("status").notNull().default("draft"),
    storagePath: text("storage_path"),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("evidence_org_idx").on(t.organizationId),
    index("evidence_source_idx").on(t.organizationId, t.source),
    index("evidence_expiry_idx").on(t.organizationId, t.expiresOn),
  ]
);

/** Many-to-many: which evidence satisfies which control. */
export const controlEvidenceMappings = pgTable(
  "control_evidence_mappings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    controlId: uuid("control_id")
      .notNull()
      .references(() => controls.id, { onDelete: "cascade" }),
    evidenceId: uuid("evidence_id")
      .notNull()
      .references(() => evidence.id, { onDelete: "cascade" }),
    /** "manual" or "ai_suggested" */
    mappingType: text("mapping_type").notNull().default("manual"),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("control_evidence_uniq").on(t.controlId, t.evidenceId),
    index("cem_control_idx").on(t.controlId),
    index("cem_evidence_idx").on(t.evidenceId),
  ]
);

/** Organisational compliance policies with version history. */
export const policies = pgTable(
  "policies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    policyType: text("policy_type"),
    version: text("version").notNull().default("1.0"),
    owner: text("owner"),
    ownerId: uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
    status: policyStatus("status").notNull().default("draft"),
    reviewDate: date("review_date"),
    nextReviewDate: date("next_review_date"),
    effectiveDate: date("effective_date"),
    approvalDate: date("approval_date"),
    approver: text("approver"),
    storagePath: text("storage_path"),
    healthScore: integer("health_score").default(0),
    attestationRequired: boolean("attestation_required").default(false),
    audience: text("audience").default("everyone"),
    changeSummary: text("change_summary"),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("policies_org_idx").on(t.organizationId)]
);

/** Immutable version snapshot for a policy document. */
export const policyVersions = pgTable(
  "policy_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    policyId: uuid("policy_id")
      .notNull()
      .references(() => policies.id, { onDelete: "cascade" }),
    version: text("version").notNull(),
    storagePath: text("storage_path"),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => profiles.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("policy_versions_policy_idx").on(t.policyId)]
);

/**
 * Materialised readiness score per framework.
 * Recomputed by readiness-service whenever controls/evidence/policies change.
 */
export const readinessScores = pgTable(
  "readiness_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    frameworkId: uuid("framework_id")
      .notNull()
      .references(() => frameworks.id, { onDelete: "cascade" }),
    /** 0–100 weighted overall readiness. */
    overallScore: integer("overall_score").notNull().default(0),
    /** % of controls that are Implemented or Partial. */
    controlCoverage: integer("control_coverage").notNull().default(0),
    /** % of controls that have at least one approved evidence item. */
    evidenceCoverage: integer("evidence_coverage").notNull().default(0),
    /** % of applicable policy types that have an approved policy. */
    policyCoverage: integer("policy_coverage").notNull().default(0),
    computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("readiness_org_framework_uniq").on(t.organizationId, t.frameworkId),
    index("readiness_org_idx").on(t.organizationId),
  ]
);

/** Compliance gaps detected by gap-service (rule-based + AI). */
export const gapAnalysis = pgTable(
  "gap_analysis",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    frameworkId: uuid("framework_id")
      .notNull()
      .references(() => frameworks.id, { onDelete: "cascade" }),
    /**
     * missing_control | missing_evidence | expired_evidence |
     * expired_policy | unmapped_control | incomplete_coverage
     */
    gapType: text("gap_type").notNull(),
    controlId: uuid("control_id").references(() => controls.id, { onDelete: "set null" }),
    evidenceId: uuid("evidence_id").references(() => evidence.id, { onDelete: "set null" }),
    description: text("description").notNull(),
    /** low | medium | high | critical */
    severity: text("severity").notNull().default("medium"),
    isAiDetected: boolean("is_ai_detected").notNull().default(false),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("gaps_org_framework_idx").on(t.organizationId, t.frameworkId),
    index("gaps_control_idx").on(t.controlId),
  ]
);

/** Generated compliance reports (PDF metadata + AI narrative payload). */
export const complianceReports = pgTable(
  "compliance_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    /**
     * framework_readiness | control_coverage | evidence_coverage |
     * gap_analysis | policy_status | executive_summary
     */
    reportType: text("report_type").notNull(),
    frameworkId: uuid("framework_id").references(() => frameworks.id, { onDelete: "set null" }),
    generatedBy: uuid("generated_by").references(() => profiles.id),
    storagePath: text("storage_path"),
    aiContent: jsonb("ai_content"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("compliance_reports_org_idx").on(t.organizationId)]
);

/**
 * Cached AI insights for the compliance module.
 * Unique per (org, insightType, targetId) — same stale-data pattern as vendor AI.
 */
export const aiComplianceInsights = pgTable(
  "ai_compliance_insights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    /**
     * framework_summary | control_explanation | gap_summary |
     * readiness_explanation | evidence_suggestion | executive_summary
     */
    insightType: text("insight_type").notNull(),
    /** frameworkId, controlId, or orgId depending on insightType. */
    targetId: uuid("target_id").notNull(),
    content: text("content").notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("ai_insights_type_target_uniq").on(
      t.organizationId,
      t.insightType,
      t.targetId
    ),
    index("ai_insights_org_idx").on(t.organizationId),
  ]
);

/* ============================================================
   Audit Management — Tables
   ============================================================ */

/** A formal audit (internal, external, vendor, regulatory, etc.) */
export const audits = pgTable(
  "audits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    auditType: auditType("audit_type").notNull().default("internal"),
    /** Optional link to a compliance framework. */
    frameworkId: uuid("framework_id").references(() => frameworks.id, { onDelete: "set null" }),
    scope: text("scope"),
    objective: text("objective"),
    /** Internal owner accountable for the audit. */
    ownerId: uuid("owner_id").references(() => profiles.id),
    /** Name of external auditor or audit firm. */
    auditorName: text("auditor_name"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    status: auditStatus("audit_status").notNull().default("planned"),
    /** AI-generated executive summary of the audit. */
    aiSummary: text("ai_summary"),
    aiSummaryAt: timestamp("ai_summary_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("audits_org_idx").on(t.organizationId),
    index("audits_org_status_idx").on(t.organizationId, t.status),
  ]
);

/** Individual checklist items within an audit — one per control or custom item. */
export const auditPrograms = pgTable(
  "audit_programs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    /** Optional control this program item covers. */
    controlId: uuid("control_id").references(() => controls.id, { onDelete: "set null" }),
    expectedEvidence: text("expected_evidence"),
    status: auditProgramStatus("audit_program_status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("audit_programs_audit_idx").on(t.auditId),
    index("audit_programs_org_idx").on(t.organizationId),
  ]
);

/** A finding raised during an audit. */
export const auditFindings = pgTable(
  "audit_findings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    /** Optional control this finding relates to. */
    controlId: uuid("control_id").references(() => controls.id, { onDelete: "set null" }),
    /** Optional evidence item that surfaces this finding. */
    evidenceId: uuid("evidence_id").references(() => evidence.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    severity: findingSeverity("finding_severity").notNull().default("medium"),
    recommendation: text("recommendation"),
    status: findingStatus("finding_status").notNull().default("open"),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("audit_findings_audit_idx").on(t.auditId),
    index("audit_findings_org_idx").on(t.organizationId),
    index("audit_findings_severity_idx").on(t.organizationId, t.severity),
  ]
);

/** Corrective and Preventive Action (CAPA) assigned to resolve a finding. */
export const correctiveActions = pgTable(
  "corrective_actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    findingId: uuid("finding_id")
      .notNull()
      .references(() => auditFindings.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    ownerId: uuid("owner_id").references(() => profiles.id),
    dueDate: date("due_date"),
    status: correctiveActionStatus("corrective_action_status").notNull().default("open"),
    completionNotes: text("completion_notes"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("corrective_actions_finding_idx").on(t.findingId),
    index("corrective_actions_org_idx").on(t.organizationId),
    index("corrective_actions_due_idx").on(t.organizationId, t.dueDate),
  ]
);

/** Metadata record for a generated audit report PDF. */
export const auditReports = pgTable(
  "audit_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    auditId: uuid("audit_id")
      .notNull()
      .references(() => audits.id, { onDelete: "cascade" }),
    reportName: text("report_name").notNull(),
    storagePath: text("storage_path"),
    generatedBy: uuid("generated_by").references(() => profiles.id),
    generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("audit_reports_audit_idx").on(t.auditId),
    index("audit_reports_org_idx").on(t.organizationId),
  ]
);

/* ============================================================
   Risk Lens™ — Enums
   ============================================================ */

export const riskCategory = pgEnum("risk_category", [
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
]);

export const riskStatus = pgEnum("risk_status", [
  "identified",
  "under_assessment",
  "open",
  "mitigating",
  "accepted",
  "transferred",
  "closed",
  "archived",
]);

export const riskTreatmentStrategy = pgEnum("risk_treatment_strategy", [
  "mitigate",
  "accept",
  "transfer",
  "avoid",
  "monitor",
]);

export const riskSource = pgEnum("risk_source", [
  "manual",
  "vendor",
  "audit_finding",
  "compliance_gap",
  "control_failure",
  "policy_exception",
  "ai_generated",
  "api",
]);

export const riskTreatmentStatus = pgEnum("risk_treatment_status", [
  "open",
  "in_progress",
  "completed",
  "cancelled",
]);

/* ============================================================
   Risk Lens™ — Tables
   ============================================================ */

export const risks = pgTable(
  "risks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    category: riskCategory("category").notNull().default("operational"),
    status: riskStatus("status").notNull().default("identified"),
    ownerId: uuid("owner_id").references(() => profiles.id),
    source: riskSource("source").notNull().default("manual"),
    /** 1-5 scale */
    impact: integer("impact").notNull().default(3),
    /** 1-5 scale */
    likelihood: integer("likelihood").notNull().default(3),
    /** impact * likelihood (1-25) */
    inherentScore: integer("inherent_score").notNull().default(9),
    /** post-treatment residual score (1-25) */
    residualScore: integer("residual_score"),
    treatmentStrategy: riskTreatmentStrategy("treatment_strategy").default("mitigate"),
    targetDate: date("target_date"),
    identifiedDate: date("identified_date"),
    lastReviewedDate: date("last_reviewed_date"),
    nextReviewDate: date("next_review_date"),
    /** Source entity IDs for traceability */
    sourceVendorId: uuid("source_vendor_id").references(() => vendors.id, { onDelete: "set null" }),
    sourceFindingId: uuid("source_finding_id").references(() => auditFindings.id, { onDelete: "set null" }),
    sourceGapId: uuid("source_gap_id").references(() => gapAnalysis.id, { onDelete: "set null" }),
    /** AI-generated narrative */
    aiNarrative: text("ai_narrative"),
    aiNarrativeAt: timestamp("ai_narrative_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("risks_org_idx").on(t.organizationId),
    index("risks_org_status_idx").on(t.organizationId, t.status),
    index("risks_org_category_idx").on(t.organizationId, t.category),
    index("risks_owner_idx").on(t.ownerId),
  ]
);

export const riskReviews = pgTable(
  "risk_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    riskId: uuid("risk_id")
      .notNull()
      .references(() => risks.id, { onDelete: "cascade" }),
    reviewerId: uuid("reviewer_id").references(() => profiles.id),
    reviewDate: date("review_date").notNull(),
    outcome: text("outcome").notNull().default("no_change"),
    notes: text("notes"),
    previousStatus: riskStatus("previous_status"),
    newStatus: riskStatus("new_status"),
    previousScore: integer("previous_score"),
    newScore: integer("new_score"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("risk_reviews_risk_idx").on(t.riskId),
    index("risk_reviews_org_idx").on(t.organizationId),
  ]
);

export const riskTreatments = pgTable(
  "risk_treatments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    riskId: uuid("risk_id")
      .notNull()
      .references(() => risks.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    ownerId: uuid("owner_id").references(() => profiles.id),
    targetDate: date("target_date"),
    status: riskTreatmentStatus("status").notNull().default("open"),
    progressPercent: integer("progress_percent").notNull().default(0),
    evidence: text("evidence"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("risk_treatments_risk_idx").on(t.riskId),
    index("risk_treatments_org_idx").on(t.organizationId),
    index("risk_treatments_due_idx").on(t.organizationId, t.targetDate),
  ]
);

/** Risk ↔ Vendor many-to-many */
export const riskVendors = pgTable(
  "risk_vendors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    riskId: uuid("risk_id").notNull().references(() => risks.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("risk_vendors_uniq").on(t.riskId, t.vendorId),
    index("risk_vendors_vendor_idx").on(t.vendorId),
  ]
);

/** Risk ↔ Control many-to-many */
export const riskControls = pgTable(
  "risk_controls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    riskId: uuid("risk_id").notNull().references(() => risks.id, { onDelete: "cascade" }),
    controlId: uuid("control_id").notNull().references(() => controls.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("risk_controls_uniq").on(t.riskId, t.controlId),
    index("risk_controls_control_idx").on(t.controlId),
  ]
);

/** Risk ↔ AuditFinding many-to-many */
export const riskFindings = pgTable(
  "risk_findings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    riskId: uuid("risk_id").notNull().references(() => risks.id, { onDelete: "cascade" }),
    findingId: uuid("finding_id").notNull().references(() => auditFindings.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("risk_findings_uniq").on(t.riskId, t.findingId),
    index("risk_findings_finding_idx").on(t.findingId),
  ]
);

/** Risk ↔ Policy many-to-many */
export const riskPolicies = pgTable(
  "risk_policies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    riskId: uuid("risk_id").notNull().references(() => risks.id, { onDelete: "cascade" }),
    policyId: uuid("policy_id").notNull().references(() => policies.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("risk_policies_uniq").on(t.riskId, t.policyId),
    index("risk_policies_policy_idx").on(t.policyId),
  ]
);

/** Risk ↔ Framework many-to-many */
export const riskFrameworks = pgTable(
  "risk_frameworks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    riskId: uuid("risk_id").notNull().references(() => risks.id, { onDelete: "cascade" }),
    frameworkId: uuid("framework_id").notNull().references(() => frameworks.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("risk_frameworks_uniq").on(t.riskId, t.frameworkId),
    index("risk_frameworks_framework_idx").on(t.frameworkId),
  ]
);

/** Risk ↔ Evidence many-to-many */
export const riskEvidence = pgTable(
  "risk_evidence",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    riskId: uuid("risk_id").notNull().references(() => risks.id, { onDelete: "cascade" }),
    evidenceId: uuid("evidence_id").notNull().references(() => evidence.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("risk_evidence_uniq").on(t.riskId, t.evidenceId),
    index("risk_evidence_evidence_idx").on(t.evidenceId),
  ]
);

/* ============================================================
   Policy Governance™ — Tables
   ============================================================ */

/** Formal review record for a policy. */
export const policyReviews = pgTable(
  "policy_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    policyId: uuid("policy_id").notNull().references(() => policies.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    reviewerId: uuid("reviewer_id").references(() => profiles.id, { onDelete: "set null" }),
    reviewDate: date("review_date").notNull(),
    outcome: text("outcome").notNull().default("approved"),
    notes: text("notes"),
    nextReviewDate: date("next_review_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("policy_reviews_policy_idx").on(t.policyId),
    index("policy_reviews_org_idx").on(t.organizationId),
  ]
);

/** Attestation record — a user's acknowledgement (or rejection) of a policy version. */
export const policyAttestations = pgTable(
  "policy_attestations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    policyId: uuid("policy_id").notNull().references(() => policies.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    policyVersion: text("policy_version"),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    dueDate: date("due_date"),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("policy_attestations_policy_idx").on(t.policyId),
    index("policy_attestations_org_idx").on(t.organizationId),
    index("policy_attestations_user_idx").on(t.userId),
  ]
);

/** Many-to-many: policy ↔ control. */
export const policyControls = pgTable(
  "policy_controls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    policyId: uuid("policy_id").notNull().references(() => policies.id, { onDelete: "cascade" }),
    controlId: uuid("control_id").notNull().references(() => controls.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("policy_controls_uniq").on(t.policyId, t.controlId),
    index("policy_controls_policy_idx").on(t.policyId),
    index("policy_controls_control_idx").on(t.controlId),
  ]
);

/** Many-to-many: policy ↔ framework. */
export const policyFrameworks = pgTable(
  "policy_frameworks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    policyId: uuid("policy_id").notNull().references(() => policies.id, { onDelete: "cascade" }),
    frameworkId: uuid("framework_id").notNull().references(() => frameworks.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("policy_frameworks_uniq").on(t.policyId, t.frameworkId),
    index("policy_frameworks_policy_idx").on(t.policyId),
    index("policy_frameworks_framework_idx").on(t.frameworkId),
  ]
);

/* ============================================================
   Control Center™ — Tables
   ============================================================ */

/** Many-to-many: a control can satisfy multiple frameworks (Control Center™). */
export const controlFrameworks = pgTable(
  "control_frameworks",
  {
    controlId: uuid("control_id")
      .notNull()
      .references(() => controls.id, { onDelete: "cascade" }),
    frameworkId: uuid("framework_id")
      .notNull()
      .references(() => frameworks.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("control_frameworks_framework_idx").on(t.frameworkId),
  ]
);

/** Many-to-many: a control applies to specific vendors. */
export const controlVendors = pgTable(
  "control_vendors",
  {
    controlId: uuid("control_id")
      .notNull()
      .references(() => controls.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("control_vendors_vendor_idx").on(t.vendorId),
  ]
);

/** Control test run — captures test date, result, tester, method. */
export const controlTests = pgTable(
  "control_tests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    controlId: uuid("control_id")
      .notNull()
      .references(() => controls.id, { onDelete: "cascade" }),
    testDate: date("test_date").notNull(),
    testerId: uuid("tester_id").references(() => profiles.id, { onDelete: "set null" }),
    testerName: text("tester_name"),
    method: text("method"),
    result: controlTestResult("result").notNull().default("not_tested"),
    evidenceRef: text("evidence_ref"),
    comments: text("comments"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("control_tests_control_idx").on(t.controlId),
    index("control_tests_org_idx").on(t.organizationId),
  ]
);

/* ============================================================
   Trust Score™ — History Table
   ============================================================ */

/** Daily snapshots of each vendor's Trust Score™ and component breakdown. */
export const vendorTrustHistory = pgTable(
  "vendor_trust_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    overallScore: integer("overall_score").notNull(),
    evidenceScore: integer("evidence_score").notNull(),
    complianceScore: integer("compliance_score").notNull(),
    riskScore: integer("risk_score").notNull(),
    assessmentScore: integer("assessment_score").notNull(),
    operationalScore: integer("operational_score").notNull(),
    freshnessScore: integer("freshness_score").notNull(),
    /** What triggered this snapshot (document_upload, risk_created, assessment_completed, manual, etc.) */
    triggerEvent: text("trigger_event"),
    snapshotAt: timestamp("snapshot_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("vendor_trust_history_vendor_idx").on(t.vendorId),
    index("vendor_trust_history_org_idx").on(t.organizationId),
    index("vendor_trust_history_snapshot_idx").on(t.vendorId, t.snapshotAt),
  ]
);

/* ============================================================
   Governance Trends™ + Continuous Monitoring™ — Enums
   ============================================================ */

export const alertSeverity = pgEnum("alert_severity", [
  "info",
  "low",
  "medium",
  "high",
  "critical",
]);

export const alertEntityType = pgEnum("alert_entity_type", [
  "vendor",
  "risk",
  "control",
  "audit",
  "evidence",
  "policy",
  "framework",
  "organization",
]);

/* ============================================================
   Trust Intelligence™ — Governance Snapshots
   ============================================================ */

/** Governance monitoring alerts — created by the monitoring engine. */
export const governanceAlerts = pgTable(
  "governance_alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    severity: alertSeverity("severity").notNull().default("medium"),
    title: text("title").notNull(),
    description: text("description"),
    entityType: alertEntityType("entity_type"),
    entityId: uuid("entity_id"),
    status: text("status").notNull().default("open"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedBy: uuid("resolved_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("gov_alerts_org_idx").on(t.organizationId),
    index("gov_alerts_status_idx").on(t.organizationId, t.status),
    index("gov_alerts_severity_idx").on(t.organizationId, t.severity),
  ]
);

/** Daily org-level governance snapshot for trend tracking. */
export const governanceSnapshots = pgTable(
  "governance_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    snapshotDate: date("snapshot_date").notNull(),
    // Organizational Trust Score™
    orgTrustScore: integer("org_trust_score").notNull().default(0),
    // Component scores
    vendorTrustScore: integer("vendor_trust_score").notNull().default(0),
    riskPostureScore: integer("risk_posture_score").notNull().default(0),
    controlHealthScore: integer("control_health_score").notNull().default(0),
    auditReadinessScore: integer("audit_readiness_score").notNull().default(0),
    complianceCoverageScore: integer("compliance_coverage_score").notNull().default(0),
    // Raw counts
    totalVendors: integer("total_vendors").notNull().default(0),
    scoredVendors: integer("scored_vendors").notNull().default(0),
    activeRisks: integer("active_risks").notNull().default(0),
    criticalRisks: integer("critical_risks").notNull().default(0),
    openFindings: integer("open_findings").notNull().default(0),
    avgControlHealth: integer("avg_control_health").notNull().default(0),
    avgFrameworkReadiness: integer("avg_framework_readiness").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("gov_snapshots_org_idx").on(t.organizationId),
    index("gov_snapshots_date_idx").on(t.snapshotDate),
  ]
);

/* ============================================================
   Trust Graph™ — Enums + Tables
   ============================================================ */

export const graphEntityType = pgEnum("graph_entity_type", [
  "vendor",
  "evidence",
  "control",
  "risk",
  "audit",
  "finding",
  "policy",
  "framework",
  "trust_score",
  "org_trust",
]);

export const graphRelationshipType = pgEnum("graph_relationship_type", [
  "vendor_provides_evidence",
  "vendor_has_risk",
  "vendor_linked_control",
  "vendor_has_audit",
  "evidence_supports_control",
  "evidence_in_framework",
  "control_reduces_risk",
  "control_in_audit",
  "control_supported_by_policy",
  "control_in_framework",
  "audit_has_finding",
  "finding_creates_risk",
  "policy_in_framework",
  "risk_affects_trust_score",
  "trust_score_affects_org_trust",
]);

/** Knowledge graph nodes — one per governance entity per org. */
export const graphNodes = pgTable(
  "graph_nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    entityType: graphEntityType("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    name: text("name").notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("graph_nodes_org_idx").on(t.organizationId),
    index("graph_nodes_entity_idx").on(t.organizationId, t.entityType),
    uniqueIndex("graph_nodes_entity_uniq").on(t.organizationId, t.entityType, t.entityId),
  ]
);

/** Knowledge graph edges — directed relationships between nodes. */
export const graphEdges = pgTable(
  "graph_edges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    sourceNodeId: uuid("source_node_id")
      .notNull()
      .references(() => graphNodes.id, { onDelete: "cascade" }),
    targetNodeId: uuid("target_node_id")
      .notNull()
      .references(() => graphNodes.id, { onDelete: "cascade" }),
    relationshipType: graphRelationshipType("relationship_type").notNull(),
    strength: integer("strength").notNull().default(50),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("graph_edges_org_idx").on(t.organizationId),
    index("graph_edges_source_idx").on(t.sourceNodeId),
    index("graph_edges_target_idx").on(t.targetNodeId),
    uniqueIndex("graph_edges_uniq").on(t.organizationId, t.sourceNodeId, t.targetNodeId, t.relationshipType),
  ]
);

/* ============================================================
   Inferred types
   ============================================================ */
export type Organization = typeof organizations.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type VendorDocument = typeof vendorDocuments.$inferSelect;
export type VendorType = typeof vendorTypes.$inferSelect;
export type VendorTypeDocument = typeof vendorTypeDocuments.$inferSelect;
export type DocumentRequest = typeof documentRequests.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type AssessmentResponse = typeof assessmentResponses.$inferSelect;
export type VendorReview = typeof vendorReviews.$inferSelect;
export type VendorPortalToken = typeof vendorPortalTokens.$inferSelect;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type NotificationHistory = typeof notificationHistory.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type StorageProviderRow = typeof storageProviders.$inferSelect;

// Settings Module
export type OrganizationSettings = typeof organizationSettings.$inferSelect;
export type LoginHistory = typeof loginHistory.$inferSelect;
export type BillingPlan = typeof billingPlans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type Integration = typeof integrations.$inferSelect;

// Audit Management Module
export type Audit = typeof audits.$inferSelect;
export type AuditProgram = typeof auditPrograms.$inferSelect;
export type AuditFinding = typeof auditFindings.$inferSelect;
export type CorrectiveAction = typeof correctiveActions.$inferSelect;
export type AuditReport = typeof auditReports.$inferSelect;

// Compliance Module
export type Framework = typeof frameworks.$inferSelect;
export type Control = typeof controls.$inferSelect;
export type Evidence = typeof evidence.$inferSelect;
export type ControlEvidenceMapping = typeof controlEvidenceMappings.$inferSelect;
export type Policy = typeof policies.$inferSelect;
export type PolicyVersion = typeof policyVersions.$inferSelect;
export type ReadinessScore = typeof readinessScores.$inferSelect;
export type GapAnalysisRow = typeof gapAnalysis.$inferSelect;
export type ComplianceReport = typeof complianceReports.$inferSelect;

// Risk Lens™ Module
export type Risk = typeof risks.$inferSelect;
export type RiskReview = typeof riskReviews.$inferSelect;
export type RiskTreatment = typeof riskTreatments.$inferSelect;
export type RiskVendor = typeof riskVendors.$inferSelect;
export type RiskControl = typeof riskControls.$inferSelect;
export type RiskFinding = typeof riskFindings.$inferSelect;
export type RiskPolicy = typeof riskPolicies.$inferSelect;
export type RiskFramework = typeof riskFrameworks.$inferSelect;
export type RiskEvidenceLink = typeof riskEvidence.$inferSelect;
export type AiComplianceInsight = typeof aiComplianceInsights.$inferSelect;

// Control Center™
export type ControlFrameworkLink = typeof controlFrameworks.$inferSelect;
export type ControlVendorLink = typeof controlVendors.$inferSelect;
export type ControlTest = typeof controlTests.$inferSelect;

// Trust Score™
export type VendorTrustHistory = typeof vendorTrustHistory.$inferSelect;

// Trust Intelligence™
export type GovernanceSnapshot = typeof governanceSnapshots.$inferSelect;

// Governance Trends™ + Continuous Monitoring™
export type GovernanceAlert = typeof governanceAlerts.$inferSelect;

// Trust Graph™
export type GraphNode = typeof graphNodes.$inferSelect;
export type GraphEdge = typeof graphEdges.$inferSelect;

// Policy Governance™
export type PolicyReview = typeof policyReviews.$inferSelect;
export type PolicyAttestation = typeof policyAttestations.$inferSelect;
export type PolicyControl = typeof policyControls.$inferSelect;
export type PolicyFrameworkLink = typeof policyFrameworks.$inferSelect;

/* ============================================================
   DPDP Privacy™ — Enums + Tables (Module 11)
   ============================================================ */

export const dataCategory = pgEnum("data_category", [
  "customer",
  "employee",
  "vendor",
  "marketing",
  "financial",
  "health",
  "biometric",
  "custom",
]);

export const sensitivityLevel = pgEnum("sensitivity_level", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const dataAssetStatus = pgEnum("data_asset_status", [
  "active",
  "inactive",
  "archived",
  "under_review",
]);

export const consentStatus = pgEnum("consent_status", [
  "granted",
  "withdrawn",
  "expired",
  "pending",
  "rejected",
]);

export const privacyRequestType = pgEnum("privacy_request_type", [
  "access",
  "correction",
  "deletion",
  "portability",
  "consent_withdrawal",
  "grievance",
]);

export const privacyRequestStatus = pgEnum("privacy_request_status", [
  "submitted",
  "assigned",
  "investigating",
  "completed",
  "closed",
]);

export const privacyAssessmentStatus = pgEnum("privacy_assessment_status", [
  "draft",
  "in_progress",
  "completed",
  "approved",
  "archived",
]);

export const privacyRiskLevel = pgEnum("privacy_risk_level", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const transferStatus = pgEnum("transfer_status", [
  "active",
  "pending_approval",
  "approved",
  "rejected",
  "suspended",
]);

/** Data assets — the inventory of personal data held by the org. */
export const dataAssets = pgTable(
  "data_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    ownerId: uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
    department: text("department"),
    dataCategory: dataCategory("data_category").notNull().default("custom"),
    sensitivity: sensitivityLevel("sensitivity").notNull().default("medium"),
    purpose: text("purpose"),
    storageLocation: text("storage_location"),
    retentionPeriod: integer("retention_period"),
    crossBorder: boolean("cross_border").notNull().default(false),
    status: dataAssetStatus("status").notNull().default("active"),
    healthScore: integer("health_score"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("data_assets_org_idx").on(t.organizationId),
    index("data_assets_status_idx").on(t.organizationId, t.status),
    index("data_assets_category_idx").on(t.organizationId, t.dataCategory),
  ]
);

/** Consent records for data subjects. */
export const consentRecords = pgTable(
  "consent_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    subjectId: text("subject_id").notNull(),
    subjectName: text("subject_name"),
    subjectEmail: text("subject_email"),
    purpose: text("purpose").notNull(),
    consentStatus: consentStatus("consent_status").notNull().default("pending"),
    dataAssetId: uuid("data_asset_id").references(() => dataAssets.id, { onDelete: "set null" }),
    obtainedAt: timestamp("obtained_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
    source: text("source"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("consent_records_org_idx").on(t.organizationId),
    index("consent_records_status_idx").on(t.organizationId, t.consentStatus),
    index("consent_records_subject_idx").on(t.organizationId, t.subjectId),
  ]
);

/** Data Subject Requests (DSR) — DPDP Act obligations. */
export const privacyRequests = pgTable(
  "privacy_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    requestType: privacyRequestType("request_type").notNull(),
    subjectName: text("subject_name").notNull(),
    subjectEmail: text("subject_email").notNull(),
    status: privacyRequestStatus("status").notNull().default("submitted"),
    ownerId: uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
    description: text("description"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    resolutionNotes: text("resolution_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("privacy_requests_org_idx").on(t.organizationId),
    index("privacy_requests_status_idx").on(t.organizationId, t.status),
    index("privacy_requests_due_idx").on(t.organizationId, t.dueDate),
  ]
);

/** Retention policies — rules for how long data is kept per category. */
export const retentionPolicies = pgTable(
  "retention_policies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    dataCategory: dataCategory("data_category").notNull().default("custom"),
    retentionDays: integer("retention_days").notNull(),
    legalBasis: text("legal_basis"),
    actionOnExpiry: text("action_on_expiry").notNull().default("delete"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("retention_policies_org_idx").on(t.organizationId)]
);

/** Retention events — scheduled or actioned data lifecycle events. */
export const retentionEvents = pgTable(
  "retention_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    dataAssetId: uuid("data_asset_id")
      .notNull()
      .references(() => dataAssets.id, { onDelete: "cascade" }),
    retentionPolicyId: uuid("retention_policy_id").references(() => retentionPolicies.id, {
      onDelete: "set null",
    }),
    eventType: text("event_type").notNull(),
    scheduledDate: timestamp("scheduled_date", { withTimezone: true }).notNull(),
    actionedAt: timestamp("actioned_at", { withTimezone: true }),
    actionedBy: uuid("actioned_by").references(() => profiles.id, { onDelete: "set null" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("retention_events_org_idx").on(t.organizationId),
    index("retention_events_asset_idx").on(t.dataAssetId),
  ]
);

/** Privacy Impact Assessments (PIA). */
export const privacyAssessments = pgTable(
  "privacy_assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    scope: text("scope"),
    ownerId: uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
    riskLevel: privacyRiskLevel("risk_level").notNull().default("medium"),
    status: privacyAssessmentStatus("status").notNull().default("draft"),
    purpose: text("purpose"),
    dataTypes: text("data_types"),
    risks: text("risks"),
    mitigations: text("mitigations"),
    controls: text("controls"),
    residualRisk: text("residual_risk"),
    approvedBy: uuid("approved_by").references(() => profiles.id, { onDelete: "set null" }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    reviewDate: timestamp("review_date", { withTimezone: true }),
    aiSummary: text("ai_summary"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("privacy_assessments_org_idx").on(t.organizationId),
    index("privacy_assessments_status_idx").on(t.organizationId, t.status),
  ]
);

/** Cross-border data transfers — requires approval under DPDP. */
export const dataTransfers = pgTable(
  "data_transfers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    dataAssetId: uuid("data_asset_id").references(() => dataAssets.id, { onDelete: "set null" }),
    destinationCountry: text("destination_country").notNull(),
    recipientName: text("recipient_name").notNull(),
    transferBasis: text("transfer_basis").notNull(),
    status: transferStatus("status").notNull().default("pending_approval"),
    riskNotes: text("risk_notes"),
    approvedBy: uuid("approved_by").references(() => profiles.id, { onDelete: "set null" }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    reviewDate: timestamp("review_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("data_transfers_org_idx").on(t.organizationId),
    index("data_transfers_status_idx").on(t.organizationId, t.status),
  ]
);

/** Privacy Trust Score™ history — one row per computation. */
export const privacyTrustScores = pgTable(
  "privacy_trust_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    score: integer("score").notNull().default(0),
    inventoryScore: integer("inventory_score").notNull().default(0),
    consentScore: integer("consent_score").notNull().default(0),
    dsrScore: integer("dsr_score").notNull().default(0),
    retentionScore: integer("retention_score").notNull().default(0),
    riskScore: integer("risk_score").notNull().default(0),
    controlsScore: integer("controls_score").notNull().default(0),
    computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("privacy_trust_scores_org_idx").on(t.organizationId),
    index("privacy_trust_scores_date_idx").on(t.organizationId, t.computedAt),
  ]
);

// DPDP Privacy™
export type DataAsset = typeof dataAssets.$inferSelect;
export type ConsentRecord = typeof consentRecords.$inferSelect;
export type PrivacyRequest = typeof privacyRequests.$inferSelect;
export type RetentionPolicy = typeof retentionPolicies.$inferSelect;
export type RetentionEvent = typeof retentionEvents.$inferSelect;
export type PrivacyAssessment = typeof privacyAssessments.$inferSelect;
export type DataTransfer = typeof dataTransfers.$inferSelect;

/* ============================================================
   Contract Governance™ — Module 12
   ============================================================ */

export const contractType = pgEnum("contract_type", [
  "vendor_agreement",
  "msa",
  "sow",
  "nda",
  "dpa",
  "employment",
  "partner_agreement",
  "procurement",
  "custom",
]);

export const contractStatus = pgEnum("contract_status", [
  "draft",
  "review",
  "negotiation",
  "active",
  "expiring",
  "expired",
  "renewed",
  "terminated",
  "archived",
]);

export const clauseCategory = pgEnum("clause_category", [
  "privacy",
  "security",
  "financial",
  "operational",
  "legal",
  "compliance",
  "termination",
  "renewal",
  "custom",
]);

export const obligationStatus = pgEnum("obligation_status", [
  "open",
  "in_progress",
  "completed",
  "overdue",
  "waived",
]);

export const clauseRiskLevel = pgEnum("clause_risk_level", [
  "low",
  "medium",
  "high",
  "critical",
]);

/** Contract registry — core contract record. */
export const contracts = pgTable(
  "contracts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    contractType: contractType("contract_type").notNull().default("vendor_agreement"),
    status: contractStatus("status").notNull().default("draft"),
    effectiveDate: date("effective_date"),
    expiryDate: date("expiry_date"),
    renewalDate: date("renewal_date"),
    noticePeriodDays: integer("notice_period_days").notNull().default(30),
    autoRenewal: boolean("auto_renewal").notNull().default(false),
    ownerId: uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
    value: numeric("value", { precision: 15, scale: 2 }),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    storagePath: text("storage_path"),
    aiSummary: text("ai_summary"),
    trustScore: integer("trust_score"),
    trustScoreAt: timestamp("trust_score_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("contracts_org_idx").on(t.organizationId),
    index("contracts_status_idx").on(t.organizationId, t.status),
    index("contracts_vendor_idx").on(t.vendorId),
    index("contracts_expiry_idx").on(t.organizationId, t.expiryDate),
  ]
);

/** Individual clauses extracted or added within a contract. */
export const contractClauses = pgTable(
  "contract_clauses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    category: clauseCategory("category").notNull().default("legal"),
    content: text("content").notNull(),
    riskLevel: clauseRiskLevel("risk_level").notNull().default("low"),
    aiAnalysis: text("ai_analysis"),
    isMissing: boolean("is_missing").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("contract_clauses_contract_idx").on(t.contractId)]
);

/** Obligations arising from a contract — tracked with due dates and status. */
export const contractObligations = pgTable(
  "contract_obligations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    ownerId: uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
    dueDate: date("due_date"),
    status: obligationStatus("status").notNull().default("open"),
    riskLevel: clauseRiskLevel("risk_level").notNull().default("low"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("contract_obligations_contract_idx").on(t.contractId),
    index("contract_obligations_org_idx").on(t.organizationId),
    index("contract_obligations_status_idx").on(t.organizationId, t.status),
    index("contract_obligations_due_idx").on(t.organizationId, t.dueDate),
  ]
);

/** Junction: contract ↔ risk. */
export const contractRisks = pgTable(
  "contract_risks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
    riskId: uuid("risk_id")
      .notNull()
      .references(() => risks.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("contract_risks_contract_idx").on(t.contractId),
    uniqueIndex("contract_risks_unique").on(t.contractId, t.riskId),
  ]
);

/** Junction: contract ↔ control. */
export const contractControls = pgTable(
  "contract_controls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
    controlId: uuid("control_id")
      .notNull()
      .references(() => controls.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("contract_controls_contract_idx").on(t.contractId),
    uniqueIndex("contract_controls_unique").on(t.contractId, t.controlId),
  ]
);

/** Junction: contract ↔ policy. */
export const contractPolicies = pgTable(
  "contract_policies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
    policyId: uuid("policy_id")
      .notNull()
      .references(() => policies.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("contract_policies_contract_idx").on(t.contractId),
    uniqueIndex("contract_policies_unique").on(t.contractId, t.policyId),
  ]
);

// Contract Governance™ types
export type Contract = typeof contracts.$inferSelect;
export type ContractClause = typeof contractClauses.$inferSelect;
export type ContractObligation = typeof contractObligations.$inferSelect;
export type PrivacyTrustScore = typeof privacyTrustScores.$inferSelect;

// ─── Issue & Remediation Hub™ — Module 13 ────────────────────────────────────

export const issueType = pgEnum("issue_type", [
  "risk","audit_finding","capa","control_failure","policy_gap","privacy_issue",
  "vendor_issue","contract_obligation","compliance_gap","security_incident","custom",
]);
export const issueSeverity = pgEnum("issue_severity", ["critical","high","medium","low","informational"]);
export const issuePriority = pgEnum("issue_priority", ["p1","p2","p3","p4","p5"]);
export const issueStatus = pgEnum("issue_status", [
  "open","assigned","in_progress","blocked","pending_review","resolved","closed","accepted_risk","deferred",
]);
export const issueTaskStatus = pgEnum("issue_task_status", ["open","in_progress","blocked","completed","cancelled"]);
export const exceptionStatus = pgEnum("exception_status", ["pending","approved","rejected","expired","revoked"]);
export const escalationLevel = pgEnum("escalation_level", ["owner","manager","department_head","executive","board"]);

export const issues = pgTable(
  "issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    issueType: issueType("issue_type").notNull().default("custom"),
    sourceModule: text("source_module"),
    sourceEntityId: uuid("source_entity_id"),
    severity: issueSeverity("severity").notNull().default("medium"),
    priority: issuePriority("priority").notNull().default("p3"),
    status: issueStatus("status").notNull().default("open"),
    ownerId: uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
    assigneeId: uuid("assignee_id").references(() => profiles.id, { onDelete: "set null" }),
    dueDate: date("due_date"),
    resolvedDate: date("resolved_date"),
    resolutionNotes: text("resolution_notes"),
    slaDays: integer("sla_days").notNull().default(30),
    slaBreached: boolean("sla_breached").notNull().default(false),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("issues_org_idx").on(t.organizationId),
    index("issues_status_idx").on(t.organizationId, t.status),
    index("issues_severity_idx").on(t.organizationId, t.severity),
  ]
);

export const issueTasks = pgTable(
  "issue_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    issueId: uuid("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    ownerId: uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
    status: issueTaskStatus("status").notNull().default("open"),
    dueDate: date("due_date"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completionNotes: text("completion_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("issue_tasks_issue_idx").on(t.issueId)]
);

export const issueComments = pgTable(
  "issue_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    issueId: uuid("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => profiles.id, { onDelete: "set null" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("issue_comments_issue_idx").on(t.issueId)]
);

export const issueExceptions = pgTable(
  "issue_exceptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    issueId: uuid("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    businessJustification: text("business_justification").notNull(),
    approverId: uuid("approver_id").references(() => profiles.id, { onDelete: "set null" }),
    approvalDate: date("approval_date"),
    expiryDate: date("expiry_date"),
    reviewDate: date("review_date"),
    status: exceptionStatus("status").notNull().default("pending"),
    rejectionReason: text("rejection_reason"),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("issue_exceptions_issue_idx").on(t.issueId),
    index("issue_exceptions_org_idx").on(t.organizationId),
  ]
);

export const issueEscalations = pgTable(
  "issue_escalations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    issueId: uuid("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    escalatedTo: escalationLevel("escalated_to").notNull().default("manager"),
    reason: text("reason").notNull(),
    escalatedBy: uuid("escalated_by").references(() => profiles.id, { onDelete: "set null" }),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("issue_escalations_issue_idx").on(t.issueId)]
);

export const issueHistory = pgTable(
  "issue_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    issueId: uuid("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    changedBy: uuid("changed_by").references(() => profiles.id, { onDelete: "set null" }),
    fieldChanged: text("field_changed").notNull(),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("issue_history_issue_idx").on(t.issueId)]
);

// Issue & Remediation Hub™ types
export type Issue = typeof issues.$inferSelect;
export type IssueTask = typeof issueTasks.$inferSelect;
export type IssueComment = typeof issueComments.$inferSelect;
export type IssueException = typeof issueExceptions.$inferSelect;
export type IssueEscalation = typeof issueEscalations.$inferSelect;

// --- Workflow Studio™ (Module 14) ---
export const workflowStatus = pgEnum("workflow_status", ["draft","active","archived","deprecated"]);
export const workflowNodeType = pgEnum("workflow_node_type", ["start","task","approval","condition","decision","wait","notification","webhook","create_record","update_record","end"]);
export const workflowRunStatus = pgEnum("workflow_run_status", ["running","waiting","approved","rejected","failed","completed","cancelled"]);
export const workflowTriggerType = pgEnum("workflow_trigger_type", ["record_created","record_updated","status_changed","date_reached","score_threshold","api_event","manual","scheduled"]);
export const workflowApprovalStatus = pgEnum("workflow_approval_status", ["pending","approved","rejected","delegated","escalated"]);
export const workflowModule = pgEnum("workflow_module", ["vendor_hub","evidence_vault","audit_management","risk_lens","control_center","policy_governance","dpdp_privacy","contract_governance","issue_hub","trust_intelligence","custom"]);

export const workflows = pgTable(
  "workflows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    module: workflowModule("module").notNull().default("custom"),
    status: workflowStatus("status").notNull().default("draft"),
    version: integer("version").notNull().default(1),
    isTemplate: boolean("is_template").notNull().default(false),
    templateCategory: text("template_category"),
    triggerType: workflowTriggerType("trigger_type").notNull().default("manual"),
    triggerConfig: jsonb("trigger_config"),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("workflows_org_idx").on(t.organizationId),
    index("workflows_status_idx").on(t.organizationId, t.status),
  ]
);

export const workflowNodes = pgTable(
  "workflow_nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    nodeType: workflowNodeType("node_type").notNull(),
    label: text("label").notNull(),
    description: text("description"),
    positionX: doublePrecision("position_x").notNull().default(0),
    positionY: doublePrecision("position_y").notNull().default(0),
    config: jsonb("config"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("workflow_nodes_workflow_idx").on(t.workflowId)]
);

export const workflowTransitions = pgTable(
  "workflow_transitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    fromNodeId: uuid("from_node_id").notNull().references(() => workflowNodes.id, { onDelete: "cascade" }),
    toNodeId: uuid("to_node_id").notNull().references(() => workflowNodes.id, { onDelete: "cascade" }),
    label: text("label"),
    conditionExpr: text("condition_expr"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("workflow_transitions_workflow_idx").on(t.workflowId)]
);

export const workflowRuns = pgTable(
  "workflow_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    status: workflowRunStatus("status").notNull().default("running"),
    triggerType: workflowTriggerType("trigger_type").notNull().default("manual"),
    triggerEntityId: uuid("trigger_entity_id"),
    triggerEntityType: text("trigger_entity_type"),
    currentNodeId: uuid("current_node_id").references(() => workflowNodes.id, { onDelete: "set null" }),
    startedBy: uuid("started_by").references(() => profiles.id, { onDelete: "set null" }),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    failedReason: text("failed_reason"),
    contextData: jsonb("context_data"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("workflow_runs_org_idx").on(t.organizationId),
    index("workflow_runs_status_idx").on(t.organizationId, t.status),
  ]
);

export const workflowRunSteps = pgTable(
  "workflow_run_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id").notNull().references(() => workflowRuns.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    nodeId: uuid("node_id").notNull().references(() => workflowNodes.id, { onDelete: "cascade" }),
    status: workflowRunStatus("status").notNull().default("running"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    outputData: jsonb("output_data"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("workflow_run_steps_run_idx").on(t.runId)]
);

export const workflowApprovals = pgTable(
  "workflow_approvals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id").notNull().references(() => workflowRuns.id, { onDelete: "cascade" }),
    nodeId: uuid("node_id").notNull().references(() => workflowNodes.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    approverId: uuid("approver_id").references(() => profiles.id, { onDelete: "set null" }),
    status: workflowApprovalStatus("status").notNull().default("pending"),
    decisionNotes: text("decision_notes"),
    delegatedTo: uuid("delegated_to").references(() => profiles.id, { onDelete: "set null" }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    dueDate: date("due_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("workflow_approvals_org_idx").on(t.organizationId),
    index("workflow_approvals_run_idx").on(t.runId),
    index("workflow_approvals_approver_idx").on(t.approverId),
  ]
);

// Workflow Studio™ types
export type Workflow = typeof workflows.$inferSelect;
export type WorkflowNode = typeof workflowNodes.$inferSelect;
export type WorkflowTransition = typeof workflowTransitions.$inferSelect;
export type WorkflowRun = typeof workflowRuns.$inferSelect;
export type WorkflowRunStep = typeof workflowRunSteps.$inferSelect;
export type WorkflowApproval = typeof workflowApprovals.$inferSelect;
