import { z } from "zod";
import { optionalString, optionalUuid, emptyToUndefined } from "./helpers.js";

export const createWorkshopSchema = z.object({
  title: z.string().min(1),
  description: optionalString,
  date: z.string().transform((s) => new Date(s)),
  instructor: z.string().min(1),
  materialsNeeded: optionalString,
  maxParticipants: z.number().int().positive().optional(),
});

export const updateWorkshopSchema = z.object({
  title: z.string().min(1).optional().or(emptyToUndefined),
  description: optionalString,
  date: z.string().transform((s) => new Date(s)).optional(),
  instructor: z.string().min(1).optional().or(emptyToUndefined),
  materialsNeeded: optionalString,
  maxParticipants: z.number().int().positive().optional(),
});

export const addParticipantSchema = z.object({
  studentName: z.string().min(1),
  studentId: optionalUuid,
});
