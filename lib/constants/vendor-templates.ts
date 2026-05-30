export type DefaultTemplate = {
  id: string; // deterministic UUID for seeding
  name: string;
  description: string;
  requiredDocs: string[];
  optionalDocs: string[];
};

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    id: "00000000-0000-0000-0001-000000000001",
    name: "Cloud Provider",
    description: "AWS, Azure, GCP and similar infrastructure providers.",
    requiredDocs: ["ISO/IEC 27001", "SOC 2 Type II", "GST Registration Certificate", "Master Service Agreement (MSA)", "Data Processing Agreement (DPA)", "Cyber Liability Insurance"],
    optionalDocs: ["ISO 22301 (BCMS)", "VAPT Report"],
  },
  {
    id: "00000000-0000-0000-0001-000000000002",
    name: "SaaS Vendor",
    description: "Software-as-a-Service product vendors.",
    requiredDocs: ["ISO/IEC 27001", "SOC 2 Type I", "Master Service Agreement (MSA)", "Data Processing Agreement (DPA)", "GST Registration Certificate"],
    optionalDocs: ["SOC 2 Type II", "VAPT Report", "Cyber Liability Insurance"],
  },
  {
    id: "00000000-0000-0000-0001-000000000003",
    name: "IT Services",
    description: "IT consulting, development and managed services.",
    requiredDocs: ["GST Registration Certificate", "MCA Incorporation Certificate", "Master Service Agreement (MSA)", "Non-Disclosure Agreement (NDA)", "Professional Indemnity"],
    optionalDocs: ["ISO/IEC 27001", "MSME Registration"],
  },
  {
    id: "00000000-0000-0000-0001-000000000004",
    name: "Finance Vendor",
    description: "Payment gateways, banks, NBFCs, insurance providers.",
    requiredDocs: ["RBI Authorization", "GST Registration Certificate", "MCA Incorporation Certificate", "Master Service Agreement (MSA)", "Data Processing Agreement (DPA)"],
    optionalDocs: ["ISO/IEC 27001", "SOC 2 Type II"],
  },
  {
    id: "00000000-0000-0000-0001-000000000005",
    name: "Staffing / Outsourcing",
    description: "Recruitment, staffing, outsourcing and BPO vendors.",
    requiredDocs: ["GST Registration Certificate", "MCA Incorporation Certificate", "Master Service Agreement (MSA)", "Non-Disclosure Agreement (NDA)", "MSME Registration"],
    optionalDocs: ["Professional Indemnity", "General Liability"],
  },
  {
    id: "00000000-0000-0000-0001-000000000006",
    name: "Legal / Consulting",
    description: "Law firms, consultants, audit/assurance firms.",
    requiredDocs: ["GST Registration Certificate", "Master Service Agreement (MSA)", "Non-Disclosure Agreement (NDA)", "Professional Indemnity"],
    optionalDocs: ["MCA Incorporation Certificate"],
  },
  {
    id: "00000000-0000-0000-0001-000000000007",
    name: "General Vendor",
    description: "Default template for vendors that don't fit other categories.",
    requiredDocs: ["GST Registration Certificate", "Master Service Agreement (MSA)"],
    optionalDocs: ["Non-Disclosure Agreement (NDA)", "General Liability"],
  },
];
