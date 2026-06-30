export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import {
  getActivityFeed,
  getActivityStats,
} from "@/lib/services/platform/activity-service";
import { ActivityFeed } from "@/components/platform/activity-feed";
import { Card } from "@/components/ui/card";
import { Activity } from "lucide-react";
import Link from "next/link";

const ENTITY_TYPES = [
  { label: "All", value: "" },
  { label: "Vendors", value: "vendor" },
  { label: "Risks", value: "risk" },
  { label: "Audits", value: "audit" },
  { label: "Contracts", value: "contract" },
  { label: "Controls", value: "control" },
  { label: "Issues", value: "issue" },
  { label: "Compliance", value: "compliance" },
  { label: "Policies", value: "policy" },
];

interface Props {
  searchParams: Promise<{ entityType?: string; from?: string; to?: string }>;
}

export default async function PlatformActivityPage({ searchParams }: Props) {
  const session = await requireUser();
  const sp = await searchParams;

  const rawEntityType = Array.isArray(sp.entityType) ? sp.entityType[0] : sp.entityType;
  const rawFrom = Array.isArray(sp.from) ? sp.from[0] : sp.from;
  const rawTo = Array.isArray(sp.to) ? sp.to[0] : sp.to;

  const entityType = rawEntityType ?? "";
  const fromDate = rawFrom ? new Date(rawFrom) : undefined;
  const toDate = rawTo ? new Date(rawTo) : undefined;

  const orgId = session.org!.id;

  const [activities, stats] = await Promise.all([
    getActivityFeed(orgId, {
      entityType: entityType || undefined,
      from: fromDate,
      to: toDate,
      limit: 100,
    }),
    getActivityStats(orgId),
  ]);

  const byType = stats.byEntityType as Record<string, number>;
  const topEntityType = Object.entries(byType).sort(
    (a, b) => (b[1] as number) - (a[1] as number)
  )[0]?.[0] ?? "&#8212;";

  const activeUsers = stats.recentActors.length;

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--color-ink-dim)]">
        <span>Platform</span>
        <span>/</span>
        <span className="text-[var(--color-ink)]">Activity</span>
      </nav>

      {/* Page title */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
          <Activity className="w-5 h-5" />
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
          Platform Activity
        </h1>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-2 border-indigo-500 bg-indigo-500/5">
          <p className="text-xs text-[var(--color-ink-dim)] mb-1">Total Events</p>
          <p className="text-2xl font-bold text-[var(--color-ink)]">
            {stats.total.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4 border-l-2 border-blue-500 bg-blue-500/5">
          <p className="text-xs text-[var(--color-ink-dim)] mb-1">Last 24h</p>
          <p className="text-2xl font-bold text-[var(--color-ink)]">
            {stats.last24h.toLocaleString()}
          </p>
        </Card>
        <Card className="p-4 border-l-2 border-violet-500 bg-violet-500/5">
          <p className="text-xs text-[var(--color-ink-dim)] mb-1">Top Entity Type</p>
          <p className="text-2xl font-bold text-[var(--color-ink)] capitalize">
            {topEntityType !== "&#8212;" ? topEntityType : "—"}
          </p>
        </Card>
        <Card className="p-4 border-l-2 border-emerald-500 bg-emerald-500/5">
          <p className="text-xs text-[var(--color-ink-dim)] mb-1">Active Users</p>
          <p className="text-2xl font-bold text-[var(--color-ink)]">
            {activeUsers.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Entity type filter chips */}
      <div className="flex flex-wrap gap-2">
        {ENTITY_TYPES.map((et) => {
          const isActive = entityType === et.value;
          const params = new URLSearchParams();
          if (et.value) params.set("entityType", et.value);
          if (rawFrom) params.set("from", rawFrom);
          if (rawTo) params.set("to", rawTo);
          const href = `/platform/activity${params.toString() ? `?${params.toString()}` : ""}`;
          return (
            <Link
              key={et.value}
              href={href}
              className={[
                "px-3 py-1.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#EEF2F7] text-[var(--color-ink)]"
                  : "text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] hover:text-[var(--color-ink)]",
              ].join(" ")}
            >
              {et.label}
            </Link>
          );
        })}
      </div>

      {/* Activity feed */}
      <ActivityFeed
        activities={activities as Parameters<typeof ActivityFeed>[0]["activities"]}
        showFilters={true}
        entityType={entityType || undefined}
        title="All Activity"
      />
    </div>
  );
}
