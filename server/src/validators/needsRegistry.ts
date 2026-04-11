import { z } from "zod";
import { optionalUuid, emptyToUndefined } from "./helpers.js";

export const createNeedSchema = z.object({
  childName: z.string().min(1),
  category: z.enum(["SANITATION", "HEALTH", "SUPPLIES", "OTHER"]),
  description: z.string().min(1),
});

export const updateNeedSchema = z.object({
  childName: z.string().min(1).optional().or(emptyToUndefined),
  category: z.enum(["SANITATION", "HEALTH", "SUPPLIES", "OTHER"]).optional(),
  description: z.string().min(1).optional().or(emptyToUndefined),
});

export const updateNeedStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "FULFILLED", "REJECTED"]),
  approvedById: optionalUuid,
});
