export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { FileText, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { resolveToken } from "@/lib/repositories/portal-repo";
import { findById } from "@/lib/repositories/vendor-repo";
import { listByVendor } from "@/lib/repositories/document-repo";
import { listByVendor as listRequests } from "@/lib/repositories/request-repo";
import { PortalUpload } from "@/components/portal/portal-upload";

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await resolveToken(token);
  if (!session) notFound();

  const [vendor, docs, requests] = await Promise.all([
    findById(session.orgId, session.vendorId),
    listByVendor(session.orgId, session.vendorId),
    listRequests(session.orgId, session.vendorId),
  ]);
  if (!vendor) notFound();

  const openRequests = requests.filter((r) => r.status === "requested");
  const expiring = docs.filter((d) => d.status === "expiring" || d.status === "expired");

  return (
    <div className="min-h-screen" style={{ background: "#06070d", color: "#e8eaf2" }}>
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="font-bold text-lg" style={{ fontFamily: "var(--font-display)", color: "#6366f1" }}>LEKHA OS</div>
          <div className="text-xs text-white/40">Vendor Compliance Portal</div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-sm">{vendor.name}</div>
          <div className="text-xs text-white/40">Compliance self-service</div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
        {/* Welcome */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h1 className="text-xl font-bold mb-1">Welcome, {vendor.name}</h1>
          <p className="text-sm text-white/50">
            Use this portal to upload compliance documents and respond to document requests.
            Your uploads go directly to your customer's compliance team.
          </p>
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-white/60"><FileText className="h-4 w-4" /> {docs.length} documents on file</div>
            {openRequests.length > 0 && <div className="flex items-center gap-1.5 text-amber-400"><AlertTriangle className="h-4 w-4" /> {openRequests.length} pending request{openRequests.length > 1 ? "s" : ""}</div>}
            {expiring.length > 0 && <div className="flex items-center gap-1.5 text-red-400"><AlertTriangle className="h-4 w-4" /> {expiring.length} expiring</div>}
          </div>
        </div>

        {/* Pending requests */}
        {openRequests.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-3">Requested documents</h2>
            <div className="space-y-3">
              {openRequests.map((r) => (
                <div key={r.id} className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
                  <div className="font-semibold text-sm text-amber-300">{r.documentType}</div>
                  {r.message && <p className="text-xs text-white/50 mt-1">{r.message}</p>}
                  {r.dueDate && <p className="text-xs text-white/40 mt-1">Due: {r.dueDate}</p>}
                  <p className="text-xs text-white/40 mt-2">Upload below to fulfil this request.</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upload */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-3">Upload a document</h2>
          <PortalUpload
            orgId={session.orgId}
            vendorId={session.vendorId}
            token={token}
          />
        </section>

        {/* Documents on file */}
        {docs.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40 mb-3">Documents on file</h2>
            <div className="space-y-2">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  {d.status === "valid" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{d.documentType}</div>
                    <div className="text-xs text-white/40">{d.expiresOn ? `Expires ${d.expiresOn}` : "No expiry"}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.status === "valid" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"}`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="text-center py-8 text-xs text-white/20">
        Powered by Lekha OS · This link expires in 30 days
      </footer>
    </div>
  );
}
