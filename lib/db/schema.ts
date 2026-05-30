import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  date,
  integer,
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
  id: uuid("id").primaryKey(), // === auth.users.id
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
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("memberships_org_user_uniq").on(t.organizationId, t.userId),
    index("memberships_user_idx").on(t.userId),
  ]
);

/* ============================================================
   Vendor Governance (first module)
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
    createdBy: uuid("created_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("vendors_org_idx").on(t.organizationId)]
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
    /** e.g. "ISO 27001", "SOC 2", "GST Certificate", "MSA". */
    documentType: text("document_type").notNull(),
    /** Path within the Supabase Storage bucket. */
    storagePath: text("storage_path"),
    status: documentStatus("status").notNull().default("missing"),
    issuedOn: date("issued_on"),
    expiresOn: date("expires_on"),
    /** Structured fields extracted by Lekha AI. */
    extracted: jsonb("extracted"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("vendor_documents_org_idx").on(t.organizationId),
    index("vendor_documents_vendor_idx").on(t.vendorId),
  ]
);

/* ============================================================
   Audit log — every meaningful action is recorded.
   A trust product must itself be fully auditable.
   ============================================================ */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => profiles.id),
    action: text("action").notNull(), // e.g. "vendor.created"
    entityType: text("entity_type"), // e.g. "vendor"
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
export type Membership = typeof memberships.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type VendorDocument = typeof vendorDocuments.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
