import { z } from "zod";

export const createNeedSchema = z.object({
  childName: z.string().min(1),
  category: z.enum(["SANITATION", "HEALTH", "SUPPLIES", "OTHER"]),
  description: z.string().min(1),
});

export const updateNeedStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "FULFILLED", "REJECTED"]),
  approvedById: z.string().uuid().optional(),
});
