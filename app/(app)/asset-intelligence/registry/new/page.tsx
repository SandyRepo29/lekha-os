﻿export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getAssetTypes } from "@/backend/src/modules/asset-intelligence/asset-service";
import { AssetSubNav } from "@/components/asset-intelligence/asset-ui";
import { NewAssetForm } from "@/components/asset-intelligence/new-asset-form";

export default async function NewAssetPage() {
  const session    = await requireUser();
  const orgId = session.org?.id ?? "";
  const assetTypes = await getAssetTypes(orgId).catch(() => []);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Add Asset</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">Register a new asset in the Asset Intelligence™ inventory.</p>
      </div>
      <AssetSubNav />
      <NewAssetForm assetTypes={assetTypes} />
    </div>
  );
}

