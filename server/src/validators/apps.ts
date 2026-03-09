import { z } from "zod";

export const createAppSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  type: z.enum(["FINANCE", "CRM", "MARKETING", "IDEATION", "CUSTOM"]),
  route: z.string().min(1),
});

export const updateAppSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().optional(),
});
