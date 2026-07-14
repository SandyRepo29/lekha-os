"use client";

import { useState, useTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import { connectIntegration, disconnectIntegration, type IntegrationState } from "@/backend/src/modules/settings/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Link2, Link2Off } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Integration } from "@/lib/db/schema";

type ProviderConfig = {
  label: string;
  description: string;
  category: "email" | "communication" | "storage";
  icon: string;
  fields: { name: string; label: string; type?: string; placeholder?: string }[];
};

const PROVIDER_CONFIG: Partial<Record<Integration["provider"], ProviderConfig>> = {
  resend: {
    label: "Resend",
    description: "Transactional email for alerts and digests",
    category: "email",
    icon: "📧",
    fields: [{ name: "apiKey", label: "API Key", type: "password", placeholder: "re_..." }],
  },
  smtp: {
    label: "SMTP",
    description: "Connect any SMTP email server",
    category: "email",
    icon: "✉️",
    fields: [
      { name: "host", label: "SMTP Host", placeholder: "smtp.example.com" },
      { name: "port", label: "Port", placeholder: "587" },
      { name: "user", label: "Username", placeholder: "user@example.com" },
      { name: "password", label: "Password", type: "password" },
    ],
  },
  google_workspace: {
    label: "Google Workspace",
    description: "Use Gmail for email delivery",
    category: "email",
    icon: "🔵",
    fields: [{ name: "serviceAccount", label: "Service Account JSON", placeholder: '{"type":"service_account",...}' }],
  },
  microsoft_365: {
    label: "Microsoft 365",
    description: "Use Outlook for email delivery",
    category: "email",
    icon: "🟦",
    fields: [{ name: "clientId", label: "Client ID" }, { name: "clientSecret", label: "Client Secret", type: "password" }],
  },
  slack: {
    label: "Slack",
    description: "Send compliance alerts to Slack channels",
    category: "communication",
    icon: "💬",
    fields: [{ name: "webhookUrl", label: "Webhook URL", placeholder: "https://hooks.slack.com/..." }],
  },
  teams: {
    label: "Microsoft Teams",
    description: "Send alerts to Teams channels",
    category: "communication",
    icon: "🟪",
    fields: [{ name: "webhookUrl", label: "Webhook URL", placeholder: "https://outlook.office.com/webhook/..." }],
  },
  whatsapp: {
    label: "WhatsApp",
    description: "Send alerts via WhatsApp Business API",
    category: "communication",
    icon: "🟢",
    fields: [{ name: "phoneNumberId", label: "Phone Number ID" }, { name: "accessToken", label: "Access Token", type: "password" }],
  },
  google_drive: {
    label: "Google Drive",
    description: "Store compliance documents in Google Drive",
    category: "storage",
    icon: "📁",
    fields: [{ name: "serviceAccount", label: "Service Account JSON" }],
  },
  onedrive: {
    label: "OneDrive",
    description: "Store compliance documents in OneDrive",
    category: "storage",
    icon: "☁️",
    fields: [{ name: "clientId", label: "Client ID" }, { name: "clientSecret", label: "Client Secret", type: "password" }],
  },
  sharepoint: {
    label: "SharePoint",
    description: "Store and sync documents with SharePoint",
    category: "storage",
    icon: "📄",
    fields: [{ name: "siteUrl", label: "Site URL", placeholder: "https://company.sharepoint.com/sites/..." }, { name: "clientId", label: "Client ID" }, { name: "clientSecret", label: "Client Secret", type: "password" }],
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  email: "Email",
  communication: "Communication",
  storage: "Storage",
};

function ConnectModal({
  provider,
  config,
  onClose,
}: {
  provider: Integration["provider"];
  config: ProviderConfig;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<IntegrationState, FormData>(connectIntegration, undefined);
  const router = useRouter();

  if (state?.ok) {
    setTimeout(() => { onClose(); router.refresh(); }, 800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[#0f0f14] p-6 shadow-2xl">
        <h3 className="font-semibold text-[var(--color-ink)]">Connect {config.label}</h3>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">{config.description}</p>
        <form action={action} className="mt-4 space-y-3">
          <input type="hidden" name="provider" value={provider} />
          {config.fields.map((f) => (
            <div key={f.name}>
              <Label htmlFor={f.name}>{f.label}</Label>
              <Input id={f.name} name={f.name} type={f.type ?? "text"} placeholder={f.placeholder} required />
            </div>
          ))}
          {state?.error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{state.error}</p>
          )}
          {state?.ok && (
            <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Connected!
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <Button type="submit" variant="primary" disabled={pending}>{pending ? "Connecting…" : "Connect"}</Button>
            <Button type="button" variant="subtle" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function IntegrationCard({
  integration,
  canManage,
}: {
  integration: Integration;
  canManage: boolean;
}) {
  const router = useRouter();
  const config = PROVIDER_CONFIG[integration.provider];
  const [showConnect, setShowConnect] = useState(false);
  const [, start] = useTransition();

  if (!config) return null;

  const isConnected = integration.status === "connected";

  function onDisconnect() {
    if (!confirm(`Disconnect ${config!.label}?`)) return;
    start(async () => {
      await disconnectIntegration(integration.provider);
      router.refresh();
    });
  }

  return (
    <>
      {showConnect && (
        <ConnectModal provider={integration.provider} config={config} onClose={() => setShowConnect(false)} />
      )}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <div className="font-medium text-[var(--color-ink)]">{config.label}</div>
              <div className="text-xs text-[var(--color-ink-faint)]">{config.description}</div>
            </div>
          </div>
          <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold", isConnected ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-[var(--color-line)] bg-white text-[var(--color-ink-faint)]")}>
            {isConnected ? "Connected" : "Not connected"}
          </span>
        </div>
        {canManage && (
          <div className="flex gap-2">
            {isConnected ? (
              <Button variant="subtle" size="sm" onClick={onDisconnect} className="flex items-center gap-1 text-[var(--color-ink-dim)]">
                <Link2Off className="h-3.5 w-3.5" /> Disconnect
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowConnect(true)} className="flex items-center gap-1">
                <Link2 className="h-3.5 w-3.5" /> Connect
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export function IntegrationGrid({
  integrations,
  canManage,
}: {
  integrations: Integration[];
  canManage: boolean;
}) {
  const byCategory = integrations.reduce<Record<string, Integration[]>>((acc, i) => {
    const cat = PROVIDER_CONFIG[i.provider]?.category ?? "other";
    (acc[cat] = acc[cat] ?? []).push(i);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(byCategory).map(([category, items]) => (
        <div key={category}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
            {CATEGORY_LABELS[category] ?? category}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((i) => (
              <IntegrationCard key={i.id} integration={i} canManage={canManage} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
