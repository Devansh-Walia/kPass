import { z } from "zod";
import { optionalString, emptyToUndefined } from "./helpers.js";

export const studentLocationEnum = z.enum(["DIT", "MALSI"]);

export const createStudentSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
  guardianName: z.string().min(1),
  guardianPhone: optionalString,
  batch: z.string().min(1),
  location: studentLocationEnum.optional(),
});

export const updateStudentSchema = z.object({
  name: z.string().min(1).optional().or(emptyToUndefined),
  age: z.number().int().positive().optional(),
  guardianName: z.string().min(1).optional().or(emptyToUndefined),
  guardianPhone: optionalString,
  batch: z.string().min(1).optional().or(emptyToUndefined),
  location: studentLocationEnum.optional().nullable(),
  isActive: z.boolean().optional(),
});

export const markAttendanceSchema = z.object({
  date: z.string().transform((s) => new Date(s)),
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      status: z.enum(["PRESENT", "ABSENT", "LATE"]),
    })
  ),
});
