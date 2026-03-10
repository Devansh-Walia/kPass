import { z } from "zod";

export const createStudentSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
  guardianName: z.string().min(1),
  guardianPhone: z.string().optional(),
  batch: z.string().min(1),
});

export const updateStudentSchema = z.object({
  name: z.string().min(1).optional(),
  age: z.number().int().positive().optional(),
  guardianName: z.string().min(1).optional(),
  guardianPhone: z.string().optional(),
  batch: z.string().min(1).optional(),
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
