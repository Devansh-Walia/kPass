import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string().transform(s => new Date(s)),
  location: z.string().optional(),
  budget: z.number().min(0).optional(),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  date: z.string().transform(s => new Date(s)).optional(),
  location: z.string().optional(),
  budget: z.number().min(0).optional(),
  status: z.enum(["PLANNING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
});

export const addVolunteerSchema = z.object({
  userId: z.string().uuid(),
  role: z.string().optional(),
});
