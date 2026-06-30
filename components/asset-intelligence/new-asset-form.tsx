"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createAssetAction } from "@/lib/asset-intelligence/actions";

type AssetTypeRow = { id: string; name: string };

export function NewAssetForm({ assetTypes }: { assetTypes: AssetTypeRow[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<any, FormData>(createAssetAction as any, undefined);

  useEffect(() => {
    if ((state as any)?.data) router.push("/asset-intelligence/registry");
  }, [state, router]);

  return (
    <form action={action} className="space-y-5 max-w-2xl">
      {(state as any)?.error && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-400">{(state as any).error}</p>
      )}

      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5 space-y-4">
        <h2 className="font-semibold text-sm">Asset Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1">Name <span className="text-red-400">*</span></label>
            <input name="name" required className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:border-[var(--color-blue)] outline-none" placeholder="Customer Portal" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1">Asset Type</label>
            <select name="assetType" className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:border-[var(--color-blue)] outline-none">
              <option value="application">Application</option>
              <option value="database">Database</option>
              <option value="api">API</option>
              <option value="server">Server</option>
              <option value="cloud_resource">Cloud Resource</option>
              <option value="data_asset">Data Asset</option>
              <option value="business_process">Business Process</option>
              <option value="ai_system">AI System</option>
              <option value="vendor_service">Vendor Service</option>
              <option value="network_asset">Network Asset</option>
              <option value="endpoint">Endpoint</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1">Description</label>
          <textarea name="description" rows={2} className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:border-[var(--color-blue)] outline-none resize-none" placeholder="Brief description of this asset..." />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1">Environment</label>
            <select name="environment" className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:border-[var(--color-blue)] outline-none">
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
              <option value="testing">Testing</option>
              <option value="sandbox">Sandbox</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1">Criticality</label>
            <select name="criticality" className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:border-[var(--color-blue)] outline-none">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
              <option value="mission_critical">Mission Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1">Data Classification</label>
            <select name="dataClass" className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:border-[var(--color-blue)] outline-none">
              <option value="">— Select —</option>
              <option value="public">Public</option>
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
              <option value="restricted">Restricted</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1">Business Unit</label>
            <input name="businessUnit" className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:border-[var(--color-blue)] outline-none" placeholder="Engineering" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1">Location / Region</label>
            <input name="location" className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:border-[var(--color-blue)] outline-none" placeholder="ap-south-1 / Mumbai" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1">Technology Stack</label>
            <input name="technologyStack" className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:border-[var(--color-blue)] outline-none" placeholder="Next.js, Supabase, TypeScript" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1">Cloud Provider</label>
            <input name="cloudProvider" className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:border-[var(--color-blue)] outline-none" placeholder="AWS / Azure / GCP" />
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="containsPii" value="true" className="rounded" />
            <span>Contains PII</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="containsSensitive" value="true" className="rounded" />
            <span>Contains Sensitive Data</span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1">Notes</label>
          <textarea name="notes" rows={2} className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm focus:border-[var(--color-blue)] outline-none resize-none" placeholder="Additional notes..." />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={pending}
          className="rounded-xl bg-[var(--color-blue)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
          {pending ? "Adding…" : "Add Asset"}
        </button>
        <a href="/asset-intelligence/registry"
          className="rounded-xl border border-[var(--color-line)] px-6 py-2.5 text-sm font-medium hover:bg-[#F8F9FB] transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}
