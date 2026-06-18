"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import "./docs.css";

/* ============================================================
   NAV STRUCTURE
   ============================================================ */
const NAV = [
  {
    group: "Introduction",
    items: [
      { id: "overview",      label: "What is AUDT?" },
      { id: "getting-started", label: "Getting Started" },
      { id: "architecture",  label: "Platform Architecture" },
    ],
  },
  {
    group: "Core GRC",
    items: [
      { id: "vendor-hub",        label: "Vendor Hub™" },
      { id: "evidence-vault",    label: "Evidence Vault™" },
      { id: "audit-management",  label: "Audit Management" },
      { id: "risk-lens",         label: "Risk Lens™" },
      { id: "control-center",    label: "Control Center™" },
    ],
  },
  {
    group: "Intelligence Layer",
    items: [
      { id: "trust-intelligence",    label: "Trust Intelligence™" },
      { id: "governance-trends",     label: "Governance Trends™" },
      { id: "continuous-monitoring", label: "Continuous Monitoring™" },
      { id: "trust-graph",           label: "Trust Graph™" },
    ],
  },
  {
    group: "Privacy & Legal",
    items: [
      { id: "policy-governance",  label: "Policy Governance™" },
      { id: "dpdp-privacy",       label: "DPDP Privacy™" },
      { id: "contract-governance",label: "Contract Governance™" },
    ],
  },
  {
    group: "Operations",
    items: [
      { id: "issue-hub",      label: "Issue & Remediation Hub™" },
      { id: "workflow-studio",label: "Workflow Studio™" },
    ],
  },
  {
    group: "Trust Network",
    items: [
      { id: "trust-exchange",   label: "Third-Party Risk Exchange™" },
      { id: "benchmarking",     label: "Governance Benchmarking™" },
      { id: "integration-hub",  label: "Integration Hub™" },
      { id: "trust-network",    label: "Trust Network™" },
    ],
  },
  {
    group: "AI & Agents",
    items: [
      { id: "executive-reporting",  label: "Executive Reporting™" },
      { id: "ai-governance",        label: "AI Governance™" },
      { id: "auditor-collab",       label: "Auditor Collaboration™" },
      { id: "trust-api",            label: "Trust API Platform™" },
      { id: "trust-verification",   label: "Trust Verification™" },
      { id: "continuous-compliance",label: "Continuous Compliance™" },
      { id: "governance-agents",    label: "Governance Agent Framework™" },
      { id: "regulatory-intel",     label: "Regulatory Intelligence™" },
      { id: "asset-intelligence",   label: "Asset Intelligence™" },
      { id: "security-center",      label: "Security Command Center™" },
    ],
  },
  {
    group: "Scoring",
    items: [
      { id: "scoring-engines", label: "Scoring Engines" },
    ],
  },
  {
    group: "Administration",
    items: [
      { id: "admin-guide", label: "Admin Guide" },
      { id: "api-reference", label: "REST API Reference" },
    ],
  },
  {
    group: "Reference",
    items: [
      { id: "faq",      label: "FAQ" },
      { id: "glossary", label: "Glossary" },
    ],
  },
];

/* ============================================================
   SMALL HELPERS
   ============================================================ */
function Code({ children }: { children: React.ReactNode }) {
  return <code className="docs-inline-code">{children}</code>;
}

function Pre({ label, children }: { label?: string; children: string }) {
  return (
    <div className="docs-code-block">
      {label && <span className="docs-code-label">{label}</span>}
      <pre className="docs-pre">{children}</pre>
    </div>
  );
}

function Callout({ type = "info", icon, children }: { type?: "info" | "tip" | "warn"; icon?: string; children: React.ReactNode }) {
  const defaults: Record<string, string> = { info: "ℹ️", tip: "✅", warn: "⚠️" };
  return (
    <div className={`docs-callout docs-callout-${type}`}>
      <span className="docs-callout-icon">{icon ?? defaults[type]}</span>
      <div className="docs-callout-body">{children}</div>
    </div>
  );
}

function Steps({ items }: { items: { title: string; body: React.ReactNode }[] }) {
  return (
    <div className="docs-steps">
      {items.map((item, i) => (
        <div className="docs-step" key={i}>
          <div className="docs-step-num">{i + 1}</div>
          <div className="docs-step-body"><strong>{item.title}</strong> — {item.body}</div>
        </div>
      ))}
    </div>
  );
}

function Badge({ color, children }: { color: "indigo"|"green"|"amber"|"red"|"blue"; children: React.ReactNode }) {
  return <span className={`docs-badge docs-badge-${color}`}>{children}</span>;
}

function Method({ m }: { m: "GET"|"POST"|"PUT"|"DELETE" }) {
  return <span className={`docs-method docs-method-${m.toLowerCase()}`}>{m}</span>;
}

function ScoreGrid({ items }: { items: { ring: string; label: string; weight: string }[] }) {
  const colors = ["indigo","purple","blue","green","cyan"];
  return (
    <div className="docs-score-grid">
      {items.map((it, i) => (
        <div className="docs-score-pill" key={i}>
          <div className={`docs-score-ring docs-score-ring-${colors[i % colors.length]}`}>{it.weight}</div>
          <div className="docs-score-info">
            <div className="docs-score-label">{it.label}</div>
            <div className="docs-score-weight">{it.ring}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   MODULE DOC TEMPLATE
   ============================================================ */
function ModuleDoc({
  id, icon, name, route, tagline, features, workflow,
}: {
  id: string; icon: string; name: string; route?: string;
  tagline: string;
  features: string[];
  workflow: { title: string; body: React.ReactNode }[];
}) {
  return (
    <div className="docs-subsection" id={id}>
      <h3 className="docs-subsection-title">
        <span style={{ marginRight: 8 }}>{icon}</span>{name}
        {route && <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 400, color: "var(--docs-indigo)", fontFamily: "monospace" }}>{route}</span>}
      </h3>
      <p className="docs-p">{tagline}</p>
      <ul className="docs-ul">
        {features.map((f, i) => <li key={i}>{f}</li>)}
      </ul>
      <p className="docs-p" style={{ fontWeight: 600, color: "var(--docs-ink)", fontSize: 13, marginBottom: 4, marginTop: 14 }}>Common workflow</p>
      <Steps items={workflow} />
    </div>
  );
}

/* ============================================================
   FAQ ITEM
   ============================================================ */
function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="docs-faq-item">
      <button className={`docs-faq-q${open ? " open" : ""}`} onClick={() => setOpen(o => !o)}>
        {q}
        <svg className="docs-faq-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className={`docs-faq-a${open ? " open" : ""}`}>{a}</div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE COMPONENT
   ============================================================ */
export default function DocsPage() {
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  /* Scroll spy */
  useEffect(() => {
    const allIds = NAV.flatMap(g => g.items.map(i => i.id));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-56px 0px -70% 0px", threshold: 0 }
    );
    allIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  /* Close sidebar on nav click (mobile) */
  const navClick = useCallback((id: string) => {
    setSidebarOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /* Filter sidebar items by search */
  const q = search.toLowerCase();
  const filteredNav = NAV.map(g => ({
    ...g,
    items: g.items.filter(it => !q || it.label.toLowerCase().includes(q) || it.id.includes(q)),
  })).filter(g => g.items.length);

  return (
    <div className="docs-root">
      {/* ---- TOP NAV ---- */}
      <nav className="docs-topnav">
        <button className="docs-hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle nav">☰</button>
        <a href="/docs" className="docs-logo">
          <div className="docs-logo-mark">A</div>
          <span className="docs-logo-text">AUDT</span>
          <span className="docs-logo-badge">Docs</span>
        </a>
        <div className="docs-topnav-spacer" />
        <div className="docs-search-wrap">
          <svg className="docs-search-icon" width="14" height="14" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2"/>
            <path d="M15 15l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            className="docs-search"
            placeholder="Search docs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <a href="/dashboard" className="docs-topnav-link">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor"/><rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5"/><rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5"/><rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".3"/></svg>
          Dashboard
        </a>
        <a href="https://audt.tech" className="docs-topnav-link hide-mobile">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" stroke="currentColor" strokeWidth="1.7"/><path d="M2 10h16M10 2c-2 2-3 5-3 8s1 6 3 8M10 2c2 2 3 5 3 8s-1 6-3 8" stroke="currentColor" strokeWidth="1.4"/></svg>
          audt.tech
        </a>
      </nav>

      {/* ---- BODY ---- */}
      <div className="docs-layout">
        {/* ---- SIDEBAR ---- */}
        <aside className={`docs-sidebar${sidebarOpen ? " mobile-open" : ""}`}>
          {filteredNav.length === 0 && (
            <div className="docs-no-results">No results for "{search}"</div>
          )}
          {filteredNav.map(group => (
            <div className="docs-nav-group" key={group.group}>
              <div className="docs-nav-group-label">{group.group}</div>
              {group.items.map(item => (
                <button
                  key={item.id}
                  className={`docs-nav-item${activeId === item.id ? " active" : ""}`}
                  onClick={() => navClick(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* ---- MAIN ---- */}
        <main className="docs-main" ref={mainRef}>
          <div className="docs-content">

            {/* ======================================================
                1. OVERVIEW
                ====================================================== */}
            <section className="docs-section" id="overview">
              <h2 className="docs-section-title">What is AUDT?</h2>
              <p className="docs-lead">
                <strong style={{ color: "#fff" }}>AUDT</strong> is the AI-Native Trust, Risk &amp; Compliance Platform — the <em>Governance OS</em> for modern organizations. It replaces disconnected spreadsheets and point tools with a single, AI-powered platform for vendor governance, compliance, audits, risk, and board governance.
              </p>
              <p className="docs-p">
                Tagline: <strong style={{ color: "var(--docs-indigo)" }}>"Governance Built on Proof."</strong>
              </p>

              <div className="docs-card">
                <div className="docs-card-title">Key value propositions</div>
                <ul className="docs-ul" style={{ marginBottom: 0 }}>
                  <li><strong>Single pane of glass</strong> — 31 governance modules unified under one Organizational Trust Score™</li>
                  <li><strong>AI-native</strong> — Gemini 2.5 Flash powers narratives, gap detection, risk officers, executive reports, and multi-turn NL chat across every module</li>
                  <li><strong>Evidence-first</strong> — every claim is backed by verifiable, timestamped evidence stored in Evidence Vault™</li>
                  <li><strong>India-first data residency</strong> — all data stored on Supabase Mumbai (ap-south-1), DPDP-compliant by design</li>
                  <li><strong>Trust-as-infrastructure</strong> — publish verified trust profiles, issue certificates, and expose governance data via Trust API Platform™</li>
                </ul>
              </div>

              <div className="docs-subsection" id="overview-modules">
                <h3 className="docs-subsection-title">31 Modules at a glance</h3>
                <div className="docs-module-grid">
                  {[
                    ["🏢","Vendor Hub™","/vendors","Vendor registry, docs, trust scoring"],
                    ["🛡️","Evidence Vault™","/compliance","Compliance frameworks, controls, AI officer"],
                    ["🔍","Audit Management","/audits","Audit lifecycle, findings, CAPAs"],
                    ["⚠️","Risk Lens™","/risks","Risk register, heat map, treatments"],
                    ["🎛️","Control Center™","/controls","Control library, health scoring, testing"],
                    ["📊","Trust Intelligence™","/trust-intelligence","Org Trust Score™, executive view"],
                    ["📈","Governance Trends™","/trust-intelligence/trends","90-day sparklines"],
                    ["🔔","Continuous Monitoring™","/trust-intelligence/monitoring","7 automated rules"],
                    ["🕸️","Trust Graph™","/trust-intelligence/trust-graph","Force-directed governance graph"],
                    ["📋","Policy Governance™","","Policy lifecycle, attestations"],
                    ["🔒","DPDP Privacy™","","India DPDP Act, consent, DSR"],
                    ["📝","Contract Governance™","/contract-governance","Contracts, obligations, renewals"],
                    ["🔧","Issue & Remediation Hub™","/issue-hub","Issues, tasks, SLAs, escalations"],
                    ["⚙️","Workflow Studio™","","Governance automation engine"],
                    ["🤝","Third-Party Risk Exchange™","/trust-exchange","Trust profiles, badges, directory"],
                    ["📉","Governance Benchmarking™","/benchmarking","Percentile, rankings, trends"],
                    ["🔗","Integration Hub™","/integration-hub","35+ connectors, sync engine"],
                    ["🌐","Trust Network™","","Public trust infrastructure"],
                    ["📣","Executive Reporting™","/executive-reporting","Role dashboards, board reports"],
                    ["🤖","AI Governance™","/ai-governance","AI system inventory, risks"],
                    ["👥","Auditor Collaboration™","/auditor-collaboration","External audit rooms"],
                    ["🔌","Trust API Platform™","/trust-api","API products, webhooks"],
                    ["✅","Trust Verification™","/trust-verification","Certificates, public registry"],
                    ["♻️","Continuous Compliance™","","21 automated checks, access reviews"],
                    ["🧠","Governance Agent Framework™","/agents","AI agents, observations"],
                    ["📰","Regulatory Intelligence™","/regulatory-intelligence","18+ regulations, change monitor"],
                    ["🗂️","Asset Intelligence™","/asset-intelligence","Asset registry, PII, relationships"],
                    ["🛡","Security Command Center™","/security-center","MFA, SSO, sessions, IP lists"],
                    ["⭐","Trust Score™","","Vendor-level 6-component scoring"],
                    ["👤","Settings & Org Management","/settings","Profile, team, billing, API keys"],
                    ["🤔","Help Center","/help","In-app documentation for all modules"],
                  ].map(([icon, name, route, desc], i) => (
                    <div className="docs-module-card" key={i}>
                      <div className="docs-module-card-icon">{icon}</div>
                      <div className="docs-module-card-name">{name}</div>
                      {route && <div className="docs-module-card-route">{route}</div>}
                      <div className="docs-module-card-desc">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ======================================================
                2. GETTING STARTED
                ====================================================== */}
            <section className="docs-section" id="getting-started">
              <h2 className="docs-section-title">Getting Started</h2>
              <p className="docs-lead">From sign-up to your first governance action in under 10 minutes.</p>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">Sign-up flow</h3>
                <Steps items={[
                  { title: "Create an account", body: <>Go to <Code>/signup</Code>. Enter your email and password. AUDT creates your account and logs you in immediately (no email confirmation required in sandbox mode).</> },
                  { title: "Onboarding wizard — Step 1", body: "Enter your organisation name, industry (Technology, Financial Services, Healthcare, Manufacturing, IT Services, etc.), and company size. These are saved to the database and personalise your dashboard." },
                  { title: "Onboarding wizard — Step 2", body: "Select up to 6 governance goals (Vendor Governance, Compliance Readiness, Risk Management, Audit Readiness, Privacy Compliance, Board Reporting). Your selections are stored in localStorage and used to customise the dashboard." },
                  { title: "Onboarding wizard — Step 3", body: "Invite team members by email. Assign roles (owner/admin/member/viewer/compliance_manager/security_manager/procurement_manager). You can skip this and invite later from Settings → Team." },
                  { title: "Dashboard", body: <>You land on <Code>/dashboard?welcome=1</Code>. A dismissible welcome banner appears. An 8-task onboarding checklist (in the bottom-right) guides your first actions.</> },
                ]} />
              </div>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">First things to do</h3>
                <div className="docs-card">
                  <ul className="docs-ul" style={{ marginBottom: 0 }}>
                    <li><strong>Add your first vendor</strong> — go to Vendor Hub™ → New Vendor. Fill in name, category, risk level, and owner. Upload documents to start scoring.</li>
                    <li><strong>Set up a compliance framework</strong> — go to Evidence Vault™ → Frameworks → New. Choose from ISO 27001, SOC 2, DPDP, PCI DSS, HIPAA, or create a custom framework.</li>
                    <li><strong>Run a risk assessment</strong> — go to Risk Lens™ → New Risk. Set impact (1–5), likelihood (1–5), and category. The risk score is calculated automatically.</li>
                    <li><strong>Explore your Trust Score™</strong> — go to Trust Intelligence™ to see your Organizational Trust Score™ across all 5 components.</li>
                    <li><strong>Connect an integration</strong> — go to Integration Hub™ → Marketplace to connect Entra ID, Okta, AWS, GitHub, or Jira.</li>
                  </ul>
                </div>
                <Callout type="tip">The onboarding checklist in the bottom-right corner tracks your progress. Complete all 8 tasks to unlock the full power of AUDT.</Callout>
              </div>
            </section>

            {/* ======================================================
                3. ARCHITECTURE
                ====================================================== */}
            <section className="docs-section" id="architecture">
              <h2 className="docs-section-title">Platform Architecture</h2>
              <p className="docs-lead">AUDT is a layered modular monolith built on Next.js 16 App Router with full India data residency.</p>

              <Pre label="architecture">
{`Browser / API client
        │
   app/                     ← TRANSPORT: pages, server actions, REST handlers
        │
   lib/auth/                ← AUTH: requireUser() session | validateApiKey() Bearer
        │
   lib/services/            ← BUSINESS LOGIC: domain rules, DomainError, audit logging
        │              │
   lib/repositories/  lib/providers/   ← DATA ACCESS (Drizzle) | INFRASTRUCTURE ADAPTERS
        │                    │
   lib/db/ (Postgres)    Supabase / Gemini / Crypto / Storage / Rate limit`}
              </Pre>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">Tech stack</h3>
                <div className="docs-table-wrap">
                  <table className="docs-table">
                    <thead><tr><th>Layer</th><th>Technology</th></tr></thead>
                    <tbody>
                      {[
                        ["Framework","Next.js 16 (App Router) + TypeScript"],
                        ["Hosting","Vercel (Mumbai bom1) + Supabase (ap-south-1) — full India data residency"],
                        ["Database","Supabase Postgres + Row-Level Security — 259 tables across 33 migrations"],
                        ["ORM","Drizzle — lazy init via Proxy in lib/db/index.ts"],
                        ["Auth","Supabase Auth + org-based RBAC (7 roles)"],
                        ["Storage","Supabase Storage — vendor-documents + compliance-documents buckets"],
                        ["AI","Google Gemini 2.5 Flash (@google/genai)"],
                        ["Email","Resend — expiry alerts + weekly digests"],
                        ["Security","AES-256-GCM (Node.js crypto) · bcryptjs"],
                        ["UI","Tailwind v4 · dark glassmorphism · deep indigo/purple/electric-blue"],
                      ].map(([l,t]) => <tr key={l}><td><Code>{l}</Code></td><td>{t}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">Architecture rules</h3>
                <ul className="docs-ul">
                  <li>Business logic lives <strong>only</strong> in <Code>lib/services/*</Code> — never in server actions or components</li>
                  <li>Services have zero <Code>next/*</Code> imports — they are framework-agnostic TypeScript</li>
                  <li>Services throw <Code>DomainError</Code> for validation failures; actions catch and return <Code>{"{ error }"}</Code></li>
                  <li>External SDKs (<Code>@supabase/supabase-js</Code>, <Code>@google/genai</Code>) imported ONLY inside <Code>lib/providers/</Code></li>
                  <li>Integration configs always pass through <Code>encryptConfig()</Code>/<Code>decryptConfig()</Code> — never stored plaintext</li>
                  <li>Every protected page exports <Code>{"export const dynamic = \"force-dynamic\""}</Code></li>
                </ul>
              </div>
            </section>

            {/* ======================================================
                MODULE GUIDES
                ====================================================== */}
            <section className="docs-section" id="vendor-hub">
              <h2 className="docs-section-title">Module Guides</h2>
              <p className="docs-lead">Deep dives into each of AUDT's 31 governance modules.</p>

              <ModuleDoc
                id="vendor-hub"
                icon="🏢"
                name="Vendor Hub™"
                route="/vendors"
                tagline="Central registry for all your third-party vendors. Manage documents, run security assessments, track reviews, and compute Trust Score™ — all in one place."
                features={[
                  "25-column vendor registry with owner assignment, risk level, and compliance score",
                  "Document management with Gemini AI extraction (10 fields: expiry, issuer, coverage, etc.)",
                  "Security assessments — 17 standard questions grouped by category, scored 0–100",
                  "Periodic governance reviews with outcome tracking",
                  "Trust Score™ — 6-component vendor trust scoring (see Scoring Engines section)",
                  "Natural language vendor search — describe in plain English, AUDT converts to filters",
                  "Vendor self-service portal via magic link — vendors upload their own documents",
                  "Executive PDF reports and audit packages",
                  "Email expiry alerts and AI-written weekly digests via Resend",
                ]}
                workflow={[
                  { title: "Add vendor", body: "Go to /vendors/new. Fill in vendor name, category, risk level, contract value, and assign an owner." },
                  { title: "Upload documents", body: <>On the vendor detail page, go to the <strong>Documents</strong> tab. Upload PDFs — AUDT extracts expiry date, issuer, coverage, and 7 other fields automatically.</> },
                  { title: "Run assessment", body: <>Click <strong>Run Assessment</strong> on the vendor detail page. Answer 17 security questions. The score (0–100) updates automatically.</> },
                  { title: "Check Trust Score™", body: <>Go to the <strong>Compliance</strong> tab on the vendor detail. The Trust Score™ widget shows all 6 components with strengths and concerns.</> },
                  { title: "Set up portal", body: "From the vendor detail, generate a magic-link portal token. Share with the vendor so they can upload documents directly." },
                ]}
              />

              <ModuleDoc
                id="evidence-vault"
                icon="🛡️"
                name="Evidence Vault™"
                route="/compliance"
                tagline="Complete compliance management — frameworks, controls, evidence, policies, gap analysis, and AI-powered readiness scoring. Replaces spreadsheet-based compliance tracking entirely."
                features={[
                  "5 built-in frameworks: ISO 27001 (93 controls), SOC 2 (33), DPDP (18), PCI DSS (12), HIPAA (18)",
                  "Custom framework support with control templates",
                  "Evidence management — import from vendor docs/assessments/reviews or add manually",
                  "Policy lifecycle with version history and approval workflow",
                  "5-rule automated gap analysis: missing evidence, expiring evidence, untested controls, low-score controls, unreviewed policies",
                  "Readiness scoring — pure function recomputed on every control or evidence change",
                  "AI Compliance Officer™ — framework summaries, gap narratives, executive summary, live NL chat",
                  "PDF reports: per-framework PDF, executive AI-narrated PDF, plus 3 CSVs",
                ]}
                workflow={[
                  { title: "Create framework", body: <>Go to <Code>/compliance/frameworks/new</Code>. Choose a template (ISO 27001, SOC 2, etc.) or start custom. AUDT seeds all controls automatically.</> },
                  { title: "Add evidence", body: <>Go to <Code>/compliance/evidence/new</Code>. Attach an existing vendor document or upload new evidence. Map it to one or more controls.</> },
                  { title: "Create policies", body: <>Go to <Code>/compliance/policies/new</Code>. Add content, set status to <em>approved</em>. AUDT creates a version snapshot.</> },
                  { title: "Run gap analysis", body: "Go to Gaps tab. AUDT runs 5 automated rule checks and surfaces all open gaps with severity (critical/high/medium/low)." },
                  { title: "Generate report", body: <>Go to Reports tab. Click <strong>Generate Framework PDF</strong> or <strong>Generate Executive PDF</strong> (AI-narrated board-ready report).</> },
                ]}
              />

              <ModuleDoc
                id="audit-management"
                icon="🔍"
                name="Audit Management"
                route="/audits"
                tagline="Full audit lifecycle from planning through findings, CAPAs, and board-ready PDF reports. Supports ISO, SOC 2, DPDP, and custom audit types."
                features={[
                  "Audit registry — name, type, scope, objective, auditor, start/end dates",
                  "Auto-generated audit programs from compliance framework controls",
                  "Findings management — severity (critical/high/medium/low), status workflow, AI finding generator",
                  "CAPA tracker — corrective action plans with owner, due date, completion notes",
                  "Status transitions: planned → active → completed / cancelled",
                  "5 report types: Full Audit PDF, Findings PDF, CAPAs PDF, Findings CSV, CAPAs CSV",
                  "AI Auditor™ — executive board report, AI CAPA suggestions, live NL chat",
                ]}
                workflow={[
                  { title: "Create audit", body: <>Go to <Code>/audits/new</Code>. Choose type (internal/external/regulatory/iso_27001/soc2/dpdp/hipaa/pci_dss/custom). Link to a compliance framework to auto-generate the audit program.</> },
                  { title: "Start the audit", body: <>On the audit detail page, click <strong>Start Audit</strong>. Status moves to <em>active</em>. Work through the program checklist.</> },
                  { title: "Log findings", body: <>Go to <Code>/audits/[id]/findings/new</Code>. Use the AI Finding Generator — paste your observation and AUDT produces a structured finding.</> },
                  { title: "Create CAPAs", body: "For each finding, create a Corrective Action Plan with an assigned owner and due date. AUDT auto-moves the finding to 'remediating' status." },
                  { title: "Complete and report", body: "Click Complete Audit. Download the Full Audit PDF or the AI-narrated Executive Report from the Reports tab." },
                ]}
              />

              <ModuleDoc
                id="risk-lens"
                icon="⚠️"
                name="Risk Lens™"
                route="/risks"
                tagline="Full risk lifecycle from identification through treatment and periodic review. Includes a 5×5 heat map, AI risk officer, and 13 risk categories covering cyber, vendor, privacy, financial, and strategic risk."
                features={[
                  "Risk registry — 13 categories, 8 statuses, 8 source types",
                  "5×5 impact × likelihood heat map — coloured by score range, clickable to filter",
                  "Treatment tracking — mitigate, accept, transfer, avoid, monitor; progress percentage",
                  "Periodic review log — outcome, score change, reviewer, previous/new status",
                  "Auto-linking to vendors, controls, findings, policies, frameworks, and evidence",
                  "AI Risk Officer™ — board narrative, executive summary, CAPA suggestions, NL chat",
                  "Risk scoring: pure deterministic engine — score = impact × likelihood × 4 (max 100)",
                ]}
                workflow={[
                  { title: "Create risk", body: <>Go to <Code>/risks/new</Code>. Set impact (1–5) and likelihood (1–5). Watch the real-time score and level update as you move the sliders. Choose category and treatment strategy.</> },
                  { title: "Add treatments", body: "On the risk detail page, add treatment actions with owners and due dates. Track progress to completion." },
                  { title: "Log a review", body: "Click Add Review. Record the outcome (no_change / score_updated / status_changed / closed) and any updated scores." },
                  { title: "Explore the heat map", body: <>The <Code>/risks</Code> dashboard shows a live 5×5 heat map. Click any cell to filter the risk register to that impact/likelihood combination.</> },
                  { title: "Generate AI report", body: <>Go to <Code>/risks/ai</Code> for the AI Executive Report — a board-ready narrative covering risk posture, top risks, and strategic recommendations.</> },
                ]}
              />

              <ModuleDoc
                id="control-center"
                icon="🎛️"
                name="Control Center™"
                route="/controls"
                tagline="Governance's central control layer. Maintain a control library independent of frameworks, compute Control Health™ scores, run and log tests, and get AI-powered gap detection."
                features={[
                  "Control library — create standalone controls or link to compliance frameworks",
                  "Control Health™ — 6-component 0–100 score: Evidence(30%) + Testing(25%) + Audit(15%) + Policy(10%) + Freshness(10%) + Risk Reduction(10%)",
                  "Health levels: Exceptional(95–100) · Healthy(90–94) · Strong(80–89) · Moderate(70–79) · Needs Attention(60–69) · Critical(0–59)",
                  "Test logging — date, method, result (passed/failed/partially_effective/exception/not_tested), evidence reference",
                  "Control types: preventive, detective, corrective, compensating, administrative, technical, physical, hybrid",
                  "Automation levels: manual, semi_automated, automated, ai_assisted",
                  "AI Advisor™ — executive summary, top 5 gap detection, live NL chat",
                ]}
                workflow={[
                  { title: "Add a control", body: <>Go to <Code>/controls/new</Code>. Set name, objective, type, frequency, automation level. Optionally link to a framework and vendor.</>},
                  { title: "Compute health", body: "On the control detail page, click Compute Health™. AUDT fetches all inputs and calculates the 6-component breakdown." },
                  { title: "Log a test", body: "Click Add Test on the control detail. Set test date, method, and result. The health score updates automatically." },
                  { title: "Review weakest controls", body: <>The <Code>/controls</Code> dashboard shows the bottom 5 controls by health score. Use these as your remediation priority list.</> },
                  { title: "AI gap detection", body: <>Go to <Code>/controls/ai</Code> and click Detect Gaps. AUDT surfaces the top 5 control gaps with recommended actions.</> },
                ]}
              />

              {/* --- Intelligence Layer --- */}
              <ModuleDoc
                id="trust-intelligence"
                icon="📊"
                name="Trust Intelligence™"
                route="/trust-intelligence"
                tagline="The executive command center. Aggregates all 5 governance modules into a single Organizational Trust Score™ with component breakdowns, vendor insights, risk posture, control health, compliance coverage, and an AI governance summary."
                features={[
                  "Organizational Trust Score™ — 5 components: Vendor Trust(25%) + Risk Posture(25%) + Control Health(20%) + Audit Readiness(15%) + Compliance Coverage(15%)",
                  "7-tab sub-nav: Overview, Vendor Trust, Risk Insights, Control Health, Compliance, Recommendations, Executive View",
                  "Trust Drivers™ and Trust Detractors™ — identifies what's pushing the score up or down",
                  "Recommendations Engine™ — prioritized actions with impact/effort labels and deep-links to source modules",
                  "Executive View — AI Governance Summary (cached 24h) and Governance Copilot™ multi-turn chat",
                  "Governance snapshot history — daily score persistence for trend analysis",
                ]}
                workflow={[
                  { title: "View org score", body: <>Navigate to <Code>/trust-intelligence</Code>. The Overview tab shows your Org Trust Score™ ring with all 5 component bars.</> },
                  { title: "Explore vendor trust", body: "Click Vendor Trust tab to see top 10 and bottom 10 trusted vendors, average trust, and the full scored list." },
                  { title: "Review recommendations", body: "Click Recommendations tab. AUDT shows prioritized actions ranked by impact and effort. Each recommendation deep-links to the relevant module." },
                  { title: "AI executive view", body: "Click Executive View tab. Request an AI Governance Summary — a board-ready narrative covering all 5 components (cached for 24 hours)." },
                  { title: "Snapshot the score", body: "Click 'Save Snapshot' to persist today's score to the governance history table. Trends and benchmarks are computed from these snapshots." },
                ]}
              />

              <ModuleDoc
                id="governance-trends"
                icon="📈"
                name="Governance Trends™"
                route="/trust-intelligence/trends"
                tagline="90-day governance trend tracking with sparkline grids, change percentages, and a detailed score history table."
                features={[
                  "6-metric sparkline grid — org trust, vendor trust, risk score, control health, compliance coverage, audit readiness",
                  "Change percentage vs period start — shows improvement or decline at a glance",
                  "30-row score history table with date, all component scores, and trend indicators",
                  "Configurable time ranges: 30 / 90 / 180 / 365 days",
                  "REST API: GET /api/v1/trends/overview?days=90",
                ]}
                workflow={[
                  { title: "Navigate to Trends", body: <>Go to <Code>/trust-intelligence/trends</Code> or click the Trends tab in Trust Intelligence™.</> },
                  { title: "Read sparklines", body: "Each of the 6 sparkline cards shows the metric over time. The badge shows change (green = improvement, red = decline)." },
                  { title: "Drill into history", body: "Scroll down to the 30-row score history table. Each row is one daily governance snapshot with all component scores." },
                  { title: "Change time range", body: "Use the period selector (30d / 90d / 180d / 365d) at the top of the page to zoom in or out." },
                ]}
              />

              <ModuleDoc
                id="continuous-monitoring"
                icon="🔔"
                name="Continuous Monitoring™"
                route="/trust-intelligence/monitoring"
                tagline="7 automated governance monitoring rules that continuously scan your posture and surface alerts requiring action."
                features={[
                  "7 monitoring rules: expired evidence · expiring evidence · critical control health · open critical risks · unresolved critical findings · overdue CAPAs · vendor trust critical",
                  "Alert strip — open/critical/high/resolved counts at a glance",
                  "Open alert list with severity, description, and Resolve buttons",
                  "Recently resolved alerts with resolution timestamp",
                  "Manual 'Run Monitoring™' button to trigger an immediate scan",
                  "REST API: GET /api/v1/monitoring/alerts?status=open&severity=critical",
                ]}
                workflow={[
                  { title: "View alerts", body: <>Go to <Code>/trust-intelligence/monitoring</Code>. The alert strip shows your current open / critical / high / resolved counts.</> },
                  { title: "Resolve an alert", body: "Click the Resolve button on any open alert. Add a resolution note. The alert moves to resolved status." },
                  { title: "Run a scan", body: "Click 'Run Monitoring™' to trigger all 7 rules immediately. New alerts are generated for any rule violations found." },
                  { title: "Set up a cron", body: <>Configure <Code>GET /api/cron/governance-snapshot</Code> in Vercel cron settings with your CRON_SECRET. This runs monitoring automatically each day.</> },
                ]}
              />

              <ModuleDoc
                id="trust-graph"
                icon="🕸️"
                name="Trust Graph™"
                route="/trust-intelligence/trust-graph"
                tagline="A force-directed governance knowledge graph connecting vendors, controls, risks, policies, findings, evidence, frameworks, and audits into a queryable dependency map."
                features={[
                  "Force-directed SVG visualization — zoom, pan, click nodes for detail",
                  "8 entity types: vendor, evidence, control, risk, audit, finding, policy, framework",
                  "15 relationship types tracked across all modules",
                  "Root Cause Analysis™ — trace upstream causes for any node",
                  "Impact Analysis™ — trace downstream effects from any node",
                  "Governance Reasoner™ — AI NL chat that reasons about graph dependencies and trust paths",
                  "Filter by entity type to focus on specific governance areas",
                ]}
                workflow={[
                  { title: "Build the graph", body: <>Navigate to <Code>/trust-intelligence/trust-graph</Code>. Click 'Rebuild Graph' to scan all modules and generate nodes and edges.</> },
                  { title: "Explore nodes", body: "Click any node to see its details: type, linked entities, and relationships. Use the entity filter chips to focus on vendors, risks, or controls." },
                  { title: "Root cause analysis", body: "Select any node (e.g. a critical risk) and click 'Root Cause Analysis™'. AUDT traces upstream dependencies — vendors, missing controls, policy gaps." },
                  { title: "Impact analysis", body: "Select a control or policy and click 'Impact Analysis™'. See all downstream entities that depend on it — helpful before making changes." },
                  { title: "Chat with the graph", body: "Use Governance Reasoner™ NL chat to ask questions like 'Which vendors have the most risk dependencies?' or 'What controls are shared across critical risks?'" },
                ]}
              />

              {/* --- Privacy & Legal --- */}
              <ModuleDoc
                id="policy-governance"
                icon="📋"
                name="Policy Governance™"
                tagline="Full policy lifecycle management — create, version, attest, and link policies to controls and frameworks. Never lose track of who approved what."
                features={[
                  "Policy registry with status: draft → under_review → approved → archived",
                  "Immutable version snapshots — every change creates a new version record",
                  "Policy attestations — assign employees to attest they have read and understood a policy",
                  "Attestation completion tracking with percentage progress",
                  "Policy reviews — periodic review scheduling with reviewer assignment",
                  "Link policies to controls, frameworks, and risks for full governance coverage",
                  "Policy Health™ score feeds into Control Health™ and Org Trust Score™",
                ]}
                workflow={[
                  { title: "Create policy", body: "Go to Compliance → Policies → New. Add title, content, owner, and set initial status to 'draft'." },
                  { title: "Submit for review", body: "Change status to 'under_review'. Assign a reviewer. AUDT logs the status change in audit logs." },
                  { title: "Approve and version", body: "Set status to 'approved'. AUDT creates an immutable version snapshot with timestamp and approver." },
                  { title: "Assign attestations", body: "Open the policy and assign team members to attest. Track completion percentage until all have confirmed." },
                  { title: "Schedule review", body: "Set a next review date. AUDT will surface this policy in the Continuous Monitoring™ alerts when the review date approaches." },
                ]}
              />

              <ModuleDoc
                id="dpdp-privacy"
                icon="🔒"
                name="DPDP Privacy™"
                tagline="India DPDP Act 2023 compliance module. Data inventory, consent management, data subject requests (DSR), retention policies, privacy impact assessments, and data transfer records."
                features={[
                  "Data asset inventory — classify assets by type, sensitivity, PII flags",
                  "Consent record management — purpose, validity, revocation tracking",
                  "Data subject requests (DSR) — access, correction, erasure, portability workflows",
                  "Retention policies — per-asset retention rules with scheduled deletion events",
                  "Privacy impact assessments (PIA) — structured assessment forms with risk scoring",
                  "Cross-border data transfer records — basis (adequacy/SCCs/consent) and destination country",
                  "Privacy Trust Score™ — feeds into Org Trust Score™ compliance component",
                  "Linked to DPDP regulation in Regulatory Intelligence™ for obligation tracking",
                ]}
                workflow={[
                  { title: "Inventory data assets", body: "Create data assets in DPDP Privacy™. Mark which contain PII (name, email, phone, Aadhaar, financial). Classify sensitivity level." },
                  { title: "Configure consent", body: "For each data asset that requires consent, create consent records with purpose, validity period, and collection method." },
                  { title: "Handle DSR requests", body: "When a data principal submits a request (access, erasure, correction, portability), create a DSR record. Track through to completion within the statutory timeline." },
                  { title: "Set retention policies", body: "Define per-asset retention periods. When a retention period expires, a retention event is logged and the data asset flagged for deletion review." },
                  { title: "Run privacy assessment", body: "For new data processing activities, run a Privacy Impact Assessment (PIA). Score risk level and document mitigation measures." },
                ]}
              />

              <ModuleDoc
                id="contract-governance"
                icon="📝"
                name="Contract Governance™"
                route="/contract-governance"
                tagline="Full contract lifecycle from drafting to expiry. Track clauses, obligations, renewal deadlines, and contract risk with a 6-component Contract Score™."
                features={[
                  "Contract library — type (vendor/customer/partner/employment/NDA/SLA/MSA/SOW/other), value, start/end dates, auto-renewal",
                  "Clause management — 9 clause types (liability, IP, termination, confidentiality, SLA, indemnification, payment, dispute, other) with risk level",
                  "Obligation tracker — org-wide view of all contractual obligations with due dates and status",
                  "Renewals dashboard — sorted by expiry, shows action deadline (30 days before expiry)",
                  "Contract Score™ — 6-component: clauseCoverage(25%) + obligationCompletion(20%) + renewalReadiness(15%) + riskExposure(20%) + policyAlignment(10%) + privacyCompliance(10%)",
                  "AI Contract Advisor™ — extract clauses, analyse risk, executive summary, NL chat",
                  "3 monitoring rules: contract_expiring · contract_renewal_due · contract_obligations_overdue",
                ]}
                workflow={[
                  { title: "Add contract", body: <>Go to <Code>/contract-governance/new</Code>. Set type, parties, value, start date, end date, and auto-renewal flag.</> },
                  { title: "Add clauses", body: "On the contract detail, add clauses by type (liability, IP, SLA, etc.). Set risk level (low/medium/high/critical) for each clause." },
                  { title: "Track obligations", body: "Add obligations with owner, due date, and status. AUDT surfaces overdue obligations in Continuous Monitoring™ alerts." },
                  { title: "Monitor renewals", body: <>Go to <Code>/contract-governance/renewals</Code>. Contracts expiring in the next 90 days appear at the top. Click to review and take action.</> },
                  { title: "AI analysis", body: <>Go to <Code>/contract-governance/ai</Code>. Ask the AI Contract Advisor™ to analyse a contract's risk clauses or suggest renewal terms.</> },
                ]}
              />

              {/* --- Operations --- */}
              <ModuleDoc
                id="issue-hub"
                icon="🔧"
                name="Issue & Remediation Hub™"
                route="/issue-hub"
                tagline="Central repository for all governance issues across every module. Task management, exception handling, escalation engine, SLA tracking, and AI remediation planning."
                features={[
                  "Issue registry — source module, severity (critical/high/medium/low), priority, status workflow",
                  "Auto-SLA by severity: Critical=7d, High=14d, Medium=30d, Low=90d",
                  "Task management — per-issue task tracking with owner and due dates",
                  "Exception management — request, approve, or reject governance exceptions",
                  "Escalation engine — escalate to owner/manager/exec/board",
                  "Comment threads and full change history per issue",
                  "AI Issue Generator™ — convert observations into structured issues",
                  "AI Remediation Planner™ — generate remediation tasks with owners and timelines",
                ]}
                workflow={[
                  { title: "Create issue", body: <>Go to <Code>/issue-hub/new</Code>. Set title, description, severity, priority, source module, and owner. SLA is set automatically.</> },
                  { title: "Add tasks", body: "On the issue detail, add sub-tasks with assignees and due dates. Track completion per task." },
                  { title: "Handle exceptions", body: <>Go to <Code>/issue-hub/exceptions</Code>. Review exception requests. Approve with a rationale or reject with a reason.</> },
                  { title: "Escalate", body: "On the issue detail, click Escalate. Choose the escalation level (owner/manager/exec/board). AUDT logs the escalation event." },
                  { title: "Use AI planner", body: "Click AI Remediation Planner™ on the issue detail. AUDT generates a prioritized set of tasks with suggested owners and timelines." },
                ]}
              />

              <ModuleDoc
                id="workflow-studio"
                icon="⚙️"
                name="Workflow Studio™"
                tagline="Governance automation engine. Build if-this-then-that workflows that trigger on governance events, route approvals, send notifications, and auto-create issues or tasks."
                features={[
                  "Workflow definitions — trigger (event-based or scheduled) + condition + action chain",
                  "10+ trigger types: vendor added, risk created, control health drops, CAPA overdue, contract expiring, etc.",
                  "Action types: create issue, assign task, send notification, update status, escalate, log evidence",
                  "Approval workflows — multi-step approval with assignee and timeout",
                  "Workflow run history — full execution log with step-by-step status",
                  "AI Workflow Generator™ — describe your process in plain English, AUDT generates the workflow definition",
                ]}
                workflow={[
                  { title: "Design workflow", body: "Go to Workflow Studio™. Click New Workflow. Give it a name, choose a trigger event, and define the condition (e.g. risk.severity = critical)." },
                  { title: "Add actions", body: "Build the action chain: e.g. Create Issue → Assign Task → Send Notification. Each action is configurable with dynamic field values." },
                  { title: "Test workflow", body: "Click Test Run. Choose a sample entity to run the workflow against. Review the simulated output before activating." },
                  { title: "Activate", body: "Toggle the workflow to Active. AUDT will now execute it automatically whenever the trigger condition is met." },
                  { title: "Monitor runs", body: "Go to the Runs tab to see every execution with step-by-step status, timestamps, and any error details." },
                ]}
              />

              {/* --- Trust Network --- */}
              <ModuleDoc
                id="trust-exchange"
                icon="🤝"
                name="Third-Party Risk Exchange™"
                route="/trust-exchange"
                tagline="Publish your governance posture, exchange trust documents with partners, issue and receive trust badges, and answer questionnaires once — share with many."
                features={[
                  "Trust Profile™ — public-facing trust passport with displayName, tagline, industry, visibility setting",
                  "Trust Evidence™ — share documents with configurable visibility (private/specific/network/public)",
                  "Document verification — AI or peer-verified; Verified badge on confirmed documents",
                  "Trust Badges™ — 8 badge types + custom; issue and revoke",
                  "Questionnaire Exchange™ — fill once, share many; completion % tracking",
                  "Vendor Trust Directory™ — searchable public directory of published profiles",
                  "AI Trust Analyst™ — cached trust summary, per-document analysis, questionnaire suggestions, NL chat",
                ]}
                workflow={[
                  { title: "Create trust profile", body: <>Go to <Code>/trust-exchange/my-profile</Code>. Set your display name, tagline, industry, and set visibility to 'public' to appear in the directory.</> },
                  { title: "Add trust documents", body: <>Go to <Code>/trust-exchange/documents</Code>. Upload ISO certificates, SOC 2 reports, penetration test summaries. Set visibility per document.</> },
                  { title: "Issue badges", body: <>Go to <Code>/trust-exchange/badges</Code>. Issue AUDT Verified™, ISO 27001 Certified, SOC 2 Type II, or custom badges to your profile.</> },
                  { title: "Answer questionnaire", body: "When a partner requests you fill a security questionnaire, answer it once in AUDT and share the completed response with multiple requestors." },
                  { title: "Browse directory", body: <>Go to <Code>/trust-exchange/directory</Code>. Search published profiles by industry, country, or minimum Trust Score™.</> },
                ]}
              />

              <ModuleDoc
                id="benchmarking"
                icon="📉"
                name="Governance Benchmarking™"
                route="/benchmarking"
                tagline="Compare your governance posture against industry peers across 10 categories. See your percentile rank and maturity level from Reactive to Trust Leader."
                features={[
                  "10 benchmark categories: Org Trust, Vendor Trust, Risk, Controls, Audit, Compliance, Privacy, Contract, Issues, Workflow",
                  "Percentile Engine™ — normal-distribution percentile vs industry baseline (10th–99th)",
                  "Maturity levels: Reactive → Aware → Developing → Established → Advanced → Trust Leader",
                  "Governance Rankings™ — Top 1% / Top 5% / Top 10% / Above Average / Average / At Risk labels",
                  "6-month monthly sparkline trend per category",
                  "Industry baselines: Technology, Financial Services, Healthcare, Manufacturing, Professional Services, All",
                  "AI Benchmark Analyst™ — executive report, industry insights, improvement planner, NL chat",
                ]}
                workflow={[
                  { title: "View benchmark dashboard", body: <>Navigate to <Code>/benchmarking</Code>. See your overall score, percentile, and maturity level at the top.</> },
                  { title: "Review 10 category scorecards", body: "Scroll through the category scorecards. Each shows your score, industry average, and percentile. Green = above average, red = below." },
                  { title: "Deep-dive into a category", body: "Click on any scorecard (Vendor Trust, Risk & Controls, Compliance, Rankings) for a detailed breakdown page." },
                  { title: "Check rankings", body: <>Go to <Code>/benchmarking/rankings</Code>. See your ranking label (Top 10%, Above Average, etc.) and maturity progress bar.</> },
                  { title: "AI improvement planner", body: <>Go to <Code>/benchmarking/ai</Code>. Request the Improvement Planner™ to get a prioritized list of actions to move up one maturity level.</> },
                ]}
              />

              <ModuleDoc
                id="integration-hub"
                icon="🔗"
                name="Integration Hub™"
                route="/integration-hub"
                tagline="Connect AUDT to your existing tech stack. 35+ connectors covering identity, cloud, security, source control, ITSM, endpoint, communication, HR, and storage."
                features={[
                  "35+ connectors in 11 categories — Entra ID, Okta, Google Workspace, AWS, GitHub, Jira, Slack, CrowdStrike, Microsoft Defender, and more",
                  "Sync Engine™ — incremental and full syncs with history, records synced, duration, and status",
                  "Evidence Collection™ — automatically collect compliance evidence from connected systems (MFA enforcement, encryption, branch protection)",
                  "Governance Events — risks, control failures, and misconfigurations generated from sync results",
                  "Connection Health™ — per-integration health dashboard",
                  "Webhook Engine™ — inbound + outbound webhooks with event routing",
                  "AES-256-GCM encrypted credential storage",
                  "AI Integration Advisor™ — health summary, connector recommendations, coverage gap analysis, NL chat",
                ]}
                workflow={[
                  { title: "Browse marketplace", body: <>Go to <Code>/integration-hub/marketplace</Code>. Browse 35+ connectors by category. Click a connector to see its capabilities.</> },
                  { title: "Connect a system", body: <>Go to <Code>/integration-hub/connections</Code>. Click Connect on your chosen connector. Enter API credentials (stored AES-256-GCM encrypted).</> },
                  { title: "Run a sync", body: "Click Sync on a connected integration. AUDT fetches data, collects evidence, and generates governance events." },
                  { title: "Review sync history", body: <>Go to <Code>/integration-hub/syncs</Code>. See all sync runs with records synced, duration, and status.</> },
                  { title: "Set up webhooks", body: <>Go to <Code>/integration-hub/webhooks</Code>. Configure outbound webhooks to push governance events to your SIEM or ticketing system.</> },
                ]}
              />

              <ModuleDoc
                id="trust-network"
                icon="🌐"
                name="Trust Network™"
                tagline="Public trust infrastructure that aggregates your Trust Exchange™, Benchmarking™, Integration Hub™, and Trust Intelligence™ data into a unified external trust presence with a 5-component Trust Network Reputation™ score."
                features={[
                  "Trust Network Reputation™ — 5-component 0–100: profile quality(25%) + benchmark percentile(20%) + automation coverage(20%) + org trust score(20%) + network activity(15%)",
                  "Public Trust Profile 2.0 — shows Trust Score™, Privacy Trust™, Governance Maturity™, Industry Ranking™, and Automation Transparency™",
                  "Governance Maturity™ — 6-level ladder (Reactive → Trust Leader)",
                  "Industry Ranking™ — percentile bar with Top Quartile badge",
                  "Org-to-org Trust Relationships™ — relationship registry with type and status",
                  "Trust Activity Feed™ — timeline of all trust network events",
                  "Network follow graph — follow/unfollow orgs, follower/following counts",
                  "AI Trust Network Advisor™ — executive summary, Network Improvement Plan™, NL chat",
                ]}
                workflow={[
                  { title: "Publish trust profile", body: "Ensure your Trust Exchange™ profile visibility is set to 'public'. Your profile will appear in the Trust Network directory." },
                  { title: "View reputation score", body: "Go to Trust Network™ dashboard. Your Trust Network Reputation™ score is computed from 5 components — review each to understand your standing." },
                  { title: "Build relationships", body: "Find partner organisations in the Network Directory. Send a relationship request. Once accepted, it appears in your Trust Relationships™ list." },
                  { title: "Monitor activity", body: "The Trust Activity Feed™ shows every trust event: profile views, badge issuance, questionnaire completions, and relationship changes." },
                  { title: "Improve with AI", body: "Go to the AI Advisor tab. Request the Network Improvement Plan™ — 4 specific actions to raise your reputation score." },
                ]}
              />

              {/* --- AI & Agents --- */}
              <ModuleDoc
                id="executive-reporting"
                icon="📣"
                name="Executive Reporting & Analytics™"
                route="/executive-reporting"
                tagline="Role-specific governance dashboards, board-quality reports, 30/90/180-day predictive forecasts, and executive scorecards. The board reporting layer for the entire AUDT Governance OS."
                features={[
                  "6 role dashboards: CEO, CRO, CISO, Compliance Officer, Board, Custom",
                  "10 live KPIs: org trust, vendors, risks, control health, findings, CAPAs, frameworks, alerts, issues, contracts",
                  "8 pre-built board report types: Board Governance, Risk Committee, Audit Committee, Privacy, Vendor, Contract, Executive, Trust Intelligence",
                  "Predictive Analytics™ — AI-powered forecasting at 30/90/180-day horizons",
                  "6 executive scorecards with On Track / Monitor / Attention status",
                  "Scheduled Reports™ — weekly/monthly/quarterly delivery",
                  "AI Executive Analyst™ — executive summary, board report generator, trend analyst, Governance Copilot™ NL chat",
                ]}
                workflow={[
                  { title: "Choose your dashboard", body: <>Go to <Code>/executive-reporting</Code>. Click your role dashboard (CEO, CISO, Board, etc.) to see the relevant KPI subset.</> },
                  { title: "Generate a board report", body: <>Go to <Code>/executive-reporting/board-reports</Code>. Choose a report type and click Generate. Download the board-ready document.</> },
                  { title: "Set up scheduled reports", body: <>Go to <Code>/executive-reporting/scheduled</Code>. Create a schedule (weekly/monthly/quarterly). AUDT generates and delivers reports automatically.</> },
                  { title: "View forecasts", body: <>Go to <Code>/executive-reporting/forecasts</Code>. See 30/90/180-day forecasts for org trust, control health, and open risks.</> },
                  { title: "AI executive summary", body: <>Go to <Code>/executive-reporting/ai</Code>. Click Generate Executive Summary for a board-ready narrative (cached 24h) covering all governance dimensions.</> },
                ]}
              />

              <ModuleDoc
                id="ai-governance"
                icon="🤖"
                name="AI Governance™"
                route="/ai-governance"
                tagline="Responsible AI governance — inventory your AI systems, track AI risks, implement AI controls, ensure compliance with ISO 42001, EU AI Act, NIST AI RMF, and DPDP, and manage AI incidents."
                features={[
                  "AI System Inventory™ — type, vendor, risk classification, deployment environment, approval status, AI Trust Score™",
                  "AI Trust Score™ — 6-component: Risk(25%) + Controls(25%) + Compliance(20%) + Monitoring(15%) + Vendor(10%) + Incidents(5%)",
                  "AI Risk Register™ — 13 risk categories: hallucination, bias, privacy leakage, prompt injection, data poisoning, model drift, regulatory risk, and more",
                  "AI Controls™ — 11 control categories: human oversight, output review, prompt logging, model approval, access control, red team testing, and more",
                  "AI Compliance™ — 6 frameworks with readiness scores: ISO 42001, NIST AI RMF, EU AI Act, OECD AI Principles, DPDP AI, Internal",
                  "AI Incident Tracker™ — full incident lifecycle: open → investigating → contained → resolved",
                  "AI Governance Copilot™ — governance summary, AI Risk Advisory™ (5 recommendations), compliance readiness analysis, multi-turn NL chat",
                ]}
                workflow={[
                  { title: "Register AI systems", body: <>Go to <Code>/ai-governance/inventory</Code>. Add each AI system you use — name, type (LLM/classifier/recommendation/vision/NLP/custom), vendor, and deployment environment.</> },
                  { title: "Assess AI risks", body: <>Go to <Code>/ai-governance/risks</Code>. For each AI system, identify risks (hallucination, bias, prompt injection, etc.) and set severity.</> },
                  { title: "Implement AI controls", body: <>Go to <Code>/ai-governance/controls</Code>. Add controls for each risk — human oversight, output review, prompt logging, red team testing.</> },
                  { title: "Check compliance", body: <>Go to <Code>/ai-governance/compliance</Code>. See readiness scores for ISO 42001, EU AI Act, NIST AI RMF, and other frameworks.</> },
                  { title: "Log incidents", body: <>Go to <Code>/ai-governance/incidents</Code>. Log any AI incidents with severity and root cause. Track through to resolution.</> },
                ]}
              />

              <ModuleDoc
                id="auditor-collab"
                icon="👥"
                name="Auditor Collaboration™"
                route="/auditor-collaboration"
                tagline="Secure collaboration workspace for external auditors, assessors, and legal counsel. Scoped audit rooms, evidence exchange, external findings, and AI audit readiness analysis."
                features={[
                  "Audit Room™ — scoped workspace per engagement (ISO 27001, SOC 2, DPDP, AI Governance, custom)",
                  "Evidence Exchange™ — auditors request evidence; internal team submits, accepts, or rejects",
                  "External Findings™ — auditors raise non-conformances, recommendations, opportunities",
                  "Assessment Projects™ — milestones, completion %, open findings, pending evidence",
                  "External user types: iso_auditor, soc_auditor, dpdp_assessor, security_assessor, privacy_consultant, ai_governance_reviewer, customer_reviewer",
                  "Auditor Organisation Registry — audit firms, law firms, consulting partners",
                  "AI Audit Advisor™ — readiness summary, evidence gap analysis (top 5 gaps), AI finding drafter, NL chat",
                ]}
                workflow={[
                  { title: "Create audit room", body: <>Go to <Code>/auditor-collaboration/rooms/new</Code>. Name the room, choose the audit type (ISO 27001, SOC 2, etc.), set start and end dates.</> },
                  { title: "Invite auditor", body: <>Go to <Code>/auditor-collaboration/users</Code>. Invite the external auditor by email, select their type (iso_auditor, soc_auditor, etc.), and assign them to the room.</> },
                  { title: "Respond to evidence requests", body: <>Go to <Code>/auditor-collaboration/evidence</Code>. Accept or reject each evidence request. Upload the requested document when accepting.</> },
                  { title: "Track findings", body: <>Go to <Code>/auditor-collaboration/findings</Code>. Review external findings. Update status as remediation progresses.</> },
                  { title: "AI readiness check", body: <>Go to <Code>/auditor-collaboration/ai</Code>. Get an AI audit readiness summary and top 5 evidence gaps before the audit begins.</> },
                ]}
              />

              <ModuleDoc
                id="trust-api"
                icon="🔌"
                name="Trust API Platform™"
                route="/trust-api"
                tagline="Transforms AUDT into Trust Infrastructure. 8 API products, webhooks, a developer portal, AI API builder, and usage analytics — enabling external systems to consume your governance posture as data."
                features={[
                  "8 API products: trust-score, vendor-trust, ai-trust, benchmarking, verification, trust-network, governance-insights, compliance-readiness",
                  "API Client Registry™ — register application/partner/internal clients",
                  "API Key Manager™ — issue tap_-prefixed keys (bcrypt hashed); reveal-once; per-key plan and permissions",
                  "Webhook Engine™ — subscribe to 9 trust events; live HTTP delivery with delivery log",
                  "API Analytics™ — 30-day daily call volume, top endpoints, success rate",
                  "Plans: Free(100/day) · Growth(10k/month) · Business(100k/month) · Enterprise(unlimited)",
                  "AI API Builder™ — generates per-product docs and code samples",
                  "6 public API endpoints for external consumption",
                ]}
                workflow={[
                  { title: "Register a client", body: <>Go to <Code>/trust-api/keys</Code>. Click New Client. Set client name, type (application/partner/internal), and contact email.</> },
                  { title: "Issue API key", body: "On the client detail, click Issue Key. Choose a plan and permissions (read_only or read_write). Copy the key — it is shown only once." },
                  { title: "Set up webhooks", body: <>Go to <Code>/trust-api/webhooks</Code>. Create a webhook endpoint URL. Choose which trust events to subscribe to (trust_score_updated, vendor_added, risk_created, etc.).</> },
                  { title: "View usage", body: <>Go to <Code>/trust-api/usage</Code>. See a 30-day daily call bar chart, top endpoints by call volume, and overall success rate.</> },
                  { title: "Generate API docs", body: <>Go to <Code>/trust-api/ai</Code>. Enter a product slug (e.g. trust-score). AI generates full documentation with cURL examples and SDK samples.</> },
                ]}
              />

              <ModuleDoc
                id="trust-verification"
                icon="✅"
                name="Trust Verification Authority™"
                route="/trust-verification"
                tagline="AUDT as a Trust Authority — verify, certify, publish, and validate governance posture. 10 built-in verification programs, auto-issued certificates with SHA-256 hashes, and a public verification registry."
                features={[
                  "10 built-in programs: AUDT Verified™, Trusted Vendor™, Privacy Ready™, AI Governed™, Risk Managed™, Enterprise Ready™, Audit Ready™, Compliance Ready™, DPDP Ready™, ISO Ready™",
                  "9-step workflow: Application → Eligibility → Evidence Review → Control Validation → Risk Review → Assessment → Decision → Certificate Issued → Registry Published",
                  "Readiness Score™ — 7-component: trustScore(25%) + controlHealth(20%) + complianceCoverage(15%) + riskPosture(15%) + privacyTrust(10%) + aiGovernance(10%) + monitoringHealth(5%)",
                  "Trust Certificates™ — cert number AUDT-YYYY-XXXXXX, SHA-256 hash, public verify URL",
                  "Public verify page at /verify/[id] — no auth required, shows Valid/Revoked/Expired",
                  "Trust Passport™ — aggregated view of all certs and badges",
                  "Continuous monitoring — 7 auto-suspension rules, expiring cert alerts",
                  "Renewal Management™ — due-date tracking with Start Renewal workflow",
                ]}
                workflow={[
                  { title: "Check readiness", body: <>Go to <Code>/trust-verification</Code>. Review your Readiness Score™. It shows how ready you are for each verification program.</> },
                  { title: "Apply for verification", body: <>Go to <Code>/trust-verification/applications/new</Code>. Choose a program (e.g. AUDT Verified™). The 9-step workflow begins.</> },
                  { title: "Submit evidence", body: "During the Evidence Review step, link your existing AUDT evidence (vendor docs, control tests, compliance records) to the application." },
                  { title: "Receive certificate", body: "Once approved, AUDT issues a certificate with a unique cert number and SHA-256 hash. It is published to the public Verification Registry™." },
                  { title: "Share the verify link", body: <>Share your <Code>/verify/[cert-id]</Code> link with customers, auditors, or regulators. They see a real-time Valid/Revoked/Expired status — no login needed.</> },
                ]}
              />

              <ModuleDoc
                id="continuous-compliance"
                icon="♻️"
                name="Continuous Compliance™"
                tagline="Always-on compliance automation — 21 prebuilt checks across AWS, Azure, GCP, GitHub, M365, Google Workspace, and Okta, plus access reviews, attestations, security training, and workflow automation."
                features={[
                  "21 prebuilt checks: AWS (5), Azure (3), GCP (2), GitHub (3), M365 (3), Google Workspace (2), Okta (2) — returned to all orgs",
                  "Check categories: aws, azure, gcp, github, m365, google_workspace, okta, network, endpoint, custom",
                  "Evidence Automation™ — check runs generate compliance evidence automatically",
                  "Access Review Manager™ — quarterly and privileged access certifications with per-user approve/revoke",
                  "Compliance Attestations™ — policy attestations and sign-offs with completion % tracking",
                  "Training Compliance™ — security awareness and privacy training campaigns",
                  "Compliance Health™ — 5-component 0–100: checkSuccess(30%) + signalReduction(25%) + evidence(20%) + training(15%) + accessReviews(10%)",
                  "Automation Rules™ — if-this-then-that governance automation triggers",
                ]}
                workflow={[
                  { title: "Run compliance checks", body: "Go to Continuous Compliance™ → Checks. All 21 built-in checks are available. Run them manually or they execute on schedule." },
                  { title: "Review compliance signals", body: "Go to Signals tab. See auto-generated signals from all modules — prioritized by severity. Each signal links back to its source." },
                  { title: "Launch access review", body: "Go to Access Reviews. Create a quarterly review for a system. Assign reviewers. Each reviewer certifies or revokes access per user." },
                  { title: "Run attestations", body: "Go to Attestations. Create a policy attestation campaign. Assign employees. Track completion percentage." },
                  { title: "Assign training", body: "Go to Training. Create a training campaign (security awareness, DPDP privacy). Assign to org members. Track completion." },
                ]}
              />

              <ModuleDoc
                id="governance-agents"
                icon="🧠"
                name="Governance Agent Framework™"
                route="/agents"
                tagline="AI agents that continuously monitor, reason, and act across the entire AUDT governance posture. From passive observation to prioritized recommendations with human-approved actions."
                features={[
                  "6 agent types: risk_monitor, vendor_watch, compliance_guardian, policy_enforcer, audit_prep, custom",
                  "Execution modes: scheduled, realtime, manual",
                  "Observations™ — governance signals with severity (critical/high/medium/low/info), source module, linked entity",
                  "Recommendations™ — prioritized AI actions with confidence 0–100, impact/effort labels, suggested steps",
                  "Agent Actions™ — human-approved action queue (no autonomous mutations)",
                  "Orchestration™ — multi-agent governance pipelines",
                  "Analytics™ — success rate, MTTR improvement, automation coverage %, acceptance rate",
                  "Governance Copilot™ — multi-turn NL chat: ask anything about your governance posture",
                ]}
                workflow={[
                  { title: "View agent registry", body: <>Go to <Code>/agents/registry</Code>. See all agents with type, execution mode, status, and metrics.</> },
                  { title: "Create custom agent", body: <>Go to <Code>/agents/studio</Code>. Define module scope, rules, thresholds, and schedule. Activate the agent.</> },
                  { title: "Review observations", body: <>Go to <Code>/agents/observations</Code>. See all governance signals generated by agents — filter by severity and module.</> },
                  { title: "Act on recommendations", body: <>Go to <Code>/agents/recommendations</Code>. Review AI-generated recommendations. Click Accept to create an action item or Dismiss to ignore.</> },
                  { title: "Approve agent actions", body: <>Go to <Code>/agents/actions</Code>. Review proposed actions in the approval queue. Approve or Reject each one — AUDT will not act without your approval.</> },
                ]}
              />

              <ModuleDoc
                id="regulatory-intel"
                icon="📰"
                name="Regulatory Intelligence™"
                route="/regulatory-intelligence"
                tagline="Always-current tracking of 18+ global regulations including DPDP, GDPR, HIPAA, EU AI Act, RBI CSF, and SEBI CSCRF. Monitor changes, extract obligations, assess impact, and forecast the compliance horizon."
                features={[
                  "18 built-in global regulations (organization_id = NULL — returned to all orgs)",
                  "India regulations: DPDP Act 2023, RBI CSF, SEBI CSCRF, IRDAI ICS",
                  "Global: GDPR, CCPA, HIPAA, ISO 27001/27701/42001, NIST CSF/AI RMF, PCI DSS, DORA, NIS2, SOX, EU AI Act, SOC 2 Type II",
                  "Change Monitor™ — track amendments with severity and status workflow (new→under_review→assessed→actioned→closed)",
                  "Obligations™ — extract and track compliance obligations (not_started→in_progress→implemented→validated)",
                  "Impact Assessments™ — per-change impact level and summary",
                  "Regulatory Readiness Score™ — (implemented + validated) / total obligations × 100",
                  "Compliance Horizon™ — AI 4-panel forecast: emerging risks, upcoming deadlines, global trends, recommended actions (cached 24h)",
                  "AI Regulatory Advisor™ — per-change analysis with keyChanges, requiredActions, impactAreas",
                ]}
                workflow={[
                  { title: "Browse regulation library", body: <>Go to <Code>/regulatory-intelligence/library</Code>. All 18 built-in regulations are shown. Add org-specific regulations using the New button.</> },
                  { title: "Monitor changes", body: <>Go to <Code>/regulatory-intelligence/changes</Code>. Log regulatory amendments with severity. Move through the status workflow as you assess and action each change.</> },
                  { title: "Extract obligations", body: <>Go to <Code>/regulatory-intelligence/obligations</Code>. Add obligations extracted from each regulation. Assign owners and due dates. Track implementation status.</> },
                  { title: "Run impact assessment", body: <>Go to <Code>/regulatory-intelligence/assessments</Code>. For each high/critical change, create an impact assessment documenting affected areas and required actions.</> },
                  { title: "View horizon forecast", body: <>Go to <Code>/regulatory-intelligence/horizon</Code>. See an AI-powered 4-panel forecast of what regulatory changes are coming and recommended actions.</> },
                ]}
              />

              <ModuleDoc
                id="asset-intelligence"
                icon="🗂️"
                name="Asset Intelligence™"
                route="/asset-intelligence"
                tagline="Enterprise Asset Graph and Trust Mapping Platform. Master inventory connecting every governance entity to enterprise assets — applications, databases, cloud resources, data assets, business processes, and AI systems."
                features={[
                  "12 asset types: application, database, api, server, cloud_resource, data_asset, business_process, ai_system, vendor_service, network_asset, endpoint, custom",
                  "Asset Trust Score™ — 6-component: security controls(25%) + compliance coverage(20%) + risk posture(20%) + data protection(15%) + operational health(10%) + monitoring coverage(10%)",
                  "Data Asset Catalog™ — PII and sensitive data tracking with DPDP regulation link",
                  "Asset Relationships™ — dependency graph: depends_on, contains, processes, hosts, accesses, connects_to, backs_up, manages, integrates_with",
                  "Asset Alerts™ — auto-generated for critical assets missing owner/risk-assessment/controls/classification",
                  "Junction tables linking assets to risks, controls, vendors, contracts, regulations, and AI systems",
                  "AI Asset Advisor™ — advisory summary, impact analyzer, dependency chain analyzer, NL chat",
                ]}
                workflow={[
                  { title: "Register assets", body: <>Go to <Code>/asset-intelligence/registry/new</Code>. Add each asset with type, criticality (critical/high/medium/low), environment, data classification, and PII flags.</> },
                  { title: "Map relationships", body: <>Go to <Code>/asset-intelligence/relationships</Code>. Define dependency relationships between assets. This builds your Asset Graph.</> },
                  { title: "Catalog data assets", body: <>Go to <Code>/asset-intelligence/data-assets</Code>. Review PII-flagged assets. Link them to DPDP obligations and retention policies.</> },
                  { title: "Resolve alerts", body: <>Go to <Code>/asset-intelligence/alerts</Code>. Review auto-generated alerts for critical assets. Click Resolve once the issue is addressed.</> },
                  { title: "AI impact analysis", body: <>Go to <Code>/asset-intelligence/ai</Code>. Ask the AI Asset Advisor™ to analyse the impact of decommissioning a critical asset or the dependency chain of your payment processing database.</> },
                ]}
              />

              <ModuleDoc
                id="security-center"
                icon="🛡"
                name="Security Command Center™"
                route="/security-center"
                tagline="Enterprise security platform for Banking, Fintech, Healthcare, and regulated industries. MFA enforcement, Enterprise SSO, session management, IP allow lists, evidence protection, AI prompt governance, and customer-managed encryption."
                features={[
                  "MFA Management™ — TOTP tracking, enforcement modes (optional/required_admins/required_all), remember-device policy",
                  "Enterprise SSO™ — Entra ID, Okta, Google Workspace, Ping Identity, SAML 2.0, OIDC; JIT provisioning",
                  "Session Management™ — active sessions per org with IP, browser, device, country; revoke individual or all",
                  "IP Allow Lists™ — CIDR-based IP rules scoped to all/login/api/compliance/vendors resources",
                  "Evidence Protection™ — expiring share links (view_only/download/api), watermarking, access log",
                  "AI Security Governance™ — prompt audit trail with sensitivity classification, PII detection, blocked prompt tracking",
                  "Customer Managed Encryption™ — AWS KMS, Azure Key Vault, Google KMS registry with audit log",
                  "Public Trust Center™ — per-org configurable trust center page",
                  "Continuous Vendor Monitoring™ — domain/SSL/reputation monitoring with alert lifecycle",
                  "Security Readiness Score™ — 5-component 0–100: mfaScore(30%) + ssoScore(20%) + ipScore(15%) + monitoring(20%) + aiScore(15%)",
                ]}
                workflow={[
                  { title: "Configure MFA enforcement", body: <>Go to <Code>/security-center</Code> → Identity. Set MFA enforcement mode to required_admins (recommended start) or required_all. Enable remember-device policy if needed.</> },
                  { title: "Connect SSO", body: "Go to Identity tab. Add your SSO provider (Entra ID, Okta, etc.). Configure JIT provisioning and default role for new SSO users." },
                  { title: "Set IP allow lists", body: "Go to Access tab. Add CIDR ranges for your office networks. Set the resource scope — restrict login-only or all API access." },
                  { title: "Review AI prompt logs", body: "Go to AI Security tab. Review the prompt audit trail. Filter by sensitivity level (high/medium) to find potentially risky AI interactions." },
                  { title: "Configure Trust Center", body: "Go to Trust Center tab. Set your title, description, security contact email, and choose which governance data to display publicly (Trust Score™, certs, documents)." },
                ]}
              />

            </section>{/* end module guides */}

            {/* ======================================================
                SCORING ENGINES
                ====================================================== */}
            <section className="docs-section" id="scoring-engines">
              <h2 className="docs-section-title">Scoring Engines</h2>
              <p className="docs-lead">AUDT uses pure deterministic scoring engines — no black boxes. Every score can be explained component by component.</p>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">Organizational Trust Score™</h3>
                <p className="docs-p">The top-level governance signal — a single 0–100 score representing your entire governance posture across 5 components.</p>
                <ScoreGrid items={[
                  { ring: "25%", label: "Vendor Trust", weight: "25" },
                  { ring: "25%", label: "Risk Posture", weight: "25" },
                  { ring: "20%", label: "Control Health", weight: "20" },
                  { ring: "15%", label: "Audit Readiness", weight: "15" },
                  { ring: "15%", label: "Compliance Coverage", weight: "15" },
                ]} />
                <p className="docs-p">Trust levels: Exceptional(95–100) · Trusted(90–94) · Strong(80–89) · Moderate(70–79) · Needs Attention(60–69) · High Concern(0–59)</p>
                <p className="docs-p">The score is computed by <Code>lib/services/org-trust-score.ts</Code> — a pure TypeScript function with zero DB calls. Snapshots are persisted daily to <Code>governance_snapshots</Code>.</p>
              </div>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">Vendor Trust Score™</h3>
                <p className="docs-p">Per-vendor governance signal — scored 0–100 across 6 components. Auto-refreshed on page load if older than 1 hour.</p>
                <ScoreGrid items={[
                  { ring: "25%", label: "Evidence", weight: "25" },
                  { ring: "20%", label: "Compliance", weight: "20" },
                  { ring: "20%", label: "Risk", weight: "20" },
                  { ring: "15%", label: "Assessment", weight: "15" },
                  { ring: "10%", label: "Operational", weight: "10" },
                  { ring: "10%", label: "Freshness", weight: "10" },
                ]} />
                <p className="docs-p">Pure engine: <Code>lib/services/trust-score.ts</Code>. History stored in <Code>vendor_trust_history</Code> — daily snapshots with all 6 component scores.</p>
              </div>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">Control Health™</h3>
                <p className="docs-p">Per-control governance signal — 6-component 0–100 score. Computed by <Code>lib/services/control-health.ts</Code>.</p>
                <ScoreGrid items={[
                  { ring: "30%", label: "Evidence", weight: "30" },
                  { ring: "25%", label: "Testing", weight: "25" },
                  { ring: "15%", label: "Audit", weight: "15" },
                  { ring: "10%", label: "Policy", weight: "10" },
                  { ring: "10%", label: "Freshness", weight: "10" },
                  { ring: "10%", label: "Risk Reduction", weight: "10" },
                ]} />
              </div>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">Risk Scoring</h3>
                <p className="docs-p">Pure deterministic 5×5 matrix. Score = impact × likelihood × 4 (max 100).</p>
                <div className="docs-table-wrap">
                  <table className="docs-table">
                    <thead><tr><th>Score range</th><th>Level</th><th>Color</th></tr></thead>
                    <tbody>
                      {[
                        ["80–100","Critical","Red"],
                        ["60–79","High","Orange"],
                        ["40–59","Medium","Amber"],
                        ["20–39","Low","Yellow"],
                        ["0–19","Minimal","Green"],
                      ].map(([r,l,c]) => <tr key={r}><td><Code>{r}</Code></td><td>{l}</td><td>{c}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">Score refresh rules</h3>
                <ul className="docs-ul">
                  <li><strong>Vendor Trust Score™</strong> — auto-recomputed on vendor detail page load if <Code>trust_score_at</Code> is null or older than 1 hour. Can be manually recalculated via the Recalculate button.</li>
                  <li><strong>Org Trust Score™</strong> — computed on every Trust Intelligence™ page load. Snapshots persisted via the Save Snapshot button or daily cron.</li>
                  <li><strong>Control Health™</strong> — recomputed when Compute Health™ button is clicked, or after a test is logged.</li>
                  <li><strong>Compliance Readiness</strong> — recomputed automatically after any control status or evidence mapping change (fire-and-forget, slight staleness acceptable).</li>
                </ul>
              </div>
            </section>

            {/* ======================================================
                ADMIN GUIDE
                ====================================================== */}
            <section className="docs-section" id="admin-guide">
              <h2 className="docs-section-title">Admin Guide</h2>
              <p className="docs-lead">Complete guide for AUDT administrators — organisation setup, team management, billing, security, and data governance.</p>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">Organisation setup</h3>
                <Steps items={[
                  { title: "Update org profile", body: <>Go to <Code>/settings/organization</Code>. Set legal name, industry, company size, website, country, state, and timezone.</> },
                  { title: "Configure branding", body: "Set primary colour, accent colour, report footer text, and email signature. These appear on generated PDFs and email notifications." },
                  { title: "Set data residency", body: <>Review Data Governance settings at <Code>/settings/data-governance</Code>. Confirm Mumbai (ap-south-1) residency and DPDP compliance badge.</> },
                ]} />
              </div>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">Team management</h3>
                <p className="docs-p">7 roles with granular permissions:</p>
                <div className="docs-table-wrap">
                  <table className="docs-table">
                    <thead><tr><th>Role</th><th>Access</th></tr></thead>
                    <tbody>
                      {[
                        ["owner","Full access — billing, team, all modules, ownership transfer"],
                        ["admin","All modules — cannot change billing plan or transfer ownership"],
                        ["member","Read + write all governance modules"],
                        ["viewer","Read-only across all modules"],
                        ["compliance_manager","Full access to compliance, policies, evidence modules"],
                        ["security_manager","Full access to risk, controls, security, audit modules"],
                        ["procurement_manager","Full access to vendor, contract, integration modules"],
                      ].map(([role, access]) => (
                        <tr key={role}>
                          <td><span className="docs-role-pill">{role}</span></td>
                          <td>{access}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Callout type="info">Invite team members at <Code>/settings/team</Code>. Enter email, select role, and optionally set department. The invite is sent via Resend (requires RESEND_API_KEY set in environment variables).</Callout>
              </div>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">Billing plans</h3>
                <div className="docs-table-wrap">
                  <table className="docs-table">
                    <thead><tr><th>Plan</th><th>Users</th><th>Vendors</th><th>Storage</th><th>Price</th></tr></thead>
                    <tbody>
                      {[
                        ["Starter","5","10","5 GB","Free"],
                        ["Growth","25","50","50 GB","$299/mo"],
                        ["Business","100","200","500 GB","$999/mo"],
                        ["Enterprise","Unlimited","Unlimited","Unlimited","Custom"],
                      ].map(([p,u,v,s,pr]) => <tr key={p}><td>{p}</td><td>{u}</td><td>{v}</td><td>{s}</td><td>{pr}</td></tr>)}
                    </tbody>
                  </table>
                </div>
                <p className="docs-p">Usage meters (current users / vendors / storage vs plan limits) are shown on <Code>/settings/billing</Code>. Contact sales for Enterprise pricing.</p>
              </div>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">API keys</h3>
                <p className="docs-p">Manage API keys for the AUDT REST API at <Code>/settings/api-keys</Code>.</p>
                <ul className="docs-ul">
                  <li><strong>Create</strong> — set a name, choose permissions (<Code>read_only</Code> or <Code>read_write</Code>). The full key is shown <strong>once</strong> — copy it immediately.</li>
                  <li><strong>Storage</strong> — keys are bcrypt-hashed. AUDT cannot retrieve the raw key after creation.</li>
                  <li><strong>Rotate</strong> — click Rotate to generate a new key. The old key is immediately invalidated.</li>
                  <li><strong>Revoke</strong> — click Revoke to permanently disable a key.</li>
                  <li><strong>Key prefix</strong> — displayed in the UI as an 8-character prefix for identification (e.g. <Code>ak_0919bb</Code>).</li>
                </ul>
              </div>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">Integrations</h3>
                <p className="docs-p">Connect external providers at <Code>/settings/integrations</Code>. 10 providers grouped by category:</p>
                <div className="docs-table-wrap">
                  <table className="docs-table">
                    <thead><tr><th>Category</th><th>Providers</th></tr></thead>
                    <tbody>
                      {[
                        ["Email","Resend, SendGrid, Mailgun"],
                        ["Communication","Slack, Microsoft Teams"],
                        ["Storage","AWS S3, Azure Blob, Google Drive, SharePoint, OneDrive"],
                      ].map(([c,p]) => <tr key={c}><td>{c}</td><td>{p}</td></tr>)}
                    </tbody>
                  </table>
                </div>
                <Callout type="warn">Integration credentials are stored AES-256-GCM encrypted using your <Code>ENCRYPTION_KEY</Code>. If this key is rotated, existing integration configs must be re-entered.</Callout>
              </div>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">Data governance</h3>
                <p className="docs-p">Go to <Code>/settings/data-governance</Code>:</p>
                <ul className="docs-ul">
                  <li><strong>Export tenant data</strong> — downloads a ZIP of CSVs: vendors, documents, assessments, team, audit logs</li>
                  <li><strong>Request data deletion</strong> — initiates a formal deletion workflow. Org and all associated data is scheduled for removal.</li>
                  <li><strong>Data residency</strong> — confirms Mumbai (ap-south-1) storage for DPDP compliance</li>
                  <li><strong>AI transparency</strong> — AUDT does not use your data to train AI models. Data sent to Gemini is for inference only.</li>
                </ul>
              </div>
            </section>

            {/* ======================================================
                REST API REFERENCE
                ====================================================== */}
            <section className="docs-section" id="api-reference">
              <h2 className="docs-section-title">REST API Reference</h2>
              <p className="docs-lead">AUDT exposes a versioned REST API at <Code>/api/v1/</Code> for programmatic access to your governance data.</p>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">Authentication</h3>
                <p className="docs-p">All <Code>/api/v1/</Code> endpoints require a Bearer token. Create API keys at <Code>/settings/api-keys</Code>.</p>
                <Pre label="HTTP header">
{`Authorization: Bearer <your-api-key>`}
                </Pre>
                <p className="docs-p">Read-only endpoints require <Code>read_only</Code> permission. Mutation endpoints (POST/PUT/DELETE) require <Code>read_write</Code> permission.</p>
              </div>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">Rate limits</h3>
                <div className="docs-table-wrap">
                  <table className="docs-table">
                    <thead><tr><th>Plan</th><th>Read limit</th><th>Write limit</th><th>Window</th></tr></thead>
                    <tbody>
                      {[
                        ["Starter","100 req","100 req","60 s"],
                        ["Growth","300 req","300 req","60 s"],
                        ["Business / Enterprise","1000 req","1000 req","60 s"],
                      ].map(([p,r,w,win]) => <tr key={p}><td>{p}</td><td>{r}</td><td>{w}</td><td>{win}</td></tr>)}
                    </tbody>
                  </table>
                </div>
                <p className="docs-p">Rate limit headers are returned on every response: <Code>X-RateLimit-Limit</Code>, <Code>X-RateLimit-Remaining</Code>, <Code>X-RateLimit-Reset</Code>.</p>
              </div>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">Key endpoints</h3>
                <div className="docs-table-wrap">
                  <table className="docs-table">
                    <thead><tr><th>Method</th><th>Path</th><th>Description</th><th>Permission</th></tr></thead>
                    <tbody>
                      {[
                        ["GET","/api/v1/vendors","Paginated vendor list","read_only"],
                        ["GET","/api/v1/vendors/[id]","Single vendor detail","read_only"],
                        ["GET","/api/v1/vendors/[id]/trust-score","Vendor Trust Score™ + history","read_only"],
                        ["GET","/api/v1/compliance/frameworks","All frameworks with readiness","read_only"],
                        ["GET","/api/v1/compliance/gaps","Open gaps (?severity=)","read_only"],
                        ["GET","/api/v1/audits","Paginated audit list","read_only"],
                        ["POST","/api/v1/audits","Create audit","read_write"],
                        ["GET","/api/v1/findings","Org-wide findings","read_only"],
                        ["POST","/api/v1/findings","Create finding","read_write"],
                        ["GET","/api/v1/risks","Paginated risk list","read_only"],
                        ["POST","/api/v1/risks","Create risk","read_write"],
                        ["GET","/api/v1/risks/[id]","Risk + treatments + reviews","read_only"],
                        ["GET","/api/v1/trust-intelligence/overview","Full dashboard data","read_only"],
                        ["GET","/api/v1/trust-intelligence/org-score","Org Trust Score™","read_only"],
                        ["GET","/api/v1/trust-intelligence/recommendations","Prioritized actions","read_only"],
                        ["GET","/api/v1/contracts","Paginated contracts","read_only"],
                        ["GET","/api/v1/issues","Paginated issues","read_only"],
                        ["POST","/api/v1/issues","Create issue","read_write"],
                        ["GET","/api/v1/regulations","Paginated regulations","read_only"],
                        ["GET","/api/v1/regulatory-changes","Regulatory changes","read_only"],
                        ["GET","/api/v1/obligations","Compliance obligations","read_only"],
                        ["GET","/api/v1/assets","Asset registry","read_only"],
                        ["POST","/api/v1/assets","Create asset","read_write"],
                        ["GET","/api/v1/audit-logs","Event stream","read_only"],
                        ["GET","/api/v1/monitoring/alerts","Governance alerts","read_only"],
                        ["GET","/api/v1/trends/overview","Governance trend history","read_only"],
                        ["GET","/api/v1/registry","Public verification registry","public"],
                        ["GET","/api/v1/verification-programs","Verification programs","public"],
                      ].map(([method, path, desc, perm]) => (
                        <tr key={path + method}>
                          <td><Method m={method as "GET"|"POST"|"PUT"|"DELETE"} /></td>
                          <td><Code>{path}</Code></td>
                          <td>{desc}</td>
                          <td><Badge color={perm === "public" ? "green" : perm === "read_write" ? "amber" : "blue"}>{perm}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">Example: Get vendors</h3>
                <Pre label="curl">
{`curl -H "Authorization: Bearer <key>" \\
  "https://audt.tech/api/v1/vendors?page=1&pageSize=20"`}
                </Pre>
                <Pre label="response (JSON)">
{`{
  "data": [
    {
      "id": "uuid",
      "name": "Acme Corp",
      "category": "SaaS Provider",
      "riskLevel": "medium",
      "trustScore": 82,
      "trustLevel": "Strong",
      "complianceScore": 78
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 47 }
}`}
                </Pre>
              </div>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">Example: Create a risk</h3>
                <Pre label="curl">
{`curl -X POST \\
  -H "Authorization: Bearer <key>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Data breach via third-party API",
    "category": "cyber_security",
    "impact": 4,
    "likelihood": 3,
    "treatmentStrategy": "mitigate",
    "description": "External API integration may expose PII"
  }' \\
  "https://audt.tech/api/v1/risks"`}
                </Pre>
              </div>

              <div className="docs-subsection">
                <h3 className="docs-subsection-title">Example: Get Org Trust Score™</h3>
                <Pre label="curl">
{`curl -H "Authorization: Bearer <key>" \\
  "https://audt.tech/api/v1/trust-intelligence/org-score"`}
                </Pre>
                <Pre label="response (JSON)">
{`{
  "data": {
    "score": 79,
    "level": "Moderate",
    "components": {
      "vendorTrust":   { "score": 82, "weight": 0.25 },
      "riskPosture":   { "score": 71, "weight": 0.25 },
      "controlHealth": { "score": 85, "weight": 0.20 },
      "auditReadiness":{ "score": 74, "weight": 0.15 },
      "compliance":    { "score": 77, "weight": 0.15 }
    }
  }
}`}
                </Pre>
              </div>
            </section>

            {/* ======================================================
                FAQ
                ====================================================== */}
            <section className="docs-section" id="faq">
              <h2 className="docs-section-title">FAQ</h2>

              <FaqItem
                q="How long does AUDT take to set up?"
                a="Initial setup takes under 30 minutes. The 3-step onboarding wizard guides you through org configuration, goals, and team invites. Seed data can be loaded in minutes for evaluation. Most organisations are fully operational within 1–2 days including vendor data entry and framework setup."
              />
              <FaqItem
                q="Is my data stored in India?"
                a={<>Yes. AUDT runs on Supabase Mumbai (ap-south-1) and Vercel Mumbai (bom1) — full India data residency. This satisfies DPDP Act 2023 requirements for data localisation. The Data Governance page at <Code>/settings/data-governance</Code> shows your residency status and a DPDP compliance badge.</>}
              />
              <FaqItem
                q="Which AI model does AUDT use?"
                a="AUDT uses Google Gemini 2.5 Flash for all AI features — narrative generation, gap detection, executive summaries, NL chat, document extraction, and risk analysis. Your data is sent to Gemini for inference only and is never used to train Google's models."
              />
              <FaqItem
                q="Is AUDT DPDP Act 2023 compliant?"
                a="AUDT is built for DPDP compliance. The DPDP Privacy™ module covers data inventory, consent management, DSR workflows, retention policies, and PIAs. The DPDP compliance framework is pre-loaded with 18 controls. Data residency is in Mumbai. The platform itself is designed as a compliance tool for helping organisations achieve DPDP readiness."
              />
              <FaqItem
                q="What integrations are supported?"
                a="AUDT Integration Hub™ supports 35+ connectors: Entra ID, Okta, Google Workspace, AWS, Azure, GCP, GitHub, GitLab, Jira, ServiceNow, Slack, Teams, CrowdStrike, Microsoft Defender, Sophos, Qualys, BambooHR, Workday, SharePoint, OneDrive, and more. Settings → Integrations supports 10 providers for email, communication, and storage."
              />
              <FaqItem
                q="Can multiple organisations share one AUDT account?"
                a="AUDT is a multi-tenant platform. Each organisation is a separate, fully isolated tenant with its own data, users, and settings. Row-Level Security (RLS) on all 259 database tables ensures strict data isolation. Users can be members of multiple organisations — the org switcher in Settings handles this."
              />
              <FaqItem
                q="What are the API rate limits?"
                a={<>Rate limits depend on your plan: Starter (100 req/60s), Growth (300 req/60s), Business/Enterprise (1000 req/60s). Rate limit headers are returned on every API response. The Trust API Platform™ has separate limits: Free (100/day), Growth (10k/month), Business (100k/month), Enterprise (unlimited).</>}
              />
              <FaqItem
                q="How are integration credentials stored?"
                a={<>All integration credentials (API keys, webhook secrets, passwords) are encrypted at rest using AES-256-GCM before being stored in the database. The encryption key (<Code>ENCRYPTION_KEY</Code>) is a 32-byte secret stored as an environment variable — never in the database. This means AUDT staff cannot view your credentials even with direct database access.</>}
              />
              <FaqItem
                q="What are the 7 RBAC roles?"
                a="Owner (full access including billing/ownership transfer), Admin (all modules, no billing/ownership), Member (read+write all governance modules), Viewer (read-only), Compliance Manager (compliance/policies/evidence), Security Manager (risk/controls/security/audit), Procurement Manager (vendor/contract/integrations)."
              />
              <FaqItem
                q="How does the Trust Score™ update?"
                a="Vendor Trust Score™ is auto-recomputed on the vendor detail page if the score is null or older than 1 hour. It can be manually recalculated at any time via the Recalculate button. The Org Trust Score™ is computed on every Trust Intelligence™ page load and optionally persisted to governance history. Scores are never stale by more than 1 hour for actively-viewed vendors."
              />
              <FaqItem
                q="Can I export all my data?"
                a={<>Yes. Go to <Code>/settings/data-governance</Code> and click Export Tenant Data. AUDT generates a ZIP file containing CSVs of all your vendors, documents, assessments, team members, and audit logs. You can also use the REST API to export specific datasets programmatically.</>}
              />
              <FaqItem
                q="Does AUDT support SOC 2, ISO 27001, HIPAA, and PCI DSS?"
                a="Yes. AUDT ships with pre-loaded frameworks for all four: ISO 27001 (93 controls), SOC 2 (33 controls), HIPAA (18 controls), PCI DSS (12 controls), plus DPDP (18 controls). Evidence Vault™ maps your evidence to controls, tracks readiness scores, and generates board-ready PDF reports for each framework."
              />
              <FaqItem
                q="What happens to my data if I cancel?"
                a={<>You can export all your data at any time from <Code>/settings/data-governance</Code>. After cancellation, your data is retained for 30 days before scheduled deletion. You can also submit a formal Data Deletion Request from the same page to trigger immediate deletion.</>}
              />
            </section>

            {/* ======================================================
                GLOSSARY
                ====================================================== */}
            <section className="docs-section" id="glossary">
              <h2 className="docs-section-title">Glossary &amp; Terminology</h2>
              <p className="docs-p">AUDT-specific terms and product names.</p>
              <div className="docs-card" style={{ padding: "4px 22px" }}>
                {[
                  ["AUDT","AI-Native Trust, Risk & Compliance Platform. The Governance OS for modern organisations. Tagline: 'Governance Built on Proof.'"],
                  ["Vendor Hub™","AUDT's name for the vendor governance module. Covers vendor registry, document management, security assessments, Trust Score™, and vendor portal."],
                  ["Evidence Vault™","AUDT's compliance management module. Covers frameworks (ISO 27001, SOC 2, DPDP, PCI DSS, HIPAA), controls, evidence library, policies, gap analysis, and readiness scoring. Route: /compliance."],
                  ["Risk Lens™","The risk management module. Covers risk register, 5×5 heat map, treatments, reviews, and AI Risk Officer™."],
                  ["Control Center™","The controls governance module. Covers control library, Control Health™ scoring, test logging, and AI gap detection."],
                  ["Trust Score™","Per-vendor 6-component trust signal scored 0–100. Components: Evidence(25%), Compliance(20%), Risk(20%), Assessment(15%), Operational(10%), Freshness(10%). Levels: Exceptional · Trusted · Strong · Moderate · Needs Attention · High Concern."],
                  ["Organizational Trust Score™","Top-level 5-component governance score for the entire organisation. Computed by Trust Intelligence™. Components: Vendor Trust(25%), Risk Posture(25%), Control Health(20%), Audit Readiness(15%), Compliance Coverage(15%)."],
                  ["Control Health™","Per-control 6-component health score (0–100). Components: Evidence(30%), Testing(25%), Audit(15%), Policy(10%), Freshness(10%), Risk Reduction(10%)."],
                  ["Trust Intelligence™","The executive intelligence layer — aggregates all modules into the Organizational Trust Score™ with a 9-tab command center at /trust-intelligence."],
                  ["Trust Graph™","Force-directed knowledge graph connecting all governance entities. Enables Root Cause Analysis™ and Impact Analysis™ across vendors, risks, controls, policies, frameworks, findings, evidence, and audits."],
                  ["Governance Copilot™","AUDT's AI assistant branding. Used in Trust Intelligence™ Executive View and Governance Agent Framework™ Copilot tab for multi-turn NL governance chat."],
                  ["Trust Verification Authority™ (TVA)","AUDT module that certifies governance posture via verification programs (AUDT Verified™, Privacy Ready™, Enterprise Ready™, etc.). Issues SHA-256-hashed certificates verifiable at /verify/[id]."],
                  ["Trust API Platform™ (TAP)","API-as-a-product layer. 8 trust API products, API client registry, bcrypt-hashed keys (tap_ prefix), webhook engine, and usage analytics."],
                  ["Governance Agent Framework™","AI agent platform. Agents continuously monitor governance posture, generate observations (signals), produce recommendations (prioritized actions), and propose actions (requiring human approval)."],
                  ["DomainError","AUDT's internal error type thrown by services for validation failures. Actions catch DomainError and return { error: string } to the UI."],
                  ["Governance OS","AUDT's category positioning — not a point solution but a complete operating system for organisational governance, trust, risk, and compliance."],
                  ["DPDP","Digital Personal Data Protection Act 2023 — India's data protection law. AUDT ships with a dedicated DPDP Privacy™ module and 18-control DPDP compliance framework."],
                  ["RLS","Row-Level Security — PostgreSQL feature enforced on all 259 AUDT tables. Ensures users can only see data belonging to their organisation. Enforced at the database level, not application level."],
                ].map(([term, def], i) => (
                  <div className="docs-glossary-item" key={i}>
                    <div className="docs-glossary-term">{term}</div>
                    <div className="docs-glossary-def">{def}</div>
                  </div>
                ))}
              </div>
            </section>

          </div>{/* end docs-content */}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 39, background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
