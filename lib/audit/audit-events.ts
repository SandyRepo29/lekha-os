import { recordAudit } from "@/lib/repositories/audit-repo";
import type { AuditEntry } from "@/lib/repositories/audit-repo";

/** Canonical audit event type constants. */
export const AuditEvent = {
  // Auth
  AUTH_LOGIN: "auth.login",
  AUTH_LOGOUT: "auth.logout",
  AUTH_SIGNUP: "auth.signup",
  AUTH_PASSWORD_RESET: "auth.password_reset",
  AUTH_MFA_ENABLED: "auth.mfa_enabled",
  AUTH_MFA_DISABLED: "auth.mfa_disabled",

  // Vendors
  VENDOR_CREATED: "vendor.created",
  VENDOR_UPDATED: "vendor.updated",
  VENDOR_DELETED: "vendor.deleted",
  VENDOR_STATUS_CHANGED: "vendor.status_changed",
  VENDOR_RESTORED: "vendor.restored",

  // Risks
  RISK_CREATED: "risk.created",
  RISK_UPDATED: "risk.updated",
  RISK_DELETED: "risk.deleted",
  RISK_STATUS_CHANGED: "risk.status_changed",

  // Controls
  CONTROL_CREATED: "control.created",
  CONTROL_UPDATED: "control.updated",
  CONTROL_DELETED: "control.deleted",
  CONTROL_TEST_ADDED: "control.test_added",

  // Evidence
  EVIDENCE_CREATED: "evidence.created",
  EVIDENCE_UPDATED: "evidence.updated",
  EVIDENCE_DELETED: "evidence.deleted",
  EVIDENCE_APPROVED: "evidence.approved",

  // Policies
  POLICY_CREATED: "policy.created",
  POLICY_UPDATED: "policy.updated",
  POLICY_PUBLISHED: "policy.published",

  // Contracts
  CONTRACT_CREATED: "contract.created",
  CONTRACT_UPDATED: "contract.updated",
  CONTRACT_EXPIRED: "contract.expired",

  // Team
  TEAM_MEMBER_INVITED: "team.member_invited",
  TEAM_ROLE_CHANGED: "team.role_changed",
  TEAM_MEMBER_REMOVED: "team.member_removed",
  TEAM_MEMBER_DEACTIVATED: "team.member_deactivated",
  TEAM_OWNERSHIP_TRANSFERRED: "team.ownership_transferred",

  // Settings
  ORG_SETTINGS_UPDATED: "settings.org_updated",
  BRANDING_UPDATED: "settings.branding_updated",
  API_KEY_CREATED: "settings.api_key_created",
  API_KEY_REVOKED: "settings.api_key_revoked",
  API_KEY_ROTATED: "settings.api_key_rotated",
  INTEGRATION_CONNECTED: "settings.integration_connected",
  INTEGRATION_DISCONNECTED: "settings.integration_disconnected",

  // Audits
  AUDIT_CREATED: "audit.created",
  AUDIT_UPDATED: "audit.updated",
  AUDIT_STARTED: "audit.started",
  AUDIT_COMPLETED: "audit.completed",
  AUDIT_CANCELLED: "audit.cancelled",
  AUDIT_DELETED: "audit.deleted",
  FINDING_CREATED: "audit.finding_created",
  CAPA_CREATED: "audit.capa_created",
  CAPA_COMPLETED: "audit.capa_completed",
} as const;

export type AuditEventType = (typeof AuditEvent)[keyof typeof AuditEvent];

/**
 * Fire-and-forget audit log helper.
 * Never throws — swallows all errors so callers are not blocked.
 * Use this for out-of-transaction audit calls (auth events, background work).
 * For in-transaction audit calls, use recordAudit() directly.
 */
export function audit(params: AuditEntry): void {
  recordAudit(params).catch(() => {});
}
