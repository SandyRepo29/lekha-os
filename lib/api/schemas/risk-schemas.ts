import { z } from "zod";

export const CreateRiskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  category: z.enum([
    "operational",
    "cyber_security",
    "compliance",
    "vendor",
    "privacy",
    "financial",
    "legal",
    "strategic",
    "technology",
    "business_continuity",
    "third_party",
    "regulatory",
    "custom",
  ]),
  status: z
    .enum([
      "identified",
      "under_assessment",
      "open",
      "mitigating",
      "accepted",
      "transferred",
      "closed",
      "archived",
    ])
    .default("identified"),
  impact: z.number().int().min(1).max(5),
  likelihood: z.number().int().min(1).max(5),
  treatment_strategy: z
    .enum(["mitigate", "accept", "transfer", "avoid", "monitor"])
    .optional(),
  owner_id: z.string().uuid().optional(),
  target_date: z.string().datetime().optional(),
  source: z
    .enum([
      "manual",
      "vendor",
      "audit_finding",
      "compliance_gap",
      "control_failure",
      "policy_exception",
      "ai_generated",
      "api",
    ])
    .optional(),
});

export const UpdateRiskSchema = CreateRiskSchema.partial();

export type CreateRiskInput = z.infer<typeof CreateRiskSchema>;
export type UpdateRiskInput = z.infer<typeof UpdateRiskSchema>;
