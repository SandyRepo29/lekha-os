"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Mail, Phone, Briefcase, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addContactAction, removeContactAction } from "@/lib/vendors/contact-actions";
import { CONTACT_TYPE_LABELS } from "@/lib/repositories/vendor-contacts-repo";
import type { VendorContact, ContactType } from "@/lib/repositories/vendor-contacts-repo";

const CONTACT_TYPE_COLORS: Record<ContactType, string> = {
  primary:         "bg-blue-500/10 text-blue-400 border-blue-500/20",
  security:        "bg-red-500/10 text-red-400 border-red-500/20",
  privacy_officer: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  legal:           "bg-amber-500/10 text-amber-400 border-amber-500/20",
  finance:         "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  technical:       "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  escalation:      "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

interface Props {
  vendorId: string;
  contacts: VendorContact[];
  canEdit: boolean;
}

export function ContactsPanel({ vendorId, contacts, canEdit }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(addContactAction, undefined);

  const handleRemove = async (contactId: string) => {
    setRemoving(contactId);
    await removeContactAction(contactId, vendorId);
    setRemoving(null);
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--color-blue)]" />
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">Vendor Contacts</h3>
            {contacts.length > 0 && (
              <span className="rounded-full bg-[var(--color-blue)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-blue)]">
                {contacts.length}
              </span>
            )}
          </div>
          {canEdit && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-[var(--color-ink-dim)] hover:bg-white/[0.08] hover:text-[var(--color-ink)] transition-colors"
            >
              {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showForm ? "Cancel" : "Add contact"}
            </button>
          )}
        </div>

        {/* Add contact form */}
        {showForm && (
          <div className="border-t border-[var(--color-line)] p-5">
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="vendorId" value={vendorId} />
              {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-ink-dim)]">Name *</label>
                  <input name="name" required placeholder="Jane Smith"
                    className="w-full rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-ink-dim)]">Role</label>
                  <select name="contactType" defaultValue="primary"
                    className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-subtle)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]">
                    {(Object.keys(CONTACT_TYPE_LABELS) as ContactType[]).map((t) => (
                      <option key={t} value={t}>{CONTACT_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-ink-dim)]">Email</label>
                  <input name="email" type="email" placeholder="jane@vendor.com"
                    className="w-full rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-ink-dim)]">Phone</label>
                  <input name="phone" type="tel" placeholder="+91 98765 43210"
                    className="w-full rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-ink-dim)]">Title / Position</label>
                  <input name="title" placeholder="Head of Security"
                    className="w-full rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-ink-dim)]">Department</label>
                  <input name="department" placeholder="Engineering"
                    className="w-full rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-[var(--color-ink-dim)] cursor-pointer">
                  <input type="checkbox" name="isPrimary" value="true" className="rounded" />
                  Set as primary contact
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? "Adding…" : "Add contact"}
                </Button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Contacts list */}
        {contacts.length === 0 && !showForm ? (
          <p className="px-5 pb-5 text-sm text-[var(--color-ink-faint)]">No contacts added yet.</p>
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {contacts.map((c) => {
              const typeColor = CONTACT_TYPE_COLORS[c.contact_type as ContactType] ?? CONTACT_TYPE_COLORS.primary;
              return (
                <div key={c.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-blue)]/10">
                    <span className="text-sm font-bold text-[var(--color-blue)]">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--color-ink)]">{c.name}</span>
                      {c.is_primary && (
                        <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">Primary</span>
                      )}
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${typeColor}`}>
                        {CONTACT_TYPE_LABELS[c.contact_type as ContactType] ?? c.contact_type}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                      {c.title && (
                        <span className="flex items-center gap-1 text-xs text-[var(--color-ink-faint)]">
                          <Briefcase className="h-3 w-3" /> {c.title}
                        </span>
                      )}
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-[var(--color-blue)] hover:underline">
                          <Mail className="h-3 w-3" /> {c.email}
                        </a>
                      )}
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </a>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleRemove(c.id)}
                      disabled={removing === c.id}
                      className="shrink-0 rounded-lg p-1.5 text-[var(--color-ink-faint)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Contact type guide */}
      <Card className="p-5">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Contact roles</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.entries(CONTACT_TYPE_LABELS) as [ContactType, string][]).map(([type, label]) => (
            <div key={type} className="flex items-center gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CONTACT_TYPE_COLORS[type]}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
