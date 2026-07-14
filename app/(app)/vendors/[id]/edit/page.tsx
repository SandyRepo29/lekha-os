export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getVendor } from "@/backend/src/modules/vendor-hub/vendor-service";
import { EditVendorForm } from "@/components/vendors/edit-vendor-form";
import { TemplateSelect } from "@/components/vendors/template-select";

export default async function EditVendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireUser();
  if (session.demo || !session.org) notFound();

  const vendor = await getVendor(session.org.id, id);
  if (!vendor) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href={`/vendors/${id}`} className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">
        <ArrowLeft className="h-4 w-4" /> Back to {vendor.name}
      </Link>
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Edit vendor</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Update details for {vendor.name}.</p>
      </div>
      <Card className="p-6">
        <EditVendorForm vendor={vendor}>
          <div className="border-t border-[var(--color-line)] pt-4">
            <TemplateSelect orgId={session.org.id} currentId={vendor.vendorTypeId} />
          </div>
        </EditVendorForm>
      </Card>
    </div>
  );
}
