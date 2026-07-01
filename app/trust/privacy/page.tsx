import Link from "next/link";
import { Eye, CheckCircle, XCircle, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Privacy — AUDT Trust Center",
  description: "What data AUDT collects, what we never do, and your rights over your data.",
};

export default function PrivacyPage() {
  const weCollect = [
    "Account information — name, email address, job title, organization name",
    "Usage events — which features are used, page views, action counts (no content)",
    "Audit logs — user actions within your org (who did what, when, from which IP)",
    "Vendor and governance data — data entered by your team into AUDT modules",
    "Device signals — browser type, OS, IP address for session management and security",
    "Billing information — invoice details, payment reference numbers (no card data)",
  ];

  const weNeverDo = [
    "We never use your data to train AI models — zero-day guarantee",
    "We never sell or share your data with third parties without your explicit consent",
    "We never store payment card numbers — all billing is handled via bank transfer or invoice",
    "We never retain data after account deletion beyond legally required minimums",
    "We never access your data except for support tickets you raise or contractual obligations",
    "We never serve advertising based on your governance or compliance data",
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)]">
        <Link href="/trust" className="hover:text-[var(--color-ink)] transition">Trust Center</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[var(--color-ink)]">Privacy</span>
      </nav>

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[#F8F9FB]">
          <Eye className="h-4.5 w-4.5 text-[var(--color-blue)]" />
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--color-ink)]">
          Privacy &amp; Data Handling
        </h1>
      </div>
      <p className="mb-10 text-[var(--color-ink-dim)]">
        Your governance data is yours. AUDT acts as a data processor on your behalf — we never use
        your data for any purpose other than providing you the AUDT platform.
      </p>

      <div className="space-y-6">
        {/* What we collect */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)] mb-4">
            What We Collect
          </h2>
          <ul className="space-y-2.5">
            {weCollect.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[var(--color-ink-dim)]">
                <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        </div>

        {/* What we never do */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)] mb-4">
            What We Never Do
          </h2>
          <ul className="space-y-2.5">
            {weNeverDo.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[var(--color-ink-dim)]">
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        </div>

        {/* Customer data ownership */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)] mb-3">
            Customer Data Ownership
          </h2>
          <p className="text-sm text-[var(--color-ink-dim)] mb-3">
            You retain full ownership of all data you store in AUDT. AUDT has a limited licence to
            process your data solely to provide the platform services you&#8217;ve subscribed to.
          </p>
          <p className="text-sm text-[var(--color-ink-dim)]">
            You can export all your data at any time via Settings — Data Governance — Export Tenant Data.
            Exported data is provided as a ZIP archive of CSV files covering all modules.
          </p>
        </div>

        {/* Third parties */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)] mb-3">
            Third-Party Sub-Processors
          </h2>
          <p className="text-sm text-[var(--color-ink-dim)] mb-4">
            AUDT uses a minimal set of sub-processors. Each is engaged under a Data Processing Agreement.
          </p>
          <div className="space-y-2">
            {[
              ["Supabase", "Database and file storage — ap-south-1 Mumbai", "India"],
              ["Vercel", "Application hosting — bom1 Mumbai region", "India"],
              ["Google (Gemini)", "AI feature processing — data not retained for training", "Not retained"],
              ["Resend", "Transactional email delivery", "EU / India"],
            ].map(([name, purpose, location]) => (
              <div key={name} className="flex flex-col gap-0.5 rounded-xl border border-[var(--color-line)] bg-white px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4">
                <span className="w-36 shrink-0 text-xs font-semibold text-[var(--color-ink)]" dangerouslySetInnerHTML={{ __html: name }} />
                <span className="flex-1 text-xs text-[var(--color-ink-dim)]" dangerouslySetInnerHTML={{ __html: purpose }} />
                <span className="text-xs text-[var(--color-ink-dim)]" dangerouslySetInnerHTML={{ __html: location }} />
              </div>
            ))}
          </div>
        </div>

        {/* Cookies */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)] mb-3">
            Cookies
          </h2>
          <p className="text-sm text-[var(--color-ink-dim)] mb-4">
            AUDT uses only essential, functional cookies. No advertising or tracking cookies are used.
          </p>
          <div className="space-y-2">
            {[
              ["sb-...-auth-token", "Supabase session token — required for authentication"],
              ["audt-sid", "AUDT session record — enables session management and timeout"],
              ["audt-mfa", "TOTP verification state — set after successful MFA verification"],
            ].map(([name, purpose]) => (
              <div key={name} className="flex flex-col gap-0.5 rounded-xl border border-[var(--color-line)] bg-white px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4">
                <code className="w-48 shrink-0 text-xs font-mono text-[var(--color-blue)]" dangerouslySetInnerHTML={{ __html: name }} />
                <span className="text-xs text-[var(--color-ink-dim)]" dangerouslySetInnerHTML={{ __html: purpose }} />
              </div>
            ))}
          </div>
        </div>

        {/* Rights */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)] mb-3">
            Your Rights
          </h2>
          <p className="text-sm text-[var(--color-ink-dim)] mb-4">
            Under DPDP Act 2023, GDPR, and other applicable laws, you have the following rights:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Access", "Request a copy of your personal data"],
              ["Rectification", "Correct inaccurate personal data"],
              ["Erasure", "Request deletion of your personal data"],
              ["Portability", "Export your data in machine-readable format"],
              ["Restriction", "Request limited processing of your data"],
              ["Objection", "Object to certain types of processing"],
            ].map(([right, desc]) => (
              <div key={right} className="rounded-xl border border-[var(--color-line)] bg-white px-4 py-3">
                <div className="text-xs font-semibold text-[var(--color-ink)]">{right}</div>
                <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">{desc}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-[var(--color-ink-dim)]">
            To exercise any of these rights, email{" "}
            <a href="mailto:security@audt.tech" className="text-[var(--color-blue)] hover:underline">
              security@audt.tech
            </a>
            . We will acknowledge within 72 hours and respond within 30 days.
          </p>
        </div>
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
