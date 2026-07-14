"use client";

import { useActionState, useTransition } from "react";
import { updateProfileAction, publishProfileAction, unpublishProfileAction } from "@/backend/src/modules/trust-exchange/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TrustProfile } from "@/lib/db/schema";

const INDUSTRIES = ["saas", "it_services", "fintech", "healthcare", "manufacturing", "government", "education", "other"];
const SIZES = ["1_10", "11_50", "51_200", "201_500", "501_1000", "1000_plus"];
const COUNTRIES = ["India", "United States", "United Kingdom", "Singapore", "UAE", "Germany", "Australia", "Other"];
const VISIBILITIES = [
  { value: "private", label: "Private — only your team" },
  { value: "network", label: "Network — trusted connections only" },
  { value: "public", label: "Public — visible in Vendor Directory" },
];

export function TrustProfileForm({ profile, isPublished }: { profile: TrustProfile; isPublished: boolean }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, null);
  const [publishPending, startPublish] = useTransition();

  function handlePublish() {
    startPublish(async () => {
      if (isPublished) await unpublishProfileAction();
      else await publishProfileAction();
    });
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form action={formAction} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Display Name *</label>
              <Input name="displayName" defaultValue={profile.displayName} required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Tagline</label>
              <Input name="tagline" defaultValue={profile.tagline ?? ""} placeholder="e.g. ISO 27001 certified cloud provider" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5">Description</label>
            <textarea
              name="description"
              defaultValue={profile.description ?? ""}
              rows={3}
              placeholder="Brief description of your organization and trust posture..."
              className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-blue)] resize-none"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Industry</label>
              <select name="industry" defaultValue={profile.industry ?? ""} className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-blue)]">
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Company Size</label>
              <select name="companySize" defaultValue={profile.companySize ?? ""} className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-blue)]">
                <option value="">Select size</option>
                {SIZES.map((s) => <option key={s} value={s}>{s.replace(/_/g, "–")} employees</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Country</label>
              <select name="country" defaultValue={profile.country ?? ""} className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-blue)]">
                <option value="">Select country</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Website</label>
              <Input name="website" defaultValue={profile.website ?? ""} placeholder="https://" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Profile Visibility</label>
              <select name="visibility" defaultValue={profile.visibility} className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-blue)]">
                {VISIBILITIES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
          {state?.ok && <p className="text-sm text-green-700">Profile saved.</p>}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save Profile"}
            </Button>
            <Button
              type="button"
              variant={isPublished ? "outline" : "primary"}
              onClick={handlePublish}
              disabled={publishPending}
            >
              {publishPending ? "…" : isPublished ? "Unpublish Profile" : "Publish to Directory"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
