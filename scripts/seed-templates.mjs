import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

const DEFAULT_TEMPLATES = [
  { id: "00000000-0000-0000-0001-000000000001", name: "Cloud Provider", description: "AWS, Azure, GCP and similar infrastructure providers.", required: ["ISO/IEC 27001", "SOC 2 Type II", "GST Registration Certificate", "Master Service Agreement (MSA)", "Data Processing Agreement (DPA)", "Cyber Liability Insurance"], optional: ["ISO 22301 (BCMS)", "VAPT Report"] },
  { id: "00000000-0000-0000-0001-000000000002", name: "SaaS Vendor", description: "Software-as-a-Service product vendors.", required: ["ISO/IEC 27001", "SOC 2 Type I", "Master Service Agreement (MSA)", "Data Processing Agreement (DPA)", "GST Registration Certificate"], optional: ["SOC 2 Type II", "VAPT Report", "Cyber Liability Insurance"] },
  { id: "00000000-0000-0000-0001-000000000003", name: "IT Services", description: "IT consulting, development and managed services.", required: ["GST Registration Certificate", "MCA Incorporation Certificate", "Master Service Agreement (MSA)", "Non-Disclosure Agreement (NDA)", "Professional Indemnity"], optional: ["ISO/IEC 27001", "MSME Registration"] },
  { id: "00000000-0000-0000-0001-000000000004", name: "Finance Vendor", description: "Payment gateways, banks, NBFCs, insurance providers.", required: ["RBI Authorization", "GST Registration Certificate", "MCA Incorporation Certificate", "Master Service Agreement (MSA)", "Data Processing Agreement (DPA)"], optional: ["ISO/IEC 27001", "SOC 2 Type II"] },
  { id: "00000000-0000-0000-0001-000000000005", name: "Staffing / Outsourcing", description: "Recruitment, staffing, outsourcing and BPO vendors.", required: ["GST Registration Certificate", "MCA Incorporation Certificate", "Master Service Agreement (MSA)", "Non-Disclosure Agreement (NDA)", "MSME Registration"], optional: ["Professional Indemnity", "General Liability"] },
  { id: "00000000-0000-0000-0001-000000000006", name: "Legal / Consulting", description: "Law firms, consultants, audit/assurance firms.", required: ["GST Registration Certificate", "Master Service Agreement (MSA)", "Non-Disclosure Agreement (NDA)", "Professional Indemnity"], optional: ["MCA Incorporation Certificate"] },
  { id: "00000000-0000-0000-0001-000000000007", name: "General Vendor", description: "Default for vendors that don't fit other categories.", required: ["GST Registration Certificate", "Master Service Agreement (MSA)"], optional: ["Non-Disclosure Agreement (NDA)", "General Liability"] },
];

for (const t of DEFAULT_TEMPLATES) {
  await sql`
    insert into vendor_types (id, organization_id, name, description, is_default)
    values (${t.id}, null, ${t.name}, ${t.description}, true)
    on conflict (id) do nothing`;

  const existing = await sql`select count(*)::int n from vendor_type_documents where vendor_type_id = ${t.id}`;
  if (existing[0].n > 0) { console.log(`  ${t.name}: already seeded`); continue; }

  let i = 0;
  for (const doc of t.required) {
    await sql`insert into vendor_type_documents (vendor_type_id, document_type, is_required, sort_order) values (${t.id}, ${doc}, true, ${i++})`;
  }
  for (const doc of t.optional) {
    await sql`insert into vendor_type_documents (vendor_type_id, document_type, is_required, sort_order) values (${t.id}, ${doc}, false, ${i++})`;
  }
  console.log(`✓ Seeded ${t.name} (${t.required.length} required + ${t.optional.length} optional)`);
}

await sql.end();
console.log("Done.");
