import type { Vendor } from "@/lib/db/schema";

/** Creates a minimal valid Vendor object for tests. Override any field via the second argument. */
export function makeVendor(overrides: Partial<Vendor> = {}): Vendor {
  return {
    id:               "vendor-test-id",
    organizationId:   "org-test-id",
    name:             "Test Vendor Ltd",
    category:         "SaaS / Software",
    contactEmail:     "sec@testvendor.com",
    status:           "active",
    riskLevel:        "medium",
    complianceScore:  60,
    notes:            null,
    aiSummary:        null,
    aiSummaryAt:      null,
    ownerName:        "Test Owner",
    ownerEmail:       "owner@company.com",
    ownerDepartment:  "IT",
    vendorTypeId:     null,
    checklistScore:   0,
    createdBy:        "user-test-id",
    createdAt:        new Date("2025-01-01T00:00:00Z"),
    updatedAt:        new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  } as Vendor;
}
