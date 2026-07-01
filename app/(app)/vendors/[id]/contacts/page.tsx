export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getVendor } from "@/lib/services/vendor-service";
import { findContactsByVendor } from "@/lib/repositories/vendor-contacts-repo";
import { canEdit as canEditRole } from "@/lib/ui/role-guard";
import { ContactsPanel } from "@/components/vendors/contacts-panel";

interface Props { params: Promise<{ id: string }> }

export default async function VendorContactsPage({ params }: Props) {
  const session = await requireUser();
  if (!session.org) notFound();

  const { id } = await params;

  const [vendor, contacts] = await Promise.all([
    getVendor(session.org.id, id),
    findContactsByVendor(session.org.id, id),
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
        <span className="text-[var(--color-ink)]">Contacts</span>
      </div>

      <div className="flex items-center gap-3">
        <Link href={`/vendors/${id}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-line)] hover:bg-[#F8F9FB] transition-colors">
          <ArrowLeft className="h-4 w-4 text-[var(--color-ink-faint)]" />
        </Link>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
            Vendor Contacts
          </h1>
          <p className="text-sm text-[var(--color-ink-faint)]">{vendor.name} — manage contact directory</p>
        </div>
      </div>

      <ContactsPanel
        vendorId={id}
        contacts={contacts}
        canEdit={canEditVendor}
      />
    </div>
  );
}
