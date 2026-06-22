export const LIFECYCLE_STAGES = [
  { value: "discover",  label: "Discover",    description: "Potential vendor identified" },
  { value: "inventory", label: "Inventory",   description: "Vendor catalogued, basic info collected" },
  { value: "classify",  label: "Classify",    description: "Risk tier and category assigned" },
  { value: "assess",    label: "Assess",      description: "Security assessment in progress" },
  { value: "risk",      label: "Risk Review", description: "Risk treatment decisions being made" },
  { value: "comply",    label: "Comply",      description: "Compliance controls being established" },
  { value: "monitor",   label: "Monitor",     description: "Active ongoing governance monitoring" },
  { value: "audit",     label: "Audit",       description: "Under formal audit or review" },
  { value: "renew",     label: "Renew",       description: "Contract/relationship renewal in progress" },
  { value: "offboard",  label: "Offboard",    description: "Vendor being offboarded" },
] as const;

export type VendorLifecycleStage = typeof LIFECYCLE_STAGES[number]["value"];
