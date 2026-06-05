"use client";

import { useActionState } from "react";
import { updateOrgProfile, updateOrgBranding, type SettingsState } from "@/lib/settings/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import type { Organization, OrganizationSettings } from "@/lib/db/schema";

const INDUSTRIES = [
  { value: "", label: "Select industry…" },
  { value: "saas", label: "SaaS" },
  { value: "it_services", label: "IT Services" },
  { value: "fintech", label: "Fintech" },
  { value: "healthcare", label: "Healthcare" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "government", label: "Government" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
];

const COMPANY_SIZES = [
  { value: "", label: "Select size…" },
  { value: "1_10", label: "1–10 employees" },
  { value: "11_50", label: "11–50 employees" },
  { value: "51_200", label: "51–200 employees" },
  { value: "201_500", label: "201–500 employees" },
  { value: "501_1000", label: "501–1000 employees" },
  { value: "1000_plus", label: "1000+ employees" },
];

const TIMEZONES = [
  "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo",
  "Europe/London", "Europe/Paris", "America/New_York", "America/Los_Angeles",
  "UTC",
];

export function OrgProfileForm({
  org,
  role,
}: {
  org: Organization | null;
  role: string;
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateOrgProfile, undefined);
  const canEdit = role === "owner" || role === "admin";

  return (
    <Card>
      <CardHeader><CardTitle>Organization details</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Organization name *</Label>
              <Input id="name" name="name" defaultValue={org?.name ?? ""} placeholder="Acme Technologies Pvt Ltd" disabled={!canEdit} required />
            </div>
            <div>
              <Label htmlFor="legalName">Legal name</Label>
              <Input id="legalName" name="legalName" defaultValue={org?.legalName ?? ""} placeholder="Acme Technologies Private Limited" disabled={!canEdit} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="industry">Industry</Label>
              <select
                id="industry"
                name="industry"
                defaultValue={org?.industry ?? ""}
                disabled={!canEdit}
                className="flex h-11 w-full rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-4 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]/40 disabled:opacity-50"
              >
                {INDUSTRIES.map((i) => (
                  <option key={i.value} value={i.value} className="bg-[#0f0f14]">{i.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="companySize">Company size</Label>
              <select
                id="companySize"
                name="companySize"
                defaultValue={org?.companySize ?? ""}
                disabled={!canEdit}
                className="flex h-11 w-full rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-4 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]/40 disabled:opacity-50"
              >
                {COMPANY_SIZES.map((s) => (
                  <option key={s.value} value={s.value} className="bg-[#0f0f14]">{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" type="url" defaultValue={org?.website ?? ""} placeholder="https://example.com" disabled={!canEdit} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" defaultValue={org?.country ?? "India"} disabled={!canEdit} />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" defaultValue={org?.state ?? ""} placeholder="Maharashtra" disabled={!canEdit} />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                name="timezone"
                defaultValue={org?.timezone ?? "Asia/Kolkata"}
                disabled={!canEdit}
                className="flex h-11 w-full rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-4 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]/40 disabled:opacity-50"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz} className="bg-[#0f0f14]">{tz}</option>
                ))}
              </select>
            </div>
          </div>
          {!canEdit && <p className="text-xs text-[var(--color-ink-faint)]">Only owners and admins can update the organization.</p>}
          {state?.error && <ErrorMsg msg={state.error} />}
          {state?.ok && <SuccessMsg msg="Organization updated." />}
          {canEdit && (
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Saving…" : "Save organization"}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export function BrandingForm({
  settings,
  role,
}: {
  settings: OrganizationSettings | null;
  role: string;
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateOrgBranding, undefined);
  const canEdit = role === "owner" || role === "admin";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report &amp; email branding</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="primaryColor">Primary color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="primaryColor"
                  name="primaryColor"
                  defaultValue={settings?.primaryColor ?? "#6366f1"}
                  disabled={!canEdit}
                  className="h-11 w-14 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent p-1 disabled:opacity-50"
                />
                <Input
                  name="primaryColorText"
                  defaultValue={settings?.primaryColor ?? "#6366f1"}
                  placeholder="#6366f1"
                  disabled={!canEdit}
                  className="font-mono"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="accentColor">Accent color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="accentColor"
                  name="accentColor"
                  defaultValue={settings?.accentColor ?? "#8b5cf6"}
                  disabled={!canEdit}
                  className="h-11 w-14 cursor-pointer rounded-lg border border-[var(--color-line)] bg-transparent p-1 disabled:opacity-50"
                />
                <Input
                  name="accentColorText"
                  defaultValue={settings?.accentColor ?? "#8b5cf6"}
                  placeholder="#8b5cf6"
                  disabled={!canEdit}
                  className="font-mono"
                />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="reportFooter">Report footer text</Label>
            <textarea
              id="reportFooter"
              name="reportFooter"
              defaultValue={settings?.reportFooter ?? ""}
              disabled={!canEdit}
              rows={2}
              placeholder="Confidential — for internal use only."
              className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]/40 disabled:opacity-50 resize-none"
            />
          </div>
          <div>
            <Label htmlFor="emailSignature">Email signature</Label>
            <textarea
              id="emailSignature"
              name="emailSignature"
              defaultValue={settings?.emailSignature ?? ""}
              disabled={!canEdit}
              rows={3}
              placeholder="Lekha OS | Your GRC Operating System&#10;lekha-os.vercel.app"
              className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.02] px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]/40 disabled:opacity-50 resize-none"
            />
            <p className="mt-1 text-xs text-[var(--color-ink-faint)]">Used in expiry alerts and weekly digest emails.</p>
          </div>
          {!canEdit && <p className="text-xs text-[var(--color-ink-faint)]">Only owners and admins can update branding.</p>}
          {state?.error && <ErrorMsg msg={state.error} />}
          {state?.ok && <SuccessMsg msg="Branding updated." />}
          {canEdit && (
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Saving…" : "Save branding"}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{msg}</p>
  );
}
function SuccessMsg({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
      <CheckCircle2 className="h-4 w-4 shrink-0" /> {msg}
    </p>
  );
}
