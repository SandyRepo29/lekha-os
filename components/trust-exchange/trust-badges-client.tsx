"use client";

import { useState, useActionState, useTransition } from "react";
import { issueBadgeAction, revokeBadgeAction } from "@/lib/trust-exchange/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Plus, X, ShieldCheck, Lock, Building2, Zap } from "lucide-react";
import type { TrustBadge } from "@/lib/db/schema";

const BADGE_TYPES = [
  { value: "audt_verified", label: "AUDT Verified™", color: "bg-blue-500/20 text-blue-400", icon: ShieldCheck },
  { value: "dpdp_ready", label: "DPDP Ready™", color: "bg-indigo-500/20 text-indigo-400", icon: Lock },
  { value: "privacy_verified", label: "Privacy Verified™", color: "bg-purple-500/20 text-purple-400", icon: Lock },
  { value: "vendor_trusted", label: "Vendor Trusted™", color: "bg-green-500/20 text-green-400", icon: ShieldCheck },
  { value: "low_risk", label: "Low Risk Vendor™", color: "bg-emerald-500/20 text-emerald-400", icon: ShieldCheck },
  { value: "enterprise_ready", label: "Enterprise Ready™", color: "bg-yellow-500/20 text-yellow-400", icon: Building2 },
  { value: "iso_verified", label: "ISO Verified™", color: "bg-orange-500/20 text-orange-400", icon: ShieldCheck },
  { value: "soc2_verified", label: "SOC2 Verified™", color: "bg-red-500/20 text-red-400", icon: ShieldCheck },
  { value: "custom", label: "Custom Badge", color: "bg-slate-500/20 text-slate-400", icon: Zap },
];

function BadgeCard({ badge, onRevoke }: { badge: TrustBadge; onRevoke: () => void }) {
  const def = BADGE_TYPES.find((b) => b.value === badge.badgeType) ?? BADGE_TYPES[BADGE_TYPES.length - 1];
  const Icon = def.icon;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${def.color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <button onClick={onRevoke} className="text-[var(--color-ink-faint)] hover:text-red-400 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="font-semibold text-sm mt-3">{badge.label}</p>
      {badge.description && <p className="text-xs text-[var(--color-ink-dim)] mt-1">{badge.description}</p>}
      <p className="text-xs text-[var(--color-ink-faint)] mt-2">
        Issued {new Date(badge.issuedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </p>
    </Card>
  );
}

export function TrustBadgesClient({ badges }: { badges: TrustBadge[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [state, formAction, pending] = useActionState(issueBadgeAction, null);
  const [revoking, startRevoke] = useTransition();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-ink-dim)]">{badges.length} active badge{badges.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Issue Badge
        </Button>
      </div>

      {showAdd && (
        <Card className="p-5 border-[var(--color-blue)]/30">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-sm">Issue Trust Badge</p>
            <button onClick={() => setShowAdd(false)}><X className="h-4 w-4 text-[var(--color-ink-dim)]" /></button>
          </div>
          <form action={formAction} className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">Badge Type *</label>
              <select name="badgeType" required className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--color-blue)]">
                {BADGE_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Label *</label>
              <Input name="label" required placeholder="e.g. ISO 27001 Certified 2024" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Description</label>
              <Input name="description" placeholder="Optional notes about this badge" />
            </div>
            {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" disabled={pending}>{pending ? "Issuing…" : "Issue Badge"}</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {badges.length === 0 ? (
        <Card className="p-12 text-center">
          <Star className="h-12 w-12 text-[var(--color-ink-faint)] mx-auto mb-3" />
          <p className="font-medium">No badges yet</p>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">Issue trust badges to showcase your certifications and posture.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {badges.map((b) => (
            <BadgeCard
              key={b.id}
              badge={b}
              onRevoke={() => { startRevoke(async () => { await revokeBadgeAction(b.id); }); }}
            />
          ))}
        </div>
      )}

      <div>
        <p className="text-sm font-medium mb-3 text-[var(--color-ink-dim)]">Available Badge Types</p>
        <div className="flex flex-wrap gap-2">
          {BADGE_TYPES.map(({ value, label, color, icon: Icon }) => (
            <div key={value} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${color}`}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
