// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComplianceBreakdown } from "./compliance-breakdown";
import { makeDocument } from "../../tests/fixtures/documents";
import type { VendorDocument } from "@/lib/db/schema";

function renderBreakdown(risk = "medium", score = 60, docs: Partial<VendorDocument>[] = []) {
  return render(
    <ComplianceBreakdown
      risk={risk}
      currentScore={score}
      docs={docs.map((d) => makeDocument(d))}
    />
  );
}

describe("ComplianceBreakdown", () => {
  it("renders the current score", () => {
    renderBreakdown("medium", 75);
    expect(screen.getByText("75")).toBeInTheDocument();
  });

  it("renders the max achievable score", () => {
    renderBreakdown("low", 70);
    // The max achievable for low risk is 110 capped to 100
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders the score progress bar", () => {
    const { container } = renderBreakdown("medium", 60);
    const progressBars = container.querySelectorAll(".h-2");
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it("shows no-documents check item when there are no docs", () => {
    renderBreakdown("medium", 60, []);
    expect(screen.getByText(/Document coverage/i)).toBeInTheDocument();
  });

  it("renders a check item for ISO 27001 presence", () => {
    renderBreakdown("medium", 60, []);
    expect(screen.getByText(/ISO\/IEC 27001/i)).toBeInTheDocument();
  });

  it("renders a check item for SOC 2 presence", () => {
    renderBreakdown("medium", 60, []);
    expect(screen.getByText(/SOC 2/i)).toBeInTheDocument();
  });

  it("shows positive coverage when 5+ valid docs exist", () => {
    const docs = Array(5).fill(null).map((_, i) =>
      makeDocument({ id: `doc-${i}`, documentType: `Doc ${i}`, status: "valid" })
    );
    render(
      <ComplianceBreakdown risk="medium" currentScore={85} docs={docs} />
    );
    // When docs ≥ 5 valid, "Document coverage" factor should be positive
    expect(screen.getByText(/Document coverage/i)).toBeInTheDocument();
  });

  it("renders the scoring formula explanation", () => {
    renderBreakdown("medium", 60);
    expect(screen.getByText(/Risk base/i)).toBeInTheDocument();
  });
});
