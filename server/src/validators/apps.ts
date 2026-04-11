import { z } from "zod";
import { optionalString, emptyToUndefined } from "./helpers.js";

export const createAppSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: optionalString,
  icon: optionalString,
  type: z.enum(["FINANCE", "CRM", "MARKETING", "IDEATION", "CUSTOM"]),
  route: z.string().min(1),
});

export const updateAppSchema = z.object({
  name: z.string().min(1).optional().or(emptyToUndefined),
  description: optionalString,
  icon: optionalString,
  isActive: z.boolean().optional(),
});
