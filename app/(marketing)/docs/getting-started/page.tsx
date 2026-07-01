import Link from "next/link";

export const metadata = {
  title: "Getting Started — AUDT Documentation",
  description: "Your first governance workflow in 30 minutes. Step-by-step guide to AUDT.",
};

const STEPS = [
  {
    n: "01",
    title: "Understand the Platform",
    time: "3 min",
    goal: "Know what AUDT does before you touch it.",
    body: "AUDT is an AI-Native Trust, Risk & Compliance Platform — a Governance OS. It connects vendor governance, compliance management, risk management, audit management, and continuous monitoring into a single platform with one shared AI layer. The central output is the Org Trust Score™ — a live 0–100 measure of your organisation's overall governance posture.",
    actions: [
      "Read the Platform Overview at /platform",
      "Understand the 5 Org Trust Score™ components: Vendor Trust (25%), Risk Posture (25%), Control Health (20%), Audit Readiness (15%), Compliance Coverage (15%)",
      "Bookmark your dashboard at /dashboard — this is your command center",
    ],
    tip: "The dashboard shows your Org Trust Score™ ring, open risks, compliance readiness, and governance alerts at a glance.",
  },
  {
    n: "02",
    title: "Create Your Organisation",
    time: "2 min",
    goal: "Set up your workspace with correct metadata.",
    body: "Your organisation record is the tenant boundary in AUDT. Industry type and company size affect default vendor templates and compliance framework recommendations. Set these accurately — they influence how the platform behaves.",
    actions: [
      "Sign up at /signup — 3-step onboarding wizard launches automatically",
      "Step 1: Enter organisation name, industry, and company size",
      "Step 2: Select your governance goals (6 options — these customise your dashboard)",
      "Step 3: Invite first team members (optional at this stage)",
    ],
    tip: "Industry = SaaS/Fintech/Healthcare/Manufacturing/IT Services. Company size affects default vendor checklist complexity.",
  },
  {
    n: "03",
    title: "Invite Your Team",
    time: "5 min",
    goal: "Assign the right roles to the right people.",
    body: "AUDT has 7 governance roles. Each role controls what a user can create, edit, and view across all 32 modules. Get this right before importing data — it determines who can approve evidence, manage vendors, and configure the platform.",
    actions: [
      "Go to /settings/team → Invite Member",
      "Owner: full access — you (the account creator)",
      "Admin: full access except ownership transfer",
      "Compliance Manager: compliance, evidence, policies, frameworks",
      "Security Manager: security assessments, controls, risk",
      "Procurement Manager: vendors, contracts, vendor portal",
      "Member: read + limited create",
      "Viewer: read-only across all modules",
    ],
    tip: "For a small team: Owner + 1 Compliance Manager + 1 Security Manager covers 90% of workflows.",
  },
  {
    n: "04",
    title: "Add Your First Vendor",
    time: "5 min",
    goal: "Create a vendor record and start the governance lifecycle.",
    body: "The vendor is the central entity in AUDT. Every risk, evidence item, control, contract, and assessment connects to a vendor. Start with your highest-risk or most strategic vendor.",
    actions: [
      "Go to /vendors → New Vendor",
      "Enter: name, website, category (SaaS/Cloud/IT Services/etc.), risk level, country, owner",
      "Assign a Vendor Type (template) — this pre-populates required document checklists",
      "Save — vendor is now in 'active' status and appears in the Vendor Hub™",
    ],
    tip: "Vendor Types are templates that define which documents are required vs. optional for each vendor category. Set them up at /settings → Vendor Types.",
  },
  {
    n: "05",
    title: "Upload Evidence",
    time: "5 min",
    goal: "Collect the first piece of compliance evidence.",
    body: "Evidence is how AUDT proves governance. It covers vendor documents (SOC 2 reports, ISO certificates, DPAs), security assessments, periodic reviews, and compliance policies. Evidence maps to controls — and controls determine your framework readiness scores.",
    actions: [
      "Option A: Go to vendor detail → Documents tab → Upload document — this creates vendor evidence automatically",
      "Option B: Go to /compliance/evidence → New Evidence to create evidence manually",
      "After upload: AUDT AI extracts 10 fields — issuer, validity dates, certification body, scope, etc.",
      "Map evidence to controls: Evidence detail → Map to Control",
    ],
    tip: "Use 'Auto-Import from Vendors' at /compliance/evidence to pull all approved vendor documents into compliance evidence in one click.",
  },
  {
    n: "06",
    title: "Run a Security Assessment",
    time: "10 min",
    goal: "Score your vendor's security posture.",
    body: "AUDT includes a 17-question security assessment covering access control, data handling, incident response, encryption, and more. The assessment score feeds directly into the vendor's Trust Score™ (15% weight). A score ≥ 60 is required for vendor approval.",
    actions: [
      "Go to vendor detail → Assessment tab → Launch Assessment",
      "Answer 17 questions: yes/no/partial/na — each maps to a risk category",
      "Score is computed automatically (0–100)",
      "Review the assessment summary — AUDT AI generates a risk narrative",
      "Score appears as a component in the vendor's Trust Score™",
    ],
    tip: "Send the assessment to the vendor: the Vendor Portal (magic link at vendor detail → Portal tab) lets vendors complete assessments without an AUDT account.",
  },
  {
    n: "07",
    title: "Select a Compliance Framework",
    time: "5 min",
    goal: "Begin tracking readiness against an industry standard.",
    body: "AUDT ships with 174 pre-built controls across ISO 27001 (93), SOC 2 (33), DPDP (18), PCI DSS (12), and HIPAA (18). Add a framework, and AUDT immediately shows your current readiness score based on evidence already collected.",
    actions: [
      "Go to /compliance/frameworks → New Framework",
      "Choose from: ISO 27001, SOC 2, DPDP, PCI DSS, HIPAA",
      "AUDT loads all controls automatically — no manual setup required",
      "Readiness score appears instantly: covered controls ÷ total controls",
      "Run Gap Analysis at /compliance/gaps to see exactly what's missing",
    ],
    tip: "Start with whichever framework your customers or auditors ask about most. DPDP is mandatory for Indian businesses handling personal data.",
  },
  {
    n: "08",
    title: "Review Your Trust Score™",
    time: "3 min",
    goal: "See your vendor's governance posture as a single number.",
    body: "The Vendor Trust Score™ is a 0–100 governance signal computed from 7 components: Evidence (20%), Risk (20%), Compliance (15%), Assessment (15%), Contract (10%), Operational (10%), Freshness (10%). It updates on every meaningful change. A score ≥ 90 = Trusted.",
    actions: [
      "Go to vendor detail → Trust Score tab",
      "Review the 7-component breakdown bars — each shows its contribution",
      "Read the AI narrative — AUDT Governance Copilot™ explains what's driving the score",
      "See Strengths and Concerns — prioritised actions to improve the score",
      "Click 'Recalculate' to force a fresh score computation",
    ],
    tip: "The Org Trust Score™ at /trust-intelligence aggregates all vendor scores plus your risk, control, audit, and compliance posture into one executive number.",
  },
  {
    n: "09",
    title: "Generate Your First Report",
    time: "2 min",
    goal: "Share governance evidence with stakeholders.",
    body: "AUDT generates board-ready PDF reports and CSV exports across every module. The Compliance Executive PDF includes an AI-narrated summary suitable for board presentations. Vendor assessment PDFs are useful for procurement reviews.",
    actions: [
      "Vendor reports: vendor detail → 'Audit Package' or 'Executive Report' buttons",
      "Compliance reports: /compliance/reports → Framework PDF or Executive PDF",
      "AI Executive Summary: /trust-intelligence/executive → generate summary (cached 24h)",
      "Benchmark report: /benchmarking/ai → AI Benchmark Analyst™",
      "All reports are timestamped and archived in AUDT for audit evidence",
    ],
    tip: "The Executive PDF at /compliance/reports/executive includes an AI-written narrative — paste this directly into board slide notes.",
  },
];

const NEXT_STEPS = [
  { icon: "⚡", title: "Automate with TOE", desc: "Set up workflows at /operations to automate vendor onboarding, evidence collection, and risk escalation.", href: "/operations" },
  { icon: "🤖", title: "Deploy Governance Agents", desc: "Activate AI agents at /agents to continuously monitor your vendor portfolio and surface governance signals.", href: "/agents" },
  { icon: "📊", title: "Configure Benchmarking", desc: "See how your governance posture compares to industry peers at /benchmarking.", href: "/benchmarking" },
  { icon: "🏆", title: "Get Verified", desc: "Apply for AUDT Verified™ certification at /trust-verification once your Trust Score exceeds 80.", href: "/trust-verification" },
];

export default function GettingStartedPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--color-bg, #F8F9FB)",
      color: "var(--color-ink, #1E293B)",
      fontFamily: "var(--font-sans, system-ui, sans-serif)",
    }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid #E4E8EF",
        padding: "16px 0",
        position: "sticky" as const, top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
      }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "7px",
                background: "linear-gradient(120deg, #00B8D9 0%, #4933D6 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 900, color: "white",
              }}>A</div>
              <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-ink, #1E293B)" }}>AUDT</span>
            </Link>
            <span style={{ color: "#CBD5E1" }}>/</span>
            <Link href="/docs" style={{ fontSize: "13px", color: "#64748B", textDecoration: "none" }}>Docs</Link>
            <span style={{ color: "#CBD5E1" }}>/</span>
            <span style={{ fontSize: "13px", color: "#64748B" }}>Getting Started</span>
          </div>
          <Link
            href="/signup"
            style={{
              padding: "8px 18px", borderRadius: "10px",
              background: "linear-gradient(120deg, #00B8D9 0%, #4933D6 100%)",
              color: "white", fontSize: "13px", fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Start Free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "64px 24px 40px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "5px 14px", borderRadius: "999px",
          border: "1px solid rgba(73,51,214,0.20)", background: "rgba(73,51,214,0.07)",
          fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
          color: "#4933D6", marginBottom: "20px",
        }}>
          &#9711; Getting Started Guide
        </div>
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, lineHeight: 1.15,
          color: "var(--color-ink, #1E293B)", marginBottom: "16px",
          fontFamily: "var(--font-display, system-ui)",
        }}>
          First Governance Workflow<br />in 30 Minutes.
        </h1>
        <p style={{ fontSize: "16px", color: "#64748B", maxWidth: "560px", lineHeight: 1.65, marginBottom: "32px" }}>
          Follow these 9 steps to go from a blank workspace to a scored vendor, a compliance framework, and your first Trust Score™. No prior GRC experience required.
        </p>

        {/* Progress strip */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "48px" }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{
              padding: "5px 12px", borderRadius: "8px",
              background: "#F8F9FB", border: "1px solid #E4E8EF",
              fontSize: "12px", fontWeight: 600, color: "#94A3B8",
            }}>
              {s.n}
            </div>
          ))}
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {STEPS.map((step, i) => (
            <div key={step.n} id={`step-${step.n}`} style={{
              padding: "32px 36px", borderRadius: "20px",
              background: "#FFFFFF", border: "1px solid #E4E8EF",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
                {/* Step number */}
                <div style={{
                  flexShrink: 0, width: "44px", height: "44px", borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(73,51,214,0.15), rgba(0,184,217,0.08))",
                  border: "1px solid rgba(73,51,214,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", fontWeight: 900, color: "#4933D6",
                  fontFamily: "var(--font-display, system-ui)",
                }}>
                  {step.n}
                </div>
                <div style={{ flex: 1 }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px", flexWrap: "wrap", gap: "8px" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-ink, #1E293B)", margin: 0, fontFamily: "var(--font-display, system-ui)" }}>
                      {step.title}
                    </h2>
                    <span style={{
                      fontSize: "11px", fontWeight: 600, padding: "3px 10px",
                      borderRadius: "999px", background: "#F8F9FB",
                      border: "1px solid #E4E8EF", color: "#94A3B8",
                    }}>
                      &#9679; {step.time}
                    </span>
                  </div>

                  {/* Goal */}
                  <div style={{ fontSize: "13px", color: "#4933D6", fontWeight: 600, marginBottom: "12px" }}>
                    Goal: {step.goal}
                  </div>

                  {/* Body */}
                  <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.7, marginBottom: "20px" }}>
                    {step.body}
                  </p>

                  {/* Actions */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", marginBottom: "10px" }}>
                      Steps
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {step.actions.map((action, ai) => (
                        <div key={ai} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "13px", color: "#64748B" }}>
                          <span style={{
                            flexShrink: 0, width: "18px", height: "18px", borderRadius: "5px",
                            background: "rgba(73,51,214,0.08)", border: "1px solid rgba(73,51,214,0.20)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "9px", fontWeight: 700, color: "#4933D6",
                            marginTop: "2px",
                          }}>
                            {ai + 1}
                          </span>
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tip */}
                  <div style={{
                    padding: "12px 16px", borderRadius: "10px",
                    background: "rgba(0,184,217,0.06)", border: "1px solid rgba(0,120,148,0.20)",
                    fontSize: "12px", color: "#007A94", lineHeight: 1.6,
                    display: "flex", gap: "8px", alignItems: "flex-start",
                  }}>
                    <span style={{ flexShrink: 0, fontWeight: 700 }}>&#9432;</span>
                    {step.tip}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Done banner */}
        <div style={{
          marginTop: "40px", padding: "32px 36px", borderRadius: "20px",
          background: "linear-gradient(135deg, rgba(73,51,214,0.08), rgba(0,184,217,0.05))",
          border: "1px solid rgba(73,51,214,0.18)", textAlign: "center",
        }}>
          <div style={{ fontSize: "28px", marginBottom: "12px" }}>&#9989;</div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-ink, #1E293B)", marginBottom: "8px", fontFamily: "var(--font-display, system-ui)" }}>
            You have a working governance program.
          </h2>
          <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "0" }}>
            One vendor. One framework. One Trust Score™. This is the foundation. Everything else builds on top.
          </p>
        </div>

        {/* Next steps */}
        <div style={{ marginTop: "40px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-ink, #1E293B)", marginBottom: "20px", fontFamily: "var(--font-display, system-ui)" }}>
            What to do next
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
            {NEXT_STEPS.map(({ icon, title, desc, href }) => (
              <Link
                key={title}
                href={href}
                style={{
                  display: "flex", flexDirection: "column", gap: "10px",
                  padding: "20px", borderRadius: "14px",
                  background: "#FFFFFF", border: "1px solid #E4E8EF",
                  textDecoration: "none", transition: "border-color 0.2s",
                }}
              >
                <div style={{ fontSize: "22px" }}>{icon}</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-ink, #1E293B)" }}>{title}</div>
                <div style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.6 }}>{desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer nav */}
        <div style={{
          marginTop: "48px", paddingTop: "24px", borderTop: "1px solid #E4E8EF",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px",
        }}>
          <Link href="/docs" style={{ fontSize: "13px", color: "#94A3B8", textDecoration: "none" }}>
            ← Back to Documentation
          </Link>
          <Link href="/signup" style={{
            padding: "10px 24px", borderRadius: "12px",
            background: "linear-gradient(120deg, #00B8D9 0%, #4933D6 100%)",
            color: "white", fontSize: "14px", fontWeight: 600, textDecoration: "none",
          }}>
            Start Free →
          </Link>
        </div>
      </div>
    </div>
  );
}
