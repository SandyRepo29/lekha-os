/** Client-safe constants — no server imports. */

export type EntityColor = {
  fill: string;
  stroke: string;
  text: string;
};

export const ENTITY_COLORS: Record<string, EntityColor> = {
  vendor:      { fill: "#3b82f6", stroke: "#60a5fa", text: "#dbeafe" },
  evidence:    { fill: "#8b5cf6", stroke: "#a78bfa", text: "#ede9fe" },
  control:     { fill: "#10b981", stroke: "#34d399", text: "#d1fae5" },
  risk:        { fill: "#ef4444", stroke: "#f87171", text: "#fee2e2" },
  audit:       { fill: "#f59e0b", stroke: "#fbbf24", text: "#fef3c7" },
  finding:     { fill: "#f97316", stroke: "#fb923c", text: "#ffedd5" },
  policy:      { fill: "#06b6d4", stroke: "#22d3ee", text: "#cffafe" },
  framework:   { fill: "#6366f1", stroke: "#818cf8", text: "#e0e7ff" },
  trust_score: { fill: "#ec4899", stroke: "#f472b6", text: "#fce7f3" },
  org_trust:   { fill: "#14b8a6", stroke: "#2dd4bf", text: "#ccfbf1" },
};

export const ENTITY_LABELS: Record<string, string> = {
  vendor: "Vendor", evidence: "Evidence", control: "Control",
  risk: "Risk", audit: "Audit", finding: "Finding",
  policy: "Policy", framework: "Framework",
  trust_score: "Trust Score", org_trust: "Org Trust",
};

export const RELATIONSHIP_LABELS: Record<string, string> = {
  vendor_provides_evidence: "provides evidence",
  vendor_has_risk: "has risk",
  vendor_linked_control: "linked to control",
  vendor_has_audit: "audited via",
  evidence_supports_control: "supports control",
  evidence_in_framework: "in framework",
  control_reduces_risk: "reduces risk",
  control_in_audit: "audited in",
  control_supported_by_policy: "supported by policy",
  control_in_framework: "in framework",
  audit_has_finding: "has finding",
  finding_creates_risk: "creates risk",
  policy_in_framework: "in framework",
  risk_affects_trust_score: "affects trust",
  trust_score_affects_org_trust: "affects org trust",
};
