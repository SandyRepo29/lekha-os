export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getVendor } from "@/lib/services/vendor-service";
import { getOffboardingChecklist, OFFBOARDING_STEPS_ORDER } from "@/lib/services/vendor-lifecycle/offboarding-service";
import { getVendorLifecycleState } from "@/lib/services/vendor-lifecycle/lifecycle-service";
import { canEdit as canEditRole } from "@/lib/ui/role-guard";
import { OffboardingChecklist } from "@/components/vendors/offboarding-checklist";
import type { OffboardingChecklistRow } from "@/components/vendors/offboarding-checklist";
import type { OffboardingStep } from "@/lib/services/vendor-lifecycle/offboarding-service";

interface Props { params: Promise<{ id: string }> }

export default async function VendorOffboardingPage({ params }: Props) {
  const session = await requireUser();
  if (!session.org) notFound();

  const { id } = await params;

  const [vendor, currentState, checklistData] = await Promise.all([
    getVendor(session.org.id, id),
    getVendorLifecycleState(session.org.id, id),
    getOffboardingChecklist(session.org.id, id),
  ]);

  if (!vendor) notFound();

  // Redirect if vendor isn't in offboarding state
  if (!["offboarding", "offboarded"].includes(currentState)) {
    redirect(`/vendors/${id}`);
  }

  // Normalize the flat checklist row into step rows
  const checklist: OffboardingChecklistRow[] = checklistData
    ? OFFBOARDING_STEPS_ORDER.map((step): OffboardingChecklistRow => ({
        step:         step as OffboardingStep,
        completed:    !!(checklistData as Record<string, unknown>)[step],
        completed_at: (checklistData as Record<string, unknown>)[`${step}_at`] as string | null,
        completed_by: null, // not per-step in schema
        notes:        step === "lessons_captured" ? (checklistData.lessons_learned ?? null) : null,
      }))
    : [];

  const canEditVendor = canEditRole(session.org.role);

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-ink-faint)]">
        <Link href="/vendors" className="hover:text-[var(--color-ink)]">Vendor Hub&#8482;</Link>
        <span>/</span>
        <Link href={`/vendors/${id}`} className="hover:text-[var(--color-ink)]">{vendor.name}</Link>
        <span>/</span>
        <span className="text-[var(--color-ink)]">Offboarding</span>
      </div>

      <div className="flex items-center gap-3">
        <Link href={`/vendors/${id}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-line)] hover:bg-[#F8F9FB] transition-colors">
          <ArrowLeft className="h-4 w-4 text-[var(--color-ink-faint)]" />
        </Link>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
            Offboarding Checklist
          </h1>
          <p className="text-sm text-[var(--color-ink-faint)]">{vendor.name} &#8212; vendor offboarding in progress</p>
        </div>
      </div>

      <OffboardingChecklist
        vendorId={id}
        checklist={checklist}
        targetDate={checklistData?.target_date?.toString() ?? null}
        canEdit={canEditVendor}
      />
    </div>
  );
}
