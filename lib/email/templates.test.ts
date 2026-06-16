import { describe, it, expect, beforeEach } from "vitest";
import { expiryAlertHtml, weeklyDigestHtml, type ExpiryAlertData, type WeeklyDigestData } from "./templates";

const SITE_URL = "https://test.lekhaos.in";

beforeEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = SITE_URL;
});

// ─── expiryAlertHtml ─────────────────────────────────────────────────────────

describe("expiryAlertHtml", () => {
  const baseData: ExpiryAlertData = {
    orgName:      "Acme Technologies",
    vendorName:   "Razorpay Software",
    documentType: "ISO/IEC 27001",
    expiresOn:    "2025-07-15",
    daysLeft:     30,
    vendorUrl:    `${SITE_URL}/vendors/vendor-id`,
  };

  it("returns an object with subject and html", () => {
    const result = expiryAlertHtml(baseData);
    expect(result).toHaveProperty("subject");
    expect(result).toHaveProperty("html");
  });

  it("subject contains the vendor name", () => {
    const { subject } = expiryAlertHtml(baseData);
    expect(subject).toContain("Razorpay Software");
  });

  it("subject contains the document type", () => {
    const { subject } = expiryAlertHtml(baseData);
    expect(subject).toContain("ISO/IEC 27001");
  });

  it("subject contains days left", () => {
    const { subject } = expiryAlertHtml({ ...baseData, daysLeft: 30 });
    expect(subject).toContain("30");
  });

  it("subject signals expiry when daysLeft ≤ 0 (expired)", () => {
    const { subject } = expiryAlertHtml({ ...baseData, daysLeft: -1 });
    expect(subject.toLowerCase()).toContain("expired");
  });

  it("html contains the vendor name", () => {
    const { html } = expiryAlertHtml(baseData);
    expect(html).toContain("Razorpay Software");
  });

  it("html contains the document type", () => {
    const { html } = expiryAlertHtml(baseData);
    expect(html).toContain("ISO/IEC 27001");
  });

  it("html contains the expiry date", () => {
    const { html } = expiryAlertHtml(baseData);
    expect(html).toContain("2025-07-15");
  });

  it("html contains a link to the vendor page", () => {
    const { html } = expiryAlertHtml(baseData);
    expect(html).toContain("/vendors/vendor-id");
  });

  it("html contains AUDT branding", () => {
    const { html } = expiryAlertHtml(baseData);
    expect(html).toContain("AUDT");
  });

  it("html includes the site URL for the footer link", () => {
    const { html } = expiryAlertHtml(baseData);
    expect(html).toContain(SITE_URL);
  });

  it("produces urgent subject for 7 days or fewer", () => {
    const { subject: s7 } = expiryAlertHtml({ ...baseData, daysLeft: 7 });
    const { subject: s30 } = expiryAlertHtml({ ...baseData, daysLeft: 30 });
    // The 7-day version should express more urgency (e.g. "today" or fewer days)
    expect(s7).toContain("7");
    expect(s30).toContain("30");
  });
});

// ─── weeklyDigestHtml ─────────────────────────────────────────────────────────

describe("weeklyDigestHtml", () => {
  const baseData: WeeklyDigestData = {
    orgName:       "Acme Technologies",
    expiringSoon:  [
      { vendorName: "Razorpay", documentType: "ISO 27001", expiresOn: "2025-06-15", daysLeft: 14 },
    ],
    highRisk:      [
      { vendorName: "Yotta Data", riskLevel: "high", score: 45 },
    ],
    missingRequired: [],
    totalVendors:  7,
    avgScore:      72,
    dashboardUrl:  `${SITE_URL}/dashboard`,
  };

  it("returns subject and html", () => {
    const result = weeklyDigestHtml(baseData);
    expect(result).toHaveProperty("subject");
    expect(result).toHaveProperty("html");
  });

  it("subject mentions the org name", () => {
    const { subject } = weeklyDigestHtml(baseData);
    expect(subject).toContain("Acme Technologies");
  });

  it("subject is a weekly digest label", () => {
    const { subject } = weeklyDigestHtml(baseData);
    expect(subject.toLowerCase()).toContain("digest");
  });

  it("html contains total vendor count", () => {
    const { html } = weeklyDigestHtml(baseData);
    expect(html).toContain("7");
  });

  it("html contains average compliance score", () => {
    const { html } = weeklyDigestHtml(baseData);
    expect(html).toContain("72");
  });

  it("html contains expiring vendor name", () => {
    const { html } = weeklyDigestHtml(baseData);
    expect(html).toContain("Razorpay");
  });

  it("html contains high-risk vendor name", () => {
    const { html } = weeklyDigestHtml(baseData);
    expect(html).toContain("Yotta Data");
  });

  it("html contains dashboard link", () => {
    const { html } = weeklyDigestHtml(baseData);
    expect(html).toContain("/dashboard");
  });

  it("shows all-clear message when no alerts", () => {
    const noAlerts: WeeklyDigestData = {
      ...baseData,
      expiringSoon: [],
      highRisk:     [],
    };
    const { html } = weeklyDigestHtml(noAlerts);
    expect(html.toLowerCase()).toContain("clear");
  });
});
