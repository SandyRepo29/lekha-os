export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listConsents, getConsentMetrics } from "@/lib/services/privacy/privacy-service";
import { ConsentStatusBadge } from "@/components/privacy/privacy-badges";
import { PrivacyStat } from "@/components/privacy/privacy-ui";
import type { ConsentRecord } from "@/lib/db/schema";

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isExpiringSoon(d: Date | null | undefined) {
  if (!d) return false;
  const diff = new Date(d).getTime() - Date.now();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
}

export default async function ConsentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireUser();
  if (session.demo || !session.org) {
    return (
      <EmptyState
        icon={UserCheck}
        title="Consent Management™"
        description="Connect Supabase to view consent records."
      />
    );
  }

  const params = await searchParams;
  const [consents, metrics] = await Promise.all([
    listConsents(session.org.id, { status: params.status }),
    getConsentMetrics(session.org.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Consent Management™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            Track data subject consents under DPDP Act 2023
          </p>
        </div>
        <Link href="/dpdp-privacy/consents/new">
          <Button>
            <Plus className="h-4 w-4" /> Add Consent
          </Button>
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PrivacyStat
          label="Active (Granted)"
          value={metrics.active}
          accent={metrics.active > 0 ? "good" : "neutral"}
          href="/dpdp-privacy/consents?status=granted"
        />
        <PrivacyStat
          label="Expired"
          value={metrics.expired}
          accent={metrics.expired > 0 ? "warn" : "neutral"}
          href="/dpdp-privacy/consents?status=expired"
        />
        <PrivacyStat
          label="Withdrawn"
          value={metrics.withdrawn}
          accent={metrics.withdrawn > 0 ? "danger" : "neutral"}
          href="/dpdp-privacy/consents?status=withdrawn"
        />
        <PrivacyStat
          label="Pending"
          value={metrics.pending}
          accent={metrics.pending > 0 ? "warn" : "neutral"}
          href="/dpdp-privacy/consents?status=pending"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["all", "granted", "expired", "withdrawn", "pending", "rejected"].map((s) => (
          <Link
            key={s}
            href={
              s === "all"
                ? "/dpdp-privacy/consents"
                : `/dpdp-privacy/consents?status=${s}`
            }
            className="rounded-full border border-[var(--color-line)] bg-white px-3 py-1 text-xs capitalize hover:bg-[#F8F9FB] transition-colors"
          >
            {s === "all" ? "All" : s}
          </Link>
        ))}
      </div>

      {consents.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No consent records"
          description="Add consent records to track DPDP Act compliance."
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-xs text-[var(--color-ink-dim)]">
                  <th className="px-4 py-3 text-left font-medium">Subject</th>
                  <th className="px-4 py-3 text-left font-medium">Purpose</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Obtained</th>
                  <th className="px-4 py-3 text-left font-medium">Expires</th>
                  <th className="px-4 py-3 text-left font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {consents.map((c: ConsentRecord) => {
                  const expiringSoon = isExpiringSoon(c.expiresAt);
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-[var(--color-line)]/50 hover:bg-white transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{c.subjectName ?? c.subjectId}</p>
                        {c.subjectEmail && (
                          <p className="text-xs text-[var(--color-ink-dim)]">
                            {c.subjectEmail}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-xs text-[var(--color-ink-dim)] truncate">
                          {c.purpose}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <ConsentStatusBadge status={c.consentStatus} />
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">
                        {formatDate(c.obtainedAt)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span
                          className={
                            expiringSoon
                              ? "text-amber-400 font-semibold"
                              : "text-[var(--color-ink-dim)]"
                          }
                        >
                          {formatDate(c.expiresAt)}
                          {expiringSoon && " ⚠"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">
                        {c.source ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
