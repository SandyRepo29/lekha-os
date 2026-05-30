"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteVendor } from "@/lib/vendors/actions";
import { Button } from "@/components/ui/button";

export function DeleteVendor({ vendorId, vendorName }: { vendorId: string; vendorName: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove() {
    if (!window.confirm(`Delete "${vendorName}" and all its documents? This cannot be undone.`)) return;
    setError(null);
    start(async () => {
      const res = await deleteVendor(vendorId);
      if (res?.error) {
        setError(res.error);
      } else {
        router.push("/vendors");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="subtle" size="sm" onClick={remove} disabled={pending}>
        <Trash2 className="h-4 w-4" />
        {pending ? "Deleting…" : "Delete"}
      </Button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
