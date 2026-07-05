export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { createWatchlistAction } from "@/lib/regulatory-intelligence/actions";
import { RegNewForm, type RegField } from "@/components/regulatory-intelligence/reg-new-form";

export default async function NewWatchlistPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string | string[] }>;
}) {
  await requireUser();
  const sp = await searchParams;
  const prefill = Array.isArray(sp.name) ? sp.name[0] : sp.name;

  const fields: RegField[] = [
    { name: "name", label: "Watchlist Name", required: true, placeholder: "e.g. India Data Privacy", defaultValue: prefill },
    { name: "description", label: "Description", type: "textarea" },
    { name: "watchType", label: "Watch Type", placeholder: "e.g. regulation, category, jurisdiction" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/regulatory-intelligence/watchlists"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Watchlists™
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold">New Watchlist</h1>
      </div>
      <RegNewForm action={createWatchlistAction} fields={fields} submitLabel="Create Watchlist" redirectTo="/regulatory-intelligence/watchlists" />
    </div>
  );
}
