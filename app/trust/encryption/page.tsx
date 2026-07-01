import Link from "next/link";
import { Lock, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Encryption — AUDT Trust Center",
  description: "How AUDT encrypts data in transit, at rest, and for secrets management.",
};

function EncSection({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)] mb-4">
        {title}
      </h2>
      <dl className="space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
            <dt className="w-52 shrink-0 text-xs font-medium uppercase tracking-wider text-[var(--color-ink-dim)]">
              {label}
            </dt>
            <dd className="text-sm text-[var(--color-ink)]" dangerouslySetInnerHTML={{ __html: value }} />
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function EncryptionPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)]">
        <Link href="/trust" className="hover:text-[var(--color-ink)] transition">Trust Center</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[var(--color-ink)]">Encryption</span>
      </nav>

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[#F8F9FB]">
          <Lock className="h-4.5 w-4.5 text-[var(--color-blue)]" />
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--color-ink)]">
          Encryption &amp; Key Management
        </h1>
      </div>
      <p className="mb-10 text-[var(--color-ink-dim)]">
        AUDT uses strong encryption for data in transit, data at rest, and for all secrets and credentials.
        No plaintext credentials are ever stored in the database.
      </p>

      <div className="space-y-6">
        <EncSection
          title="Data in Transit"
          rows={[
            ["Protocol", "TLS 1.2 minimum, TLS 1.3 preferred — enforced on all connections"],
            ["HSTS", "max-age=31536000; includeSubDomains; preload — 1-year max age"],
            ["Certificate", "Vercel-managed SSL — auto-renewed, OCSP stapling"],
            ["DB connections", "ssl:&quot;require&quot; — all PostgreSQL connections use TLS"],
            ["HTTP headers", "X-Frame-Options: DENY · X-Content-Type-Options: nosniff · Referrer-Policy: strict-origin-when-cross-origin"],
            ["CSP", "Content-Security-Policy enforced at Next.js response headers layer"],
          ]}
        />

        <EncSection
          title="Data at Rest — Integration Configs &amp; Secrets"
          rows={[
            ["Algorithm", "AES-256-GCM — authenticated encryption with associated data (AEAD)"],
            ["Key length", "256-bit encryption key (32 bytes, hex-encoded)"],
            ["IV / Nonce", "Randomly generated 12-byte IV per encryption operation — never reused"],
            ["Auth tag", "128-bit GCM authentication tag — detects tampering"],
            ["Key storage", "ENCRYPTION_KEY env var — set in Vercel, never in source code or DB"],
            ["Scope", "All integration credentials, third-party API keys, and webhook secrets"],
            ["Implementation", "Node.js built-in crypto module — no third-party crypto libraries"],
          ]}
        />

        <EncSection
          title="Passwords &amp; API Keys"
          rows={[
            ["Algorithm", "bcrypt — adaptive work factor, resistant to GPU cracking"],
            ["Work factor", "12 rounds for passwords · 10 rounds for API keys"],
            ["API key display", "Shown once at creation — only the bcrypt hash is stored"],
            ["Password history", "Configurable per org — prevents reuse of recent passwords"],
            ["TOTP secrets", "AES-256-GCM encrypted before storage — decrypted only at verify time"],
            ["Recovery codes", "bcrypt-hashed individually — single-use, 10 codes per enrollment"],
          ]}
        />

        <EncSection
          title="Database Encryption"
          rows={[
            ["Provider", "Supabase Postgres on AWS RDS — ap-south-1 (Mumbai)"],
            ["Encryption at rest", "AWS managed encryption — AES-256 on EBS volumes"],
            ["Backups", "Automated daily backups — encrypted at rest"],
            ["In-transit", "TLS enforced between app layer and Supabase Supavisor pooler"],
            ["WAL / logs", "Encrypted in transit and at rest on AWS infrastructure"],
          ]}
        />

        <EncSection
          title="File Storage Encryption"
          rows={[
            ["Provider", "Supabase Storage — ap-south-1 (Mumbai)"],
            ["Encryption at rest", "AWS S3-managed encryption (SSE-S3) — AES-256"],
            ["Access control", "Tenant-prefixed storage paths + Row-Level Security on storage.objects"],
            ["Signed URLs", "15-minute TTL signed URLs for all file downloads"],
            ["Buckets", "vendor-documents (legacy) and compliance-documents (current) — both private"],
          ]}
        />

        <EncSection
          title="Customer Managed Encryption (Enterprise)"
          rows={[
            ["Status", "Available on Enterprise plan"],
            ["Providers", "AWS KMS · Azure Key Vault · Google Cloud KMS"],
            ["Model", "Bring Your Own Key (BYOK) — AUDT never holds the master key"],
            ["Audit log", "Every key usage event recorded in encryption_audit_logs"],
          ]}
        />
      </div>

      <div className="mt-10">
        <Link
          href="/trust"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] transition hover:text-[var(--color-ink)]"
        >
          ← Back to Trust Center
        </Link>
      </div>
    </div>
  );
}
