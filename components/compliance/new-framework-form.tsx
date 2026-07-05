"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { createFrameworkAction, type ComplianceState } from "@/lib/compliance/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const BUILT_IN_FRAMEWORKS = [
  { key: "iso27001", label: "ISO 27001:2022",    version: "2022", description: "Information Security Management System",                         controls: 93 },
  { key: "soc2",     label: "SOC 2 Type II",     version: "2017", description: "Trust Service Criteria",                                          controls: 33 },
  { key: "dpdp",     label: "DPDP Act 2023",     version: "2023", description: "Digital Personal Data Protection — India",                        controls: 18 },
  { key: "pcidss",   label: "PCI DSS v4.0",      version: "4.0",  description: "Payment Card Industry Data Security Standard",                   controls: 12 },
  { key: "hipaa",    label: "HIPAA",             version: "2013", description: "Health Insurance Portability and Accountability Act",             controls: 18 },
];

export function NewFrameworkForm() {
  const [state, formAction, pending] = useActionState<ComplianceState, FormData>(
    createFrameworkAction,
    undefined
  );
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const handlePick = (
    e: React.MouseEvent<HTMLButtonElement>,
    fw: typeof BUILT_IN_FRAMEWORKS[0]
  ) => {
    const form = (e.target as HTMLElement).closest("form")!;
    (form.querySelector('[name="name"]') as HTMLInputElement).value = fw.label;
    (form.querySelector('[name="version"]') as HTMLInputElement).value = fw.version;
    (form.querySelector('[name="description"]') as HTMLInputElement).value = fw.description;
    (form.querySelector('[name="templateKey"]') as HTMLInputElement).value = fw.key;
    setSelectedKey(fw.key);
  };

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden template key — populated when a built-in is selected */}
      <input type="hidden" name="templateKey" defaultValue="" />

      {/* Built-in picker */}
      <div>
        <Label>Choose a standard framework</Label>
        <p className="mb-3 text-xs text-[var(--color-ink-dim)]">
          Select one to pre-fill details and auto-load all standard controls, or fill in below for a custom framework.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {BUILT_IN_FRAMEWORKS.map((fw) => {
            const isSelected = selectedKey === fw.key;
            return (
              <button
                key={fw.key}
                type="button"
                onClick={(e) => handlePick(e, fw)}
                className={`relative rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? "border-[var(--color-blue)]/60 bg-[var(--color-blue)]/10 ring-1 ring-[var(--color-blue)]/30"
                    : "border-[var(--color-line)] bg-white hover:border-[var(--color-blue)]/40 hover:bg-[var(--color-blue)]/5"
                }`}
              >
                {isSelected && (
                  <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-[var(--color-blue)]" />
                )}
                <p className="font-semibold text-sm text-[var(--color-ink)]">{fw.label}</p>
                <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">{fw.description}</p>
                <p className="mt-1.5 text-[10px] font-medium text-[var(--color-blue)]">
                  {fw.controls} controls pre-loaded
                </p>
              </button>
            );
          })}
        </div>
        {selectedKey && (
          <p className="mt-2 text-xs text-emerald-700">
            ✓ {BUILT_IN_FRAMEWORKS.find((f) => f.key === selectedKey)?.controls} standard controls will be created automatically.
          </p>
        )}
      </div>

      <div className="border-t border-[var(--color-line)] pt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Framework name *</Label>
            <Input id="name" name="name" required autoFocus placeholder="ISO 27001:2022" />
          </div>
          <div>
            <Label htmlFor="version">Version</Label>
            <Input id="version" name="version" placeholder="2022" />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" placeholder="Brief description of this framework" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="owner">Owner</Label>
            <Input id="owner" name="owner" placeholder="Name or team responsible" />
          </div>
          <div>
            <Label htmlFor="reviewDate">Review date</Label>
            <Input id="reviewDate" name="reviewDate" type="date" />
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg border border-red-200 bg-red-100 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending
            ? selectedKey ? "Creating + seeding controls…" : "Creating…"
            : "Create framework"}
        </Button>
        <Link href="/compliance/frameworks">
          <Button type="button" variant="subtle">Cancel</Button>
        </Link>
      </div>
    </form>
  );
}
