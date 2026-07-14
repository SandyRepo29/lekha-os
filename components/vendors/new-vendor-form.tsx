"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createVendor, type VendorState } from "@/backend/src/modules/vendor-hub/vendors-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectGroup, SelectOption } from "@/components/ui/select";
import { VENDOR_CATEGORIES, RISK_LEVELS } from "@/lib/constants/vendor-options";
import { LIFECYCLE_STAGES } from "@/lib/constants/vendor-lifecycle";
import { OwnerFields } from "./owner-fields";

export function NewVendorForm({ children }: { children?: React.ReactNode }) {
  const [state, formAction, pending] = useActionState<VendorState, FormData>(
    createVendor,
    undefined
  );
  const [category, setCategory] = useState("");
  const [risk, setRisk] = useState("medium");
  const [lifecycle, setLifecycle] = useState("inventory");
  const selectedRisk = RISK_LEVELS.find((r) => r.value === risk);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="name">Vendor name *</Label>
        <Input id="name" name="name" required autoFocus placeholder="Razorpay Software Pvt Ltd" />
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
            <Input name="categoryOther" className="mt-2" placeholder="Describe category…" autoFocus />
          )}
        </div>

        <div>
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input id="contactEmail" name="contactEmail" type="email" placeholder="security@vendor.com" />
        </div>
      </div>

      <div>
        <Label htmlFor="risk">Risk level</Label>
        <Select id="risk" name="risk" value={risk} onChange={(e) => setRisk(e.target.value)}>
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

      <div>
        <Label htmlFor="lifecycleStage">Lifecycle stage</Label>
        <Select id="lifecycleStage" name="lifecycleStage" value={lifecycle} onChange={(e) => setLifecycle(e.target.value)}>
          {LIFECYCLE_STAGES.map((s) => (
            <SelectOption key={s.value} value={s.value}>{s.label}</SelectOption>
          ))}
        </Select>
        <p className="mt-1.5 text-xs text-[var(--color-ink-faint)]">
          {LIFECYCLE_STAGES.find((s) => s.value === lifecycle)?.description}
        </p>
      </div>

      <div className="border-t border-[var(--color-line)] pt-4">
        <OwnerFields />
      </div>

      {children}

      {state?.error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Adding…" : "Add vendor"}
        </Button>
        <Link href="/vendors">
          <Button type="button" variant="subtle">Cancel</Button>
        </Link>
      </div>
    </form>
  );
}

function getRiskIcon(risk: string) {
  switch (risk) {
    case "low":      return "🟢";
    case "medium":   return "🟡";
    case "high":     return "🟠";
    case "critical": return "🔴";
    default:         return "";
  }
}
