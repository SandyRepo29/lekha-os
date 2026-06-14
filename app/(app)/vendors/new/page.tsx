export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { NewVendorForm } from "@/components/vendors/new-vendor-form";
import { TemplateSelect } from "@/components/vendors/template-select";
import { requireUser } from "@/lib/auth/session";

export default async function NewVendorPage() {
  const session = await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/vendors" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">
        <ArrowLeft className="h-4 w-4" /> Back to vendors
      </Link>
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Add vendor</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Register a vendor to start tracking documents, certifications and risk.</p>
      </div>
      <Card className="p-6">
        <NewVendorForm>
          {!session.demo && session.org && (
            <div className="border-t border-[var(--color-line)] pt-4">
              <TemplateSelect orgId={session.org.id} />
            </div>
          )}
        </NewVendorForm>
      </Card>
    </div>
  );
}
