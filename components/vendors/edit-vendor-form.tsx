"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { Vendor } from "@/lib/db/schema";
import { updateVendor, type VendorState } from "@/backend/src/modules/vendor-hub/vendors-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectGroup, SelectOption } from "@/components/ui/select";
import { VENDOR_CATEGORIES, RISK_LEVELS } from "@/lib/constants/vendor-options";
import { OwnerFields } from "./owner-fields";

export function EditVendorForm({ vendor, children }: { vendor: Vendor; children?: React.ReactNode }) {
  const [state, formAction, pending] = useActionState<VendorState, FormData>(updateVendor, undefined);

  const initialCategory = VENDOR_CATEGORIES.flatMap((g) => g.items as readonly string[]).includes(vendor.category ?? "")
    ? (vendor.category ?? "") : vendor.category ? "Other" : "";
  const [category, setCategory] = useState(initialCategory);
  const [risk, setRisk] = useState<"low" | "medium" | "high" | "critical">(vendor.riskLevel);
  const selectedRisk = RISK_LEVELS.find((r) => r.value === risk);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="vendorId" value={vendor.id} />

      <div>
        <Label htmlFor="name">Vendor name *</Label>
        <Input id="name" name="name" required defaultValue={vendor.name} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select id="category" name="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <SelectOption value="">Select category…</SelectOption>
            {VENDOR_CATEGORIES.map((g) => (
              <SelectGroup key={g.group} label={g.group}>
                {g.items.map((item) => (
                  <SelectOption key={item} value={item}>{item}</SelectOption>
                ))}
              </SelectGroup>
            ))}
            <SelectOption value="Other">Other</SelectOption>
          </Select>
          {category === "Other" && (
            <Input name="categoryOther" className="mt-2" defaultValue={vendor.category ?? ""} placeholder="Describe category…" />
          )}
        </div>
        <div>
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input id="contactEmail" name="contactEmail" type="email" defaultValue={vendor.contactEmail ?? ""} placeholder="security@vendor.com" />
        </div>
      </div>

      <div>
        <Label htmlFor="risk">Risk level</Label>
        <Select id="risk" name="risk" value={risk} onChange={(e) => setRisk(e.target.value as "low" | "medium" | "high" | "critical")}>
          {RISK_LEVELS.map((r) => (
            <SelectOption key={r.value} value={r.value}>{r.label}</SelectOption>
          ))}
        </Select>
        {selectedRisk && (
          <p className="mt-1.5 text-xs text-[var(--color-ink-faint)]">
            {getRiskIcon(risk)} {selectedRisk.hint}
          </p>
        )}
      </div>

      <div className="border-t border-[var(--color-line)] pt-4">
        <OwnerFields ownerName={vendor.ownerName} ownerEmail={vendor.ownerEmail} ownerDepartment={vendor.ownerDepartment} />
      </div>

      {children}

      {state?.error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{state.error}</p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Link href={`/vendors/${vendor.id}`}>
          <Button type="button" variant="subtle">Cancel</Button>
        </Link>
      </div>
    </form>
  );
}

function getRiskIcon(risk: string) {
  return ({ low: "🟢", medium: "🟡", high: "🟠", critical: "🔴" } as Record<string, string>)[risk] ?? "";
}
