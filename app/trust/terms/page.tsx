import Link from "next/link";
import { FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service — AUDT",
  description: "AUDT Terms of Service. Governance Built on Proof.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-1.5 text-xs font-medium text-[var(--color-ink-dim)]">
          <FileText className="h-3.5 w-3.5 text-[var(--color-blue)]" />
          Legal
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--color-ink)]">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-dim)]">
          Effective date: 1 July 2026 &nbsp;&middot;&nbsp; Version 1.0
        </p>
      </div>

      <div className="prose-audt space-y-10 text-sm leading-relaxed text-[var(--color-ink-dim)]">

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">1. Agreement to Terms</h2>
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the AUDT platform
            (&ldquo;Service&rdquo;), operated by AUDT (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
            By accessing or using the Service, you agree to be bound by these Terms. If you are using the Service
            on behalf of an organisation, you represent and warrant that you have the authority to bind that
            organisation to these Terms.
          </p>
          <p className="mt-3">
            If you do not agree to these Terms, do not access or use the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">2. Description of Service</h2>
          <p>
            AUDT is an AI-Native Trust, Risk &amp; Compliance Platform (Governance OS) that enables organisations
            to govern vendors, manage compliance frameworks, track risks, manage audits, and maintain continuous
            governance posture. The Service is provided as a software-as-a-service (SaaS) platform hosted on
            infrastructure located in India (Mumbai, ap-south-1 region).
          </p>
          <p className="mt-3">
            The Service includes, but is not limited to: Vendor Hub&#8482;, Evidence Vault&#8482;, Risk Lens&#8482;,
            Control Center&#8482;, Trust Intelligence&#8482;, Trust Score&#8482;, Governance Copilot&#8482;,
            and all other modules described in the platform documentation.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">3. Account Registration</h2>
          <p>
            To access the Service, you must register for an account. You agree to provide accurate, current, and
            complete information during registration and to update such information as necessary to keep it accurate.
            You are responsible for maintaining the confidentiality of your account credentials and for all
            activities that occur under your account.
          </p>
          <p className="mt-3">
            You must notify us immediately at <a href="mailto:security@audt.tech" className="text-[var(--color-blue)] hover:underline">security@audt.tech</a> of
            any unauthorised use of your account or any other breach of security. We are not liable for any
            loss or damage arising from your failure to protect your account credentials.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">4. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Violate any applicable law, regulation, or third-party rights;</li>
            <li>Upload, transmit, or distribute malicious code, malware, or any content that is harmful, fraudulent, or deceptive;</li>
            <li>Attempt to gain unauthorised access to the Service, other accounts, or related systems;</li>
            <li>Interfere with or disrupt the integrity or performance of the Service;</li>
            <li>Reverse engineer, decompile, or attempt to extract the source code of the Service;</li>
            <li>Resell, sublicense, or commercially exploit the Service without express written permission;</li>
            <li>Use the Service to process data in violation of applicable privacy laws, including the Digital Personal Data Protection Act 2023 (DPDP Act).</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">5. Subscription and Payment</h2>
          <p>
            Access to certain features of the Service requires a paid subscription. By subscribing, you agree to pay
            the applicable fees as described on our pricing page. All fees are exclusive of applicable taxes
            (including GST at 18% for Indian customers). Annual subscriptions are non-refundable except as
            required by applicable law or as stated in our refund policy.
          </p>
          <p className="mt-3">
            We reserve the right to modify pricing with thirty (30) days&rsquo; written notice. Continued use of the
            Service after a price change constitutes acceptance of the new pricing.
          </p>
          <p className="mt-3">
            Free trial accounts are subject to usage limits described at sign-up. We may terminate free trial
            accounts at any time without notice.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">6. Intellectual Property</h2>
          <p>
            The Service, including all software, algorithms, user interfaces, documentation, and content, is owned
            by AUDT and is protected by intellectual property laws. These Terms do not grant you any right, title, or
            interest in the Service beyond the limited licence to use it as described herein.
          </p>
          <p className="mt-3">
            You retain all rights to data you upload or input into the Service (&ldquo;Customer Data&rdquo;). By
            providing Customer Data, you grant AUDT a limited licence to process and store that data solely for the
            purpose of providing the Service. AUDT does not use Customer Data to train AI models.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">7. Data Processing and Privacy</h2>
          <p>
            Our collection and use of personal data in connection with the Service is described in our{" "}
            <Link href="/trust/privacy" className="text-[var(--color-blue)] hover:underline">Privacy Practices</Link> page.
            For enterprise customers, data processing is governed by the{" "}
            <Link href="/trust/dpa" className="text-[var(--color-blue)] hover:underline">Data Processing Agreement</Link>{" "}
            (DPA), which is incorporated into these Terms by reference.
          </p>
          <p className="mt-3">
            Customer Data is stored in India (Mumbai, ap-south-1 region) in compliance with applicable data
            localisation requirements, including the DPDP Act 2023. We do not transfer personal data outside
            India without appropriate safeguards.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">8. Service Availability</h2>
          <p>
            We aim to maintain high availability for the Service but do not guarantee uninterrupted access.
            Scheduled maintenance windows will be communicated with reasonable advance notice. Unplanned
            outages will be communicated via our status page.
          </p>
          <p className="mt-3">
            Support response commitments are described on our{" "}
            <Link href="/trust/support" className="text-[var(--color-blue)] hover:underline">Support &amp; Operations</Link> page
            and in the applicable Order Form for Enterprise customers.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">9. Confidentiality</h2>
          <p>
            Each party agrees to keep confidential any non-public information of the other party that is
            designated as confidential or should reasonably be understood to be confidential given the nature
            of the information. Confidentiality obligations do not apply to information that is publicly
            available, independently developed, or disclosed under legal compulsion.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, AUDT shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages, or any loss of profits, revenue, data, or
            business opportunities arising out of or related to these Terms or the Service.
          </p>
          <p className="mt-3">
            AUDT&rsquo;s total cumulative liability to you for all claims arising under or related to these Terms
            shall not exceed the greater of (a) the amount you paid for the Service in the twelve (12) months
            preceding the claim or (b) INR 10,000.
          </p>
          <p className="mt-3">
            These limitations apply regardless of the form of action and whether or not AUDT has been advised
            of the possibility of such damages.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">11. Termination</h2>
          <p>
            Either party may terminate these Terms at any time by providing written notice. We may suspend or
            terminate your access to the Service immediately if you violate these Terms, fail to pay applicable
            fees, or if we are required to do so by law.
          </p>
          <p className="mt-3">
            Upon termination, your right to access the Service ceases immediately. You may request an export
            of your Customer Data within thirty (30) days following termination. After that period, we may
            delete your data in accordance with our data retention policy.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">12. Governing Law and Disputes</h2>
          <p>
            These Terms are governed by the laws of India. Any dispute arising out of or relating to these
            Terms or the Service shall be resolved by binding arbitration in accordance with the Arbitration
            and Conciliation Act 1996, with the seat of arbitration in Bangalore, India. The language of
            arbitration shall be English.
          </p>
          <p className="mt-3">
            Nothing in this section prevents either party from seeking urgent injunctive relief from a court
            of competent jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">13. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you of material changes by email or
            by posting a notice on the Service at least thirty (30) days before the changes take effect.
            Your continued use of the Service after the effective date of revised Terms constitutes your
            acceptance of the changes.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">14. Contact</h2>
          <p>
            For questions about these Terms, contact us at:{" "}
            <a href="mailto:legal@audt.tech" className="text-[var(--color-blue)] hover:underline">legal@audt.tech</a>
          </p>
          <p className="mt-2 text-xs">
            AUDT &middot; Governance Built on Proof. &middot; audt.tech
          </p>
        </section>

        <div className="border-t border-[var(--color-line)] pt-8 flex flex-wrap gap-4 text-xs">
          <Link href="/trust" className="text-[var(--color-blue)] hover:underline">&#8592; Trust Center</Link>
          <Link href="/trust/dpa" className="text-[var(--color-blue)] hover:underline">Data Processing Agreement</Link>
          <Link href="/trust/privacy" className="text-[var(--color-blue)] hover:underline">Privacy Practices</Link>
          <Link href="/trust/contact" className="text-[var(--color-blue)] hover:underline">Security Contact</Link>
        </div>

      </div>
    </div>
  );
}
