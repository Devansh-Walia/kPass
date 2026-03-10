import { z } from "zod";

export const createWorkshopSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string().transform((s) => new Date(s)),
  instructor: z.string().min(1),
  materialsNeeded: z.string().optional(),
  maxParticipants: z.number().int().positive().optional(),
});

export const updateWorkshopSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  date: z.string().transform((s) => new Date(s)).optional(),
  instructor: z.string().min(1).optional(),
  materialsNeeded: z.string().optional(),
  maxParticipants: z.number().int().positive().optional(),
});

export const addParticipantSchema = z.object({
  studentName: z.string().min(1),
  studentId: z.string().uuid().optional(),
});
