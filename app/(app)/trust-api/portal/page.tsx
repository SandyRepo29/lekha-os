export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { Code2, Terminal, BookOpen, Globe, Key, Webhook, ChevronRight } from "lucide-react";

const QUICKSTART = [
  { step: "1", title: "Get an API Key", desc: "Issue a Trust API key from the Keys page.", href: "/trust-api/keys" },
  { step: "2", title: "Browse the Catalog", desc: "Choose which Trust API product to integrate.", href: "/trust-api/catalog" },
  { step: "3", title: "Make your first call", desc: "Use Bearer auth with your tap_ key.", href: null },
  { step: "4", title: "Subscribe to Webhooks", desc: "Get real-time trust event notifications.", href: "/trust-api/webhooks" },
];

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/public/trust-score",       desc: "Org Trust Score™ + components + trend" },
  { method: "GET", path: "/api/v1/public/vendor-trust",      desc: "Vendor trust scores + risk + verification" },
  { method: "GET", path: "/api/v1/public/ai-trust",          desc: "AI Trust Score™ + governance maturity" },
  { method: "GET", path: "/api/v1/public/benchmarking",      desc: "Industry percentile + peer comparison" },
  { method: "GET", path: "/api/v1/public/verification",      desc: "Trust badges + certification status" },
  { method: "GET", path: "/api/v1/public/trust-network",     desc: "Public trust profile + reputation" },
  { method: "GET", path: "/api/v1/developer/usage",          desc: "API usage analytics for your key" },
  { method: "POST", path: "/api/v1/webhooks",                desc: "Trigger webhook events" },
];

const SDK_SAMPLE = `// TypeScript — @audt/sdk (coming soon)
import AUDT from '@audt/sdk';

const client = new AUDT({
  apiKey: process.env.AUDT_API_KEY, // tap_xxxxx
});

// Get org Trust Score™
const score = await client.trustScore.get();
console.log(score.orgTrustScore); // 82

// Get vendor trust data
const vendors = await client.vendorTrust.list({ minScore: 70 });

// Subscribe to webhooks
client.webhooks.on('trust.score.updated', async (event) => {
  console.log('Trust updated:', event.data);
});`;

const CURL_SAMPLE = `# Get your Trust Score™
curl -X GET \\
  https://audt.tech/api/v1/public/trust-score \\
  -H "Authorization: Bearer tap_your_api_key_here" \\
  -H "Content-Type: application/json"

# Response
{
  "data": {
    "orgTrustScore": 82,
    "level": "Strong",
    "components": { "vendorTrust": 78, "riskPosture": 85 },
    "snapshotDate": "2026-06-13"
  },
  "meta": { "generated_at": "2026-06-13T10:00:00Z" }
}`;

export default async function DeveloperPortalPage() {
  await requireUser();

  return (
    <div className="space-y-8 p-6">
      <div>
        <div className="mb-1 text-xs text-[var(--color-ink-faint)]">
          <Link href="/trust-api" className="hover:underline">Trust API Platform™</Link> / Developer Portal™
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Developer Portal™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
          Everything you need to integrate AUDT trust data into your applications.
        </p>
      </div>

      {/* Quickstart */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h2 className="mb-4 font-semibold">Quickstart</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICKSTART.map(({ step, title, desc, href }) => (
            <div key={step} className="relative rounded-xl border border-[var(--color-line)]/60 bg-white/[0.02] p-4">
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-blue)]/20 text-xs font-bold text-[var(--color-blue)]">{step}</div>
              <div className="font-medium text-sm">{title}</div>
              <p className="mt-1 text-xs text-[var(--color-ink-dim)]">{desc}</p>
              {href && (
                <Link href={href} className="mt-2 flex items-center gap-1 text-[11px] text-[var(--color-blue)] hover:underline">
                  Go <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* API Reference */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-[var(--color-blue)]" />
            <h2 className="font-semibold">API Reference</h2>
          </div>
          <div className="space-y-2">
            {ENDPOINTS.map(({ method, path, desc }) => (
              <div key={path} className="flex items-start gap-3 rounded-xl border border-[var(--color-line)]/40 bg-white/[0.02] px-3 py-2.5">
                <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  method === "GET" ? "bg-emerald-500/15 text-emerald-400" : "bg-blue-500/15 text-blue-400"
                }`}>{method}</span>
                <div>
                  <code className="text-xs font-mono text-[var(--color-ink-dim)]">{path}</code>
                  <p className="text-[11px] text-[var(--color-ink-faint)]">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-[var(--color-line)]/40 bg-white/[0.02] p-3">
            <div className="text-xs font-semibold text-[var(--color-ink-dim)]">Authentication</div>
            <code className="mt-1 block text-[11px] font-mono text-[var(--color-blue)]">
              Authorization: Bearer tap_your_key_here
            </code>
          </div>
        </div>

        {/* Code Samples */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <h3 className="font-semibold text-sm">cURL Example</h3>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-black/30 p-4 text-[11px] font-mono text-[var(--color-ink-dim)] leading-relaxed whitespace-pre-wrap">
              {CURL_SAMPLE}
            </pre>
          </div>

          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Code2 className="h-4 w-4 text-[var(--color-blue)]" />
              <h3 className="font-semibold text-sm">TypeScript SDK (Coming Soon)</h3>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-black/30 p-4 text-[11px] font-mono text-[var(--color-ink-dim)] leading-relaxed whitespace-pre-wrap">
              {SDK_SAMPLE}
            </pre>
          </div>
        </div>
      </div>

      {/* SDK Roadmap */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h2 className="mb-4 font-semibold">SDK Availability Roadmap</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { lang: "TypeScript", status: "Phase 1", color: "text-blue-400" },
            { lang: "Python",     status: "Phase 1", color: "text-yellow-400" },
            { lang: "Java",       status: "Phase 2", color: "text-orange-400" },
            { lang: "Go",         status: "Phase 2", color: "text-cyan-400" },
            { lang: "C#",         status: "Phase 2", color: "text-violet-400" },
          ].map(({ lang, status, color }) => (
            <div key={lang} className="rounded-xl border border-[var(--color-line)]/60 bg-white/[0.02] p-3 text-center">
              <div className={`font-semibold text-sm ${color}`}>{lang}</div>
              <div className="mt-1 text-[10px] text-[var(--color-ink-faint)]">{status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Partner integrations */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h2 className="mb-4 font-semibold">Partner Integration Examples</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
          {["SAP Ariba", "Coupa", "ServiceNow", "Jira", "Salesforce", "Microsoft", "Google", "Oracle", "Workday"].map(name => (
            <div key={name} className="rounded-xl border border-[var(--color-line)]/60 bg-white/[0.02] px-2 py-3 text-center text-[11px] font-medium text-[var(--color-ink-dim)]">
              {name}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--color-ink-faint)]">
          Trust API data flows into procurement systems, ERP platforms, and ITSM tools to enable trust-aware workflows.
        </p>
      </div>
    </div>
  );
}
