export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getDashboardMetrics, getOrCreateProfile } from "@/lib/services/trust-exchange/trust-exchange-service";
import { TrustExchangeAiChat } from "@/components/trust-exchange/trust-exchange-ai-chat";

export default async function TrustExchangeAiPage() {
  const session = await requireUser();
  if (!session.org) return null;
  const orgId = session.org.id;

  const [metrics, profile] = await Promise.all([
    getDashboardMetrics(orgId),
    getOrCreateProfile(orgId),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">AI Trust Analyst™</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">
          Ask about your trust posture, gaps in documentation, vendor comparisons, and Exchange strategy.
        </p>
      </div>
      <TrustExchangeAiChat
        context={{
          displayName: profile.displayName,
          trustScore: profile.trustScore,
          totalDocuments: metrics.totalDocuments,
          verifiedDocuments: metrics.verifiedDocuments,
          activeBadges: metrics.activeBadges,
          completedQuestionnaires: metrics.completedQuestionnaires,
          isPublished: metrics.isPublished,
        }}
      />
    </div>
  );
}
