import Link from "next/link";
import {
  Shield,
  Lock,
  Server,
  Globe,
  Eye,
  Bot,
  FileCheck,
  Activity,
  Mail,
} from "lucide-react";

export const metadata = {
  title: "Trust Center &#8212; AUDT",
  description: "Security, compliance, and data protection at AUDT. Governance Built on Proof.",
};

const cards = [
  {
    href: "/trust/architecture",
    icon: Server,
    title: "Security Architecture",
    desc: "Multi-tenant isolation, zero-trust auth, layered defense, and India data residency.",
  },
  {
    href: "/trust/frameworks",
    icon: FileCheck,
    title: "Compliance Frameworks",
    desc: "ISO 27001, SOC 2, DPDP, PCI DSS, HIPAA, GDPR, and EU AI Act support.",
  },
  {
    href: "/trust/encryption",
    icon: Lock,
    title: "Encryption",
    desc: "AES-256-GCM at rest, TLS 1.3 in transit, bcrypt for secrets, HSTS preload.",
  },
  {
    href: "/trust/data-protection",
    icon: Shield,
    title: "Data Protection",
    desc: "Row-Level Security on every table, tenant isolation, DPDP readiness, export and deletion.",
  },
  {
    href: "/trust/privacy",
    icon: Eye,
    title: "Privacy",
    desc: "What we collect, what we never do, customer data ownership, and right to erasure.",
  },
  {
    href: "/trust/ai",
    icon: Bot,
    title: "Responsible AI",
    desc: "Gemini 2.5 Flash, no training on customer data, human-in-the-loop, audit trail.",
  },
  {
    href: "/trust/contact",
    icon: Mail,
    title: "Security Contact",
    desc: "Responsible disclosure policy, bug bounty, PGP key, and 24-hour acknowledgement SLA.",
  },
  {
    href: "https://status.audt.tech",
    icon: Activity,
    title: "Uptime & Status",
    desc: "Real-time service health, incident history, and SLA commitments.",
    external: true,
  },
  {
    href: "/trust/architecture#api",
    icon: Globe,
    title: "API Security",
    desc: "Bearer auth, bcrypt API keys, rate limiting, and versioned REST endpoints.",
  },
];

export default function TrustPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      {/* Hero */}
      <div className="mb-14 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-[var(--color-ink-dim)]">
          <Shield className="h-3.5 w-3.5 text-[var(--color-blue)]" />
          Trust &amp; Security Center
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-[var(--color-ink)] md:text-5xl">
          Trust &amp; Security at AUDT
        </h1>
        <p className="mt-4 text-lg text-[var(--color-ink-dim)]">
          Governance Built on Proof.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-[var(--color-ink-dim)]">
          AUDT is an AI-Native Trust, Risk &amp; Compliance Platform designed for regulated industries.
          This page documents our security architecture, compliance posture, data protection practices,
          and responsible AI principles.
        </p>
      </div>

      {/* Trust badges */}
      <div className="mb-12 flex flex-wrap justify-center gap-3">
        {[
          { label: "India Data Residency", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
          { label: "AES-256-GCM Encryption", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
          { label: "RLS on 259+ Tables", color: "text-violet-400 border-violet-500/30 bg-violet-500/10" },
          { label: "DPDP Ready", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
          { label: "TLS 1.3 + HSTS", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
        ].map((b) => (
          <span
            key={b.label}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${b.color}`}
          >
            {b.label}
          </span>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ href, icon: Icon, title, desc, external }) => (
          <Link
            key={href}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="group flex flex-col gap-3 rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-6 transition hover:bg-white/[0.04] hover:border-[var(--color-blue)]/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-line)] bg-white/[0.03] group-hover:border-[var(--color-blue)]/40">
              <Icon className="h-5 w-5 text-[var(--color-blue)]" />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)] group-hover:text-[var(--color-blue)] transition">
                {title}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-ink-dim)]">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-8 text-center">
        <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
          Questions about our security practices?
        </h3>
        <p className="mt-2 text-sm text-[var(--color-ink-dim)]">
          Reach our security team at any time.
        </p>
        <a
          href="mailto:security@audt.tech"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--color-blue)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Mail className="h-4 w-4" />
          security@audt.tech
        </a>
      </div>
    </div>
  );
}
