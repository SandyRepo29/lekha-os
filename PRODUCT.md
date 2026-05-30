# Lekha OS — Product Feature List

**The Trust, Governance & Compliance Operating System for Indian Businesses.**

Version: 0.2.0 · Last updated: May 2026  
Live: https://lekha-os.vercel.app

---

## Platform Overview

Lekha OS is a multi-tenant, AI-native GRC (Governance, Risk & Compliance) operating system built specifically for Indian businesses. It replaces spreadsheets, emails and disconnected point solutions with a single platform that manages vendors, compliance, audits, risk and governance.

**Positioning:** Category-defining OS, not a point solution.  
**First module:** Vendor Governance — **commercially launch-ready.**  
**Target:** SaaS, Fintech, Healthcare, Manufacturing, IT Services.

---

## Module Status

| Module | Status | Description |
|---|---|---|
| **Vendor Governance** | ✅ Launch-Ready | Complete vendor registry, document tracking, AI extraction, risk, compliance |
| **Compliance Management** | 🔜 Next | Controls, policies, evidence, framework compliance scores |
| **Audit Workspace** | 🔜 Roadmap | Evidence repository, audit requests, findings tracking |
| **DPDP Privacy** | 🔜 Roadmap | India's DPDP Act compliance |
| **Risk Management** | 🔜 Roadmap | Risk register, assessments, heat maps, remediation |
| **Board Governance** | 🔵 Future | Board meetings, resolutions, governance calendar |
| **Trust Center** | 🔵 Future | Public-facing compliance and trust documentation |

---

## Module 1 — Vendor Governance ✅ Launch-Ready

### Vendor Registry

- **Add vendor** — name, category (20+ grouped Indian B2B categories), risk level, contact email
- **Edit vendor** — update all fields including risk level reassignment
- **Delete vendor** — cascades documents, purges storage files atomically
- **Vendor status** — inline dropdown: Active / Pending / Inactive (audited)
- **Vendor notes** — free-text internal notes with inline edit (audited)
- **Vendor owner** — assign internal owner: name, email, department (accountability)
- **Vendor type template** — assign compliance template (Cloud, SaaS, IT Services, Finance, Staffing, Legal, General)
- **Created date** — "Added on [date]" on vendor detail

### Search & Filter

- **Topbar search** — type + Enter → navigates to `/vendors?q=term`
- **Name/category filter** — client-side search on vendor list
- **Risk filter** — low / medium / high / critical
- **Status filter** — active / pending / inactive
- **Expiring filter** — ⏰ chip shows only vendors with expiring documents
- **URL-driven filters** — dashboard stat cards link to pre-filtered lists (`?expiring=1`, `?risk=high`)
- **Pagination** — 20/page, URL `?page=N`
- **Results count** — shown when filters active

### Compliance Scoring

- **Document-driven score** — 0–100: risk base + valid docs (×5, max +40) − expiring (×10) − expired (×20)
- **Consistent from creation** — starting score matches formula with 0 docs (no drop on first upload)
- **Real-time recompute** — after every document upload, edit, or delete
- **Score breakdown panel** — shows current / max achievable / checklist of what's needed
- **Score progress bar** — colour-coded in vendor list (green ≥80, indigo ≥60, amber ≥40, red <40)

### Vendor Type Templates & Compliance Checklist

- **7 default templates** — Cloud Provider, SaaS Vendor, IT Services, Finance Vendor, Staffing/Outsourcing, Legal/Consulting, General Vendor
- **Required + optional documents** per template (e.g. Cloud: ISO 27001, SOC 2, GST, MSA, DPA, Cyber Insurance)
- **Template selector** — on add/edit vendor forms
- **Compliance checklist panel** — on vendor detail: ✅ uploaded + valid / ⚠ expiring / ❌ expired / ○ missing
- **Completion score** — 0–100% (required docs only)

### Document Management

- **Upload** — PDF, PNG, JPG, JPEG, WEBP, TXT
- **25+ document types** — Security, India Compliance, Quality, Contracts, Insurance; "Other / Custom" fallback
- **AI extraction** — Gemini 2.5 Flash: document type, issuer, issue date, expiry date, summary
- **Status tracking** — valid / expiring (≤30 days) / expired — auto-set from expiry
- **Manual edit** — edit type, issued date, expiry via modal (if AI got it wrong)
- **Re-run extraction** — resubmit to Gemini with one click
- **Download** — signed URLs (1hr expiry)
- **Delete** — removes file from storage + DB row + audit entry, rescores vendor

### Document Request Workflow

- **Create requests** — document type, message, due date, priority (low/medium/high)
- **Status flow** — Requested → Submitted → Approved / Rejected / Expired
- **Inline management** — create + update status from vendor detail page
- **Audit logged** — every status change recorded

### Vendor Portal (Self-Service)

- **Magic link** — generate a secure 30-day link per vendor (no account required)
- **Vendor capabilities** — upload documents, view pending requests, see expiring docs
- **Portal route** — `/portal/[token]` — standalone, no Supabase auth, token-validated
- **Copy link** — one click to copy and share with the vendor

### AI Capabilities

- **Document extraction** — Gemini 2.5 Flash structured extraction (dates normalized to ISO 8601)
- **AI Vendor Summary** — Gemini-generated 3–5 sentence executive summary per vendor (from metadata, docs, score, notes). Cached in DB. Regeneratable.
- **AI Insights** — Data-driven dashboard insight cards (expiry warnings, high-risk, score health)
- **Graceful degradation** — extraction failures never block upload; can manually edit or re-run

### Risk Engine

- **Computed risk score** — 0–100 numeric risk from: risk level base + compliance score + expired docs + expiring docs + no documents + assessment score + no owner assigned
- **Risk level** — low / medium / high / critical (derived from score)
- **Risk panel** — on vendor detail with score bar + labelled factors
- **Dashboard linkage** — "High Risk" stat card links to filtered vendor list

### Security Assessments

- **17 standard questions** across 6 categories: Access Management, Encryption, Incident Response, Backup & Recovery, Vulnerability Management, Data Protection
- **Responses** — Yes / No / Partial / N/A (weighted scoring)
- **Assessment score** — 0–100 (weighted: yes=1, partial=0.5, no=0, na=skip)
- **Assessment page** — `/vendors/[id]/assessment` with full questionnaire form
- **History** — previous completed assessments shown; scores feed into risk engine

### Vendor Reviews

- **Review types** — Annual, Quarterly, Security, Compliance
- **Status flow** — Pending → Approved / Rejected / Needs Follow-Up
- **Log reviews** — with summary notes and next review date
- **Full history** — all reviews stored and displayed

### Dashboard

- **Compliance score ring** — org-wide average with status label (Healthy/Improving/Needs Attention/Critical)
- **4 stat cards** — Vendors Tracked, Documents Managed, Expiring Soon, High Risk — colour-coded, clickable
- **AI Insights panel** — data-driven cards (expiry warnings, risk flags, score health)
- **Recent vendors** — last 5, with score bars + risk badges
- **Activity feed** — org-wide recent audit log (last 10 actions, human-readable)

### Reports & Export

- **Vendor Compliance PDF** — all vendors, summary stats, full table (branded)
- **Expiry Report PDF** — documents expiring in 60 days, days-left column (branded)
- **Audit Package PDF** — per-vendor: summary, documents, checklist, assessment, review history (branded)
- **CSV export** — full vendor list with all fields
- **Download buttons** — from vendors page (Compliance PDF, Expiry PDF, CSV) and vendor detail (Audit Package)

### Audit Log

Every meaningful action is recorded:

| Action | Trigger |
|---|---|
| `organization.created` | Workspace creation |
| `organization.renamed` | Org name changed |
| `vendor.created/updated/deleted` | Vendor CRUD |
| `vendor.status_changed` | Status toggled (from→to) |
| `vendor.notes_updated` | Notes saved |
| `document.uploaded/deleted` | Document CRUD |
| `document_request.created/status_changed` | Request workflow |
| `assessment.created/completed` | Assessment lifecycle |
| `review.created/status_changed` | Review lifecycle |
| `team.member_invited/role_changed/deactivated/reactivated` | Team management |
| `portal.link_generated` | Vendor portal link created |

---

## Platform Features

### Authentication & Identity

- **Signup** — email + password → onboarding (create workspace) → dashboard
- **Login** — email + password with redirect preservation
- **Onboarding** — new users without an org are routed to `/onboarding` to create their workspace
- **Sign out** — from Settings page

### Multi-Tenancy & Security

- **Organization-scoped data** — every row scoped to an org
- **Row-Level Security** — Postgres RLS enforced at DB layer; helpers `is_org_member()` / `has_org_role()`
- **Roles** — Owner, Admin, Member, Viewer (enforced in app + RLS)
- **Storage RLS** — vendor documents bucket scoped by org ID path

### Team Management

- **Invite members** — by email (Supabase inviteUserByEmail sends invite email)
- **Manage roles** — Owner / Admin / Member / Viewer; inline dropdown
- **Deactivate / reactivate** — soft deactivation (is_active flag)
- **Role permissions** — Owner: full access; Admin: manage vendors+team; Member: add/manage vendors; Viewer: read-only
- **Team page** — `/settings/team`

### Settings & Profile

- **Profile** — edit full name; shown as avatar initial in topbar
- **Organization** — edit org name (owner/admin only); view slug, member count, role
- **Sign out** — dedicated Account section
- **Access** — from sidebar "Settings" link or topbar avatar click

### App Shell

- **Sidebar** — all modules (Coming Soon labels for unbuilt), Settings, Team links, Lekha AI panel
- **Topbar** — functional search (Enter to search vendors), org name, avatar → settings
- **Demo mode** — amber banner + illustrative data when Supabase not configured

### Infrastructure

- **Framework** — Next.js 16 (App Router) + TypeScript, all protected pages `force-dynamic`
- **Database** — Supabase Postgres, Mumbai ap-south-1 — India data residency
- **ORM** — Drizzle with lazy DB init (prevents Vercel build failures)
- **Connection pooling** — Supavisor transaction pooler (port 6543)
- **Storage** — Supabase Storage, private bucket, org-scoped RLS
- **AI** — Google Gemini 2.5 Flash (`@google/genai`)
- **PDF** — `@react-pdf/renderer`
- **Architecture** — layered modular monolith: UI → server actions → services → repositories → Postgres

### Design System

- **Theme** — dark glassmorphism, near-black background
- **Palette** — deep indigo / purple / electric blue
- **Typography** — Inter (body) + Sora (display/headings)
- **Components** — Button, Card, Badge, Input, Select (custom dark-themed), ScoreRing
- **Responsive** — mobile-first; sidebar hidden on small screens
- **Reduced motion** — respects `prefers-reduced-motion`

---

## Investor Landing Page

- Hero with animated platform mockup (compliance ring, vendor risk, AI copilot)
- Social proof, problem section, vision platform map, 6 platform modules
- AI-Native section, product demo mockups, Why India, Market Opportunity
- Founder section, 2026–2030 roadmap timeline, final CTA
- Scroll animations, hover effects, animated counters, fully responsive

---

## Roadmap

### 2026 — Vendor Governance ✅ Complete
Full vendor registry, document management, AI extraction, compliance scoring, risk engine, security assessments, reviews, audit packages, team management, vendor portal.

### 2027 — Compliance Management
Control frameworks (ISO 27001, SOC 2, India-specific), policies library, evidence collection, compliance score by framework, compliance calendar.

### 2028 — DPDP & Audit Workspace
India's Digital Personal Data Protection Act compliance module. Audit request management, evidence repository, findings tracking, auditor collaboration.

### 2029 — Risk Management
Risk register with scoring, risk assessments, treatment plans, remediation tracking, risk heat maps, risk appetite configuration.

### 2030 — India's Governance OS
Board Governance, Trust Center, full platform integration — the definitive GRC OS for Indian enterprise.

---

## Parked / Not Yet Built

**Email Notification Engine** (parked — needs email provider decision: Resend recommended)
- Document expiry alerts: 90/60/30/15/7 days before + on expiry
- Weekly compliance digest: expiring docs, high-risk vendors, missing documents
- Delivery: email → future: Slack, Teams, WhatsApp
- Infrastructure needed: Vercel Cron Jobs, `notification_preferences` + `notification_history` tables

---

## Launch Criteria Status (from PRODUCT VENDOR GAPS.md)

| Criterion | Status |
|---|---|
| ✅ Email Notifications | Parked (not blocking) |
| ✅ Vendor Owner Assignment | Complete |
| ✅ Vendor Type Templates | Complete |
| ✅ Compliance Checklist | Complete |
| ✅ PDF Reports | Complete |
| ✅ Vendor Portal | Complete |
| ✅ Document Requests | Complete |
| ✅ AI Vendor Summary | Complete |

---

*Lekha OS — Trust. Governance. Compliance.*  
*Built for India 🇮🇳*
