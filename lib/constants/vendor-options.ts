export const VENDOR_CATEGORIES = [
  { group: "Technology", items: ["SaaS / Software", "Cloud / Hosting", "Cybersecurity", "IT Services", "Network / Telecom"] },
  { group: "Finance", items: ["Payments", "Banking / NBFC", "Insurance", "Accounting"] },
  { group: "Operations", items: ["Staffing / HR", "Logistics", "Manufacturing", "Facilities"] },
  { group: "Professional Services", items: ["Legal", "Consulting", "Audit / Assurance", "Marketing"] },
  { group: "Data & AI", items: ["Data Processing", "AI / ML", "Analytics"] },
] as const;

export const FLAT_CATEGORIES = VENDOR_CATEGORIES.flatMap((g) => g.items);

export const DOCUMENT_TYPES = [
  {
    group: "Security & Privacy",
    items: [
      "ISO/IEC 27001",
      "SOC 2 Type I",
      "SOC 2 Type II",
      "ISO/IEC 27701 (Privacy)",
      "Cyber Essentials",
      "VAPT Report",
    ],
  },
  {
    group: "India Compliance",
    items: [
      "DPDP Compliance Declaration",
      "GST Registration Certificate",
      "MCA Incorporation Certificate",
      "MSME Registration",
      "FSSAI License",
      "RBI Authorization",
    ],
  },
  {
    group: "Quality & Audit",
    items: [
      "ISO 9001 (Quality)",
      "ISO 22301 (BCMS)",
      "Internal Audit Report",
      "External Audit Report",
    ],
  },
  {
    group: "Contracts & Legal",
    items: [
      "Master Service Agreement (MSA)",
      "Data Processing Agreement (DPA)",
      "Non-Disclosure Agreement (NDA)",
      "SLA / OLA",
    ],
  },
  {
    group: "Insurance",
    items: [
      "Cyber Liability Insurance",
      "Professional Indemnity",
      "General Liability",
    ],
  },
] as const;

export const FLAT_DOC_TYPES = DOCUMENT_TYPES.flatMap((g) => g.items);

export const RISK_LEVELS = [
  { value: "low",      label: "Low",      hint: "Minimal exposure, standard controls" },
  { value: "medium",   label: "Medium",   hint: "Moderate exposure, enhanced monitoring" },
  { value: "high",     label: "High",     hint: "Significant exposure, strict controls required" },
  { value: "critical", label: "Critical", hint: "Business-critical, continuous oversight" },
] as const;

/** Documents needed per risk level to reach a score ≥ 90 */
export const DOCS_TO_SCORE_90: Record<string, number> = {
  low: 5,
  medium: 7,
  high: 9,
  critical: 12,
};
