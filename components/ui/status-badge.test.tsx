// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./status-badge";

describe("StatusBadge — status type", () => {
  const statusCases: [string, string][] = [
    ["active",        "Active"],
    ["pending",       "Pending"],
    ["inactive",      "Inactive"],
    ["approved",      "Approved"],
    ["rejected",      "Rejected"],
    ["submitted",     "Submitted"],
    ["requested",     "Requested"],
    ["expired",       "Expired"],
    ["needs_followup","Needs Follow-up"],
    ["valid",         "Valid"],
    ["expiring",      "Expiring"],
    ["missing",       "Missing"],
  ];

  statusCases.forEach(([value, expected]) => {
    it(`renders "${expected}" for value="${value}"`, () => {
      render(<StatusBadge value={value} />);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  it("does not throw for unknown status values", () => {
    expect(() => render(<StatusBadge value="totally-unknown" />)).not.toThrow();
  });
});

describe("StatusBadge — risk type", () => {
  const riskCases: [string, string][] = [
    ["low",      "Low"],
    ["medium",   "Medium"],
    ["high",     "High"],
    ["critical", "Critical"],
  ];

  riskCases.forEach(([value, expected]) => {
    it(`renders "${expected}" for risk value="${value}"`, () => {
      render(<StatusBadge value={value} type="risk" />);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  it("applies emerald colour class for 'active' status", () => {
    render(<StatusBadge value="active" />);
    const el = screen.getByText("Active");
    expect(el.className).toContain("emerald");
  });

  it("applies red colour class for 'rejected' status", () => {
    render(<StatusBadge value="rejected" />);
    const el = screen.getByText("Rejected");
    expect(el.className).toContain("red");
  });

  it("applies amber colour class for 'expiring' status", () => {
    render(<StatusBadge value="expiring" />);
    const el = screen.getByText("Expiring");
    expect(el.className).toContain("amber");
  });

  it("applies red colour for 'high' risk", () => {
    render(<StatusBadge value="high" type="risk" />);
    const el = screen.getByText("High");
    expect(el.className).toContain("red");
  });

  it("applies emerald colour for 'low' risk", () => {
    render(<StatusBadge value="low" type="risk" />);
    const el = screen.getByText("Low");
    expect(el.className).toContain("emerald");
  });

  it("accepts an additional className", () => {
    render(<StatusBadge value="active" className="extra-class" />);
    const el = screen.getByText("Active");
    expect(el.className).toContain("extra-class");
  });
});
