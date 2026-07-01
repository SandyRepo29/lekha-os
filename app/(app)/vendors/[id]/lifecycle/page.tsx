export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getVendor } from "@/lib/services/vendor-service";
import { getVendorLifecycleState } from "@/lib/services/vendor-lifecycle/lifecycle-service";
import { findLifecycleHistory } from "@/lib/repositories/lifecycle-repo";
import { canEdit as canEditRole } from "@/lib/ui/role-guard";
import { LifecycleBadge } from "@/components/vendors/lifecycle-badge";
import { LifecyclePanel } from "@/components/vendors/lifecycle-panel";
import type { VendorState } from "@/lib/services/vendor-lifecycle/lifecycle-service";

interface Props { params: Promise<{ id: string }> }

export default async function VendorLifecyclePage({ params }: Props) {
  const session = await requireUser();
  if (!session.org) notFound();

  const { id } = await params;

  const [vendor, currentState, rawHistory] = await Promise.all([
    getVendor(session.org.id, id),
    getVendorLifecycleState(session.org.id, id),
    findLifecycleHistory(session.org.id, id),
  ]);

  if (!vendor) notFound();

  const canEditVendor = canEditRole(session.org.role);

  const history = rawHistory.map((h: any) => ({
    id:                 h.id,
    from_state:         h.from_state,
    to_state:           h.to_state,
    transition_reason:  h.transition_reason,
    actor_name:         h.actor_name,
    triggered_by:       h.triggered_by,
    created_at:         h.created_at,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-ink-faint)]">
        <Link href="/vendors" className="hover:text-[var(--color-ink)]">Vendor Hub™</Link>
        <span>/</span>
        <Link href={`/vendors/${id}`} className="hover:text-[var(--color-ink)]">{vendor.name}</Link>
        <span>/</span>
        <span className="text-[var(--color-ink)]">Lifecycle</span>
      </div>

      <div className="flex items-center gap-3">
        <Link href={`/vendors/${id}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-line)] hover:bg-[#F8F9FB] transition-colors">
          <ArrowLeft className="h-4 w-4 text-[var(--color-ink-faint)]" />
        </Link>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
            Vendor Lifecycle
          </h1>
          <p className="text-sm text-[var(--color-ink-faint)]">
            {vendor.name} — current state: <LifecycleBadge state={currentState as VendorState} size="sm" />
          </p>
        </div>
      </div>

      <LifecyclePanel
        vendorId={id}
        currentState={currentState as VendorState}
        history={history}
        canEdit={canEditVendor}
      />
    </div>
  );
}
