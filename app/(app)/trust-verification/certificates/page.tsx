export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getCertificates } from "@/lib/services/trust-verification/trust-verification-service";
import { Award, CheckCircle, ExternalLink, ShieldCheck } from "lucide-react";
import { CertificateStatusBadge } from "@/components/trust-verification/verification-ui";

export default async function CertificatesPage() {
  const session = await requireUser();
  const certs = await getCertificates(session.org?.id ?? "").catch(() => []);
  const active = certs.filter((c: any) => c.status === "active");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Trust Certificates™</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Issued trust certificates — each publicly verifiable with a unique certificate ID and QR code.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">{active.length} Active</span>
        </div>
      </div>

      {certs.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {certs.map((cert: any) => {
            const isActive = cert.status === "active";
            const isExpired = cert.status === "expired";
            return (
              <div key={cert.id} className={`rounded-2xl border p-5 ${
                isActive ? "border-emerald-500/20 bg-emerald-500/[0.03]" :
                isExpired ? "border-[var(--color-line)] bg-[var(--color-bg-2)]/40 opacity-60" :
                "border-red-500/20 bg-red-500/[0.03]"
              }`}>
                {/* Certificate header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--color-blue)]/10">
                    <Award className="h-6 w-6 text-[var(--color-blue)]" />
                  </div>
                  <CertificateStatusBadge status={cert.status} />
                </div>

                <div className="mb-3">
                  <div className="font-mono text-xs font-semibold text-[var(--color-blue)] mb-1">{cert.certificateNumber}</div>
                  <div className="font-semibold text-sm">{(cert.certificateData as any)?.programName ?? "Trust Certificate"}</div>
                  <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">{cert.verificationLevel.replace("level_","Level ")}</div>
                </div>

                <div className="space-y-1 text-xs text-[var(--color-ink-dim)] mb-4">
                  <div>Issued: {new Date(cert.issuedAt).toLocaleDateString()}</div>
                  <div>Expires: {new Date(cert.expiresAt).toLocaleDateString()}</div>
                  <div className="font-mono text-[10px] text-[var(--color-ink-faint)]">Hash: {cert.verificationHash}</div>
                </div>

                <div className="flex gap-2">
                  <a href={cert.publicUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] py-1.5 text-xs font-medium hover:bg-[#F8F9FB]">
                    <ExternalLink className="h-3 w-3" /> Verify
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] p-12 text-center">
          <Award className="mx-auto mb-4 h-10 w-10 text-[var(--color-ink-faint)]" />
          <div className="text-sm font-medium mb-1">No certificates issued yet</div>
          <p className="text-xs text-[var(--color-ink-dim)] mb-4">Certificates are issued automatically when a verification application is approved.</p>
          <Link href="/trust-verification/applications/new" className="inline-flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white">
            <ShieldCheck className="h-4 w-4" /> Apply for Verification
          </Link>
        </div>
      )}
    </div>
  );
}
