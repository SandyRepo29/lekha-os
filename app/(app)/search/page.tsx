import { Suspense } from "react";
import GlobalSearch from "@/components/platform/global-search";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search — AUDT",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; types?: string }>;
}) {
  await searchParams;

  return (
    <div className="p-6">
      <Suspense
        fallback={
          <div className="p-8 text-center text-[var(--color-ink-faint)]">
            Loading search...
          </div>
        }
      >
        <GlobalSearch />
      </Suspense>
    </div>
  );
}
