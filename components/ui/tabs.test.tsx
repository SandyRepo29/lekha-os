// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "./tabs";

const basicTabs = [
  { id: "tab1", label: "Documents" },
  { id: "tab2", label: "Compliance" },
  { id: "tab3", label: "Risk" },
];

function TestTabs({ defaultTab }: { defaultTab?: string }) {
  return (
    <Tabs tabs={basicTabs} defaultTab={defaultTab}>
      {(active) => (
        <div>
          {active === "tab1" && <div>Documents content</div>}
          {active === "tab2" && <div>Compliance content</div>}
          {active === "tab3" && <div>Risk content</div>}
        </div>
      )}
    </Tabs>
  );
}

describe("Tabs", () => {
  it("renders all tab labels", () => {
    render(<TestTabs />);
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("Compliance")).toBeInTheDocument();
    expect(screen.getByText("Risk")).toBeInTheDocument();
  });

  it("shows first tab content by default", () => {
    render(<TestTabs />);
    expect(screen.getByText("Documents content")).toBeInTheDocument();
    expect(screen.queryByText("Compliance content")).not.toBeInTheDocument();
  });

  it("shows specified defaultTab content on mount", () => {
    render(<TestTabs defaultTab="tab2" />);
    expect(screen.getByText("Compliance content")).toBeInTheDocument();
    expect(screen.queryByText("Documents content")).not.toBeInTheDocument();
  });

  it("switches content when a tab is clicked", async () => {
    const user = userEvent.setup();
    render(<TestTabs />);
    await user.click(screen.getByText("Compliance"));
    expect(screen.getByText("Compliance content")).toBeInTheDocument();
    expect(screen.queryByText("Documents content")).not.toBeInTheDocument();
  });

  it("can switch back to the first tab", async () => {
    const user = userEvent.setup();
    render(<TestTabs defaultTab="tab2" />);
    await user.click(screen.getByText("Documents"));
    expect(screen.getByText("Documents content")).toBeInTheDocument();
  });

  it("renders a count badge when count > 0", () => {
    render(
      <Tabs tabs={[{ id: "t1", label: "Docs", count: 3 }]}>
        {() => <div>content</div>}
      </Tabs>
    );
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("does not render a count badge when count is 0", () => {
    render(
      <Tabs tabs={[{ id: "t1", label: "Docs", count: 0 }]}>
        {() => <div>content</div>}
      </Tabs>
    );
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("does not render a count badge when count is undefined", () => {
    render(
      <Tabs tabs={[{ id: "t1", label: "Docs" }]}>
        {() => <div>content</div>}
      </Tabs>
    );
    // Tab label should be there, no numeric badge
    expect(screen.getByText("Docs")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("applies danger badge styling when badge='danger'", () => {
    render(
      <Tabs tabs={[{ id: "t1", label: "Risk", count: 2, badge: "danger" }]}>
        {() => <div>content</div>}
      </Tabs>
    );
    const countEl = screen.getByText("2");
    expect(countEl.className).toContain("red");
  });

  it("applies warn badge styling when badge='warn'", () => {
    render(
      <Tabs tabs={[{ id: "t1", label: "Expiring", count: 1, badge: "warn" }]}>
        {() => <div>content</div>}
      </Tabs>
    );
    const countEl = screen.getByText("1");
    expect(countEl.className).toContain("amber");
  });
});
