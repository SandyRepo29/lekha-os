import { z } from "zod";

export const CreateVendorSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional().or(z.literal("")),
  country: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
  status: z.enum(["active", "inactive", "pending", "under_review"]).optional(),
});

export const UpdateVendorSchema = CreateVendorSchema.partial();

export type CreateVendorInput = z.infer<typeof CreateVendorSchema>;
export type UpdateVendorInput = z.infer<typeof UpdateVendorSchema>;
