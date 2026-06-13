// Public verification page — no auth required
import { lookupCertificate } from "@/lib/services/trust-verification/trust-verification-service";
import { ShieldCheck, Award, CheckCircle, XCircle, ExternalLink } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `Verify ${id} — AUDT Trust Registry`,
    description: "Real-time verification of an AUDT Trust Certificate.",
  };
}

export default async function PublicVerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await lookupCertificate(id).catch(() => null);
  const cert = result?.cert;
  const program = result?.program;

  const isValid = cert?.status === "active" && cert?.expiresAt && new Date(cert.expiresAt) > new Date();

  return (
    <div className="min-h-screen bg-[#080b14] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        {/* AUDT branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-sm font-semibold mb-2">
            <ShieldCheck className="h-4 w-4 text-[#6366f1]" />
            AUDT Trust Verification Authority™
          </div>
          <p className="text-xs text-white/40">audt.tech — Governance Built on Proof.</p>
        </div>

        {cert ? (
          <div className={`rounded-2xl border p-6 ${isValid ? "border-emerald-500/30 bg-emerald-500/[0.05]" : "border-red-500/30 bg-red-500/[0.05]"}`}>
            {/* Status badge */}
            <div className="flex justify-center mb-6">
              <div className={`grid h-16 w-16 place-items-center rounded-full ${isValid ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                {isValid
                  ? <CheckCircle className="h-9 w-9 text-emerald-400" />
                  : <XCircle className="h-9 w-9 text-red-400" />
                }
              </div>
            </div>

            <div className="text-center mb-6">
              <div className={`text-xl font-bold mb-1 ${isValid ? "text-emerald-400" : "text-red-400"}`}>
                {isValid ? "Certificate Valid" : cert.status === "revoked" ? "Certificate Revoked" : "Certificate Expired"}
              </div>
              <div className="font-mono text-sm text-white/60">{cert.certificateNumber}</div>
            </div>

            {/* Certificate details */}
            <div className="rounded-xl bg-white/[0.06] p-4 space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Program</span>
                <span className="font-semibold">{program?.name ?? "AUDT Verified™"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Level</span>
                <span className="font-semibold">{cert.verificationLevel.replace("level_","Level ")}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Issued</span>
                <span>{new Date(cert.issuedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Expires</span>
                <span className={new Date(cert.expiresAt) < new Date() ? "text-red-400" : ""}>{new Date(cert.expiresAt).toLocaleDateString()}</span>
              </div>
              {cert.revocationReason && (
                <div className="flex items-start justify-between text-sm">
                  <span className="text-white/50">Revocation Reason</span>
                  <span className="text-red-400 text-right max-w-xs">{cert.revocationReason}</span>
                </div>
              )}
            </div>

            {/* Hash verification */}
            <div className="rounded-xl bg-white/[0.04] p-3 text-center">
              <div className="text-[11px] text-white/30 mb-1">Verification Hash</div>
              <div className="font-mono text-xs text-white/50">{cert.verificationHash}</div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-8 text-center">
            <XCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
            <div className="text-lg font-bold text-red-400 mb-2">Certificate Not Found</div>
            <p className="text-sm text-white/50">No certificate found for ID: <code className="font-mono">{id}</code></p>
            <p className="mt-2 text-xs text-white/30">This certificate may be invalid, expired, or the ID may be incorrect.</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-xs text-white/25">
            This page provides real-time certificate verification.{" "}
            <a href="https://audt.tech" className="text-[#6366f1] hover:underline">audt.tech</a>
          </p>
        </div>
      </div>
    </div>
  );
}
