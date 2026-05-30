/**
 * Illustrative data for demo mode (Supabase not connected).
 */
export type DemoVendor = {
  name: string;
  category: string;
  status: "active" | "pending" | "inactive";
  risk: "low" | "medium" | "high" | "critical";
  score: number;
  docs: number;
  expiring: number;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerDepartment: string | null;
};

export const demoVendors: DemoVendor[] = [
  { name: "Razorpay Software", category: "Payments", status: "active", risk: "low", score: 94, docs: 12, expiring: 0, ownerName: "Priya Sharma", ownerEmail: "priya@demo.com", ownerDepartment: "Finance" },
  { name: "Freshworks Inc", category: "SaaS / CRM", status: "active", risk: "low", score: 91, docs: 9, expiring: 1, ownerName: "Rahul Nair", ownerEmail: "rahul@demo.com", ownerDepartment: "IT" },
  { name: "Tata Communications", category: "Infrastructure", status: "active", risk: "medium", score: 78, docs: 14, expiring: 2, ownerName: "Anita Joshi", ownerEmail: "anita@demo.com", ownerDepartment: "IT" },
  { name: "Zoho Corporation", category: "SaaS", status: "active", risk: "low", score: 88, docs: 10, expiring: 0, ownerName: null, ownerEmail: null, ownerDepartment: null },
  { name: "Yotta Data Services", category: "Cloud / Hosting", status: "pending", risk: "high", score: 52, docs: 4, expiring: 3, ownerName: "Sanjay Mehta", ownerEmail: "sanjay@demo.com", ownerDepartment: "Procurement" },
  { name: "Quess Corp", category: "Staffing", status: "active", risk: "medium", score: 71, docs: 7, expiring: 1, ownerName: null, ownerEmail: null, ownerDepartment: null },
  { name: "Sify Technologies", category: "Network", status: "inactive", risk: "high", score: 44, docs: 3, expiring: 2, ownerName: null, ownerEmail: null, ownerDepartment: null },
];

export const demoMetrics = {
  complianceScore: 92,
  auditReadiness: 95,
  totalVendors: demoVendors.length,
  totalDocuments: demoVendors.reduce((n, v) => n + v.docs, 0),
  expiringSoon: demoVendors.reduce((n, v) => n + v.expiring, 0),
  highRisk: demoVendors.filter((v) => v.risk === "high" || v.risk === "critical").length,
};

export const demoAiInsights = [
  { tone: "warn", text: "3 vendor certificates (ISO 27001) expire within 14 days." },
  { tone: "danger", text: "Yotta Data Services is missing a signed DPA — flagged high risk." },
  { tone: "info", text: "AI extracted 48 fields from 6 newly uploaded documents." },
  { tone: "live", text: "SOC 2 evidence pack is 95% complete and audit-ready." },
] as const;
