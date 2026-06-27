import { z } from "zod";

export const CreateAuditSchema = z.object({
  name: z.string().min(1).max(255),
  auditType: z.enum(["internal", "external", "regulatory", "vendor", "security", "compliance"]),
  scope: z.string().max(2000).optional(),
  objective: z.string().max(2000).optional(),
  auditorName: z.string().max(255).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  frameworkId: z.string().uuid().optional(),
});

export const CreateFindingSchema = z.object({
  auditId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  findingSeverity: z
    .enum(["critical", "high", "medium", "low"])
    .default("medium"),
  findingStatus: z
    .enum(["open", "remediating", "closed", "accepted"])
    .default("open"),
  controlId: z.string().uuid().optional(),
  recommendation: z.string().max(2000).optional(),
});

export const CreateCapaSchema = z.object({
  findingId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  ownerId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
});

export type CreateAuditInput = z.infer<typeof CreateAuditSchema>;
export type CreateFindingInput = z.infer<typeof CreateFindingSchema>;
export type CreateCapaInput = z.infer<typeof CreateCapaSchema>;
