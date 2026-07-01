import Link from "next/link";
import { Mail, Clock, Shield, AlertTriangle, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Security Contact — AUDT Trust Center",
  description: "Report vulnerabilities, contact the AUDT security team, and learn about our responsible disclosure policy.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)]">
        <Link href="/trust" className="hover:text-[var(--color-ink)] transition">Trust Center</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[var(--color-ink)]">Security Contact</span>
      </nav>

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[#F8F9FB]">
          <Mail className="h-4.5 w-4.5 text-[var(--color-blue)]" />
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--color-ink)]">
          Security Contact
        </h1>
      </div>
      <p className="mb-10 text-[var(--color-ink-dim)]">
        We take security seriously. If you&#8217;ve discovered a potential vulnerability in AUDT, please
        let us know immediately through responsible disclosure. We appreciate the security community&#8217;s help
        in keeping AUDT safe.
      </p>

      {/* CTA */}
      <div className="mb-8 rounded-2xl border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/5 p-6 text-center">
        <p className="text-sm text-[var(--color-ink-dim)] mb-3">Security vulnerabilities and questions</p>
        <a
          href="mailto:security@audt.tech"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-blue)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Mail className="h-4 w-4" />
          security@audt.tech
        </a>
      </div>

      <div className="space-y-6">
        {/* Responsible disclosure */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-emerald-400" />
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
              Responsible Disclosure Policy
            </h2>
          </div>
          <p className="text-sm text-[var(--color-ink-dim)] mb-4">
            AUDT operates a responsible disclosure programme. If you discover a security vulnerability,
            we ask that you:
          </p>
          <ol className="space-y-3">
            {[
              "Email security@audt.tech with a clear description of the vulnerability, steps to reproduce, and potential impact.",
              "Give us reasonable time to investigate and patch before any public disclosure. We request a minimum of 90 days for critical issues.",
              "Do not access, modify, or delete customer data. If you encounter customer data during research, stop immediately and report it.",
              "Do not conduct denial-of-service attacks, social engineering, or physical security testing.",
              "Do not disclose the issue to others before we have issued a fix.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[var(--color-ink-dim)]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] text-xs font-semibold text-[var(--color-ink)]">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* SLA */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-blue-400" />
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
              Response SLA
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { severity: "Critical", sla: "Acknowledge within 4 hours · Initial fix within 24 hours · Full resolution within 7 days", color: "text-red-400 border-red-500/30 bg-red-500/10" },
              { severity: "High", sla: "Acknowledge within 24 hours · Resolution within 14 days", color: "text-orange-400 border-orange-500/30 bg-orange-500/10" },
              { severity: "Medium", sla: "Acknowledge within 48 hours · Resolution within 30 days", color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" },
              { severity: "Low", sla: "Acknowledge within 72 hours · Resolution within 90 days", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
            ].map(({ severity, sla, color }) => (
              <div key={severity} className="flex flex-col gap-1 rounded-xl border border-[var(--color-line)] bg-white px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                <span className={`inline-flex w-fit items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${color}`}>
                  {severity}
                </span>
                <span className="text-sm text-[var(--color-ink-dim)]" dangerouslySetInnerHTML={{ __html: sla }} />
              </div>
            ))}
          </div>
        </div>

        {/* Scope */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
              In-Scope &amp; Out-of-Scope
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">In Scope</p>
              <ul className="space-y-1.5">
                {[
                  "audt.tech and lekha-os.vercel.app",
                  "API endpoints (/api/v1/*)",
                  "Authentication and session management",
                  "Data isolation and tenant boundaries",
                  "Encryption implementation",
                  "Authorization bypasses",
                ].map((item) => (
                  <li key={item} className="text-sm text-[var(--color-ink-dim)]">· {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Out of Scope</p>
              <ul className="space-y-1.5">
                {[
                  "Denial of service attacks",
                  "Social engineering",
                  "Physical security",
                  "Third-party services (Supabase, Vercel, Google)",
                  "Automated scanning without prior approval",
                  "Issues in client-side libraries not used by AUDT",
                ].map((item) => (
                  <li key={item} className="text-sm text-[var(--color-ink-dim)]">· {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bug bounty */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)] mb-3">
            Bug Bounty
          </h2>
          <p className="text-sm text-[var(--color-ink-dim)] mb-3">
            AUDT appreciates responsible disclosure. We recognise security researchers who help us improve
            the platform with public acknowledgement (with your permission) and, for significant findings,
            financial rewards at our discretion.
          </p>
          <p className="text-sm text-[var(--color-ink-dim)]">
            We are in the process of establishing a formal bug bounty programme via a third-party platform.
            In the interim, please contact{" "}
            <a href="mailto:security@audt.tech" className="text-[var(--color-blue)] hover:underline">
              security@audt.tech
            </a>{" "}
            to discuss findings and recognition.
          </p>
        </div>

        {/* PGP */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)] mb-3">
            PGP Encryption
          </h2>
          <p className="text-sm text-[var(--color-ink-dim)] mb-3">
            For sensitive disclosures, you may encrypt your email using our security team&#8217;s PGP key.
            Key publication is in progress — email us directly and we will share the key on request.
          </p>
          <div className="rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-3 font-mono text-xs text-[var(--color-ink-dim)]">
            Key ID: <span className="text-[var(--color-blue)]">Coming soon</span>
            <br />
            Fingerprint: <span className="text-[var(--color-blue)]">Email security@audt.tech to request</span>
          </div>
        </div>

        {/* General contact */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)] mb-3">
            Other Security Inquiries
          </h2>
          <p className="text-sm text-[var(--color-ink-dim)] mb-4">
            For general security questions, compliance documentation requests (SOC 2 reports, penetration test summaries,
            DPDP impact assessments), or enterprise security reviews, contact us at:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-[var(--color-blue)]" />
              <a href="mailto:security@audt.tech" className="text-[var(--color-blue)] hover:underline">
                security@audt.tech
              </a>
            </div>
          </div>
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
