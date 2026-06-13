export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Network, Globe, Star, Users, TrendingUp, Zap, Shield, BarChart3,
  ArrowRight, CheckCircle2, AlertCircle, Cpu, Activity,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getNetworkDashboard, getNetworkActivity } from "@/lib/services/trust-network/trust-network-service";
import { TrustNetworkStat } from "@/components/trust-network/trust-network-ui";

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  profile_created: Globe, profile_updated: Globe, document_shared: Shield,
  document_verified: CheckCircle2, badge_issued: Star, relationship_created: Users,
  questionnaire_answered: Activity, verification_requested: Shield,
};

export default async function TrustNetworkDashboard() {
  const session = await requireUser();
  if (!session.org) return null;
  const orgId = session.org.id;

  const [dashboard, activity] = await Promise.all([
    getNetworkDashboard(orgId),
    getNetworkActivity(orgId, 8),
  ]);

  const { reputation, metrics, benchmarking, automation, profile } = dashboard;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Trust Network™</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">
            Public Trust Infrastructure — your organization&apos;s verified trust story.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/trust-network/directory" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-line)] text-sm font-semibold hover:bg-white/[0.04] transition-colors">
            <Globe className="h-4 w-4" /> Network Directory
          </Link>
          <Link href="/trust-network/profile" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-blue)] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            Public Profile <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Reputation banner */}
      <Card className="p-6 border-[var(--color-blue)]/30 bg-gradient-to-r from-[var(--color-blue)]/[0.06] to-purple-500/[0.04]">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-blue)]/20 flex items-center justify-center flex-shrink-0">
              <Network className="h-8 w-8 text-[var(--color-blue)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-ink-dim)] font-medium">Trust Network Reputation™</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-4xl font-black ${reputation.color}`}>{reputation.score}</span>
                <span className="text-sm text-[var(--color-ink-dim)]">/ 100</span>
              </div>
              <p className={`text-sm font-semibold mt-0.5 ${reputation.color}`}>{reputation.level}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold">{metrics.profileViews30d}</p>
              <p className="text-xs text-[var(--color-ink-dim)]">Profile Views (30d)</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.followerCount}</p>
              <p className="text-xs text-[var(--color-ink-dim)]">Network Followers</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.activeRelationships}</p>
              <p className="text-xs text-[var(--color-ink-dim)]">Trust Relationships</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {metrics.isPublished ? (
              <span className="flex items-center gap-1.5 text-sm text-green-400 font-medium">
                <CheckCircle2 className="h-4 w-4" /> Published
              </span>
            ) : (
              <Link href="/trust-exchange/my-profile" className="flex items-center gap-1.5 text-sm text-yellow-400 font-medium hover:opacity-80">
                <AlertCircle className="h-4 w-4" /> Publish Profile
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <TrustNetworkStat label="Profile Views (30d)"  value={metrics.profileViews30d}    accent="neutral" sub="Last 30 days" />
        <TrustNetworkStat label="Network Followers"    value={metrics.followerCount}       accent="neutral" />
        <TrustNetworkStat label="Trust Badges"         value={metrics.activeBadges}        accent={metrics.activeBadges > 0 ? "good" : "neutral"} href="/trust-exchange/badges" />
        <TrustNetworkStat label="Relationships"        value={metrics.activeRelationships} accent="neutral" href="/trust-network/relationships" />
        <TrustNetworkStat label="Industry Rank"        value={benchmarking.percentile > 0 ? `${benchmarking.percentile}th` : "—"} accent={benchmarking.percentile >= 75 ? "good" : benchmarking.percentile >= 50 ? "neutral" : "warn"} sub="Percentile" />
        <TrustNetworkStat label="Automation Coverage"  value={`${automation.automationPct}%`} accent={automation.automationPct >= 60 ? "good" : automation.automationPct >= 30 ? "warn" : "danger"} />
      </div>

      {/* Three pillars */}
      <div className="grid md:grid-cols-3 gap-5">
        {/* Governance Maturity */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold text-sm">Governance Maturity™</h3>
          </div>
          <div className="space-y-2">
            {[1,2,3,4,5,6].map((lvl) => {
              const labels = ["Reactive","Managed","Defined","Measured","Optimized","Trust Leader"];
              const current = benchmarking.maturityLevel.level;
              return (
                <div key={lvl} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${lvl < current ? "bg-emerald-500/20 text-emerald-400" :
                      lvl === current ? "bg-[var(--color-blue)] text-white shadow-[0_0_10px_rgba(99,102,241,.5)]" :
                      "bg-white/5 text-[var(--color-ink-faint)]"}`}>
                    {lvl}
                  </div>
                  <span className={`text-sm ${lvl === current ? "text-[var(--color-ink)] font-semibold" : "text-[var(--color-ink-dim)]"}`}>
                    {labels[lvl-1]}
                  </span>
                  {lvl === current && <span className="ml-auto text-xs text-[var(--color-blue)] font-medium">You</span>}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Industry Ranking */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold text-sm">Industry Ranking™</h3>
          </div>
          {benchmarking.percentile > 0 ? (
            <div className="space-y-4">
              <div className="text-center py-3">
                <p className="text-4xl font-black text-[var(--color-blue)]">{benchmarking.percentile}th</p>
                <p className="text-sm text-[var(--color-ink-dim)] mt-1">Industry Percentile</p>
              </div>
              <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full grad-brand" style={{ width: `${benchmarking.percentile}%` }} />
              </div>
              <div className="flex justify-between text-xs text-[var(--color-ink-faint)]">
                <span>Bottom 10%</span>
                <span>Top 10%</span>
              </div>
              {benchmarking.overallScore && (
                <div className="pt-2 border-t border-[var(--color-line)]">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-ink-dim)]">Governance Score</span>
                    <span className="font-semibold">{benchmarking.overallScore}/100</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-[var(--color-ink-dim)]">No benchmark data yet.</p>
              <Link href="/benchmarking" className="text-xs text-[var(--color-blue)] hover:underline mt-2 block">
                Run benchmarking →
              </Link>
            </div>
          )}
        </Card>

        {/* Automation Transparency */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="h-5 w-5 text-pink-400" />
            <h3 className="font-semibold text-sm">Automation Transparency™</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "Evidence Automation", value: automation.evidenceAutomation, color: "bg-blue-400" },
              { label: "Controls Monitored", value: automation.monitoringCoverage, color: "bg-emerald-400" },
              { label: "Overall Coverage", value: automation.automationPct, color: "bg-pink-400" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-[var(--color-ink-dim)]">{label}</span>
                  <span className="font-semibold">{value}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-[var(--color-line)] flex justify-between text-sm">
              <span className="text-[var(--color-ink-dim)]">Connected Systems</span>
              <span className="font-semibold">{automation.connectedSystems}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick nav + Activity */}
      <div className="grid xl:grid-cols-3 gap-6">
        {/* Module links */}
        <div>
          <h2 className="text-base font-semibold mb-3">Network Modules</h2>
          <div className="grid grid-cols-1 gap-3">
            {[
              { href: "/trust-network/profile", icon: Globe, title: "Public Trust Profile 2.0", desc: "Your verified trust story", color: "text-blue-400" },
              { href: "/trust-network/relationships", icon: Users, title: "Trust Relationships™", desc: "Manage your trust network", color: "text-purple-400" },
              { href: "/trust-network/directory", icon: Network, title: "Network Directory", desc: "Browse published profiles", color: "text-indigo-400" },
              { href: "/trust-network/activity", icon: Activity, title: "Trust Activity Feed™", desc: "Network-wide events", color: "text-pink-400" },
              { href: "/trust-network/ai", icon: Zap, title: "AI Network Advisor™", desc: "Strategy & recommendations", color: "text-[var(--color-blue)]" },
            ].map(({ href, icon: Icon, title, desc, color }) => (
              <Link key={href} href={href}>
                <Card className="px-4 py-3 flex items-center gap-3 hover:border-[var(--color-blue)]/40 hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <Icon className={`h-5 w-5 flex-shrink-0 ${color}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{title}</p>
                    <p className="text-xs text-[var(--color-ink-dim)] truncate">{desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--color-ink-faint)] ml-auto flex-shrink-0" />
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="xl:col-span-2">
          <h2 className="text-base font-semibold mb-3">Recent Network Activity</h2>
          <Card className="divide-y divide-[var(--color-line)]">
            {activity.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--color-ink-dim)]">
                No activity yet. Start by publishing your Trust Profile.
              </div>
            ) : (
              activity.map((a) => {
                const Icon = ACTIVITY_ICONS[a.activityType] ?? Globe;
                return (
                  <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                    <Icon className="h-4 w-4 mt-0.5 text-[var(--color-ink-dim)] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{a.description ?? a.activityType.replace(/_/g, " ")}</p>
                      <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">
                        {new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
