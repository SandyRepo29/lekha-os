export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getAllOrgSettings } from "@/lib/services/platform/platform-settings-service";
import { isAdminOrOwner } from "@/lib/ui/role-guard";
import { Card } from "@/components/ui/card";
import {
  Settings,
  Bell,
  Search,
  Paperclip,
  Tag,
  CheckSquare,
  Zap,
  Shield,
} from "lucide-react";

const SETTING_DESCRIPTIONS: Record<string, { label: string; description: string; type: "boolean" | "string" | "number" | "array" }> = {
  "notification.email.enabled": {
    label: "Email Notifications",
    description: "Enable or disable all email notifications for this organisation.",
    type: "boolean",
  },
  "notification.digest.frequency": {
    label: "Digest Frequency",
    description: "How often the AI-written governance digest email is sent (daily, weekly, monthly).",
    type: "string",
  },
  "notification.digest.day": {
    label: "Digest Day",
    description: "Day of the week the weekly digest is delivered (monday – sunday).",
    type: "string",
  },
  "export.max_rows": {
    label: "Export Max Rows",
    description: "Maximum number of rows allowed per CSV or Excel export.",
    type: "number",
  },
  "export.include_branding": {
    label: "Export Branding",
    description: "Include AUDT branding in generated PDF and CSV exports.",
    type: "boolean",
  },
  "search.min_query_length": {
    label: "Search Min Query Length",
    description: "Minimum number of characters required before a search is executed.",
    type: "number",
  },
  "search.max_results": {
    label: "Search Max Results",
    description: "Maximum number of results returned per search query.",
    type: "number",
  },
  "tasks.default_sla.critical": {
    label: "Task SLA — Critical (hours)",
    description: "Default SLA window in hours for critical-severity tasks.",
    type: "number",
  },
  "tasks.default_sla.high": {
    label: "Task SLA — High (hours)",
    description: "Default SLA window in hours for high-severity tasks.",
    type: "number",
  },
  "tasks.default_sla.medium": {
    label: "Task SLA — Medium (hours)",
    description: "Default SLA window in hours for medium-severity tasks.",
    type: "number",
  },
  "tasks.default_sla.low": {
    label: "Task SLA — Low (hours)",
    description: "Default SLA window in hours for low-severity tasks.",
    type: "number",
  },
  "comments.max_length": {
    label: "Comment Max Length",
    description: "Maximum character length allowed for a single comment.",
    type: "number",
  },
  "tags.max_per_entity": {
    label: "Tags Per Entity",
    description: "Maximum number of tags that can be applied to any single entity.",
    type: "number",
  },
  "attachments.max_size_mb": {
    label: "Attachment Max Size (MB)",
    description: "Maximum file size in megabytes for uploaded attachments.",
    type: "number",
  },
  "attachments.allowed_types": {
    label: "Allowed Attachment Types",
    description: "File extensions permitted for upload (comma-separated list).",
    type: "array",
  },
  "workflow.max_triggers": {
    label: "Workflow Max Triggers",
    description: "Maximum number of active workflow triggers allowed per organisation.",
    type: "number",
  },
  "ai.summaries.cache_hours": {
    label: "AI Summary Cache (hours)",
    description: "How long AI-generated summaries are cached before regeneration is allowed.",
    type: "number",
  },
  "audit_trail.retention_days": {
    label: "Audit Trail Retention (days)",
    description: "Number of days audit log events are retained before automatic expiry.",
    type: "number",
  },
};

const CATEGORY_META: {
  prefix: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    prefix: "notification.",
    label: "Notifications",
    icon: <Bell className="h-4 w-4" />,
    color: "text-blue-400",
  },
  {
    prefix: "export.",
    label: "Exports",
    icon: <Paperclip className="h-4 w-4" />,
    color: "text-indigo-400",
  },
  {
    prefix: "search.",
    label: "Search",
    icon: <Search className="h-4 w-4" />,
    color: "text-violet-400",
  },
  {
    prefix: "tasks.",
    label: "Tasks & SLAs",
    icon: <CheckSquare className="h-4 w-4" />,
    color: "text-emerald-400",
  },
  {
    prefix: "comments.",
    label: "Comments",
    icon: <Tag className="h-4 w-4" />,
    color: "text-amber-400",
  },
  {
    prefix: "tags.",
    label: "Tags",
    icon: <Tag className="h-4 w-4" />,
    color: "text-pink-400",
  },
  {
    prefix: "attachments.",
    label: "Attachments",
    icon: <Paperclip className="h-4 w-4" />,
    color: "text-cyan-400",
  },
  {
    prefix: "workflow.",
    label: "Workflow Studio™",
    icon: <Zap className="h-4 w-4" />,
    color: "text-yellow-400",
  },
  {
    prefix: "ai.",
    label: "AI & Governance Copilot™",
    icon: <Zap className="h-4 w-4" />,
    color: "text-purple-400",
  },
  {
    prefix: "audit_trail.",
    label: "Audit Trail",
    icon: <Shield className="h-4 w-4" />,
    color: "text-rose-400",
  },
];

function formatValue(value: unknown, type: "boolean" | "string" | "number" | "array"): string {
  if (value === null || value === undefined) return "—";
  if (type === "array" && Array.isArray(value)) return (value as string[]).join(", ");
  if (type === "boolean") return value ? "Enabled" : "Disabled";
  return String(value);
}

export default async function PlatformSettingsPage() {
  const session = await requireUser();

  if (!session.org || !isAdminOrOwner(session.org.role)) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2 text-sm text-[var(--color-ink-dim)]">
          <span>Platform</span>
          <span>/</span>
          <span className="text-[var(--color-ink)]">Settings</span>
        </div>
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center">
          <Shield className="h-8 w-8 text-[var(--color-ink-dim)] mx-auto mb-3" />
          <p className="text-[var(--color-ink)] font-medium">Admin access required</p>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">
            Only organisation owners and admins can view or modify platform settings.
          </p>
        </div>
      </div>
    );
  }

  const allSettings = await getAllOrgSettings(session.org.id);

  const settingsByKey: Record<string, { value: unknown; is_default: boolean }> = {};
  for (const s of allSettings) {
    settingsByKey[s.key] = { value: s.value, is_default: s.is_default };
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-ink-dim)]">
        <span>Platform</span>
        <span>/</span>
        <span className="text-[var(--color-ink)]">Settings</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-[#F8F9FB] p-2">
          <Settings className="h-5 w-5 text-[var(--color-blue)]" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
            Platform Settings
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            Organisation-level configuration for all AUDT platform features.
            Contact support to modify settings via the API.
          </p>
        </div>
      </div>

      {/* Setting groups */}
      {CATEGORY_META.map((cat) => {
        const keys = Object.keys(SETTING_DESCRIPTIONS).filter((k) =>
          k.startsWith(cat.prefix)
        );
        if (keys.length === 0) return null;

        return (
          <Card
            key={cat.prefix}
            className="rounded-2xl border border-[var(--color-line)] bg-white overflow-hidden"
          >
            {/* Group header */}
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--color-line)]">
              <span className={cat.color}>{cat.icon}</span>
              <span
                className="text-sm font-semibold text-[var(--color-ink)]"
                dangerouslySetInnerHTML={{ __html: cat.label }}
              />
            </div>

            {/* Rows */}
            <div className="divide-y divide-[var(--color-line)]">
              {keys.map((key) => {
                const meta = SETTING_DESCRIPTIONS[key];
                const entry = settingsByKey[key];
                const value = entry?.value;
                const isDefault = entry?.is_default ?? true;
                const displayValue = formatValue(value, meta.type);

                return (
                  <div
                    key={key}
                    className="flex items-start justify-between gap-6 px-5 py-4"
                  >
                    {/* Left: key + description */}
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-medium text-[var(--color-ink)]"
                        dangerouslySetInnerHTML={{ __html: meta.label }}
                      />
                      <p
                        className="text-xs text-[var(--color-ink-dim)] mt-0.5"
                        dangerouslySetInnerHTML={{ __html: meta.description }}
                      />
                      <code className="mt-1 inline-block text-[10px] text-[var(--color-ink-dim)] font-mono opacity-60">
                        {key}
                      </code>
                    </div>

                    {/* Right: value + badge */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={
                          meta.type === "boolean"
                            ? value
                              ? "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400"
                              : "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-500/10 text-red-400"
                            : "inline-flex items-center rounded-lg border border-[var(--color-line)] px-2.5 py-0.5 text-xs font-mono text-[var(--color-ink)]"
                        }
                      >
                        {displayValue}
                      </span>
                      {isDefault && (
                        <span className="text-[10px] text-[var(--color-ink-dim)] italic">
                          default
                        </span>
                      )}
                      {!isDefault && (
                        <span className="text-[10px] text-blue-400 font-medium">
                          custom
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      {/* Info callout */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white px-5 py-4 flex items-start gap-3">
        <Shield className="h-4 w-4 text-[var(--color-ink-dim)] mt-0.5 shrink-0" />
        <p className="text-xs text-[var(--color-ink-dim)]">
          Settings marked <span className="text-blue-400 font-medium">custom</span> override the
          platform default for this organisation. To modify a setting, use the AUDT REST API
          (<code className="font-mono">PUT /api/v1/platform/settings/:key</code>) or contact your
          AUDT administrator. Changes take effect immediately.
        </p>
      </div>
    </div>
  );
}
