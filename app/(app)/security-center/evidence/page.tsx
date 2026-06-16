export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getEvidenceSecurityOverview } from "@/lib/services/security-command-center/security-service";
import { SecSubNav, SecStat, StatusBadge } from "@/components/security-command-center/sec-ui";
import { RevokeShareButton } from "@/components/security-command-center/sec-actions";
import { createEvidenceShareAction } from "@/lib/security-command-center/actions";
import { Shield, Eye, Download, Clock } from "lucide-react";

export default async function EvidenceSecurityPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const data = await getEvidenceSecurityOverview(orgId).catch(() => null);
  const shares = (data?.shares ?? []) as Record<string, unknown>[];
  const accessLogs = (data?.accessLogs ?? []) as Record<string, unknown>[];

  const activeShares = shares.filter(s => !s.revoked && new Date(String(s.expires_at)) > new Date()).length;

  return (
    <div className="space-y-6 p-6">
      <SecSubNav />
      <div className="pt-2">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Evidence Securityâ„¢</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Watermarking, secure shares, expiring access links, and evidence access audit trail.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SecStat label="Total Shares"    value={shares.length}   accent="neutral" />
        <SecStat label="Active Shares"   value={activeShares}    accent={activeShares > 0 ? "warn" : "good"} />
        <SecStat label="Revoked Shares"  value={shares.filter(s => s.revoked).length}  accent="neutral" />
        <SecStat label="Access Events"   value={accessLogs.length} accent="neutral" />
      </div>

      {/* Watermarking Banner */}
      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-5">
        <div className="flex items-start gap-4">
          <Shield className="mt-0.5 h-6 w-6 shrink-0 text-violet-400" />
          <div>
            <div className="font-semibold text-sm text-violet-400">Evidence Watermarkingâ„¢ â€” Active</div>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)] leading-relaxed">
              All evidence shared through AUDT is automatically watermarked with the recipient name, organization, and timestamp. Downloads are tracked in the audit trail.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              {["Include User Name", "Include Organization", "Include Timestamp"].map(f => (
                <div key={f} className="flex items-center gap-1.5 text-violet-400">
                  <Shield className="h-3 w-3" /> {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Share Form */}
      <div className="space-y-3">
        <h2 className="font-semibold">Create Secure Evidence Share</h2>
        <form action={createEvidenceShareAction.bind(null, undefined) as unknown as (fd: FormData) => void} className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-4 sm:grid-cols-3">
          <input name="recipientEmail" placeholder="Recipient email" type="email"
            className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50" />
          <input name="recipientName" placeholder="Recipient name"
            className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/50" />
          <select name="accessLevel"
            className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm outline-none">
            <option value="view_only">View Only</option>
            <option value="download">Allow Download</option>
          </select>
          <select name="expiryDays"
            className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm outline-none">
            <option value="1">Expires in 1 day</option>
            <option value="7">Expires in 7 days</option>
            <option value="30">Expires in 30 days</option>
          </select>
          <select name="watermark"
            className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm outline-none">
            <option value="true">Watermark: On</option>
            <option value="false">Watermark: Off</option>
          </select>
          <button type="submit" className="rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow">
            Create Share
          </button>
        </form>
      </div>

      {/* Active Shares */}
      {shares.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Evidence Shares</h2>
          <div className="rounded-2xl border border-[var(--color-line)] divide-y divide-[var(--color-line)] overflow-hidden">
            {shares.map(s => (
              <div key={String(s.id)} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-4">
                  {String(s.access_level) === "view_only"
                    ? <Eye className="h-4 w-4 text-[var(--color-ink-dim)]" />
                    : <Download className="h-4 w-4 text-[var(--color-ink-dim)]" />
                  }
                  <div>
                    <div className="font-medium">{String(s.recipient_email ?? s.recipient_name ?? "Anonymous")}</div>
                    <div className="text-xs text-[var(--color-ink-dim)] flex items-center gap-2">
                      <span className="capitalize">{String(s.access_level).replace("_", " ")}</span>
                      <span>Â·</span>
                      <Clock className="h-3 w-3" />
                      <span>Expires {new Date(String(s.expires_at)).toLocaleDateString()}</span>
                      <span>Â· {Number(s.view_count)} views</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!!s.watermark && <span className="text-[10px] text-violet-400 border border-violet-500/30 rounded-full px-2 py-0.5">Watermarked</span>}
                  <StatusBadge status={s.revoked ? "revoked" : "active"} />
                  {!s.revoked && <RevokeShareButton id={String(s.id)} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Access Log */}
      {accessLogs.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Evidence Access Log</h2>
          <div className="rounded-2xl border border-[var(--color-line)] divide-y divide-[var(--color-line)] overflow-hidden">
            {accessLogs.slice(0, 20).map(log => (
              <div key={String(log.id)} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[var(--color-ink-dim)]">{String(log.ip_address ?? "â€”")}</span>
                  <div>
                    <span className="font-medium capitalize">{String(log.action)}</span>
                    {!!log.full_name && <span className="text-[var(--color-ink-dim)]"> by {String(log.full_name)}</span>}
                  </div>
                </div>
                <span className="text-xs text-[var(--color-ink-dim)]">{new Date(String(log.created_at)).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



