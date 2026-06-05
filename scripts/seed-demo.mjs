/**
 * Lekha OS — Comprehensive demo seed script.
 *
 * Seeds 15 realistic Indian B2B vendors with documents, assessments,
 * reviews, document requests, and AI summaries into the "admin corp" workspace.
 *
 * Safe to re-run — uses ON CONFLICT DO NOTHING throughout.
 *
 * Usage: node scripts/seed-demo.mjs
 */
import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

// ─── Workspace ────────────────────────────────────────────────────────────────
const [org] = await sql`
  SELECT o.id, m.user_id
  FROM organizations o
  JOIN memberships m ON m.organization_id = o.id AND m.role = 'owner'
  WHERE o.name = 'admin corp'
  LIMIT 1`;

if (!org) { console.error("No 'admin corp' workspace found."); await sql.end(); process.exit(1); }
const ORG  = org.id;
const USER = org.user_id;
console.log(`Seeding into: admin corp (${ORG})`);

// ─── Template IDs (seeded by seed-templates.mjs) ─────────────────────────────
const T = {
  cloud:     "00000000-0000-0000-0001-000000000001",
  saas:      "00000000-0000-0000-0001-000000000002",
  it:        "00000000-0000-0000-0001-000000000003",
  finance:   "00000000-0000-0000-0001-000000000004",
  staffing:  "00000000-0000-0000-0001-000000000005",
  legal:     "00000000-0000-0000-0001-000000000006",
  general:   "00000000-0000-0000-0001-000000000007",
};

// ─── Date helpers ─────────────────────────────────────────────────────────────
const today   = new Date("2026-06-01");
function d(months) {
  const x = new Date(today); x.setMonth(x.getMonth() + months); return x.toISOString().slice(0,10);
}
const EXPIRED  = d(-2);   // 2 months ago = expired
const EXP_7    = d(0);    // ~today = expiring
const EXP_15   = "2026-06-15"; // 14 days
const EXP_28   = "2026-06-28"; // 27 days
const VALID_6  = d(6);
const VALID_12 = d(12);
const VALID_24 = d(24);
const VALID_36 = d(36);
const EXP_20   = "2026-06-21"; // 20 days

// ─── Helper: upsert vendor ────────────────────────────────────────────────────
async function upsertVendor(v) {
  const [existing] = await sql`
    SELECT id FROM vendors WHERE organization_id=${ORG} AND name=${v.name} LIMIT 1`;
  if (existing) return existing.id;
  const [row] = await sql`
    INSERT INTO vendors
      (organization_id, name, category, contact_email, status, risk_level,
       compliance_score, notes, owner_name, owner_email, owner_department,
       vendor_type_id, ai_summary, created_by)
    VALUES
      (${ORG}, ${v.name}, ${v.category}, ${v.email ?? null}, ${v.status ?? "active"},
       ${v.risk}, ${v.score}, ${v.notes ?? null},
       ${v.ownerName ?? null}, ${v.ownerEmail ?? null}, ${v.ownerDept ?? null},
       ${v.template ?? null}, ${v.aiSummary ?? null}, ${USER})
    RETURNING id`;
  return row.id;
}

// ─── Helper: upsert document ─────────────────────────────────────────────────
async function upsertDoc(vendorId, doc) {
  const [existing] = await sql`
    SELECT id FROM vendor_documents
    WHERE vendor_id=${vendorId} AND document_type=${doc.type} LIMIT 1`;
  if (existing) return;
  const filename = doc.filename ?? `${doc.type.toLowerCase().replace(/\s+/g, "_")}.pdf`;
  await sql`
    INSERT INTO vendor_documents
      (organization_id, vendor_id, document_type, status, category,
       issued_on, expires_on, extracted,
       filename, content_type, file_size, storage_bucket, storage_provider, uploaded_by)
    VALUES
      (${ORG}, ${vendorId}, ${doc.type}, ${doc.status},
       ${doc.category ?? null}, ${doc.issued ?? null}, ${doc.expires ?? null},
       ${sql.json(doc.extracted ?? {})},
       ${filename}, 'application/pdf',
       ${doc.fileSize ?? Math.floor(200_000 + Math.random() * 800_000)},
       'compliance-documents', 'supabase', ${USER})
    ON CONFLICT DO NOTHING`;
}

// ─── Helper: upsert assessment with responses ─────────────────────────────────
async function upsertAssessment(vendorId, title, score, responses) {
  const [ex] = await sql`SELECT id FROM assessments WHERE vendor_id=${vendorId} AND title=${title} LIMIT 1`;
  if (ex) return;
  const [a] = await sql`
    INSERT INTO assessments
      (organization_id, vendor_id, title, score, status, conducted_by, completed_at)
    VALUES (${ORG}, ${vendorId}, ${title}, ${score}, 'completed', ${USER}, NOW())
    RETURNING id`;
  for (const [key, ans] of Object.entries(responses)) {
    await sql`
      INSERT INTO assessment_responses (assessment_id, question_key, answer)
      VALUES (${a.id}, ${key}, ${ans})
      ON CONFLICT (assessment_id, question_key) DO NOTHING`;
  }
}

// ─── Helper: upsert review ────────────────────────────────────────────────────
async function upsertReview(vendorId, type, status, summary, nextReview) {
  const [ex] = await sql`
    SELECT id FROM vendor_reviews WHERE vendor_id=${vendorId} AND review_type=${type} LIMIT 1`;
  if (ex) return;
  await sql`
    INSERT INTO vendor_reviews
      (organization_id, vendor_id, review_type, review_status, summary,
       reviewed_by, next_review_at)
    VALUES (${ORG}, ${vendorId}, ${type}, ${status}, ${summary}, ${USER}, ${nextReview})`;
}

// ─── Helper: upsert document request ─────────────────────────────────────────
async function upsertRequest(vendorId, docType, message, priority, status) {
  const [ex] = await sql`
    SELECT id FROM document_requests
    WHERE vendor_id=${vendorId} AND document_type=${docType} LIMIT 1`;
  if (ex) return;
  await sql`
    INSERT INTO document_requests
      (organization_id, vendor_id, document_type, message, priority, status,
       due_date, requested_by)
    VALUES (${ORG}, ${vendorId}, ${docType}, ${message}, ${priority},
            ${status}, ${d(1)}, ${USER})`;
}

// ─── Vendor definitions ───────────────────────────────────────────────────────
console.log("\n📦 Seeding vendors...");

// 1. Razorpay — exemplary compliance
const razorpay = await upsertVendor({
  name: "Razorpay Software Pvt Ltd",
  category: "Payments",
  email: "security@razorpay.com",
  risk: "low", score: 92, template: T.finance,
  ownerName: "Priya Sharma", ownerEmail: "priya.sharma@acme.in", ownerDept: "Finance",
  notes: "Primary payment gateway. Handles all subscription and one-time payment processing.",
  aiSummary: "Razorpay Software demonstrates excellent compliance posture with a score of 92/100, driven by 8 valid certifications including ISO 27001:2022 and SOC 2 Type II. The vendor is critical to payment infrastructure and maintains proactive governance. One concern: cyber insurance expires in 20 days and should be renewed immediately to maintain the current score.",
});

// 2. Freshworks
const freshworks = await upsertVendor({
  name: "Freshworks Inc",
  category: "SaaS / CRM",
  email: "compliance@freshworks.com",
  risk: "low", score: 85, template: T.saas,
  ownerName: "Rahul Nair", ownerEmail: "rahul.nair@acme.in", ownerDept: "IT",
  notes: "CRM and customer support platform. Access to customer data makes DPA critical.",
  aiSummary: "Freshworks maintains a strong compliance posture with 5 valid documents and a score of 85/100. The vendor has ISO 27001 certification and a signed SOC 2 report, demonstrating commitment to security. The Data Processing Agreement is expiring within 30 days and requires immediate renewal to avoid a score penalty and compliance gap.",
});

// 3. TCS
const tcs = await upsertVendor({
  name: "Tata Consultancy Services Ltd",
  category: "IT Services",
  email: "vendor.compliance@tcs.com",
  risk: "medium", score: 72, template: T.it,
  ownerName: "Anita Joshi", ownerEmail: "anita.joshi@acme.in", ownerDept: "IT",
  notes: "Managed services partner. Handles infrastructure operations and L1/L2 support.",
  aiSummary: "TCS demonstrates adequate compliance for an IT services partner, scoring 72/100. Quality and operational certifications are in order, however the Professional Indemnity insurance is expiring in 10 days. A security assessment is pending and should be prioritised given the level of infrastructure access granted to this vendor.",
});

// 4. Zoho
const zoho = await upsertVendor({
  name: "Zoho Corporation Pvt Ltd",
  category: "SaaS",
  email: "security@zoho.com",
  risk: "low", score: 87, template: T.saas,
  ownerName: "Priya Sharma", ownerEmail: "priya.sharma@acme.in", ownerDept: "Finance",
  notes: "Finance and accounting software. Processes invoices and payroll data.",
  aiSummary: "Zoho Corporation maintains strong compliance with a score of 87/100. All five required documents are valid with no near-term expiries. The vendor holds ISO 27001 certification and SOC 2 Type II attestation, providing confidence in their security controls. No immediate actions required beyond scheduling the next annual review.",
});

// 5. Yotta — high risk, missing docs
const yotta = await upsertVendor({
  name: "Yotta Data Services Pvt Ltd",
  category: "Cloud / Hosting",
  email: "procurement@yottadata.com",
  risk: "high", score: 35, template: T.cloud,
  ownerName: "Sanjay Mehta", ownerEmail: "sanjay.mehta@acme.in", ownerDept: "Infrastructure",
  notes: "Co-location and cloud hosting for production workloads. Critical infrastructure vendor.",
  aiSummary: "Yotta Data Services has a critical compliance gap with a score of only 35/100. Despite hosting production workloads, only 2 of 8 required documents are on file — ISO 27001, SOC 2, DPA, and Cyber Insurance are all missing. This vendor's risk level is high, and the compliance programme should prioritise requesting these documents immediately before the next compliance audit.",
});

// 6. Quess Corp
const quess = await upsertVendor({
  name: "Quess Corp Ltd",
  category: "Staffing / HR",
  email: "legal@quesscorp.com",
  risk: "medium", score: 70, template: T.staffing,
  ownerName: "Meena Rajan", ownerEmail: "meena.rajan@acme.in", ownerDept: "HR",
  notes: "Contract staffing partner. Background verification and payroll processing.",
  aiSummary: "Quess Corp has adequate compliance documentation with a score of 70/100. The foundational legal documents (GST, MCA, MSA, MSME) are valid. The vendor has not yet undergone a security assessment, which is recommended given their access to employee data. No immediate expiry concerns.",
});

// 7. Sify — expired ISO
const sify = await upsertVendor({
  name: "Sify Technologies Ltd",
  category: "Network / Telecom",
  email: "noc@sify.com",
  risk: "high", score: 40, template: T.cloud,
  ownerName: "Anita Joshi", ownerEmail: "anita.joshi@acme.in", ownerDept: "IT",
  notes: "Internet connectivity and MPLS WAN provider.",
  aiSummary: "Sify Technologies has a significantly degraded compliance posture with a score of 40/100, primarily because the ISO 27001 certificate has expired. As a network infrastructure provider, lapsed security certification creates direct compliance risk. The vendor should be asked to provide a renewed ISO 27001 certificate within 30 days or the engagement should be reviewed.",
});

// 8. HDFC Bank — excellent
const hdfc = await upsertVendor({
  name: "HDFC Bank Ltd",
  category: "Banking / NBFC",
  email: "vendor.mgmt@hdfcbank.com",
  risk: "low", score: 97, template: T.finance,
  ownerName: "Priya Sharma", ownerEmail: "priya.sharma@acme.in", ownerDept: "Finance",
  notes: "Corporate banking partner for salary accounts and treasury management.",
  aiSummary: "HDFC Bank demonstrates exemplary compliance with a near-perfect score of 97/100. All 7 required documents including RBI authorization, ISO 27001, SOC 2, and DPA are valid. As a regulated financial institution under RBI supervision, HDFC Bank maintains the highest governance standards. No actions required.",
});

// 9. Wipro
const wipro = await upsertVendor({
  name: "Wipro Limited",
  category: "IT Services",
  email: "compliance@wipro.com",
  risk: "medium", score: 78, template: T.it,
  ownerName: "Anita Joshi", ownerEmail: "anita.joshi@acme.in", ownerDept: "IT",
  notes: "Application development and maintenance. Access to source code repositories.",
  aiSummary: "Wipro demonstrates good compliance with a score of 78/100. Both ISO quality certifications are valid and professional indemnity is not expiring for another 45 days. The vendor has not had a security assessment completed, which is recommended given their code repository access. An annual review is due this quarter.",
});

// 10. Keka HR
const keka = await upsertVendor({
  name: "Keka Technologies Pvt Ltd",
  category: "SaaS / HR",
  email: "security@keka.com",
  risk: "low", score: 82, template: T.saas,
  ownerName: "Meena Rajan", ownerEmail: "meena.rajan@acme.in", ownerDept: "HR",
  notes: "HRMS platform for leave, payroll, and performance management.",
  aiSummary: "Keka Technologies has a strong compliance posture scoring 82/100. The ISO 27001 certificate, MSA, DPA, and NDA are all valid. As an HR platform processing sensitive employee data, the signed DPA is especially important. No immediate concerns; next renewal cycle is 6-12 months out.",
});

// 11. Darwinbox — DPA expiring
const darwinbox = await upsertVendor({
  name: "Darwinbox Digital Solutions",
  category: "SaaS / HR",
  email: "legal@darwinbox.com",
  risk: "medium", score: 65, template: T.saas,
  ownerName: "Meena Rajan", ownerEmail: "meena.rajan@acme.in", ownerDept: "HR",
  notes: "Talent acquisition and learning management platform.",
  aiSummary: "Darwinbox has a moderate compliance score of 65/100. The Data Processing Agreement expires in 15 days — this is critical as Darwinbox processes recruitment and performance data. The missing SOC 2 report is a notable gap for an HR SaaS. Immediate action required on DPA renewal and SOC 2 documentation.",
});

// 12. Infosys BPM
const infosys = await upsertVendor({
  name: "Infosys BPM Ltd",
  category: "IT Services",
  email: "vendor.contract@infosysbpm.com",
  risk: "medium", score: 76, template: T.it,
  ownerName: "Anita Joshi", ownerEmail: "anita.joshi@acme.in", ownerDept: "IT",
  notes: "Finance and accounts BPO. Processes AP/AR and financial reporting.",
  aiSummary: "Infosys BPM demonstrates adequate compliance with a score of 76/100 for a BPO handling financial processes. Core documents are in place though the ISO 22301 (Business Continuity) certification is not yet on file, which is a gap for a finance process vendor. An annual review was completed last quarter with no findings.",
});

// 13. GreytHR
const greythr = await upsertVendor({
  name: "Greytip Software Pvt Ltd",
  category: "SaaS / HR",
  email: "support@greythr.com",
  risk: "low", score: 78, template: T.saas,
  ownerName: "Meena Rajan", ownerEmail: "meena.rajan@acme.in", ownerDept: "HR",
  notes: "Payroll processing and statutory compliance platform.",
});

// 14. Apollo HealthCo — critical
const apollo = await upsertVendor({
  name: "Apollo HealthCo Ltd",
  category: "Healthcare",
  email: "corporate@apollohealthco.com",
  risk: "critical", score: 28, template: T.general,
  ownerName: "Rahul Nair", ownerEmail: "rahul.nair@acme.in", ownerDept: "IT",
  notes: "Employee health insurance and telehealth benefits provider.",
  aiSummary: "Apollo HealthCo has a critically low compliance score of 28/100. Only a GST certificate is on file out of the required documents. Given that this vendor processes sensitive employee health data under DPDP obligations, the absence of a DPA, insurance details, and any security certification represents significant regulatory and reputational risk. This vendor requires urgent remediation before the next compliance cycle.",
});

// 15. Birlasoft
const birlasoft = await upsertVendor({
  name: "Birlasoft Ltd",
  category: "IT Services",
  email: "vendor@birlasoft.com",
  risk: "medium", score: 74, template: T.it,
  ownerName: "Anita Joshi", ownerEmail: "anita.joshi@acme.in", ownerDept: "IT",
  notes: "ERP implementation and support. SAP integration partner.",
});

console.log("✓ Vendors seeded");

// ─── Documents ────────────────────────────────────────────────────────────────
console.log("\n📄 Seeding documents...");

const docs = [
  // Razorpay (8 docs — exemplary)
  [razorpay,   { type:"ISO/IEC 27001:2022",             status:"valid",    category:"security",    issued:"2024-01-15", expires:VALID_36, extracted:{issuer:"BSI Assurance UK Ltd",certificationNumber:"IS 99881234",standardVersion:"ISO 27001:2022",certificationScope:"Payment processing infrastructure",certificationBody:"UKAS",applicableRegions:["India","Global"],summary:"ISO 27001:2022 certification for information security management systems.",source:"gemini-v2"}}],
  [razorpay,   { type:"SOC 2 Type II",                  status:"valid",    category:"security",    issued:"2024-03-01", expires:VALID_12, extracted:{issuer:"Deloitte & Touche LLP",certificationNumber:"SOC2-2024-RPY",standardVersion:"SOC 2 TSC 2017",certificationScope:"Payment gateway and API services",summary:"SOC 2 Type II attestation covering Security, Availability and Confidentiality.",source:"gemini-v2"}}],
  [razorpay,   { type:"Data Processing Agreement (DPA)", status:"valid",   category:"legal",       issued:"2023-06-01", expires:VALID_24, extracted:{issuer:"Razorpay Software Pvt Ltd",summary:"Data Processing Agreement covering GDPR and DPDP obligations for payment data.",source:"gemini-v2"}}],
  [razorpay,   { type:"Master Service Agreement (MSA)",  status:"valid",   category:"legal",       issued:"2023-01-01", expires:VALID_24, extracted:{issuer:"Razorpay Software Pvt Ltd",summary:"Master Service Agreement governing the commercial relationship and SLAs.",source:"gemini-v2"}}],
  [razorpay,   { type:"GST Registration Certificate",    status:"valid",   category:"financial",   issued:"2019-07-15", expires:null,     extracted:{issuer:"Government of India",certificationNumber:"27AABCR0472M1ZX",summary:"GST registration under the CGST Act 2017 for Maharashtra.",source:"gemini-v2"}}],
  [razorpay,   { type:"PAN",                             status:"valid",   category:"financial",   issued:"2010-03-01", expires:null,     extracted:{issuer:"Income Tax Department of India",certificationNumber:"AABCR0472M",summary:"Permanent Account Number for Razorpay Software Pvt Ltd.",source:"gemini-v2"}}],
  [razorpay,   { type:"Cyber Liability Insurance",       status:"expiring", category:"financial",  issued:"2025-06-20", expires:EXP_20,   extracted:{issuer:"ICICI Lombard General Insurance",summary:"Cyber liability insurance covering data breach, ransomware and third-party claims up to ₹50 Crore.",source:"gemini-v2"}}],
  [razorpay,   { type:"VAPT Report",                     status:"valid",   category:"security",    issued:"2025-12-01", expires:VALID_6,  extracted:{issuer:"Securelayer7 Pvt Ltd",summary:"Annual Vulnerability Assessment and Penetration Testing report. No critical findings.",source:"gemini-v2"}}],

  // Freshworks (5 docs, DPA expiring)
  [freshworks, { type:"ISO/IEC 27001:2022",              status:"valid",   category:"security",    issued:"2024-06-01", expires:VALID_36, extracted:{issuer:"Bureau Veritas",certificationNumber:"BV-ISO27001-FW-2024",standardVersion:"ISO 27001:2022",summary:"ISO 27001:2022 for cloud CRM services.",source:"gemini-v2"}}],
  [freshworks, { type:"SOC 2 Type I",                    status:"valid",   category:"security",    issued:"2024-01-01", expires:VALID_12, extracted:{issuer:"Ernst & Young LLP",summary:"SOC 2 Type I report for Freshdesk and Freshsales platforms.",source:"gemini-v2"}}],
  [freshworks, { type:"Master Service Agreement (MSA)",  status:"valid",   category:"legal",       issued:"2022-04-01", expires:VALID_24, extracted:{issuer:"Freshworks Inc",summary:"MSA governing SaaS subscription terms.",source:"gemini-v2"}}],
  [freshworks, { type:"Data Processing Agreement (DPA)", status:"expiring",category:"legal",       issued:"2023-06-28", expires:EXP_28,   extracted:{issuer:"Freshworks Inc",summary:"GDPR and DPDP-compliant DPA for EU and Indian customer data processing.",source:"gemini-v2"}}],
  [freshworks, { type:"GST Registration Certificate",    status:"valid",   category:"financial",   issued:"2020-01-15", expires:null,     extracted:{issuer:"Government of India",summary:"GST registration for Tamil Nadu operations.",source:"gemini-v2"}}],

  // TCS (5 docs, Professional Indemnity expiring soon)
  [tcs,        { type:"ISO 9001:2015",                   status:"valid",   category:"quality",     issued:"2023-10-01", expires:VALID_24, extracted:{issuer:"TÜV Rheinland",certificationNumber:"TR-9001-TCS-2023",standardVersion:"ISO 9001:2015",summary:"Quality management system certification for IT services delivery.",source:"gemini-v2"}}],
  [tcs,        { type:"MCA Incorporation Certificate",   status:"valid",   category:"operational", issued:"1968-04-01", expires:null,     extracted:{issuer:"Ministry of Corporate Affairs",certificationNumber:"U72900MH1968PLC014130",summary:"Certificate of incorporation under the Companies Act.",source:"gemini-v2"}}],
  [tcs,        { type:"GST Registration Certificate",    status:"valid",   category:"financial",   issued:"2018-07-01", expires:null,     extracted:{issuer:"Government of India",summary:"GST registration for TCS headquarters.",source:"gemini-v2"}}],
  [tcs,        { type:"Master Service Agreement (MSA)",  status:"valid",   category:"legal",       issued:"2021-01-01", expires:VALID_12, extracted:{issuer:"TCS Ltd",summary:"Managed services agreement for infrastructure operations.",source:"gemini-v2"}}],
  [tcs,        { type:"Professional Indemnity",          status:"expiring",category:"financial",   issued:"2025-06-08", expires:EXP_15,   extracted:{issuer:"New India Assurance Co Ltd",summary:"Professional indemnity policy covering errors and omissions up to ₹25 Crore.",source:"gemini-v2"}}],

  // Zoho (5 docs, all valid)
  [zoho,       { type:"ISO/IEC 27001:2022",              status:"valid",   category:"security",    issued:"2024-02-01", expires:VALID_36, extracted:{issuer:"BSI Group",certificationNumber:"BSI-27001-ZOHO-24",standardVersion:"ISO 27001:2022",summary:"Information security management for Zoho cloud suite.",source:"gemini-v2"}}],
  [zoho,       { type:"SOC 2 Type II",                   status:"valid",   category:"security",    issued:"2024-01-15", expires:VALID_12, extracted:{issuer:"KPMG LLP",summary:"SOC 2 Type II covering Zoho Books, Zoho CRM and Zoho People.",source:"gemini-v2"}}],
  [zoho,       { type:"Data Processing Agreement (DPA)", status:"valid",   category:"legal",       issued:"2023-09-01", expires:VALID_24, extracted:{issuer:"Zoho Corporation",summary:"DPA under DPDP Act 2023 covering all Zoho SaaS products.",source:"gemini-v2"}}],
  [zoho,       { type:"Master Service Agreement (MSA)",  status:"valid",   category:"legal",       issued:"2022-01-01", expires:VALID_24, extracted:{issuer:"Zoho Corporation",summary:"Master subscription agreement.",source:"gemini-v2"}}],
  [zoho,       { type:"GST Registration Certificate",    status:"valid",   category:"financial",   issued:"2018-07-15", expires:null,     extracted:{issuer:"Government of India",summary:"GST registration for Zoho India operations.",source:"gemini-v2"}}],

  // Yotta (only 2 docs — bad)
  [yotta,      { type:"GST Registration Certificate",    status:"valid",   category:"financial",   issued:"2019-01-01", expires:null,     extracted:{issuer:"Government of India",summary:"GST registration.",source:"gemini-v2"}}],
  [yotta,      { type:"MCA Incorporation Certificate",   status:"valid",   category:"operational", issued:"2019-06-01", expires:null,     extracted:{issuer:"Ministry of Corporate Affairs",summary:"Certificate of incorporation.",source:"gemini-v2"}}],

  // Quess (4 docs)
  [quess,      { type:"GST Registration Certificate",    status:"valid",   category:"financial",   issued:"2017-09-01", expires:null,     extracted:{issuer:"Government of India",summary:"GST registration.",source:"gemini-v2"}}],
  [quess,      { type:"MCA Incorporation Certificate",   status:"valid",   category:"operational", issued:"2007-07-01", expires:null,     extracted:{issuer:"Ministry of Corporate Affairs",summary:"Certificate of incorporation.",source:"gemini-v2"}}],
  [quess,      { type:"Master Service Agreement (MSA)",  status:"valid",   category:"legal",       issued:"2022-03-01", expires:VALID_24, extracted:{issuer:"Quess Corp Ltd",summary:"Staffing and managed services agreement.",source:"gemini-v2"}}],
  [quess,      { type:"MSME Registration",               status:"valid",   category:"operational", issued:"2020-01-01", expires:null,     extracted:{issuer:"Ministry of MSME",certificationNumber:"UDYAM-KA-06-0012345",summary:"MSME registration certificate.",source:"gemini-v2"}}],

  // Sify (3 docs, ISO expired)
  [sify,       { type:"GST Registration Certificate",    status:"valid",   category:"financial",   issued:"2017-07-01", expires:null,     extracted:{issuer:"Government of India",summary:"GST registration.",source:"gemini-v2"}}],
  [sify,       { type:"ISO/IEC 27001:2013",              status:"expired", category:"security",    issued:"2020-06-01", expires:EXPIRED,  extracted:{issuer:"DNV Business Assurance",certificationNumber:"DNV-27001-SFY-2020",standardVersion:"ISO 27001:2013",summary:"Expired ISO 27001:2013 certification. Renewal overdue.",source:"gemini-v2"}}],
  [sify,       { type:"Cyber Liability Insurance",       status:"valid",   category:"financial",   issued:"2025-09-01", expires:VALID_12, extracted:{issuer:"HDFC ERGO",summary:"Cyber liability insurance for network services.",source:"gemini-v2"}}],

  // HDFC (7 docs — excellent)
  [hdfc,       { type:"RBI Authorization",               status:"valid",   category:"financial",   issued:"2000-01-01", expires:null,     extracted:{issuer:"Reserve Bank of India",certificationNumber:"DBOD.No.PSOD.BC.10001/07.01.000/2000-01",summary:"RBI banking licence authorising all scheduled commercial banking activities.",source:"gemini-v2"}}],
  [hdfc,       { type:"ISO/IEC 27001:2022",              status:"valid",   category:"security",    issued:"2024-03-01", expires:VALID_36, extracted:{issuer:"BSI Group",certificationNumber:"BSI-27001-HDFC-24",standardVersion:"ISO 27001:2022",summary:"ISO 27001:2022 for corporate banking operations.",source:"gemini-v2"}}],
  [hdfc,       { type:"SOC 2 Type II",                   status:"valid",   category:"security",    issued:"2024-01-01", expires:VALID_12, extracted:{issuer:"Deloitte",summary:"SOC 2 Type II for corporate treasury and salary account services.",source:"gemini-v2"}}],
  [hdfc,       { type:"Data Processing Agreement (DPA)", status:"valid",   category:"legal",       issued:"2023-10-01", expires:VALID_24, extracted:{issuer:"HDFC Bank Ltd",summary:"DPA covering employee salary account and payroll data.",source:"gemini-v2"}}],
  [hdfc,       { type:"Master Service Agreement (MSA)",  status:"valid",   category:"legal",       issued:"2020-04-01", expires:VALID_36, extracted:{issuer:"HDFC Bank Ltd",summary:"Corporate banking services agreement.",source:"gemini-v2"}}],
  [hdfc,       { type:"GST Registration Certificate",    status:"valid",   category:"financial",   issued:"2017-07-01", expires:null,     extracted:{issuer:"Government of India",summary:"GST registration.",source:"gemini-v2"}}],
  [hdfc,       { type:"Professional Indemnity",          status:"valid",   category:"financial",   issued:"2025-04-01", expires:VALID_12, extracted:{issuer:"New India Assurance",summary:"Professional indemnity for banking services.",source:"gemini-v2"}}],

  // Wipro (5 docs)
  [wipro,      { type:"ISO 9001:2015",                   status:"valid",   category:"quality",     issued:"2023-07-01", expires:VALID_24, extracted:{issuer:"Bureau Veritas",standardVersion:"ISO 9001:2015",summary:"Quality management certification for software services.",source:"gemini-v2"}}],
  [wipro,      { type:"ISO/IEC 27001:2022",              status:"valid",   category:"security",    issued:"2024-05-01", expires:VALID_36, extracted:{issuer:"DNV",standardVersion:"ISO 27001:2022",summary:"Information security management for application services.",source:"gemini-v2"}}],
  [wipro,      { type:"MCA Incorporation Certificate",   status:"valid",   category:"operational", issued:"1945-12-29", expires:null,     extracted:{issuer:"Ministry of Corporate Affairs",summary:"Certificate of incorporation.",source:"gemini-v2"}}],
  [wipro,      { type:"GST Registration Certificate",    status:"valid",   category:"financial",   issued:"2017-07-01", expires:null,     extracted:{issuer:"Government of India",summary:"GST registration.",source:"gemini-v2"}}],
  [wipro,      { type:"Professional Indemnity",          status:"valid",   category:"financial",   issued:"2025-08-01", expires:VALID_6,  extracted:{issuer:"ICICI Lombard",summary:"Professional indemnity insurance for IT services.",source:"gemini-v2"}}],

  // Keka (5 docs)
  [keka,       { type:"ISO/IEC 27001:2022",              status:"valid",   category:"security",    issued:"2024-04-01", expires:VALID_36, extracted:{issuer:"TÜV SÜD",standardVersion:"ISO 27001:2022",summary:"ISO 27001 for HR data management platform.",source:"gemini-v2"}}],
  [keka,       { type:"Master Service Agreement (MSA)",  status:"valid",   category:"legal",       issued:"2022-06-01", expires:VALID_24, extracted:{issuer:"Keka Technologies",summary:"SaaS subscription agreement.",source:"gemini-v2"}}],
  [keka,       { type:"Data Processing Agreement (DPA)", status:"valid",   category:"legal",       issued:"2023-08-01", expires:VALID_24, extracted:{issuer:"Keka Technologies",summary:"DPA for employee payroll and HR data under DPDP.",source:"gemini-v2"}}],
  [keka,       { type:"Non-Disclosure Agreement (NDA)",  status:"valid",   category:"legal",       issued:"2022-06-01", expires:VALID_36, extracted:{issuer:"Keka Technologies",summary:"Mutual NDA for business and technical information.",source:"gemini-v2"}}],
  [keka,       { type:"GST Registration Certificate",    status:"valid",   category:"financial",   issued:"2019-11-01", expires:null,     extracted:{issuer:"Government of India",summary:"GST registration.",source:"gemini-v2"}}],

  // Darwinbox (4 docs, DPA expiring)
  [darwinbox,  { type:"ISO/IEC 27001:2022",              status:"valid",   category:"security",    issued:"2024-01-01", expires:VALID_36, extracted:{issuer:"Bureau Veritas",standardVersion:"ISO 27001:2022",summary:"ISO 27001 for talent management platform.",source:"gemini-v2"}}],
  [darwinbox,  { type:"Master Service Agreement (MSA)",  status:"valid",   category:"legal",       issued:"2023-01-01", expires:VALID_24, extracted:{issuer:"Darwinbox Digital",summary:"SaaS subscription agreement.",source:"gemini-v2"}}],
  [darwinbox,  { type:"GST Registration Certificate",    status:"valid",   category:"financial",   issued:"2019-01-01", expires:null,     extracted:{issuer:"Government of India",summary:"GST registration.",source:"gemini-v2"}}],
  [darwinbox,  { type:"Data Processing Agreement (DPA)", status:"expiring",category:"legal",       issued:"2023-06-15", expires:EXP_15,   extracted:{issuer:"Darwinbox Digital",summary:"DPA for recruitment and performance data.",source:"gemini-v2"}}],

  // Infosys BPM (4 docs)
  [infosys,    { type:"ISO 9001:2015",                   status:"valid",   category:"quality",     issued:"2023-03-01", expires:VALID_24, extracted:{issuer:"TÜV Rheinland",standardVersion:"ISO 9001:2015",summary:"Quality management for BPO operations.",source:"gemini-v2"}}],
  [infosys,    { type:"ISO/IEC 27001:2022",              status:"valid",   category:"security",    issued:"2024-02-01", expires:VALID_36, extracted:{issuer:"BSI Group",standardVersion:"ISO 27001:2022",summary:"Information security for finance BPO.",source:"gemini-v2"}}],
  [infosys,    { type:"GST Registration Certificate",    status:"valid",   category:"financial",   issued:"2017-07-01", expires:null,     extracted:{issuer:"Government of India",summary:"GST registration.",source:"gemini-v2"}}],
  [infosys,    { type:"Master Service Agreement (MSA)",  status:"valid",   category:"legal",       issued:"2021-04-01", expires:VALID_12, extracted:{issuer:"Infosys BPM Ltd",summary:"BPO services agreement covering F&A operations.",source:"gemini-v2"}}],

  // GreytHR (4 docs)
  [greythr,    { type:"ISO/IEC 27001:2022",              status:"valid",   category:"security",    issued:"2023-12-01", expires:VALID_24, extracted:{issuer:"TÜV India",standardVersion:"ISO 27001:2022",summary:"ISO 27001 for payroll processing platform.",source:"gemini-v2"}}],
  [greythr,    { type:"Master Service Agreement (MSA)",  status:"valid",   category:"legal",       issued:"2022-08-01", expires:VALID_24, extracted:{issuer:"Greytip Software",summary:"SaaS agreement for payroll and compliance.",source:"gemini-v2"}}],
  [greythr,    { type:"Data Processing Agreement (DPA)", status:"valid",   category:"legal",       issued:"2023-08-01", expires:VALID_24, extracted:{issuer:"Greytip Software",summary:"DPA for payroll data under Indian law.",source:"gemini-v2"}}],
  [greythr,    { type:"GST Registration Certificate",    status:"valid",   category:"financial",   issued:"2017-10-01", expires:null,     extracted:{issuer:"Government of India",summary:"GST registration.",source:"gemini-v2"}}],

  // Apollo (only 1 doc — critical)
  [apollo,     { type:"GST Registration Certificate",    status:"valid",   category:"financial",   issued:"2018-05-01", expires:null,     extracted:{issuer:"Government of India",summary:"GST registration.",source:"gemini-v2"}}],

  // Birlasoft (4 docs)
  [birlasoft,  { type:"ISO/IEC 27001:2022",              status:"valid",   category:"security",    issued:"2024-01-01", expires:VALID_36, extracted:{issuer:"Bureau Veritas",standardVersion:"ISO 27001:2022",summary:"ISO 27001 for ERP services.",source:"gemini-v2"}}],
  [birlasoft,  { type:"ISO 9001:2015",                   status:"valid",   category:"quality",     issued:"2023-06-01", expires:VALID_24, extracted:{issuer:"DNV",standardVersion:"ISO 9001:2015",summary:"Quality management for IT services.",source:"gemini-v2"}}],
  [birlasoft,  { type:"GST Registration Certificate",    status:"valid",   category:"financial",   issued:"2017-07-01", expires:null,     extracted:{issuer:"Government of India",summary:"GST registration.",source:"gemini-v2"}}],
  [birlasoft,  { type:"Master Service Agreement (MSA)",  status:"valid",   category:"legal",       issued:"2023-01-01", expires:VALID_24, extracted:{issuer:"Birlasoft Ltd",summary:"SAP implementation and support services agreement.",source:"gemini-v2"}}],
];


for (const [vendorId, doc] of docs) {
  await upsertDoc(vendorId, doc);
}
console.log(`✓ ${docs.length} documents seeded`);

// ─── Security Assessments ─────────────────────────────────────────────────────
console.log("\n🔐 Seeding assessments...");

// Razorpay — near-perfect (score 96)
await upsertAssessment(razorpay, "Annual Security Assessment — Q1 2026", 96, {
  sec_mfa: "yes", sec_rbac: "yes", sec_offboard: "yes",
  enc_transit: "yes", enc_rest: "yes", enc_keys: "yes",
  ir_plan: "yes", ir_tested: "yes", ir_notify: "yes",
  bc_backup: "yes", bc_test: "yes", bc_bcp: "yes",
  vm_scan: "yes", vm_patch: "yes",
  dp_inventory: "yes", dp_dpa: "yes", dp_retention: "yes",
});

// HDFC — excellent (score 98)
await upsertAssessment(hdfc, "Security Assessment — June 2026", 98, {
  sec_mfa: "yes", sec_rbac: "yes", sec_offboard: "yes",
  enc_transit: "yes", enc_rest: "yes", enc_keys: "yes",
  ir_plan: "yes", ir_tested: "yes", ir_notify: "yes",
  bc_backup: "yes", bc_test: "yes", bc_bcp: "yes",
  vm_scan: "yes", vm_patch: "yes",
  dp_inventory: "yes", dp_dpa: "yes", dp_retention: "yes",
});

// TCS — moderate (score 68)
await upsertAssessment(tcs, "Security Assessment — March 2026", 68, {
  sec_mfa: "yes", sec_rbac: "yes", sec_offboard: "partial",
  enc_transit: "yes", enc_rest: "yes", enc_keys: "partial",
  ir_plan: "yes", ir_tested: "no", ir_notify: "partial",
  bc_backup: "yes", bc_test: "partial", bc_bcp: "yes",
  vm_scan: "yes", vm_patch: "yes",
  dp_inventory: "partial", dp_dpa: "yes", dp_retention: "partial",
});

// Freshworks — good (score 84)
await upsertAssessment(freshworks, "Annual Security Review 2026", 84, {
  sec_mfa: "yes", sec_rbac: "yes", sec_offboard: "yes",
  enc_transit: "yes", enc_rest: "yes", enc_keys: "yes",
  ir_plan: "yes", ir_tested: "partial", ir_notify: "yes",
  bc_backup: "yes", bc_test: "yes", bc_bcp: "partial",
  vm_scan: "yes", vm_patch: "yes",
  dp_inventory: "yes", dp_dpa: "yes", dp_retention: "yes",
});

// Zoho — good (score 88)
await upsertAssessment(zoho, "Annual Security Assessment 2026", 88, {
  sec_mfa: "yes", sec_rbac: "yes", sec_offboard: "yes",
  enc_transit: "yes", enc_rest: "yes", enc_keys: "partial",
  ir_plan: "yes", ir_tested: "yes", ir_notify: "yes",
  bc_backup: "yes", bc_test: "yes", bc_bcp: "yes",
  vm_scan: "yes", vm_patch: "yes",
  dp_inventory: "yes", dp_dpa: "yes", dp_retention: "partial",
});

console.log("✓ Assessments seeded");

// ─── Reviews ──────────────────────────────────────────────────────────────────
console.log("\n📋 Seeding reviews...");

await upsertReview(razorpay,   "annual",     "approved",        "Annual review completed. All documents current, security assessment excellent. No findings.",        "2027-01-15");
await upsertReview(razorpay,   "quarterly",  "approved",        "Q1 2026 quarterly review. Cyber insurance renewal flagged for immediate action.",                   "2026-09-15");
await upsertReview(freshworks, "annual",     "approved",        "Annual review completed. DPA renewal required before end of June.",                                  "2027-06-01");
await upsertReview(hdfc,       "annual",     "approved",        "Annual review completed. Exemplary compliance maintained.",                                           "2027-04-01");
await upsertReview(tcs,        "annual",     "needs_followup",  "Annual review flagged: Professional Indemnity expiring soon, incident response testing overdue.",    "2027-01-15");
await upsertReview(tcs,        "security",   "pending",         null,                                                                                                   "2026-09-01");
await upsertReview(zoho,       "annual",     "approved",        "Annual review passed. Encryption key management improved to partial — follow up in 6 months.",       "2027-02-01");
await upsertReview(wipro,      "quarterly",  "approved",        "Q2 2026 review. Application development and maintenance SLA targets met. Security assessment due.",  "2026-09-01");
await upsertReview(sify,       "annual",     "rejected",        "Annual review REJECTED: ISO 27001 certificate expired. Vendor must renew before next review.",       "2026-09-01");
await upsertReview(keka,       "compliance", "approved",        "DPDP compliance review passed. DPA in place and employee data handling documented.",                 "2026-12-01");
await upsertReview(infosys,    "annual",     "approved",        "Annual review completed. Finance BPO operations within SLA. ISO 22301 gap noted.",                   "2027-04-01");

console.log("✓ Reviews seeded");

// ─── Document requests ────────────────────────────────────────────────────────
console.log("\n📨 Seeding document requests...");

await upsertRequest(yotta,  "ISO/IEC 27001",              "Please provide your ISO 27001 certificate. This is required for our Cloud Provider template.",   "high",   "requested");
await upsertRequest(yotta,  "SOC 2 Type II",              "SOC 2 Type II attestation required for production hosting vendors.",                             "high",   "requested");
await upsertRequest(yotta,  "Data Processing Agreement (DPA)", "DPA is mandatory for vendors with access to production data.",                             "high",   "requested");
await upsertRequest(yotta,  "Cyber Liability Insurance",  "Cyber insurance certificate required. Minimum coverage ₹10 Crore.",                             "medium", "requested");
await upsertRequest(apollo, "Data Processing Agreement (DPA)", "DPA required immediately — Apollo processes employee health data under DPDP Act 2023.",   "high",   "requested");
await upsertRequest(apollo, "ISO/IEC 27001",              "Healthcare data warrants minimum ISO 27001 certification.",                                      "high",   "requested");
await upsertRequest(apollo, "Cyber Liability Insurance",  "Cyber insurance required for vendors handling sensitive health data.",                           "medium", "requested");
await upsertRequest(sify,   "ISO/IEC 27001:2022",         "Renew expired ISO 27001 certificate. URGENT — network vendor must maintain current certification.", "high", "requested");
await upsertRequest(darwinbox, "SOC 2 Type II",           "SOC 2 Type II report requested for HR platform handling recruitment data.",                      "medium", "requested");

console.log("✓ Document requests seeded");

// ─── Notification preferences (org-level) ────────────────────────────────────
console.log("\n🔔 Setting notification preferences...");
await sql`
  INSERT INTO notification_preferences
    (organization_id, expiry_alerts_enabled, weekly_digest_enabled, alert_days_before, recipient_emails)
  VALUES
    (${ORG}, true, true, ${sql.json([90,60,30,15,7])}, ${sql.json([])})
  ON CONFLICT (organization_id) DO NOTHING`;
console.log("✓ Notification preferences set");

// ─── Final summary ────────────────────────────────────────────────────────────
const [vFinal]   = await sql`select count(*)::int n from vendors where organization_id=${ORG}`;
const [dFinal]   = await sql`select count(*)::int n from vendor_documents where organization_id=${ORG}`;
const [aFinal]   = await sql`select count(*)::int n from assessments where organization_id=${ORG}`;
const [rFinal]   = await sql`select count(*)::int n from vendor_reviews where organization_id=${ORG}`;
const [reqFinal] = await sql`select count(*)::int n from document_requests where organization_id=${ORG}`;

console.log("\n✅ Seed complete!");
console.log(`   Vendors:   ${vFinal.n}`);
console.log(`   Documents: ${dFinal.n}`);
console.log(`   Assessments: ${aFinal.n}`);
console.log(`   Reviews:   ${rFinal.n}`);
console.log(`   Doc requests: ${reqFinal.n}`);

await sql.end();
