export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Globe, ShieldCheck, FileText, Star, Users, MessageSquare,
  ArrowRight, CheckCircle2, AlertCircle, Zap, Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getDashboardMetrics, getOrCreateProfile, listActivity } from "@/lib/services/trust-exchange/trust-exchange-service";
import { TrustExchangeStat } from "@/components/trust-exchange/trust-exchange-ui";

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  profile_created: Globe,
  profile_updated: Globe,
  document_shared: FileText,
  document_verified: CheckCircle2,
  badge_issued: Star,
  relationship_created: Users,
  questionnaire_answered: MessageSquare,
  verification_requested: ShieldCheck,
};

export default async function TrustExchangeDashboard() {
  const session = await requireUser();
  if (!session.org) return null;
  const orgId = session.org.id;

  const [metrics, profile, activity] = await Promise.all([
    getDashboardMetrics(orgId),
    getOrCreateProfile(orgId),
    listActivity(orgId),
  ]);

  const completionColor =
    metrics.profileCompleteness >= 80 ? "text-green-400" :
    metrics.profileCompleteness >= 50 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Trust Exchange™</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">
            Upload once. Share many. Build verified organizational trust.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/trust-exchange/ai" className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-[#F8F9FB] transition-colors">
            <Sparkles className="h-3.5 w-3.5" />
            AI Trust Analyst™
          </Link>
          <Link href="/trust-exchange/directory" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-line)] text-sm font-semibold hover:bg-[#F8F9FB] transition-colors">
            <Globe className="h-4 w-4" /> Vendor Directory
          </Link>
          <Link href="/trust-exchange/my-profile" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-blue)] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            Manage Profile <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Profile banner */}
      <Card className="p-5 border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.04]">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-blue)]/20 flex items-center justify-center">
              <Globe className="h-6 w-6 text-[var(--color-blue)]" />
            </div>
            <div>
              <p className="font-semibold text-base">{profile.displayName}</p>
              <p className="text-xs text-[var(--color-ink-dim)]">{profile.tagline ?? "No tagline set"}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className={`text-lg font-bold ${completionColor}`}>{metrics.profileCompleteness}%</p>
              <p className="text-xs text-[var(--color-ink-dim)]">Profile complete</p>
            </div>
            <div className="text-center">
              {metrics.isPublished ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" />
                  <p className="text-xs text-green-400 mt-0.5">Published</p>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-400 mx-auto" />
                  <p className="text-xs text-yellow-400 mt-0.5">Private</p>
                </>
              )}
            </div>
            {profile.trustScore !== null && (
              <div className="text-center">
                <p className="text-lg font-bold text-[var(--color-blue)]">{profile.trustScore}</p>
                <p className="text-xs text-[var(--color-ink-dim)]">Trust Score</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <TrustExchangeStat label="Total Documents"  value={metrics.totalDocuments}          accent="neutral" href="/trust-exchange/documents" />
        <TrustExchangeStat label="Verified Docs"    value={metrics.verifiedDocuments}       accent={metrics.verifiedDocuments > 0 ? "good" : "warn"} href="/trust-exchange/documents" />
        <TrustExchangeStat label="Public Docs"      value={metrics.publicDocuments}         accent="neutral" />
        <TrustExchangeStat label="Trust Badges"     value={metrics.activeBadges}            accent={metrics.activeBadges > 0 ? "good" : "neutral"} href="/trust-exchange/badges" />
        <TrustExchangeStat label="Relationships"    value={metrics.activeRelationships}     accent="neutral" />
        <TrustExchangeStat label="Questionnaires"   value={metrics.completedQuestionnaires} accent="neutral" href="/trust-exchange/questionnaires" />
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { href: "/trust-exchange/documents", icon: FileText, title: "Evidence Exchange™", desc: "Upload and share trust documents", color: "text-blue-400" },
          { href: "/trust-exchange/badges", icon: Star, title: "Trust Badges™", desc: "Manage earned trust badges", color: "text-yellow-400" },
          { href: "/trust-exchange/questionnaires", icon: MessageSquare, title: "Questionnaire Exchange™", desc: "SIG, CAIQ and custom answers", color: "text-pink-400" },
          { href: "/trust-exchange/ai", icon: Zap, title: "AI Trust Analyst™", desc: "Ask about your trust posture", color: "text-[var(--color-blue)]" },
        ].map(({ href, icon: Icon, title, desc, color }) => (
          <Link key={href} href={href}>
            <Card className="p-5 hover:border-[var(--color-blue)]/40 hover:bg-white transition-colors cursor-pointer h-full">
              <Icon className={`h-7 w-7 mb-3 ${color}`} />
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-[var(--color-ink-dim)] mt-1">{desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Activity feed + Getting started */}
      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Recent Exchange Activity</h2>
            <Link href="/trust-exchange/documents" className="text-xs text-[var(--color-blue)] hover:underline">View all →</Link>
          </div>
          <Card className="divide-y divide-[var(--color-line)]">
            {activity.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--color-ink-dim)]">
                No activity yet. Start by managing your Trust Profile.
              </div>
            ) : (
              activity.slice(0, 10).map((a) => {
                const Icon = ACTIVITY_ICONS[a.activityType] ?? Globe;
                return (
                  <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                    <Icon className="h-4 w-4 mt-0.5 text-[var(--color-ink-dim)] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{a.description ?? a.activityType.replace(/_/g, " ")}</p>
                      <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">
                        {a.actorName ?? "System"} · {new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-3">Getting Started</h2>
          <Card className="p-4 space-y-3">
            {[
              { done: !!profile.displayName, label: "Create Trust Profile", href: "/trust-exchange/my-profile" },
              { done: metrics.profileCompleteness >= 80, label: "Complete profile (80%+)", href: "/trust-exchange/my-profile" },
              { done: metrics.totalDocuments > 0, label: "Upload first document", href: "/trust-exchange/documents" },
              { done: metrics.verifiedDocuments > 0, label: "Verify a document", href: "/trust-exchange/documents" },
              { done: metrics.activeBadges > 0, label: "Earn a Trust Badge", href: "/trust-exchange/badges" },
              { done: metrics.isPublished, label: "Publish your profile", href: "/trust-exchange/my-profile" },
            ].map(({ done, label, href }) => (
              <Link key={label} href={href} className="flex items-center gap-3 group">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-green-500/20" : "bg-white/5"}`}>
                  {done ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> : <div className="w-2 h-2 rounded-full bg-white/20" />}
                </div>
                <span className={`text-sm group-hover:text-[var(--color-ink)] transition-colors ${done ? "line-through text-[var(--color-ink-dim)]" : "text-[var(--color-ink-dim)]"}`}>{label}</span>
              </Link>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
