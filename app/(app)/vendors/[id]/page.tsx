export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Download, Sparkles, Pencil, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/app-shell/score-ring";
import { DocumentUpload } from "@/components/vendors/document-upload";
import { DocumentActions } from "@/components/vendors/document-actions";
import { DocumentEdit } from "@/components/vendors/document-edit";
import { DeleteVendor } from "@/components/vendors/delete-vendor";
import { ComplianceBreakdown } from "@/components/vendors/compliance-breakdown";
import { VendorStatus } from "@/components/vendors/vendor-status";
import { VendorNotes } from "@/components/vendors/vendor-notes";
import { requireUser } from "@/lib/auth/session";
import { getVendor } from "@/lib/services/vendor-service";
import { listForVendor } from "@/lib/services/document-service";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { createSignedUrl } from "@/lib/storage/server";
import { riskTone, docStatusTone } from "@/lib/ui-maps";

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireUser();
  if (session.demo || !session.org) notFound();

  const vendor = await getVendor(session.org.id, id);
  if (!vendor) notFound();

  const docs = await listForVendor(session.org.id, id);
  const urls = await Promise.all(docs.map((d) => d.storagePath ? createSignedUrl(d.storagePath) : null));

  const expiredCount = docs.filter((d) => d.status === "expired").length;
  const expiringCount = docs.filter((d) => d.status === "expiring").length;

  return (
    <div className="space-y-5">
      <Link href="/vendors" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">
        <ArrowLeft className="h-4 w-4" /> Back to vendors
      </Link>

      {/* Header card */}
      <Card className="flex flex-wrap items-start gap-5 p-6">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-xl font-bold text-[var(--color-ink-dim)]">
          {vendor.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">{vendor.name}</h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            {vendor.category ?? "—"}{vendor.contactEmail ? ` · ${vendor.contactEmail}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <VendorStatus vendorId={vendor.id} current={vendor.status} />
            <Badge tone={riskTone(vendor.riskLevel)}>{vendor.riskLevel} risk</Badge>
            {expiredCount > 0 && <Badge tone="danger">{expiredCount} expired</Badge>}
            {expiringCount > 0 && <Badge tone="warn">{expiringCount} expiring</Badge>}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-ink-faint)]">
            <Clock className="h-3.5 w-3.5" />
            Added {new Date(vendor.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            {vendor.contactEmail && <span className="ml-1">· {vendor.contactEmail}</span>}
          </div>
        </div>
        <div className="shrink-0 text-center">
          <ScoreRing value={vendor.complianceScore} size={104} />
          <div className="mt-1 text-xs text-[var(--color-ink-faint)]">Compliance score</div>
        </div>
        <div className="flex shrink-0 gap-2 self-start">
          <Link href={`/vendors/${vendor.id}/edit`}>
            <Button variant="outline" size="sm"><Pencil className="h-4 w-4" /> Edit</Button>
          </Link>
          <DeleteVendor vendorId={vendor.id} vendorName={vendor.name} />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Left: Documents + Notes */}
        <div className="space-y-5">
          <Card>
            <div className="flex items-center justify-between border-b border-[var(--color-line)] p-5">
              <h2 className="font-[family-name:var(--font-display)] font-semibold">
                Documents <span className="text-[var(--color-ink-faint)]">({docs.length})</span>
              </h2>
              <span className="flex items-center gap-1.5 text-xs text-[var(--color-ink-faint)]">
                <Sparkles className="h-3.5 w-3.5 text-[var(--color-blue)]" />
                {isGeminiConfigured() ? "AI extraction on" : "AI extraction off"}
              </span>
            </div>

            {docs.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[var(--color-ink-dim)]">
                No documents yet. Upload certifications, policies or evidence below.
              </p>
            ) : (
              <div className="divide-y divide-[var(--color-line)]">
                {docs.map((d, i) => {
                  const ex = (d.extracted ?? {}) as { issuer?: string | null; summary?: string | null };
                  return (
                    <div key={d.id} className="flex items-start gap-3 px-5 py-3.5">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-ink-faint)]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold">{d.documentType}</span>
                          <Badge tone={docStatusTone(d.status)}>{d.status}</Badge>
                        </div>
                        <div className="mt-0.5 text-xs text-[var(--color-ink-faint)]">
                          {ex.issuer ? `${ex.issuer} · ` : ""}
                          {d.issuedOn ? `Issued ${d.issuedOn} · ` : ""}
                          {d.expiresOn ? `Expires ${d.expiresOn}` : "No expiry recorded"}
                        </div>
                        {ex.summary && <p className="mt-1 text-xs italic text-[var(--color-ink-faint)]">{ex.summary}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {urls[i] && (
                          <a href={urls[i]!} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-[var(--color-blue)] hover:underline">
                            <Download className="h-3.5 w-3.5" /> Open
                          </a>
                        )}
                        <DocumentEdit
                          documentId={d.id}
                          documentType={d.documentType}
                          issuedOn={d.issuedOn}
                          expiresOn={d.expiresOn}
                        />
                        <DocumentActions documentId={d.id} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border-t border-[var(--color-line)] p-5">
              <DocumentUpload orgId={session.org.id} vendorId={vendor.id} />
            </div>
          </Card>

          {/* Notes */}
          <Card className="p-5">
            <VendorNotes vendorId={vendor.id} notes={vendor.notes} />
          </Card>
        </div>

        {/* Right: Compliance breakdown */}
        <Card className="p-5">
          <ComplianceBreakdown risk={vendor.riskLevel} currentScore={vendor.complianceScore} docs={docs} />
        </Card>
      </div>
    </div>
  );
}
