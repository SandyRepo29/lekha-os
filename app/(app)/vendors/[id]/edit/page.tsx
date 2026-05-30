export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getVendor } from "@/lib/services/vendor-service";
import { EditVendorForm } from "@/components/vendors/edit-vendor-form";

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
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Edit vendor</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Update details for {vendor.name}.</p>
      </div>
      <Card className="p-6">
        <EditVendorForm vendor={vendor} />
      </Card>
    </div>
  );
}
