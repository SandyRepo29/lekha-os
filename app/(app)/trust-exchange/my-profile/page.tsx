export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getOrCreateProfile, getDashboardMetrics } from "@/backend/src/modules/trust-exchange/trust-exchange-service";
import { generateTrustSummary } from "@/backend/src/modules/trust-exchange/ai-trust-exchange-service";
import { TrustProfileForm } from "@/components/trust-exchange/trust-profile-form";
import { Card } from "@/components/ui/card";
import { Globe, CheckCircle2, AlertCircle } from "lucide-react";

export default async function MyTrustProfilePage() {
  const session = await requireUser();
  if (!session.org) return null;
  const orgId = session.org.id;

  const [profile, metrics] = await Promise.all([
    getOrCreateProfile(orgId),
    getDashboardMetrics(orgId),
  ]);

  const aiSummary = await generateTrustSummary(orgId, {
    displayName: profile.displayName,
    trustScore: profile.trustScore,
    totalDocuments: metrics.totalDocuments,
    verifiedDocuments: metrics.verifiedDocuments,
    activeBadges: metrics.activeBadges,
    completedQuestionnaires: metrics.completedQuestionnaires,
    isPublished: metrics.isPublished,
    profileCompleteness: metrics.profileCompleteness,
  }).catch(() => "");

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">My Trust Profile™</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">
          Your public-facing trust identity on the AUDT Exchange.
        </p>
      </div>

      <Card className="p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {metrics.isPublished ? (
            <CheckCircle2 className="h-5 w-5 text-green-700" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-700" />
          )}
          <div>
            <p className="text-sm font-medium">
              {metrics.isPublished ? "Profile is live on the Trust Directory" : "Profile is private — not visible in directory"}
            </p>
            <p className="text-xs text-[var(--color-ink-dim)]">
              {metrics.profileCompleteness}% complete · {metrics.totalDocuments} docs · {metrics.activeBadges} badges
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Globe className="h-4 w-4 text-[var(--color-ink-dim)]" />
          <span className="text-[var(--color-ink-dim)] capitalize">{profile.visibility}</span>
        </div>
      </Card>

      {aiSummary && (
        <Card className="p-5 border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.04]">
          <p className="text-xs font-semibold text-[var(--color-blue)] uppercase tracking-wide mb-2">AI Trust Assessment</p>
          <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">{aiSummary}</p>
        </Card>
      )}

      <TrustProfileForm profile={profile} isPublished={metrics.isPublished} />
    </div>
  );
}
