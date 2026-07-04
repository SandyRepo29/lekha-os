"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getOrgFlagOverridesAction,
  setOrgFlagOverrideAction,
  removeOrgFlagOverrideAction,
  getOrgsForSelectAction,
} from "@/lib/platform-admin/actions";
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";

type Override = Record<string, unknown>;
type Org = { id: string; name: string };

export function FlagOverridePanel({ flagKey, isOwner }: { flagKey: string; isOwner: boolean }) {
  const [open, setOpen] = useState(false);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [enabledVal, setEnabledVal] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function load() {
    startTransition(async () => {
      const [ovRes, orgRes] = await Promise.all([
        getOrgFlagOverridesAction(flagKey),
        getOrgsForSelectAction(),
      ]);
      setOverrides(ovRes.data as Override[]);
      setOrgs(orgRes.data as Org[]);
    });
  }

  useEffect(() => { if (open) load(); }, [open]);

  function handleAdd() {
    if (!selectedOrg) return;
    startTransition(async () => {
      await setOrgFlagOverrideAction(selectedOrg, flagKey, enabledVal);
      setAddOpen(false);
      setSelectedOrg("");
      load();
      router.refresh();
    });
  }

  function handleRemove(orgId: string) {
    startTransition(async () => {
      await removeOrgFlagOverrideAction(orgId, flagKey);
      load();
      router.refresh();
    });
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        Per-org overrides {overrides.length > 0 && <span className="rounded-full bg-[#00B8D9]/20 text-[#00B8D9] px-1.5">{overrides.length}</span>}
      </button>

      {open && (
        <div className="mt-2 ml-4 rounded-lg border border-[#30363d] bg-[#0d1117] p-3 space-y-2">
          {overrides.length === 0 && !addOpen && (
            <p className="text-xs text-white/30">No per-org overrides.</p>
          )}
          {overrides.map((ov) => (
            <div key={ov.organization_id as string} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-white/70">{ov.org_name as string}</span>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 font-medium ${ov.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                  {ov.enabled ? "Enabled" : "Disabled"}
                </span>
                {isOwner && (
                  <button onClick={() => handleRemove(ov.organization_id as string)} className="text-white/30 hover:text-red-400" disabled={isPending}>
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {isOwner && !addOpen && (
            <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1 text-xs text-[#00B8D9]/70 hover:text-[#00B8D9]">
              <Plus className="h-3 w-3" /> Add override
            </button>
          )}

          {isOwner && addOpen && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="rounded border border-[#30363d] bg-[#161b22] px-2 py-1 text-xs text-white"
              >
                <option value="">Select org…</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <select
                value={enabledVal ? "1" : "0"}
                onChange={(e) => setEnabledVal(e.target.value === "1")}
                className="rounded border border-[#30363d] bg-[#161b22] px-2 py-1 text-xs text-white"
              >
                <option value="1">Enable</option>
                <option value="0">Disable</option>
              </select>
              <button onClick={handleAdd} disabled={isPending || !selectedOrg} className="rounded bg-[#007A94] px-2 py-1 text-xs font-semibold text-white disabled:opacity-40">
                Save
              </button>
              <button onClick={() => setAddOpen(false)} className="text-xs text-white/30 hover:text-white/60">Cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
