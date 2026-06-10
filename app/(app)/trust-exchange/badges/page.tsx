export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { listBadges } from "@/lib/services/trust-exchange/trust-exchange-service";
import { TrustBadgesClient } from "@/components/trust-exchange/trust-badges-client";

export default async function TrustBadgesPage() {
  const session = await requireUser();
  if (!session.org) return null;
  const badges = await listBadges(session.org.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trust Badges™</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">
          Earned trust indicators displayed on your public Trust Profile.
        </p>
      </div>
      <TrustBadgesClient badges={badges} />
    </div>
  );
}
