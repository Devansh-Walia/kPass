import { z } from "zod";

export const markStaffAttendanceSchema = z.object({
  date: z.string().transform((s) => new Date(s)),
  records: z.array(
    z.object({
      employeeId: z.string().uuid(),
      status: z.enum(["PRESENT", "ABSENT", "LEAVE"]),
      checkIn: z.string().transform((s) => new Date(s)).optional(),
      checkOut: z.string().transform((s) => new Date(s)).optional(),
    })
  ),
});

export const createLeaveSchema = z.object({
  employeeId: z.string().uuid(),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)),
  reason: z.string().min(1),
});

export const updateLeaveStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});
