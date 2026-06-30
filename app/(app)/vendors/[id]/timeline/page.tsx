export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getVendor } from "@/lib/services/vendor-service";
import { findVendorTimeline } from "@/lib/repositories/vendor-timeline-repo";
import { VendorTimeline } from "@/components/vendors/vendor-timeline";
import type { TimelineEvent } from "@/components/vendors/vendor-timeline";

interface Props { params: Promise<{ id: string }> }

export default async function VendorTimelinePage({ params }: Props) {
  const session = await requireUser();
  if (!session.org) notFound();

  const { id } = await params;

  const [vendor, rawEvents] = await Promise.all([
    getVendor(session.org.id, id),
    findVendorTimeline(session.org.id, id, 200),
  ]);

  if (!vendor) notFound();

  const events = rawEvents.map((e: any): TimelineEvent => ({
    id:          e.id,
    event_type:  e.event_type,
    title:       e.title,
    description: e.description,
    severity:    e.severity,
    actor_name:  e.actor_name,
    entity_type: e.entity_type,
    entity_id:   e.entity_id,
    metadata:    e.metadata,
    occurred_at: e.created_at,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-ink-faint)]">
        <Link href="/vendors" className="hover:text-[var(--color-ink)]">Vendor Hub&#8482;</Link>
        <span>/</span>
        <Link href={`/vendors/${id}`} className="hover:text-[var(--color-ink)]">{vendor.name}</Link>
        <span>/</span>
        <span className="text-[var(--color-ink)]">Timeline</span>
      </div>

      <div className="flex items-center gap-3">
        <Link href={`/vendors/${id}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-line)] hover:bg-[#F8F9FB] transition-colors">
          <ArrowLeft className="h-4 w-4 text-[var(--color-ink-faint)]" />
        </Link>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
            Vendor Timeline
          </h1>
          <p className="text-sm text-[var(--color-ink-faint)]">{vendor.name} &#8212; complete governance history</p>
        </div>
      </div>

      <VendorTimeline events={events} showFilters />
    </div>
  );
}
