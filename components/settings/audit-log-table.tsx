"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/backend/src/modules/team/team-repo";

type LogEntry = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  createdAt: Date;
  actorId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  severity: "critical" | "warning" | "info";
};

const SEVERITY_STYLES = {
  critical: "bg-red-500/10 text-red-400 border-red-500/30",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
};

function formatAction(action: string): string {
  return action.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function getModule(action: string): string {
  return action.split(".")[0] ?? "";
}

export function AuditLogTable({
  logs,
  members,
  moduleOptions,
  filters,
  page,
  totalPages,
  total,
  orgId,
}: {
  logs: LogEntry[];
  members: TeamMember[];
  moduleOptions: { value: string; label: string }[];
  filters: { userId: string; module: string; search: string; from: string; to: string };
  page: number;
  totalPages: number;
  total: number;
  orgId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, start] = useTransition();

  const [userId, setUserId] = useState(filters.userId);
  const [module, setModule] = useState(filters.module);
  const [search, setSearch] = useState(filters.search);
  const [from, setFrom] = useState(filters.from);
  const [to, setTo] = useState(filters.to);

  function applyFilters(overrides: Record<string, string> = {}) {
    const p = new URLSearchParams({
      ...(userId && { userId }),
      ...(module && { module }),
      ...(search && { search }),
      ...(from && { from }),
      ...(to && { to }),
      ...overrides,
      page: "1",
    });
    start(() => router.push(`${pathname}?${p.toString()}`));
  }

  function navigate(newPage: number) {
    const p = new URLSearchParams({
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.module && { module: filters.module }),
      ...(filters.search && { search: filters.search }),
      ...(filters.from && { from: filters.from }),
      ...(filters.to && { to: filters.to }),
      page: String(newPage),
    });
    start(() => router.push(`${pathname}?${p.toString()}`));
  }

  function exportCsv() {
    const params = new URLSearchParams({
      orgId,
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.module && { module: filters.module }),
      ...(filters.search && { search: filters.search }),
      ...(filters.from && { from: filters.from }),
      ...(filters.to && { to: filters.to }),
    });
    window.open(`/api/export/audit-logs?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <Select value={userId} onChange={(e) => { setUserId(e.target.value); applyFilters({ userId: e.target.value }); }} className="w-44 text-sm">
            <SelectOption value="">All users</SelectOption>
            {members.map((m) => (
              <SelectOption key={m.userId} value={m.userId}>{m.fullName || m.email}</SelectOption>
            ))}
          </Select>
          <Select value={module} onChange={(e) => { setModule(e.target.value); applyFilters({ module: e.target.value }); }} className="w-40 text-sm">
            {moduleOptions.map((o) => (
              <SelectOption key={o.value} value={o.value}>{o.label}</SelectOption>
            ))}
          </Select>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters({ search })}
            placeholder="Search actions…"
            className="w-48 text-sm"
          />
          <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); applyFilters({ from: e.target.value }); }} className="w-40 text-sm" />
          <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); applyFilters({ to: e.target.value }); }} className="w-40 text-sm" />
          <Button variant="subtle" size="sm" onClick={exportCsv}>Export CSV</Button>
        </div>
      </Card>

      {/* Log table */}
      <Card>
        {logs.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--color-ink-dim)]">No audit events found for the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-xs text-[var(--color-ink-faint)]">
                  <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
                  <th className="px-4 py-3 text-left font-semibold">Actor</th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                  <th className="px-4 py-3 text-left font-semibold">Module</th>
                  <th className="px-4 py-3 text-left font-semibold">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white transition-colors">
                    <td className="px-4 py-3 text-xs text-[var(--color-ink-faint)] whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--color-ink)]">{log.actorName || log.actorEmail || "System"}</div>
                      {log.actorName && <div className="text-xs text-[var(--color-ink-faint)]">{log.actorEmail}</div>}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--color-ink)]">
                      {formatAction(log.action)}
                    </td>
                    <td className="px-4 py-3 text-xs capitalize text-[var(--color-ink-faint)]">
                      {getModule(log.action)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold capitalize", SEVERITY_STYLES[log.severity])}>
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-[var(--color-ink-faint)]">
          <span>Showing {((page - 1) * 50) + 1}–{Math.min(page * 50, total)} of {total}</span>
          <div className="flex gap-2">
            <Button variant="subtle" size="sm" disabled={page <= 1} onClick={() => navigate(page - 1)}>Previous</Button>
            <Button variant="subtle" size="sm" disabled={page >= totalPages} onClick={() => navigate(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
