import Link from "next/link";
import { Server, Shield, Users, Lock, Globe, Key, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Security Architecture &#8212; AUDT Trust Center",
  description: "How AUDT isolates tenants, protects data, and enforces zero-trust at every layer.",
};

function Section({ id, icon: Icon, title, children }: {
  id?: string;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[#F8F9FB]">
          <Icon className="h-4.5 w-4.5 text-[var(--color-blue)]" />
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
          {title}
        </h2>
      </div>
      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6 space-y-4">
        {children}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
      <span className="w-48 shrink-0 text-xs font-medium uppercase tracking-wider text-[var(--color-ink-dim)]">
        {label}
      </span>
      <span className="text-sm text-[var(--color-ink)]">{value}</span>
    </div>
  );
}

export default function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)]">
        <Link href="/trust" className="hover:text-[var(--color-ink)] transition">Trust Center</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[var(--color-ink)]">Security Architecture</span>
      </nav>

      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--color-ink)] mb-2">
        Security Architecture
      </h1>
      <p className="mb-10 text-[var(--color-ink-dim)]">
        AUDT is built as a multi-tenant SaaS platform with defense-in-depth &#8212; every layer is independently
        secured so a failure at one layer does not compromise the platform.
      </p>

      <div className="space-y-8">
        <Section id="isolation" icon={Shield} title="Multi-Tenant Isolation">
          <p className="text-sm text-[var(--color-ink-dim)]">
            Every table in the AUDT database has Row-Level Security (RLS) enforced at the PostgreSQL layer.
            Tenant boundaries are enforced by the database engine, not application code, so there is no
            code path that can return data across organization boundaries.
          </p>
          <div className="space-y-2 pt-2">
            <Row label="RLS coverage" value="All 259+ tables — enforced at PostgreSQL layer" />
            <Row label="Auth helpers" value="is_org_member(), has_org_role() — custom PL/pgSQL functions" />
            <Row label="Tenant key" value="organization_id — every row linked to a single org" />
            <Row label="Cross-org access" value="Architecturally impossible — no bypass paths" />
          </div>
        </Section>

        <Section id="residency" icon={Globe} title="India Data Residency">
          <p className="text-sm text-[var(--color-ink-dim)]">
            All customer data is stored and processed within India. AUDT was architected for India-first
            data residency to support DPDP Act 2023 compliance requirements out of the box.
          </p>
          <div className="space-y-2 pt-2">
            <Row label="Database" value="Supabase Postgres &#8212; ap-south-1 (Mumbai, India)" />
            <Row label="Compute" value="Vercel &#8212; bom1 region (Mumbai, India)" />
            <Row label="File storage" value="Supabase Storage &#8212; ap-south-1 (Mumbai)" />
            <Row label="AI processing" value="Google Gemini API &#8212; requests do not persist customer data" />
            <Row label="Regulatory alignment" value="DPDP Act 2023, RBI CSF, SEBI CSCRF" />
          </div>
        </Section>

        <Section id="layers" icon={Server} title="Layered Architecture">
          <p className="text-sm text-[var(--color-ink-dim)]">
            AUDT uses a strict layered monolith where each layer has a single responsibility and zero
            upward dependencies. Business logic never lives in transport layers.
          </p>
          <div className="space-y-1.5 pt-2">
            {[
              ["Transport layer", "Next.js App Router pages, server actions, REST handlers"],
              ["Auth layer", "requireUser() for pages &#8212; validateApiKey() for API v1"],
              ["Business logic layer", "lib/services/* &#8212; zero next/* imports, framework-agnostic TypeScript"],
              ["Data access layer", "lib/repositories/* &#8212; Drizzle ORM, optional transaction executor"],
              ["Infrastructure layer", "lib/providers/* &#8212; only place SDK imports are allowed"],
            ].map(([layer, desc]) => (
              <div key={layer} className="rounded-xl border border-[var(--color-line)] bg-white px-4 py-2.5">
                <span className="text-xs font-semibold text-[var(--color-blue)]" dangerouslySetInnerHTML={{ __html: layer }} />
                <p className="text-xs text-[var(--color-ink-dim)] mt-0.5" dangerouslySetInnerHTML={{ __html: desc }} />
              </div>
            ))}
          </div>
        </Section>

        <Section id="auth" icon={Users} title="Zero-Trust Authentication">
          <p className="text-sm text-[var(--color-ink-dim)]">
            Authentication is layered &#8212; Supabase Auth manages identity, AUDT adds session records,
            device trust, and enterprise enforcement on top.
          </p>
          <div className="space-y-2 pt-2">
            <Row label="Identity provider" value="Supabase Auth (email + magic link + OAuth ready)" />
            <Row label="RBAC" value="7 roles: owner &#183; admin &#183; member &#183; viewer &#183; compliance_manager &#183; security_manager &#183; procurement_manager" />
            <Row label="MFA" value="TOTP (RFC 6238) &#8212; enrollment, recovery codes, org-level enforcement" />
            <Row label="Session records" value="AUDT user_sessions table &#8212; idle timeout, absolute timeout, concurrent session limits" />
            <Row label="Device trust" value="djb2 device fingerprint &#8212; 30-day trusted device registry" />
            <Row label="Enterprise SSO" value="Entra ID, Okta, Google Workspace, SAML 2.0, OIDC &#8212; JIT provisioning" />
          </div>
        </Section>

        <Section id="sessions" icon={Lock} title="Session Management">
          <p className="text-sm text-[var(--color-ink-dim)]">
            Every authenticated request is validated against an AUDT session record, not just the
            Supabase JWT. This enables fine-grained session control independent of the auth provider.
          </p>
          <div className="space-y-2 pt-2">
            <Row label="Session cookie" value="audt-sid &#8212; httpOnly, 8-hour max age, SameSite=Lax" />
            <Row label="MFA cookie" value="audt-mfa &#8212; httpOnly, set after TOTP verification" />
            <Row label="Idle timeout" value="Configurable per org (default 60 minutes)" />
            <Row label="Absolute timeout" value="Configurable per org (default 8 hours)" />
            <Row label="Max concurrent" value="Configurable per org (default 5 sessions)" />
            <Row label="IP enforcement" value="CIDR-based IP allowlists per resource type" />
          </div>
        </Section>

        <Section id="api" icon={Key} title="API Security">
          <p className="text-sm text-[var(--color-ink-dim)]">
            The AUDT REST API uses Bearer token authentication with bcrypt-hashed keys, scoped permissions,
            and in-process rate limiting.
          </p>
          <div className="space-y-2 pt-2">
            <Row label="API key format" value="Cryptographically random &#8212; stored as bcrypt hash, shown once" />
            <Row label="Permissions" value="read_only or read_write &#8212; enforced per endpoint" />
            <Row label="Rate limiting" value="In-memory sliding window &#8212; 100 / 300 / 1000 req per 60 seconds" />
            <Row label="Auth validation" value="bcrypt compare on every request &#8212; intentionally ~100 ms" />
            <Row label="TLS enforcement" value="ssl:&quot;require&quot; &#8212; all DB connections, all API calls" />
            <Row label="HSTS" value="max-age=31536000; includeSubDomains; preload" />
          </div>
        </Section>
      </div>

      <div className="mt-10 flex gap-3">
        <Link
          href="/trust/encryption"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-ink-dim)] transition hover:bg-[#F0F4F9] hover:text-[var(--color-ink)]"
        >
          Encryption details
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href="/trust/data-protection"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-ink-dim)] transition hover:bg-[#F0F4F9] hover:text-[var(--color-ink)]"
        >
          Data protection
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
