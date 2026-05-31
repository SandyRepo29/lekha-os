/** Branded HTML email templates for Lekha OS notifications. */

const BASE = `
  <div style="font-family:Inter,system-ui,sans-serif;background:#06070d;color:#e8eaf2;max-width:600px;margin:0 auto;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
    <div style="background:linear-gradient(120deg,#4f46e5,#7c3aed);padding:28px 32px;display:flex;align-items:center;gap:12px">
      <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-flex;align-items:center;justify-content:center">
        <div style="width:12px;height:12px;background:#fff;border-radius:50%"></div>
      </div>
      <div>
        <div style="font-weight:800;font-size:20px;letter-spacing:0.05em">LEKHA<span style="color:#2dd4ff">OS</span></div>
        <div style="font-size:11px;opacity:0.7;margin-top:2px">Trust. Governance. Compliance.</div>
      </div>
    </div>
    <div style="padding:32px">BODY</div>
    <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#646a82;text-align:center">
      Lekha OS · Built for India 🇮🇳 · <a href="SITE_URL" style="color:#6366f1;text-decoration:none">Open platform →</a>
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

export function weeklyDigestHtml(d: WeeklyDigestData): { subject: string; html: string } {
  const subject = `📊 Weekly compliance digest — ${d.orgName}`;
  const hasAlerts = d.expiringSoon.length > 0 || d.highRisk.length > 0 || d.missingRequired.length > 0;

  const expiryRows = d.expiringSoon.slice(0, 8).map((e) => `
    <tr>
      <td style="padding:8px 0;color:#e8eaf2;font-size:14px">${e.vendorName}</td>
      <td style="padding:8px 0;color:#9aa0b5;font-size:14px">${e.documentType}</td>
      <td style="padding:8px 0;font-size:14px;font-weight:600;color:${e.daysLeft <= 7 ? "#ef4444" : e.daysLeft <= 15 ? "#f97316" : "#f59e0b"}">${e.daysLeft <= 0 ? "EXPIRED" : `${e.daysLeft}d`}</td>
    </tr>
  `).join("");

  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;font-weight:700">Weekly Compliance Digest</h2>
    <p style="color:#9aa0b5;margin:0 0 28px;font-size:15px">${d.orgName} · ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>

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
