/** Branded HTML email templates for AUDT notifications. */

const BASE = `
  <div style="font-family:Inter,system-ui,sans-serif;background:#06070d;color:#e8eaf2;max-width:600px;margin:0 auto;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
    <div style="background:linear-gradient(120deg,#4f46e5,#7c3aed);padding:28px 32px;display:flex;align-items:center;gap:12px">
      <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-flex;align-items:center;justify-content:center">
        <div style="width:12px;height:12px;background:#fff;border-radius:50%"></div>
      </div>
      <div>
        <div style="font-weight:800;font-size:20px;letter-spacing:0.08em">AUDT</div>
        <div style="font-size:11px;opacity:0.7;margin-top:2px">Governance Built on Proof.</div>
      </div>
    </div>
    <div style="padding:32px">BODY</div>
    <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#646a82;text-align:center">
      AUDT · Built for India 🇮🇳 · <a href="SITE_URL" style="color:#6366f1;text-decoration:none">audt.tech →</a>
    </div>
  </div>
`;

function wrap(body: string) {
  return BASE
    .replace("BODY", body)
    .replace("SITE_URL", process.env.NEXT_PUBLIC_SITE_URL ?? "https://lekha-os.vercel.app");
}

export type ExpiryAlertData = {
  orgName: string;
  vendorName: string;
  documentType: string;
  expiresOn: string;
  daysLeft: number;
  vendorUrl: string;
};

export function expiryAlertHtml(d: ExpiryAlertData): { subject: string; html: string } {
  const urgency = d.daysLeft <= 0 ? "has expired" : d.daysLeft <= 7 ? "expires TODAY" : `expires in ${d.daysLeft} days`;
  const color = d.daysLeft <= 0 ? "#ef4444" : d.daysLeft <= 15 ? "#f97316" : "#f59e0b";
  const subject = d.daysLeft <= 0
    ? `🚨 Expired: ${d.documentType} — ${d.vendorName}`
    : `⚠️ Expiring in ${d.daysLeft}d: ${d.documentType} — ${d.vendorName}`;

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700">Document ${urgency}</h2>
    <p style="color:#9aa0b5;margin:0 0 24px;font-size:15px">Action required for <strong style="color:#e8eaf2">${d.orgName}</strong></p>

    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-left:4px solid ${color};border-radius:12px;padding:20px;margin-bottom:24px">
      <div style="font-size:13px;text-transform:uppercase;letter-spacing:0.1em;color:#646a82;margin-bottom:8px">Document</div>
      <div style="font-size:18px;font-weight:600;margin-bottom:4px">${d.documentType}</div>
      <div style="color:#9aa0b5;font-size:14px">Vendor: <strong style="color:#e8eaf2">${d.vendorName}</strong></div>
      <div style="margin-top:12px;padding:8px 12px;background:${color}22;border-radius:8px;display:inline-block">
        <span style="color:${color};font-weight:700;font-size:14px">
          ${d.daysLeft <= 0 ? `Expired on ${d.expiresOn}` : `Expires ${d.expiresOn} (${d.daysLeft} days)`}
        </span>
      </div>
    </div>

    <a href="${d.vendorUrl}" style="display:inline-block;background:linear-gradient(120deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600;font-size:15px">
      View Vendor →
    </a>

    <p style="color:#646a82;font-size:13px;margin-top:24px">
      Upload a renewed document on the vendor page to clear this alert and update the compliance score.
    </p>
  `;

  return { subject, html: wrap(body) };
}

export type WeeklyDigestData = {
  orgName: string;
  expiringSoon: { vendorName: string; documentType: string; expiresOn: string; daysLeft: number }[];
  highRisk: { vendorName: string; riskLevel: string; score: number }[];
  missingRequired: { vendorName: string; missingDocs: string[] }[];
  totalVendors: number;
  avgScore: number;
  dashboardUrl: string;
};

export function weeklyDigestHtml(d: WeeklyDigestData, aiBrief?: string): { subject: string; html: string } {
  const subject = `📊 Weekly compliance digest — ${d.orgName}`;
  const hasAlerts = d.expiringSoon.length > 0 || d.highRisk.length > 0 || d.missingRequired.length > 0;

  const expiryRows = d.expiringSoon.slice(0, 8).map((e) => `
    <tr>
      <td style="padding:8px 0;color:#e8eaf2;font-size:14px">${e.vendorName}</td>
      <td style="padding:8px 0;color:#9aa0b5;font-size:14px">${e.documentType}</td>
      <td style="padding:8px 0;font-size:14px;font-weight:600;color:${e.daysLeft <= 7 ? "#ef4444" : e.daysLeft <= 15 ? "#f97316" : "#f59e0b"}">${e.daysLeft <= 0 ? "EXPIRED" : `${e.daysLeft}d`}</td>
    </tr>
  `).join("");

  const aiBriefBlock = aiBrief ? `
    <div style="background:rgba(99,102,241,0.08);border-left:3px solid #6366f1;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:28px">
      <div style="font-size:11px;font-weight:700;color:#6366f1;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px">✦ Lekha AI — Executive Brief</div>
      <p style="margin:0;font-size:14px;color:#e8eaf2;line-height:1.6">${aiBrief}</p>
    </div>
  ` : "";

  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;font-weight:700">Weekly Compliance Digest</h2>
    <p style="color:#9aa0b5;margin:0 0 20px;font-size:15px">${d.orgName} · ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
    ${aiBriefBlock}

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:28px">
      ${[
        { label: "Total Vendors", val: d.totalVendors, color: "#6366f1" },
        { label: "Avg Compliance", val: `${d.avgScore}/100`, color: d.avgScore >= 70 ? "#10b981" : "#f59e0b" },
        { label: "Expiring Soon", val: d.expiringSoon.length, color: d.expiringSoon.length > 0 ? "#f59e0b" : "#10b981" },
      ].map((s) => `
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:800;color:${s.color}">${s.val}</div>
          <div style="font-size:12px;color:#646a82;margin-top:4px">${s.label}</div>
        </div>
      `).join("")}
    </div>

    ${d.expiringSoon.length > 0 ? `
    <h3 style="font-size:16px;font-weight:700;margin:0 0 12px;color:#f59e0b">⚠️ Expiring Documents (${d.expiringSoon.length})</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <thead>
        <tr style="border-bottom:1px solid rgba(255,255,255,0.08)">
          <th style="text-align:left;padding:8px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#646a82">Vendor</th>
          <th style="text-align:left;padding:8px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#646a82">Document</th>
          <th style="text-align:left;padding:8px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#646a82">Expires</th>
        </tr>
      </thead>
      <tbody>${expiryRows}</tbody>
    </table>
    ` : ""}

    ${d.highRisk.length > 0 ? `
    <h3 style="font-size:16px;font-weight:700;margin:0 0 12px;color:#ef4444">🔴 High Risk Vendors (${d.highRisk.length})</h3>
    <div style="margin-bottom:24px">
      ${d.highRisk.slice(0, 5).map((v) => `
        <div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;justify-content:space-between">
          <span style="color:#e8eaf2;font-size:14px">${v.vendorName}</span>
          <span style="font-size:13px;color:#ef4444;font-weight:600">${v.riskLevel} risk · score ${v.score}</span>
        </div>
      `).join("")}
    </div>
    ` : ""}

    ${!hasAlerts ? `
    <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
      <div style="font-size:24px;margin-bottom:8px">✅</div>
      <div style="color:#10b981;font-weight:600">All clear this week!</div>
      <div style="color:#9aa0b5;font-size:13px;margin-top:4px">No expiring documents or high-risk vendors requiring action.</div>
    </div>
    ` : ""}

    <a href="${d.dashboardUrl}" style="display:inline-block;background:linear-gradient(120deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600;font-size:15px">
      Open Dashboard →
    </a>
  `;

  return { subject, html: wrap(body) };
}

// ─── Billing templates ────────────────────────────────────────────────────────

export function trialEndingSoonHtml(d: { orgName: string; daysLeft: number }): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://audt.tech";
  return wrap(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700">Your trial ends in ${d.daysLeft} day${d.daysLeft === 1 ? "" : "s"}</h2>
    <p style="color:#9aa0b5;margin:0 0 24px;font-size:15px">Action required for <strong style="color:#e8eaf2">${d.orgName}</strong></p>
    <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:20px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:#e8eaf2;line-height:1.6">
        Your AUDT free trial expires in <strong>${d.daysLeft} day${d.daysLeft === 1 ? "" : "s"}</strong>. Upgrade to a paid plan to continue accessing your governance data and keep your compliance program running.
      </p>
    </div>
    <a href="${siteUrl}/settings/billing" style="display:inline-block;background:linear-gradient(120deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600;font-size:15px">
      Upgrade Now →
    </a>
    <p style="color:#646a82;font-size:13px;margin-top:24px">
      Questions? Reply to this email or contact us at billing@audt.tech
    </p>
  `);
}

export function upgradeRequestedHtml(d: {
  orgName: string;
  planName: string;
  billingName: string;
  billingEmail: string;
  amount: string;
  invoiceNumber: string;
  dueAt: string;
}): string {
  return wrap(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700">New upgrade request</h2>
    <p style="color:#9aa0b5;margin:0 0 24px;font-size:15px">A customer has requested to upgrade their plan.</p>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px">
      ${[
        ["Organization", d.orgName],
        ["Plan requested", d.planName],
        ["Billing name", d.billingName],
        ["Billing email", d.billingEmail],
        ["Invoice", d.invoiceNumber],
        ["Amount", d.amount],
        ["Due", d.dueAt],
      ].map(([k, v]) => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
          <span style="color:#9aa0b5;font-size:13px">${k}</span>
          <span style="color:#e8eaf2;font-size:13px;font-weight:600">${v}</span>
        </div>
      `).join("")}
    </div>
    <p style="color:#646a82;font-size:13px">Send the bank transfer details to the customer and mark the invoice as paid once the UTR is received.</p>
  `);
}

export function upgradeConfirmationHtml(d: {
  billingName: string;
  planName: string;
  amount: string;
  invoiceNumber: string;
  dueAt: string;
}): string {
  return wrap(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700">Upgrade request received</h2>
    <p style="color:#9aa0b5;margin:0 0 24px;font-size:15px">Hi ${d.billingName}, we've received your request to upgrade to <strong style="color:#e8eaf2">${d.planName}</strong>.</p>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px">
      ${[
        ["Invoice number", d.invoiceNumber],
        ["Plan", d.planName],
        ["Amount due", d.amount],
        ["Payment due by", d.dueAt],
      ].map(([k, v]) => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
          <span style="color:#9aa0b5;font-size:13px">${k}</span>
          <span style="color:#e8eaf2;font-size:13px;font-weight:600">${v}</span>
        </div>
      `).join("")}
    </div>
    <div style="background:rgba(99,102,241,0.08);border-left:3px solid #6366f1;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:#e8eaf2;line-height:1.6">
        <strong>Bank Transfer Instructions</strong><br/>
        Account Name: AUDT Technologies Pvt. Ltd.<br/>
        Reference: ${d.invoiceNumber}<br/>
        After payment, email your UTR/transaction ID to <a href="mailto:billing@audt.tech" style="color:#6366f1">billing@audt.tech</a> and we'll activate your subscription within 24 hours.
      </p>
    </div>
    <p style="color:#646a82;font-size:13px">Questions? Contact us at billing@audt.tech</p>
  `);
}

export function invoicePaidHtml(d: {
  billingName: string;
  planName: string;
  invoiceNumber: string;
}): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://audt.tech";
  return wrap(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700">Payment confirmed ✓</h2>
    <p style="color:#9aa0b5;margin:0 0 24px;font-size:15px">Hi ${d.billingName}, your payment has been received and your subscription is now active.</p>
    <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:12px;padding:20px;margin-bottom:24px;text-align:center">
      <div style="font-size:32px;margin-bottom:8px">🎉</div>
      <div style="font-size:18px;font-weight:700;color:#10b981">Welcome to AUDT ${d.planName}!</div>
      <div style="color:#9aa0b5;font-size:13px;margin-top:4px">Invoice ${d.invoiceNumber} · Paid</div>
    </div>
    <a href="${siteUrl}/dashboard" style="display:inline-block;background:linear-gradient(120deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600;font-size:15px">
      Go to Dashboard →
    </a>
    <p style="color:#646a82;font-size:13px;margin-top:24px">
      Thank you for choosing AUDT. Your governance platform is ready.
    </p>
  `);
}

export function subscriptionCancelledHtml(d: { accessUntil: string }): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://audt.tech";
  return wrap(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700">Subscription cancelled</h2>
    <p style="color:#9aa0b5;margin:0 0 24px;font-size:15px">Your AUDT subscription has been scheduled for cancellation.</p>
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;color:#e8eaf2;line-height:1.6">
        You'll continue to have full access to AUDT until <strong>${d.accessUntil}</strong>. After that date, your account will be downgraded and data will be preserved for 90 days.
      </p>
    </div>
    <p style="color:#9aa0b5;font-size:14px;margin-bottom:24px">
      Changed your mind? You can reactivate your subscription anytime before the period ends.
    </p>
    <a href="${siteUrl}/settings/billing" style="display:inline-block;background:linear-gradient(120deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600;font-size:15px">
      Reactivate Subscription →
    </a>
    <p style="color:#646a82;font-size:13px;margin-top:24px">
      Questions? Contact us at billing@audt.tech
    </p>
  `);
}
