import Link from "next/link";
import { Shield, CheckCircle, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Data Protection &#8212; AUDT Trust Center",
  description: "Row-Level Security, tenant isolation, India data residency, and your rights over your data.",
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-6">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)] mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function DataProtectionPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)]">
        <Link href="/trust" className="hover:text-[var(--color-ink)] transition">Trust Center</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[var(--color-ink)]">Data Protection</span>
      </nav>

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-line)] bg-white/[0.03]">
          <Shield className="h-4.5 w-4.5 text-[var(--color-blue)]" />
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--color-ink)]">
          Data Protection
        </h1>
      </div>
      <p className="mb-10 text-[var(--color-ink-dim)]">
        AUDT treats data protection as an architectural guarantee, not a policy. Tenant isolation,
        Row-Level Security, and India data residency are enforced at the infrastructure layer.
      </p>

      <div className="space-y-6">
        <Card title="India Data Residency">
          <p className="text-sm text-[var(--color-ink-dim)] mb-4">
            All customer data &#8212; primary database, file storage, and compute &#8212; is located in India.
            This directly supports compliance with India&#8217;s DPDP Act 2023, RBI Circular on IT Governance,
            and SEBI CSCRF requirements for data localisation.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Database", "Supabase Postgres &#8212; AWS ap-south-1 (Mumbai)"],
              ["File storage", "Supabase Storage &#8212; AWS ap-south-1 (Mumbai)"],
              ["Application compute", "Vercel bom1 region (Mumbai)"],
              ["AI processing", "Gemini API &#8212; data not retained by Google"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-4 py-3">
                <div className="text-xs font-medium text-[var(--color-ink-dim)]" dangerouslySetInnerHTML={{ __html: label }} />
                <div className="text-sm text-[var(--color-ink)] mt-0.5" dangerouslySetInnerHTML={{ __html: value }} />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Row-Level Security on Every Table">
          <p className="text-sm text-[var(--color-ink-dim)] mb-4">
            PostgreSQL Row-Level Security (RLS) is enabled on all 259+ tables. No application code path
            can return data from a different organization. The enforcement happens inside the database
            engine before any row is returned to the application layer.
          </p>
          <ul className="space-y-2">
            {[
              "RLS enabled on all 259+ tables &#8212; without exception",
              "Custom PL/pgSQL helpers: is_org_member() and has_org_role() on every policy",
              "Junction tables validated via EXISTS subqueries, not joins",
              "Global catalogue rows (frameworks, regulations) use OR organization_id IS NULL",
              "Enforced at PostgreSQL level &#8212; cannot be bypassed from application code",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[var(--color-ink-dim)]">
                <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Tenant Isolation">
          <p className="text-sm text-[var(--color-ink-dim)] mb-4">
            AUDT is a multi-tenant SaaS platform. Each customer organization is a separate tenant with
            its own isolated data space. There are no shared tables or shared data between organizations.
          </p>
          <ul className="space-y-2">
            {[
              "Every row in every table contains an organization_id foreign key",
              "Session validation enforces org membership on every request",
              "API keys are org-scoped &#8212; no cross-org API access",
              "File storage paths are tenant-prefixed &#8212; tenant_{org_id}/ prefix on all uploads",
              "Audit logs are org-scoped &#8212; no audit trail leaks across tenants",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[var(--color-ink-dim)]">
                <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        </Card>

        <Card title="DPDP Act 2023 Readiness">
          <p className="text-sm text-[var(--color-ink-dim)] mb-4">
            AUDT&#8217;s DPDP Privacy&#8482; module is purpose-built for India&#8217;s Digital Personal Data Protection Act 2023.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Data inventory and classification",
              "Consent records with audit trail",
              "Data Subject Request (DSR) workflow",
              "Retention policy management",
              "Privacy Impact Assessments",
              "Cross-border transfer documentation",
              "Privacy Trust Score&#8482; per data asset",
              "DPO-ready reporting",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-[var(--color-ink-dim)]">
                <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Data Export &amp; Deletion">
          <p className="text-sm text-[var(--color-ink-dim)] mb-4">
            You own your data. AUDT provides self-service data export and a formal deletion workflow.
          </p>
          <ul className="space-y-2">
            {[
              "Export Tenant Data &#8212; ZIP of all your data as CSVs, available via Settings &#8213; Data Governance",
              "Data deletion request &#8212; initiated via Settings &#8213; Data Governance, processed within 30 days",
              "API available &#8212; GET /api/export/tenant-data (session auth)",
              "Audit log of all export and deletion events",
              "On account termination, data is purged from all systems within 90 days",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[var(--color-ink-dim)]">
                <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Retention &amp; Backup">
          <p className="text-sm text-[var(--color-ink-dim)] mb-4">
            Data retention policies are configurable per organization and enforced by AUDT&#8217;s retention engine.
          </p>
          <ul className="space-y-2">
            {[
              "Default retention: 90 days for audit logs and governance events",
              "Configurable retention policies per data category",
              "Automated daily database backups &#8212; encrypted at rest",
              "Point-in-time recovery available on Supabase",
              "Backups stored in ap-south-1 &#8212; remain within India",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[var(--color-ink-dim)]">
                <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-10">
        <Link
          href="/trust"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] transition hover:text-[var(--color-ink)]"
        >
          &#8592; Back to Trust Center
        </Link>
      </div>
    </div>
  );
}
