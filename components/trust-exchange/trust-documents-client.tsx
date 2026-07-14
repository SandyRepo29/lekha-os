"use client";

import { useState, useActionState, useTransition } from "react";
import { addDocumentAction, deleteDocumentAction, verifyDocumentAction } from "@/backend/src/modules/trust-exchange/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Plus, CheckCircle2, Shield, Trash2, X, Globe, Lock, Users } from "lucide-react";
import type { TrustDocument } from "@/lib/db/schema";

const DOC_TYPES = [
  "soc2", "iso27001", "iso27701", "pci_dss", "hipaa", "dpdp",
  "cyber_insurance", "pen_test", "dpa", "security_whitepaper",
  "sig_questionnaire", "caiq", "custom",
];

const DOC_TYPE_LABELS: Record<string, string> = {
  soc2: "SOC 2", iso27001: "ISO 27001", iso27701: "ISO 27701", pci_dss: "PCI DSS",
  hipaa: "HIPAA", dpdp: "DPDP", cyber_insurance: "Cyber Insurance", pen_test: "Pen Test Report",
  dpa: "DPA", security_whitepaper: "Security Whitepaper", sig_questionnaire: "SIG Questionnaire",
  caiq: "CAIQ", custom: "Custom",
};

const VISIBILITY_ICONS: Record<string, React.ElementType> = {
  private: Lock, specific: Users, network: Users, public: Globe,
};

const VISIBILITY_COLORS: Record<string, string> = {
  private: "text-slate-700 bg-slate-100",
  specific: "text-blue-700 bg-blue-100",
  network: "text-indigo-700 bg-indigo-100",
  public: "text-green-700 bg-green-100",
};

function isExpired(expiryDate: string | null | undefined) {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

function isExpiringSoon(expiryDate: string | null | undefined) {
  if (!expiryDate) return false;
  const d = new Date(expiryDate);
  const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff > 0 && diff <= 30;
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function TrustDocumentsClient({ docs }: { docs: TrustDocument[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [addState, addAction, addPending] = useActionState(addDocumentAction, null);
  const [deleting, startDelete] = useTransition();
  const [verifying, startVerify] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-ink-dim)]">{docs.length} document{docs.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Document
        </Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <Card className="p-5 border-[var(--color-blue)]/30">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-sm">Add Trust Document</p>
            <button onClick={() => setShowAdd(false)}><X className="h-4 w-4 text-[var(--color-ink-dim)]" /></button>
          </div>
          <form action={addAction} className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Document Type *</label>
                <select name="docType" required className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-blue)]">
                  {DOC_TYPES.map((t) => <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Title *</label>
                <Input name="title" required placeholder="e.g. ISO 27001 Certificate 2024" />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Issuer</label>
                <Input name="issuer" placeholder="e.g. BSI Group" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Issued Date</label>
                <Input name="issuedDate" type="date" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Expiry Date</label>
                <Input name="expiryDate" type="date" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Description</label>
                <Input name="description" placeholder="Brief description" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Visibility</label>
                <select name="visibility" className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-blue)]">
                  <option value="private">Private</option>
                  <option value="specific">Specific customers</option>
                  <option value="network">Trust Network</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>
            {addState?.error && <p className="text-sm text-red-700">{addState.error}</p>}
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" disabled={addPending}>{addPending ? "Adding…" : "Add Document"}</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Document list */}
      {docs.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-[var(--color-ink-faint)] mx-auto mb-3" />
          <p className="font-medium">No documents yet</p>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">Upload your first trust document to start sharing.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => {
            const VisIcon = VISIBILITY_ICONS[doc.visibility] ?? Lock;
            const expired = isExpired(doc.expiryDate);
            const expiringSoon = isExpiringSoon(doc.expiryDate);
            return (
              <Card key={doc.id} className="p-4 flex items-center gap-4 flex-wrap">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-blue-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{doc.title}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-[var(--color-ink-dim)]">{DOC_TYPE_LABELS[doc.docType] ?? doc.docType}</span>
                    {doc.isVerified && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${VISIBILITY_COLORS[doc.visibility]}`}>
                      <VisIcon className="h-3 w-3" /> {doc.visibility}
                    </span>
                    {expired && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Expired</span>}
                    {expiringSoon && !expired && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Expiring soon</span>}
                  </div>
                  <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">
                    {doc.issuer ? `${doc.issuer} · ` : ""}
                    {doc.issuedDate ? `Issued ${formatDate(doc.issuedDate)}` : ""}
                    {doc.expiryDate ? ` · Expires ${formatDate(doc.expiryDate)}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!doc.isVerified && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={verifying}
                      onClick={() => { startVerify(async () => { await verifyDocumentAction(doc.id); }); }}
                    >
                      <Shield className="h-3.5 w-3.5 mr-1" /> Verify
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={deleting}
                    onClick={() => { startDelete(async () => { await deleteDocumentAction(doc.id); }); }}
                    className="text-red-700 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
