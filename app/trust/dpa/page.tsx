import Link from "next/link";
import { FileCheck } from "lucide-react";

export const metadata = {
  title: "Data Processing Agreement — AUDT",
  description: "AUDT Data Processing Agreement (DPA) for enterprise customers. India data residency, DPDP Act 2023 compliance.",
};

export default function DpaPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-1.5 text-xs font-medium text-[var(--color-ink-dim)]">
          <FileCheck className="h-3.5 w-3.5 text-[var(--color-blue)]" />
          Legal
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--color-ink)]">
          Data Processing Agreement
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-dim)]">
          Effective date: 1 July 2026 &nbsp;&middot;&nbsp; Version 1.0
        </p>
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-400">
          This DPA is incorporated by reference into the AUDT{" "}
          <Link href="/trust/terms" className="underline hover:opacity-80">Terms of Service</Link>.
          It applies to all processing of personal data by AUDT on behalf of customers.
        </div>
      </div>

      <div className="space-y-10 text-sm leading-relaxed text-[var(--color-ink-dim)]">

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">1. Definitions</h2>
          <ul className="space-y-2 pl-4">
            <li><strong className="text-[var(--color-ink)]">&ldquo;Controller&rdquo;</strong> means the Customer, who determines the purposes and means of processing personal data.</li>
            <li><strong className="text-[var(--color-ink)]">&ldquo;Processor&rdquo;</strong> means AUDT, who processes personal data on behalf of the Controller.</li>
            <li><strong className="text-[var(--color-ink)]">&ldquo;Personal Data&rdquo;</strong> means any information relating to an identified or identifiable natural person, as defined under applicable privacy laws including the DPDP Act 2023.</li>
            <li><strong className="text-[var(--color-ink)]">&ldquo;Processing&rdquo;</strong> means any operation performed on Personal Data, including collection, storage, use, disclosure, and deletion.</li>
            <li><strong className="text-[var(--color-ink)]">&ldquo;Sub-processor&rdquo;</strong> means any third party engaged by AUDT to process Personal Data.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">2. Scope and Purpose</h2>
          <p>
            AUDT processes Personal Data provided by the Customer solely to deliver the Service described
            in the Terms of Service. AUDT acts as a Data Processor under applicable privacy laws, including
            the Digital Personal Data Protection Act 2023 (India) and the General Data Protection Regulation
            (EU) where applicable.
          </p>
          <p className="mt-3">
            AUDT processes Personal Data only on documented instructions from the Customer, unless required
            by applicable law. AUDT will notify the Customer of any legal requirement to process data without
            instructions where permitted by law.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">3. Categories of Data Processed</h2>
          <p>AUDT may process the following categories of Personal Data on behalf of the Customer:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Identity data: name, job title, department, employee identifier;</li>
            <li>Contact data: work email address, work phone number;</li>
            <li>Account data: authentication credentials (password hashes, MFA secrets encrypted at rest), login history, session tokens;</li>
            <li>Governance data: vendor names, vendor contact information, assessment responses, audit findings;</li>
            <li>Usage data: platform activity logs, feature usage telemetry, audit trail events.</li>
          </ul>
          <p className="mt-3">
            AUDT does not intentionally collect or require sensitive personal data (e.g., health information,
            financial account numbers, government identification numbers) as part of normal Service operation.
            Customers must not upload such data without prior written agreement.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">4. Data Localisation and Transfers</h2>
          <p>
            All Customer Data, including Personal Data, is stored in India (Mumbai, ap-south-1 region) by
            default. AUDT does not transfer Personal Data outside India except as required to operate the
            Service and with appropriate safeguards in place.
          </p>
          <p className="mt-3">
            Where Personal Data of EU data subjects is processed, AUDT provides appropriate transfer
            mechanisms (such as Standard Contractual Clauses) upon request. Contact{" "}
            <a href="mailto:privacy@audt.tech" className="text-[var(--color-blue)] hover:underline">privacy@audt.tech</a>{" "}
            to request applicable transfer documentation.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">5. Security Measures</h2>
          <p>
            AUDT implements appropriate technical and organisational measures to protect Personal Data against
            unauthorised access, disclosure, alteration, or destruction. Current measures include:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>AES-256-GCM encryption for data at rest;</li>
            <li>TLS 1.3 with HSTS for data in transit;</li>
            <li>Row-Level Security (RLS) on all 259+ database tables, enforcing tenant isolation;</li>
            <li>bcrypt password hashing with 12 rounds;</li>
            <li>TOTP-based multi-factor authentication for all user accounts;</li>
            <li>Comprehensive audit logging of all platform actions with actor attribution;</li>
            <li>Enterprise: Customer Managed Encryption (AWS KMS, Azure Key Vault, Google KMS).</li>
          </ul>
          <p className="mt-3">
            A full description of security measures is available in our{" "}
            <Link href="/trust/architecture" className="text-[var(--color-blue)] hover:underline">Security Architecture</Link> and{" "}
            <Link href="/trust/encryption" className="text-[var(--color-blue)] hover:underline">Encryption</Link> documentation.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">6. Sub-processors</h2>
          <p>
            AUDT engages the following sub-processors to deliver the Service. AUDT remains responsible for
            sub-processor compliance with this DPA.
          </p>
          <div className="mt-4 overflow-auto rounded-xl border border-[var(--color-line)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-line)] bg-[#F8F9FB]">
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink)]">Sub-processor</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink)]">Purpose</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink)]">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {[
                  ["Supabase", "Database hosting, authentication, and file storage", "India (Mumbai)"],
                  ["Vercel", "Application hosting and edge delivery", "India (Mumbai)"],
                  ["Google (Gemini)", "AI processing for governance insights — no training on customer data", "India (processed in-region where available)"],
                  ["Resend", "Transactional email delivery (expiry alerts, digest emails)", "US (processed in-region)"],
                ].map(([name, purpose, location]) => (
                  <tr key={name}>
                    <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{name}</td>
                    <td className="px-4 py-3">{purpose}</td>
                    <td className="px-4 py-3">{location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            AUDT will provide thirty (30) days&rsquo; notice before adding new sub-processors that process
            Personal Data. Customers who object to a new sub-processor may terminate the Service in
            accordance with the Terms.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">7. Data Subject Rights</h2>
          <p>
            AUDT will assist the Customer in fulfilling data subject rights requests under applicable law,
            including rights of access, rectification, erasure, portability, and objection. AUDT provides
            the following mechanisms:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong className="text-[var(--color-ink)]">Data Export:</strong> Customers can export all their data at any time from Settings &rarr; Data Governance &rarr; Export Tenant Data.</li>
            <li><strong className="text-[var(--color-ink)]">Data Deletion:</strong> Customers can request permanent data deletion from Settings &rarr; Data Governance &rarr; Request Data Deletion.</li>
            <li><strong className="text-[var(--color-ink)]">Account Deletion:</strong> Customers may request account deletion by emailing <a href="mailto:privacy@audt.tech" className="text-[var(--color-blue)] hover:underline">privacy@audt.tech</a>.</li>
          </ul>
          <p className="mt-3">
            AUDT will notify the Customer promptly if it receives a data subject rights request directly
            from a data subject and will not respond to such requests without Customer instruction.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">8. Data Breach Notification</h2>
          <p>
            AUDT will notify the Customer without undue delay, and in any case within 72 hours of becoming
            aware of a personal data breach that affects Customer Data. Notification will be sent to the
            primary contact email on the Customer&rsquo;s account and will include:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>A description of the nature of the breach;</li>
            <li>Categories and approximate number of data subjects affected;</li>
            <li>Likely consequences of the breach;</li>
            <li>Measures taken or proposed to address the breach.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">9. Audit Rights</h2>
          <p>
            Enterprise customers may request an audit or inspection of AUDT&rsquo;s data processing activities
            once per year with thirty (30) days&rsquo; advance notice. Audits are conducted at the Customer&rsquo;s
            expense. AUDT may satisfy this obligation by providing a SOC 2 Type II report or equivalent
            third-party audit report where available.
          </p>
          <p className="mt-3">
            All audit findings are treated as confidential information of both parties.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">10. Retention and Deletion</h2>
          <p>
            AUDT retains Customer Data for the duration of the subscription. Upon termination, AUDT will
            make Customer Data available for export for thirty (30) days, after which it will be securely
            deleted from production systems within 90 days. Backup copies may persist for up to 180 days
            before permanent deletion.
          </p>
          <p className="mt-3">
            Audit logs and billing records may be retained for longer periods as required by applicable law
            (typically 7 years for financial records under Indian law).
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">11. Contact</h2>
          <p>
            For DPA-related inquiries, data subject rights requests, or to request an executed DPA for your
            organisation, contact:{" "}
            <a href="mailto:privacy@audt.tech" className="text-[var(--color-blue)] hover:underline">privacy@audt.tech</a>
          </p>
          <p className="mt-2 text-xs">
            AUDT &middot; Governance Built on Proof. &middot; audt.tech
          </p>
        </section>

        <div className="border-t border-[var(--color-line)] pt-8 flex flex-wrap gap-4 text-xs">
          <Link href="/trust" className="text-[var(--color-blue)] hover:underline">← Trust Center</Link>
          <Link href="/trust/terms" className="text-[var(--color-blue)] hover:underline">Terms of Service</Link>
          <Link href="/trust/privacy" className="text-[var(--color-blue)] hover:underline">Privacy Practices</Link>
          <Link href="/trust/architecture" className="text-[var(--color-blue)] hover:underline">Security Architecture</Link>
        </div>

      </div>
    </div>
  );
}
