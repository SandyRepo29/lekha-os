import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  date,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ============================================================
   Enums
   ============================================================ */
export const membershipRole = pgEnum("membership_role", [
  "owner",
  "admin",
  "member",
  "viewer",
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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Mirrors auth.users (id === Supabase auth uid). Profile metadata. */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
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
    storagePath: text("storage_path"),
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
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("audit_logs_org_idx").on(t.organizationId, t.createdAt)]
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
