export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getVendor } from "@/backend/src/modules/vendor-hub/vendor-service";
import { getRenewalAssessments } from "@/backend/src/modules/vendor-hub/renewal-service";
import { getVendorLifecycleState } from "@/backend/src/modules/vendor-hub/lifecycle-service";
import { canEdit as canEditRole } from "@/lib/ui/role-guard";
import { RenewalWorkspace } from "@/components/vendors/renewal-workspace";

interface Props { params: Promise<{ id: string }> }

export default async function VendorRenewalPage({ params }: Props) {
  const session = await requireUser();
  if (!session.org) notFound();

  const { id } = await params;

  const [vendor, currentState, assessments] = await Promise.all([
    getVendor(session.org.id, id),
    getVendorLifecycleState(session.org.id, id),
    getRenewalAssessments(session.org.id, id),
  ]);

  if (!vendor) notFound();

  const canEditVendor = canEditRole(session.org.role);

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-ink-faint)]">
        <Link href="/vendors" className="hover:text-[var(--color-ink)]">Vendor Hub™</Link>
        <span>/</span>
        <Link href={`/vendors/${id}`} className="hover:text-[var(--color-ink)]">{vendor.name}</Link>
        <span>/</span>
        <span className="text-[var(--color-ink)]">Renewal</span>
      </div>

      <div className="flex items-center gap-3">
        <Link href={`/vendors/${id}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-line)] hover:bg-[#F8F9FB] transition-colors">
          <ArrowLeft className="h-4 w-4 text-[var(--color-ink-faint)]" />
        </Link>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
            Renewal Workspace
          </h1>
          <p className="text-sm text-[var(--color-ink-faint)]">{vendor.name} — renewal assessment and decision</p>
        </div>
      </div>

      <RenewalWorkspace
        vendorId={id}
        vendorName={vendor.name}
        currentState={currentState}
        assessments={assessments}
        trustScore={vendor.trustScore}
        complianceScore={vendor.complianceScore}
        canEdit={canEditVendor}
      />
    </div>
  );
}
