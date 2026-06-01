// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityFeed } from "./activity-feed";
import type { ActivityItem } from "@/lib/repositories/activity-repo";

function makeItem(overrides: Partial<ActivityItem> = {}): ActivityItem {
  return {
    id:         "item-1",
    action:     "vendor.created",
    entityType: "vendor",
    entityId:   "v1",
    metadata:   { name: "Test Vendor" },
    actorName:  "Alice",
    actorEmail: "alice@company.com",
    createdAt:  new Date("2025-05-01T10:00:00Z"),
    ...overrides,
  };
}

describe("ActivityFeed", () => {
  it("renders the emptyMessage when items array is empty", () => {
    render(<ActivityFeed items={[]} />);
    expect(screen.getByText("No activity yet.")).toBeInTheDocument();
  });

  it("renders a custom emptyMessage", () => {
    render(<ActivityFeed items={[]} emptyMessage="Nothing here." />);
    expect(screen.getByText("Nothing here.")).toBeInTheDocument();
  });

  it("renders the actor name for each item", () => {
    render(<ActivityFeed items={[makeItem()]} />);
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  it("falls back to actorEmail when actorName is null", () => {
    render(<ActivityFeed items={[makeItem({ actorName: null, actorEmail: "bob@co.com" })]} />);
    expect(screen.getByText(/bob@co\.com/)).toBeInTheDocument();
  });

  it("falls back to 'System' when both actorName and actorEmail are null", () => {
    render(<ActivityFeed items={[makeItem({ actorName: null, actorEmail: null })]} />);
    expect(screen.getByText(/System/)).toBeInTheDocument();
  });

  it("renders the correct label for vendor.created", () => {
    render(<ActivityFeed items={[makeItem({ action: "vendor.created", metadata: { name: "Razorpay" } })]} />);
    expect(screen.getByText(/Added vendor "Razorpay"/)).toBeInTheDocument();
  });

  it("renders the correct label for document.uploaded", () => {
    render(<ActivityFeed items={[makeItem({ action: "document.uploaded", metadata: { documentType: "ISO 27001" } })]} />);
    expect(screen.getByText(/Uploaded ISO 27001/)).toBeInTheDocument();
  });

  it("renders the correct label for team.member_invited", () => {
    render(<ActivityFeed items={[makeItem({ action: "team.member_invited", metadata: { email: "new@co.com", role: "member" } })]} />);
    expect(screen.getByText(/Invited new@co\.com/)).toBeInTheDocument();
  });

  it("renders a fallback label for unknown action", () => {
    render(<ActivityFeed items={[makeItem({ action: "some.unknown.action" })]} />);
    expect(screen.getByText(/Action logged/i)).toBeInTheDocument();
  });

  it("renders multiple items", () => {
    const items = [
      makeItem({ id: "1", action: "vendor.created", metadata: { name: "Acme" } }),
      makeItem({ id: "2", action: "vendor.deleted", metadata: { name: "OldVendor" }, actorName: "Bob" }),
    ];
    render(<ActivityFeed items={items} />);
    expect(screen.getByText(/Added vendor "Acme"/)).toBeInTheDocument();
    expect(screen.getByText(/Deleted vendor "OldVendor"/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
  });

  it("renders a vertical connector line between items (not after last)", () => {
    const { container } = render(
      <ActivityFeed items={[makeItem({ id: "1" }), makeItem({ id: "2" })]} />
    );
    // The connector div has specific styling — there should be one fewer than items
    // (last item has no connector). We check via CSS classes.
    const connectors = container.querySelectorAll(".absolute.left-\\[17px\\]");
    expect(connectors).toHaveLength(1); // 2 items → 1 connector
  });
});
