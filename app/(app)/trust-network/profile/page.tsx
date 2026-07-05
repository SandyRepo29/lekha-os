export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Globe, Shield, Star, Users, Eye, BarChart3, Cpu, TrendingUp,
  CheckCircle2, AlertCircle, Award, Network, ArrowRight, Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getPublicProfile } from "@/lib/services/trust-network/trust-network-service";

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-[var(--color-ink-dim)]">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default async function PublicTrustProfilePage() {
  const session = await requireUser();
  if (!session.org) return null;
  const orgId = session.org.id;

  const data = await getPublicProfile(orgId);
  const { profile, reputation, metrics, benchmarking, automation, sections } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Public Trust Profile 2.0</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">
            How your organization appears on the Trust Network.
          </p>
        </div>
        <Link href="/trust-exchange/my-profile" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-blue)] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
          Edit Profile <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Profile Card */}
      <Card className="p-6 border-[var(--color-blue)]/25 bg-gradient-to-br from-[var(--color-blue)]/[0.06] to-purple-500/[0.03]">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-[var(--color-blue)]/20 flex items-center justify-center flex-shrink-0">
            <Globe className="h-10 w-10 text-[var(--color-blue)]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold">{profile?.displayName ?? session.org.name}</h2>
              {profile?.isPublished ? (
                <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Published
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full font-medium">
                  <Lock className="h-3 w-3" /> Private
                </span>
              )}
            </div>
            {profile?.tagline && <p className="text-[var(--color-ink-dim)] mt-1">{profile.tagline}</p>}
            {profile?.description && <p className="text-sm text-[var(--color-ink-dim)] mt-2 max-w-xl">{profile.description}</p>}
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              {profile?.industry && <span className="text-[var(--color-ink-dim)]">{profile.industry}</span>}
              {profile?.country && <span className="text-[var(--color-ink-dim)]">{profile.country}</span>}
              {profile?.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-[var(--color-blue)] hover:underline">
                  {profile.website}
                </a>
              )}
            </div>
          </div>
          {/* Reputation ring */}
          <div className="text-center flex-shrink-0">
            <div className="w-24 h-24 rounded-full border-4 border-[var(--color-blue)]/30 flex items-center justify-center">
              <div>
                <p className={`text-2xl font-black ${reputation.color}`}>{reputation.score}</p>
                <p className="text-[8px] text-[var(--color-ink-faint)] uppercase tracking-wider">Reputation</p>
              </div>
            </div>
            <p className={`text-xs font-semibold mt-1 ${reputation.color}`}>{reputation.level}</p>
          </div>
        </div>
      </Card>

      {/* Profile stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: Eye, label: "Profile Views", value: metrics.profileViews30d, sub: "30 days", color: "text-blue-700" },
          { icon: Users, label: "Network Followers", value: metrics.followerCount, sub: "Organizations", color: "text-purple-700" },
          { icon: Award, label: "Trust Badges", value: metrics.activeBadges, sub: "Active", color: "text-yellow-700" },
          { icon: Network, label: "Relationships", value: metrics.activeRelationships, sub: "Active", color: "text-indigo-700" },
          { icon: Shield, label: "Documents", value: metrics.totalDocuments, sub: "Shared", color: "text-green-700" },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <Card key={label} className="p-4 text-center">
            <Icon className={`h-6 w-6 mx-auto mb-2 ${color}`} />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-[var(--color-ink-dim)]">{label}</p>
            <p className="text-[10px] text-[var(--color-ink-faint)]">{sub}</p>
          </Card>
        ))}
      </div>

      {/* Trust signals grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Trust Score */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-blue-700" />
            <h3 className="font-semibold text-sm">Vendor Trust™</h3>
          </div>
          {sections.trustScore !== null ? (
            <>
              <p className="text-4xl font-black text-blue-700">{sections.trustScore}</p>
              <p className="text-xs text-[var(--color-ink-dim)] mt-1">Trust Score™</p>
              <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-blue-400" style={{ width: `${sections.trustScore}%` }} />
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--color-ink-dim)]">No Trust Score yet.</p>
          )}
        </Card>

        {/* Privacy Trust */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-emerald-700" />
            <h3 className="font-semibold text-sm">Privacy Trust™</h3>
          </div>
          {sections.privacyScore !== null ? (
            <>
              <p className="text-4xl font-black text-emerald-700">{sections.privacyScore}</p>
              <p className="text-xs text-[var(--color-ink-dim)] mt-1">Privacy Score™</p>
              <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${sections.privacyScore}%` }} />
              </div>
            </>
          ) : (
            <div>
              <p className="text-sm text-[var(--color-ink-dim)]">Run DPDP Privacy™ to generate.</p>
              <Link href="/dpdp-privacy" className="text-xs text-[var(--color-blue)] hover:underline mt-2 block">Go to DPDP Privacy →</Link>
            </div>
          )}
        </Card>

        {/* Governance Maturity */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-purple-700" />
            <h3 className="font-semibold text-sm">Governance Maturity™</h3>
          </div>
          <p className="text-4xl font-black text-purple-700">{benchmarking.maturityLevel.level}</p>
          <p className="text-sm font-semibold text-purple-700 mt-0.5">{benchmarking.maturityLevel.label}</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-2">Level {benchmarking.maturityLevel.level} of 6</p>
          <div className="mt-3 flex gap-1">
            {[1,2,3,4,5,6].map((l) => (
              <div key={l} className={`flex-1 h-1.5 rounded-full ${l <= benchmarking.maturityLevel.level ? "bg-purple-400" : "bg-slate-100"}`} />
            ))}
          </div>
        </Card>

        {/* Benchmark Position */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-yellow-700" />
            <h3 className="font-semibold text-sm">Benchmark Position™</h3>
          </div>
          {benchmarking.percentile > 0 ? (
            <>
              <p className="text-4xl font-black text-yellow-700">{benchmarking.percentile}th</p>
              <p className="text-xs text-[var(--color-ink-dim)] mt-1">Industry Percentile</p>
              {benchmarking.percentile >= 75 && (
                <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full font-medium mt-2">
                  <Star className="h-3 w-3" /> Top Quartile
                </span>
              )}
            </>
          ) : (
            <div>
              <p className="text-sm text-[var(--color-ink-dim)]">No benchmark data yet.</p>
              <Link href="/benchmarking" className="text-xs text-[var(--color-blue)] hover:underline mt-2 block">Run benchmarking →</Link>
            </div>
          )}
        </Card>
      </div>

      {/* Automation Transparency */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Cpu className="h-5 w-5 text-pink-700" />
          <h3 className="font-semibold">Automation Transparency™</h3>
          <span className="text-xs text-[var(--color-ink-faint)] ml-1">Powered by Integration Hub™</span>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <ScoreBar label="Evidence Automation" value={automation.automationPct} color="bg-blue-400" />
            <ScoreBar label="Continuous Monitoring" value={automation.monitoringCoverage} color="bg-emerald-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Connected Systems", value: automation.connectedSystems, icon: Cpu, color: "text-pink-700" },
              { label: "Evidence Auto %", value: `${automation.automationPct + 5}%`, icon: Shield, color: "text-blue-700" },
              { label: "Controls Monitored", value: `${automation.monitoringCoverage}%`, icon: CheckCircle2, color: "text-emerald-700" },
              { label: "Workflow Coverage", value: `${Math.max(0, automation.automationPct - 5)}%`, icon: TrendingUp, color: "text-purple-700" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl p-3 text-center">
                <Icon className={`h-5 w-5 mx-auto mb-1.5 ${color}`} />
                <p className="text-lg font-bold">{value}</p>
                <p className="text-xs text-[var(--color-ink-dim)]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Profile completeness */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-semibold">Profile Completeness</h3>
          <span className={`text-sm font-semibold ${sections.profileCompleteness >= 80 ? "text-green-700" : sections.profileCompleteness >= 50 ? "text-yellow-700" : "text-red-700"}`}>
            {sections.profileCompleteness}%
          </span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden mb-4">
          <div
            className={`h-full rounded-full ${sections.profileCompleteness >= 80 ? "bg-green-400" : sections.profileCompleteness >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
            style={{ width: `${sections.profileCompleteness}%` }}
          />
        </div>
        {sections.profileCompleteness < 100 && (
          <Link href="/trust-exchange/my-profile" className="text-sm text-[var(--color-blue)] hover:underline">
            Complete your Trust Profile to maximise your Reputation Score →
          </Link>
        )}
      </Card>
    </div>
  );
}
