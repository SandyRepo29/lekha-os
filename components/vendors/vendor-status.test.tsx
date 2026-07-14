// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/backend/src/modules/vendor-hub/vendors-actions", () => ({
  updateVendorStatus: vi.fn().mockResolvedValue({ ok: true }),
}));

import { VendorStatus } from "./vendor-status";
import { updateVendorStatus } from "@/backend/src/modules/vendor-hub/vendors-actions";

const mockUpdate = vi.mocked(updateVendorStatus);

beforeEach(() => vi.clearAllMocks());

describe("VendorStatus", () => {
  it("renders the current status label", () => {
    render(<VendorStatus vendorId="v1" current="active" />);
    expect(screen.getByRole("button", { name: /active/i })).toBeInTheDocument();
  });

  it("shows 'Pending' label for pending status", () => {
    render(<VendorStatus vendorId="v1" current="pending" />);
    expect(screen.getByRole("button", { name: /pending/i })).toBeInTheDocument();
  });

  it("shows 'Inactive' label for inactive status", () => {
    render(<VendorStatus vendorId="v1" current="inactive" />);
    expect(screen.getByRole("button", { name: /inactive/i })).toBeInTheDocument();
  });

  it("dropdown is not visible initially", () => {
    render(<VendorStatus vendorId="v1" current="active" />);
    expect(screen.queryByText("Pending")).not.toBeInTheDocument();
    expect(screen.queryByText("Inactive")).not.toBeInTheDocument();
  });

  it("opens the dropdown on click", async () => {
    const user = userEvent.setup();
    render(<VendorStatus vendorId="v1" current="active" />);
    await user.click(screen.getByRole("button", { name: /active/i }));
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("calls updateVendorStatus with the selected value", async () => {
    const user = userEvent.setup();
    render(<VendorStatus vendorId="v1" current="active" />);
    await user.click(screen.getByRole("button", { name: /active/i }));
    await user.click(screen.getByText("Inactive"));
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith("v1", "inactive");
    });
  });

  it("does NOT call updateVendorStatus when clicking the same status", async () => {
    const user = userEvent.setup();
    render(<VendorStatus vendorId="v1" current="active" />);
    await user.click(screen.getByRole("button", { name: /active/i }));
    // Dropdown has both trigger and option labelled "Active" — click the dropdown option
    const allActive = screen.getAllByText("Active");
    await user.click(allActive[allActive.length - 1]); // last one = dropdown option
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("closes the dropdown after selecting a status", async () => {
    const user = userEvent.setup();
    render(<VendorStatus vendorId="v1" current="active" />);
    await user.click(screen.getByRole("button", { name: /active/i }));
    await user.click(screen.getByText("Inactive"));
    await waitFor(() => {
      expect(screen.queryByText("Pending")).not.toBeInTheDocument();
    });
  });
});
