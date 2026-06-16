export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getTrustCenterOverview } from "@/lib/services/security-command-center/security-service";
import { SecSubNav, SecStat, StatusBadge } from "@/components/security-command-center/sec-ui";
import { updateTrustCenterAction } from "@/lib/security-command-center/actions";
import { Globe, Shield, FileText, Star, CheckCircle } from "lucide-react";

export default async function TrustCenterPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const data = await getTrustCenterOverview(orgId).catch(() => null);
  const config = data?.config;
  const documents = data?.documents ?? [];

  const FEATURES = [
    { icon: Star,     label: "Live Trust Scoreâ„¢",    desc: "Real-time Org Trust Scoreâ„¢ powered by AUDT" },
    { icon: Shield,   label: "Trust Certificatesâ„¢",  desc: "AUDT Verifiedâ„¢, Privacy Readyâ„¢, AI Governedâ„¢" },
    { icon: FileText, label: "Security Documents",   desc: "SOC 2, ISO 27001, DPDP reports" },
    { icon: Globe,    label: "Custom Domain",         desc: "trust.yourcompany.com or subdomain" },
  ];

  return (
    <div className="space-y-6 p-6">
      <SecSubNav />
      <div className="pt-2">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Trust Centerâ„¢</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Customer-facing public trust portal â€” publish your security posture, certifications, and documents.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SecStat label="Status"         value={config?.enabled ? "Published" : "Draft"} accent={config?.enabled ? "good" : "warn"} />
        <SecStat label="Trust Documents" value={documents.length} accent="neutral" />
        <SecStat label="Published"      value={config?.publishedAt ? new Date(config.publishedAt).toLocaleDateString() : "Not yet"} accent="neutral" />
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FEATURES.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-4">
            <Icon className="h-5 w-5 text-[var(--color-blue)] mb-2" />
            <div className="text-sm font-semibold">{label}</div>
            <div className="mt-1 text-[11px] text-[var(--color-ink-dim)]">{desc}</div>
          </div>
        ))}
      </div>

      {/* Configure Form */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-5 space-y-4">
        <h2 className="font-semibold">Configure Trust Center</h2>
        <form action={updateTrustCenterAction.bind(null, undefined) as unknown as (fd: FormData) => void} className="grid gap-3 sm:grid-cols-2">
          <input name="title" defaultValue={config?.title ?? ""} placeholder="Trust Center title (e.g. Acme Security)"
            className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50" />
          <input name="securityEmail" defaultValue={config?.securityEmail ?? ""} placeholder="security@yourcompany.com"
            className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50" />
          <input name="tagline" defaultValue={config?.tagline ?? ""} placeholder="Tagline (e.g. Security you can verify)"
            className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50" />
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="hidden" name="showTrustScore" value="false" />
              <input type="checkbox" name="showTrustScore" value="true" defaultChecked={config?.showTrustScore !== false} className="rounded" />
              Show Trust Score
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="hidden" name="showCertifications" value="false" />
              <input type="checkbox" name="showCertifications" value="true" defaultChecked={config?.showCertifications !== false} className="rounded" />
              Show Certs
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="hidden" name="showDocuments" value="false" />
              <input type="checkbox" name="showDocuments" value="true" defaultChecked={config?.showDocuments !== false} className="rounded" />
              Show Docs
            </label>
          </div>
          <textarea name="description" defaultValue={config?.description ?? ""} placeholder="Description for visitors"
            rows={3}
            className="col-span-2 rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50 resize-none" />
          <div className="col-span-2 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="hidden" name="enabled" value="false" />
              <input type="checkbox" name="enabled" value="true" defaultChecked={config?.enabled} className="rounded" />
              Publish Trust Center (make publicly accessible)
            </label>
            <button type="submit" className="rounded-xl grad-brand px-6 py-2 text-sm font-semibold text-white shadow">
              Save
            </button>
          </div>
        </form>
      </div>

      {/* Preview URL */}
      {config?.enabled && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 flex items-center gap-3">
          <Globe className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-emerald-400">Trust Center Published</div>
            <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">
              Your public trust portal is live. Share it with customers, auditors, and partners.
            </div>
          </div>
          <a href="/trust-center/public" className="ml-auto rounded-xl border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors">
            View Public Page
          </a>
        </div>
      )}
    </div>
  );
}

