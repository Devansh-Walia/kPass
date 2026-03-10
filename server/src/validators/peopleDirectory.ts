import { z } from "zod";

export const createEmployeeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  department: z.string().min(1),
  designation: z.string().min(1),
  joinDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  department: z.string().min(1).optional(),
  designation: z.string().min(1).optional(),
  joinDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  isActive: z.boolean().optional(),
});
