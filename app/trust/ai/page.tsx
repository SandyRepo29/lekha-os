import Link from "next/link";
import { Bot, CheckCircle, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Responsible AI — AUDT Trust Center",
  description: "How AUDT uses AI responsibly — no training on customer data, human-in-the-loop, and full auditability.",
};

export default function AiPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)]">
        <Link href="/trust" className="hover:text-[var(--color-ink)] transition">Trust Center</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[var(--color-ink)]">Responsible AI</span>
      </nav>

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[#F8F9FB]">
          <Bot className="h-4.5 w-4.5 text-[var(--color-blue)]" />
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--color-ink)]">
          Responsible AI
        </h1>
      </div>
      <p className="mb-10 text-[var(--color-ink-dim)]">
        AUDT uses AI to help compliance and risk teams work faster — not to replace human judgement.
        Every AI output is advisory. Every decision requires a human.
      </p>

      <div className="space-y-6">
        {/* AI model */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)] mb-3">
            AI Model &amp; Provider
          </h2>
          <div className="space-y-2">
            {[
              ["Model", "Google Gemini 2.5 Flash"],
              ["Provider", "Google AI Studio / Vertex AI"],
              ["Integration", "@google/genai SDK — imported only in lib/providers/ai/"],
              ["Data retention", "Google does not retain prompt data for model training under the AUDT API agreement"],
              ["Data residency", "Prompts are processed by Google infrastructure — not stored in AUDT&#8217;s India region"],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                <span className="w-36 shrink-0 text-xs font-medium uppercase tracking-wider text-[var(--color-ink-dim)]" dangerouslySetInnerHTML={{ __html: label }} />
                <span className="text-sm text-[var(--color-ink)]" dangerouslySetInnerHTML={{ __html: value }} />
              </div>
            ))}
          </div>
        </div>

        {/* No training guarantee */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)] mb-3">
            Zero Training Guarantee
          </h2>
          <p className="text-sm text-[var(--color-ink-dim)] mb-4">
            AUDT&#8217;s AI is powered by Google Gemini via the API. Under API terms, customer data submitted
            to the Gemini API is not used to train or improve Google&#8217;s models.
          </p>
          <ul className="space-y-2">
            {[
              "Your vendor data is never used to train any AI model",
              "Your compliance frameworks and evidence are never shared with Google for training",
              "Audit logs, risk registers, and contract data are never used as training data",
              "AI-generated outputs are not sent back to improve the model",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[var(--color-ink-dim)]">
                <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Human in the loop */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)] mb-3">
            Human-in-the-Loop by Design
          </h2>
          <p className="text-sm text-[var(--color-ink-dim)] mb-4">
            AI in AUDT generates recommendations, summaries, and draft content. No AI action is autonomous —
            every AI output requires a human to review, accept, or reject before it takes effect.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["AI Risk Findings", "AI drafts; human reviews and saves"],
              ["CAPA Suggestions", "AI suggests 3 options; human selects and creates"],
              ["Renewal Recommendation", "AI scores; human makes final decision"],
              ["Gap Analysis", "AI identifies; human reviews severity and assigns owner"],
              ["Control Narrative", "AI writes; human approves before use in audit evidence"],
              ["Agent Actions", "AI proposes; human must approve via Approval Queue"],
            ].map(([feature, rule]) => (
              <div key={feature} className="rounded-xl border border-[var(--color-line)] bg-white px-4 py-3">
                <div className="text-xs font-semibold text-[var(--color-ink)]">{feature}</div>
                <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">{rule}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI audit trail */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)] mb-3">
            AI Audit Trail
          </h2>
          <p className="text-sm text-[var(--color-ink-dim)] mb-4">
            AUDT&#8217;s Security Command Center™ records every AI prompt with sensitivity classification,
            PII detection, and user attribution. Enterprise administrators can review all AI interactions.
          </p>
          <ul className="space-y-2">
            {[
              "Every AI prompt is logged with timestamp, user, and module context",
              "Sensitivity classification: clean · low · medium · high · blocked",
              "PII detection — prompts flagged when personal data patterns are detected",
              "Blocked prompts tracked — 30-day usage statistics available to admins",
              "ai_prompt_logs table — org-scoped, RLS enforced, not accessible cross-tenant",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[var(--color-ink-dim)]">
                <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        </div>

        {/* EU AI Act */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)] mb-3">
            EU AI Act Alignment
          </h2>
          <p className="text-sm text-[var(--color-ink-dim)] mb-4">
            AUDT&#8217;s AI use cases fall in the minimal risk or limited risk tiers under the EU AI Act.
            AUDT also provides an AI Governance™ module to help customers manage their own AI systems
            against EU AI Act, ISO 42001, and NIST AI RMF requirements.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Risk classification", "Minimal / limited risk — all uses are advisory"],
              ["Transparency", "AI-generated content is clearly labelled in the UI"],
              ["Human oversight", "No autonomous decisions — human approval required"],
              ["Accountability", "Full audit trail with user attribution"],
              ["Model card", "Gemini 2.5 Flash — Google&#8217;s published model documentation"],
              ["Customer AI governance", "AI Governance™ module manages customer AI inventories"],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5 rounded-xl border border-[var(--color-line)] bg-white px-4 py-3">
                <span className="text-xs font-semibold text-[var(--color-ink)]" dangerouslySetInnerHTML={{ __html: label }} />
                <span className="text-xs text-[var(--color-ink-dim)] mt-0.5" dangerouslySetInnerHTML={{ __html: value }} />
              </div>
            ))}
          </div>
        </div>

        {/* Caching policy */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)] mb-3">
            AI Output Caching Policy
          </h2>
          <p className="text-sm text-[var(--color-ink-dim)] mb-3">
            AUDT caches AI-generated summaries and reports to reduce latency and cost. Cached outputs are
            stored in the ai_compliance_insights table (org-scoped, RLS enforced) and refreshed on demand.
          </p>
          <div className="space-y-1.5">
            {[
              ["Executive summaries", "24-hour TTL — refresh via the Refresh button in the UI"],
              ["Per-entity narratives", "24-hour TTL — risk narratives, control summaries"],
              ["Advisory outputs", "24-hour TTL — Regulatory Advisor, AI Governance Copilot"],
              ["Chat responses", "Not cached — each turn is a live API call"],
            ].map(([type, policy]) => (
              <div key={type} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                <span className="w-48 shrink-0 text-xs font-medium text-[var(--color-ink-dim)]" dangerouslySetInnerHTML={{ __html: type }} />
                <span className="text-sm text-[var(--color-ink)]" dangerouslySetInnerHTML={{ __html: policy }} />
              </div>
            ))}
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
