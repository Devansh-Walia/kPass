import { z } from "zod";
import { optionalString, emptyToUndefined } from "./helpers.js";

export const createEventSchema = z.object({
  title: z.string().min(1),
  description: optionalString,
  date: z.string().transform(s => new Date(s)),
  location: optionalString,
  budget: z.number().min(0).optional(),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).optional().or(emptyToUndefined),
  description: optionalString,
  date: z.string().transform(s => new Date(s)).optional(),
  location: optionalString,
  budget: z.number().min(0).optional(),
  status: z.enum(["PLANNING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
});

export const addVolunteerSchema = z.object({
  userId: z.string().uuid(),
  role: optionalString,
});
