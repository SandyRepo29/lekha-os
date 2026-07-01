import Link from "next/link";
import { LifeBuoy, Clock, AlertTriangle, Shield, Activity, MessageSquare } from "lucide-react";

export const metadata = {
  title: "Support & Operations — AUDT",
  description: "AUDT support channels, SLA commitments, incident reporting, and service operations.",
};

const SLA_TIERS = [
  {
    plan: "Growth",
    support: "Email Support",
    initial: "Next Business Day",
    followUp: "3 Business Days",
    resolution: "Best effort",
    hours: "Business hours",
  },
  {
    plan: "Business",
    support: "Priority Email",
    initial: "Within 8 Business Hours",
    followUp: "2 Business Days",
    resolution: "5 Business Days",
    hours: "Business hours",
    featured: true,
  },
  {
    plan: "Enterprise",
    support: "Dedicated Support",
    initial: "Within 1 Business Hour",
    followUp: "Same Business Day",
    resolution: "Contractual SLA",
    hours: "24 / 5 (critical: 24 / 7)",
  },
];

const SEVERITY_LEVELS = [
  {
    level: "P1 — Critical",
    color: "text-red-400 border-red-500/30 bg-red-500/10",
    definition: "Platform unavailable or data loss risk. All users blocked.",
    response: "1 business hour (Enterprise) / 4 hours (Business)",
    target: "4 hours",
  },
  {
    level: "P2 — High",
    color: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    definition: "Major feature unavailable. Significant user impact, no workaround.",
    response: "4 business hours (Enterprise) / Next business day (Business)",
    target: "1 business day",
  },
  {
    level: "P3 — Medium",
    color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    definition: "Feature degraded. Workaround available.",
    response: "Next business day",
    target: "5 business days",
  },
  {
    level: "P4 — Low",
    color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    definition: "Minor issue or question. No significant user impact.",
    response: "3 business days",
    target: "Best effort",
  },
];

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      {/* Hero */}
      <div className="mb-12">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-1.5 text-xs font-medium text-[var(--color-ink-dim)]">
          <LifeBuoy className="h-3.5 w-3.5 text-[var(--color-blue)]" />
          Support &amp; Operations
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--color-ink)]">
          Support &amp; Service Operations
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-[var(--color-ink-dim)]">
          AUDT support channels, response commitments, incident procedures, and service operations.
          Enterprise procurement teams can use this page to evaluate our support capabilities.
        </p>
      </div>

      {/* Support Channels */}
      <section className="mb-12">
        <h2 className="mb-6 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-ink)]">Support Channels</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: MessageSquare,
              title: "Email Support",
              handle: "support@audt.tech",
              href: "mailto:support@audt.tech",
              desc: "Primary support channel for all plans.",
            },
            {
              icon: Shield,
              title: "Security Issues",
              handle: "security@audt.tech",
              href: "mailto:security@audt.tech",
              desc: "Security vulnerabilities, data concerns, breach reports.",
            },
            {
              icon: Activity,
              title: "Status Page",
              handle: "status.audt.tech",
              href: "https://status.audt.tech",
              desc: "Real-time service health and incident updates.",
              external: true,
            },
          ].map(({ icon: Icon, title, handle, href, desc, external }) => (
            <a
              key={title}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="group flex flex-col gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-5 transition hover:bg-[#F0F4F9] hover:border-[var(--color-blue)]/40"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] group-hover:border-[var(--color-blue)]/40">
                <Icon className="h-4 w-4 text-[var(--color-blue)]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--color-ink)]">{title}</div>
                <div className="text-xs text-[var(--color-blue)] mt-0.5">{handle}</div>
                <div className="mt-1.5 text-xs text-[var(--color-ink-dim)]">{desc}</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* SLA Table */}
      <section className="mb-12">
        <h2 className="mb-2 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-ink)]">Support SLA by Plan</h2>
        <p className="mb-6 text-sm text-[var(--color-ink-dim)]">
          Business hours are 09:00–18:00 IST, Monday through Friday, excluding Indian public holidays.
        </p>
        <div className="overflow-auto rounded-2xl border border-[var(--color-line)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] bg-[#F8F9FB]">
                <th className="px-5 py-4 text-left font-semibold text-[var(--color-ink)]">Plan</th>
                <th className="px-5 py-4 text-left font-semibold text-[var(--color-ink)]">Support Type</th>
                <th className="px-5 py-4 text-left font-semibold text-[var(--color-ink)]">Initial Response</th>
                <th className="px-5 py-4 text-left font-semibold text-[var(--color-ink)]">Follow-up</th>
                <th className="px-5 py-4 text-left font-semibold text-[var(--color-ink)]">Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {SLA_TIERS.map((tier) => (
                <tr
                  key={tier.plan}
                  className={tier.featured ? "bg-[var(--color-blue)]/5" : ""}
                >
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      tier.plan === "Enterprise"
                        ? "bg-violet-500/15 text-violet-300"
                        : tier.featured
                        ? "bg-[var(--color-blue)]/15 text-[var(--color-blue)]"
                        : "bg-[#E8EDF5] text-[var(--color-ink)]"
                    }`}>
                      {tier.plan}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[var(--color-ink-dim)]">{tier.support}</td>
                  <td className="px-5 py-4 font-medium text-[var(--color-ink)]">{tier.initial}</td>
                  <td className="px-5 py-4 text-[var(--color-ink-dim)]">{tier.followUp}</td>
                  <td className="px-5 py-4 text-[var(--color-ink-dim)]">{tier.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-[var(--color-ink-dim)]">
          Enterprise SLA commitments are documented in the Order Form and supersede the defaults above.
        </p>
      </section>

      {/* Severity Levels */}
      <section className="mb-12">
        <h2 className="mb-2 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-ink)]">Issue Severity Classification</h2>
        <p className="mb-6 text-sm text-[var(--color-ink-dim)]">
          When submitting a support request, indicate the severity level. Response times apply to the
          initial acknowledgement, not to full resolution.
        </p>
        <div className="space-y-3">
          {SEVERITY_LEVELS.map((s) => (
            <div
              key={s.level}
              className="flex flex-col gap-2 rounded-xl border border-[var(--color-line)] bg-white p-4 sm:flex-row sm:items-start sm:gap-4"
            >
              <span className={`inline-flex shrink-0 items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${s.color}`}>
                {s.level}
              </span>
              <div className="flex-1">
                <p className="text-sm text-[var(--color-ink)]">{s.definition}</p>
                <p className="mt-1 text-xs text-[var(--color-ink-dim)]">
                  <span className="font-medium text-[var(--color-ink)]">Response:</span> {s.response}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Enterprise */}
      <section className="mb-12">
        <h2 className="mb-6 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-ink)]">Enterprise Support</h2>
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              {
                icon: Clock,
                title: "Dedicated Customer Success Manager",
                desc: "Enterprise accounts receive a named CSM for onboarding, quarterly reviews, and escalation management.",
              },
              {
                icon: AlertTriangle,
                title: "Escalation Process",
                desc: "P1 issues are escalated to engineering within 30 minutes. Customers receive a dedicated Slack channel or WhatsApp thread for critical incidents.",
              },
              {
                icon: Shield,
                title: "Security Contact",
                desc: "Direct access to the AUDT security team for vulnerability reports, compliance inquiries, and security questionnaire reviews.",
              },
              {
                icon: Activity,
                title: "Incident Communication",
                desc: "Status page updates within 15 minutes of incident declaration. Post-incident reports (PIR) within 5 business days for P1 incidents.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[#F8F9FB]">
                  <Icon className="h-4 w-4 text-[var(--color-blue)]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--color-ink)]">{title}</div>
                  <div className="mt-1 text-xs text-[var(--color-ink-dim)]">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Responsible Disclosure */}
      <section className="mb-12">
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-bold text-[var(--color-ink)]">Security &amp; Responsible Disclosure</h2>
        <p className="text-sm text-[var(--color-ink-dim)]">
          We welcome responsible disclosure of security vulnerabilities. Report security issues to{" "}
          <a href="mailto:security@audt.tech" className="text-[var(--color-blue)] hover:underline">security@audt.tech</a>.
          We commit to acknowledging receipt within 24 hours and providing an initial assessment within
          5 business days. We will not pursue legal action against researchers acting in good faith.
        </p>
        <p className="mt-3 text-sm text-[var(--color-ink-dim)]">
          Full responsible disclosure policy, scope, and reporting guidelines are available at{" "}
          <Link href="/trust/contact" className="text-[var(--color-blue)] hover:underline">Trust Center &rarr; Security Contact</Link>.
        </p>
      </section>

      {/* Footer links */}
      <div className="border-t border-[var(--color-line)] pt-8 flex flex-wrap gap-4 text-xs text-[var(--color-ink-dim)]">
        <Link href="/trust" className="text-[var(--color-blue)] hover:underline">← Trust Center</Link>
        <Link href="/trust/terms" className="hover:text-[var(--color-ink)] transition">Terms of Service</Link>
        <Link href="/trust/dpa" className="hover:text-[var(--color-ink)] transition">Data Processing Agreement</Link>
        <Link href="/trust/contact" className="hover:text-[var(--color-ink)] transition">Security Contact</Link>
        <a href="https://status.audt.tech" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-ink)] transition">Status Page</a>
      </div>
    </div>
  );
}
