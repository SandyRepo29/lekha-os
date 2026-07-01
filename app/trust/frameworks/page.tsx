import Link from "next/link";
import { FileCheck, CheckCircle, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Compliance Frameworks &#8212; AUDT Trust Center",
  description: "Compliance frameworks supported and designed for by the AUDT Governance OS.",
};

const frameworks = [
  {
    name: "ISO 27001:2022",
    badge: "93 Controls Mapped",
    badgeColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    description:
      "The international standard for information security management systems (ISMS). AUDT ships with 93 ISO 27001 controls pre-mapped across Evidence Vault&#8482;, Control Center&#8482;, and Audit Management.",
    capabilities: [
      "Full control library with effectiveness scoring",
      "Evidence mapping and gap analysis",
      "Audit program generation from control catalogue",
      "Continuous readiness score per framework",
    ],
  },
  {
    name: "SOC 2 Type II",
    badge: "33 Controls Mapped",
    badgeColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    description:
      "Service Organization Control 2 &#8212; Trust Services Criteria covering security, availability, processing integrity, confidentiality, and privacy. AUDT maps 33 SOC 2 controls and supports auditor collaboration via Auditor Collaboration&#8482;.",
    capabilities: [
      "Trust Services Criteria mapping",
      "Auditor Collaboration&#8482; &#8212; secure audit rooms for external auditors",
      "Evidence exchange and evidence request workflow",
      "Control test records and pass/fail history",
    ],
  },
  {
    name: "DPDP Act 2023",
    badge: "18 Controls Mapped",
    badgeColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    description:
      "India&#8217;s Digital Personal Data Protection Act 2023. AUDT&#8217;s DPDP Privacy&#8482; module tracks data assets, consent records, data subject requests, retention policies, privacy assessments, and cross-border data transfers.",
    capabilities: [
      "Data inventory and classification",
      "Consent management and audit trail",
      "Data Subject Request (DSR) workflow",
      "Retention policy enforcement",
      "Privacy Impact Assessments",
    ],
  },
  {
    name: "PCI DSS v4.0",
    badge: "12 Controls Mapped",
    badgeColor: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    description:
      "Payment Card Industry Data Security Standard. AUDT maps 12 PCI DSS controls and supports cardholder data environment scoping, control testing, and audit evidence collection.",
    capabilities: [
      "Cardholder data environment scoping",
      "Control effectiveness testing",
      "Evidence collection and storage",
      "Gap analysis against 12 requirements",
    ],
  },
  {
    name: "HIPAA",
    badge: "18 Controls Mapped",
    badgeColor: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    description:
      "Health Insurance Portability and Accountability Act &#8212; Administrative, Physical, and Technical Safeguards. AUDT maps 18 HIPAA controls spanning the Security Rule and Privacy Rule.",
    capabilities: [
      "Administrative and technical safeguard controls",
      "Risk analysis and risk management",
      "Breach notification workflow via Issue Hub&#8482;",
      "BAA-ready audit trail",
    ],
  },
  {
    name: "GDPR",
    badge: "Designed for",
    badgeColor: "text-violet-400 border-violet-500/30 bg-violet-500/10",
    description:
      "General Data Protection Regulation &#8212; EU data protection law. AUDT&#8217;s Privacy module, data subject request workflow, consent management, and data transfer tracking are designed to support GDPR Article 30 Records of Processing Activities (ROPA) and Chapter III data subject rights.",
    capabilities: [
      "Data processing register",
      "Data subject rights fulfilment",
      "Cross-border transfer documentation",
      "DPO-ready reporting",
    ],
  },
  {
    name: "EU AI Act",
    badge: "Designed for",
    badgeColor: "text-violet-400 border-violet-500/30 bg-violet-500/10",
    description:
      "The EU Artificial Intelligence Act &#8212; risk-based AI governance framework. AUDT&#8217;s AI Governance&#8482; module classifies AI systems by risk level, tracks controls, incidents, and compliance records against ISO 42001 and NIST AI RMF alongside EU AI Act requirements.",
    capabilities: [
      "AI system risk classification",
      "AI control library and testing",
      "Incident tracking and root cause",
      "ISO 42001 and NIST AI RMF alignment",
    ],
  },
  {
    name: "Regulatory Intelligence&#8482;",
    badge: "18 Built-in Regulations",
    badgeColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    description:
      "AUDT ships with 18 built-in regulations including GDPR, DPDP, HIPAA, PCI DSS, RBI CSF, SEBI CSCRF, IRDAI ICS, DORA, NIS2, SOX, and more. Regulatory Intelligence&#8482; monitors changes, extracts obligations, and auto-generates compliance alerts.",
    capabilities: [
      "18 global regulations pre-loaded",
      "Regulatory change monitor with severity classification",
      "Obligation extraction and tracking",
      "AI-powered Compliance Horizon&#8482; forecast",
    ],
  },
];

export default function FrameworksPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)]">
        <Link href="/trust" className="hover:text-[var(--color-ink)] transition">Trust Center</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[var(--color-ink)]">Compliance Frameworks</span>
      </nav>

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[#F8F9FB]">
          <FileCheck className="h-4.5 w-4.5 text-[var(--color-blue)]" />
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--color-ink)]">
          Compliance Frameworks
        </h1>
      </div>
      <p className="mb-10 text-[var(--color-ink-dim)]">
        AUDT ships with pre-mapped controls, evidence templates, and audit programmes for the most
        widely used governance and data protection frameworks. Customers can also create custom frameworks
        with any control structure.
      </p>

      <div className="space-y-5">
        {frameworks.map((f) => (
          <div
            key={f.name}
            className="rounded-2xl border border-[var(--color-line)] bg-white p-6"
          >
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2
                className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-ink)]"
                dangerouslySetInnerHTML={{ __html: f.name }}
              />
              <span
                className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium ${f.badgeColor}`}
                dangerouslySetInnerHTML={{ __html: f.badge }}
              />
            </div>
            <p
              className="mb-4 text-sm text-[var(--color-ink-dim)]"
              dangerouslySetInnerHTML={{ __html: f.description }}
            />
            <ul className="space-y-1.5">
              {f.capabilities.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm text-[var(--color-ink-dim)]">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span dangerouslySetInnerHTML={{ __html: c }} />
                </li>
              ))}
            </ul>
          </div>
        ))}
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
