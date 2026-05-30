# Lekha OS — Product Feature List

**The Trust, Governance & Compliance Operating System for Indian Businesses.**

Version: 0.1.0 · Last updated: May 2026

---

## Platform Overview

Lekha OS is a multi-tenant, AI-native GRC (Governance, Risk & Compliance) operating system built specifically for Indian businesses. It replaces spreadsheets, emails and disconnected point solutions with a single platform that manages vendors, compliance, audits, risk and governance.

**Positioning:** Category-defining OS, not a point solution.  
**First module:** Vendor Governance (live).  
**Target:** SaaS, Fintech, Healthcare, Manufacturing, IT Services.

---

## Module Status

| Module | Status | Description |
|---|---|---|
| **Vendor Governance** | ✅ Live | Manage vendor onboarding, documents, certifications and compliance |
| **Compliance Management** | 🔜 Coming Soon | Track compliance frameworks, controls, policies and readiness |
| **Audit Workspace** | 🔜 Coming Soon | Centralize audit preparation and evidence collection |
| **DPDP Privacy** | 🔜 Coming Soon | India's Digital Personal Data Protection Act compliance |
| **Risk Management** | 🔜 Coming Soon | Risk register, assessments and remediation tracking |
| **Board Governance** | 🔵 Future | Board meetings, resolutions and governance calendar |
| **Trust Center** | 🔵 Future | Public-facing compliance and trust documentation |

---

## Module 1 — Vendor Governance ✅ Live

### Vendor Registry

- **Add vendor** — name, category (grouped dropdown with 20+ Indian B2B categories), risk level, contact email
- **Edit vendor** — update all fields post-creation including risk level reassignment
- **Delete vendor** — cascades all documents; purges stored files from storage atomically
- **Vendor status** — inline dropdown toggle: Active / Pending / Inactive
- **Vendor notes** — free-text internal notes with inline edit; all changes audited
- **Vendor list** — paginated (20/page), sortable by newest first
- **Vendor detail page** — full profile with compliance score, documents, notes and score breakdown
- **Created date** — "Added on [date]" shown on vendor detail

### Search & Filter

- **Topbar search** — type vendor name, press Enter to navigate directly to filtered list
- **Name/category search** — client-side filter on the vendors list
- **Risk filter** — filter by low / medium / high / critical
- **Status filter** — filter by active / pending / inactive
- **Expiring filter** — one-click filter to show only vendors with expiring documents
- **URL-driven filters** — dashboard stat cards link directly to pre-filtered vendor lists (`?expiring=1`, `?risk=high`)
- **Results count** — shows "X of Y vendors" when filters are active
- **Clear all** — single button resets all filters

### Compliance Scoring

- **Document-driven score** — 0–100 score computed from: risk base + valid documents (×5, max +40) − expiring (×10) − expired (×20)
- **Consistent from creation** — initial score matches the formula with 0 docs; no score drop on first upload
- **Real-time recompute** — score updates automatically after every document upload, edit or delete
- **Score breakdown panel** — per-vendor panel showing current score, max achievable score, and a checklist of what's needed to reach 100
- **Score progress bar** — visual bar in the vendor list coloured by score range (green ≥80, indigo ≥60, amber ≥40, red <40)
- **Key document tracking** — breakdown panel tracks presence of ISO 27001, SOC 2 Type II, MSA, DPA

### Document Management

- **Upload** — PDF, PNG, JPG, JPEG, WEBP, TXT (up to Supabase Storage limits)
- **Document types** — 25+ predefined types across Security, India Compliance, Quality, Contracts and Insurance; custom "Other" fallback
- **AI extraction** — Gemini 2.5 Flash extracts document type, issuer, issue date, expiry date and summary from uploaded files
- **Status tracking** — valid / expiring (≤30 days) / expired — auto-set from expiry date
- **Manual edit** — edit document type, issued date and expiry date via inline modal if AI extraction is incorrect
- **Re-run extraction** — re-submit any document to Gemini with one click
- **Download** — signed download URLs (1-hour expiry) for all stored documents
- **Delete document** — removes storage file + database row + audit entry; rescores vendor
- **Extraction metadata shown** — issuer, issue date, expiry date and AI summary visible on each document row

### Dashboard

- **Compliance score ring** — org-wide average score with status label (Healthy / Improving / Needs Attention / Critical)
- **Stat cards** — Vendors Tracked, Documents Managed, Expiring Soon, High Risk — colour-coded by severity
- **Clickable stat cards** — Expiring Soon and High Risk link directly to filtered vendor views
- **AI Insights panel** — data-driven insight cards (expiry warnings, high-risk flags, score health, action prompts)
- **Recent vendors** — last 5 vendors with score bars and risk badges

### Data Export

- **CSV export** — one-click export of the full vendor list with name, category, status, risk, score, document count, expiring count

---

## Platform Features

### Authentication & Identity

- **Signup** — email + password; instant session (email confirmation optional)
- **Login** — email + password with redirect preservation
- **Onboarding** — new users create their workspace (organization) on first login
- **Sign out** — from settings page

### Multi-Tenancy & Security

- **Organization-scoped data** — every row in every table is scoped to an organization
- **Row-Level Security** — Postgres RLS enforces tenant isolation at the database layer; users can only access their org's data
- **RLS helper functions** — `is_org_member()` and `has_org_role()` prevent cross-tenant data leaks even in edge cases
- **Roles** — Owner, Admin, Member, Viewer (enforced; org rename restricted to Owner/Admin)
- **Supabase Storage RLS** — vendor document bucket scoped by org ID; no cross-tenant file access

### Audit Log

Every meaningful action is recorded in `audit_logs`:

| Action | Trigger |
|---|---|
| `organization.created` | Workspace created on onboarding |
| `organization.renamed` | Org name changed in settings |
| `vendor.created` | New vendor added |
| `vendor.updated` | Vendor details edited |
| `vendor.status_changed` | Status toggled (with from/to values) |
| `vendor.notes_updated` | Notes saved or cleared |
| `vendor.deleted` | Vendor deleted |
| `document.uploaded` | Document uploaded and registered |
| `document.deleted` | Document removed |

### Settings & Profile

- **Profile** — edit full name; displayed as avatar initial in topbar
- **Organization** — edit org name (owner/admin only); view slug, member count and your role
- **Sign out** — from dedicated Account section
- **Settings accessible** — from sidebar link and topbar avatar click

### App Shell

- **Sidebar** — module navigation with "Soon" labels on unbuilt modules; Settings link; Lekha AI panel
- **Topbar** — functional search, org name, email, profile avatar (links to settings)
- **Demo mode** — amber banner when Supabase is not connected; app shows illustrative data

### AI (Lekha AI)

- **Provider** — Google Gemini 2.5 Flash (configurable via `GEMINI_MODEL` env var)
- **Document extraction** — structured JSON output via response schema: document type, issuer, issued date, expiry date, summary
- **Date normalization** — all dates normalized to ISO 8601 (YYYY-MM-DD) regardless of source format
- **Graceful degradation** — AI extraction failures never block the upload; document is saved with "valid" status and can be manually edited or re-extracted
- **Extractable formats** — PDF, PNG, JPG, WEBP, plain text
- **Insights engine** — data-driven dashboard insights derived from live metrics (no static copy)

### Infrastructure & Data

- **Framework** — Next.js 16 (App Router) + TypeScript
- **Database** — Supabase Postgres (Mumbai / ap-south-1) — India data residency
- **ORM** — Drizzle with typed schema and migrations
- **Storage** — Supabase Storage (private bucket, org-scoped RLS)
- **Connection pooling** — Supavisor transaction pooler (port 6543) for serverless compatibility
- **Hosting** — Vercel (Mumbai `bom1` region) + Supabase (ap-south-1) — full India residency
- **Architecture** — layered modular monolith: UI → server actions (transport) → services (business logic) → repositories (data access) → Postgres

### Design System

- **Theme** — dark glassmorphism; deep indigo / purple / electric blue palette
- **Typography** — Inter (body) + Sora (display headings)
- **Components** — Button, Card, Badge, Input, Select, ScoreRing — all custom-themed
- **Responsive** — mobile-first; sidebar collapses on small screens
- **Reduced motion** — respects `prefers-reduced-motion`

---

## Investor Landing Page

- Hero with platform mockup (compliance ring, vendor risk, AI copilot)
- Social proof section with illustrative metrics
- Problem section (6 pain points)
- Vision platform map (all 7 modules)
- Platform modules section (all 6 modules with status)
- AI-Native section (7 capabilities)
- Product demo screen mockups (6 screens)
- Why India section (6 cards)
- Market Opportunity (70M+ businesses, 63M+ MSMEs)
- Founder section with mission statement
- Roadmap timeline (2026–2030)
- Final CTA with "Request Demo" and "Become a Design Partner"
- Scroll animations, hover effects, animated metrics
- Fully responsive (mobile, tablet, desktop)

---

## Roadmap

### 2026 — Vendor Governance ✅
Core vendor registry, document tracking, AI extraction, compliance scoring.

### 2027 — Compliance Management
Control frameworks (ISO 27001, SOC 2, India-specific), policies library, evidence collection, compliance score by framework.

### 2028 — DPDP & Audit Workspace
India's Digital Personal Data Protection Act module; audit request management, evidence repository, findings tracking.

### 2029 — Risk Management
Risk register, risk assessments with scoring, treatment plans, remediation tracking, risk heat maps.

### 2030 — India's Governance Operating System
Board Governance, Trust Center, full platform integration. Category-defining OS for Indian enterprise governance.

---

## Coming Next (Phase 1 Additions)

- Invite teammates to the organization (member management UI)
- Vendor onboarding checklist / required documents by category
- Expiring documents email notifications
- Compliance report PDF export
- Custom domain (`app.lekhaos.in`)

---

*Lekha OS — Trust. Governance. Compliance.*  
*Built for India 🇮🇳*
