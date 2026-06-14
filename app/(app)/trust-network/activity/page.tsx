export const dynamic = "force-dynamic";

import {
  Globe, Shield, Star, Users, MessageSquare, CheckCircle2,
  Activity, TrendingUp, Award, Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getNetworkActivity } from "@/lib/services/trust-network/trust-network-service";
import { TrustNetworkStat } from "@/components/trust-network/trust-network-ui";

const ACTIVITY_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  profile_created:       { icon: Globe,        color: "text-blue-400",   label: "Profile Created" },
  profile_updated:       { icon: Globe,        color: "text-blue-400",   label: "Profile Updated" },
  document_shared:       { icon: Shield,       color: "text-indigo-400", label: "Document Shared" },
  document_verified:     { icon: CheckCircle2, color: "text-green-400",  label: "Document Verified" },
  badge_issued:          { icon: Award,        color: "text-yellow-400", label: "Badge Issued" },
  badge_revoked:         { icon: Award,        color: "text-red-400",    label: "Badge Revoked" },
  relationship_created:  { icon: Users,        color: "text-purple-400", label: "Relationship Created" },
  questionnaire_answered:{ icon: MessageSquare,color: "text-pink-400",   label: "Questionnaire Answered" },
  verification_requested:{ icon: Shield,       color: "text-orange-400", label: "Verification Requested" },
  trust_score_increased: { icon: TrendingUp,   color: "text-green-400",  label: "Trust Score Increased" },
  certification_added:   { icon: Star,         color: "text-yellow-400", label: "Certification Added" },
};

function activityDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function TrustActivityPage() {
  const session = await requireUser();
  if (!session.org) return null;
  const orgId = session.org.id;

  const activity = await getNetworkActivity(orgId, 50);

  const byCat = activity.reduce<Record<string, number>>((acc, a) => {
    const cat = ACTIVITY_CONFIG[a.activityType]?.label ?? a.activityType;
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Trust Activity Feed™</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">
          Network-wide trust events for your organization.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TrustNetworkStat label="Total Events"    value={activity.length} accent="neutral" />
        <TrustNetworkStat label="Trust Milestones" value={activity.filter((a) => a.activityType.includes("verified") || a.activityType.includes("badge")).length} accent="good" />
        <TrustNetworkStat label="Network Events"  value={activity.filter((a) => a.activityType.includes("relationship")).length} accent="neutral" />
        <TrustNetworkStat label="Event Types"     value={Object.keys(byCat).length} accent="neutral" />
      </div>

      {/* Activity feed */}
      <div>
        <h2 className="text-base font-semibold mb-3">Activity Timeline</h2>
        {activity.length === 0 ? (
          <Card className="p-12 text-center">
            <Activity className="h-10 w-10 mx-auto text-[var(--color-ink-faint)] mb-3" />
            <p className="font-semibold text-[var(--color-ink-dim)]">No activity yet</p>
            <p className="text-sm text-[var(--color-ink-faint)] mt-1">
              Trust activity will appear here as your network grows.
            </p>
          </Card>
        ) : (
          <Card className="divide-y divide-[var(--color-line)]">
            {activity.map((a) => {
              const cfg = ACTIVITY_CONFIG[a.activityType] ?? { icon: Zap, color: "text-[var(--color-ink-dim)]", label: a.activityType };
              const Icon = cfg.icon;
              return (
                <div key={a.id} className="flex items-start gap-4 px-4 py-3.5">
                  <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{cfg.label}</p>
                    <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">{a.description ?? a.activityType.replace(/_/g, " ")}</p>
                    <p className="text-xs text-[var(--color-ink-faint)] mt-1">
                      {activityDate(a.createdAt)}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-[var(--color-ink-faint)] whitespace-nowrap">
                    {new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}
