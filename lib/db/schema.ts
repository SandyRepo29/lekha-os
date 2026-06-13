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

/* ============================================================
   Third-Party Risk Exchange™ — Enums + Tables (Module 15)
   ============================================================ */

export const trustDocType = pgEnum("trust_doc_type", [
  "soc2", "iso27001", "iso27701", "pci_dss", "hipaa", "dpdp",
  "cyber_insurance", "pen_test", "dpa", "security_whitepaper",
  "sig_questionnaire", "caiq", "custom",
]);

export const trustVisibility = pgEnum("trust_visibility", [
  "private", "specific", "network", "public",
]);

export const trustVerificationLevel = pgEnum("trust_verification_level", [
  "self_attested", "customer_verified", "auditor_verified", "audt_verified",
]);

export const trustBadgeType = pgEnum("trust_badge_type", [
  "audt_verified", "dpdp_ready", "privacy_verified", "vendor_trusted",
  "low_risk", "enterprise_ready", "iso_verified", "soc2_verified", "custom",
]);

export const trustRelationshipType = pgEnum("trust_relationship_type", [
  "customer", "vendor", "partner",
]);

export const trustRelationshipStatus = pgEnum("trust_relationship_status", [
  "pending", "active", "inactive", "revoked",
]);

export const trustActivityType = pgEnum("trust_activity_type", [
  "profile_created", "profile_updated", "document_shared", "document_verified",
  "badge_issued", "relationship_created", "questionnaire_answered", "verification_requested",
]);

/** Public Trust Profile — one per org. */
export const trustProfiles = pgTable(
  "trust_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().unique().references(() => organizations.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    tagline: text("tagline"),
    description: text("description"),
    industry: text("industry"),
    companySize: text("company_size"),
    country: text("country"),
    website: text("website"),
    logoUrl: text("logo_url"),
    isPublished: boolean("is_published").notNull().default(false),
    visibility: trustVisibility("visibility").notNull().default("private"),
    trustScore: integer("trust_score"),
    privacyScore: integer("privacy_score"),
    riskLevel: text("risk_level").default("unknown"),
    profileCompleteness: integer("profile_completeness").notNull().default(0),
    certifications: jsonb("certifications").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("trust_profiles_org_idx").on(t.organizationId),
    index("trust_profiles_published_idx").on(t.isPublished),
  ]
);

/** Evidence documents uploaded for sharing via the Exchange. */
export const trustDocuments = pgTable(
  "trust_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    trustProfileId: uuid("trust_profile_id").notNull().references(() => trustProfiles.id, { onDelete: "cascade" }),
    docType: trustDocType("doc_type").notNull().default("custom"),
    title: text("title").notNull(),
    description: text("description"),
    fileName: text("file_name"),
    fileSize: bigint("file_size", { mode: "number" }),
    storagePath: text("storage_path"),
    storageBucket: text("storage_bucket"),
    issuedDate: date("issued_date"),
    expiryDate: date("expiry_date"),
    issuer: text("issuer"),
    visibility: trustVisibility("visibility").notNull().default("private"),
    isVerified: boolean("is_verified").notNull().default(false),
    verificationLevel: trustVerificationLevel("verification_level").default("self_attested"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedBy: uuid("verified_by").references(() => profiles.id, { onDelete: "set null" }),
    downloadCount: integer("download_count").notNull().default(0),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("trust_docs_org_idx").on(t.organizationId),
    index("trust_docs_profile_idx").on(t.trustProfileId),
    index("trust_docs_type_idx").on(t.docType),
    index("trust_docs_expiry_idx").on(t.expiryDate),
  ]
);

/** Sharing grants for specific documents. */
export const trustShares = pgTable(
  "trust_shares",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trustDocumentId: uuid("trust_document_id").notNull().references(() => trustDocuments.id, { onDelete: "cascade" }),
    ownerOrgId: uuid("owner_org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    recipientOrgId: uuid("recipient_org_id").references(() => organizations.id, { onDelete: "cascade" }),
    shareToken: text("share_token").unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    accessedAt: timestamp("accessed_at", { withTimezone: true }),
    accessCount: integer("access_count").notNull().default(0),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("trust_shares_doc_idx").on(t.trustDocumentId),
    index("trust_shares_owner_idx").on(t.ownerOrgId),
    index("trust_shares_recipient_idx").on(t.recipientOrgId),
  ]
);

/** Reusable questionnaire templates (SIG, CAIQ, custom). */
export const trustQuestionnaires = pgTable(
  "trust_questionnaires",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull().default("security"),
    isGlobal: boolean("is_global").notNull().default(false),
    questionCount: integer("question_count").notNull().default(0),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("trust_q_org_idx").on(t.organizationId),
    index("trust_q_global_idx").on(t.isGlobal),
  ]
);

/** An org's completed answers to a questionnaire. */
export const trustAnswers = pgTable(
  "trust_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    trustProfileId: uuid("trust_profile_id").notNull().references(() => trustProfiles.id, { onDelete: "cascade" }),
    questionnaireId: uuid("questionnaire_id").notNull().references(() => trustQuestionnaires.id, { onDelete: "cascade" }),
    answers: jsonb("answers").notNull().default({}),
    completionPercent: integer("completion_percent").notNull().default(0),
    visibility: trustVisibility("visibility").notNull().default("private"),
    lastUpdatedBy: uuid("last_updated_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("trust_answers_org_idx").on(t.organizationId),
    uniqueIndex("trust_answers_org_q_uniq").on(t.organizationId, t.questionnaireId),
  ]
);

/** Verification records for exchange documents. */
export const trustVerifications = pgTable(
  "trust_verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trustDocumentId: uuid("trust_document_id").notNull().references(() => trustDocuments.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    verificationLevel: trustVerificationLevel("verification_level").notNull().default("customer_verified"),
    verifiedBy: uuid("verified_by").references(() => profiles.id, { onDelete: "set null" }),
    verifierOrgId: uuid("verifier_org_id").references(() => organizations.id, { onDelete: "set null" }),
    verificationNotes: text("verification_notes"),
    validUntil: date("valid_until"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("trust_verif_doc_idx").on(t.trustDocumentId),
    index("trust_verif_org_idx").on(t.organizationId),
  ]
);

/** Trust Badges™ issued to orgs. */
export const trustBadges = pgTable(
  "trust_badges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    trustProfileId: uuid("trust_profile_id").notNull().references(() => trustProfiles.id, { onDelete: "cascade" }),
    badgeType: trustBadgeType("badge_type").notNull().default("audt_verified"),
    label: text("label").notNull(),
    description: text("description"),
    issuedBy: uuid("issued_by").references(() => profiles.id, { onDelete: "set null" }),
    issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    metadata: jsonb("metadata").notNull().default({}),
  },
  (t) => [
    index("trust_badges_org_idx").on(t.organizationId),
    index("trust_badges_active_idx").on(t.organizationId, t.isActive),
  ]
);

/** Customer ↔ Vendor relationship in the Exchange. */
export const trustRelationships = pgTable(
  "trust_relationships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requesterOrgId: uuid("requester_org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    targetOrgId: uuid("target_org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    relationshipType: trustRelationshipType("relationship_type").notNull().default("customer"),
    status: trustRelationshipStatus("status").notNull().default("pending"),
    initiatedBy: uuid("initiated_by").references(() => profiles.id, { onDelete: "set null" }),
    acceptedBy: uuid("accepted_by").references(() => profiles.id, { onDelete: "set null" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("trust_relationships_uniq").on(t.requesterOrgId, t.targetOrgId),
    index("trust_relationships_target_idx").on(t.targetOrgId),
    index("trust_relationships_status_idx").on(t.status),
  ]
);

/** Exchange activity log. */
export const trustActivity = pgTable(
  "trust_activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => profiles.id, { onDelete: "set null" }),
    activityType: trustActivityType("activity_type").notNull(),
    entityId: uuid("entity_id"),
    entityType: text("entity_type"),
    description: text("description"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("trust_activity_org_idx").on(t.organizationId),
    index("trust_activity_created_idx").on(t.organizationId, t.createdAt),
  ]
);

// Third-Party Risk Exchange™ types
export type TrustProfile = typeof trustProfiles.$inferSelect;
export type TrustDocument = typeof trustDocuments.$inferSelect;
export type TrustShare = typeof trustShares.$inferSelect;
export type TrustQuestionnaire = typeof trustQuestionnaires.$inferSelect;
export type TrustAnswer = typeof trustAnswers.$inferSelect;
export type TrustVerification = typeof trustVerifications.$inferSelect;
export type TrustBadge = typeof trustBadges.$inferSelect;
export type TrustRelationship = typeof trustRelationships.$inferSelect;
export type TrustActivityRow = typeof trustActivity.$inferSelect;

/* ============================================================
   Governance Benchmarking™ — Enums + Tables (Module 16)
   ============================================================ */

export const benchmarkCategory = pgEnum("benchmark_category", [
  "organizational_trust",
  "vendor_trust",
  "risk_posture",
  "control_health",
  "audit_readiness",
  "compliance_coverage",
  "privacy_trust",
  "contract_trust",
  "issue_resolution",
  "workflow_automation",
]);

export const benchmarkMaturityLevel = pgEnum("benchmark_maturity_level", [
  "reactive",
  "managed",
  "defined",
  "measured",
  "optimized",
  "trust_leader",
]);

export const benchmarkRankingLabel = pgEnum("benchmark_ranking_label", [
  "top_1_percent",
  "top_5_percent",
  "top_10_percent",
  "top_quartile",
  "above_average",
  "average",
  "below_average",
  "at_risk",
]);

/** Industry baseline statistics — system-wide, not per-org. Seeded at migration time. */
export const benchmarkIndustries = pgTable(
  "benchmark_industries",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    industry:       text("industry").notNull(),
    companySize:    text("company_size").notNull().default("all"),
    category:       benchmarkCategory("category").notNull(),
    avgScore:       integer("avg_score").notNull().default(65),
    medianScore:    integer("median_score").notNull().default(65),
    topQuartile:    integer("top_quartile").notNull().default(80),
    topDecile:      integer("top_decile").notNull().default(90),
    bottomQuartile: integer("bottom_quartile").notNull().default(50),
    stdDev:         integer("std_dev").notNull().default(15),
    sampleSize:     integer("sample_size").notNull().default(100),
    updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("benchmark_industries_cat_idx").on(t.industry, t.companySize, t.category),
  ]
);

/** Point-in-time governance benchmark snapshot for an org. */
export const benchmarkSnapshots = pgTable(
  "benchmark_snapshots",
  {
    id:                uuid("id").primaryKey().defaultRandom(),
    organizationId:    uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    snapshotDate:      text("snapshot_date").notNull(),
    industry:          text("industry"),
    companySize:       text("company_size"),
    overallScore:      integer("overall_score"),
    overallPercentile: integer("overall_percentile"),
    maturityLevel:     benchmarkMaturityLevel("maturity_level").notNull().default("reactive"),
    overallRanking:    benchmarkRankingLabel("overall_ranking").notNull().default("average"),
    peerCount:         integer("peer_count").notNull().default(0),
    createdAt:         timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("benchmark_snapshots_org_idx").on(t.organizationId),
    index("benchmark_snapshots_date_idx").on(t.organizationId, t.snapshotDate),
  ]
);

/** Per-category scores within a benchmark snapshot. */
export const benchmarkScores = pgTable(
  "benchmark_scores",
  {
    id:               uuid("id").primaryKey().defaultRandom(),
    snapshotId:       uuid("snapshot_id").notNull().references(() => benchmarkSnapshots.id, { onDelete: "cascade" }),
    organizationId:   uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    category:         benchmarkCategory("category").notNull(),
    orgScore:         integer("org_score"),
    industryAvg:      integer("industry_avg"),
    peerAvg:          integer("peer_avg"),
    topQuartile:      integer("top_quartile"),
    percentile:       integer("percentile"),
    rankingLabel:     benchmarkRankingLabel("ranking_label").notNull().default("average"),
    deltaVsIndustry:  integer("delta_vs_industry"),
    createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("benchmark_scores_snapshot_idx").on(t.snapshotId),
    index("benchmark_scores_org_idx").on(t.organizationId),
    index("benchmark_scores_category_idx").on(t.organizationId, t.category),
  ]
);

/** Monthly trend data per org per category (sparklines). */
export const benchmarkTrends = pgTable(
  "benchmark_trends",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    category:       benchmarkCategory("category").notNull(),
    periodMonth:    text("period_month").notNull(),
    score:          integer("score"),
    percentile:     integer("percentile"),
    rankingLabel:   benchmarkRankingLabel("ranking_label").notNull().default("average"),
    industryAvg:    integer("industry_avg"),
    createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("benchmark_trends_org_idx").on(t.organizationId),
    index("benchmark_trends_cat_idx").on(t.organizationId, t.category),
    uniqueIndex("benchmark_trends_uniq").on(t.organizationId, t.category, t.periodMonth),
  ]
);

// Governance Benchmarking™ types
export type BenchmarkIndustry = typeof benchmarkIndustries.$inferSelect;
export type BenchmarkSnapshot = typeof benchmarkSnapshots.$inferSelect;
export type BenchmarkScore = typeof benchmarkScores.$inferSelect;
export type BenchmarkTrend = typeof benchmarkTrends.$inferSelect;

/* ============================================================
   Integration Hub™ — Enums + Tables (Module 17A)
   ============================================================ */

export const integrationCategory = pgEnum("integration_category", [
  "identity", "cloud", "source_control", "project_management",
  "itsm", "endpoint", "security", "communication", "storage",
  "hr", "custom",
]);

export const integrationConnectorStatus = pgEnum("integration_connector_status", [
  "available", "connected", "disconnected", "error", "deprecated", "coming_soon",
]);

export const integrationAuthType = pgEnum("integration_auth_type", [
  "oauth2", "api_key", "pat", "basic_auth", "service_account", "webhook", "custom",
]);

export const integrationSyncStatus = pgEnum("integration_sync_status", [
  "pending", "running", "completed", "failed", "cancelled",
]);

export const integrationSyncFrequency = pgEnum("integration_sync_frequency", [
  "real_time", "fifteen_minutes", "hourly", "daily", "weekly", "manual",
]);

export const integrationEventType = pgEnum("integration_event_type", [
  "user_created", "user_deleted", "control_failed", "risk_created",
  "evidence_updated", "workflow_triggered", "contract_updated",
  "vendor_updated", "misconfiguration_detected", "credential_expiring",
  "sync_completed", "sync_failed",
]);

export const integrationMappingTarget = pgEnum("integration_mapping_target", [
  "control", "risk", "evidence", "vendor", "issue", "finding",
]);

export const integrationWebhookDirection = pgEnum("integration_webhook_direction", [
  "inbound", "outbound",
]);

/** System-wide connector catalog (not per-org). */
export const integrationRegistry = pgTable(
  "integration_registry",
  {
    id:              uuid("id").primaryKey().defaultRandom(),
    name:            text("name").notNull(),
    slug:            text("slug").notNull().unique(),
    category:        integrationCategory("category").notNull(),
    provider:        text("provider").notNull(),
    version:         text("version").notNull().default("1.0.0"),
    status:          integrationConnectorStatus("status").notNull().default("available"),
    authType:        integrationAuthType("auth_type").notNull().default("api_key"),
    icon:            text("icon"),
    description:     text("description"),
    documentationUrl: text("documentation_url"),
    features:        jsonb("features").notNull().default([]),
    authFields:      jsonb("auth_fields").notNull().default([]),
    isPhase1:        boolean("is_phase1").notNull().default(false),
    createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt:       timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("integration_registry_category_idx").on(t.category)]
);

/** Per-org connected integration instance. */
export const integrationInstances = pgTable(
  "integration_instances",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    registryId:     uuid("registry_id").notNull().references(() => integrationRegistry.id, { onDelete: "cascade" }),
    name:           text("name").notNull(),
    status:         integrationConnectorStatus("status").notNull().default("disconnected"),
    syncFrequency:  integrationSyncFrequency("sync_frequency").notNull().default("daily"),
    lastSyncAt:     timestamp("last_sync_at", { withTimezone: true }),
    nextSyncAt:     timestamp("next_sync_at", { withTimezone: true }),
    connectedAt:    timestamp("connected_at", { withTimezone: true }),
    connectedBy:    uuid("connected_by").references(() => profiles.id, { onDelete: "set null" }),
    errorMessage:   text("error_message"),
    config:         jsonb("config").notNull().default({}),
    totalSynced:    integer("total_synced").notNull().default(0),
    totalEvidence:  integer("total_evidence").notNull().default(0),
    totalRisks:     integer("total_risks").notNull().default(0),
    totalEvents:    integer("total_events").notNull().default(0),
    createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("integration_instances_org_idx").on(t.organizationId),
    index("integration_instances_status_idx").on(t.organizationId, t.status),
    uniqueIndex("integration_instances_org_registry_uniq").on(t.organizationId, t.registryId),
  ]
);

/** Encrypted credentials per instance (one row per instance). */
export const integrationCredentials = pgTable(
  "integration_credentials",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    instanceId:     uuid("instance_id").notNull().references(() => integrationInstances.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    encryptedData:  text("encrypted_data").notNull(),
    expiresAt:      timestamp("expires_at", { withTimezone: true }),
    createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("integration_credentials_instance_uniq").on(t.instanceId)]
);

/** Record of each sync run. */
export const integrationSyncs = pgTable(
  "integration_syncs",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    instanceId:     uuid("instance_id").notNull().references(() => integrationInstances.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    status:         integrationSyncStatus("status").notNull().default("pending"),
    syncType:       text("sync_type").notNull().default("incremental"),
    startedAt:      timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt:    timestamp("completed_at", { withTimezone: true }),
    recordsFetched: integer("records_fetched").notNull().default(0),
    recordsCreated: integer("records_created").notNull().default(0),
    recordsUpdated: integer("records_updated").notNull().default(0),
    recordsFailed:  integer("records_failed").notNull().default(0),
    errorMessage:   text("error_message"),
    summary:        jsonb("summary"),
    createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("integration_syncs_instance_idx").on(t.instanceId),
    index("integration_syncs_org_idx").on(t.organizationId, t.startedAt),
    index("integration_syncs_status_idx").on(t.organizationId, t.status),
  ]
);

/** Detailed log entries per instance. */
export const integrationLogs = pgTable(
  "integration_logs",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    instanceId:     uuid("instance_id").notNull().references(() => integrationInstances.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    syncId:         uuid("sync_id").references(() => integrationSyncs.id, { onDelete: "set null" }),
    level:          text("level").notNull().default("info"),
    message:        text("message").notNull(),
    metadata:       jsonb("metadata"),
    createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("integration_logs_instance_idx").on(t.instanceId, t.createdAt),
    index("integration_logs_org_idx").on(t.organizationId, t.createdAt),
  ]
);

/** Governance events generated by integration syncs. */
export const integrationEvents = pgTable(
  "integration_events",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    instanceId:     uuid("instance_id").notNull().references(() => integrationInstances.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    eventType:      integrationEventType("event_type").notNull(),
    title:          text("title").notNull(),
    description:    text("description"),
    severity:       text("severity").notNull().default("medium"),
    sourceRef:      text("source_ref"),
    resolved:       boolean("resolved").notNull().default(false),
    resolvedAt:     timestamp("resolved_at", { withTimezone: true }),
    entityType:     text("entity_type"),
    entityId:       uuid("entity_id"),
    metadata:       jsonb("metadata"),
    createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("integration_events_instance_idx").on(t.instanceId, t.createdAt),
    index("integration_events_org_idx").on(t.organizationId, t.createdAt),
    index("integration_events_resolved_idx").on(t.organizationId, t.resolved),
  ]
);

/** Maps integration data fields to AUDT entities (control / risk / evidence / etc.). */
export const integrationMappings = pgTable(
  "integration_mappings",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    instanceId:     uuid("instance_id").notNull().references(() => integrationInstances.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    sourceField:    text("source_field").notNull(),
    targetType:     integrationMappingTarget("target_type").notNull(),
    targetId:       uuid("target_id"),
    mappingRule:    jsonb("mapping_rule"),
    isActive:       boolean("is_active").notNull().default(true),
    createdBy:      uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("integration_mappings_instance_idx").on(t.instanceId),
    index("integration_mappings_org_idx").on(t.organizationId),
  ]
);

/** Inbound / outbound webhook configurations. */
export const integrationWebhooks = pgTable(
  "integration_webhooks",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    instanceId:     uuid("instance_id").references(() => integrationInstances.id, { onDelete: "set null" }),
    name:           text("name").notNull(),
    direction:      integrationWebhookDirection("direction").notNull().default("inbound"),
    url:            text("url"),
    secretHash:     text("secret_hash"),
    eventTypes:     text("event_types").array().notNull().default([]),
    isActive:       boolean("is_active").notNull().default(true),
    lastTriggered:  timestamp("last_triggered", { withTimezone: true }),
    totalCalls:     integer("total_calls").notNull().default(0),
    createdBy:      uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("integration_webhooks_org_idx").on(t.organizationId)]
);

// Integration Hub™ types
export type IntegrationRegistry = typeof integrationRegistry.$inferSelect;
export type IntegrationInstance = typeof integrationInstances.$inferSelect;
export type IntegrationSync = typeof integrationSyncs.$inferSelect;
export type IntegrationLog = typeof integrationLogs.$inferSelect;
export type IntegrationEvent = typeof integrationEvents.$inferSelect;
export type IntegrationMapping = typeof integrationMappings.$inferSelect;
export type IntegrationWebhook = typeof integrationWebhooks.$inferSelect;

/* ============================================================
   Trust Network™ — Public Trust Infrastructure Layer (Module 18)
   ============================================================ */

/** Tracks views of public trust profiles. */
export const networkProfileViews = pgTable(
  "network_profile_views",
  {
    id:           uuid("id").primaryKey().defaultRandom(),
    viewedOrgId:  uuid("viewed_org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    viewerOrgId:  uuid("viewer_org_id").references(() => organizations.id, { onDelete: "set null" }),
    viewedAt:     timestamp("viewed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("idx_npv_viewed_org").on(t.viewedOrgId, t.viewedAt)]
);

/** Org-to-org follower graph in the Trust Network. */
export const networkFollowers = pgTable(
  "network_followers",
  {
    id:              uuid("id").primaryKey().defaultRandom(),
    followerOrgId:   uuid("follower_org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    followingOrgId:  uuid("following_org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("uq_network_followers").on(t.followerOrgId, t.followingOrgId),
    index("idx_nf_following").on(t.followingOrgId),
  ]
);

// Trust Network™ types
export type NetworkProfileView = typeof networkProfileViews.$inferSelect;
export type NetworkFollower    = typeof networkFollowers.$inferSelect;

// ─────────────────────────────────────────
// Module 19 — Executive Reporting & Analytics™
// ─────────────────────────────────────────

export const analyticsDashboards = pgTable(
  "analytics_dashboards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    dashboardType: text("dashboard_type").notNull(),
    description: text("description"),
    layoutConfig: jsonb("layout_config").default({}),
    isDefault: boolean("is_default").default(false),
    isShared: boolean("is_shared").default(false),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_analytics_dashboards_org").on(t.orgId)]
);

export const analyticsWidgets = pgTable(
  "analytics_widgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dashboardId: uuid("dashboard_id").notNull().references(() => analyticsDashboards.id, { onDelete: "cascade" }),
    widgetType: text("widget_type").notNull(),
    title: text("title").notNull(),
    config: jsonb("config").default({}),
    positionX: integer("position_x").default(0),
    positionY: integer("position_y").default(0),
    width: integer("width").default(4),
    height: integer("height").default(3),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

export const analyticsReports = pgTable(
  "analytics_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    reportType: text("report_type").notNull(),
    status: text("status").notNull().default("draft"),
    format: text("format").notNull().default("pdf"),
    config: jsonb("config").default({}),
    contentSnapshot: jsonb("content_snapshot").default({}),
    filePath: text("file_path"),
    generatedBy: uuid("generated_by").references(() => profiles.id, { onDelete: "set null" }),
    generatedAt: timestamp("generated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_analytics_reports_org_type").on(t.orgId, t.reportType),
    index("idx_analytics_reports_org_status").on(t.orgId, t.status),
  ]
);

export const analyticsSchedules = pgTable(
  "analytics_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    reportType: text("report_type").notNull(),
    frequency: text("frequency").notNull(),
    deliveryMethod: text("delivery_method").notNull().default("email"),
    recipients: jsonb("recipients").default([]),
    config: jsonb("config").default({}),
    isActive: boolean("is_active").default(true),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_analytics_schedules_org").on(t.orgId, t.isActive)]
);

export const analyticsSnapshots = pgTable(
  "analytics_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    snapshotDate: date("snapshot_date").notNull(),
    kpiData: jsonb("kpi_data").notNull().default({}),
    trendData: jsonb("trend_data").notNull().default({}),
    benchmarkData: jsonb("benchmark_data").notNull().default({}),
    forecastData: jsonb("forecast_data").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_analytics_snapshots_org_date").on(t.orgId, t.snapshotDate),
    index("idx_analytics_snapshots_org_date").on(t.orgId, t.snapshotDate),
  ]
);

export const analyticsExports = pgTable(
  "analytics_exports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    reportId: uuid("report_id").references(() => analyticsReports.id, { onDelete: "set null" }),
    exportType: text("export_type").notNull(),
    format: text("format").notNull(),
    filePath: text("file_path"),
    fileSize: bigint("file_size", { mode: "number" }),
    status: text("status").notNull().default("pending"),
    exportedBy: uuid("exported_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

export const analyticsForecasts = pgTable(
  "analytics_forecasts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    metricName: text("metric_name").notNull(),
    horizonDays: integer("horizon_days").notNull(),
    currentValue: numeric("current_value", { precision: 5, scale: 2 }),
    forecastValue: numeric("forecast_value", { precision: 5, scale: 2 }),
    confidenceScore: numeric("confidence_score", { precision: 5, scale: 2 }),
    forecastData: jsonb("forecast_data").default([]),
    generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_analytics_forecasts_org_metric").on(t.orgId, t.metricName)]
);

export const analyticsSubscriptions = pgTable(
  "analytics_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    scheduleId: uuid("schedule_id").references(() => analyticsSchedules.id, { onDelete: "cascade" }),
    reportType: text("report_type").notNull(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uq_analytics_sub_schedule_user").on(t.scheduleId, t.userId)]
);

export const analyticsKpis = pgTable(
  "analytics_kpis",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    kpiKey: text("kpi_key").notNull(),
    kpiName: text("kpi_name").notNull(),
    currentValue: numeric("current_value", { precision: 10, scale: 2 }),
    previousValue: numeric("previous_value", { precision: 10, scale: 2 }),
    targetValue: numeric("target_value", { precision: 10, scale: 2 }),
    unit: text("unit"),
    trend: text("trend"),
    period: text("period"),
    computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_analytics_kpis_org_key").on(t.orgId, t.kpiKey),
    index("idx_analytics_kpis_org").on(t.orgId),
  ]
);

export type AnalyticsDashboard = typeof analyticsDashboards.$inferSelect;
export type AnalyticsWidget = typeof analyticsWidgets.$inferSelect;
export type AnalyticsReport = typeof analyticsReports.$inferSelect;
export type AnalyticsSchedule = typeof analyticsSchedules.$inferSelect;
export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
export type AnalyticsExport = typeof analyticsExports.$inferSelect;
export type AnalyticsForecast = typeof analyticsForecasts.$inferSelect;
export type AnalyticsSubscription = typeof analyticsSubscriptions.$inferSelect;
export type AnalyticsKpi = typeof analyticsKpis.$inferSelect;

/* ============================================================
   AI Governance™ — Enums + Tables (Module 20)
   ============================================================ */

export const aiSystemType = pgEnum("ai_system_type", [
  "commercial", "open_source", "internal", "agent", "rag", "llm_app", "workflow",
]);

export const aiRiskClassification = pgEnum("ai_risk_classification", [
  "low", "moderate", "high", "critical", "prohibited",
]);

export const aiApprovalStatus = pgEnum("ai_approval_status", [
  "pending", "under_review", "approved", "rejected", "decommissioned",
]);

export const aiRiskCategory = pgEnum("ai_risk_category", [
  "hallucination", "bias", "privacy_leakage", "copyright_risk", "prompt_injection",
  "data_poisoning", "model_drift", "regulatory_risk", "security_risk",
  "vendor_dependency", "explainability_risk", "autonomous_decision_risk", "other",
]);

export const aiControlCategory = pgEnum("ai_control_category", [
  "human_oversight", "output_review", "prompt_logging", "model_approval",
  "data_classification", "access_control", "vendor_review", "model_monitoring",
  "content_filtering", "red_team_testing", "other",
]);

export const aiTrustLevel = pgEnum("ai_trust_level", [
  "trusted", "managed", "monitored", "needs_attention", "high_risk", "restricted",
]);

export const aiComplianceFramework = pgEnum("ai_compliance_framework", [
  "iso_42001", "nist_ai_rmf", "eu_ai_act", "oecd_ai_principles", "dpdp_ai", "internal",
]);

export const aiIncidentType = pgEnum("ai_incident_type", [
  "hallucination", "bias_event", "data_exposure", "unauthorized_usage",
  "model_failure", "prompt_injection", "compliance_violation", "other",
]);

/** Central registry of all AI systems in use. */
export const aiSystems = pgTable(
  "ai_systems",
  {
    id:                    uuid("id").primaryKey().defaultRandom(),
    organizationId:        uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name:                  text("name").notNull(),
    description:           text("description"),
    systemType:            aiSystemType("system_type").notNull(),
    vendorName:            text("vendor_name"),
    modelName:             text("model_name"),
    version:               text("version"),
    ownerId:               uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
    businessUnit:          text("business_unit"),
    purpose:               text("purpose"),
    useCase:               text("use_case"),
    riskClassification:    aiRiskClassification("risk_classification").notNull().default("moderate"),
    dataClassification:    text("data_classification"),
    approvalStatus:        aiApprovalStatus("approval_status").notNull().default("pending"),
    aiTrustScore:          numeric("ai_trust_score", { precision: 5, scale: 2 }),
    reviewDate:            date("review_date"),
    lastAssessedAt:        timestamp("last_assessed_at", { withTimezone: true }),
    deploymentEnvironment: text("deployment_environment"),
    isActive:              boolean("is_active").notNull().default(true),
    metadata:              jsonb("metadata").notNull().default({}),
    createdBy:             uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt:             timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:             timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_ai_systems_org").on(t.organizationId),
    index("idx_ai_systems_status").on(t.organizationId, t.approvalStatus),
    index("idx_ai_systems_risk").on(t.organizationId, t.riskClassification),
  ]
);

/** AI vendor registry — govern AI vendors like third parties. */
export const aiVendors = pgTable(
  "ai_vendors",
  {
    id:               uuid("id").primaryKey().defaultRandom(),
    organizationId:   uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name:             text("name").notNull(),
    website:          text("website"),
    description:      text("description"),
    vendorType:       text("vendor_type").notNull().default("commercial"),
    riskRating:       text("risk_rating").notNull().default("moderate"),
    privacyPosture:   text("privacy_posture"),
    securityPosture:  text("security_posture"),
    contractStatus:   text("contract_status"),
    assessmentStatus: text("assessment_status"),
    lastAssessedAt:   timestamp("last_assessed_at", { withTimezone: true }),
    trustScore:       numeric("trust_score", { precision: 5, scale: 2 }),
    notes:            text("notes"),
    createdBy:        uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_ai_vendors_org").on(t.organizationId)]
);

/** AI-specific risk registry. */
export const aiRisks = pgTable(
  "ai_risks",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    aiSystemId:     uuid("ai_system_id").references(() => aiSystems.id, { onDelete: "set null" }),
    title:          text("title").notNull(),
    description:    text("description"),
    riskCategory:   aiRiskCategory("risk_category").notNull(),
    likelihood:     integer("likelihood").notNull().default(3),
    impact:         integer("impact").notNull().default(3),
    riskLevel:      aiRiskClassification("risk_level").notNull().default("moderate"),
    status:         text("status").notNull().default("open"),
    treatment:      text("treatment"),
    ownerId:        uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
    targetDate:     date("target_date"),
    createdBy:      uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_ai_risks_org").on(t.organizationId),
    index("idx_ai_risks_system").on(t.aiSystemId),
    index("idx_ai_risks_status").on(t.organizationId, t.status),
  ]
);

/** AI-specific controls. */
export const aiControls = pgTable(
  "ai_controls",
  {
    id:               uuid("id").primaryKey().defaultRandom(),
    organizationId:   uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name:             text("name").notNull(),
    description:      text("description"),
    controlCategory:  aiControlCategory("control_category").notNull(),
    status:           text("status").notNull().default("planned"),
    effectiveness:    text("effectiveness"),
    ownerId:          uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
    lastTestedAt:     date("last_tested_at"),
    nextReviewDate:   date("next_review_date"),
    notes:            text("notes"),
    createdBy:        uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_ai_controls_org").on(t.organizationId)]
);

/** AI governance policies. */
export const aiPolicies = pgTable(
  "ai_policies",
  {
    id:           uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name:         text("name").notNull(),
    policyType:   text("policy_type").notNull(),
    description:  text("description"),
    status:       text("status").notNull().default("draft"),
    version:      text("version").notNull().default("1.0"),
    content:      text("content"),
    ownerId:      uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
    approvedBy:   uuid("approved_by").references(() => profiles.id, { onDelete: "set null" }),
    approvedAt:   timestamp("approved_at", { withTimezone: true }),
    reviewDate:   date("review_date"),
    createdBy:    uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:    timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_ai_policies_org").on(t.organizationId)]
);

/** AI impact / risk / compliance assessments. */
export const aiAssessments = pgTable(
  "ai_assessments",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    aiSystemId:     uuid("ai_system_id").references(() => aiSystems.id, { onDelete: "cascade" }),
    assessmentType: text("assessment_type").notNull(),
    title:          text("title").notNull(),
    status:         text("status").notNull().default("draft"),
    score:          numeric("score", { precision: 5, scale: 2 }),
    findings:       jsonb("findings").notNull().default([]),
    recommendations: jsonb("recommendations").notNull().default([]),
    assessorId:     uuid("assessor_id").references(() => profiles.id, { onDelete: "set null" }),
    completedAt:    timestamp("completed_at", { withTimezone: true }),
    approvedBy:     uuid("approved_by").references(() => profiles.id, { onDelete: "set null" }),
    approvedAt:     timestamp("approved_at", { withTimezone: true }),
    createdBy:      uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_ai_assessments_org").on(t.organizationId),
    index("idx_ai_assessments_system").on(t.aiSystemId),
  ]
);

/** AI governance incidents — hallucinations, bias events, data exposure, etc. */
export const aiIncidents = pgTable(
  "ai_incidents",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    aiSystemId:     uuid("ai_system_id").references(() => aiSystems.id, { onDelete: "set null" }),
    title:          text("title").notNull(),
    description:    text("description").notNull(),
    incidentType:   aiIncidentType("incident_type").notNull(),
    severity:       text("severity").notNull().default("medium"),
    status:         text("status").notNull().default("open"),
    rootCause:      text("root_cause"),
    remediation:    text("remediation"),
    reporterId:     uuid("reporter_id").references(() => profiles.id, { onDelete: "set null" }),
    assignedTo:     uuid("assigned_to").references(() => profiles.id, { onDelete: "set null" }),
    detectedAt:     timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt:     timestamp("resolved_at", { withTimezone: true }),
    createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_ai_incidents_org").on(t.organizationId),
    index("idx_ai_incidents_status").on(t.organizationId, t.status),
  ]
);

/** Per-org per-framework AI compliance tracking. */
export const aiComplianceRecords = pgTable(
  "ai_compliance",
  {
    id:                  uuid("id").primaryKey().defaultRandom(),
    organizationId:      uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    framework:           aiComplianceFramework("framework").notNull(),
    status:              text("status").notNull().default("not_started"),
    readinessScore:      numeric("readiness_score", { precision: 5, scale: 2 }).default("0"),
    totalControls:       integer("total_controls").notNull().default(0),
    implementedControls: integer("implemented_controls").notNull().default(0),
    openGaps:            integer("open_gaps").notNull().default(0),
    lastAssessedAt:      timestamp("last_assessed_at", { withTimezone: true }),
    notes:               text("notes"),
    createdAt:           timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:           timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_ai_compliance_org_framework").on(t.organizationId, t.framework),
    index("idx_ai_compliance_org").on(t.organizationId),
  ]
);

/** AI Trust Score™ history per system. */
export const aiTrustScores = pgTable(
  "ai_trust_scores",
  {
    id:              uuid("id").primaryKey().defaultRandom(),
    organizationId:  uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    aiSystemId:      uuid("ai_system_id").notNull().references(() => aiSystems.id, { onDelete: "cascade" }),
    overallScore:    numeric("overall_score", { precision: 5, scale: 2 }).notNull().default("0"),
    riskScore:       numeric("risk_score", { precision: 5, scale: 2 }).default("0"),
    controlsScore:   numeric("controls_score", { precision: 5, scale: 2 }).default("0"),
    complianceScore: numeric("compliance_score", { precision: 5, scale: 2 }).default("0"),
    monitoringScore: numeric("monitoring_score", { precision: 5, scale: 2 }).default("0"),
    vendorScore:     numeric("vendor_score", { precision: 5, scale: 2 }).default("0"),
    incidentScore:   numeric("incident_score", { precision: 5, scale: 2 }).default("0"),
    trustLevel:      aiTrustLevel("trust_level").notNull().default("monitored"),
    breakdown:       jsonb("breakdown").notNull().default({}),
    computedAt:      timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_ai_trust_scores_system").on(t.aiSystemId),
    index("idx_ai_trust_scores_org").on(t.organizationId),
  ]
);

/** Junction: AI system ↔ AI control. */
export const aiSystemControls = pgTable(
  "ai_system_controls",
  {
    id:          uuid("id").primaryKey().defaultRandom(),
    aiSystemId:  uuid("ai_system_id").notNull().references(() => aiSystems.id, { onDelete: "cascade" }),
    controlId:   uuid("control_id").notNull().references(() => aiControls.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("uq_ai_system_controls").on(t.aiSystemId, t.controlId)]
);

/** Junction: AI system ↔ AI risk. */
export const aiSystemRisks = pgTable(
  "ai_system_risks",
  {
    id:          uuid("id").primaryKey().defaultRandom(),
    aiSystemId:  uuid("ai_system_id").notNull().references(() => aiSystems.id, { onDelete: "cascade" }),
    riskId:      uuid("risk_id").notNull().references(() => aiRisks.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("uq_ai_system_risks").on(t.aiSystemId, t.riskId)]
);

// AI Governance™ types
export type AiSystem           = typeof aiSystems.$inferSelect;
export type AiVendor           = typeof aiVendors.$inferSelect;
export type AiRisk             = typeof aiRisks.$inferSelect;
export type AiControl          = typeof aiControls.$inferSelect;
export type AiPolicy           = typeof aiPolicies.$inferSelect;
export type AiAssessment       = typeof aiAssessments.$inferSelect;
export type AiIncident         = typeof aiIncidents.$inferSelect;
export type AiComplianceRecord = typeof aiComplianceRecords.$inferSelect;

/* ============================================================
   Auditor Collaboration™ — Module 21
   ============================================================ */

export const auditorOrganizations = pgTable("auditor_organizations", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  organizationId:     uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name:               text("name").notNull(),
  firmType:           text("firm_type").notNull().default("audit_firm"),
  website:            text("website"),
  country:            text("country"),
  specializations:    jsonb("specializations").notNull().default([]),
  contactEmail:       text("contact_email"),
  contactName:        text("contact_name"),
  verificationStatus: text("verification_status").notNull().default("unverified"),
  notes:              text("notes"),
  isActive:           boolean("is_active").notNull().default(true),
  createdBy:          uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt:          timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const externalUsers = pgTable("external_users", {
  id:              uuid("id").primaryKey().defaultRandom(),
  organizationId:  uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  auditorOrgId:    uuid("auditor_org_id").references(() => auditorOrganizations.id, { onDelete: "set null" }),
  email:           text("email").notNull(),
  fullName:        text("full_name").notNull(),
  userType:        text("user_type").notNull().default("auditor"),
  title:           text("title"),
  company:         text("company"),
  phone:           text("phone"),
  status:          text("status").notNull().default("invited"),
  accessExpiresAt: timestamp("access_expires_at", { withTimezone: true }),
  lastAccessedAt:  timestamp("last_accessed_at", { withTimezone: true }),
  inviteToken:     text("invite_token").unique(),
  inviteSentAt:    timestamp("invite_sent_at", { withTimezone: true }),
  createdBy:       uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditRooms = pgTable("audit_rooms", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name:           text("name").notNull(),
  description:    text("description"),
  roomType:       text("room_type").notNull().default("audit"),
  framework:      text("framework"),
  scope:          text("scope"),
  objective:      text("objective"),
  status:         text("status").notNull().default("planning"),
  startDate:      date("start_date"),
  endDate:        date("end_date"),
  completionPct:  integer("completion_pct").notNull().default(0),
  auditorOrgId:   uuid("auditor_org_id").references(() => auditorOrganizations.id, { onDelete: "set null" }),
  leadAuditorId:  uuid("lead_auditor_id").references(() => externalUsers.id, { onDelete: "set null" }),
  ownerId:        uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
  metadata:       jsonb("metadata").notNull().default({}),
  createdBy:      uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditRoomDocuments = pgTable("audit_room_documents", {
  id:           uuid("id").primaryKey().defaultRandom(),
  roomId:       uuid("room_id").notNull().references(() => auditRooms.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  documentName: text("document_name").notNull(),
  documentType: text("document_type").notNull().default("evidence"),
  storagePath:  text("storage_path"),
  fileSize:     bigint("file_size", { mode: "number" }),
  contentType:  text("content_type"),
  sourceModule: text("source_module"),
  sourceId:     text("source_id"),
  uploadedBy:   uuid("uploaded_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditRoomActivities = pgTable("audit_room_activities", {
  id:             uuid("id").primaryKey().defaultRandom(),
  roomId:         uuid("room_id").notNull().references(() => auditRooms.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  activityType:   text("activity_type").notNull(),
  description:    text("description").notNull(),
  actorId:        uuid("actor_id").references(() => profiles.id, { onDelete: "set null" }),
  externalUserId: uuid("external_user_id").references(() => externalUsers.id, { onDelete: "set null" }),
  metadata:       jsonb("metadata").notNull().default({}),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const evidenceRequests = pgTable("evidence_requests", {
  id:               uuid("id").primaryKey().defaultRandom(),
  roomId:           uuid("room_id").notNull().references(() => auditRooms.id, { onDelete: "cascade" }),
  organizationId:   uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  title:            text("title").notNull(),
  description:      text("description"),
  evidenceType:     text("evidence_type").notNull().default("custom"),
  status:           text("status").notNull().default("pending"),
  priority:         text("priority").notNull().default("medium"),
  dueDate:          date("due_date"),
  requestedById:    uuid("requested_by_id").references(() => externalUsers.id, { onDelete: "set null" }),
  assignedOwnerId:  uuid("assigned_owner_id").references(() => profiles.id, { onDelete: "set null" }),
  reviewerNotes:    text("reviewer_notes"),
  rejectionReason:  text("rejection_reason"),
  submittedAt:      timestamp("submitted_at", { withTimezone: true }),
  reviewedAt:       timestamp("reviewed_at", { withTimezone: true }),
  createdBy:        uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const evidenceResponses = pgTable("evidence_responses", {
  id:             uuid("id").primaryKey().defaultRandom(),
  requestId:      uuid("request_id").notNull().references(() => evidenceRequests.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  documentName:   text("document_name").notNull(),
  storagePath:    text("storage_path"),
  fileSize:       bigint("file_size", { mode: "number" }),
  contentType:    text("content_type"),
  description:    text("description"),
  sourceModule:   text("source_module"),
  sourceId:       text("source_id"),
  uploadedBy:     uuid("uploaded_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditReviews = pgTable("audit_reviews", {
  id:             uuid("id").primaryKey().defaultRandom(),
  roomId:         uuid("room_id").notNull().references(() => auditRooms.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  reviewerId:     uuid("reviewer_id").notNull().references(() => externalUsers.id, { onDelete: "cascade" }),
  reviewArea:     text("review_area").notNull().default("general"),
  status:         text("status").notNull().default("assigned"),
  notes:          text("notes"),
  completedAt:    timestamp("completed_at", { withTimezone: true }),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const externalComments = pgTable("external_comments", {
  id:               uuid("id").primaryKey().defaultRandom(),
  organizationId:   uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  roomId:           uuid("room_id").notNull().references(() => auditRooms.id, { onDelete: "cascade" }),
  entityType:       text("entity_type").notNull(),
  entityId:         text("entity_id").notNull(),
  parentId:         uuid("parent_id"),
  content:          text("content").notNull(),
  commentType:      text("comment_type").notNull().default("external"),
  isResolved:       boolean("is_resolved").notNull().default(false),
  resolvedBy:       uuid("resolved_by").references(() => profiles.id, { onDelete: "set null" }),
  resolvedAt:       timestamp("resolved_at", { withTimezone: true }),
  authorId:         uuid("author_id").references(() => profiles.id, { onDelete: "set null" }),
  externalAuthorId: uuid("external_author_id").references(() => externalUsers.id, { onDelete: "set null" }),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const externalFindings = pgTable("external_findings", {
  id:            uuid("id").primaryKey().defaultRandom(),
  roomId:        uuid("room_id").notNull().references(() => auditRooms.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  title:         text("title").notNull(),
  description:   text("description"),
  severity:      text("severity").notNull().default("medium"),
  findingType:   text("finding_type").notNull().default("observation"),
  status:        text("status").notNull().default("open"),
  framework:     text("framework"),
  controlRef:    text("control_ref"),
  recommendation: text("recommendation"),
  dueDate:       date("due_date"),
  evidenceRef:   text("evidence_ref"),
  raisedById:    uuid("raised_by_id").references(() => externalUsers.id, { onDelete: "set null" }),
  ownerId:       uuid("owner_id").references(() => profiles.id, { onDelete: "set null" }),
  issueId:       uuid("issue_id"),
  verifiedById:  uuid("verified_by_id").references(() => externalUsers.id, { onDelete: "set null" }),
  verifiedAt:    timestamp("verified_at", { withTimezone: true }),
  closedAt:      timestamp("closed_at", { withTimezone: true }),
  createdBy:     uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const externalAssessments = pgTable("external_assessments", {
  id:                  uuid("id").primaryKey().defaultRandom(),
  roomId:              uuid("room_id").notNull().references(() => auditRooms.id, { onDelete: "cascade" }),
  organizationId:      uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name:                text("name").notNull(),
  description:         text("description"),
  assessmentType:      text("assessment_type").notNull().default("custom"),
  status:              text("status").notNull().default("planning"),
  completionPct:       integer("completion_pct").notNull().default(0),
  startDate:           date("start_date"),
  endDate:             date("end_date"),
  leadAssessorId:      uuid("lead_assessor_id").references(() => externalUsers.id, { onDelete: "set null" }),
  openFindings:        integer("open_findings").notNull().default(0),
  pendingEvidence:     integer("pending_evidence").notNull().default(0),
  totalMilestones:     integer("total_milestones").notNull().default(0),
  completedMilestones: integer("completed_milestones").notNull().default(0),
  aiReadinessScore:    numeric("ai_readiness_score", { precision: 5, scale: 2 }),
  notes:               text("notes"),
  createdBy:           uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt:           timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const externalPermissions = pgTable("external_permissions", {
  id:              uuid("id").primaryKey().defaultRandom(),
  organizationId:  uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  externalUserId:  uuid("external_user_id").notNull().references(() => externalUsers.id, { onDelete: "cascade" }),
  resourceType:    text("resource_type").notNull(),
  resourceId:      text("resource_id").notNull(),
  permissionLevel: text("permission_level").notNull().default("read"),
  grantedBy:       uuid("granted_by").references(() => profiles.id, { onDelete: "set null" }),
  expiresAt:       timestamp("expires_at", { withTimezone: true }),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Auditor Collaboration™ types
export type AuditorOrganization = typeof auditorOrganizations.$inferSelect;
export type ExternalUser        = typeof externalUsers.$inferSelect;
export type AuditRoom           = typeof auditRooms.$inferSelect;
export type AuditRoomDocument   = typeof auditRoomDocuments.$inferSelect;
export type AuditRoomActivity   = typeof auditRoomActivities.$inferSelect;
export type EvidenceRequest     = typeof evidenceRequests.$inferSelect;
export type EvidenceResponse    = typeof evidenceResponses.$inferSelect;
export type AuditReview         = typeof auditReviews.$inferSelect;
export type ExternalComment     = typeof externalComments.$inferSelect;
export type ExternalFinding     = typeof externalFindings.$inferSelect;
export type ExternalAssessment  = typeof externalAssessments.$inferSelect;
export type ExternalPermission  = typeof externalPermissions.$inferSelect;

/* ============================================================
   Trust API Platform™ — Module 22
   ============================================================ */

export const tapProducts = pgTable("tap_products", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  name:               text("name").notNull(),
  slug:               text("slug").notNull(),
  description:        text("description"),
  category:           text("category").notNull().default("trust"),
  tier:               text("tier").notNull().default("free"),
  status:             text("status").notNull().default("active"),
  endpoints:          jsonb("endpoints").$type<string[]>().notNull().default([]),
  rateLimitPerDay:    integer("rate_limit_per_day").notNull().default(100),
  rateLimitPerMonth:  integer("rate_limit_per_month").notNull().default(1000),
  documentation:      text("documentation"),
  version:            text("version").notNull().default("v1"),
  isPublic:           boolean("is_public").notNull().default(true),
  createdAt:          timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tapClients = pgTable("tap_clients", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name:           text("name").notNull(),
  description:    text("description"),
  clientType:     text("client_type").notNull().default("application"),
  plan:           text("plan").notNull().default("free"),
  status:         text("status").notNull().default("active"),
  website:        text("website"),
  contactEmail:   text("contact_email"),
  allowedIps:     jsonb("allowed_ips").$type<string[]>().notNull().default([]),
  metadata:       jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdBy:      uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tapApiKeys = pgTable("tap_api_keys", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  organizationId:     uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  clientId:           uuid("client_id").references(() => tapClients.id, { onDelete: "cascade" }),
  name:               text("name").notNull(),
  keyPrefix:          text("key_prefix").notNull(),
  keyHash:            text("key_hash").notNull(),
  plan:               text("plan").notNull().default("free"),
  status:             text("status").notNull().default("active"),
  permissions:        jsonb("permissions").$type<string[]>().notNull().default(["read"]),
  expiresAt:          timestamp("expires_at", { withTimezone: true }),
  lastUsedAt:         timestamp("last_used_at", { withTimezone: true }),
  usageCount:         integer("usage_count").notNull().default(0),
  rateLimitOverride:  integer("rate_limit_override"),
  createdBy:          uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt:          timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tapSubscriptions = pgTable("tap_subscriptions", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  clientId:       uuid("client_id").notNull().references(() => tapClients.id, { onDelete: "cascade" }),
  productId:      uuid("product_id").notNull().references(() => tapProducts.id, { onDelete: "cascade" }),
  status:         text("status").notNull().default("active"),
  subscribedAt:   timestamp("subscribed_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt:      timestamp("expires_at", { withTimezone: true }),
  createdBy:      uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tapUsage = pgTable("tap_usage", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  clientId:       uuid("client_id").references(() => tapClients.id, { onDelete: "set null" }),
  keyId:          uuid("key_id").references(() => tapApiKeys.id, { onDelete: "set null" }),
  productId:      uuid("product_id").references(() => tapProducts.id, { onDelete: "set null" }),
  endpoint:       text("endpoint").notNull(),
  method:         text("method").notNull().default("GET"),
  statusCode:     integer("status_code"),
  latencyMs:      integer("latency_ms"),
  requestSize:    integer("request_size"),
  responseSize:   integer("response_size"),
  ipAddress:      text("ip_address"),
  userAgent:      text("user_agent"),
  errorMessage:   text("error_message"),
  calledAt:       timestamp("called_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tapWebhooks = pgTable("tap_webhooks", {
  id:               uuid("id").primaryKey().defaultRandom(),
  organizationId:   uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  clientId:         uuid("client_id").references(() => tapClients.id, { onDelete: "cascade" }),
  name:             text("name").notNull(),
  url:              text("url").notNull(),
  secret:           text("secret"),
  events:           jsonb("events").$type<string[]>().notNull().default([]),
  status:           text("status").notNull().default("active"),
  failureCount:     integer("failure_count").notNull().default(0),
  lastTriggeredAt:  timestamp("last_triggered_at", { withTimezone: true }),
  lastStatusCode:   integer("last_status_code"),
  createdBy:        uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tapWebhookDeliveries = pgTable("tap_webhook_deliveries", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  webhookId:      uuid("webhook_id").notNull().references(() => tapWebhooks.id, { onDelete: "cascade" }),
  eventType:      text("event_type").notNull(),
  payload:        jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  statusCode:     integer("status_code"),
  responseBody:   text("response_body"),
  attemptCount:   integer("attempt_count").notNull().default(1),
  deliveredAt:    timestamp("delivered_at", { withTimezone: true }),
  failedAt:       timestamp("failed_at", { withTimezone: true }),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tapRateLimits = pgTable("tap_rate_limits", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  clientId:       uuid("client_id").references(() => tapClients.id, { onDelete: "cascade" }),
  keyId:          uuid("key_id").references(() => tapApiKeys.id, { onDelete: "cascade" }),
  limitType:      text("limit_type").notNull().default("per_day"),
  limitValue:     integer("limit_value").notNull().default(100),
  currentCount:   integer("current_count").notNull().default(0),
  windowStart:    timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tapAuditEvents = pgTable("tap_audit_events", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  actorId:        uuid("actor_id").references(() => profiles.id, { onDelete: "set null" }),
  eventType:      text("event_type").notNull(),
  resourceType:   text("resource_type"),
  resourceId:     text("resource_id"),
  details:        jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
  ipAddress:      text("ip_address"),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Trust API Platform™ types
export type TapProduct          = typeof tapProducts.$inferSelect;
export type TapClient           = typeof tapClients.$inferSelect;
export type TapApiKey           = typeof tapApiKeys.$inferSelect;
export type TapSubscription     = typeof tapSubscriptions.$inferSelect;
export type TapUsage            = typeof tapUsage.$inferSelect;
export type TapWebhook          = typeof tapWebhooks.$inferSelect;
export type TapWebhookDelivery  = typeof tapWebhookDeliveries.$inferSelect;
export type TapRateLimit        = typeof tapRateLimits.$inferSelect;
export type TapAuditEvent       = typeof tapAuditEvents.$inferSelect;
export type AiTrustScore       = typeof aiTrustScores.$inferSelect;

/* ============================================================
   Trust Verification Authority™ (TVA™) — Module 23
   ============================================================ */

export const verificationPrograms = pgTable("verification_programs", {
  id:                   uuid("id").primaryKey().defaultRandom(),
  organizationId:       uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  name:                 text("name").notNull(),
  slug:                 text("slug").notNull(),
  description:          text("description"),
  programType:          text("program_type").notNull().default("custom"),
  status:               text("status").notNull().default("active"),
  minTrustScore:        integer("min_trust_score").notNull().default(85),
  minControlHealth:     integer("min_control_health").notNull().default(80),
  minEvidenceCoverage:  integer("min_evidence_coverage").notNull().default(80),
  requiredControls:     jsonb("required_controls").$type<string[]>().notNull().default([]),
  requiredEvidence:     jsonb("required_evidence").$type<string[]>().notNull().default([]),
  requiredAssessments:  jsonb("required_assessments").$type<string[]>().notNull().default([]),
  requirements:         jsonb("requirements").$type<Array<{ id: string; label: string }>>().notNull().default([]),
  reviewFrequency:      text("review_frequency").notNull().default("annual"),
  validityMonths:       integer("validity_months").notNull().default(12),
  badgeColor:           text("badge_color").notNull().default("#6366f1"),
  badgeIcon:            text("badge_icon"),
  isPublic:             boolean("is_public").notNull().default(true),
  createdBy:            uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt:            timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:            timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tvaVerifications = pgTable("tva_verifications", {
  id:                   uuid("id").primaryKey().defaultRandom(),
  organizationId:       uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  programId:            uuid("program_id").notNull().references(() => verificationPrograms.id, { onDelete: "restrict" }),
  certificateId:        uuid("certificate_id"),
  status:               text("status").notNull().default("pending"),
  verificationLevel:    text("verification_level").notNull().default("level_1"),
  readinessScore:       integer("readiness_score"),
  trustScoreAtApply:    integer("trust_score_at_apply"),
  appliedAt:            timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
  reviewStartedAt:      timestamp("review_started_at", { withTimezone: true }),
  decidedAt:            timestamp("decided_at", { withTimezone: true }),
  expiresAt:            timestamp("expires_at", { withTimezone: true }),
  lastMonitoredAt:      timestamp("last_monitored_at", { withTimezone: true }),
  applicantId:          uuid("applicant_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  assignedReviewerId:   uuid("assigned_reviewer_id").references(() => profiles.id, { onDelete: "set null" }),
  decisionNotes:        text("decision_notes"),
  conditions:           jsonb("conditions").$type<string[]>().notNull().default([]),
  suspensionReason:     text("suspension_reason"),
  revocationReason:     text("revocation_reason"),
  metadata:             jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt:            timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:            timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verificationReviews = pgTable("verification_reviews", {
  id:               uuid("id").primaryKey().defaultRandom(),
  organizationId:   uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  verificationId:   uuid("verification_id").notNull().references(() => tvaVerifications.id, { onDelete: "cascade" }),
  reviewType:       text("review_type").notNull().default("initial"),
  status:           text("status").notNull().default("pending"),
  reviewerId:       uuid("reviewer_id").references(() => profiles.id, { onDelete: "set null" }),
  reviewerNotes:    text("reviewer_notes"),
  checklist:        jsonb("checklist").$type<Record<string, boolean>>().notNull().default({}),
  score:            integer("score"),
  recommendation:   text("recommendation"),
  startedAt:        timestamp("started_at", { withTimezone: true }),
  completedAt:      timestamp("completed_at", { withTimezone: true }),
  dueDate:          date("due_date"),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verificationEvidence = pgTable("verification_evidence", {
  id:               uuid("id").primaryKey().defaultRandom(),
  organizationId:   uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  verificationId:   uuid("verification_id").notNull().references(() => tvaVerifications.id, { onDelete: "cascade" }),
  evidenceType:     text("evidence_type").notNull().default("policy"),
  title:            text("title").notNull(),
  description:      text("description"),
  sourceId:         uuid("source_id"),
  sourceTable:      text("source_table"),
  fileUrl:          text("file_url"),
  status:           text("status").notNull().default("pending"),
  reviewerNotes:    text("reviewer_notes"),
  freshnessDays:    integer("freshness_days"),
  submittedBy:      uuid("submitted_by").references(() => profiles.id, { onDelete: "set null" }),
  reviewedBy:       uuid("reviewed_by").references(() => profiles.id, { onDelete: "set null" }),
  submittedAt:      timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt:       timestamp("reviewed_at", { withTimezone: true }),
  expiresAt:        timestamp("expires_at", { withTimezone: true }),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verificationBadges = pgTable("verification_badges", {
  id:                uuid("id").primaryKey().defaultRandom(),
  organizationId:    uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  verificationId:    uuid("verification_id").notNull().references(() => tvaVerifications.id, { onDelete: "cascade" }),
  programId:         uuid("program_id").notNull().references(() => verificationPrograms.id, { onDelete: "restrict" }),
  badgeType:         text("badge_type").notNull().default("audt_verified"),
  name:              text("name").notNull(),
  description:       text("description"),
  status:            text("status").notNull().default("active"),
  issuedAt:          timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt:         timestamp("expires_at", { withTimezone: true }),
  revokedAt:         timestamp("revoked_at", { withTimezone: true }),
  revocationReason:  text("revocation_reason"),
  badgeData:         jsonb("badge_data").$type<Record<string, unknown>>().notNull().default({}),
  issuedBy:          uuid("issued_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt:         timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verificationCertificates = pgTable("verification_certificates", {
  id:                  uuid("id").primaryKey().defaultRandom(),
  organizationId:      uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  verificationId:      uuid("verification_id").notNull().references(() => tvaVerifications.id, { onDelete: "cascade" }),
  programId:           uuid("program_id").notNull().references(() => verificationPrograms.id, { onDelete: "restrict" }),
  certificateNumber:   text("certificate_number").notNull().unique(),
  verificationLevel:   text("verification_level").notNull().default("level_1"),
  status:              text("status").notNull().default("active"),
  issuedAt:            timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt:           timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt:           timestamp("revoked_at", { withTimezone: true }),
  revocationReason:    text("revocation_reason"),
  verificationHash:    text("verification_hash").notNull(),
  publicUrl:           text("public_url").notNull(),
  qrData:              text("qr_data"),
  issuedBy:            uuid("issued_by").references(() => profiles.id, { onDelete: "set null" }),
  certificateData:     jsonb("certificate_data").$type<Record<string, unknown>>().notNull().default({}),
  createdAt:           timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verificationRegistry = pgTable("verification_registry", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  organizationId:     uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  certificateId:      uuid("certificate_id").notNull().references(() => verificationCertificates.id, { onDelete: "cascade" }),
  displayName:        text("display_name").notNull(),
  industry:           text("industry"),
  country:            text("country"),
  trustScore:         integer("trust_score"),
  verificationLevel:  text("verification_level").notNull().default("level_1"),
  programName:        text("program_name").notNull(),
  badgeTypes:         jsonb("badge_types").$type<string[]>().notNull().default([]),
  isPublic:           boolean("is_public").notNull().default(true),
  publishedAt:        timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt:          timestamp("expires_at", { withTimezone: true }),
  createdAt:          timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verificationEvents = pgTable("verification_events", {
  id:               uuid("id").primaryKey().defaultRandom(),
  organizationId:   uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  verificationId:   uuid("verification_id").references(() => tvaVerifications.id, { onDelete: "cascade" }),
  eventType:        text("event_type").notNull(),
  actorId:          uuid("actor_id").references(() => profiles.id, { onDelete: "set null" }),
  details:          jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
  ipAddress:        text("ip_address"),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verificationRenewals = pgTable("verification_renewals", {
  id:               uuid("id").primaryKey().defaultRandom(),
  organizationId:   uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  verificationId:   uuid("verification_id").notNull().references(() => tvaVerifications.id, { onDelete: "cascade" }),
  certificateId:    uuid("certificate_id").references(() => verificationCertificates.id, { onDelete: "set null" }),
  status:           text("status").notNull().default("upcoming"),
  renewalDueDate:   date("renewal_due_date").notNull(),
  startedAt:        timestamp("started_at", { withTimezone: true }),
  completedAt:      timestamp("completed_at", { withTimezone: true }),
  previousCertId:   uuid("previous_cert_id").references(() => verificationCertificates.id, { onDelete: "set null" }),
  initiatedBy:      uuid("initiated_by").references(() => profiles.id, { onDelete: "set null" }),
  notes:            text("notes"),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verificationAssessments = pgTable("verification_assessments", {
  id:                  uuid("id").primaryKey().defaultRandom(),
  organizationId:      uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  verificationId:      uuid("verification_id").notNull().references(() => tvaVerifications.id, { onDelete: "cascade" }),
  assessorId:          uuid("assessor_id").references(() => profiles.id, { onDelete: "set null" }),
  governanceScore:     integer("governance_score"),
  riskScore:           integer("risk_score"),
  controlScore:        integer("control_score"),
  complianceScore:     integer("compliance_score"),
  privacyScore:        integer("privacy_score"),
  contractScore:       integer("contract_score"),
  vendorScore:         integer("vendor_score"),
  aiGovernanceScore:   integer("ai_governance_score"),
  overallScore:        integer("overall_score"),
  findings:            jsonb("findings").$type<Array<{ area: string; note: string; severity: string }>>().notNull().default([]),
  recommendations:     jsonb("recommendations").$type<string[]>().notNull().default([]),
  aiSummary:           text("ai_summary"),
  status:              text("status").notNull().default("pending"),
  assessedAt:          timestamp("assessed_at", { withTimezone: true }),
  createdAt:           timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verificationDecisions = pgTable("verification_decisions", {
  id:               uuid("id").primaryKey().defaultRandom(),
  organizationId:   uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  verificationId:   uuid("verification_id").notNull().references(() => tvaVerifications.id, { onDelete: "cascade" }),
  decision:         text("decision").notNull(),
  decidedBy:        uuid("decided_by").references(() => profiles.id, { onDelete: "set null" }),
  rationale:        text("rationale"),
  conditions:       jsonb("conditions").$type<string[]>().notNull().default([]),
  effectiveDate:    date("effective_date"),
  reviewDate:       date("review_date"),
  appealDeadline:   date("appeal_deadline"),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verificationAuditors = pgTable("verification_auditors", {
  id:               uuid("id").primaryKey().defaultRandom(),
  organizationId:   uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  profileId:        uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  role:             text("role").notNull().default("trust_reviewer"),
  status:           text("status").notNull().default("active"),
  specializations:  jsonb("specializations").$type<string[]>().notNull().default([]),
  assignedAt:       timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Trust Verification Authority™ types
export type VerificationProgram     = typeof verificationPrograms.$inferSelect;
export type TvaVerification         = typeof tvaVerifications.$inferSelect;
export type VerificationReview      = typeof verificationReviews.$inferSelect;
export type VerificationEvidence    = typeof verificationEvidence.$inferSelect;
export type VerificationBadge       = typeof verificationBadges.$inferSelect;
export type VerificationCertificate = typeof verificationCertificates.$inferSelect;
export type VerificationRegistry    = typeof verificationRegistry.$inferSelect;
export type VerificationEvent       = typeof verificationEvents.$inferSelect;
export type VerificationRenewal     = typeof verificationRenewals.$inferSelect;
export type VerificationAssessment  = typeof verificationAssessments.$inferSelect;
export type VerificationDecision    = typeof verificationDecisions.$inferSelect;
export type VerificationAuditor     = typeof verificationAuditors.$inferSelect;

/* ============================================================
   Continuous Compliance™ — Module 28
   ============================================================ */

/** Prebuilt and custom automated compliance checks. */
export const complianceChecks = pgTable(
  "compliance_checks",
  {
    id:               uuid("id").primaryKey().defaultRandom(),
    organizationId:   uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    name:             text("name").notNull(),
    slug:             text("slug").notNull(),
    description:      text("description"),
    category:         text("category").notNull().default("custom"),
    checkType:        text("check_type").notNull().default("manual"),
    severity:         text("severity").notNull().default("medium"),
    schedule:         text("schedule").notNull().default("daily"),
    status:           text("status").notNull().default("active"),
    isBuiltin:        boolean("is_builtin").notNull().default(false),
    checkLogic:       jsonb("check_logic").notNull().default({}),
    remediationGuide: text("remediation_guide"),
    frameworks:       jsonb("frameworks").$type<string[]>().notNull().default([]),
    createdBy:        uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt:        timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("cc_org_idx").on(t.organizationId),
    index("cc_category_idx").on(t.category),
    index("cc_status_idx").on(t.status),
  ]
);

/** Execution log per check run. */
export const complianceCheckRuns = pgTable(
  "compliance_check_runs",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    checkId:        uuid("check_id").notNull().references(() => complianceChecks.id, { onDelete: "cascade" }),
    result:         text("result").notNull().default("unknown"),
    score:          integer("score"),
    details:        jsonb("details").notNull().default({}),
    rawData:        jsonb("raw_data").notNull().default({}),
    errorMessage:   text("error_message"),
    triggeredBy:    text("triggered_by").notNull().default("schedule"),
    runBy:          uuid("run_by").references(() => profiles.id, { onDelete: "set null" }),
    startedAt:      timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt:    timestamp("completed_at", { withTimezone: true }),
    createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("ccr_org_idx").on(t.organizationId),
    index("ccr_check_idx").on(t.checkId),
    index("ccr_result_idx").on(t.organizationId, t.result),
  ]
);

/** Auto-generated evidence from check runs. */
export const ccEvidence = pgTable(
  "compliance_evidence",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    checkRunId:     uuid("check_run_id").references(() => complianceCheckRuns.id, { onDelete: "set null" }),
    name:           text("name").notNull(),
    description:    text("description"),
    source:         text("source").notNull().default("system_generated"),
    content:        jsonb("content").notNull().default({}),
    hash:           text("hash"),
    status:         text("status").notNull().default("valid"),
    expiresAt:      timestamp("expires_at", { withTimezone: true }),
    collectedAt:    timestamp("collected_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("cce_org_idx").on(t.organizationId),
    index("cce_run_idx").on(t.checkRunId),
    index("cce_status_idx").on(t.organizationId, t.status),
  ]
);

/** Check results mapped to controls. */
export const controlValidations = pgTable(
  "control_validations",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    checkId:        uuid("check_id").notNull().references(() => complianceChecks.id, { onDelete: "cascade" }),
    checkRunId:     uuid("check_run_id").references(() => complianceCheckRuns.id, { onDelete: "set null" }),
    controlId:      uuid("control_id").references(() => controls.id, { onDelete: "cascade" }),
    state:          text("state").notNull().default("unknown"),
    notes:          text("notes"),
    validatedAt:    timestamp("validated_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("cv_org_idx").on(t.organizationId),
    index("cv_control_idx").on(t.controlId),
  ]
);

/** Checks mapped to compliance frameworks. */
export const frameworkMappings = pgTable(
  "framework_mappings",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    checkId:        uuid("check_id").notNull().references(() => complianceChecks.id, { onDelete: "cascade" }),
    frameworkId:    uuid("framework_id").references(() => frameworks.id, { onDelete: "cascade" }),
    frameworkName:  text("framework_name").notNull(),
    controlRef:     text("control_ref"),
    requirement:    text("requirement"),
    createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("fm_org_idx").on(t.organizationId),
    index("fm_framework_idx").on(t.frameworkId),
  ]
);

/** Access review campaigns. */
export const accessReviews = pgTable(
  "access_reviews",
  {
    id:              uuid("id").primaryKey().defaultRandom(),
    organizationId:  uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name:            text("name").notNull(),
    description:     text("description"),
    campaignType:    text("campaign_type").notNull().default("quarterly"),
    status:          text("status").notNull().default("draft"),
    scope:           text("scope"),
    riskLevel:       text("risk_level").notNull().default("medium"),
    dueDate:         date("due_date"),
    startedAt:       timestamp("started_at", { withTimezone: true }),
    completedAt:     timestamp("completed_at", { withTimezone: true }),
    completionRate:  integer("completion_rate").notNull().default(0),
    totalUsers:      integer("total_users").notNull().default(0),
    reviewedUsers:   integer("reviewed_users").notNull().default(0),
    approvedCount:   integer("approved_count").notNull().default(0),
    revokedCount:    integer("revoked_count").notNull().default(0),
    createdBy:       uuid("created_by").notNull().references(() => profiles.id, { onDelete: "restrict" }),
    createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt:       timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("ar_org_idx").on(t.organizationId),
    index("ar_status_idx").on(t.organizationId, t.status),
  ]
);

/** Per-user review items in an access review campaign. */
export const accessReviewUsers = pgTable(
  "access_review_users",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    reviewId:       uuid("review_id").notNull().references(() => accessReviews.id, { onDelete: "cascade" }),
    userId:         uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
    userName:       text("user_name").notNull(),
    userEmail:      text("user_email").notNull(),
    role:           text("role"),
    department:     text("department"),
    riskLevel:      text("risk_level").notNull().default("medium"),
    decision:       text("decision"),
    reviewerId:     uuid("reviewer_id").references(() => profiles.id, { onDelete: "set null" }),
    reviewedAt:     timestamp("reviewed_at", { withTimezone: true }),
    notes:          text("notes"),
    createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("aru_org_idx").on(t.organizationId),
    index("aru_review_idx").on(t.reviewId),
  ]
);

/** Policy attestation campaigns. */
export const attestations = pgTable(
  "attestations",
  {
    id:              uuid("id").primaryKey().defaultRandom(),
    organizationId:  uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    title:           text("title").notNull(),
    description:     text("description"),
    policyType:      text("policy_type").notNull().default("security_policy"),
    status:          text("status").notNull().default("active"),
    content:         text("content"),
    version:         text("version").notNull().default("1.0"),
    dueDate:         date("due_date"),
    expiresAt:       timestamp("expires_at", { withTimezone: true }),
    totalAssigned:   integer("total_assigned").notNull().default(0),
    totalCompleted:  integer("total_completed").notNull().default(0),
    completionRate:  integer("completion_rate").notNull().default(0),
    createdBy:       uuid("created_by").notNull().references(() => profiles.id, { onDelete: "restrict" }),
    createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt:       timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("att_org_idx").on(t.organizationId),
    index("att_status_idx").on(t.organizationId, t.status),
  ]
);

/** Per-user responses to attestations. */
export const attestationResponses = pgTable(
  "attestation_responses",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    attestationId:  uuid("attestation_id").notNull().references(() => attestations.id, { onDelete: "cascade" }),
    userId:         uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    status:         text("status").notNull().default("assigned"),
    respondedAt:    timestamp("responded_at", { withTimezone: true }),
    notes:          text("notes"),
    createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("ar2_org_idx").on(t.organizationId),
    index("ar2_att_idx").on(t.attestationId),
  ]
);

/** Training campaigns. */
export const trainingCampaigns = pgTable(
  "training_campaigns",
  {
    id:              uuid("id").primaryKey().defaultRandom(),
    organizationId:  uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    title:           text("title").notNull(),
    description:     text("description"),
    trainingType:    text("training_type").notNull().default("security_awareness"),
    status:          text("status").notNull().default("draft"),
    dueDate:         date("due_date"),
    totalAssigned:   integer("total_assigned").notNull().default(0),
    totalCompleted:  integer("total_completed").notNull().default(0),
    completionRate:  integer("completion_rate").notNull().default(0),
    passingScore:    integer("passing_score").notNull().default(80),
    createdBy:       uuid("created_by").notNull().references(() => profiles.id, { onDelete: "restrict" }),
    createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt:       timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("tc_org_idx").on(t.organizationId),
    index("tc_status_idx").on(t.organizationId, t.status),
  ]
);

/** Per-user training assignments. */
export const trainingAssignments = pgTable(
  "training_assignments",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    campaignId:     uuid("campaign_id").notNull().references(() => trainingCampaigns.id, { onDelete: "cascade" }),
    userId:         uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    status:         text("status").notNull().default("assigned"),
    score:          integer("score"),
    completedAt:    timestamp("completed_at", { withTimezone: true }),
    dueDate:        date("due_date"),
    createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("ta_org_idx").on(t.organizationId),
    index("ta_campaign_idx").on(t.campaignId),
    index("ta_user_idx").on(t.userId),
  ]
);

/** Workforce onboarding/offboarding events. */
export const workforceEvents = pgTable(
  "workforce_events",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    eventType:      text("event_type").notNull(),
    status:         text("status").notNull().default("pending"),
    userId:         uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
    userName:       text("user_name"),
    userEmail:      text("user_email"),
    department:     text("department"),
    checklist:      jsonb("checklist").$type<Array<{ id: string; label: string; done: boolean }>>().notNull().default([]),
    completedSteps: integer("completed_steps").notNull().default(0),
    totalSteps:     integer("total_steps").notNull().default(0),
    notes:          text("notes"),
    dueDate:        date("due_date"),
    completedAt:    timestamp("completed_at", { withTimezone: true }),
    createdBy:      uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("we_org_idx").on(t.organizationId),
    index("we_status_idx").on(t.organizationId, t.status),
    index("we_type_idx").on(t.organizationId, t.eventType),
  ]
);

/** Compliance signals generated from integrations and events. */
export const complianceSignals = pgTable(
  "compliance_signals",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    signalType:     text("signal_type").notNull(),
    severity:       text("severity").notNull().default("medium"),
    status:         text("status").notNull().default("open"),
    title:          text("title").notNull(),
    description:    text("description"),
    sourceModule:   text("source_module"),
    sourceId:       uuid("source_id"),
    metadata:       jsonb("metadata").notNull().default({}),
    resolvedAt:     timestamp("resolved_at", { withTimezone: true }),
    resolvedBy:     uuid("resolved_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("cs_org_idx").on(t.organizationId),
    index("cs_status_idx").on(t.organizationId, t.status),
    index("cs_severity_idx").on(t.organizationId, t.severity),
    index("cs_created_idx").on(t.organizationId, t.createdAt),
  ]
);

/** Org-wide compliance health score history. */
export const complianceHealthScores = pgTable(
  "compliance_health_scores",
  {
    id:                 uuid("id").primaryKey().defaultRandom(),
    organizationId:     uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    score:              integer("score").notNull(),
    level:              text("level").notNull().default("needs_attention"),
    controlHealth:      integer("control_health"),
    evidenceFreshness:  integer("evidence_freshness"),
    checkSuccessRate:   integer("check_success_rate"),
    openFindings:       integer("open_findings"),
    openRisks:          integer("open_risks"),
    trainingCompletion: integer("training_completion"),
    accessReviewRate:   integer("access_review_rate"),
    trustScore:         integer("trust_score"),
    metadata:           jsonb("metadata").notNull().default({}),
    snapshotAt:         timestamp("snapshot_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt:          timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("chs_org_idx").on(t.organizationId),
  ]
);

/** Exception approvals for failed checks. */
export const complianceExceptions = pgTable(
  "compliance_exceptions",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    checkId:        uuid("check_id").references(() => complianceChecks.id, { onDelete: "set null" }),
    title:          text("title").notNull(),
    reason:         text("reason").notNull(),
    riskAcceptance: text("risk_acceptance"),
    status:         text("status").notNull().default("pending"),
    approvedBy:     uuid("approved_by").references(() => profiles.id, { onDelete: "set null" }),
    approvedAt:     timestamp("approved_at", { withTimezone: true }),
    expiresAt:      timestamp("expires_at", { withTimezone: true }),
    requestedBy:    uuid("requested_by").notNull().references(() => profiles.id, { onDelete: "restrict" }),
    createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("cex_org_idx").on(t.organizationId),
    index("cex_status_idx").on(t.organizationId, t.status),
  ]
);

/** If-this-then-that compliance automation rules. */
export const automationRules = pgTable(
  "automation_rules",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name:           text("name").notNull(),
    description:    text("description"),
    status:         text("status").notNull().default("active"),
    triggerType:    text("trigger_type").notNull().default("check_failed"),
    triggerConfig:  jsonb("trigger_config").notNull().default({}),
    actions:        jsonb("actions").$type<Array<{ type: string; config: Record<string, unknown> }>>().notNull().default([]),
    runCount:       integer("run_count").notNull().default(0),
    lastRunAt:      timestamp("last_run_at", { withTimezone: true }),
    createdBy:      uuid("created_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("rul_org_idx").on(t.organizationId),
    index("rul_status_idx").on(t.organizationId, t.status),
  ]
);

/** Per-framework continuous readiness snapshots. */
export const continuousReadiness = pgTable(
  "continuous_readiness",
  {
    id:               uuid("id").primaryKey().defaultRandom(),
    organizationId:   uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    frameworkId:      uuid("framework_id").references(() => frameworks.id, { onDelete: "cascade" }),
    frameworkName:    text("framework_name").notNull(),
    readinessScore:   integer("readiness_score").notNull().default(0),
    passingChecks:    integer("passing_checks").notNull().default(0),
    totalChecks:      integer("total_checks").notNull().default(0),
    passingControls:  integer("passing_controls").notNull().default(0),
    totalControls:    integer("total_controls").notNull().default(0),
    evidenceCoverage: integer("evidence_coverage").notNull().default(0),
    trend:            text("trend").notNull().default("stable"),
    snapshotAt:       timestamp("snapshot_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt:        timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("cr_org_idx").on(t.organizationId),
    index("cr_framework_idx").on(t.frameworkId),
  ]
);

// Continuous Compliance™ types
export type ComplianceCheck        = typeof complianceChecks.$inferSelect;
export type ComplianceCheckRun     = typeof complianceCheckRuns.$inferSelect;
export type CcEvidence             = typeof ccEvidence.$inferSelect;
export type ControlValidation      = typeof controlValidations.$inferSelect;
export type FrameworkMapping       = typeof frameworkMappings.$inferSelect;
export type AccessReview           = typeof accessReviews.$inferSelect;
export type AccessReviewUser       = typeof accessReviewUsers.$inferSelect;
export type Attestation            = typeof attestations.$inferSelect;
export type AttestationResponse    = typeof attestationResponses.$inferSelect;
export type TrainingCampaign       = typeof trainingCampaigns.$inferSelect;
export type TrainingAssignment     = typeof trainingAssignments.$inferSelect;
export type WorkforceEvent         = typeof workforceEvents.$inferSelect;
export type ComplianceSignal       = typeof complianceSignals.$inferSelect;
export type ComplianceHealthScore  = typeof complianceHealthScores.$inferSelect;
export type ComplianceException    = typeof complianceExceptions.$inferSelect;
export type AutomationRule         = typeof automationRules.$inferSelect;
export type ContinuousReadiness    = typeof continuousReadiness.$inferSelect;
