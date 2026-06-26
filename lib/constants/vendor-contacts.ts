/** Pure constants — no DB imports. Safe to import in client components. */

export type ContactType =
  | "primary"
  | "security"
  | "privacy_officer"
  | "legal"
  | "finance"
  | "technical"
  | "escalation";

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  primary:         "Primary",
  security:        "Security",
  privacy_officer: "Privacy Officer",
  legal:           "Legal",
  finance:         "Finance",
  technical:       "Technical",
  escalation:      "Escalation",
};
